import GalaxyContract from '@/contract-interfaces/galaxy'
import AvatarContract from '@/contract-interfaces/avatar'

export default {

  /** Loads the star map for the player's current star system */
  async loadStarMap ({ state, rootState, commit }) {
    if (state.isLoading) {
      console.log('Skipping load, already loading...')
      return
    }
    console.log('Loading star map...')

    commit('setProp', {key: 'isLoading', value: true})
    commit('setProp', {key: 'mapLoadedPercentage', value: 1})

    try {
      /** Grab the current system and go from there */
      const systemBase = await GalaxyContract.getPlayerSystemData(rootState.account)

      commit('setProp', {key: 'mapLoadedPercentage', value: 2})

      let isNewSystem = false
      if (parseInt(systemBase[0]) != state.starId) {
        isNewSystem = true
      }
      //map the results to an structured object
      const starMapBlockData = {
        id: parseInt(systemBase[0]),
        starName: systemBase[1],
        starSize: systemBase[2],
        birthTime: systemBase[3],
        discoveredBy: String(systemBase[4]).toLowerCase(),
        neighborIds: systemBase[5],
        neighbors: {},
        planetIds: systemBase[6],
        planets: {},
        shipIds: systemBase[7],
        ships: {},
        avatarNames: {}
      }

      commit('setProp', {key: 'mapLoadedPercentage', value: 4})

      //Add pioneer to first visit sun to name index
      console.log('Discovered by ', starMapBlockData.discoveredBy)
      if ((starMapBlockData.discoveredBy > 0) && (typeof starMapBlockData.avatarNames[starMapBlockData.discoveredBy] === 'undefined')) {
        starMapBlockData.avatarNames[starMapBlockData.discoveredBy] = await AvatarContract.getAvatarNameByAddress(starMapBlockData.discoveredBy, rootState.account)
      }
      commit('setProp', {key: 'mapLoadedPercentage', value: 5})

      /** Add the names for neighboring stars */
      for (const [key, neighborId] of Object.entries(starMapBlockData.neighborIds)) {
        const starName = await GalaxyContract.getSystemName(String(neighborId), rootState.account)
        starMapBlockData.neighbors[key] = {
          id: neighborId,
          name: starName
        }
        commit('setProp', {key: 'mapLoadedPercentage', value: Math.min(24, 6 + key)})
      }

      commit('setProp', {key: 'mapLoadedPercentage', value: 25})

      /** Add each ship known to be in this system */
      for (const key of Object.keys(starMapBlockData.shipIds)) {
        let shipId = starMapBlockData.shipIds[key]
        if ((shipId > 0) && !(shipId in starMapBlockData.ships)) {
          //console.log('Adding ship ', shipId)
          const shipBase = await GalaxyContract.getShip(String(shipId), rootState.account)
          const ship = {
            id: shipId,
            name: shipBase[0],
            location: shipBase[1],
            orbit: shipBase[2],
            owner: String(shipBase[3]).toLowerCase()
          }
          if (ship.location == starMapBlockData.id) {
            starMapBlockData.ships[shipId] = ship
          }

          //Add ship owner name to name index
          if ((ship.owner !== '0x0') && (typeof starMapBlockData.avatarNames[ship.owner] === 'undefined')) {
            starMapBlockData.avatarNames[ship.owner] = await AvatarContract.getAvatarNameByAddress(ship.owner, rootState.account)
          }
        }
        commit('setProp', {key: 'mapLoadedPercentage', value: Math.min(75, 25 + key)})
      }


      commit('setProp', {key: 'mapLoadedPercentage', value: 80})

      /** Add details for all the planets */
      // todo: ensure this key is accurately tracking orbit distance
      // todo: these keys should probably be consts
      for (const [key, planetId] of Object.entries(starMapBlockData.planetIds)) {
        if (planetId > 0) {
          const planetBase = await GalaxyContract.getPlanet(String(planetId), rootState.account)
          const planet = {
            id: String(planetId),
            name: planetBase[0],
            star: planetBase[1],
            size: parseInt(planetBase[2][0]),
            class: parseInt(planetBase[2][1]),
            rings: parseInt(planetBase[2][2]),
            orbitSpeed: parseInt(planetBase[2][3]),
            owner: String(planetBase[3]).toLowerCase(),
            hasMoons: planetBase[4],
            moons: {},
            hasStation: planetBase[5],
            station: {}
          }
          //Add planet owner name to name index (need to deal with unknwon)
          //console.log('Planet Owner: ' + planet.owner )
          if ((planet.owner > 0) && (typeof starMapBlockData.avatarNames[planet.owner] === 'undefined')) {
            starMapBlockData.avatarNames[planet.owner] = await AvatarContract.getAvatarNameByAddress(planet.owner, rootState.account)
          }

          /** If there's a station, add the details to the planet */
          if (planet.hasStation) {
            const station = await GalaxyContract.getStation(String(planet.id), rootState.account)
            //console.log(JSON.stringify(station))
            planet.station = {
              id: planet.id,
              name: String(station[0]),
              size: parseInt(station[1]),
              inventory: {
                equipment: parseInt(station[2][0]),
                fuel: parseInt(station[2][1]),
                organics: parseInt(station[2][2])
              },
              prices: {
                equipment: parseInt(station[3][0]),
                fuel: parseInt(station[3][1]),
                organics: parseInt(station[3][2]),
                holds: parseInt(station[3][3])
              },
              orbitSpeed: 1,
              owner: planet.owner,
            }
          }
          //console.log(JSON.stringify(planet.station))

          /** Add details for all the moons to the planet */
          for (const [moonkey, hasMoon] of Object.entries(planet.hasMoons)) {
            if (hasMoon) {
              const moonBase = await GalaxyContract.getMoon(String(planetId), String(moonkey), rootState.account)
              const moon = {
                id: String(moonkey),
                name: String(moonBase[0]),
                planet: planetId,
                size: parseInt(moonBase[1]),
                class: parseInt(moonBase[2]),
                orbitSpeed: parseInt(moonBase[3]),
                owner: planet.owner
              }
              planet.moons[moonkey] = moon
              //Add moon owner name to name index
              if ((moon.owner > 0) && (typeof starMapBlockData.avatarNames[moon.owner] === 'undefined')) {
                starMapBlockData.avatarNames[moon.owner] = await AvatarContract.getAvatarNameByAddress(moon.owner, rootState.account)
              }
            }
          }
          starMapBlockData.planets[key] = planet
          commit('setProp', {key: 'mapLoadedPercentage', value: Math.min(98, 80 + key)})
        }
      }
      commit('setProp', {key: 'mapLoadedPercentage', value: 99})
      commit('importStarMapBlockData', {blockData: starMapBlockData, playerAccount: String(rootState.account).toLowerCase()} )
      commit('setProp', {key: 'mapLoadedPercentage', value: 100})
      if (isNewSystem) {
        commit('UI/jumpAnimationOff', null, {root: true})
      }
    } catch (error) {
      console.log('oops:' + error.message, error)
    }
    console.log('new block loaded')
  }
}