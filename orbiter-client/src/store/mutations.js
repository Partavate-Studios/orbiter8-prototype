export default {
  setProp (state, { key, value }) {
    //console.log('setting props', [key, value])
    state[key] = value
  },
  setPlayerReady (state) {
    state.playerReady = true
  }
}
