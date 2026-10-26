// Where to draw a system's neighbors around it. The contracts only say which stars are one jump
// apart, not where they are, so each star gets a direction from its id: the same star always
// appears in the same direction, whichever neighbor you look at it from.

const GOLDEN_ANGLE = 137.50776405003785
// Neighbors closer than this (degrees) are pushed apart so their labels don't overlap.
const MIN_SEPARATION = 24

/** A star's direction in degrees (0 = up, clockwise), from its id alone. */
export function starAngle(id) {
  return (Number(id) * GOLDEN_ANGLE) % 360
}

/**
 * Angles for a system's neighbors: each star's own direction, spread out where two would crowd.
 * @param {(number | string)[]} ids  neighbor system ids
 * @returns {Map<string, number>}  id → angle in degrees (0 = up, clockwise)
 */
export function layoutNeighbors(ids) {
  const placed = ids.map((id) => ({ id: String(id), angle: starAngle(id) })).sort((a, b) => a.angle - b.angle)
  const separation = Math.min(MIN_SEPARATION, 360 / Math.max(placed.length, 1))
  // A few relaxation passes: push each crowded pair apart by half the overlap.
  for (let pass = 0; pass < 20; pass++) {
    let moved = false
    for (let i = 0; i < placed.length && placed.length > 1; i++) {
      const a = placed[i]
      const b = placed[(i + 1) % placed.length]
      const gap = (b.angle - a.angle + 360) % 360
      if (gap < separation) {
        const push = (separation - gap) / 2
        a.angle = (a.angle - push + 360) % 360
        b.angle = (b.angle + push) % 360
        moved = true
      }
    }
    if (!moved) break
  }
  return new Map(placed.map(({ id, angle }) => [id, angle]))
}

/** The point at `distance` from the center in direction `angle` (0 = up, clockwise; y grows down). */
export function pointAt(angle, distance) {
  const radians = (angle * Math.PI) / 180
  return { x: Math.sin(radians) * distance, y: -Math.cos(radians) * distance }
}

/**
 * An SVG path from `from` to `to` that bows to one side, like a route curving through space.
 * @param {{ x: number, y: number }} from
 * @param {{ x: number, y: number }} to
 * @param {number} [bend]  how far the middle bows out, as a fraction of the distance
 */
export function arcPath(from, to, bend = 0.18) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  // Control point: the midpoint, pushed sideways (perpendicular to the line).
  const cx = from.x + dx / 2 - dy * bend
  const cy = from.y + dy / 2 + dx * bend
  const round = (n) => Math.round(n * 10) / 10
  return `M ${round(from.x)} ${round(from.y)} Q ${round(cx)} ${round(cy)} ${round(to.x)} ${round(to.y)}`
}
