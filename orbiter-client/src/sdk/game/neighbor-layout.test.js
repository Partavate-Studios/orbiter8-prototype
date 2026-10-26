import { describe, expect, it } from 'vitest'
import { starAngle, layoutNeighbors, layoutOuterRing, pointAt, arcPath } from './neighbor-layout'

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

describe('the second ring', () => {
  const angles = new Map([
    ['2', 0],
    ['3', 120],
    ['4', 240]
  ])
  const known = { 2: [1, 3, 20, 21], 3: [1, 21, 30], 4: null }
  const ring = layoutOuterRing({ currentId: 1, angles, neighborsOf: (id) => known[id] ?? null })

  it('shows explored neighbors’ neighbors as dots outside the ring, once each', () => {
    expect(ring.dots.map((dot) => dot.id).sort()).toEqual([20, 21, 30])
    for (const dot of ring.dots) expect(Math.hypot(dot.x, dot.y)).toBeGreaterThan(1.3)
  })

  it('draws a path back instead of a dot for the current system, and skips first-ring stars', () => {
    expect(ring.returns.sort()).toEqual([2, 3])
    expect(ring.dots.some((dot) => dot.id === 1 || dot.id === 3)).toBe(false)
  })

  it('keeps dots apart and groups them by the neighbor they belong to', () => {
    for (let i = 0; i < ring.dots.length; i++) {
      for (let j = i + 1; j < ring.dots.length; j++) {
        const [a, b] = [ring.dots[i], ring.dots[j]]
        expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(0.0999)
      }
    }
    const nearTwo = ring.dots.filter((dot) => dot.parentId === 2)
    for (const dot of nearTwo) expect(Math.abs(dot.x)).toBeLessThan(0.5) // grouped around neighbor 2, straight up
  })
})
