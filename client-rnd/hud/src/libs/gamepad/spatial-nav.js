// D-pad focus movement: from the focused element, pick the nearest candidate in the pressed
// direction. Works on plain rectangles so it can be tested without a DOM.

/** @typedef {{ left: number, top: number, width: number, height: number }} Rect */

const center = (rect) => ({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })

/**
 * The index of the best rectangle to move to, or -1 if there's nothing that way.
 * Candidates must lie in the direction pressed (within 60 degrees of it). Among those, distance
 * counts, but straying sideways counts double, so straight lines win over diagonals.
 * @param {Rect} from
 * @param {Rect[]} candidates
 * @param {'up' | 'down' | 'left' | 'right'} direction
 */
export function nextInDirection(from, candidates, direction) {
  const origin = center(from)
  const [ax, ay] = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[direction]
  let best = -1
  let bestScore = Infinity
  candidates.forEach((rect, index) => {
    const { x, y } = center(rect)
    const dx = x - origin.x
    const dy = y - origin.y
    const along = dx * ax + dy * ay
    const across = Math.abs(dx * ay - dy * ax)
    if (along <= 1 || across > along * Math.tan(Math.PI / 3)) return
    const score = along + 2 * across
    if (score < bestScore) {
      bestScore = score
      best = index
    }
  })
  return best
}

/** The index of the rectangle nearest a point (for picking a first focus), or -1 if there are none. */
export function nearestTo(point, candidates) {
  let best = -1
  let bestDistance = Infinity
  candidates.forEach((rect, index) => {
    const { x, y } = center(rect)
    const distance = Math.hypot(x - point.x, y - point.y)
    if (distance < bestDistance) {
      bestDistance = distance
      best = index
    }
  })
  return best
}
