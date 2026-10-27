// Where things are in a star system: orbit sizes, speeds and positions over game time.
// Plain math; no Vue, DOM or chain access. Distances are world units.

/** Orbit speeds (from the contracts, or below) are multiplied by this to get radians per game millisecond. */
export const ORBIT_SPEED_SCALE = 0.000000005

/** Ships that aren't at a planet circle the star at this distance. */
export const SHIP_ORBIT_RADIUS_AROUND_STAR = 50

// Speeds follow Enterprise Circuit's (adopted 2026-10-27; the formulas before are in UPGRADE_NOTES.md,
// "Sizes and speeds: history"). Its speeds are "periods" times 1e-7 radians per millisecond; this
// one's are speeds times ORBIT_SPEED_SCALE, so its values are multiplied by EC_SPEED to convert.
const EC_SPEED = 1e-7 / ORBIT_SPEED_SCALE

/**
 * A planet's orbit speed, from its contract speed and orbital position (0 = innermost): outer planets
 * slower, with a floor so the outermost still visibly move.
 */
export function planetOrbitSpeed(contractSpeed, orbitalPosition) {
  return EC_SPEED * (Number(contractSpeed) / (Number(orbitalPosition) + 1) + 5)
}

/** A moon's orbit speed, from its contract speed and orbital position around its planet. */
export function moonOrbitSpeed(contractSpeed, moonPosition) {
  return EC_SPEED * ((Number(contractSpeed) * 4) / (Number(moonPosition) + 1) + 100)
}

/** A space station's orbit speed: slower around bigger planets. */
export function stationOrbitSpeed(planetSize) {
  return EC_SPEED * Math.max(50, (50 - Number(planetSize)) * 10 + 150)
}

/**
 * Position on a circular orbit around the origin at `gameTime`.
 * @param {number} distance  orbit radius
 * @param {number} speed  orbit speed (see ORBIT_SPEED_SCALE)
 * @param {number} gameTime  milliseconds
 * @returns {{ x: number, y: number, angle: number }}  angle in degrees, the direction from the origin
 */
export function orbitAt(distance, speed, gameTime) {
  const theta = (gameTime * speed * ORBIT_SPEED_SCALE) % (Math.PI * 2)
  const x = distance * Math.cos(theta)
  const y = distance * Math.sin(theta)
  return { x, y, angle: (Math.atan2(y, x) * 180) / Math.PI }
}

/** Radius of a planet's orbit around the star, by its orbital position (0 = innermost). */
export function planetOrbitRadius(orbitalPosition) {
  const p = Number(orbitalPosition)
  return 150 + p * 50 + p * p * 15
}

/** Radius of a moon's orbit around its planet, by planet size and the moon's orbital position. */
export function moonOrbitRadius(planetSize, moonPosition) {
  const m = Number(moonPosition)
  return planetSize * 0.7 + 14 + m * m * 0.4 + m * 4
}

/** Radius of a space station's orbit around its planet. */
export function stationOrbitRadius(planetSize) {
  return planetSize * 0.6 + 12
}

/** Radius of a ship's orbit around the planet it's at. */
export function shipOrbitRadius(planetSize) {
  return planetSize * 0.5 + 6
}

/**
 * Ships get a speed from their id, so ships at one planet don't move in lockstep: 16,000-23,200,
 * around Enterprise Circuit's 20,000 for every ship.
 */
export function shipOrbitSpeed(shipId) {
  return 8 * (((shipId * 25.25) % 10) * 100 + 2000)
}
