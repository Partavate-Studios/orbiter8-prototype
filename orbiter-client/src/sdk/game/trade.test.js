import { describe, expect, it } from 'vitest'
import {
  emptyHolds,
  lineValue,
  tradeBalance,
  emptyHoldsAfterTrade,
  isValidTrade,
  maxTradable,
  clampTradeAmount,
  maxHoldsToBuy,
  canAfford,
  cargoLines,
  MAX_CARGO_HOLDS
} from './trade'
import { buyCost, sellProceeds, fee } from '@/sdk/v4/market'

const ship = { holds: 10, usedHolds: 6, cargo: [2, 1, 3] }
// Demo 3's flat prices
const goods = [
  { id: 0, name: 'Equipment', mode: 'sells', stock: 10, price: 50, curve: null },
  { id: 1, name: 'Fuel Ore', mode: 'sells', stock: 1, price: 20, curve: null },
  { id: 2, name: 'Organics', mode: 'buys', stock: 2, price: 10, curve: null }
]

describe('cargo', () => {
  it('counts free holds', () => {
    expect(emptyHolds(ship)).toBe(4)
  })

  it("lists Demo 3's three goods always, and Demo 4's only when aboard", () => {
    expect(cargoLines(ship, ['Equipment', 'Fuel Ore', 'Organics'])).toEqual([
      { name: 'Equipment', units: 2 },
      { name: 'Fuel Ore', units: 1 },
      { name: 'Organics', units: 3 }
    ])
    const names = ['Water ice', 'Metals', 'Rare elements', 'Helium-3', 'Organics', 'Silicon', 'Equipment', 'Electronics']
    expect(cargoLines({ holds: 5, usedHolds: 4, cargo: [0, 0, 0, 0, 4, 0, 0, 0] }, names)).toEqual([
      { name: 'Organics', units: 4 }
    ])
  })
})

describe('trading', () => {
  it('buying costs credits and fills holds; selling earns and frees them', () => {
    const buy = { 0: 2 }
    expect(tradeBalance(buy, goods)).toBe(-100)
    expect(emptyHoldsAfterTrade(ship, buy)).toBe(2)
    const sell = { 2: -3 }
    expect(tradeBalance(sell, goods)).toBe(30)
    expect(emptyHoldsAfterTrade(ship, sell)).toBe(7)
  })

  it("prices Demo 4's goods by the unit, fee included", () => {
    const curve = { base: 100, spread: 30, capacity: 300, shortfall: 40, feeBps: 200 }
    const good = { id: 4, mode: 'sells', stock: 260, price: 0, curve }
    const cost = buyCost(100, 30, 300, 40, 5)
    expect(lineValue(good, 5)).toBe(cost + fee(cost, 200))
    const proceeds = sellProceeds(100, 30, 300, 40, 5)
    expect(lineValue(good, -5)).toBe(proceeds - fee(proceeds, 200))
  })

  it('a trade must be non-empty, affordable and fit', () => {
    expect(isValidTrade({ credits: 100, ship, amounts: {}, goods })).toBe(false)
    expect(isValidTrade({ credits: 100, ship, amounts: { 0: 2 }, goods })).toBe(true)
    expect(isValidTrade({ credits: 99, ship, amounts: { 0: 2 }, goods })).toBe(false)
    expect(isValidTrade({ credits: 9999, ship, amounts: { 0: 5 }, goods })).toBe(false)
  })

  it('limits each good by what the port buys or sells', () => {
    // port buying: sell what you carry, up to what it wants
    expect(maxTradable({ mode: 'buys', stock: 10 }, 3, 4)).toBe(3)
    expect(maxTradable({ mode: 'buys', stock: 2 }, 3, 4)).toBe(2)
    // port selling: buy what fits, up to what it has
    expect(maxTradable({ mode: 'sells', stock: 10 }, 3, 4)).toBe(4)
    expect(maxTradable({ mode: 'sells', stock: 1 }, 3, 4)).toBe(1)
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
  it('exactly enough credits is enough', () => {
    expect(canAfford(100, 100)).toBe(true)
    expect(canAfford(99, 100)).toBe(false)
  })

  it('limits holds to the contract maximum and to what the player can pay', () => {
    expect(maxHoldsToBuy(1000, 10, 100)).toBe(10)
    expect(maxHoldsToBuy(1e9, MAX_CARGO_HOLDS - 5, 1)).toBe(5)
    expect(maxHoldsToBuy(150, 10, 100)).toBe(1)
  })
})
