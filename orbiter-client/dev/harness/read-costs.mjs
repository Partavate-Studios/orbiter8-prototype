// What each batch read costs, modeled for Polkadot Hub TestNet from a local chain's traces
// (docs/polkadot-direction.md, "Testnet: a fixed budget per read"). The testnet gives each eth_call
// about 39,000 of its gas units whatever gas is sent, and 1 MiB of memory a call frame. From probes
// there: a call starts at about 1,116 units, each storage read costs 92 (warm or cold), each call frame
// about 140, and other work about one unit per 120 EVM gas. This counts those in anvil's struct-log
// trace (`npm run local` running) and adds them up; it lands within about 6% of the testnet's own
// estimates. It also reports each read's peak memory in any one call frame.
//
// usage (from orbiter-client/): node dev/harness/read-costs.mjs [cell...]
//   LOCAL_FILE=-8547 picks dev/local-deployment-8547.json; RPC defaults to that file's.
import { readFileSync } from 'node:fs'
import { Interface } from 'ethers'
import { disc } from '../../../sdk/src/hex.js'

const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'))
const deployment = read(`../local-deployment${process.env.LOCAL_FILE ?? ''}.json`)
const rpc = process.env.RPC ?? deployment.rpc
const c = deployment.contracts
const abi = (n) => new Interface(read(`../../../sdk/src/abi/${n}.json`))
const [G, P, M] = [abi('Galaxy'), abi('Planets'), abi('Market')]

/** Testnet units, from a trace's counts. */
export const model = ({ gas, sload, calls }) =>
  Math.round(1116 + 92 * sload + 140 * calls + Math.max(0, gas - 2100 * sload - 2600 * calls) / 120)

async function rpcCall(method, params) {
  const res = await fetch(rpc, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) })
  const j = await res.json()
  if (j.error) throw new Error(JSON.stringify(j.error))
  return j.result
}

/** Storage reads, call frames, EVM gas, and the largest memory any one frame touched. */
async function trace(to, data) {
  const t = await rpcCall('debug_traceCall', [{ to, data, gas: '0x3b9aca00' }, 'latest', { enableMemory: false, disableStorage: true }])
  let sload = 0
  let calls = 0
  const frames = []
  const done = []
  let depth = 0
  const touch = (off, size) => {
    if (BigInt(size) === 0n) return
    frames[frames.length - 1] = Math.max(frames[frames.length - 1], Number(((BigInt(off) + BigInt(size) + 31n) / 32n) * 32n))
  }
  for (const l of t.structLogs) {
    while (l.depth > depth) (frames.push(0), depth++)
    while (l.depth < depth) (done.push(frames.pop()), depth--)
    const s = l.stack ?? []
    const a = (i) => s[s.length - 1 - i]
    switch (l.op) {
      case 'SLOAD': sload++; break
      case 'MLOAD': case 'MSTORE': touch(a(0), 32); break
      case 'MSTORE8': touch(a(0), 1); break
      case 'KECCAK256': case 'RETURN': case 'REVERT': case 'LOG0': case 'LOG1': case 'LOG2': case 'LOG3': case 'LOG4': touch(a(0), a(1)); break
      case 'CALLDATACOPY': case 'CODECOPY': case 'RETURNDATACOPY': case 'MCOPY': touch(a(0), a(2)); break
      case 'CALL': case 'CALLCODE': calls++; touch(a(3), a(4)); touch(a(5), a(6)); break
      case 'STATICCALL': case 'DELEGATECALL': calls++; touch(a(2), a(3)); touch(a(4), a(5)); break
    }
  }
  while (frames.length) done.push(frames.pop())
  return { gas: t.gas, sload, calls, peakMem: Math.max(0, ...done) }
}

async function measure(to, iface, fn, args) {
  const data = iface.encodeFunctionData(fn, args)
  const counts = await trace(to, data)
  const result = iface.decodeFunctionResult(fn, await rpcCall('eth_call', [{ to, data }, 'latest']))
  return { ...counts, units: model(counts), result }
}

const row = (name, r) =>
  console.log(`${name.padEnd(30)} ${String(r.units).padStart(6)} units  ${String(r.sload).padStart(4)} reads  ${String(r.calls).padStart(3)} calls  ${String(r.gas).padStart(8)} EVM gas  ${String(r.peakMem).padStart(6)} B peak frame`)

for (const cell of (process.argv.slice(2).length ? process.argv.slice(2) : ['0']).map(Number)) {
  console.log(`— star ${cell}`)
  row(`system(${cell}, 8)`, await measure(c.planets, P, 'system', [cell, 8]))
  // the belt: its asteroids by id (the SDK derives which sections hold one; here, whichever have a view)
  const sections = []
  for (let i = 0; i < 8; i++) {
    const id = cell * 65536 + 256 + i
    if (await measure(c.planets, P, 'planetView', [id, 0]).then(() => true, () => false)) sections.push(id)
  }
  if (sections.length) row(`views(${sections.length} asteroids, 8)`, await measure(c.planets, P, 'views', [sections, 8]))
  const sys = await measure(c.planets, P, 'system', [cell, 0])
  for (const id of [sys.result[0][0]?.id, sections[0]].filter((x) => x != null)) {
    const v = { id }
    row(`planetView(${v.id}, 8)`, await measure(c.planets, P, 'planetView', [v.id, 8]))
    row(`portView(${v.id})`, await measure(c.market, M, 'portView', [v.id]).catch(() => ({ units: '-', sload: '-', calls: '-', gas: '-', peakMem: '-' })))
  }
  const ids = await measure(c.market, M, 'portIds', [cell])
  const ports = [...ids.result[0]]
  row(`portIds(${cell}): ${ports.length}`, ids)
  for (let i = 0; i < ports.length; i += 5) row(`portViews(${ports.slice(i, i + 5).length})`, await measure(c.market, M, 'portViews', [ports.slice(i, i + 5)]))
  if (ports.length > 5) row(`portViews(all ${ports.length})`, await measure(c.market, M, 'portViews', [ports]))
  const region = disc(cell, 10).sort((a, b) => a - b)
  const states = await measure(c.galaxy, G, 'statesOf', [region])
  row(`statesOf(${region.length})`, states)
  const decided = region.filter((_, i) => parseInt(states.result[0].slice(2 + 2 * i, 4 + 2 * i), 16) !== 0)
  row(`cellsOf(${Math.min(30, decided.length)} of ${decided.length})`, await measure(c.galaxy, G, 'cellsOf', [decided.slice(0, 30)]))
  for (const r of [6, 10]) row(`region(${cell}, ${r})`, await measure(c.galaxy, G, 'region', [cell, r]))
}
