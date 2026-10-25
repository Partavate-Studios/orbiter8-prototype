import { defineStore } from 'pinia'
import { galaxy, avatars } from '@/chain/contracts'
import { useUIStore } from '@/stores/ui'
import Sprite, { STAR_KEY } from '@/libs/sprite.js'
import { useChainStore } from '@/stores/chain'

export const useStarMapStore = defineStore('StarMap', {
  state: () => ({
    starId: 0,
    starName: '...',
    neighbors: [],
    // Sprites by stable key (see libs/sprite.js spriteKey), in drawing order.
    systemObjects: {},
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
    loadProgress: 0,
    gameTime: Date.now(),
    timeDelta: 0
  }),
  getters: {
    currentStarSystemId: state => state.starId,
    currentStarSystemName: state => state.starName,
    mapLoadedPercentage: state => Math.min(100, Math.max(0, state.loadProgress)),
    /** Key of the player's ship in this system (falls back to the star, as before). */
    myShipId: state => {
      const ship = Object.values(state.systemObjects).find(sprite => sprite.type === 'ship' && sprite.isMine)
      return ship ? ship.key : STAR_KEY
    },
    /** Key of the space station orbiting a planet (by planet key), or null. */
    portForPlanet: state => (planetKey) => {
      const station = Object.values(state.systemObjects).find(sprite => sprite.type === 'station' && sprite.orbiting === planetKey)
      return station ? station.key : null
    },
    moonsForPlanet: state => (planetKey) => {
      return Object.values(state.systemObjects)
        .filter(sprite => sprite.type === 'moon' && sprite.orbiting === planetKey)
        .map(sprite => sprite.key)
    }
  },
  actions: {
    /** Loads the star map for the player's current star system */
    async loadStarMap () {
      if (this.isLoading) {
        return
      }
      console.debug('Loading star map...')

      this.setProp({key: 'isLoading', value: true})
      this.setProp({key: 'loadProgress', value: 1})

      try {
        /** Grab the current system and go from there */
        const systemBase = await galaxy.getPlayerSystemData()

        this.setProp({key: 'loadProgress', value: 2})

        let isNewSystem = false
        if (parseInt(systemBase[0]) != this.starId) {
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

        this.setProp({key: 'loadProgress', value: 4})

        //Add pioneer to first visit sun to name index
        if ((starMapBlockData.discoveredBy > 0) && (typeof starMapBlockData.avatarNames[starMapBlockData.discoveredBy] === 'undefined')) {
          starMapBlockData.avatarNames[starMapBlockData.discoveredBy] = await avatars.getAvatarNameByAddress(starMapBlockData.discoveredBy)
        }
        this.setProp({key: 'loadProgress', value: 5})

        /** Add the names for neighboring stars */
        for (const [key, neighborId] of Object.entries(starMapBlockData.neighborIds)) {
          const starName = await galaxy.getSystemName(String(neighborId))
          starMapBlockData.neighbors[key] = {
            id: neighborId,
            name: starName
          }
          this.setProp({key: 'loadProgress', value: Math.min(24, 6 + key)})
        }

        this.setProp({key: 'loadProgress', value: 25})

        /** Add each ship known to be in this system */
        for (const key of Object.keys(starMapBlockData.shipIds)) {
          let shipId = starMapBlockData.shipIds[key]
          if ((shipId > 0) && !(shipId in starMapBlockData.ships)) {
            const shipBase = await galaxy.getShip(String(shipId))
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
              starMapBlockData.avatarNames[ship.owner] = await avatars.getAvatarNameByAddress(ship.owner)
            }
          }
          this.setProp({key: 'loadProgress', value: Math.min(75, 25 + key)})
        }


        this.setProp({key: 'loadProgress', value: 80})

        /** Add details for all the planets */
        // todo: ensure this key is accurately tracking orbit distance
        // todo: these keys should probably be consts
        for (const [key, planetId] of Object.entries(starMapBlockData.planetIds)) {
          if (planetId > 0) {
            const planetBase = await galaxy.getPlanet(String(planetId))
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
            if ((planet.owner > 0) && (typeof starMapBlockData.avatarNames[planet.owner] === 'undefined')) {
              starMapBlockData.avatarNames[planet.owner] = await avatars.getAvatarNameByAddress(planet.owner)
            }

            /** If there's a station, add the details to the planet */
            if (planet.hasStation) {
              const station = await galaxy.getStation(String(planet.id))
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

            /** Add details for all the moons to the planet */
            for (const [moonkey, hasMoon] of Object.entries(planet.hasMoons)) {
              if (hasMoon) {
                const moonBase = await galaxy.getMoon(String(planetId), String(moonkey))
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
                  starMapBlockData.avatarNames[moon.owner] = await avatars.getAvatarNameByAddress(moon.owner)
                }
              }
            }
            starMapBlockData.planets[key] = planet
            this.setProp({key: 'loadProgress', value: Math.min(98, 80 + key)})
          }
        }
        this.setProp({key: 'loadProgress', value: 99})
        this.importStarMapBlockData({blockData: starMapBlockData, playerAccount: String(useChainStore().account).toLowerCase()} )
        this.setProp({key: 'loadProgress', value: 100})
        if (isNewSystem) {
          useUIStore().jumpAnimationOff()
        }
      } catch (error) {
        console.error('Loading the star map failed:', error)
        // Let the next block retry; otherwise one failed RPC call froze the map for the session.
        this.isLoading = false
      }
    },
    //generic setter
    setProp ({ key, value }) {
      this[key] = value
    },

    incrementGameTime () {
      const newTime = Date.now()
      this.timeDelta = newTime - this.gameTime
      this.gameTime = newTime
      //touch sprites?
    },

    importStarMapBlockData ({blockData, playerAccount}) {

      // Keyed by stable sprite key; insertion order is drawing order.
      const objects = {}
      const ids = {
        planets: [],
        moons: [],
        stations: [],
        ships: []
      }
      const add = (type, values) => {
        const sprite = new Sprite(type, values)
        objects[sprite.key] = sprite
        return sprite
      }

      //add star
      add('star', {
        id: this.starId,
        name: blockData.starName,
        size: blockData.starSize,
        birth: blockData.birthTime,
        owner: blockData.discoveredBy,
        ownerName: this.players[blockData.discoveredBy],
        orbiting: null,
        isMine: Boolean(String(playerAccount) == String(blockData.discoveredBy))
      })

      //add planets
      for (const orbitalPosition in blockData.planets) {
        let planet = blockData.planets[orbitalPosition]
        let planetOwnerName = "unclaimed"
        if (planet.owner > 0) {
          planetOwnerName = this.players[planet.owner]
        }
        let isMine = Boolean(String(playerAccount) == String(planet.owner))
        const planetSprite = add('planet', {
          name: planet.name,
          id: planet.id,
          speed: planet.orbitSpeed,
          size: planet.size,
          orbitalPosition: orbitalPosition,
          class:  planet.class,
          rings: planet.rings,
          owner: planet.owner,
          ownerName: planetOwnerName,
          orbiting: STAR_KEY,
          hasStation: planet.hasStation,
          moons: [],
          isMine: isMine
        })
        ids.planets.push(planetSprite.key)

        //add planet's station
        if (planet.hasStation) {
          const station = add('station', {
            id: planet.id,
            name: planet.station.name,
            size: planet.station.size,
            distance: (planet.size * 0.6) + 12,
            speed: 100,
            orbiting: planetSprite.key,
            owner: planet.owner,
            ownerName: planetOwnerName,
            isMine: isMine,
            inventory: planet.station.inventory,
            prices: planet.station.prices
          })
          ids.stations.push(station.key)
          planetSprite.stationSprite = station.key
          planetSprite.stationName = planet.station.name
        }

        //add planet's moons
        for (const orbitalMoonPosition in planet.moons) {
          const moon = add('moon', {
            id: orbitalMoonPosition,
            name: planet.moons[orbitalMoonPosition].name,
            size:  planet.moons[orbitalMoonPosition].size,
            class:  planet.moons[orbitalMoonPosition].class,
            orbitalPosition: orbitalMoonPosition,
            planet: planet.id,
            //todo: this should be done somewhere else, just track position here
            distance: (planet.size * 0.7) + 14 + (orbitalMoonPosition * orbitalMoonPosition * 0.4) + (orbitalMoonPosition * 4),
            speed:  planet.moons[orbitalMoonPosition].orbitSpeed,
            orbiting: planetSprite.key,
            owner: planet.owner,
            ownerName: planetOwnerName,
            isMine: isMine
          })
          ids.moons.push(moon.key)
          planetSprite.moons.push({
            moonId: moon.key,
            moonName: planet.moons[orbitalMoonPosition].name
          })
        }
      }

      for (const shipId in blockData.ships) {
        let ship = blockData.ships[shipId]
        // Ships orbit the planet they're at, or the star if they aren't at one.
        let parent = STAR_KEY
        let distance = 50
        let shipOwnerName = 'Unknown'
        if (ship.owner > 0) {
          shipOwnerName = this.players[ship.owner]
        }
        for (const object of Object.values(objects)) {
          if ((object.id == ship.orbit) && (object.type == 'planet')) {
            parent = object.key
            distance = (object.size * 0.5) + 6
          }
        }
        const shipSprite = add('ship', {
          id: ship.id,
          name: ship.name,
          orbiting: parent,
          distance: distance,
          location: ship.location,
          owner: ship.owner,
          ownerName: shipOwnerName,
          isMine: Boolean(String(ship.owner) == String(playerAccount))
        })
        ids.ships.push(shipSprite.key)
      }

      //carry over animation state when reloading the same system
      if (this.starId == blockData.id) {
        for (const sprite of Object.values(objects)) {
          const previous = this.systemObjects[sprite.key]
          if (previous) sprite.consumeSpriteData(previous)
        }
      }
      if (this.gameTime > 0) {
        for (const sprite of Object.values(objects)) {
          sprite.updateTelemetry(this.gameTime)
        }
      }
      this.starId = blockData.id
      this.starName = blockData.starName
      this.neighbors = blockData.neighbors
      this.players = blockData.avatarNames
      this.systemObjects = objects
      this.spriteIds = ids

      // A selection that no longer exists (e.g. a ship that left) is cleared rather than left dangling.
      const ui = useUIStore()
      if (ui.selectedSprite != null && !objects[ui.selectedSprite]) {
        ui.selectNone()
      }

      this.isLoading = false
      this.mapDataLoaded = true
    },
    /** Advances every orbit to the current game time. Sprites are raw objects, so this triggers no re-renders by itself. */
    updateAllTelemtry () {
      const objects = this.systemObjects
      const sprites = Object.values(objects)
      for (const sprite of sprites) {
        sprite.updateTelemetry(this.gameTime)
      }
      // One level of nesting: moons, stations and ships orbit a planet; planets orbit the star at the origin.
      for (const sprite of sprites) {
        const parent = sprite.orbiting ? objects[sprite.orbiting] : null
        sprite.position.x = sprite.telemetry.translatex + (parent ? parent.telemetry.translatex : 0)
        sprite.position.y = sprite.telemetry.translatey + (parent ? parent.telemetry.translatey : 0)
      }
    }
  }
})
