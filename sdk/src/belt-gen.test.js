import { describe, it, expect } from 'vitest'
import { hasBelt, outsidePlanet, section, SECTIONS } from './belt-gen'
import { DEMO_SEED } from './system-gen'

// Printed by contracts/test/vectors/BeltVectors.t.sol (test_printVectors): cell, belt, outside planet
// (of 5), then each section packed as 100 (asteroid) + 10 × composition + size, three digits each.
const VECTORS = [
  [1, true, 3, 125103125101105107124107n],
  [7, false, 2, 108101000117103000102122n],
  [400, true, 3, 114115128128112114108108n],
  [12345, false, 2, 112128125104108105000n],
  [3, false, 2, 107114000106105106108104n]
]

describe('belts', () => {
  it('reproduce the Solidity values', () => {
    for (const [cell, has, outside, packed] of VECTORS) {
      expect(hasBelt(DEMO_SEED, cell)).toBe(has)
      expect(outsidePlanet(DEMO_SEED, cell, 5)).toBe(outside)
      let p = 0n
      for (let s = 0; s < SECTIONS; s++) {
        const x = section(DEMO_SEED, cell, s)
        p = p * 1000n + BigInt((x.asteroid ? 100 : 0) + x.composition * 10 + x.size)
      }
      expect(p).toBe(packed)
    }
  })
  it("puts Sol's between Mars and Jupiter, Ceres first", () => {
    expect(hasBelt(DEMO_SEED, 0)).toBe(true)
    expect(outsidePlanet(DEMO_SEED, 0, 9)).toBe(3)
    expect(section(DEMO_SEED, 0, 0)).toMatchObject({ asteroid: true, name: 'Ceres', size: 8 })
  })
})
