// Demo 4's exploring bot (docs/demo4-plan.md, milestone 1): a pilot on the local chain that flies
// outward from Sol, carrying pending scan proofs along with its moves as the client does, and logs
// each move's gas. Needs `npm run local` running.
//
//   node dev/harness/explore-bot.mjs [moves=20] [account=5] [out.json]
//
// It prefers unvisited stars farther from Sol, goes through black holes it lands on, and waits for
// its own scan when every neighbor is still uncharted.
// Settings from the environment, to run several as neighbors while you play (dev/harness/crowd.sh):
//   LOCAL_FILE=-8546  the chain started with CHAIN_PORT=8546 (dev/local-deployment-8546.json)
//   TESTNET=1         play Polkadot Hub TestNet instead, with a funded throwaway key (bot-chain.mjs)
//   PACE_MS=10000     wait about this long between moves (randomized ±50%), so a person can watch
//   NAME=Rook SHIP=Kestrel   its call sign and ship's name when it registers
//   WANDER=1          stay near Sol (within two jumps) instead of exploring outward, to be seen
import { Contract } from 'ethers'
import { deployment, signerFor } from './bot-chain.mjs'
import { readFileSync, writeFileSync } from 'node:fs'
import { distance } from '../../../sdk/src/hex.js'
import { fetchRound, timeOf } from '../../../sdk/src/drand.js'

const [moves = 20, account = 5, out] = process.argv.slice(2)
const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'))
const PACE_MS = Number(process.env.PACE_MS ?? 0)
/** Between moves: about PACE_MS (±50%), so a pilot moves at a watchable pace. */
const pause = () => (PACE_MS ? new Promise((r) => setTimeout(r, PACE_MS * (0.5 + Math.random()))) : null)
const signer = await signerFor(account)
const galaxy = new Contract(deployment.contracts.galaxy, read('../../../sdk/src/abi/Galaxy.json'), signer)
const pilots = new Contract(deployment.contracts.pilots, read('../../../sdk/src/abi/Pilots.json'), signer)
// Radius 6: what the bot needs (its neighbors and pending scans), and under Polkadot Hub TestNet's
// per-call memory limit, which refuses radius 10 once the galaxy fills in.
const REGION = 6
const STAR = 2
const HOLE = 3
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const log = []
async function record(action, tx, extra = {}) {
  const receipt = await tx.wait()
  const entry = { action, gas: Number(receipt.gasUsed), ...extra }
  log.push(entry)
  console.log(JSON.stringify(entry))
  return receipt
}

/** Pending scans in the region with published rounds, oldest first, at most three. */
async function proofs(cells) {
  const pending = cells.filter((c) => c.visited && !c.scanned).sort((a, b) => Number(a.scanRound - b.scanRound))
  const out = []
  for (const c of pending) {
    if (out.length >= 3) break
    const signature = await fetchRound(Number(c.scanRound))
    if (signature) out.push({ cell: c.cell, signature })
  }
  return out
}

const me = await signer.getAddress()
if (!(await pilots.pilotOf(me)).registered) {
  await record('register', await pilots.register(process.env.NAME ?? `Bot${account}`, process.env.SHIP ?? 'Surveyor'))
}

for (let i = 0; i < Number(moves); i++) {
  await pause()
  const pilot = await pilots.pilotOf(me)
  const here = Number(pilot.ship.cell)
  const range = Number(pilot.ship.range)
  const cells = [...(await galaxy.region(here, REGION))]
  const proof = await proofs(cells)
  const byCell = new Map(cells.map((c) => [Number(c.cell), c]))

  if (Number(byCell.get(here)?.state) === HOLE && Math.random() < 0.7) {
    await record('traverse', await pilots.traverse(proof), { from: here, proofs: proof.length })
    continue
  }
  const options = cells
    .filter((c) => [STAR, HOLE].includes(Number(c.state)))
    .map((c) => Number(c.cell))
    .filter((c) => c !== here && distance(here, c) <= range)
  if (options.length === 0) {
    // Our own scan hasn't come in yet: wait for its round, then write it.
    const mine = byCell.get(here)
    const wait = timeOf(Number(mine.scanRound)) * 1000 - Date.now() + 1500
    if (wait > 0) await sleep(wait)
    const fresh = await proofs([...(await galaxy.region(here, REGION))])
    if (fresh.length) await record('resolveScans', await pilots.resolveScans(fresh), { proofs: fresh.length })
    i--
    continue
  }
  const score = process.env.WANDER
    ? (c) => Math.random() * 10 - Math.max(0, distance(0, c) - 2) * 50
    : (c) => (byCell.get(c).visited ? 0 : 100) + distance(0, c) + Math.random() * 3
  const to = options.sort((a, b) => score(b) - score(a))[0]
  const firstVisit = !byCell.get(to).visited
  await record('jump', await pilots.jump(to, proof), { from: here, to, firstVisit, proofs: proof.length })
  await sleep(4000)
}

const final = await pilots.pilotOf(me)
const jumps = log.filter((e) => e.action === 'jump')
const summary = {
  moves: log.length,
  reachedRing: distance(0, Number(final.ship.cell)),
  averageGas: Object.fromEntries(
    [
      ['first visit, no proofs', (e) => e.firstVisit && e.proofs === 0],
      ['first visit, 1 proof', (e) => e.firstVisit && e.proofs === 1],
      ['first visit, 2+ proofs', (e) => e.firstVisit && e.proofs >= 2],
      ['revisit, no proofs', (e) => !e.firstVisit && e.proofs === 0],
      ['revisit, 1+ proofs', (e) => !e.firstVisit && e.proofs >= 1]
    ]
      .map(([label, test]) => [label, jumps.filter(test)])
      .filter(([, list]) => list.length)
      .map(([label, list]) => [
        label,
        { count: list.length, gas: Math.round(list.reduce((s, e) => s + e.gas, 0) / list.length) }
      ])
  )
}
console.log(JSON.stringify(summary, null, 2))
if (out) writeFileSync(out, JSON.stringify({ summary, log }, null, 2) + '\n')
