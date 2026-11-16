import { describe, it, expect } from 'vitest'
import { toIndex } from '@orbiter8/sdk/hex'
import { buyCost, sellProceeds, fee } from '@orbiter8/sdk/market'
import { bestLoad, planRoutes, sellOffers } from './routes'
import { plotCourse } from './course'
import { buildAgenda, liveAgenda, nextRound, roundFell } from './agenda'
import { nameProblem, wait } from '../format'

const economy = {
  goods: [
    { name: 'Water ice', base: 40, spread: 30 },
    { name: 'Electronics', base: 260, spread: 130 }
  ],
  capacity: 300,
  tuning: { feeBps: 200 }
}
const port = (id, quotes) => ({ port: id, quotes: quotes.map(([mode, shortfall]) => ({ mode, shortfall })) })

describe('trade routes', () => {
  it('stops loading when the next unit would lose money', () => {
    const load = bestLoad({ good: economy.goods[1], capacity: 300, feeBps: 200, fromShortfall: 0, toShortfall: 0, maxUnits: 300, credits: 1e9 })
    const profit = (u) => {
      const c = buyCost(260, 130, 300, 0, u)
      const p = sellProceeds(260, 130, 300, 0, u)
      return p - fee(p, 200) - c - fee(c, 200)
    }
    expect(load.profit).toBe(profit(load.units))
    expect(profit(load.units + 1)).toBeLessThanOrEqual(load.profit)
    expect(profit(load.units - 1)).toBeLessThan(load.profit)
  })
  it('respects bays, credits and stock', () => {
    const base = { good: economy.goods[1], capacity: 300, feeBps: 200, fromShortfall: 0, toShortfall: 0, maxUnits: 5, credits: 1e9 }
    expect(bestLoad(base).units).toBe(5)
    expect(bestLoad({ ...base, credits: 600 }).units).toBe(2)
    expect(bestLoad({ ...base, fromShortfall: 298, toShortfall: 298 })).toBeNull() // a drained seller is dearer than a sated buyer pays
    expect(bestLoad({ ...base, toShortfall: 299 }).units).toBe(1)
  })
  it('ranks routes by profit and offers the best port for cargo', () => {
    const ports = [port(1, [[1, 0], [1, 0]]), port(2, [[2, 0], [2, 0]]), port(3, [[2, 250], [0, 0]])]
    const routes = planRoutes({ ports, economy, freeBays: 5, credits: 5000 })
    expect(routes[0]).toMatchObject({ good: 1, from: 1, to: 2, units: 5 })
    expect(routes.every((r) => r.profit > 0)).toBe(true)
    const [offer] = sellOffers({ ports, economy, cargo: [10, 0] })
    expect(offer).toMatchObject({ good: 0, port: 2, units: 10 })
  })
})

describe('course', () => {
  const cells = new Map()
  const star = (q, r, extra = {}) => {
    const cell = toIndex(q, r)
    cells.set(cell, { cell, state: 2, partner: 0, ...extra })
    return cell
  }
  const a = star(0, 0)
  const b = star(1, 0)
  const c = star(2, 0)
  const d = star(4, 0)
  it('plots the fewest jumps at the ship’s range', () => {
    expect(plotCourse(cells, a, c, 1).map((l) => l.to)).toEqual([b, c])
    expect(plotCourse(cells, a, c, 2).map((l) => l.to)).toEqual([c])
    expect(plotCourse(cells, a, d, 1)).toBeNull()
    expect(plotCourse(cells, a, d, 2).map((l) => l.to)).toEqual([c, d])
    expect(plotCourse(cells, a, a, 1)).toEqual([])
  })
  it('goes through a black hole to its partner', () => {
    const far = star(20, 0)
    const hole = toIndex(0, 1)
    cells.set(hole, { cell: hole, state: 3, partner: far })
    expect(plotCourse(cells, a, far, 1)).toEqual([{ to: hole, kind: 'jump' }, { to: far, kind: 'traverse' }])
  })
})

describe('agenda', () => {
  it('sorts every timer and keeps actionable ones once due', () => {
    const items = buildAgenda({
      account: '0xme',
      scan: { cell: 7, readyAt: 5000, status: 'waiting' },
      holdings: [{ id: 300, name: 'Haven', building: 1, readyAt: 60, factory: { queue: [{ part: 0, count: 3, readyAt: 30 }] }, siege: { planet: 300, attacker: '0xthem', checkpoint: 100, claimAt: 0 } }],
      sieges: [],
      condition: { dockedUntil: 0 },
      session: { expiry: 10 },
      here: null,
      starName: (c) => `Star ${c}`,
      planetName: (p) => `Planet ${p}`,
      partNames: ['Drone']
    })
    expect(items.map((i) => i.kind)).toEqual(['scan', 'session', 'order', 'build', 'siege'])
    expect(liveAgenda(items, 61_000).map((i) => i.kind)).toEqual(['scan', 'siege'])
  })
})

describe('format', () => {
  it('checks names as the contracts do', () => {
    expect(nameProblem('Ab')).toBeTruthy()
    expect(nameProblem('Nova  One')).toBeTruthy()
    expect(nameProblem(' Nova')).toBeTruthy()
    expect(nameProblem('Nova!')).toBeTruthy()
    expect(nameProblem('Nova-1 _x.')).toBeNull()
  })
  it('writes waits', () => {
    expect(wait(4200)).toBe('5 s')
    expect(wait(65_000)).toBe('1 min 05')
    expect(wait(2 * 3600_000 + 5 * 60_000)).toBe('2 h 05')
  })
})

describe('siege rounds', () => {
  it('counts on from the last checkpoint to the next round after now', () => {
    expect(nextRound(1000, 0)).toBe((1000 + 1800) * 1000)
    expect(nextRound(1000, (1000 + 1799) * 1000)).toBe((1000 + 1800) * 1000)
    expect(nextRound(1000, (1000 + 1800) * 1000)).toBe((1000 + 3600) * 1000)
    expect(nextRound(1000, (1000 + 5 * 1800 + 7) * 1000)).toBe((1000 + 6 * 1800) * 1000)
  })
  it('notices a round falling between two moments', () => {
    expect(roundFell(1000, 1000 * 1000, 2799 * 1000)).toBe(false)
    expect(roundFell(1000, 2799 * 1000, 2800 * 1000)).toBe(true)
    expect(roundFell(1000, 2000 * 1000, 99999 * 1000)).toBe(true)
  })
})
