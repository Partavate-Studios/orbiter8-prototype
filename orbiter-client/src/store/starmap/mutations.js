
import Sprite from '@/libs/sprite.js'

export default {

  //generic setter
  setProp (state, { key, value }) {
    //console.log('setting props', [key, value])
    state[key] = value
  },

  incrementGameTime (state) {
    const newTime = Date.now()
    state.timeDelta = newTime - state.gameTime
    state.gameTime = newTime
    //touch sprites?
  },

  importStarMapBlockData (state, {blockData, playerAccount}) {
    console.log('importing star map data')

    let newSystemObjects = []
    let newSpriteIds = {
      planets: [],
      moons: [],
      stations: [],
      ships: []
    }

    //add star
    newSystemObjects.push(new Sprite(
      'star', {
        id: state.starId,
        name: blockData.starName,
        size: blockData.starSize,
        birth: blockData.birthTime,
        owner: blockData.discoveredBy,
        ownerName: state.players[blockData.discoveredBy],
        orbiting: null,
        isMine: Boolean(String(playerAccount) == String(blockData.discoveredBy))
      }
    ))
    console.log('discovered: '+ String(playerAccount) + ' ' + String(blockData.discoveredBy))

    //add planets
    for (const orbitalPosition in blockData.planets) {
      let planet = blockData.planets[orbitalPosition]
      let planetOwnerName = "unclaimed"
      if (planet.owner > 0) {
        planetOwnerName = state.players[planet.owner]
      }
      let isMine = Boolean(String(playerAccount) == String(planet.owner))
      console.log('isMine ' + isMine + ' from ' + playerAccount + ' and ' + planet.owner)
      newSystemObjects.push(new Sprite(
        'planet', {
          name: planet.name,
          id: planet.id,
          speed: planet.orbitSpeed,
          size: planet.size,
          orbitalPosition: orbitalPosition,
          class:  planet.class,
          rings: planet.rings,
          owner: planet.owner,
          ownerName: planetOwnerName,
          orbiting: 0,
          hasStation: planet.hasStation,
          moons: [],
          isMine: isMine
        }
      ))
      let planetObjectId = newSystemObjects.length - 1
      newSpriteIds.planets.push(planetObjectId)

      //add planet's station
      if (planet.hasStation) {
        newSystemObjects.push(new Sprite(
          'station', {
            id: planet.id,
            name: planet.station.name,
            size: planet.station.size,
            distance: (planet.size * 0.6) + 12,
            speed: 100,
            orbiting: planetObjectId,
            owner: planet.owner,
            ownerName: planetOwnerName,
            isMine: isMine,
            inventory: planet.station.inventory,
            prices: planet.station.prices
          }
        ))
        newSpriteIds.stations.push(newSystemObjects.length - 1)
        newSystemObjects[planetObjectId].stationSprite = newSystemObjects.length - 1
        newSystemObjects[planetObjectId].stationName = planet.station.name
      }

      //add planet's moons
      for (const orbitalMoonPosition in planet.moons) {
        newSystemObjects.push(new Sprite(
          'moon', {
            id: orbitalMoonPosition,
            name: planet.moons[orbitalMoonPosition].name,
            size:  planet.moons[orbitalMoonPosition].size,
            class:  planet.moons[orbitalMoonPosition].class,
            orbitalPosition: orbitalMoonPosition,
            planet: planet.id,
            //todo: this should be done somewhere else, just track position here
            distance: (planet.size * 0.7) + 14 + (orbitalMoonPosition * orbitalMoonPosition * 0.4) + (orbitalMoonPosition * 4),
            speed:  planet.moons[orbitalMoonPosition].orbitSpeed,
            orbiting: planetObjectId,
            owner: planet.owner,
            ownerName: planetOwnerName,
            isMine: isMine
          }
        ))
        newSpriteIds.moons.push(newSystemObjects.length - 1)
          newSystemObjects[planetObjectId].moons.push({
            moonId: newSystemObjects.length - 1,
            moonName: planet.moons[orbitalMoonPosition].name
          }
        )
      }
    }

    for (const shipId in blockData.ships) {
      let ship = blockData.ships[shipId]
      let parent = 0
      let distance = 50
      let shipOwnerName = 'Unknown'
      if (ship.owner > 0) {
        shipOwnerName = state.players[ship.owner]
      }
      for (let i = 0; i < newSystemObjects.length; i++) {
        let object = newSystemObjects[i]
        //console.log('index ' + i + ' orbit ' + ship.orbit + ' object ' + newSystemObjects[i].id + ' type ' + object.size)
        if ((object.id == ship.orbit) && (object.type == 'planet')) {
          //console.log('match! '+ i)
          parent = i
          distance = (newSystemObjects[i].size * 0.5) + 6
        }
      }
      //console.log('parent:',ship)
      newSystemObjects.push(new Sprite(
        'ship', {
          id: ship.id,
          name: ship.name,
          orbiting: parent,
          distance: distance,
          location: ship.location,
          owner: ship.owner,
          ownerName: shipOwnerName,
          isMine: Boolean(String(ship.owner) == String(playerAccount))
        }
      ))
      newSpriteIds.ships.push(newSystemObjects.length - 1)
    }

    //integrate old sprites if same sector
    if (state.starId == blockData.id) {
      for (const newSystemObject of newSystemObjects) {
        for (const oldSystemObject of state.systemObjects) {
          if (newSystemObject.matchesSprite(oldSystemObject)) {
            newSystemObject.consumeSpriteData(oldSystemObject)
          }
        }
      }
    }
    if (state.gameTime > 0) {
      for (const systemObjectId in newSystemObjects) {
        newSystemObjects[systemObjectId].updateTelemetry(state.gameTime)
      }
    }
    state.starId = blockData.id
    state.starName = blockData.starName
    state.neighbors = blockData.neighbors
    state.players = blockData.avatarNames
    state.systemObjects = newSystemObjects
    state.spriteIds = newSpriteIds

    state.isLoading = false
    state.mapDataLoaded = true
  },
  updateAllTelemtry (state) {
    for (const systemObject in state.systemObjects) {
      state.systemObjects[systemObject].updateTelemetry(state.gameTime)
    }
  }
}