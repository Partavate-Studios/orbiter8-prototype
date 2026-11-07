import { describe, it, expect } from 'vitest'
import { buyCost, sellProceeds, restocked, restock, baysCost, fee, portId, portCell, portBody } from './market'

describe('market pricing matches the contracts', () => {
  it('reproduces the Solidity values (contracts/test/vectors/PricingVectors.t.sol)', () => {
    const d = [0, 7, 199, 390]
    const n = [1, 3, 50, 10]
    const expected = [
      [151, 259, 0],
      [459, 771, 0],
      [10065, 10435, 575],
      [2398, 1702, 1148]
    ]
    d.forEach((shortfall, i) => {
      expect([
        buyCost(160, 90, 400, shortfall, n[i]),
        sellProceeds(160, 90, 400, shortfall, n[i]),
        restocked(shortfall * 3, 1234, 400, 21600)
      ]).toEqual(expected[i])
    })
    expect(restock(90, 1000, 1700, 400, 21600)).toEqual([78, 1648])
    expect([baysCost(200, 4, 17, 33), fee(12345, 200), fee(50, 200)]).toEqual([10956, 247, 1])
  })

  it('names ports by star and body', () => {
    expect(portId(0, 2)).toBe(2)
    expect(portCell(portId(1234, 5))).toBe(1234)
    expect(portBody(portId(1234, 5))).toBe(5)
  })
})
