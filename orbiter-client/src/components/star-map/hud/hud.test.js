// Smoke tests: the HUD and each menu render with a loaded star system, without Vue errors or warnings.
// These would have caught most of the Vue 3 migration regressions (store mappings to missing getters,
// templates reading fields that moved).
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { createPinia } from 'pinia'
import Hud from './hud.svg.vue'
import { useStarMapStore } from '@/stores/starmap'
import { useGameStateStore } from '@/stores/gamestate'
import { useUIStore } from '@/stores/ui'
import { useDemo4Store } from '@/stores/demo4'
import { blockData } from '@/test/star-system'

const silentAudio = {
  playEffect() {},
  playMusic() {},
  stopMusic() {},
  silenceMusic() {},
  resumeMusic() {},
  speak() {},
  levels: { music: 1, effects: 1, voice: 2 },
  setMusicLevel() {},
  setEffectsLevel() {},
  setVoiceLevel() {}
}

let app, root, problems, ui

beforeEach(() => {
  problems = []
  const pinia = createPinia()
  app = createApp({ render: () => h('svg', [h(Hud)]) })
  app.use(pinia)
  app.config.globalProperties.o8audio = silentAudio
  app.config.errorHandler = (error) => problems.push(error)
  app.config.warnHandler = (message) => problems.push(message)

  const starMap = useStarMapStore(pinia)
  starMap.starId = 7
  starMap.importStarMapBlockData({ blockData: blockData({ withStation: true }), playerAccount: '0xabc' })
  const gameState = useGameStateStore(pinia)
  Object.assign(gameState.gameState.avatar, {
    registered: true,
    name: 'Tester',
    shipId: 5,
    credits: 100,
    ship: { name: 'Wanderer', location: 7, orbit: 1, holds: 10, cargo: [1, 1, 1], usedHolds: 3, owner: '0xabc' }
  })
  gameState.events = { avatarEvents: [], shipEvents: [], tradeEvents: [], chatEvents: [] }
  ui = useUIStore(pinia)

  root = document.createElement('div')
  app.mount(root)
})

afterEach(() => app.unmount())

async function settle() {
  await nextTick()
  await nextTick()
}

describe('HUD', () => {
  it('renders with nothing selected (the scope)', async () => {
    ui.selectSprite(null)
    await settle()
    expect(problems).toEqual([])
  })

  for (const key of ['star', 'planet:1', 'station:1', 'moon:2:0', 'ship:5']) {
    it(`renders the info card for ${key}`, async () => {
      ui.selectSprite(key)
      await settle()
      expect(problems).toEqual([])
    })
  }

  for (const menu of ['planets', 'ships', 'settings', 'chat', 'leaderboard']) {
    it(`opens the ${menu} menu`, async () => {
      ui.openMenu(menu)
      await settle()
      expect(problems).toEqual([])
    })
  }

  for (const menu of ['trade', 'shipyard']) {
    it(`opens the ${menu} menu at a station`, async () => {
      ui.selectSprite('station:1')
      ui.openMenu(menu)
      await settle()
      expect(problems).toEqual([])
    })
  }

  it("lists each planet's port in the planets menu", async () => {
    ui.openMenu('planets')
    await settle()
    expect(root.textContent).toContain('New Station')
    expect(problems).toEqual([])
  })

  it("opens a planet's moons menu from its card", async () => {
    ui.calculateViewableArea({ x: 1440, y: 900 }) // the card menu shows beside the card on a landscape screen
    ui.selectSprite('planet:2')
    await settle()
    const visitMoon = [...root.querySelectorAll('text')].find((text) => text.textContent.trim() === 'Visit Moon')
    // A card button's text sits beside its transparent click target, an <a> in the same group.
    visitMoon.parentNode.querySelector('a').dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    await settle()
    expect([...root.querySelectorAll('text')].some((text) => text.textContent.trim() === 'Moonie')).toBe(true)
    expect(problems).toEqual([])
  })

  it('the star button selects the star, then zooms out toward the neighbor view', async () => {
    ui.selectSprite('ship:5')
    await settle()
    ui.zoomOutToNeighbors()
    await settle()
    expect(ui.selected).toBe('star')
    expect(ui.neighborViewPending).toBe(true)
    expect(problems).toEqual([])
  })
})

