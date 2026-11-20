// Milestone 7 spike: plays real game moves on Polkadot Hub TestNet the way a Product inside the
// Polkadot App would, with no eth-rpc wallet and no MetaMask:
//
//   A. The product account (an sr25519 key; in the App, getProductAccountSigner()) registers a pilot
//      and starts a D41 session, through ethers 6 + eip1193-adapter.js: Revive.call extrinsics sent
//      over a Substrate client (in the App, the host's; here a public WebSocket node).
//   B. The session key (our existing secp256k1 browser key) sends a move as an Ethereum-signed
//      transaction, submitted as Revive.eth_transact over the same Substrate client: the D41
//      fallback when AutoSigning isn't available, needing no eth-rpc URL.
//
// Throwaway keys only, kept outside the repo in ~/.config/orbiter8/ (never committed). The product
// stand-in is funded from the spike key with a local XCM transfer through the XCM precompile.
//
//   node run-testnet.mjs
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createClient } from 'polkadot-api'
import { getWsProvider } from 'polkadot-api/ws'
import { compact } from '@polkadot-api/substrate-bindings'
import { seedToAccount } from '@parity/product-sdk-keys'
import { generateMnemonic } from '@polkadot-labs/hdkd-helpers'
import { BrowserProvider, Contract, JsonRpcProvider, Wallet, concat, formatEther, getBytes, hexlify, keccak256, parseEther } from 'ethers'
import { createProductAccountProvider } from './eip1193-adapter.js'
import { h160Of } from './h160.mjs'

const WS = process.env.WS ?? 'wss://asset-hub-paseo-rpc.n.dwellir.com'
const ETH_RPC = 'https://eth-rpc-testnet.polkadot.io/'
const CHAIN_ID = 420420417
const here = path.dirname(new URL(import.meta.url).pathname)
const configDir = path.join(os.homedir(), '.config/orbiter8')
const abi = (name) => {
  const j = JSON.parse(fs.readFileSync(path.join(here, '../../../../sdk/src/abi', name + '.json'), 'utf8'))
  return j.abi ?? j
}
const networks = fs.readFileSync(path.join(here, '../../../../sdk/src/chain/networks.js'), 'utf8')
const PILOTS = networks.match(/pilots: '(0x[0-9a-fA-F]{40})'/g).map((m) => m.slice(9, 51)).pop()

function loadOrCreate(file, make) {
  const p = path.join(configDir, file)
  if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'))
  const value = make()
  fs.writeFileSync(p, JSON.stringify(value), { mode: 0o600 })
  return value
}
const spikeKey = (() => {
  let d = JSON.parse(fs.readFileSync(path.join(configDir, 'paseo-spike.json'), 'utf8')).data
  return (Array.isArray(d) ? d[0] : d).private_key
})()
const ms = (t0) => `${((Date.now() - t0) / 1000).toFixed(1)} s`

// ── the product account's stand-in, and the chain client the host would give us ──
const { mnemonic } = loadOrCreate('app-signer-spike.json', () => ({ mnemonic: generateMnemonic() }))
const product = seedToAccount(mnemonic, '//0')
console.log('product account', product.ss58Address, 'H160', product.h160Address, '(ours:', h160Of(product.ss58Address) + ')')
const client = createClient(getWsProvider(WS))
const api = client.getUnsafeApi()
const eth = new JsonRpcProvider(ETH_RPC, CHAIN_ID, { staticNetwork: true })
const spike = new Wallet(spikeKey, eth)

async function nativeBalance(ss58) {
  return (await api.query.System.Account.getValue(ss58, { at: 'best' })).data.free
}

/** Local XCM through the XCM precompile: moves `amount` (native units) from the spike key's account to `id`. */
async function fundViaXcm(accountId32, amount) {
  const xcm = new Contract(
    '0x00000000000000000000000000000000000a0000',
    [
      'function execute(bytes message, (uint64 refTime, uint64 proofSize) weight)',
      'function weighMessage(bytes message) view returns ((uint64 refTime, uint64 proofSize))'
    ],
    spike
  )
  const pas = '0x0100' // Location { parents: 1, interior: Here }: the relay chain's token, PAS
  const message = concat([
    '0x05', // VersionedXcm::V5
    '0x08', // two instructions
    '0x00', '0x04', pas, '0x00', compact.enc(amount), // WithdrawAsset([{ PAS, Fungible(amount) }])
    '0x0d', '0x01', '0x01', pas, '0x00', // DepositAsset { Wild(AllOf { PAS, Fungible }),
    '0x00', '0x01', '0x01', '0x00', accountId32 // beneficiary: { parents: 0, X1(AccountId32 { None, id }) } }
  ])
  const weight = await xcm.weighMessage(message)
  console.log('XCM weight', weight.refTime, weight.proofSize)
  const tx = await xcm.execute(message, { refTime: weight.refTime, proofSize: weight.proofSize })
  await tx.wait()
}

