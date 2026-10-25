import { defineStore } from 'pinia'
import Cookies from 'js-cookie'

export const useConfigStore = defineStore('Config', {
  state: () => ({
    showMinerva: false, // todo: move this to UI
    tickDelayHigh: 32,
    tickDelayNormal: 48,
    tickDelayLow: 64,
    tickDelay: 48,
    blockCheckDelay: 2000,
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
      console.log('Minerva set to:' + this.showMinerva)
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
      console.log('High quality graphics set to:' + this.graphicsQuality)
    },
    setGraphicsQuality (value) {
      console.log('Graphics set to:', value)
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
      console.log('showScope set to:' + this.showScope)
    }
  }
})
