import { TIMING } from '@/constants'
import { defineStore } from 'pinia'
import Cookies from 'js-cookie'

export const useConfigStore = defineStore('Config', {
  state: () => ({
    blockCheckDelay: TIMING.BLOCK_POLL_MS,
    // 1 = low, 2 = normal, 3 = high. Saved in a cookie.
    graphicsQuality: Number(Cookies.get('graphicsQuality')) || 2
  }),
  getters: {
    /** Minimum ms between game ticks: the low tier ticks at ~30 fps, the others every animation frame. */
    tickDelay: state => state.graphicsQuality === 1 ? TIMING.LOW_TIER_TICK_MS : 0
  },
  actions: {
    /** Steps down through the tiers (3 → 2 → 1 → 3); bound to the ~ key. */
    toggleGraphicsQuality () {
      this.setGraphicsQuality(((this.graphicsQuality + 1) % 3) + 1)
    },
    setGraphicsQuality (value) {
      this.graphicsQuality = Math.min(3, Math.max(1, value))
      Cookies.set('graphicsQuality', this.graphicsQuality, { expires: 30 })
    }
  }
})
