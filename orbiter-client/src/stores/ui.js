import { defineStore } from 'pinia'
import { gameAudio } from '@/libs/08audio'
import Tween from '@/libs/tween'
import { STAR_KEY } from '@/sdk/system'
import { CAMERA, MAP_GROUP_SCALE, MAP_RESOLUTION, WORLD_OFFSET_Y, HELIOPAUSE_RADIUS } from '@/constants'
import { useConfigStore } from '@/stores/config'

// Camera zooms this long or longer are flights (arrivals, selections), not wheel steps (ms).
const CAMERA_FLIGHT_MS = 500

// Sprites this far past the screen edge still count as on screen (labels, glows).
const OFFSCREEN_MARGIN_PX = 100

// When the jump animation started, and its pending end (see jumpAnimationOff).
let jumpAnimationStartedAt = 0
let jumpAnimationTimer = null

/**
 * The HUD's full-screen menus (hud.svg.vue), each shown by `menuState[name + 'Menu']`, including
 * colony (a planet's people, storage, buildings and transfers), armory, loadout, siege and the siege feed.
 */
const MENUS = ['planets', 'ships', 'settings', 'trade', 'shipyard', 'chat', 'leaderboard', 'colony', 'armory', 'loadout', 'siege', 'feed', 'help']

export const useUIStore = defineStore('UI', {
  state: () => ({
    // The map's HUD and world sit in a group scaled by this much (inside 1200 units per screen height).
    baseScale: MAP_GROUP_SCALE,
    // The camera the world layer is currently drawn for (it lags the live viewport between redraws).
    drawnView: { x: 0, y: 0, scale: 1 },
    /* Approved */
    viewport: {
      resolution: MAP_RESOLUTION,
      scale: CAMERA.START_SCALE,
      scaleTween: null,
      rotation: 0.0,
      rotationTween: null,
      x: 0.0,
      xTween: null,
      y: 0.0,
      yTween: null,
      width: MAP_RESOLUTION,
      height: MAP_RESOLUTION
    },
    // The browser window's size in pixels, and where the mouse is in it.
    screenSize: {
      width: MAP_RESOLUTION,
      height: MAP_RESOLUTION,
      mouse: {
        x: 0,
        y: 0,
        xFromCenter: 0,
        yFromCenter: 0
      }
    },
    hud: {
      jumpAnimationState: false,

      menuState: {
        menuShowing: false, //should this just be a getter?

        ...Object.fromEntries(MENUS.map((menu) => [menu + 'Menu', false])),
        spriteMenus: []
      }
    },
    selectedSprite: null,
    /** The tech tree reference screen (D60), over the game. */
    techTreeOpen: false,
    /** When the ship began stretching into a black hole (Date.now()), or null (black-hole-entry.vue). */
    blackHoleEntry: null,
    minerva: {
      terminal: {
        history: []
      }
    },
    // Whether the selected sprite's info card (or, with nothing selected, the scope) is shown.
    // Clicking the selected sprite toggles it.
    showScope: true,
    // Whether the Minerva panel (backtick) is open.
    showMinerva: false,
    // Whether the neighbor-star view is showing (zoomed out past the heliopause; see neighbor-view.svg.vue).
    neighborView: false,
    // Zooming out toward the neighbor view (zoomOutToNeighbors); it opens when the zoom arrives.
    neighborViewPending: false,
    /** The galaxy map's pan, in world units: the background's parallax follows it as it does the system camera. */
    galaxyPan: { x: 0, y: 0 },
    // A jump's transaction has been sent and the new system hasn't loaded yet (GameState moveToSystem).
    jumpPending: false,
    // A sent jump that failed: { at: ms timestamp, reason }. The jump animation stalls (jump-animation.svg.vue).
    jumpStall: null,
    // A wheel zoom with nothing selected keeps this world point under this screen point (pixels from the
    // screen's center) while its zoom tween runs: { screenX, screenY, x, y }.
    zoomAnchor: null,
    // Where each shown name goes so names don't overlap: sprite key → 'below' | 'above' | 'hidden'
    // (libs/label-layout.js; laid out by the map a few times a second).
    labelPlacements: {},
    // The sprite under the pointer (its key), so its orbit ring can be drawn bright.
    hovered: null
  }),
  getters: {
    /** Screen pixels per map-group unit, before the camera's zoom. */
    groupPixels: (state) => (state.baseScale * state.screenSize.height) / state.viewport.resolution,
    /** The zoom at which the heliopause spans CAMERA.NEIGHBOR_SWITCH_SHARE of the screen: where the system hands over to the galaxy map. */
    neighborSwitchScale() {
      const short = Math.min(this.screenSize.width, this.screenSize.height) || 1
      return Math.min(CAMERA.MAX_SCALE, (HELIOPAUSE_RADIUS * this.groupPixels) / (CAMERA.NEIGHBOR_SWITCH_SHARE * short))
    },
    /** Screen pixels per world unit as the world layer is drawn (changes only on a redraw). */
    drawnPixelsPerUnit() {
      return this.groupPixels / this.drawnView.scale
    },
    /** Screen pixels per world unit for the live camera. */
    livePixelsPerUnit() {
      return this.groupPixels / this.viewport.scale
    },
    /**
     * Whether a circle at world (x, y) with the given world radius is on screen (with a margin),
     * for the live camera. The world sits 100 group units above the screen center.
     */
    isOnScreen() {
      const pixels = this.livePixelsPerUnit
      const halfWidth = this.screenSize.width / 2 + OFFSCREEN_MARGIN_PX
      const halfHeight = this.screenSize.height / 2 + OFFSCREEN_MARGIN_PX
      const offsetY = WORLD_OFFSET_Y * this.groupPixels
      return (x, y, radius = 0) => {
        const dx = Math.abs((x + this.viewport.x) * pixels)
        const dy = Math.abs((y + this.viewport.y) * pixels + offsetY)
        const r = radius * pixels
        return dx - r < halfWidth && dy - r < halfHeight
      }
    },
    /** A long camera zoom is under way (arriving in a system, flying to a selection), not a wheel step. */
    cameraFlying: (state) => (state.viewport.scaleTween?.duration ?? 0) >= CAMERA_FLIGHT_MS,
    minervaHistory: (state) => state.minerva.terminal.history,
    jumpAnimationState: (state) => state.hud.jumpAnimationState,
    selected: (state) => state.selectedSprite,
    menuState: (state) => state.hud.menuState,
    /** A full menu is open (chat excepted: it sits beside the map). */
    isMenuOn: (state) => MENUS.some((menu) => menu !== 'chat' && state.hud.menuState[menu + 'Menu']),
    cameraMotionRemaining: (state) => {
      let x = 0
      let y = 0
      let z = 0
      if (state.viewport.xTween != null) {
        x = Math.abs(state.viewport.x - state.viewport.xTween.target)
      }
      if (state.viewport.yTween != null) {
        y = Math.abs(state.viewport.y - state.viewport.yTween.target)
      }
      if (state.viewport.scaleTween != null) {
        z = Math.abs(state.viewport.scale - state.viewport.scaleTween.target)
      }
      return x + y + z
    },
    viewRatio: (state) => {
      return state.viewport.width / state.viewport.height
    },
    /** The HUD's size setting (stores/config.js): its corner controls are drawn this much bigger. */
    hudScale: () => useConfigStore().uiScale,
    leftMostX: (state) => {
      return 0 - state.viewport.width / 2
    },
    rightMostX: (state) => {
      return state.viewport.width / 2
    },
    topMostY: (state) => {
      return 0 - state.viewport.height / 2
    },
    bottomMostY: (state) => {
      return state.viewport.height / 2
    }
  },
  actions: {
    calculateViewableArea({ x, y }) {
      let ratio = this.viewport.resolution / y
      this.viewport.width = parseInt(x * ratio * 0.8)
      this.viewport.height = parseInt(this.viewport.resolution * 0.8)
      this.screenSize.width = parseInt(x)
      this.screenSize.height = parseInt(y)
    },
    /** Shows or hides the selection's card (nothing to show or hide with nothing selected). */
    toggleScope() {
      if (this.selectedSprite == null) return
      this.showScope = !this.showScope
    },
    toggleMinerva() {
      this.showMinerva = !this.showMinerva
      if (this.showMinerva) gameAudio().speak('console')
    },
    drawWorldAt(view) {
      // Draw for a camera position on the device-pixel grid. Every layer and sprite then rounds
      // onto the same grid, so the roundings cancel: an object the camera follows stays perfectly
      // still instead of shifting a pixel back and forth.
      const devicePixelsPerUnit = (this.groupPixels / view.scale) * (window.devicePixelRatio || 1)
      this.drawnView = {
        x: Math.round(view.x * devicePixelsPerUnit) / devicePixelsPerUnit,
        y: Math.round(view.y * devicePixelsPerUnit) / devicePixelsPerUnit,
        scale: view.scale
      }
    },
    selectSprite(spriteId) {
      // Choosing something else cancels a zoom out to the neighbor view (zoomOutToNeighbors re-arms it).
      this.neighborViewPending = false
      this.zoomAnchor = null
      if (this.selectedSprite != spriteId) {
        // close old menu
        this.selectedSprite = spriteId

        this.viewport.xTween = new Tween(this.viewport.x, this.viewport.x, CAMERA.SELECT_TWEEN_MS)
        this.viewport.yTween = new Tween(this.viewport.y, this.viewport.y, CAMERA.SELECT_TWEEN_MS)
        this.viewport.scaleTween = new Tween(this.viewport.scale, this.viewport.scale, CAMERA.SELECT_TWEEN_MS)
      }
    },
    selectNone() {
      this.neighborViewPending = false
      this.selectedSprite = null
      this.viewport.xTween = null
      this.viewport.yTween = null
    },
    setSelectedTelemetry(telemetry) {
      let newX = telemetry.translatex * -1
      let newY = telemetry.translatey * -1
      if (this.viewport.xTween != null) {
        this.viewport.xTween.updateTarget(newX)
      } else {
        this.viewport.x = newX
      }
      if (this.viewport.yTween != null) {
        this.viewport.yTween.updateTarget(newY)
      } else {
        this.viewport.y = newY
      }
      // a zoom tween that has nothing left to do takes on the selected sprite's zoom
      if (this.viewport.scaleTween != null && this.viewport.scaleTween.delta == 0) {
        this.viewport.scaleTween.updateTarget(telemetry.scale)
      }
    },
    viewportToTime(time) {
      if (this.viewport.scaleTween != null) {
        this.viewport.scale = this.viewport.scaleTween.valueAt(time)
        if (this.zoomAnchor) this.keepUnder(this.zoomAnchor)
        if (this.viewport.scaleTween.isDone(time)) {
          this.viewport.scaleTween = null
          this.zoomAnchor = null
          // zoomOutToNeighbors: arrived at the edge of the system
          if (this.neighborViewPending) {
            this.neighborViewPending = false
            this.enterNeighborView()
          }
        }
      }

      if (this.viewport.rotationTween != null) {
        this.viewport.rotation = this.viewport.rotationTween.valueAt(time)
        if (this.viewport.rotationTween.isDone(time)) {
          this.viewport.rotationTween = null
        }
      }

      if (this.viewport.xTween != null) {
        this.viewport.x = this.viewport.xTween.valueAt(time)
        if (this.viewport.xTween.isDone(time)) {
          this.viewport.xTween = null
        }
      }

      if (this.viewport.yTween != null) {
        this.viewport.y = this.viewport.yTween.valueAt(time)
        if (this.viewport.yTween.isDone(time)) {
          this.viewport.yTween = null
        }
      }

      // confine scale
      if (this.viewport.scale > CAMERA.MAX_SCALE) {
        this.viewport.scale = CAMERA.MAX_SCALE
      }
      if (this.viewport.scale < CAMERA.MIN_SCALE_SNAP) {
        this.viewport.scale = CAMERA.MIN_SCALE
      }

      // confine x
      if (Math.abs(this.viewport.x) > CAMERA.MAX_PAN) {
        this.viewport.x = CAMERA.MAX_PAN * Math.sign(this.viewport.x)
      }
      // confine y
      if (Math.abs(this.viewport.y) > CAMERA.MAX_PAN) {
        this.viewport.y = CAMERA.MAX_PAN * Math.sign(this.viewport.y)
      }
    },
    moveUp(distance) {
      this.viewport.yTween = new Tween(
        this.viewport.y,
        this.viewport.y + distance * this.viewport.scale,
        CAMERA.NUDGE_TWEEN_MS
      )
    },
    moveDown(distance) {
      this.viewport.yTween = new Tween(
        this.viewport.y,
        this.viewport.y - distance * this.viewport.scale,
        CAMERA.NUDGE_TWEEN_MS
      )
    },
    moveLeft(distance) {
      this.viewport.xTween = new Tween(
        this.viewport.x,
        this.viewport.x + distance * this.viewport.scale,
        CAMERA.NUDGE_TWEEN_MS
      )
    },
    moveRight(distance) {
      this.viewport.xTween = new Tween(
        this.viewport.x,
        this.viewport.x - distance * this.viewport.scale,
        CAMERA.NUDGE_TWEEN_MS
      )
    },
    scaleBy(scaler) {
      this.viewport.scale = Math.min(CAMERA.MAX_SCALE, scaler * this.viewport.scale)
    },
    scaleAnimateBy({ scaler, time }) {
      if (this.viewport.scaleTween == null) {
        this.viewport.scaleTween = new Tween(
          this.viewport.scale,
          Math.min(CAMERA.MAX_SCALE, scaler * this.viewport.scale),
          time
        )
        this.viewport.scaleTween.useLinear()
      } else {
        this.viewport.scaleTween.updateTarget(Math.min(CAMERA.MAX_SCALE, scaler * this.viewport.scaleTween.target))
      }
    },
    scaleTo(scale) {
      this.viewport.scale = scale
    },
    scaleAnimateTo({ scale, time }) {
      this.viewport.scaleTween = new Tween(this.viewport.scale, scale, time)
    },
    rotateTo(rotation) {
      this.viewport.rotationTween = new Tween(this.viewport.rotation, rotation, CAMERA.NUDGE_TWEEN_MS)
    },
    viewTo(location) {
      this.viewport.x = location.x
      this.viewport.y = location.y
    },
    viewAnimateMoveTo(location) {
      if (this.viewport.xTween == null) {
        this.viewport.xTween = new Tween(this.viewport.x, location.x, location.time)
        this.viewport.xTween.useLinear()
      } else {
        this.viewport.xTween.updateTarget(location.x)
      }

      if (this.viewport.yTween == null) {
        this.viewport.yTween = new Tween(this.viewport.y, location.y, location.time)
        this.viewport.yTween.useLinear()
      } else {
        this.viewport.yTween.updateTarget(location.y)
      }
    },
    mousewheelAnimateTo({ scale, time }) {
      // A wheel step during a camera flight (arriving in a system, flying to a selection, zooming out
      // to the neighbors) takes the zoom over from where it is, instead of bending the flight's curve.
      if (this.cameraFlying) {
        this.viewport.scaleTween = null
        this.neighborViewPending = false
      }
      if (this.viewport.scaleTween == null) {
        this.viewport.scaleTween = new Tween(
          this.viewport.scale,
          Math.min(CAMERA.MAX_SCALE, scale * this.viewport.scale),
          time
        )
        this.viewport.scaleTween.useLinear()
      } else {
        this.viewport.scaleTween.updateTarget(Math.min(CAMERA.MAX_SCALE, scale * this.viewport.scaleTween.target))
      }
    },

    /** The world point under a screen point (pixels from the screen's center), for the live camera. */
    worldAt(screenX, screenY) {
      const pixels = this.livePixelsPerUnit
      return {
        x: screenX / pixels - this.viewport.x,
        y: (screenY - WORLD_OFFSET_Y * this.groupPixels) / pixels - this.viewport.y
      }
    },
    /** Moves the camera so the world point { x, y } sits under { screenX, screenY } at the current zoom. */
    keepUnder({ screenX, screenY, x, y }) {
      const pixels = this.livePixelsPerUnit
      this.viewport.x = screenX / pixels - x
      this.viewport.y = (screenY - WORLD_OFFSET_Y * this.groupPixels) / pixels - y
    },
    /**
     * One wheel step toward or away from a screen point (pixels from the center), like a map: the spot
     * under the cursor stays put. While the camera follows a selection, it zooms around the selection.
     */
    wheelZoomAt({ screenX, screenY, factor, time }) {
      this.mousewheelAnimateTo({ scale: factor, time })
      if (this.selectedSprite != null) return
      this.viewport.xTween = null
      this.viewport.yTween = null
      this.zoomAnchor = { screenX, screenY, ...this.worldAt(screenX, screenY) }
    },
    /** Drags the map by a pointer's movement in pixels: the world moves exactly with the pointer. */
    panBy(dx, dy) {
      const pixels = this.livePixelsPerUnit
      this.zoomAnchor = null
      this.viewport.xTween = null
      this.viewport.yTween = null
      this.viewport.x += dx / pixels
      this.viewport.y += dy / pixels
    },
    /** A pinch: zoom to `scale` with the world point { x, y } under { screenX, screenY }. */
    pinchTo({ scale, screenX, screenY, x, y }) {
      this.zoomAnchor = null
      this.viewport.scaleTween = null
      this.viewport.scale = Math.min(CAMERA.MAX_SCALE, Math.max(CAMERA.MIN_SCALE, scale))
      this.keepUnder({ screenX, screenY, x, y })
    },
    /** The pointer moved onto a sprite (its key), or off one (null, with the key it left). */
    hoverSprite(key, leaving = null) {
      if (key != null) this.hovered = key
      else if (this.hovered === leaving) this.hovered = null
    },
    setLabelPlacements(placements) {
      const changed = (key) => this.labelPlacements[key] !== placements[key]
      if (Object.keys(placements).some(changed) || Object.keys(this.labelPlacements).some(changed)) {
        this.labelPlacements = placements
      }
    },
    setMouse(payload) {
      this.screenSize.mouse.x = payload.x
      this.screenSize.mouse.y = payload.y
      this.screenSize.mouse.xPercent = payload.x / this.screenSize.width
      this.screenSize.mouse.yPercent = payload.y / this.screenSize.height
    },
    addToHistory(payload) {
      this.minerva.terminal.history.push(payload)
    },
    clearHistory() {
      this.minerva.terminal.history = []
    },
    /** Zoomed out past the heliopause: show the neighboring stars (unless a menu or a jump is in the way). */
    enterNeighborView() {
      if (this.isMenuOn || this.hud.jumpAnimationState) return
      this.neighborView = true
    },
    exitNeighborView() {
      this.neighborView = false
    },
    /**
     * The star button's second click (and the card's jump buttons): select the star, zoom all the way
     * out as if scrolling, then open the neighbor view to choose where to jump.
     */
    zoomOutToNeighbors() {
      if (this.neighborView) return
      this.selectSprite(STAR_KEY)
      // Out to where the heliopause nearly fills the screen; the galaxy map takes the zoom on from there.
      this.viewport.scaleTween = new Tween(this.viewport.scale, this.neighborSwitchScale, CAMERA.NEIGHBOR_ZOOM_MS)
      this.viewport.scaleTween.useGeometric()
      this.neighborViewPending = true
    },
    /** Backs out one level (Esc, the gamepad's B): the neighbor view, then an open menu, then the selection. */
    back() {
      const menus = this.hud.menuState
      if (this.neighborView) return this.exitNeighborView()
      if (this.isMenuOn || menus.chatMenu || menus.leaderboardMenu) return this.closeMenu()
      if (this.selectedSprite != null) return this.selectNone()
    },
    /** Selects the next (`step` 1) or previous (-1) of `planets` (keys), from the selected one or from an end. */
    stepPlanet({ planets, step }) {
      if (planets.length === 0) return
      const index = planets.indexOf(this.selectedSprite)
      const next = index === -1 ? (step > 0 ? 0 : planets.length - 1) : (index + step + planets.length) % planets.length
      this.selectSprite(planets[next])
    },
    /** Back from the neighbor view (clicking its star) or a stalled jump: select the star and zoom in to the system. */
    zoomInToStar() {
      this.neighborViewPending = false
      this.neighborView = false
      this.selectSprite(STAR_KEY)
      this.viewport.scaleTween = new Tween(this.viewport.scale, CAMERA.ARRIVAL_SYSTEM_SCALE, CAMERA.NEIGHBOR_ZOOM_MS)
      this.viewport.scaleTween.useGeometric()
    },
    openMenu(menu) {
      this.closeMenu()
      if (MENUS.includes(menu)) this.hud.menuState[menu + 'Menu'] = true
    },
    closeMenu() {
      for (const name of MENUS) this.hud.menuState[name + 'Menu'] = false
    },
    // unevaluated

    /** Ends the jump animation, but never before it has played for CAMERA.MIN_JUMP_ANIMATION_MS. */
    jumpAnimationOff() {
      // A stalled jump stays on screen until the player has read why (jumpRecover).
      if (!this.hud.jumpAnimationState || this.jumpStall) return
      clearTimeout(jumpAnimationTimer)
      const wait = jumpAnimationStartedAt + CAMERA.MIN_JUMP_ANIMATION_MS - Date.now()
      if (wait > 0) {
        jumpAnimationTimer = setTimeout(() => this.jumpAnimationOff(), wait)
        return
      }
      this.hud.jumpAnimationState = false
      // Arrived: said now, not when the new system loaded, so it doesn't cut off "initiating jump".
      gameAudio().speak('jumpComplete')
    },
    /** A jump that was already under way failed: stall the jump animation and say why. */
    jumpStalled(reason) {
      clearTimeout(jumpAnimationTimer)
      this.jumpStall = { at: Date.now(), reason }
    },
    /** The player read the stall message: back to the system, right away. */
    jumpRecover() {
      clearTimeout(jumpAnimationTimer)
      this.jumpStall = null
      this.hud.jumpAnimationState = false
      this.zoomInToStar()
    },
    jumpAnimationOn() {
      jumpAnimationStartedAt = Date.now()
      this.jumpStall = null
      this.neighborView = false
      this.selectedSprite = null
      this.viewport.x = 0
      this.viewport.y = 0
      this.viewport.scale = CAMERA.JUMP_ANIMATION_SCALE
      this.hud.jumpAnimationState = true
    }
  }
})
