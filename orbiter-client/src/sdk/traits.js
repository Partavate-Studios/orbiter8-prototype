// How a star looks, derived from the universe's seed and the cell (docs/demo4-plan.md, D8, D9):
// its color, size and how far it sits off the grid. Nothing here is stored on chain; every client
// derives the same values. Names are players' to give, and stored (Planets.nameStar).
import { keccak256, AbiCoder } from 'ethers'

const coder = AbiCoder.defaultAbiCoder()

/** A fair number in [0, 1) from the seed, the cell and a label. */
export function rnd(seed, cell, label) {
  const h = keccak256(coder.encode(['bytes32', 'uint256', 'string'], [seed, cell, label]))
  return Number(BigInt(h) % 1_000_000_000n) / 1e9
}


function hsv(h, s, v) {
  const i = Math.floor(h * 6)
  const f = h * 6 - i
  const p = v * (1 - s)
  const q = v * (1 - f * s)
  const t = v * (1 - (1 - f) * s)
  return [
    [v, t, p],
    [q, v, p],
    [p, v, t],
    [p, q, v],
    [t, p, v],
    [v, p, q]
  ][i % 6].map((c) => c * 255)
}

/** A bright hue at a random shade, kept legible against the dark (the prototype's rule). */
function color(seed, cell) {
  let [r, g, b] = hsv(rnd(seed, cell, 'hue'), 0.2 + 0.72 * rnd(seed, cell, 'saturation'), 1)
  const shade = 0.55 + 0.45 * rnd(seed, cell, 'shade')
  r *= shade
  g *= shade
  b *= shade
  for (let i = 0; i < 10 && r + g + b < 400; i++) {
    const d = (400 - (r + g + b)) / 3 + 1
    r = Math.min(255, r + d)
    g = Math.min(255, g + d)
    b = Math.min(255, b + d)
  }
  return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`
}

/** How far stars drift off their grid point, as a share of the spacing between neighbors. */
export const JITTER = 0.2

/**
 * @param {string} seed  the universe's seed (bytes32 hex)
 * @param {number} cell
 * @returns {{ color: string, size: number, jitter: [number, number] }}
 *   size 0.25–1; jitter in grid units. (Names are players' to give: sdk/client.js starName.)
 */
export function starTraits(seed, cell) {
  if (cell === 0) return { color: 'rgb(255,214,92)', size: 0.5, jitter: [0, 0] }
  const angle = rnd(seed, cell, 'jitter angle') * 2 * Math.PI
  const reach = JITTER * Math.sqrt(rnd(seed, cell, 'jitter distance'))
  return {
    color: color(seed, cell),
    size: 0.25 + 0.75 * rnd(seed, cell, 'size'),
    jitter: [Math.cos(angle) * reach, Math.sin(angle) * reach]
  }
}
