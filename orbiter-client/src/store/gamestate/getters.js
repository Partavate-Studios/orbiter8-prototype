export default {
  /** useful game states */

  //general game data
  gameDataLoaded: state => state.gameDataLoaded,
  gameDataLoading: state => state.gameDataLoading,

  //avatar
  creatingAvatar:state => state.creatingAvatar,
  haveAvatar: state => state.haveAvatar,

  //ship
  launchingShip: state => state.launchingShip,
  haveShip: state => state.haveShip,

  gameState: state => state.gameState,
  starMap: state => state.starMap,

  //avatar
  avatar: state => state.gameState.avatar,
  events: state => state.events

}
