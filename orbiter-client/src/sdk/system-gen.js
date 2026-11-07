// A star's planets, derived and never stored (docs/demo4-plan.md, D9, D19), mirroring
// contracts/src/planets/SystemGen.sol: how many planets, and each one's class, size and surface
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

/** The seed the local deployment uses (contracts/script/Deploy.s.sol's default). */
export const DEMO_SEED = hashText('orbiter8 demo 4')

/** A planet's display name: Sol's by name, others by star and place (e.g. "Kara-412 b"). */
export function planetName(starName, cell, body) {
  return cell === 0 ? SOL_PLANETS[body] : `${starName} ${String.fromCharCode(98 + body)}`
}

/** The building line (Planets.sol), by number. */
export const BUILDINGS = ['', 'Citadel', 'Colony', 'Station', 'Port', 'Yards', 'Armory', 'Autofactory']

/**
 * Which of a planet's eight moon orbits hold a moon, as bits (SystemGen.moonSlots): Sol's real moons,
 * elsewhere (3 + body / 4) in 25 per orbit, as Orbiter 8 always placed them.
 */
export function moonSlots(seed, cell, body) {
  if (cell === 0) return SOL_MOON_SLOTS[body]
  const h = hash(['bytes32', 'uint256', 'uint256', 'string'], [seed, cell, body, 'moons'])
  let slots = 0
  for (let j = 0; j < 8; j++) {
    if (Number((h >> BigInt(j * 8)) % 25n) < 3 + Math.floor(body / 4)) slots |= 1 << j
  }
  return slots
}
const SOL_MOON_SLOTS = [0, 0, 0x02, 0x09, 0x1e, 0x3f, 0x3f, 0x0e, 0x08]

// Sol as the game has always drawn it: rings and orbit speed per planet, its station's size, and
// its moons by orbit as [name, size, orbit speed] (all of class 1, Rocky).
const SOL_LOOKS = [
  { rings: 0, speed: 250, station: 1, moons: {} },
  { rings: 0, speed: 83, station: 1, moons: {} },
  { rings: 0, speed: 50, station: 6, moons: { 1: ['Luna', 10, 100] } },
  { rings: 0, speed: 26, station: 4, moons: { 0: ['Phobos', 1, 185], 3: ['Deimos', 1, 42] } },
  {
    rings: 0,
    speed: 5,
    station: 12,
    moons: { 1: ['Io', 10, 41], 2: ['Europa', 8, 42], 3: ['Ganymede', 14, 56], 4: ['Callisto', 14, 26] }
  },
  {
    rings: 10,
    speed: 4,
    station: 10,
    moons: {
      0: ['Enceladus', 3, 111],
      1: ['Tethys', 3, 46],
      2: ['Dione', 3, 21],
      3: ['Rhea', 5, 71],
      4: ['Titan', 14, 67],
      5: ['Iapetus', 5, 31]
    }
  },
  {
    rings: 1,
    speed: 3,
    station: 3,
    moons: {
      0: ['Puck', 1, 29],
      1: ['Miranda', 3, 5],
      2: ['Ariel', 5, 33],
      3: ['Umbriel', 5, 10],
      4: ['Titania', 5, 41],
      5: ['Oberon', 5, 20]
    }
  },
  { rings: 0, speed: 10, station: 3, moons: { 1: ['Proteus', 1, 25], 2: ['Triton', 9, 22], 3: ['Nereid', 1, 28] } },
  { rings: 0, speed: 1, station: 1, moons: { 3: ['Charon', 1, 21] } }
]

/**
 * How a planet looks, beyond what the contracts know: its rings, orbit speed, station size, and its
 * moons' sizes, classes and speeds. Only for drawing, so it's client-side (never checked on chain):
 * Sol as the game has always drawn it, elsewhere the game's formulas on a hash of the planet.
 * @returns {{ rings: number, orbitSpeed: number, stationSize: number,
 *   moons: Array<{ orbit: number, name: string | null, size: number, class: number, orbitSpeed: number }> }}
 */
export function looks(seed, cell, body) {
  const slots = moonSlots(seed, cell, body)
  const orbits = [0, 1, 2, 3, 4, 5, 6, 7].filter((j) => (slots >> j) & 1)
  if (cell === 0) {
    const sol = SOL_LOOKS[body]
    return {
      rings: sol.rings,
      orbitSpeed: sol.speed,
      stationSize: sol.station,
      moons: orbits.map((orbit) => {
        const [name, size, orbitSpeed] = sol.moons[orbit]
        return { orbit, name, size, class: 1, orbitSpeed }
      })
    }
  }
  const dna = hash(['bytes32', 'uint256', 'uint256', 'string'], [seed, cell, body, 'looks'])
  const digit = (div, mod) => Number((dna / BigInt(div)) % BigInt(mod))
  return {
    rings: digit(1000, 10) > 2 ? 0 : digit(100, 10),
    orbitSpeed: Math.floor((255 - digit(1000, 150)) / (body + 1)),
    stationSize: 1 + digit(7, 8),
    moons: orbits.map((orbit) => {
      const m = hash(['bytes32', 'uint256', 'uint256', 'uint256', 'string'], [seed, cell, body, orbit, 'moon'])
      return {
        orbit,
        name: null,
        size: Number(m % BigInt(30 - orbit * 2)) + 1,
        class: Number((m / 50n) % 10n),
        orbitSpeed: 255 - orbit * 30 - Number((m / 2005n) % 50n)
      }
    })
  }
}

/** A moon's display name when its owner hasn't named it: the planet's name and the orbit, e.g. "Kara-412 b II". */
export function moonName(planetName, orbit) {
  return `${planetName} ${['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'][orbit]}`
}
