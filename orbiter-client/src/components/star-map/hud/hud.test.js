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
import { blockData } from '@/test/star-system'

const silentAudio = {
  playEffect() {},
  playMusic() {},
  stopMusic() {},
  silenceMusic() {},
  resumeMusic() {},
  getMusicVolume: () => 0.25,
  getEffectsVolume: () => 0.25,
  setMusicVolume() {},
  setEffectsVolume() {}
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
    ship: { name: 'Wanderer', location: 7, orbit: 1, holds: 10, equipment: 1, fuel: 1, organics: 1, owner: '0xabc' }
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

  for (const menu of ['planets', 'ships', 'settings', 'chat']) {
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

  it('opens the jump menu', async () => {
    ui.jumpMenuOn()
    await settle()
    expect(problems).toEqual([])
  })
})
