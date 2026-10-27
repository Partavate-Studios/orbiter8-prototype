import { defineStore } from 'pinia'
import { game } from '@/sdk/client'
import { useUIStore } from '@/stores/ui'
import { markRaw } from 'vue'
import Sprite from '@/libs/sprite.js'
import { buildSystem, STAR_KEY } from '@/sdk/system'

export const useStarMapStore = defineStore('StarMap', {
  state: () => ({
    starId: 0,
    starName: '...',
    neighbors: [],
    // Game objects (sdk/system.js) by stable key, in drawing order.
    systemObjects: {},
    // How each of them is drawn (libs/sprite.js), by the same keys.
    sprites: {},
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
    /** Reloads the player's current star system; the result arrives through importSystem (stores/game-bindings.js). */
    loadStarMap() {
      console.debug('Loading star map...')
      return game.refreshSystem()
    },
    /** Takes in a freshly loaded star system (sdk/load.js loadSystem) from the game client. */
    importSystem(system, playerAccount) {
      const isNewSystem = system.id != this.starId
      const ui = useUIStore()
      // Arrived before the jump's transaction reported back: play the jump animation now (briefly).
      if (isNewSystem && ui.jumpPending) {
        ui.jumpPending = false
        if (!ui.jumpAnimationState) ui.jumpAnimationOn()
      }
      this.loadProgress = 99
      this.importStarMapBlockData({ blockData: system, playerAccount })
      this.loadProgress = 100
      if (isNewSystem) {
        // Ends once it has played its minimum time (ui jumpAnimationOff).
        ui.jumpAnimationOff()
      }
    },
    /** Advances gameTime to now, once per tick. Orbits are computed from it. */
    incrementGameTime() {
      const newTime = Date.now()
      this.timeDelta = newTime - this.gameTime
      this.gameTime = newTime
    },

    /**
     * Takes in a freshly loaded star system: its game objects (sdk/system.js), and a sprite to draw
     * each one. Keys come from what an object is ('planet:3'), so an object keeps its key, its
     * animation state and its selection when others appear or disappear.
     */
    importStarMapBlockData({ blockData, playerAccount }) {
      const { objects, keys } = buildSystem(blockData, playerAccount)

      const sprites = {}
      for (const object of Object.values(objects)) {
        const sprite = new Sprite(object)
        const previous = this.starId == blockData.id ? this.sprites[sprite.key] : null
        if (previous) sprite.carryOver(previous)
        if (this.gameTime > 0) sprite.updateTelemetry(this.gameTime, objects)
        sprites[sprite.key] = sprite
      }
      this.starId = blockData.id
      this.starName = blockData.starName
      this.neighbors = blockData.neighbors
      this.players = blockData.avatarNames
      // Raw: replaced wholesale on each load, never changed in place.
      this.systemObjects = markRaw(objects)
      this.sprites = markRaw(sprites)
      this.spriteIds = keys

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
      const sprites = Object.values(this.sprites)
      for (const sprite of sprites) {
        sprite.updateTelemetry(this.gameTime, this.systemObjects)
      }
      // One level of nesting: moons, stations and ships orbit a planet; planets orbit the star at the origin.
      for (const sprite of sprites) {
        const parent = sprite.orbiting ? this.sprites[sprite.orbiting] : null
        sprite.position.x = sprite.telemetry.translatex + (parent ? parent.telemetry.translatex : 0)
        sprite.position.y = sprite.telemetry.translatey + (parent ? parent.telemetry.translatey : 0)
      }
    }
  }
})
