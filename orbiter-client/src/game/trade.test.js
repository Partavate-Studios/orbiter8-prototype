import { describe, expect, it } from 'vitest'
import {
  usedHolds, emptyHolds, tradeBalance, emptyHoldsAfterTrade, isValidTrade, maxTradable,
  clampTradeAmount, maxHoldsToBuy, MAX_CARGO_HOLDS
} from './trade'

const ship = { holds: 10, equipment: 2, fuel: 1, organics: 3 }
const prices = { equipment: 50, fuel: 20, organics: 10 }
const none = { equipment: 0, fuel: 0, organics: 0 }

describe('cargo', () => {
  it('counts used and free holds', () => {
    expect(usedHolds(ship)).toBe(6)
    expect(emptyHolds(ship)).toBe(4)
  })
})

describe('trading', () => {
  it('buying costs credits and fills holds; selling earns and frees them', () => {
    const buy = { equipment: 2, fuel: 0, organics: 0 }
    expect(tradeBalance(buy, prices)).toBe(-100)
    expect(emptyHoldsAfterTrade(ship, buy)).toBe(2)
    const sell = { equipment: 0, fuel: 0, organics: -3 }
    expect(tradeBalance(sell, prices)).toBe(30)
    expect(emptyHoldsAfterTrade(ship, sell)).toBe(7)
  })

  it('a trade must be non-empty, affordable and fit', () => {
    expect(isValidTrade({ credits: 100, ship, amounts: none, prices })).toBe(false)
    expect(isValidTrade({ credits: 100, ship, amounts: { equipment: 2, fuel: 0, organics: 0 }, prices })).toBe(true)
    expect(isValidTrade({ credits: 99, ship, amounts: { equipment: 2, fuel: 0, organics: 0 }, prices })).toBe(false)
    expect(isValidTrade({ credits: 9999, ship, amounts: { equipment: 5, fuel: 0, organics: 0 }, prices })).toBe(false)
  })

  it('limits each good by what the port buys or sells', () => {
    // port buying (negative inventory): sell what you carry, up to what it wants
    expect(maxTradable(-10, 3, 4)).toBe(3)
    expect(maxTradable(-2, 3, 4)).toBe(2)
    // port selling: buy what fits, up to what it has
    expect(maxTradable(10, 3, 4)).toBe(4)
    expect(maxTradable(1, 3, 4)).toBe(1)
  })

  it('clamps slider moves to the free holds', () => {
    expect(clampTradeAmount(5, 0, 4)).toBe(4) // can't buy past the free holds
    expect(clampTradeAmount(3, 0, 4)).toBe(3)
    expect(clampTradeAmount(1, 3, 1)).toBe(1) // buying less is always fine
    expect(clampTradeAmount(-3, 0, 0)).toBe(-3) // selling needs no room
    expect(clampTradeAmount(-1, -3, 0)).toBe(-3) // selling less refills holds: needs room
    expect(clampTradeAmount(-1, -3, 1)).toBe(-2)
  })
})

describe('shipyard', () => {
  it('limits holds to the contract maximum and to what the player can pay', () => {
    expect(maxHoldsToBuy(1000, 10, 100)).toBe(10)
    expect(maxHoldsToBuy(1e9, MAX_CARGO_HOLDS - 5, 1)).toBe(5)
    expect(maxHoldsToBuy(150, 10, 100)).toBe(1)
  })
})
