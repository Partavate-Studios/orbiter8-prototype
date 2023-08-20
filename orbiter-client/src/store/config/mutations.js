import Cookies from 'js-cookie'

export default {
  /* Approved */
  setTickDelay (state, delay) {
    state.tickDelay = delay
  },
  /* Old */
  toggleMinerva (state) {
    state.showMinerva = !state.showMinerva
    console.log('Minerva set to:' + state.showMinerva)
  },
  toggleGraphicsQuality (state) {
    state.graphicsQuality = ((state.graphicsQuality + 1 ) % 3) + 1
    if (state.graphicsQuality < 2) {
      state.tickDelay = state.tickDelayLow
    } else if (state.graphicsQuality > 2) {
      state.tickDelay = state.tickDelayHigh
    } else {
      state.tickDelay = state.tickDelayNormal
    }
    console.log('High quality graphics set to:' + state.graphicsQuality)
  },
  setGraphicsQuality (state, value) {
    console.log('Graphics set to:', value)
    state.graphicsQuality = Math.min(3, Math.max(1, value))
    Cookies.set('graphicsQuality', state.graphicsQuality, { expires: 30 })

    //adjust render speed:
    if (state.graphicsQuality == 1) {
      state.tickDelay = state.tickDelayLow
    } else if (state.graphicsQuality == 2) {
      state.tickDelay = state.tickDelayNormal
    } else if (state.graphicsQuality == 3) {
      state.tickDelay = state.tickDelayHigh
    } else { // should never
      state.tickDelay = state.tickDelayLow
    }
  },
  toggleScope (state) {
    state.showScope = !state.showScope
    console.log('showScope set to:' + state.showScope)
  }
}
