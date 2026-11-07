// The galaxy's hex grid, mirroring contracts/src/galaxy/HexMath.sol (docs/demo4-plan.md, section 2).
// Every cell has one index, counted outward from Sol (0) ring by ring; index <-> axial (q, r) is an
// exact bijection. Indices stay well inside JavaScript's safe integers for any galaxy we'll see.

const DIR = [
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, 0],
  [-1, 1],
  [0, 1]
]
const PRE = [
  [0, 0],
  [1, 0],
  [2, -1],
  [2, -2],
  [1, -2],
  [0, -1]
]

/** The ring a cell is on (Sol is ring 0). */
export function ringOf(n) {
  if (n <= 0) return 0
  let k = Math.floor((3 + Math.sqrt(12 * n - 3)) / 6)
  while (3 * k * (k + 1) + 1 <= n) k++
  while (3 * k * (k - 1) + 1 > n) k--
  return k
}

/** @returns {[number, number]} axial [q, r] */
export function toAxial(n) {
  if (n <= 0) return [0, 0]
  const k = ringOf(n)
  const m = n - (3 * k * (k - 1) + 1)
  const side = Math.floor(m / k)
  const pos = m % k
  return [-k + PRE[side][0] * k + DIR[side][0] * pos, k + PRE[side][1] * k + DIR[side][1] * pos]
}

export function toIndex(q, r) {
  const k = (Math.abs(q) + Math.abs(r) + Math.abs(q + r)) / 2
  if (k === 0) return 0
  const dq = q + k
  const dr = r - k
  for (let s = 0; s < 6; s++) {
    const rq = dq - PRE[s][0] * k
    const rr = dr - PRE[s][1] * k
    const d = DIR[s]
    const pos = d[0] !== 0 ? rq / d[0] : rr / d[1]
    if (pos >= 0 && pos < k && Number.isInteger(pos) && rq === d[0] * pos && rr === d[1] * pos) {
      return 3 * k * (k - 1) + 1 + s * k + pos
    }
  }
  throw new Error(`not a hex cell: ${q}, ${r}`)
}

/** Steps between two cells. */
export function distance(a, b) {
  const [aq, ar] = toAxial(a)
  const [bq, br] = toAxial(b)
  const dq = aq - bq
  const dr = ar - br
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2
}

/** The six cells around `n`, in the contracts' direction order. */
export function neighbors(n) {
  const [q, r] = toAxial(n)
  return DIR.map(([dq, dr]) => toIndex(q + dq, r + dr))
}

/** Every cell within `radius` steps of `center`. */
export function disc(center, radius) {
  const [cq, cr] = toAxial(center)
  const out = []
  for (let dq = -radius; dq <= radius; dq++) {
    const lo = Math.max(-radius, -dq - radius)
    const hi = Math.min(radius, -dq + radius)
    for (let dr = lo; dr <= hi; dr++) out.push(toIndex(cq + dq, cr + dr))
  }
  return out
}

/** A cell's center in the galaxy's plane, one unit between neighbors (the contracts' geometry). */
export function position(n) {
  const [q, r] = toAxial(n)
  return [q + r / 2, (r * Math.sqrt(3)) / 2]
}

/** The cell nearest a point in the galaxy's plane. */
export function cellAt(x, y) {
  const r = (2 * y) / Math.sqrt(3)
  const q = x - r / 2
  // Round in cube coordinates.
  let rq = Math.round(q)
  let rr = Math.round(r)
  const rs = Math.round(-q - r)
  const dq = Math.abs(rq - q)
  const dr = Math.abs(rr - r)
  const ds = Math.abs(rs - (-q - r))
  if (dq > dr && dq > ds) rq = -rr - rs
  else if (dr > ds) rr = -rq - rs
  return toIndex(rq, rr)
}
