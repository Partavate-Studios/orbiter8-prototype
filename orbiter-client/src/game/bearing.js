// The scope: which way, and how prominently, to point at things in the star system.

/**
 * Compass bearing from the view center to a point, in degrees: 0 points to +y (down the screen in
 * SVG) and angles increase clockwise, which is how the scope's arrows are drawn.
 * A point exactly at the center has no bearing; it gets 0.
 * @param {number} x
 * @param {number} y
 */
export function bearingDegrees (x, y) {
  if (x === 0 && y === 0) {
    return 0
  }
  return (Math.atan2(y, x) * 180 / Math.PI + 270) % 360
}

/**
 * How visible a scope marker is (0-1) for an object at (x, y) from the view center, in world units
 * scaled by the camera's zoom. Nearby objects fade out (you can see them); the star stays visible
 * twice as far out.
 * @param {number} x
 * @param {number} y
 * @param {number} zoom  the camera's viewport.scale
 * @param {boolean} isStar
 */
export function scopeOpacity (x, y, zoom, isStar) {
  let length = Math.sqrt(x * x + y * y) / zoom
  if (isStar) {
    length = length / 2
  }
  const opacity = (length - 250) / 1000
  return Math.max(Math.min(opacity + 0.1, 1), 0)
}
