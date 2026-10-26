import { describe, expect, it } from 'vitest'
import { starAngle, layoutNeighbors, pointAt, arcPath } from './neighbor-layout'

const gap = (a, b) => {
  const d = Math.abs(a - b) % 360
  return Math.min(d, 360 - d)
}

describe('neighbor layout', () => {
  it('gives each star the same direction wherever it is seen from', () => {
    expect(layoutNeighbors([2, 3, 4]).get('3')).toBe(layoutNeighbors([3, 9, 14]).get('3'))
    expect(starAngle(3)).toBeCloseTo((3 * 137.50776405003785) % 360, 9)
  })

  it('spreads out stars that would crowd each other', () => {
    const ids = Array.from({ length: 12 }, (_, i) => i + 2)
    const angles = [...layoutNeighbors(ids).values()]
    for (let i = 0; i < angles.length; i++) {
      for (let j = i + 1; j < angles.length; j++) expect(gap(angles[i], angles[j])).toBeGreaterThan(23)
    }
  })

  it('measures angles clockwise from up', () => {
    const right = pointAt(90, 10)
    expect(right.x).toBeCloseTo(10, 9)
    expect(right.y).toBeCloseTo(0, 9)
    expect(pointAt(0, 10).y).toBeCloseTo(-10, 9)
  })

  it('draws a path that bows to one side of the straight line', () => {
    expect(arcPath({ x: 0, y: 0 }, { x: 100, y: 0 })).toBe('M 0 0 Q 50 18 100 0')
    expect(arcPath({ x: 0, y: 0 }, { x: 100, y: 0 }, 0)).toBe('M 0 0 Q 50 0 100 0')
  })
})
