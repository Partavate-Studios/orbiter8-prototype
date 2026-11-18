import { describe, it, expect } from 'vitest'
import { jumpSlide, JUMP_DEPART_MS, JUMP_ARRIVE_MS, STREAKS_FILL_MS } from './jump-slide'

// Koda, 2026-11-17: the streaks never come in with the ship, and always from the right.
describe('jumpSlide streaks', () => {
  it('shows no streaks while the ship slides in', () => {
    for (const ms of [0, JUMP_DEPART_MS / 2, JUMP_DEPART_MS]) expect(jumpSlide('depart', ms).streaks).toEqual({ from: 1, to: 1 })
  })
  it('fills them in from the right edge once the cruise begins', () => {
    const early = jumpSlide('cruise', STREAKS_FILL_MS / 4).streaks
    expect(early.to).toBe(1)
    expect(early.from).toBeGreaterThan(0)
    expect(early.from).toBeLessThan(1)
    expect(jumpSlide('cruise', STREAKS_FILL_MS).streaks).toEqual({ from: 0, to: 1 })
  })
  it('lets the last ones stream out to the left on arrival', () => {
    const mid = jumpSlide('arrive', JUMP_ARRIVE_MS * 0.4).streaks
    expect(mid.from).toBe(0)
    expect(mid.to).toBeLessThan(1)
    expect(jumpSlide('arrive', JUMP_ARRIVE_MS).streaks.to).toBe(0)
  })
})
