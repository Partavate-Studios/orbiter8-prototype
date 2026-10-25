// The game client against a scripted chain: when it reloads, and what subscribers hear.
import { beforeEach, describe, expect, it, vi } from 'vitest'

const chain = vi.hoisted(() => ({ block: 0, gameChanged: false, scanned: [] }))
const loads = vi.hoisted(() => ({ player: 0, events: 0, system: 0, failSystem: false, releaseSystem: null }))

vi.mock('@/sdk/chain/contracts', () => ({
  getBlockNumber: async () => chain.block,
  gameChangedBetween: async (from, to) => {
    chain.scanned.push([from, to])
    return chain.gameChanged
  },
  initContracts: async () => true,
  contractAddresses: () => ({ game: '0xgame', avatars: '0xavatars' }),
  galaxy: {
    getPlanetToken: async () => '0xplanets',
    getShipToken: async () => '0xships',
    getCreditToken: async () => '0xcredits'
  },
  getNativeBalance: async () => '1.0'
}))
vi.mock('@/sdk/load', () => ({
  loadPlayer: async () => ({ load: ++loads.player }),
  loadRecentEvents: async (block) => ({ load: ++loads.events, block }),
  loadSystem: async (onProgress) => {
    onProgress(50)
    if (loads.releaseSystem) await new Promise((resolve) => (loads.releaseSystem = resolve))
    if (loads.failSystem) throw new Error('node down')
    return { load: ++loads.system }
  }
}))

vi.mock('@/sdk/actions', () => ({
  sendChat: async (message) => ({ status: 1, message })
}))

const { createGameClient } = await import('./client')

let game, changes
beforeEach(() => {
  Object.assign(chain, { block: 0, gameChanged: false, scanned: [] })
  Object.assign(loads, { player: 0, events: 0, system: 0, failSystem: false, releaseSystem: null })
  game = createGameClient()
  changes = []
  game.subscribe((change) => changes.push(change))
})

describe('watching blocks', () => {
  it('loads everything on the first block it sees', async () => {
    chain.block = 10
    await game.checkForNewBlock()
    await vi.waitFor(() => expect(game.state.system).toEqual({ load: 1 }))
    expect(game.state.blockNumber).toBe(10)
    expect(game.state.player).toEqual({ load: 1 })
    expect(game.state.events).toEqual({ load: 1, block: 10 })
    expect(chain.scanned).toEqual([]) // nothing to compare against yet
  })

  it("skips blocks that don't touch the game, and reloads after one that does", async () => {
    chain.block = 10
    await game.checkForNewBlock()
    await vi.waitFor(() => expect(loads.system).toBe(1))

    chain.block = 12
    await game.checkForNewBlock()
    expect(chain.scanned).toEqual([[10, 12]])
    expect(game.state.blockNumber).toBe(12)
    expect(loads.player).toBe(1)

    chain.block = 13
    chain.gameChanged = true
    await game.checkForNewBlock()
    await vi.waitFor(() => expect(loads.system).toBe(2))
    expect(loads.player).toBe(2)
  })

  it('ignores a check while one is in flight, and a block number it has already seen', async () => {
    chain.block = 10
    await Promise.all([game.checkForNewBlock(), game.checkForNewBlock()])
    await game.checkForNewBlock()
    await vi.waitFor(() => expect(loads.system).toBe(1))
    expect(changes.filter((change) => change === 'block')).toHaveLength(1)
  })
})

describe('reloading the system', () => {
  it("doesn't start a second load while one is running", async () => {
    loads.releaseSystem = true
    const first = game.refreshSystem()
    await vi.waitFor(() => expect(typeof loads.releaseSystem).toBe('function'))
    const second = game.refreshSystem()
    expect(game.state.loading.system).toBe(true)
    loads.releaseSystem()
    await Promise.all([first, second])
    expect(loads.system).toBe(1)
    expect(game.state.loading.system).toBe(false)
    expect(changes).toContain('systemProgress')
  })

  it('reports a failed load and keeps the previous system', async () => {
    await game.refreshSystem()
    loads.failSystem = true
    await game.refreshSystem()
    expect(game.state.system).toEqual({ load: 1 })
    const failure = changes.find((change) => typeof change === 'object')
    expect(failure.what).toBe('system')
    expect(failure.error.message).toBe('node down')
    expect(game.state.loading.system).toBe(false)
  })
})

describe('contracts', () => {
  it('watches the game, avatar and token contracts once bound', async () => {
    expect(await game.bindContracts()).toBe(true)
    expect(Object.values(game.state.contracts)).toEqual(['0xgame', '0xavatars', '0xplanets', '0xships', '0xcredits'])
    expect(changes).toContain('contracts')
  })
})

describe("the player's own actions", () => {
  it('reload the game once mined, whatever kind of wallet sent them', async () => {
    // Smart-account transactions don't go to the game directly, so the block check can't be relied on.
    const receipt = await game.actions.sendChat('hello')
    expect(receipt.message).toBe('hello')
    await vi.waitFor(() => expect(loads.system).toBe(1))
    expect(loads.player).toBe(1)
    expect(loads.events).toBe(1)
  })
})
