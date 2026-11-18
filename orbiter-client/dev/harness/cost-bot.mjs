// What each kind of move costs, measured (docs/cost-estimates.md): two pilots make a representative set
// of moves the trade and explore bots don't (an asteroid port's trades, its yard and armory, mining,
// a claim, colonists, deliveries, a building, a siege), each logged with its gas and what it cost its
// payer (balance before and after: fees and storage deposits). The deployment's admin pays the pilots
// credits first so they can afford it: a test deployment's shortcut (it grants itself the Credits
// contract's game role).
//
//   node dev/harness/cost-bot.mjs [accountA=21] [accountB=22] [out.json]
//   TESTNET=1 plays Polkadot Hub TestNet (bot-chain.mjs); LOCAL_FILE=-8547 another local chain;
//   MINE_MS=0 skips the wait for mining's first units (8 minutes).
import { Contract } from 'ethers'
import { readFileSync, writeFileSync } from 'node:fs'
import { deployment, signerFor, adminSigner, measured, provider } from './bot-chain.mjs'

const [accountA = 21, accountB = 22, out] = process.argv.slice(2)
const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'))
const abi = (n) => read(`../../../sdk/src/abi/${n}.json`)
const contracts = (signer) =>
  Object.fromEntries(
    ['pilots', 'market', 'armory', 'planets', 'claims', 'drones', 'battle', 'galaxy', 'credits'].map((n) => [
      n,
      new Contract(deployment.contracts[n], abi(n[0].toUpperCase() + n.slice(1)), signer)
    ])
  )
const MAX = 10n ** 15n
const EARTH = 2
const CERES = 256 // Sol's belt, section 0 (carbonaceous: sells water)
const PSYCHE = 256 + 5 // metallic: buys water; its armory
const DUST = 256 + 2 // an empty section
const [WATER, ORGANICS, EQUIPMENT, RAILGUN, MINING_DRONE] = [0, 4, 6, 3, 9]
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const log = []
async function record(who, payer, action, send, extra = {}) {
  const { gas, pas } = await measured(payer, send)
  const entry = { who, action, gas, pas, ...extra }
  log.push(entry)
  console.log(JSON.stringify(entry))
}

const admin = await adminSigner()
const adminC = contracts(admin)
const [a, b] = [await signerFor(Number(accountA)), await signerFor(Number(accountB))]
const [A, B] = [contracts(a), contracts(b)]
const [addrA, addrB] = [await a.getAddress(), await b.getAddress()]
const role = await adminC.credits.GAME_MODULE()
if (!(await adminC.credits.hasRole(role, await admin.getAddress()))) await (await adminC.credits.grantRole(role, await admin.getAddress())).wait()
for (const who of [addrA, addrB]) await (await adminC.credits.mint(who, 1_000_000)).wait()

// A: trades in Sol's belt, fits out at its yard and armory, mines, buys what a Citadel needs.
if (!(await A.pilots.pilotOf(addrA)).registered) await record('A', a, 'register', () => A.pilots.register(`Cost${accountA}`, 'Ledger'))
if (!(await B.pilots.pilotOf(addrB)).registered) await record('B', b, 'register', () => B.pilots.register(`Cost${accountB}`, 'Lance'))
await record('A', a, 'buy 100 cargo bays (Earth)', () => A.market.buyBays(EARTH, 100, MAX))
await record('A', a, 'buy a drone bay (Psyche Station)', () => A.market.buyDroneBays(PSYCHE, 1, MAX))
await record('A', a, 'buy a mining drone (Psyche armory)', () => A.armory.buy(PSYCHE, MINING_DRONE, 1, MAX))
await record('A', a, 'trade: buy 5 water ice (Ceres Station)', () => A.market.trade(CERES, [[WATER, 5, MAX]]))
await record('A', a, 'trade: sell 5 water ice (Psyche Station)', () => A.market.trade(PSYCHE, [[WATER, -5, 0]]))
await record('A', a, 'start mining (Sol\'s empty section)', () => A.drones.startMining(DUST, 0))
const startedAt = Date.now()
await record('A', a, 'trade: buy 40 equipment, 40 organics (Earth)', () => A.market.trade(EARTH, [[EQUIPMENT, 40, MAX], [ORGANICS, 40, MAX]]), { note: 'stops mining' })
await record('A', a, 'start mining again', () => A.drones.startMining(DUST, 0))
await record('A', a, 'recruit 100 colonists (Earth)', () => A.planets.recruit(100), { note: 'stops mining' })
// Mining needs a few minutes for its first unit (five drones make about 9 an hour).
await record('A', a, 'start mining, third time', () => A.drones.startMining(DUST, 0))

// B: arms at Earth's armory.
await record('B', b, 'buy a railgun (Earth armory)', () => B.armory.buy(EARTH, RAILGUN, 1, MAX))

// The star next to Sol they both fly to.
const around = (await A.galaxy.region(0, 1)).filter((c) => Number(c.cell) !== 0 && Number(c.state) === 2)
const star = Number(around[0].cell)
const planet = star * 65536 // its first planet
const MINE_MS = Number(process.env.MINE_MS ?? 8 * 60_000) // long enough for a unit or two
while (Date.now() - startedAt < MINE_MS) await sleep(5_000)
await record('A', a, 'stop mining (loads what was mined)', () => A.drones.stopMining())
await record('A', a, 'jump to a charted star', () => A.pilots.jump(star, []), { star })
await record('A', a, 'claim a planet', () => A.claims.claim(planet))
await record('A', a, 'land 100 colonists', () => A.planets.land(planet, 100))
await record('A', a, 'deliver 40 equipment', () => A.planets.deliver(planet, EQUIPMENT, 40))
await record('A', a, 'deliver 40 organics', () => A.planets.deliver(planet, ORGANICS, 40))
await record('A', a, 'build a Citadel', () => A.planets.build(planet, 1))
await record('B', b, 'jump to a charted star', () => B.pilots.jump(star, []), { star })
await record('B', b, 'lay siege', () => B.battle.attack(planet))

const by = {}
for (const e of log) by[e.action] = { gas: e.gas, pas: e.pas }
console.log(JSON.stringify({ chain: (await provider.getNetwork()).chainId.toString(), moves: log.length, by }, null, 2))
if (out) writeFileSync(out, JSON.stringify({ log }, null, 2) + '\n')