describe("HUD on Demo 4's contracts", () => {
  // A Demo 4 pilot (stores/demo4.js) with a planet of their own at this star, under siege.
  beforeEach(async () => {
    const demo4 = useDemo4Store()
    const loadout = { drones: 0, repairBots: 0, pointDefense: 0, railguns: 1, missiles: 0, armor: 0, shields: 0 }
    const side = { platforms: 0, shield: 0, shieldMax: 0, armor: 50, armorMax: 50, hull: 60, pointDefense: 0, railguns: 1, missiles: 0, drones: 0, repairBots: 0, bfg: 0, retreated: false }
    const cost = { credits: 5000, time: 600, people: 100, goods: [[6, 40]] }
    demo4.$patch({
      active: true,
      account: '0xabc',
      economy: { goods: [], tuning: {}, capacity: 300 },
      rules: {
        claimFee: 2000,
        colonistPrice: 10,
        storageCap: 5000,
        buildings: [null, cost, cost, cost, cost, cost, cost, cost],
        parts: Array.from({ length: 9 }, (_, i) => ({ name: 'Part ' + i, credits: 1000, time: 60, planetOnly: i > 6, goods: [] }))
      },
      pilot: { callsign: 'Tester', shipId: 5, ship: { name: 'Wanderer', cell: 7, range: 2, bays: 10, cargo: 3, colonists: 50, rangeLost: 0, baysLost: 0, loadout } },
      planets: [{ id: 1, body: 1, class: 0, size: 12, cap: 12000, owner: '0xabc', level: 1, autofactory: true, building: 0, readyAt: 0, population: 100, stock: [0, 0, 0, 0, 0, 0, 40, 0] }],
      sieges: [{ planet: 1, attacker: '0xdef', started: 0, checkpoint: 0, wornAt: 0, claimAt: 0, ship: side, side }],
      factories: { 1: { queue: [{ part: 3, count: 1, readyAt: 0 }], stored: [0, 0, 0, 2, 0, 0, 0, 0, 0] } },
      defenses: { 1: { pointDefense: 1, railguns: 0, missiles: 0, drones: 0, repairBots: 0, armor: 2, shields: 0, platforms: 0, bfg: 0 } },
      condition: { armorLost: 0, off: [0, 0, 0, 0, 0], retreated: false, dockedUntil: 0 }
    })
    const starMap = useStarMapStore()
    const data = blockData({ withStation: true })
    data.planets[0].owner = '0xabc'
    data.planets[0].station.armory = true
    starMap.importStarMapBlockData({ blockData: data, playerAccount: '0xabc' })
    await settle()
  })

  for (const key of ['planet:1', 'planet:2', 'station:1', 'ship:5', 'star']) {
    it(`offers Demo 4's card menu for ${key}`, async () => {
      ui.selectSprite(key)
      await settle()
      expect(problems).toEqual([])
    })
  }

  for (const [menu, key] of [
    ['colony', 'planet:1'],
    ['armory', 'station:1'],
    ['loadout', 'ship:5'],
    ['siege', 'planet:1']
  ]) {
    it(`opens the ${menu} menu`, async () => {
      ui.selectSprite(key)
      ui.openMenu(menu)
      await settle()
      expect(root.querySelectorAll('text').length).toBeGreaterThan(3)
      expect(problems).toEqual([])
    })
  }
})

describe('Neighbor view', () => {
  it('renders the neighbors and the route to a chosen one', async () => {
    const { default: NeighborView } = await import('./neighbor-view.svg.vue')
    const view = createApp({ render: () => h('svg', [h(NeighborView)]) })
    const pinia = createPinia()
    view.use(pinia)
    view.config.globalProperties.o8audio = silentAudio
    const viewProblems = []
    view.config.errorHandler = (error) => viewProblems.push(error)
    view.config.warnHandler = (message) => viewProblems.push(message)
    useStarMapStore(pinia).neighbors = {
      0: { id: 1, name: 'Sol' },
      1: { id: 0, name: 'Unexplored Star' },
      2: { id: 8, name: 'Unexplored Star' }
    }
    const viewRoot = document.createElement('div')
    view.mount(viewRoot)
    await settle()
    const labels = [...viewRoot.querySelectorAll('text')].map((text) => text.textContent.trim())
    expect(labels).toContain('Sol')
    expect(labels.filter((label) => label === 'Unexplored')).toHaveLength(1) // id 0 is an empty slot
    viewRoot.querySelector('a').dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    await settle()
    expect(viewRoot.querySelector('.chosen-route')).not.toBe(null)
    expect(viewProblems).toEqual([])
    view.unmount()
  })
})
