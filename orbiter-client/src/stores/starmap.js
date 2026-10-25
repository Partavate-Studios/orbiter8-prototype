import { defineStore } from 'pinia'
import { loadSystem } from '@/sdk/load'
import { useUIStore } from '@/stores/ui'
import Sprite, { STAR_KEY } from '@/libs/sprite.js'
import { moonOrbitRadius, stationOrbitRadius, shipOrbitRadius, SHIP_ORBIT_RADIUS_AROUND_STAR } from '@/sdk/game/orbits'
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
    currentStarSystemId: (state) => state.starId,
    currentStarSystemName: (state) => state.starName,
    mapLoadedPercentage: (state) => Math.min(100, Math.max(0, state.loadProgress)),
    /** Key of the player's ship in this system (falls back to the star, as before). */
    myShipId: (state) => {
      const ship = Object.values(state.systemObjects).find((sprite) => sprite.type === 'ship' && sprite.isMine)
      return ship ? ship.key : STAR_KEY
    },
    /** Key of the space station orbiting a planet (by planet key), or null. */
    portForPlanet: (state) => (planetKey) => {
      const station = Object.values(state.systemObjects).find(
        (sprite) => sprite.type === 'station' && sprite.orbiting === planetKey
      )
      return station ? station.key : null
    },
    moonsForPlanet: (state) => (planetKey) => {
      return Object.values(state.systemObjects)
        .filter((sprite) => sprite.type === 'moon' && sprite.orbiting === planetKey)
        .map((sprite) => sprite.key)
    }
  },
  actions: {
    /** Loads the star map for the player's current star system */
    async loadStarMap() {
      if (this.isLoading) {
        return
      }
      console.debug('Loading star map...')
      this.isLoading = true
      this.loadProgress = 1
      try {
        const blockData = await loadSystem((percent) => {
          this.loadProgress = percent
        })
        const isNewSystem = blockData.id != this.starId
        this.loadProgress = 99
        this.importStarMapBlockData({ blockData, playerAccount: String(useChainStore().account).toLowerCase() })
        this.loadProgress = 100
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
    setProp({ key, value }) {
      this[key] = value
    },

    /** Advances gameTime to now, once per tick. Orbits are computed from it. */
    incrementGameTime() {
      const newTime = Date.now()
      this.timeDelta = newTime - this.gameTime
      this.gameTime = newTime
    },

    /**
     * Builds the system's sprites from freshly loaded chain data. Each sprite's key comes from what it
     * is ('planet:3'), so a sprite keeps its key, and its selection, when others appear or disappear.
     */
    importStarMapBlockData({ blockData, playerAccount }) {
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
        let planetOwnerName = 'unclaimed'
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
          class: planet.class,
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
            distance: stationOrbitRadius(planet.size),
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
            size: planet.moons[orbitalMoonPosition].size,
            class: planet.moons[orbitalMoonPosition].class,
            orbitalPosition: orbitalMoonPosition,
            planet: planet.id,
            distance: moonOrbitRadius(planet.size, orbitalMoonPosition),
            speed: planet.moons[orbitalMoonPosition].orbitSpeed,
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
        let distance = SHIP_ORBIT_RADIUS_AROUND_STAR
        let shipOwnerName = 'Unknown'
        if (ship.owner > 0) {
          shipOwnerName = this.players[ship.owner]
        }
        for (const object of Object.values(objects)) {
          if (object.id == ship.orbit && object.type == 'planet') {
            parent = object.key
            distance = shipOrbitRadius(object.size)
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
    updateAllTelemtry() {
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
