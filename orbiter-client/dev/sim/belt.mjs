// The belt's economy at the contracts' starting numbers (expansion plan, Phase 5): what mining earns a
// pilot, what a mining drone pays back, and what an asteroid full of drones makes its owner, set
// against what trading earns (economy.mjs: an early trader makes about 12,000 credits an hour).
//
//   node dev/sim/belt.mjs
//
// Values are at a port's middle price (a good's base price, before the fee): what a unit fetches when
// the port is neither full nor empty. Numbers from Drones.sol, Factory.sol, Planets.sol and Market.sol.
import { sellProceeds, fee } from '../../../sdk/src/market.js'

const GOODS = { water: [40, 30], metals: [70, 45], rare: [160, 90], he3: [120, 70], organics: [60, 40], silicon: [50, 35] }
const YIELDS = { carbonaceous: ['water', 'organics'], silicate: ['silicon', 'metals'], metallic: ['metals', 'rare'] }
const DRONE_UNITS_PER_HOUR = 1.875 // Drones.milliPerHour / 1000
const BUILT_IN = 4
const MINING_DRONE_PRICE_SOL = 800 // part 9 at 400, doubled at Sol
const DRONES_PER_SIZE = 10
const CAPACITY = 300
const FEE_BPS = 200
const LINE = { claim: 2000, platform: 3000, mine: 15000, port: 60000, armory: 200000 }

/** What `units` of a good fetch at a half-full port that buys it, after the fee. */
function value(good, units) {
  const [base, spread] = GOODS[good]
  const proceeds = sellProceeds(base, spread, CAPACITY, CAPACITY / 2, units)
  return proceeds - fee(proceeds, FEE_BPS)
}
/** Credits an hour from `drones` mining a composition, half to each of its goods. */
function perHour(drones, kind, units = drones * DRONE_UNITS_PER_HOUR) {
  const [a, b] = YIELDS[kind]
  return value(a, Math.ceil(units / 2)) + value(b, Math.floor(units / 2))
}

const round = (n) => Math.round(n).toLocaleString('en-US')
const rows = []

// A new pilot's floor: four built-in drones, five bays.
for (const kind of Object.keys(YIELDS)) {
  const units = BUILT_IN * DRONE_UNITS_PER_HOUR
  rows.push([`new pilot mining ${kind} dust`, `${units} units/h, 5 bays full in ${round((5 / units) * 60)} min`, `${round(perHour(BUILT_IN, kind))} credits/h`])
}
// One more mining drone aboard: what it adds an hour, and how long it takes to pay for itself.
for (const kind of Object.keys(YIELDS)) {
  const extra = perHour(1, kind)
  rows.push([`a mining drone on ${kind} dust`, `+${round(extra)} credits/h`, `pays back in ${round(MINING_DRONE_PRICE_SOL / extra)} h`])
}
// An asteroid full of drones, its port selling what they mine (the owner is paid).
for (const size of [1, 4, 8]) {
  for (const kind of Object.keys(YIELDS)) {
    const drones = size * DRONES_PER_SIZE
    const income = perHour(drones, kind)
    const cost = LINE.claim + LINE.platform + LINE.mine + LINE.port + drones * MINING_DRONE_PRICE_SOL
    rows.push([`size ${size} ${kind} asteroid, ${drones} drones`, `${round(income)} credits/h to its owner`, `pays back in ${round(cost / income)} h`])
  }
}

for (const [what, a, b] of rows) console.log(what.padEnd(44), a.padEnd(36), b)
