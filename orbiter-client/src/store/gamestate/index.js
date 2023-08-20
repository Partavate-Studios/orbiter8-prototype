import actions from './actions'
import mutations from './mutations'
import getters from './getters'

const state = {
  gameDataLoading: false,
  gameDataLoaded: false,
  gameState: {
    avatarCount: null,
    starSystemCount: null,
    avatar: {
      registered: false,
      name: '',
      shipId: 0,
      ship: {
        name: null,
        location: null,
        orbit: null,
        holds: null,
        equipment: null,
        fuel: null,
        organics: null,
        owner: null
      },
      credits: 0,
    }
  },
  haveAvatar: false,
  haveShip: false,
  events: {
    avatarEvents: null,
    shipEvents: null,
    tradeEvents: null
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
