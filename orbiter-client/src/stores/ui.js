import { defineStore } from 'pinia'
import { gameAudio } from '@/libs/08audio'
import Tween from '@/libs/tween'
import { STAR_KEY } from '@orbiter8/sdk/system'
import { CAMERA, MAP_GROUP_SCALE, MAP_RESOLUTION, WORLD_OFFSET_Y, HELIOPAUSE_RADIUS } from '@/constants'
import { useConfigStore } from '@/stores/config'
import { JUMP_DEPART_MS, JUMP_ARRIVE_MS, slidesWanted } from '@/libs/jump-slide'

// Camera zooms this long or longer are flights (arrivals, selections), not wheel steps (ms).
const CAMERA_FLIGHT_MS = 500

// Sprites this far past the screen edge still count as on screen (labels, glows).
const OFFSCREEN_MARGIN_PX = 100

// When the jump animation started, and its pending end (see jumpAnimationOff).
let jumpAnimationStartedAt = 0
let jumpAnimationTimer = null
// The jump's next phase change (away → cruise, arrive → done), and what waits for the cruise (a new
// system that loaded while the old one was still sliding away).
let jumpPhaseTimer = null
let onCruise = []

/**
 * The HUD's full-screen menus (hud.svg.vue), each shown by `menuState[name + 'Menu']`, including
 * colony (a planet's people, storage, buildings and transfers), armory, loadout, siege and the siege feed.
 */
/** Where the selection menu's open or closed state is remembered. */
const ACTIONS_OPEN_KEY = 'o8.hud.actionsOpen'
function readActionsOpen() {
  try {
    return typeof localStorage === 'undefined' || localStorage.getItem(ACTIONS_OPEN_KEY) !== '0'
  } catch {
    return true
  }
}

/** The free space right of an open menu that's worth moving the selection into (CSS pixels). */
const MIN_ROOM_BESIDE_MENU_PX = 180
/** (`objects` is the list of what's in the system: it took in the old planets, ports and ships menus.) */
const MENUS = ['objects', 'profile', 'minerva', 'settings', 'trade', 'shipyard', 'chat', 'leaderboard', 'colony', 'armory', 'loadout', 'siege', 'feed', 'help', 'asteroid']

