import { defineStore } from 'pinia'
import { game } from '@/sdk/client'
import { useUIStore } from '@/stores/ui'
import { markRaw } from 'vue'
import Sprite from '@/libs/sprite.js'
import { spriteScaleOf } from '@/libs/sprite-types'
import { buildSystem, STAR_KEY } from '@/sdk/system'
import { PADS } from '@/sdk/game/docking'

let nextWarp = 1

export const useStarMapStore = defineStore('StarMap', {
  state: () => ({
    /** the star system shown (Sol is 0), or null before one has loaded */
    starId: null,
    starName: '...',
    neighbors: [],
    // Game objects (sdk/system.js) by stable key, in drawing order.
    systemObjects: {},
    // Ships flying to another planet (Sprite.fly), by key: drawn in the world layer until they arrive.
    inTransit: {},
    // Ships warping out of or into this system (warp-effects.svg.vue).
    warps: [],
    // Key of my ship in this system, or null.
    myShipKey: null,
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
      // (Minerva says the jump is complete when the jump animation ends: ui.jumpAnimationOff.)
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

      // Other pilots' ships that jumped out of this system since the last load, or in from another,
      // warp out and in (warp-effects.svg.vue). Not on the first load, nor on arriving in a new system.
      const sameSystem = this.starId == blockData.id && Object.keys(this.sprites).length > 0
      if (sameSystem) {
        const now = Date.now()
        for (const [key, sprite] of Object.entries(this.sprites)) {
          if (sprite.type !== 'ship' || objects[key] || sprite.object.isMine) continue
          this.warps.push({
            id: nextWarp++,
            kind: 'out',
            x: sprite.position.x,
            y: sprite.position.y,
            rotation: sprite.telemetry.rotation,
            scale: spriteScaleOf(sprite.object, this.systemObjects),
            start: now
          })
        }
        for (const key of keys.ships) {
          if (this.sprites[key] || objects[key].isMine) continue
          this.warps.push({ id: nextWarp++, kind: 'in', key, start: now })
        }
      }

      const sprites = {}
      for (const object of Object.values(objects)) {
        const sprite = new Sprite(object, objects)
        if (sameSystem && object.type === 'ship' && !this.sprites[object.key] && !object.isMine) {
          sprite.warpIn = Date.now()
        }
        const previous = this.starId == blockData.id ? this.sprites[sprite.key] : null
        if (previous) sprite.carryOver(previous)
        if (this.gameTime > 0) sprite.updateTelemetry(this.gameTime)
        sprites[sprite.key] = sprite
      }
      this.starId = blockData.id
      this.starName = blockData.starName
      this.neighbors = blockData.neighbors
      this.players = blockData.avatarNames
      // Raw: replaced wholesale on each load, never changed in place.
      this.systemObjects = markRaw(objects)
      this.sprites = markRaw(sprites)
      // Ships flying to another planet are drawn in the world layer until they arrive (see Sprite.fly).
      this.myShipKey = Object.values(objects).find((object) => object.type === 'ship' && object.isMine)?.key ?? null
      this.inTransit = Object.fromEntries(
        Object.values(sprites)
          .filter((sprite) => sprite.transit || sprite.visit)
          .map((sprite) => [sprite.key, true])
      )
      this.spriteIds = keys

      // A selection that no longer exists (e.g. a ship that left) is cleared rather than left dangling.
      const ui = useUIStore()
      if (ui.selectedSprite != null && !objects[ui.selectedSprite]) {
        ui.selectNone()
      }

      this.isLoading = false
      this.mapDataLoaded = true
    },
    /** Warps that have played out (warp-effects.svg.vue). */
    endWarps(ids) {
      this.warps = this.warps.filter((warp) => !ids.includes(warp.id))
    },
    /** Advances every orbit to the current game time. Sprites are raw objects, so this triggers no re-renders by itself. */
    updateAllTelemtry() {
      const sprites = Object.values(this.sprites)
      // My ship as it was drawn last frame, before its orbit moves on: where a flight to my selection starts.
      const mine = this.sprites[this.myShipKey]
      const shown = mine && { x: mine.position.x, y: mine.position.y, rotation: mine.telemetry.rotation }
      for (const sprite of sprites) {
        sprite.updateTelemetry(this.gameTime)
      }
      // One level of nesting: moons, stations and ships orbit a planet; planets orbit the star at the origin.
      for (const sprite of sprites) {
        const parent = sprite.orbiting ? this.sprites[sprite.orbiting] : null
        sprite.position.x = sprite.telemetry.translatex + (parent ? parent.telemetry.translatex : 0)
        sprite.position.y = sprite.telemetry.translatey + (parent ? parent.telemetry.translatey : 0)
      }
      if (mine) this.followSelection(mine, shown)
      for (const key in this.inTransit) {
        const sprite = this.sprites[key]
        // A ship visiting a planet in my view stays in the world layer until it's home.
        if ((!sprite?.transit || sprite.fly(this.gameTime)) && !sprite?.visit) delete this.inTransit[key]
      }
    },
    /**
     * In my own view, my ship flies to the planet I select (or the planet of a moon or station I
     * select), turns for a new one mid-flight, and flies back to where it really is when I deselect
     * or choose something elsewhere. Selecting my ship itself keeps its course. Nothing goes to the chain.
     */
    followSelection(mine, shown) {
      const selected = useUIStore().selectedSprite
      let planet = null
      let station = null
      if (selected === mine.key) [planet, station] = [mine.visit, mine.visitStation ?? null]
      else {
        const object = this.systemObjects[selected]
        if (object?.type === 'planet') planet = selected
        else if (object?.type === 'moon') planet = object.orbiting
        else if (object?.type === 'station') [planet, station] = [object.orbiting, selected]
      }
      // Already there: in orbit round its own planet, or docked at the station selected.
      const dockedAt = mine.object.dock?.station ?? null
      if (planet === mine.orbiting && (station === null ? !dockedAt : station === dockedAt)) planet = station = null
      if (planet !== mine.visit || station !== (mine.visitStation ?? null)) {
        // Arrived for real at the station it was visiting (a trade there): it stays at the pad.
        if (planet === null && mine.visitStation && mine.visitStation === dockedAt) {
          mine.visit = mine.visitDock = mine.visitStation = null
          mine.docking = 1
        } else {
          mine.visitPlanet(planet, shown, station ? this.visitPad(mine, station) : null)
          mine.visitStation = station
          this.inTransit[mine.key] = true
        }
      }
      if (mine.visit) mine.placeAtVisit(this.sprites[mine.visit], this.sprites[mine.orbiting], this.gameTime)
    },
    /**
     * The pad my ship docks at when I select a station (only in my view): the pad it would be given
     * after a trade there (sdk/game/docking.js: its own preferred pad, or the next free one round).
     */
    visitPad(mine, stationKey) {
      const taken = new Set(
        Object.values(this.systemObjects)
          .filter((o) => o.type === 'ship' && o.dock?.station === stationKey && o.key !== mine.key)
          .map((o) => o.dock.pad)
      )
      let index = Number(mine.object.id) % PADS.length
      for (let i = 0; i < PADS.length && taken.has(PADS[index]); i++) index = (index + 1) % PADS.length
      return mine.dockGeometry({ ...mine.object, dock: { station: stationKey, pad: PADS[index] } }, this.systemObjects)
    }
  }
})
