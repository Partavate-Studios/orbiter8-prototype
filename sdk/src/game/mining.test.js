import { describe, expect, it } from 'vitest'
import { miningProgress } from './mining.js'

// 4 drones at 1,875 thousandths an hour each: 7.5 units an hour, so 5 bays fill in 40 minutes.
const mining = { since: 1_000, rate: 7_500, room: 5 }
const at = (seconds) => (1_000 + seconds) * 1000

describe('miningProgress', () => {
  it('is null when not mining', () => {
    expect(miningProgress(null, at(0))).toBeNull()
    expect(miningProgress({ since: 0, rate: 7_500, room: 5 }, at(0))).toBeNull()
  })

  it('counts whole units, as the contract does', () => {
    expect(miningProgress(mining, at(0))).toMatchObject({ mined: 0, fraction: 0, full: false, secondsLeft: 2400 })
    expect(miningProgress(mining, at(479))).toMatchObject({ mined: 0 })
    expect(miningProgress(mining, at(480))).toMatchObject({ mined: 1, fraction: 0.2, secondsLeft: 1920 })
  })

  it('counts the drones the contract counted when mining started', () => {
    expect(miningProgress(mining, at(0)).drones).toBe(4)
    expect(miningProgress({ ...mining, rate: 1_875 }, at(0)).drones).toBe(1)
  })

  it('stops at the room it started with', () => {
    expect(miningProgress(mining, at(2400))).toMatchObject({ mined: 5, fraction: 1, full: true, secondsLeft: 0 })
    expect(miningProgress(mining, at(9999))).toMatchObject({ mined: 5, fraction: 1, full: true })
  })
})
