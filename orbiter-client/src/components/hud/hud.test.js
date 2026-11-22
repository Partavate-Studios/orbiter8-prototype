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

  for (const menu of ['objects', 'planets', 'ships', 'ports', 'settings', 'chat', 'leaderboard']) {
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

  it("lists everything here, each planet's station folded inside it", async () => {
    ui.selectSprite('planet:1')
    ui.openMenu('objects')
    ui.setList('all')
    await settle()
    const panel = root.querySelector('.objects-panel')
    // the selection's planet is unfolded, so its station shows
    expect(panel.textContent).toContain('New Station')
    // pressing a row selects it and leaves the list open; Go closes it
    ;[...panel.querySelectorAll('.row .body')].find((row) => /New Station/.test(row.textContent)).click()
    await settle()
    expect(ui.selected).toBe('station:1')
    expect(ui.menuState.objectsMenu).toBe(true)
    panel.querySelector('.row.on .go').click()
    await settle()
    expect(ui.menuState.objectsMenu).toBe(false)
    expect(problems).toEqual([])
  })

  it('the old planets, ports and ships menus open the list on that kind', async () => {
    ui.openMenu('ports')
    await settle()
    expect(ui.menuState.objectsMenu).toBe(true)
    expect(ui.listKind).toBe('station')
    // the ports menu's rows, kept whole
    expect(root.querySelector('.ports-panel.embedded .port')).not.toBe(null)
    ui.setList('station', 'buying')
    await settle()
    expect(problems).toEqual([])
  })

  it("shows a moon from its planet's tab, and goes back from the lit tab", async () => {
    ui.selectSprite('planet:2')
    await settle()
    // going to the moon is a tab, not an action as well
    expect([...root.querySelectorAll('.action-row button')].some((button) => /Visit/.test(button.title))).toBe(false)
    const tabs = () => [...root.querySelectorAll('.spine .tab')]
    // the planet's own tab is first and lit
    expect(tabs()[0].classList.contains('on')).toBe(true)
    tabs().at(-1).click()
    await settle()
    expect(ui.selected).toBe('moon:2:0')
    // the heading is the planet's name and the moon's, and the tabs are still there
    expect(root.querySelector('.heading.joined .home')).not.toBe(null)
    expect(tabs().at(-1).classList.contains('on')).toBe(true)
    tabs().at(-1).click()
    await settle()
    expect(ui.selected).toBe('planet:2')
    expect(problems).toEqual([])
  })

  it('gives a card one main action, and the rest as wells', async () => {
    ui.selectSprite('station:1')
    await settle()
    expect(root.querySelector('.action-row .pill').textContent).toMatch(/Trade/)
    expect(root.querySelectorAll('.action-row .pill').length).toBe(1)
    ui.selectSprite('planet:1')
    await settle()
    expect(root.querySelector('.action-row .pill').textContent).toMatch(/Colony/)
    expect(problems).toEqual([])
  })

  it("opens a pilot's info card, with their record still to come", async () => {
    ui.openProfile('0xabc')
    await settle()
    expect(ui.menuState.profileMenu).toBe(true)
    expect(root.querySelector('.profile-panel')).not.toBe(null)
    expect(problems).toEqual([])
  })

  it('always holds a card: with nothing selected, your ship', async () => {
    ui.selectSprite(null)
    await settle()
    expect(ui.selected).toBe(null)
    expect(root.querySelector('.card3.ship')).not.toBe(null)
    expect(root.querySelector('.action-row .pill').textContent).toMatch(/Jump/)
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
    expect(ui.menuState.objectsMenu).toBe(false)
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
    expect(labels()).toEqual(expect.arrayContaining(['My ship', 'Objects', 'Map', 'Chat', 'More']))
    expect(labels()).not.toContain('Settings')
    root.querySelector('button.rim-button[aria-label="More"]').click()
    await settle()
    expect(labels()).toEqual(expect.arrayContaining(['Star', 'Help', 'Sieges', 'Ranks', 'Settings']))
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
