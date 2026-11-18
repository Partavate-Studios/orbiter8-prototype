// Smoke tests: the HUD and each menu render with a loaded star system, without Vue errors or warnings.
// These would have caught most of the Vue 3 migration regressions (store mappings to missing getters,
// templates reading fields that moved).
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { createPinia } from 'pinia'
import Hud from './hud-overlay.vue'
import { useStarMapStore } from '@/stores/starmap'
import { useGameStateStore } from '@/stores/gamestate'
import { useUIStore } from '@/stores/ui'
import { usePlayerStore } from '@/stores/player'
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
  app = createApp({ render: () => h(Hud) })
  app.use(pinia)
  app.config.globalProperties.o8audio = silentAudio
  app.config.errorHandler = (error) => problems.push(error)
  app.config.warnHandler = (message) => problems.push(message)

  const starMap = useStarMapStore(pinia)
  starMap.starId = 7
  const data = blockData({ withStation: true })
  data.planets[0].owner = '0xabc'
  starMap.importStarMapBlockData({ blockData: data, playerAccount: '0xabc' })
  const gameState = useGameStateStore(pinia)
  Object.assign(gameState.gameState.avatar, {
    registered: true,
    name: 'Tester',
    shipId: 5,
    credits: 100,
    ship: { name: 'Wanderer', location: 7, orbit: 1, holds: 10, cargo: [0, 0, 0, 0, 3], usedHolds: 3, owner: '0xabc' }
  })
  gameState.gameState.goods = ['Water ice', 'Metals', 'Rare elements', 'Helium-3', 'Organics', 'Silicon', 'Equipment', 'Electronics']
  gameState.events = { avatarEvents: [], shipEvents: [], tradeEvents: [], chatEvents: [] }
  // A pilot with a planet of their own at this star, under siege (stores/player.js).
  const player = usePlayerStore(pinia)
  const loadout = { drones: 0, repairBots: 0, pointDefense: 0, railguns: 1, missiles: 0, armor: 0, shields: 0 }
  const side = { platforms: 0, shield: 0, shieldMax: 0, armor: 50, armorMax: 50, hull: 60, pointDefense: 0, railguns: 1, missiles: 0, drones: 0, repairBots: 0, bfg: 0, retreated: false }
  const cost = { credits: 5000, time: 600, people: 100, goods: [[6, 40]] }
  player.$patch({
    account: '0xabc',
    economy: { goods: [], tuning: { bayBase: 200, bayStep: 8, rangePrices: [15000, 150000, 600000] }, capacity: 300 },
    rules: {
      claimFee: 2000,
      colonistPrice: 10,
      storageCap: 5000,
      buildings: [null, cost, cost, cost, cost, cost, cost, cost],
      parts: Array.from({ length: 10 }, (_, i) => ({ name: 'Part ' + i, credits: 1000, time: 60, planetOnly: i === 7 || i === 8, goods: [] }))
    },
    pilot: { callsign: 'Tester', shipId: 5, ship: { name: 'Wanderer', cell: 7, range: 2, bays: 10, cargo: 3, colonists: 50, rangeLost: 0, baysLost: 0, loadout } },
    planets: [{ id: 1, body: 1, class: 0, size: 12, cap: 12000, owner: '0xabc', level: 1, autofactory: true, building: 0, readyAt: 0, population: 100, stock: [0, 0, 0, 0, 0, 0, 40, 0] }],
    sieges: [{ planet: 1, attacker: '0xdef', started: 0, checkpoint: 0, wornAt: 0, claimAt: 0, ship: side, side }],
    factories: { 1: { queue: [{ part: 3, count: 1, readyAt: 0 }], stored: [0, 0, 0, 2, 0, 0, 0, 0, 0] } },
    feed: [{ event: 'SiegeStarted', planet: 1, who: '0xdef', args: [1, '0xdef', '0xabc'], block: 1 }],
    defenses: { 1: { pointDefense: 1, railguns: 0, missiles: 0, drones: 0, repairBots: 0, armor: 2, shields: 0, platforms: 0, bfg: 0 } },
    condition: { armorLost: 0, off: [0, 0, 0, 0, 0], retreated: false, dockedUntil: 0 }
  })
  ui = useUIStore(pinia)
  ui.calculateViewableArea({ x: 1440, y: 900 })

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

  it("goes to a planet's moon from the nearby strip, and back to the planet", async () => {
    ui.selectSprite('planet:2')
    await settle()
    // the moon is a chip, not a "Visit Moon" button as well (round 2, item 4)
    expect([...root.querySelectorAll('button.action')].some((button) => /Visit/.test(button.textContent))).toBe(false)
    const chip = (key) => [...root.querySelectorAll('.nearby-strip .chip')].find((c) => c.textContent.trim() === key)
    chip(useStarMapStore().systemObjects['moon:2:0'].name).click()
    await settle()
    expect(ui.selected).toBe('moon:2:0')
    chip(useStarMapStore().systemObjects['planet:2'].name).click()
    await settle()
    expect(ui.selected).toBe('planet:2')
    expect(problems).toEqual([])
  })

  it('keeps each action in its own slot', async () => {
    ui.selectSprite('station:1')
    await settle()
    const station = [...root.querySelectorAll('.list > .action')].map((slot) => slot.textContent.trim().replace(/^\d/, ''))
    expect(station[0]).toBe('Trade at Port')
    // a planet: an empty slot keeps Siege, Recruit, market and Rename in their places
    ui.selectSprite('planet:1')
    await settle()
    const slots = [...root.querySelectorAll('.list > .action')]
    expect(slots[0].textContent).toMatch(/Colony/)
    expect(problems).toEqual([])
  })

  it('slides the menu in behind the card and out again', async () => {
    ui.selectSprite('station:1')
    ui.toggleActions(true)
    await settle()
    const tab = root.querySelector('.drawer .tab')
    expect(root.querySelector('.drawer.open')).not.toBe(null)
    tab.click()
    await settle()
    expect(root.querySelector('.drawer.open')).toBe(null)
    expect(root.querySelector('.drawer .inside').hasAttribute('inert')).toBe(true)
    tab.click()
    await settle()
    expect(root.querySelector('.drawer.open')).not.toBe(null)
    expect(problems).toEqual([])
  })

  it('steps through the system from the strip on the card', async () => {
    ui.selectSprite('star')
    await settle()
    root.querySelector('.system-strip [aria-label="Next"]').click()
    await settle()
    expect(ui.selected).toBe('planet:1')
    expect(problems).toEqual([])
  })

  it('keeps the rim while a menu is open, and swaps menus from the dock', async () => {
    ui.openMenu('planets')
    await settle()
    const button = (label) => [...root.querySelectorAll('button.rim-button')].find((b) => b.getAttribute('aria-label') === label)
    expect(root.querySelector('.pilot-plate')).not.toBeNull()
    button('Settings').click()
    await settle()
    expect(ui.menuState.settingsMenu).toBe(true)
    expect(ui.menuState.planetsMenu).toBe(false)
    button('Settings').click()
    await settle()
    expect(ui.menuState.settingsMenu).toBe(false)
    expect(problems).toEqual([])
  })

  it('lays out a portrait phone: tabs, and the rest under More', async () => {
    ui.calculateViewableArea({ x: 390, y: 844 })
    ui.selectSprite('station:1')
    await settle()
    const labels = () => [...root.querySelectorAll('button.rim-button')].map((b) => b.getAttribute('aria-label'))
    expect(labels()).toEqual(expect.arrayContaining(['My ship', 'Star', 'Planets', 'Chat', 'More']))
    expect(labels()).not.toContain('Settings')
    root.querySelector('button.rim-button[aria-label="More"]').click()
    await settle()
    expect(labels()).toEqual(expect.arrayContaining(['Ships', 'Jump', 'Help', 'Sieges', 'Ranks', 'Settings']))
    expect(problems).toEqual([])
  })

  it('shows what the ship carries in the cargo list', async () => {
    root.querySelector('button.cargo').click()
    await settle()
    expect(root.querySelector('.cargo-list').textContent).toContain('Organics')
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

describe('HUD: the pilot', () => {
  for (const key of ['planet:1', 'planet:2', 'station:1', 'ship:5', 'star']) {
    it(`offers the card menu for ${key}`, async () => {
      ui.selectSprite(key)
      await settle()
      expect(problems).toEqual([])
    })
  }

  for (const [menu, key] of [
    ['colony', 'planet:1'],
    ['armory', 'station:1'],
    ['loadout', 'ship:5'],
    ['siege', 'planet:1'],
    ['feed', null],
    ['help', null]
  ]) {
    it(`opens the ${menu} menu`, async () => {
      ui.selectSprite(key)
      ui.openMenu(menu)
      await settle()
      expect(root.querySelectorAll('text').length).toBeGreaterThan(1)
      expect(problems).toEqual([])
    })
  }
})
