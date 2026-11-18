// Milestone 7 spike (docs/polkadot-direction.md, "AutoSigning and sponsored calls"): the Polkadot
// App's product-account signer, exposed as an EIP-1193 provider so ethers 6 (and the game's SDK,
// which takes an EIP-1193 provider in sdk/src/chain/wallet.js) can use it unchanged.
//
// What the App gives a Product is not an Ethereum wallet: its accounts are sr25519 (Substrate)
// keys, its signer is a PAPI "transaction creator" (getProductAccountSigner(), or SignerManager's
// account.getSigner()), and the chain is reached through the host (a PolkadotClient), never an RPC
// URL. So a contract call is a Substrate extrinsic, Revive.call(dest, value, weight, deposit, data),
// signed by the product account; the contract sees msg.sender = the account's H160
// (keccak256(publicKey)[12:], once the account is mapped with Revive.map_account).
//
// This adapter translates:
//   eth_chainId, eth_accounts, eth_requestAccounts   from what it was given
//   eth_call, eth_estimateGas                        ReviveApi.call dry runs (reads through the host)
//   eth_sendTransaction                              dry run, then Revive.call, signed and watched
//   eth_getTransactionByHash / eth_getTransactionReceipt  for its own sends, built from the
//                                                     extrinsic's block and Revive.ContractEmitted events
//   eth_blockNumber                                  the newest block it has seen
//   anything else                                    `fallback` (an EIP-1193 provider: eth-rpc), or 4200
//
// Not production code: no event subscriptions, no nonce queueing across tabs, no fee display.
import { submitAndWatch } from '@parity/product-sdk-tx'
import { getAddress, hexlify, getBytes, toBeHex, zeroPadValue } from 'ethers'

/** pallet-revive's ratio between the EVM view of value (18 decimals) and native units (10 on Paseo). */
const NATIVE_TO_ETH = 100_000_000n
const REVERT_FLAG = 1

class ProviderRpcError extends Error {
  constructor(code, message, data) {
    super(message)
    this.code = code
    if (data !== undefined) this.data = data
  }
}

const asBigInt = (v) => (v == null || v === '0x' ? 0n : BigInt(v))

/**
 * @param {object} options
 * @param {import('polkadot-api').PolkadotClient} options.client  the host's Asset Hub client
 * @param {object} options.signer   a PAPI transaction creator (the product account's signer)
 * @param {string} options.address  the product account, SS58
 * @param {string} options.h160     its H160 (SignerAccount.h160Address in the Product SDK)
 * @param {number} options.chainId  the EVM chain id (420420417 for Polkadot Hub TestNet)
 * @param {{ request: Function }} [options.fallback]  EIP-1193 provider for other reads
 * @param {'best-block' | 'finalized'} [options.waitFor]
 */
