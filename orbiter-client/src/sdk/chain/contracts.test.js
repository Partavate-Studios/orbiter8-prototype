// gameChangedBetween decides whether new blocks need a reload: a wrong answer either reloads on
// every block or misses changes, so it's tested against scripted blocks.
import { describe, expect, it, vi } from 'vitest'

const blocks = vi.hoisted(() => ({}))
vi.mock('./wallet', () => ({
  getSession: () => ({
    provider: {
      getBlock: async (number) => (number in blocks ? { prefetchedTransactions: blocks[number] } : null)
    }
  })
}))

const { gameChangedBetween } = await import('./contracts')
const GAME = '0x00000000000000000000000000000000000000Aa'
const tx = (to) => ({ to })

describe('gameChangedBetween', () => {
  it('is false when no new block sends anything to the watched contracts', async () => {
    Object.assign(blocks, { 11: [tx('0x1234'), tx(null)], 12: [] })
    expect(await gameChangedBetween(10, 12, [GAME])).toBe(false)
  })

  it('is true when a new block sends a transaction to one, whatever the address case', async () => {
    Object.assign(blocks, { 11: [], 12: [tx(GAME.toLowerCase())] })
    expect(await gameChangedBetween(10, 12, [GAME, null])).toBe(true)
  })

  it("doesn't look at the block it already accounted for", async () => {
    Object.assign(blocks, { 10: [tx(GAME)], 11: [] })
    expect(await gameChangedBetween(10, 11, [GAME])).toBe(false)
  })

  it('assumes a change when a block is missing or too many blocks went by', async () => {
    expect(await gameChangedBetween(10, 13, [GAME])).toBe(true) // block 13 isn't available
    expect(await gameChangedBetween(10, 100, [GAME])).toBe(true) // cheaper to reload than to scan 90 blocks
  })
})
