import { TIMING } from '@/constants'
import { defineStore } from 'pinia'
import Cookies from 'js-cookie'

export const useConfigStore = defineStore('Config', {
  state: () => ({
    showMinerva: false, // todo: move this to UI
    // Minimum ms between game ticks per graphics tier (0 = every animation frame).
    tickDelayHigh: 0,
    tickDelayNormal: 0,
    tickDelayLow: TIMING.LOW_TIER_TICK_MS,
    tickDelay: 0,
    blockCheckDelay: TIMING.BLOCK_POLL_MS,
    graphicsQuality: Number(Cookies.get('graphicsQuality')) || 2,
    showScope: true
  }),
  getters: {
    minerva: state => state.showMinerva
  },
  actions: {
    setTickDelay (delay) {
      this.tickDelay = delay
    },
    toggleMinerva () {
      this.showMinerva = !this.showMinerva
    },
    toggleGraphicsQuality () {
      this.graphicsQuality = ((this.graphicsQuality + 1 ) % 3) + 1
      if (this.graphicsQuality < 2) {
        this.tickDelay = this.tickDelayLow
      } else if (this.graphicsQuality > 2) {
        this.tickDelay = this.tickDelayHigh
      } else {
        this.tickDelay = this.tickDelayNormal
      }
    },
    setGraphicsQuality (value) {
      this.graphicsQuality = Math.min(3, Math.max(1, value))
      Cookies.set('graphicsQuality', this.graphicsQuality, { expires: 30 })

      //adjust render speed:
      if (this.graphicsQuality == 1) {
        this.tickDelay = this.tickDelayLow
      } else if (this.graphicsQuality == 2) {
        this.tickDelay = this.tickDelayNormal
      } else if (this.graphicsQuality == 3) {
        this.tickDelay = this.tickDelayHigh
      } else { // should never
        this.tickDelay = this.tickDelayLow
      }
    },
    toggleScope () {
      this.showScope = !this.showScope
    }
  }
})
