// A star's asteroid belt, derived and never stored, mirroring contracts/src/planets/BeltGen.sol:
// whether the star has one (Sol always, about one star in four), which planet it lies outside, and
// its eight sections, each one large asteroid (composition, size) or, about one in six, empty space
// that ships can mine. Owners, buildings and drones come from the contracts.
import { keccak256, AbiCoder } from 'ethers'

const coder = AbiCoder.defaultAbiCoder()
const hash = (types, values) => BigInt(keccak256(coder.encode(types, values)))

export const SECTIONS = 8
export const COMPOSITION = { CARBONACEOUS: 0, SILICATE: 1, METALLIC: 2 }
export const COMPOSITION_NAMES = ['Carbonaceous', 'Silicate', 'Metallic']

/** Sol's belt, between Mars and Jupiter: real asteroids, and two empty sections to mine near home. */
const SOL_SECTIONS = [
  { name: 'Ceres', composition: 0, size: 8 },
  { name: 'Vesta', composition: 1, size: 6 },
  null,
  { name: 'Pallas', composition: 1, size: 6 },
  { name: 'Hygiea', composition: 0, size: 5 },
  { name: 'Psyche', composition: 2, size: 5 },
  null,
  { name: 'Juno', composition: 1, size: 3 }
]

const beltHash = (seed, cell) => hash(['bytes32', 'uint256', 'string'], [seed, cell, 'belt'])

/** Whether the star at `cell` has a belt. */
export function hasBelt(seed, cell) {
  if (cell === 0) return true
  return beltHash(seed, cell) % 4n === 0n
}

/** The planet the belt lies just outside of, by orbit (`planets`: the star's planet count). */
export function outsidePlanet(seed, cell, planets) {
  if (cell === 0) return 3 // Mars
  return Number((beltHash(seed, cell) >> 8n) % BigInt(planets))
}

/** @returns {{ asteroid: boolean, composition: number, size: number, name?: string }} */
export function section(seed, cell, index) {
  if (cell === 0) {
    const s = SOL_SECTIONS[index]
    return s ? { asteroid: true, ...s } : { asteroid: false, composition: 0, size: 0 }
  }
  const h = hash(['bytes32', 'uint256', 'uint256', 'string'], [seed, cell, index, 'asteroid'])
  if (h % 6n === 0n) return { asteroid: false, composition: 0, size: 0 }
  const kind = Number((h >> 8n) % 10n)
  const composition = kind < 5 ? 0 : kind < 8 ? 1 : 2
  return { asteroid: true, composition, size: 1 + Number((h >> 16n) % 8n) }
}

/** The goods an asteroid yields, by Market index (BeltGen.yields). */
export const yields = (composition) => [[0, 4], [5, 1], [1, 2]][composition]

/** An unclaimed asteroid's display name: Sol's by name, others by composition and section. */
export function asteroidName(cell, index, composition) {
  if (cell === 0) return SOL_SECTIONS[index]?.name ?? `Sol Belt ${index + 1}`
  return `Unnamed ${COMPOSITION_NAMES[composition]} Asteroid ${index + 1}`
}
