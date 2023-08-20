export default {
  timeDelta: state => state.timeDelta,
  gameTime: state => state.gameTime,
  currentStarSystemId: state => state.starId,
  currentStarSystemName: state => state.starName,
  neighbors: state => state.neighbors,
  isLoading: state => state.isLoading,
  mapDataLoaded: state =>state.mapDataLoaded,
  mapLoadedPercentage: state => Math.min(100, Math.max(0, state.mapLoadedPercentage )),
  systemObjects: state => state.systemObjects,
  spriteIds: state => state.spriteIds,
  players: state => state.players,
  myShipId: state => {
    for (var i = 0; i < state.systemObjects.length; i++) {
      if ((state.systemObjects[i].type == 'ship') && (state.systemObjects[i].isMine)) {
        return i
      }
    }
    return 0
  },
  portForPlanet: state => (planetId) => {
    for (var i = 0; i < state.systemObjects.length; i++) {
      if ((state.systemObjects[i].type == 'station') && (state.systemObjects[i].orbiting == planetId)) {
        return i
      }
    }
    return 0
  },
  moonsForPlanet: state => (planetId) => {
    let moons = []
    for (var i = 0; i < state.systemObjects.length; i++) {
      if ((state.systemObjects[i].type == 'moon') && (state.systemObjects[i].orbiting == planetId)) {
        moons.push(i)
      }
    }
    return moons
  }

}