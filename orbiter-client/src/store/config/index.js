import actions from './actions'
import mutations from './mutations'
import getters from './getters'
import Cookies from 'js-cookie'

const state = {
  showMinerva: false, // todo: move this to UI
  tickDelayHigh: 32,
  tickDelayNormal: 48,
  tickDelayLow: 64,
  tickDelay: 48,
  blockCheckDelay: 2000,
  graphicsQuality: Cookies.get('graphicsQuality') || 2,
  showScope: true
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
