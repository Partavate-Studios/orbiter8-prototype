import { describe, expect, it } from 'vitest'
import {
  orbitAt,
  planetOrbitRadius,
  moonOrbitRadius,
  stationOrbitRadius,
  shipOrbitRadius,
  shipOrbitSpeed,
  planetOrbitSpeed,
  ORBIT_SPEED_SCALE
} from './orbits'

// The formulas as they were written in Sprite.updateTelemetry and the star map import.
function originalTelemetry(distance, speed, gameTime) {
  const theta = (gameTime * speed * 0.000000005) % (Math.PI * 2)
  const x = distance * Math.cos(theta)
  const y = distance * Math.sin(theta)
  return { x, y, rotation: Math.atan2(y, x) * (180 / Math.PI) }
}

describe('orbitAt', () => {
  it('matches the original orbit math', () => {
    for (const [distance, speed, time] of [
      [435, 700, 1.7e12],
      [12, 2525, 1.8e12],
      [0, 100, 5e11]
    ]) {
      const expected = originalTelemetry(distance, speed, time)
      const orbit = orbitAt(distance, speed, time)
      expect(orbit.x).toBeCloseTo(expected.x, 9)
      expect(orbit.y).toBeCloseTo(expected.y, 9)
      expect(orbit.angle).toBeCloseTo(expected.rotation, 9)
    }
  })

  it('stays on the circle', () => {
    const { x, y } = orbitAt(300, 1000, 123456789)
    expect(Math.hypot(x, y)).toBeCloseTo(300, 9)
  })
})

describe('orbit radii and speeds', () => {
  it('planets: 150, 215, 310 ... from the star', () => {
    expect([0, 1, 2, 3].map(planetOrbitRadius)).toEqual([150, 215, 310, 435])
    expect(planetOrbitRadius('2')).toBe(310) // positions arrive as object keys (strings)
  })

  it('moons, stations and ships scale with the planet', () => {
    expect(moonOrbitRadius(10, 0)).toBe(21)
    expect(moonOrbitRadius(10, '3')).toBeCloseTo(10 * 0.7 + 14 + 9 * 0.4 + 12, 9)
    expect(stationOrbitRadius(10)).toBe(18)
    expect(shipOrbitRadius(10)).toBe(11)
  })

  it('ship speeds spread between 16,000 and 23,200 by id', () => {
    expect(shipOrbitSpeed(1)).toBeCloseTo(20200, 6)
    for (let id = 1; id < 50; id++) {
      expect(shipOrbitSpeed(id)).toBeGreaterThanOrEqual(16000)
      expect(shipOrbitSpeed(id)).toBeLessThan(24000)
    }
  })

  it("planets go around at Enterprise Circuit's pace: Sol's Mercury in about 4 minutes, outer ones slower", () => {
    const minutesPerOrbit = (speed) => (2 * Math.PI) / (speed * ORBIT_SPEED_SCALE) / 60000
    expect(minutesPerOrbit(planetOrbitSpeed(250, 0))).toBeCloseTo(4.1, 1)
    expect(planetOrbitSpeed(50, '2')).toBeLessThan(planetOrbitSpeed(250, 0))
    expect(planetOrbitSpeed(1, 8)).toBeGreaterThan(0) // the floor: Pluto still moves
  })
})
