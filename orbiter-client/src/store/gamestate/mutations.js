export default {
  setProp (state, { key, value }) {
    //console.log('setting props', [key, value])
    state[key] = value
  },
  setGameDataLoaded (state) {
    state.gameDataLoaded = true
    state.gameDataLoading = false
  },
  setGameDataLoading (state) {
    state.gameDataLoading = true
  }
}
