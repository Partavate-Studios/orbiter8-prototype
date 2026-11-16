import { describe, it, expect } from 'vitest'
import { KIND, bodyId, planetId, cellOf, kindOf, indexOf } from './body-id'

// The same cases as contracts/test/planets/Planets.t.sol test_bodyIds.
describe('body ids', () => {
  it('pack and unpack as BodyId.sol does', () => {
    const id = bodyId(1234, KIND.ASTEROID, 7)
    expect(id).toBe(1234 * 65536 + 256 + 7)
    expect([cellOf(id), kindOf(id), indexOf(id)]).toEqual([1234, KIND.ASTEROID, 7])
    expect(planetId(0, 2)).toBe(2)
    expect(kindOf(planetId(5, 3))).toBe(KIND.PLANET)
  })
})
