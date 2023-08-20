import actions from './actions'
import mutations from './mutations'
import getters from './getters'

const state = {
  starId: 0,
  starName: '...',
  neighbors: [],
  systemObjects: [],
  spriteIds: {
    planets: [],
    moons: [],
    ports: [],
    ships: []
  },
  //should this be playerNames?
  players: {},
  isLoading: false,
  mapDataLoaded: false,
  mapLoadedPercentage: 0,
  gameTime: Date.now(),
  timeDelta: 0
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}