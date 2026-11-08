// How a star looks, derived from the universe's seed and the cell (docs/demo4-plan.md, D8, D9): its
// spectral class (and so its color and size), and how far it sits off the grid. Nothing here is
// stored on chain; every client derives the same values. Names are players' to give, and stored
// (Planets.nameStar).
import { keccak256, AbiCoder } from 'ethers'
import { STAR_CLASSES } from '@/libs/palette'
import { neighbors } from './hex'

const coder = AbiCoder.defaultAbiCoder()

/** A fair number in [0, 1) from the seed, the cell and a label. */
export function rnd(seed, cell, label) {
  const h = keccak256(coder.encode(['bytes32', 'uint256', 'string'], [seed, cell, label]))
  return Number(BigInt(h) % 1_000_000_000n) / 1e9
}


/**
 * Spectral classes, hottest to coolest, and how often each turns up. Real stars are three quarters
 * red dwarfs; the game softens that so the map isn't all red, keeping the order (red commonest, blue
 * rarest).
 */
export const SPECTRAL = ['O', 'B', 'A', 'F', 'G', 'K', 'M']
const SHARE = { O: 0.02, B: 0.05, A: 0.08, F: 0.12, G: 0.18, K: 0.25, M: 0.3 }
/** A star's size (0.25–1) follows its class: on the main sequence, hotter stars are bigger. */
const BASE_SIZE = { O: 0.95, B: 0.85, A: 0.72, F: 0.62, G: 0.54, K: 0.44, M: 0.32 }

/** Sol and its genesis neighbors, by their real classes (Sol yellow, as people know it). */
export const REAL_STARS = {
  Sol: 'G',
  'Alpha Centauri': 'G',
  "Barnard's Star": 'M',
  'Wolf 359': 'M',
  'Lalande 21185': 'M',
  Sirius: 'A',
  'Ross 154': 'M'
}

/** Galaxy._genesisName's order: Sol's neighbors that are stars, in HexMath.neighbors order. */
const GENESIS = ['Alpha Centauri', "Barnard's Star", 'Wolf 359', 'Lalande 21185', 'Sirius', 'Ross 154']

/**
 * The name a star was given at genesis, if it's one of Sol's neighbors (whatever it's called now: a
 * pilot holding most of its planets may rename it, but it keeps its real class).
 * @param {(cell: number) => boolean} isStar  whether a cell is a star
 */
export function genesisName(cell, isStar) {
  const around = neighbors(0)
  const i = around.indexOf(cell)
  if (i < 0 || !isStar(cell)) return undefined
  return GENESIS[around.slice(0, i).filter(isStar).length]
}

function drawClass(seed, cell) {
  let r = rnd(seed, cell, 'spectral class')
  for (const c of SPECTRAL) {
    r -= SHARE[c]
    if (r < 0) return c
  }
  return 'M'
}

/** How far stars drift off their grid point, as a share of the spacing between neighbors. */
export const JITTER = 0.2

/**
 * @param {string} seed  the universe's seed (bytes32 hex)
 * @param {number} cell
 * @param {string} [genesis]  its genesis name (genesisName), if it has one: Sol's neighbors keep their
 *   real classes
 * @returns {{ spectral: string, color: string, size: number, jitter: [number, number] }}
 *   spectral O–M (libs/palette.js STAR_CLASSES has its colors); color its dot on the galaxy map;
 *   size 0.25–1; jitter in grid units. (Names are players' to give: sdk/client.js starName.)
 */
export function starTraits(seed, cell, genesis) {
  if (cell === 0) return { spectral: 'G', color: STAR_CLASSES.G.mid, size: 0.5, jitter: [0, 0] }
  const spectral = REAL_STARS[genesis] ?? drawClass(seed, cell)
  const angle = rnd(seed, cell, 'jitter angle') * 2 * Math.PI
  const reach = JITTER * Math.sqrt(rnd(seed, cell, 'jitter distance'))
  const size = BASE_SIZE[spectral] + 0.16 * (rnd(seed, cell, 'size') - 0.5)
  return {
    spectral,
    color: STAR_CLASSES[spectral].mid,
    size: Math.min(1, Math.max(0.25, size)),
    jitter: [Math.cos(angle) * reach, Math.sin(angle) * reach]
  }
}
