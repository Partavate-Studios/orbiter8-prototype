// Sol is star system 0: everything orbiting the star must still be drawn there (it once wasn't:
// the world layer skipped star ids that weren't above 0).
import { describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { createPinia } from 'pinia'
import SolarSystem from './_solarsystem.svg.vue'
import { useStarMapStore } from '@/stores/starmap'
import { blockData } from '@/test/star-system'

const silentAudio = { playEffect() {}, playMusic() {}, speak() {} }

describe('the world layer', () => {
  for (const id of [0, 7]) {
    it(`draws the star and the ships orbiting it in system ${id}`, async () => {
      const pinia = createPinia()
      const app = createApp({ render: () => h('svg', [h(SolarSystem)]) })
      app.use(pinia)
      app.config.globalProperties.o8audio = silentAudio
      const data = blockData()
      data.id = id
      data.ships[5].orbit = null // orbiting the star, not a planet
      useStarMapStore(pinia).importStarMapBlockData({ blockData: data, playerAccount: '0xabc' })
      const root = document.createElement('div')
      app.mount(root)
      await nextTick()
      expect(root.querySelectorAll('g').length).toBeGreaterThan(5)
      app.unmount()
    })
  }
})
