import { describe, it, expect } from 'vitest'
import { planetCount, planet, moonSlots, looks, planetName, moonName, DEMO_SEED } from './system-gen'

describe('derived planets match the contracts', () => {
  it('reproduces the Solidity values (contracts/test/vectors/SystemVectors.t.sol)', () => {
    const expected = [
      [1, 5, [5, 5, 7, 3], '0x6d242e6d1b04ff7eea0f2244292df52df4c0c7b0ac365fad68ec72ed76e0830c'],
      [7, 4, [8, 11, 4, 16], '0xae32f5d18acec46315e151ca8dacc1d9c4900bafea7f24e795b973284ac41a02'],
      [400, 3, [2, 11, 4, 5], '0xea035bafd00bcbc18c082f88de98a71787a3c499b31ef82f4e024c564b9e7b63'],
      [12345, 7, [0, 9, 6, 38], '0xc0298d66faacf3db3cdd63d88874d428fcebb208bb4ce7180dcc30f711c59c2f']
    ]
    for (const [cell, count, [c0, s0, c1, s1], surface] of expected) {
      expect(planetCount(DEMO_SEED, cell)).toBe(count)
      const [a, b] = [planet(DEMO_SEED, cell, 0), planet(DEMO_SEED, cell, 1)]
      expect([a.class, a.size, b.class, b.size]).toEqual([c0, s0, c1, s1])
      expect(b.surface).toBe(surface)
    }
  })

  it('places the same moons (SystemVectors.t.sol, test_printMoonVectors)', () => {
    const expected = [
      [1, 129, 4],
      [7, 128, 32],
      [400, 0, 0],
      [12345, 33, 8]
    ]
    for (const [cell, a, b] of expected) {
      expect([moonSlots(DEMO_SEED, cell, 0), moonSlots(DEMO_SEED, cell, 1)]).toEqual([a, b])
    }
  })

  it("draws Sol's moons where they've always been", () => {
    expect(looks(DEMO_SEED, 0, 2).moons.map((m) => m.name)).toEqual(['Luna'])
    expect(looks(DEMO_SEED, 0, 5)).toMatchObject({ rings: 10, stationSize: 10 })
    expect(looks(DEMO_SEED, 0, 5).moons).toHaveLength(6)
    const elsewhere = looks(DEMO_SEED, 12345, 0)
    expect(elsewhere.moons.map((m) => m.orbit)).toEqual([0, 5])
  })

  it('keeps Sol as it was', () => {
    expect(planetCount(DEMO_SEED, 0)).toBe(9)
    expect(planet(DEMO_SEED, 0, 2)).toMatchObject({ class: 0, size: 12 })
  })
})

describe('names of unnamed planets and moons', () => {
  it('names a planet by its class, with its orbit when the class repeats at its star', () => {
    expect(planetName(0, 2, [1, 5, 0])).toBe('Earth')
    expect(planetName(7, 1, [1, 6, 4])).toBe('Unnamed Gaseous Planet')
    expect(planetName(7, 2, [1, 4, 1])).toBe('Unnamed Rocky Planet 3')
    expect(planetName(7, 0, [1, 4, 1])).toBe('Unnamed Rocky Planet 1')
  })

  it("names a moon after a named planet, and an unnamed planet's moons as unnamed", () => {
    expect(moonName('Haven', 1)).toBe('Haven II')
    expect(moonName('Unnamed Ice Planet', 0)).toBe('Unnamed Moon I')
  })
})