let free = await nativeBalance(product.ss58Address)
if (free < 50_000_000_000n) {
  const t0 = Date.now()
  await fundViaXcm(hexlify(product.publicKey), 200_000_000_000n) // 20 PAS
  free = await nativeBalance(product.ss58Address)
  console.log('funded by XCM in', ms(t0))
}
console.log('product account balance', Number(free) / 1e10, 'PAS')

// ── A. ethers over the App-style signer ──
const adapter = createProductAccountProvider({
  client,
  signer: product.signer,
  address: product.ss58Address,
  h160: product.h160Address,
  chainId: CHAIN_ID,
  fallback: { request: ({ method, params }) => eth.send(method, params) }
})
const provider = new BrowserProvider(adapter, CHAIN_ID)
const signer = await provider.getSigner()
const pilots = new Contract(PILOTS, abi('Pilots'), signer)
console.log('signer address', await signer.getAddress(), 'Pilots', PILOTS)

let view = await pilots.pilotOf(signer.address)
if (!view.registered) {
  const t0 = Date.now()
  const tx = await pilots.register('AppSpike' + product.h160Address.slice(2, 6)) // then acceptJob(1, ship name) for a ship
  const receipt = await tx.wait()
  console.log('register: status', receipt.status, 'logs', receipt.logs.length, 'in', ms(t0), 'tx', tx.hash)
  view = await pilots.pilotOf(signer.address)
}
console.log('pilot registered:', view.registered, 'call sign', view.callsign ?? view[1])

{
  const t0 = Date.now()
  const tx = await pilots.broadcast('hello from the product account, via Revive.call')
  const receipt = await tx.wait()
  const log = receipt.logs.map((l) => pilots.interface.parseLog(l)).find((l) => l?.name === 'Broadcast')
  console.log('product-account move (broadcast): status', receipt.status, 'event pilot', log?.args.pilot, 'in', ms(t0), 'tx', tx.hash)
}

// A revert must come back as an ethers error (here: registering twice), before anything is signed.
try {
  await pilots.register.staticCall('Again', 'Again')
  console.log('UNEXPECTED: second register did not revert')
} catch (e) {
  console.log('second register reverts as expected:', e.code, e.revert?.name ?? e.shortMessage)
}

// ── B. the session key's move as Revive.eth_transact over the Substrate client ──
const { privateKey: sessionPk } = loadOrCreate('app-signer-session.json', () => ({ privateKey: Wallet.createRandom().privateKey }))
const session = new Wallet(sessionPk)
{
  const t0 = Date.now()
  const expiry = Math.floor(Date.now() / 1000) + 3600
  const tx = await pilots.startSession(session.address, expiry, { value: parseEther('2') })
  const receipt = await tx.wait()
  console.log('startSession (2 PAS gas money to the key): status', receipt.status, 'in', ms(t0))
}
console.log('session key', session.address, 'balance', formatEther(await eth.getBalance(session.address)), 'PAS')
{
  const t0 = Date.now()
  const iface = pilots.interface
  const data = iface.encodeFunctionData('broadcast', ['hello from a session key, via eth_transact over PAPI'])
  const [nonce, fees, gas] = await Promise.all([
    eth.getTransactionCount(session.address),
    eth.getFeeData(),
    eth.estimateGas({ from: session.address, to: PILOTS, data })
  ])
  // Reads above still use eth-rpc for brevity; ReviveApi.nonce / eth_estimate_gas serve them in the App.
  const raw = await session.signTransaction({
    type: 2, chainId: CHAIN_ID, nonce, to: PILOTS, data, gasLimit: (gas * 3n) / 2n,
    maxFeePerGas: fees.maxFeePerGas, maxPriorityFeePerGas: fees.maxPriorityFeePerGas ?? 0n
  })
  const bare = await api.tx.Revive.eth_transact({ payload: getBytes(raw) }).getBareTx()
  const done = await new Promise((resolve, reject) => {
    const sub = client.submitAndWatch(bare).subscribe({
      next: (ev) => { if (ev.type === 'inBestBlock') { sub.unsubscribe(); resolve(ev) } },
      error: reject
    })
  })
  const ethHash = keccak256(raw)
  let receipt = null
  for (let i = 0; i < 20 && !receipt; i++) {
    receipt = await eth.getTransactionReceipt(ethHash)
    if (!receipt) await new Promise((r) => setTimeout(r, 1500))
  }
  const sender = receipt ? pilots.interface.parseLog(receipt.logs[0])?.args?.pilot : null
  console.log('session move via eth_transact: in block', done.block?.number, 'ok', done.ok, 'eth receipt status', receipt?.status,
    'Broadcast pilot', sender, '(the pilot, not the key:', sender === signer.address, ')', 'in', ms(t0))
}

client.destroy()
process.exit(0)
