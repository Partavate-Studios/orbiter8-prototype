import { describe, it, expect } from 'vitest'
import { toAxial, toIndex, ringOf, neighbors, distance, disc, position, cellAt } from './hex'
import { roundAt, timeOf, GENESIS_TIME } from './drand'
import { starTraits } from './traits'

describe('the hex grid (mirrors HexMath.sol)', () => {
  it('round-trips every index and agrees on rings', () => {
    for (let n = 0; n < 50_000; n++) expect(toIndex(...toAxial(n))).toBe(n)
    expect([0, 1, 6, 7, 18, 19].map(ringOf)).toEqual([0, 1, 1, 2, 2, 3])
  })

  it("matches the contract's numbering (values printed by contracts/test/vectors/HexVectors.t.sol)", () => {
    expect(toAxial(1)).toEqual([-1, 1])
    expect(toAxial(7)).toEqual([-2, 2])
    expect(toAxial(19)).toEqual([-3, 3])
    expect(toAxial(400)).toEqual([-9, 12])
    expect(toAxial(12345)).toEqual([8, -64])
    expect(toAxial(987654)).toEqual([373, 201])
    expect(toIndex(3, 0)).toBe(25)
    expect(toIndex(-5, 2)).toBe(88)
  })

  it('has six distinct neighbors one step away, and discs of 3R²+3R+1 cells', () => {
    for (const n of [0, 5, 123, 98765]) {
      const around = neighbors(n)
      expect(new Set(around).size).toBe(6)
      for (const m of around) expect(distance(n, m)).toBe(1)
    }
    expect(disc(0, 10).length).toBe(331)
  })

  it('finds the cell at a point', () => {
    for (const n of [0, 7, 400, 12345]) expect(cellAt(...position(n))).toBe(n)
  })
})

describe('drand timing (mirrors Drand.sol)', () => {
  it('numbers rounds from genesis, every 3 seconds', () => {
    expect(roundAt(GENESIS_TIME)).toBe(1)
    expect(roundAt(GENESIS_TIME + 3)).toBe(2)
    expect(roundAt(timeOf(22169011))).toBe(22169011)
  })
})

describe('star traits', () => {
  it('are the same every time for a cell, and differ between cells', () => {
    const seed = '0x' + '11'.repeat(32)
    expect(starTraits(seed, 42)).toEqual(starTraits(seed, 42))
    expect(starTraits(seed, 42).color).not.toBe(starTraits(seed, 43).color)
    const { size, jitter } = starTraits(seed, 42)
    expect(size).toBeGreaterThanOrEqual(0.25)
    expect(Math.hypot(...jitter)).toBeLessThanOrEqual(0.2)
  })
})
