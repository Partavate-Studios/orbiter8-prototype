import { describe, expect, it } from 'vitest'
import { bearingDegrees, scopeOpacity } from './bearing'
import { planetTypeName } from './planet-types'

// The original scope function, except for its bug: (0, negative y) returned 1 instead of 180.
function originalBearing (x, y) {
  if (x === 0) return y > 0 ? 0 : 180
  if (x > 0) return 270 + Math.atan(y / x) * 180 / Math.PI
  return 90 + Math.atan(y / x) * 180 / Math.PI
}

describe('bearingDegrees', () => {
  it('points 0 at +y and turns clockwise', () => {
    expect(bearingDegrees(0, 5)).toBe(0)
    expect(bearingDegrees(-5, 0)).toBe(90)
    expect(bearingDegrees(0, -5)).toBe(180)
    expect(bearingDegrees(5, 0)).toBe(270)
  })

  it('has no bearing at the center', () => {
    expect(bearingDegrees(0, 0)).toBe(0)
  })

  it('matches the original convention everywhere else', () => {
    for (let i = 0; i < 2000; i++) {
      const x = Math.sin(i * 12.9898) * 9000
      const y = Math.cos(i * 78.233) * 9000
      const diff = Math.abs(bearingDegrees(x, y) - originalBearing(x, y)) % 360
      expect(Math.min(diff, 360 - diff)).toBeLessThan(1e-9)
    }
  })
})

describe('scopeOpacity', () => {
  it('hides nearby objects and shows distant ones', () => {
    expect(scopeOpacity(0, 0, 1, false)).toBe(0)
    expect(scopeOpacity(250, 0, 1, false)).toBeCloseTo(0.1, 9)
    expect(scopeOpacity(5000, 0, 1, false)).toBe(1)
  })

  it('measures distance on screen (zoom) and keeps the star visible twice as far', () => {
    expect(scopeOpacity(500, 0, 2, false)).toBeCloseTo(scopeOpacity(250, 0, 1, false), 9)
    expect(scopeOpacity(1000, 0, 1, true)).toBeCloseTo(scopeOpacity(500, 0, 1, false), 9)
  })
})

describe('planetTypeName', () => {
  it('names the contract planet classes', () => {
    expect(planetTypeName(0)).toBe('Terrestrial')
    expect(planetTypeName(6)).toBe('Gaseous')
    expect(planetTypeName(9)).toBe('Swamp')
    expect(planetTypeName(42)).toBe(42)
  })
})