/** The old list menus' names still open the list, on that kind (the P key, older callers). */
const LIST_KINDS = { planets: 'planet', ports: 'station', ships: 'ship' }
/** Small things the HUD remembers between visits: the list's filter, and whether the map is folded away. */
const HUD_PREFS_KEY = 'o8.hud.prefs'
function readHudPrefs() {
  try {
    return JSON.parse(globalThis.localStorage?.getItem(HUD_PREFS_KEY) ?? '{}') ?? {}
  } catch {
    return {}
  }
}

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
    // The browser window's size in pixels, its pixel ratio, and where the mouse is in it.
    screenSize: {
      width: MAP_RESOLUTION,
      height: MAP_RESOLUTION,
      // The device pixel ratio: it changes without a resize when the window moves to a screen with
      // other scaling, and every canvas has to be resized for it (watchPixelRatio).
      dpr: typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1,
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
    /**
     * This jump goes through a black hole, from the moment the move is sent until you're out the far
     * side: it has its own passage (libs/hole-passage.js) and music, not the jump's streaks.
     */
    jumpThroughHole: false,
    minerva: {
      terminal: {
        history: []
      }
    },
    // Whether the selected sprite's info card (or, with nothing selected, the scope) is shown.
    // Clicking the selected sprite toggles it.
    showScope: true,
    // Whether the selection's menu is slid out from behind its card (the tab on its edge, A, pad R3 with
    // the card shown). Remembered for every selection, and across visits.
    actionsOpen: readActionsOpen(),
    /** The list of what's here (hud/objects/objects-panel.vue): which kind it shows, and for stations which of them. */
    listKind: readHudPrefs().listKind ?? 'all',
    listWant: readHudPrefs().listWant ?? null,
    /** Whose info card the profile menu shows (an address), or null (hud/profile/profile-panel.vue). */
    profileOf: null,
    /** The minimap and zoom are folded away under the system's name (hud/system-block.vue). */
    mapFolded: Boolean(readHudPrefs().mapFolded),
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
    // The jump's phase (libs/jump-slide.js): 'depart' (the system slides away), 'cruise', 'arrive' (the
    // new system slides in), or null; when it began (Date.now()); the zoom the jump left at (the new
    // system arrives at it, so the backdrop never jumps); and whether the ship stalled out (no fly-off).
    jumpPhase: null,
    jumpPhaseAt: 0,
    jumpDepartScale: 1,
    jumpShipGone: false,
    // The jump left from the galaxy map: the map slides away with the system.
    jumpFromMap: false,
    // A wheel zoom with nothing selected keeps this world point under this screen point (pixels from the
    // screen's center) while its zoom tween runs: { screenX, screenY, x, y }.
    zoomAnchor: null,
    // Where each shown name goes so names don't overlap: sprite key → 'below' | 'above' | 'hidden'
    // (libs/label-layout.js; laid out by the map a few times a second).
    labelPlacements: {},
    // The sprite under the pointer (its key), so its orbit ring can be drawn bright.
    hovered: null,
    // Where an open menu's sheet covers the screen ({ left, right } in CSS pixels), or null
    // (components/hud/menu-sheet.vue): the camera keeps the selection beside it.
    menuBox: null,
    // the shift the camera last eased to (selectionShiftPx)
    cameraShiftPx: 0
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
    /**
     * How far right of the screen's center the selection sits (CSS pixels): in the middle of the free
     * space right of an open menu, when there's room for it to be seen there; else 0 (centered).
     */
    selectionShiftPx() {
      const box = this.menuBox
      const width = this.screenSize.width
      if (!box || !width || box.left <= 0) return 0
      const room = width - box.right
      if (room < MIN_ROOM_BESIDE_MENU_PX) return 0
      return box.right + room / 2 - width / 2
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
    /** Cruising between stars: the star system isn't drawn (it slides away and in around that: libs/jump-slide.js). */
    systemHidden: (state) => state.hud.jumpAnimationState && (state.jumpPhase === 'cruise' || state.jumpPhase === null),
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
    /**
     * Keeps screenSize.dpr up to date: a media query matching the current ratio fires when it stops
     * matching (another screen, browser zoom), then is set up again for the new ratio.
     */
    watchPixelRatio() {
      if (typeof window === 'undefined' || !window.matchMedia || this.pixelRatioWatched) return
      this.pixelRatioWatched = true
      const arm = () => {
        const query = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`)
        query.addEventListener('change', () => {
          this.screenSize.dpr = window.devicePixelRatio || 1
          arm()
        }, { once: true })
      }
      this.screenSize.dpr = window.devicePixelRatio || 1
      arm()
    },
    calculateViewableArea({ x, y }) {
      let ratio = this.viewport.resolution / y
      this.viewport.width = parseInt(x * ratio * 0.8)
      this.viewport.height = parseInt(this.viewport.resolution * 0.8)
      this.screenSize.width = parseInt(x)
      this.screenSize.height = parseInt(y)
    },
    /**
     * Once showed or hid the selection's card. The card is never put away now (Koda, 2026-11-21:
     * "never collapsed"), so this only keeps it shown; its callers (pressing the selection again, pad
     * R3) are left in place.
     */
    toggleScope() {
      this.showScope = true
    },
    /** Slides the selection's menu out from behind its card, or back behind it. */
    toggleActions(open = !this.actionsOpen) {
      this.actionsOpen = open
      try {
        localStorage.setItem(ACTIONS_OPEN_KEY, open ? '1' : '0')
      } catch {
        // (private browsing: remembered for this visit only)
      }
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
    setMenuBox(box) {
      const same = box && this.menuBox && Math.abs(box.left - this.menuBox.left) < 1 && Math.abs(box.right - this.menuBox.right) < 1
      if (!same && (box || this.menuBox)) this.menuBox = box
    },
    setSelectedTelemetry(telemetry) {
      // Beside an open menu, not under it: the camera eases over when the shift changes.
      const shift = this.selectionShiftPx
      if (shift !== this.cameraShiftPx) {
        this.cameraShiftPx = shift
        if (this.viewport.xTween == null) this.viewport.xTween = new Tween(this.viewport.x, this.viewport.x, CAMERA.SELECT_TWEEN_MS)
      }
      let newX = telemetry.translatex * -1 + shift / this.livePixelsPerUnit
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
    /**
     * The zoom rail (components/hud/zoom-rail.vue): straight to a zoom while its thumb is dragged
     * (`time` 0), or there over `time` ms. Takes over from any zoom under way, including a flight.
     */
    zoomTo(scale, time = 0) {
      const target = Math.min(CAMERA.MAX_SCALE, Math.max(CAMERA.MIN_SCALE, scale))
      this.zoomAnchor = null
      this.neighborViewPending = false
      if (!time) {
        this.viewport.scaleTween = null
        this.viewport.scale = target
        return
      }
      this.viewport.scaleTween = new Tween(this.viewport.scale, target, time)
      this.viewport.scaleTween.useGeometric()
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
      if (LIST_KINDS[menu]) {
        this.setList(LIST_KINDS[menu])
        menu = 'objects'
      }
      if (MENUS.includes(menu)) this.hud.menuState[menu + 'Menu'] = true
    },
    /** Opens a pilot's info card: any owner's name leads here (docs/ui-plan.md 4.5). */
    openProfile(address) {
      if (!address) return
      this.profileOf = String(address)
      this.openMenu('profile')
    },
    /** The list's filter: a kind ('all', 'planet', 'station', 'moon', 'asteroid', 'ship', 'yours'), and for stations which ('buying', 'yards', 'armory' or null). */
    setList(kind, want = null) {
      this.listKind = kind
      this.listWant = kind === 'station' ? want : null
      this.saveHudPrefs()
    },
    toggleMapFold() {
      this.mapFolded = !this.mapFolded
      this.saveHudPrefs()
    },
    saveHudPrefs() {
      try {
        localStorage.setItem(HUD_PREFS_KEY, JSON.stringify({ listKind: this.listKind, listWant: this.listWant, mapFolded: this.mapFolded }))
      } catch {
        // private windows may refuse storage: the choice lasts this visit
      }
    },
    closeMenu() {
      for (const name of MENUS) this.hud.menuState[name + 'Menu'] = false
    },
    // unevaluated

    /**
     * The new system has loaded: ends the cruise, but never before the jump has played for
     * CAMERA.MIN_JUMP_ANIMATION_MS (Minerva's lines); then the ship flies off and the new system slides in.
     */
    jumpAnimationOff() {
      // A stalled jump stays on screen until the player has read why (jumpRecover).
      if (!this.hud.jumpAnimationState || this.jumpStall || this.jumpPhase === 'arrive') return
      clearTimeout(jumpAnimationTimer)
      const wait = Math.max(jumpAnimationStartedAt + CAMERA.MIN_JUMP_ANIMATION_MS, this.jumpPhase === 'depart' ? this.jumpPhaseAt + JUMP_DEPART_MS : 0) - Date.now()
      if (wait > 0) {
        jumpAnimationTimer = setTimeout(() => this.jumpAnimationOff(), wait)
        return
      }
      // Arrived: said now, not when the new system loaded, so it doesn't cut off "initiating jump".
      gameAudio().speak('jumpComplete')
      this.jumpArrive()
    },
    /** The ship flies off, the new system slides in (map.vue puts the camera on your ship), then the HUD is back. */
    jumpArrive({ shipGone = false } = {}) {
      clearTimeout(jumpPhaseTimer)
      this.jumpShipGone = shipGone
      if (!slidesWanted()) return this.jumpEnd()
      this.jumpPhase = 'arrive'
      this.jumpPhaseAt = Date.now()
      jumpPhaseTimer = setTimeout(() => this.jumpEnd(), JUMP_ARRIVE_MS)
    },
    jumpEnd() {
      clearTimeout(jumpPhaseTimer)
      this.jumpPhase = null
      this.jumpFromMap = false
      this.jumpThroughHole = false
      this.hud.jumpAnimationState = false
    },
    /** A jump that was already under way failed: stall the jump animation and say why. */
    jumpStalled(reason) {
      clearTimeout(jumpAnimationTimer)
      this.jumpStall = { at: Date.now(), reason }
    },
    /** The player read the stall message: back to the system, sliding in as an arrival does. */
    jumpRecover() {
      clearTimeout(jumpAnimationTimer)
      this.jumpStall = null
      if (this.jumpPhase === 'depart') this.jumpCruise()
      this.jumpArrive({ shipGone: true })
    },
    /** Runs `then` once the old system has slid away (now, if it has). */
    whenCruising(then) {
      if (this.jumpPhase === 'depart') onCruise.push(then)
      else then()
    },
    jumpAnimationOn() {
      jumpAnimationStartedAt = Date.now()
      clearTimeout(jumpPhaseTimer)
      this.jumpStall = null
      this.jumpShipGone = false
      this.jumpFromMap = this.neighborView
      this.jumpDepartScale = this.viewport.scaleTween?.target ?? this.viewport.scale
      this.neighborView = false
      this.hud.jumpAnimationState = true
      // Through a black hole there's no sliding away: the hole has already swallowed the ship
      // (black-hole-entry.vue), and the passage is what's behind it.
      if (!slidesWanted() || this.jumpThroughHole) return this.jumpCruise()
      // The system (or the galaxy map) slides away first; the camera stays put under it.
      this.jumpPhase = 'depart'
      this.jumpPhaseAt = Date.now()
      jumpPhaseTimer = setTimeout(() => this.jumpCruise(), JUMP_DEPART_MS)
    },
    /** The old system is gone: the camera resets for the new one (out of sight), and what waited runs. */
    jumpCruise() {
      clearTimeout(jumpPhaseTimer)
      this.jumpPhase = 'cruise'
      this.jumpPhaseAt = Date.now()
      this.jumpFromMap = false
      this.selectedSprite = null
      this.neighborViewPending = false
      this.zoomAnchor = null
      this.viewport.xTween = null
      this.viewport.yTween = null
      this.viewport.scaleTween = null
      this.viewport.x = 0
      this.viewport.y = 0
      this.viewport.scale = this.jumpDepartScale
      const waiting = onCruise
      onCruise = []
      waiting.forEach((then) => then())
    }
  }
})
