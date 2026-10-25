// Many read-only calls at once. Where the network has Multicall3 (deployed at the same address on
// most public chains), they go out as a few aggregate3 requests; elsewhere (e.g. the local chain),
// as plain calls a handful at a time.
import { Contract } from 'ethers'
import { toPlain } from './convert'
import { getSession } from './wallet'

const MULTICALL3 = '0xcA11bde05977b3631167028862bE2a173976CA11'
const MULTICALL3_ABI = [
  'function aggregate3((address target, bool allowFailure, bytes callData)[] calls) view returns ((bool success, bytes returnData)[] returnData)'
]
// Calls per aggregate3 request; RPCs cap the gas and response size of one eth_call.
const MULTICALL_BATCH = 300
// Plain calls in flight at once, to stay under public RPCs' rate limits.
const PLAIN_CONCURRENCY = 8

/** chainId → whether Multicall3 is deployed there */
const multicallByChain = new Map()

/**
 * @typedef {{ contract: Contract, method: string, args?: unknown[] }} ReadCall
 */

/**
 * Runs view calls and returns their results in order, as plain values (a single return value is
 * unwrapped). A call that reverts gives null instead of failing the batch.
 * @param {ReadCall[]} calls
 * @returns {Promise<unknown[]>}
 */
export async function readMany(calls) {
  if (calls.length === 0) return []
  const { provider, chainId } = getSession()
  if (!multicallByChain.has(chainId)) {
    multicallByChain.set(chainId, (await provider.getCode(MULTICALL3)) !== '0x')
  }
  return multicallByChain.get(chainId) ? viaMulticall(provider, calls) : viaPlainCalls(calls)
}

/** A read-only contract on the connected network (no signer: msg.sender doesn't matter for these reads). */
export function readOnlyContract(address, abi) {
  return new Contract(address, abi, getSession().provider)
}

function unwrap(result) {
  const plain = toPlain(result)
  return Array.isArray(plain) && plain.length === 1 ? plain[0] : plain
}

async function viaMulticall(provider, calls) {
  const multicall = new Contract(MULTICALL3, MULTICALL3_ABI, provider)
  const results = []
  for (let start = 0; start < calls.length; start += MULTICALL_BATCH) {
    const batch = calls.slice(start, start + MULTICALL_BATCH)
    const replies = await multicall.aggregate3.staticCall(
      batch.map(({ contract, method, args = [] }) => ({
        target: contract.target,
        allowFailure: true,
        callData: contract.interface.encodeFunctionData(method, args)
      }))
    )
    replies.forEach(([success, data], index) => {
      const { contract, method } = batch[index]
      results.push(success ? unwrap(contract.interface.decodeFunctionResult(method, data)) : null)
    })
  }
  return results
}

async function viaPlainCalls(calls) {
  const results = new Array(calls.length)
  let next = 0
  const worker = async () => {
    while (next < calls.length) {
      const index = next++
      const { contract, method, args = [] } = calls[index]
      try {
        results[index] = unwrap(await contract[method](...args))
      } catch {
        results[index] = null
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(PLAIN_CONCURRENCY, calls.length) }, worker))
  return results
}
