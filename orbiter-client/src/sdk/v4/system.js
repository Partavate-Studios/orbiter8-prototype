// A star's planets, derived and never stored (docs/demo4-plan.md, D9, D19), mirroring
// contracts-v4/src/planets/SystemGen.sol: how many planets, and each one's class, size and surface
// seed. Owners, buildings, people and storage come from the Planets contract.
import { keccak256, AbiCoder, id as hashText } from 'ethers'

const coder = AbiCoder.defaultAbiCoder()
const hash = (types, values) => BigInt(keccak256(coder.encode(types, values)))

const SOL_CLASSES = [1, 5, 0, 1, 6, 6, 4, 4, 1]
const SOL_SIZES = [3, 12, 12, 6, 54, 36, 24, 24, 1]
export const SOL_PLANETS = ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto']
const GASEOUS = 6

/** How many planets circle the star at `cell` (2 to 8; Sol has 9). */
export function planetCount(seed, cell) {
  if (cell === 0) return SOL_PLANETS.length
  return 2 + Number(hash(['bytes32', 'uint256', 'string'], [seed, cell, 'planets']) % 7n)
}

/** @returns {{ class: number, size: number, surface: string }} */
export function planet(seed, cell, body) {
  const surface = keccak256(coder.encode(['bytes32', 'uint256', 'uint256', 'string'], [seed, cell, body, 'surface']))
  if (cell === 0) return { class: SOL_CLASSES[body], size: SOL_SIZES[body], surface }
  const h = hash(['bytes32', 'uint256', 'uint256', 'string'], [seed, cell, body, 'planet'])
  const cls = Number(h % 10n)
  const x = Number((h >> 16n) % 1000n)
  return { class: cls, size: cls === GASEOUS ? 16 + (x % 48) : 1 + (x % 16), surface }
}

const HABITABILITY = [1000, 300, 800, 300, 200, 100, 100, 200, 100, 600]

/** The most people a planet holds. */
export const populationCap = (cls, size) => size * HABITABILITY[cls]

/** The seed the local deployment uses (contracts-v4/script/Deploy.s.sol's default). */
export const DEMO_SEED = hashText('orbiter8 demo 4')

/** A planet's display name: Sol's by name, others by star and place (e.g. "Kara-412 b"). */
export function planetName(starName, cell, body) {
  return cell === 0 ? SOL_PLANETS[body] : `${starName} ${String.fromCharCode(98 + body)}`
}

/** The building line (Planets.sol), by number. */
export const BUILDINGS = ['', 'Citadel', 'Colony', 'Station', 'Port', 'Yards', 'Armory', 'Autofactory']