export function createProductAccountProvider({ client, signer, address, h160, chainId, fallback, waitFor = 'best-block' }) {
  const api = client.getUnsafeApi()
  const from = getAddress(h160)
  const sent = new Map() // our tx hash -> { tx, receipt }
  let latestBlock = 0
  let mapped = false

  async function dryRun({ to, data, value }) {
    // Dry runs from an unmapped account fail too (AccountNotMapped), so mapping comes first: in the
    // App that is one approval during onboarding, before the first move.
    await ensureMapped()
    const result = await api.apis.ReviveApi.call(
      address,
      to.toLowerCase(),
      asBigInt(value) / NATIVE_TO_ETH,
      undefined,
      undefined,
      getBytes(data ?? '0x'),
      { at: 'best' } // what a transaction sent now will see (finalized lags by several blocks)
    )
    const ok = result.result.success
    const out = ok ? result.result.value : null
    const reverted = !ok || (out.flags & REVERT_FLAG) !== 0
    return { result, reverted, returnData: out ? hexlify(out.data) : '0x' }
  }

  function revertError(run) {
    if (!run.result.result.success) {
      const why = JSON.stringify(run.result.result.value, (k, v) => (typeof v === 'bigint' ? v.toString() : v))
      return new ProviderRpcError(-32000, `dispatch error: ${why}`)
    }
    return new ProviderRpcError(3, 'execution reverted', run.returnData)
  }

  /** pallet-revive refuses calls from an account that hasn't linked its H160 (AccountNotMapped). */
  async function ensureMapped() {
    if (mapped) return
    const original = await api.query.Revive.OriginalAccount.getValue(from.toLowerCase(), { at: 'best' })
    if (original === undefined) {
      const res = await submitAndWatch(api.tx.Revive.map_account(), signer, { waitFor })
      if (!res.ok) throw new ProviderRpcError(-32000, `map_account failed: ${res.error.message}`)
    }
    mapped = true
  }

  async function sendTransaction(tx) {
    await ensureMapped()
    const to = getAddress(tx.to)
    const run = await dryRun({ to, data: tx.data ?? tx.input, value: tx.value })
    if (run.reverted) throw revertError(run)
    const weight = run.result.weight_required
    const deposit = run.result.max_storage_deposit
    const call = api.tx.Revive.call({
      dest: to.toLowerCase(),
      value: asBigInt(tx.value) / NATIVE_TO_ETH,
      // A little headroom: state can move between the dry run and inclusion.
      weight_limit: { ref_time: (weight.ref_time * 12n) / 10n, proof_size: (weight.proof_size * 12n) / 10n },
      storage_deposit_limit: deposit.type === 'Charge' ? (deposit.value * 12n) / 10n + 1n : 0n,
      data: getBytes(tx.data ?? tx.input ?? '0x')
    })
    const res = await submitAndWatch(call, signer, { waitFor })
    if (!res.ok) throw new ProviderRpcError(-32000, res.error.message)
    const { txHash, block, events = [], ok } = res.value
    latestBlock = Math.max(latestBlock, block.number)
    const hash = txHash
    const logs = []
    for (const event of events) {
      const e = event.type === 'Revive' ? event.value : event.event?.type === 'Revive' ? event.event.value : null
      if (e?.type !== 'ContractEmitted') continue
      logs.push({
        address: getAddress(e.value.contract),
        topics: e.value.topics.map((t) => (typeof t === 'string' ? t : hexlify(t))),
        data: hexlify(e.value.data),
        blockHash: block.hash,
        blockNumber: toBeHex(block.number),
        transactionHash: hash,
        transactionIndex: toBeHex(block.index),
        logIndex: toBeHex(logs.length),
        removed: false
      })
    }
    const common = {
      blockHash: block.hash,
      blockNumber: toBeHex(block.number),
      transactionIndex: toBeHex(block.index),
      from,
      to
    }
    sent.set(hash, {
      tx: {
        ...common,
        hash,
        input: tx.data ?? '0x',
        value: toBeHex(asBigInt(tx.value)),
        nonce: '0x0',
        gas: toBeHex(run.result.gas_consumed || 1n),
        gasPrice: '0x0',
        type: '0x0',
        chainId: toBeHex(chainId),
        // Not an Ethereum transaction: there is no secp256k1 signature to report.
        r: zeroPadValue('0x01', 32),
        s: zeroPadValue('0x01', 32),
        v: '0x1b'
      },
      receipt: {
        ...common,
        transactionHash: hash,
        contractAddress: null,
        gasUsed: toBeHex(run.result.gas_consumed || 0n),
        cumulativeGasUsed: toBeHex(run.result.gas_consumed || 0n),
        effectiveGasPrice: '0x0',
        logsBloom: '0x' + '00'.repeat(256),
        logs,
        status: ok ? '0x1' : '0x0',
        type: '0x0'
      }
    })
    return hash
  }

  async function forward(method, params) {
    if (!fallback) throw new ProviderRpcError(4200, `${method} is not supported without a fallback provider`)
    return fallback.request({ method, params })
  }

  return {
    isProductAccountProvider: true,
    async request({ method, params = [] }) {
      switch (method) {
        case 'eth_chainId':
          return toBeHex(chainId)
        case 'net_version':
          return String(chainId)
        case 'eth_accounts':
        case 'eth_requestAccounts':
          return [from]
        case 'eth_call': {
          const run = await dryRun(params[0])
          if (run.reverted) throw revertError(run)
          return run.returnData
        }
        case 'eth_estimateGas': {
          const run = await dryRun(params[0])
          if (run.reverted) throw revertError(run)
          return toBeHex(run.result.gas_consumed || 21_000n)
        }
        case 'eth_sendTransaction':
          return sendTransaction(params[0])
        case 'eth_getTransactionByHash':
          return sent.get(params[0])?.tx ?? forward(method, params)
        case 'eth_getTransactionReceipt':
          return sent.get(params[0])?.receipt ?? forward(method, params)
        case 'eth_blockNumber': {
          if (fallback) {
            const n = Number(await fallback.request({ method, params }))
            latestBlock = Math.max(latestBlock, n)
          }
          return toBeHex(latestBlock)
        }
        case 'eth_gasPrice':
          return '0x0' // fees are the extrinsic's, paid in PAS or (with an allowance) PGAS
        default:
          return forward(method, params)
      }
    },
    on() {},
    removeListener() {}
  }
}
