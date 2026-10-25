import { defineStore } from 'pinia'
import Tween from '@/libs/tween'
import { STAR_KEY } from '@/libs/sprite'
import { CAMERA, MAP_GROUP_SCALE, MAP_RESOLUTION, WORLD_OFFSET_Y } from '@/constants'

// Sprites this far past the screen edge still count as on screen (labels, glows).
const OFFSCREEN_MARGIN_PX = 100

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
    //todo: this needs a more verbose name
    container: {
      width: MAP_RESOLUTION,
      height: MAP_RESOLUTION,
      mouse: {
        x: 0,
        y: 0,
        xFromCenter: 0,
        yFromCenter: 0,
      },
    },
    hud: {
      spriteToDisplay: null,
      jumpAnimationState: false,

      menuState: {
        menuShowing: false, //should this just be a getter?

        jumpMenu: false,
        planetsMenu: false,
        settingsMenu: false,
        shipsMenu: false,
        tradeMenu: false,
        shipyardMenu: false,
        chatMenu: false,
        spriteMenus: []

      }
    },
    selectedSprite: null,
    minerva: {
      terminal: {
        history: []
      }
    },
    showLabels: false
  }),
  getters: {
    /** Screen pixels per map-group unit, before the camera's zoom. */
    groupPixels: state => state.baseScale * state.container.height / state.viewport.resolution,
    /** Screen pixels per world unit as the world layer is drawn (changes only on a redraw). */
    drawnPixelsPerUnit () {
      return this.groupPixels / this.drawnView.scale
    },
    /** Screen pixels per world unit for the live camera. */
    livePixelsPerUnit () {
      return this.groupPixels / this.viewport.scale
    },
    /**
     * Whether a circle at world (x, y) with the given world radius is on screen (with a margin),
     * for the live camera. The world sits 100 group units above the screen center.
     */
    isOnScreen () {
      const pixels = this.livePixelsPerUnit
      const halfWidth = this.container.width / 2 + OFFSCREEN_MARGIN_PX
      const halfHeight = this.container.height / 2 + OFFSCREEN_MARGIN_PX
      const offsetY = WORLD_OFFSET_Y * this.groupPixels
      return (x, y, radius = 0) => {
        const dx = Math.abs((x + this.viewport.x) * pixels)
        const dy = Math.abs((y + this.viewport.y) * pixels + offsetY)
        const r = radius * pixels
        return dx - r < halfWidth && dy - r < halfHeight
      }
    },
    minervaHistory: state => state.minerva.terminal.history,
    spriteToDisplay: state => state.hud.spriteToDisplay,
    jumpAnimationState: state => state.hud.jumpAnimationState,
    selected: state => state.selectedSprite,
    menuState: state => state.hud.menuState,
    isMenuOn: state => {
      if (state.hud.menuState.jumpMenu) {
        return true
      }
      if (state.hud.menuState.planetsMenu) {
        return true
      }
      if (state.hud.menuState.settingsMenu) {
        return true
      }
      if (state.hud.menuState.shipsMenu) {
        return true
      }
      if (state.hud.menuState.tradeMenu) {
        return true
      }
      if (state.hud.menuState.shipyardMenu) {
        return true
      }
      return false
    },
    cameraMotionRemaining: state => {
      let x = 0
      let y = 0
      let z = 0
      if ((state.viewport.xTween != null)) {
        x = Math.abs(state.viewport.x - state.viewport.xTween.target)
      }
      if ((state.viewport.yTween != null)) {
        y = Math.abs(state.viewport.y - state.viewport.yTween.target)
      }
      if ((state.viewport.scaleTween != null)) {
        z = Math.abs(state.viewport.scale - state.viewport.scaleTween.target)
      }
      return x+y+z
    },
    viewRatio: state => {
      return state.viewport.width / state.viewport.height
    },
    leftMostX: state => {
      return 0 - (state.viewport.width / 2)
    },
    rightMostX: state => {
      return state.viewport.width / 2
    },
    topMostY: state => {
      return 0 - (state.viewport.height / 2)
    },
    bottomMostY: state => {
      return state.viewport.height / 2
    }
  },
  actions: {
    calculateViewableArea ({x, y}) {
      let ratio = this.viewport.resolution / y
      this.viewport.width = parseInt(x * ratio * 0.8)
      this.viewport.height = parseInt(this.viewport.resolution * .8)
      this.container.width = parseInt(x)
      this.container.height = parseInt(y)
    },
    toggleShowLabels () {
      this.showLabels = !this.showLabels
    },
    drawWorldAt (view) {
      this.drawnView = { x: view.x, y: view.y, scale: view.scale }
    },
    selectSprite (spriteId) {
      if (this.selectedSprite != spriteId) {
        // close old menu
        this.selectedSprite = spriteId;

        this.viewport.xTween = new Tween(
          this.viewport.x,
          this.viewport.x,
          CAMERA.SELECT_TWEEN_MS
        )
        this.viewport.yTween = new Tween(
          this.viewport.y,
          this.viewport.y,
          CAMERA.SELECT_TWEEN_MS
        )
        this.viewport.scaleTween = new Tween(
          this.viewport.scale,
          this.viewport.scale,
          CAMERA.SELECT_TWEEN_MS
        )
      }
    },
    selectNone () {
      this.selectedSprite = null
      this.viewport.xTween = null
      this.viewport.yTween = null
    },
    setSelectedTelemetry (telemetry) {
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
      if (this.viewport.scaleTween != null &&
          this.viewport.scaleTween.delta == 0 ) {
        this.viewport.scaleTween.updateTarget(telemetry.scale)
      }
    },
    viewportToTime (time) {
      if (this.viewport.scaleTween != null) {
        this.viewport.scale = this.viewport.scaleTween.valueAt(time)
        if (this.viewport.scaleTween.isDone(time)) {
          this.viewport.scaleTween = null
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
    moveUp (distance) {
      this.viewport.yTween = new Tween(
        this.viewport.y,
        this.viewport.y + (distance * this.viewport.scale),
        CAMERA.NUDGE_TWEEN_MS
      )
    },
    moveDown (distance) {
      this.viewport.yTween = new Tween(
        this.viewport.y,
        this.viewport.y - (distance * this.viewport.scale),
        CAMERA.NUDGE_TWEEN_MS
      )
    },
    moveLeft (distance) {
      this.viewport.xTween = new Tween(
        this.viewport.x,
        this.viewport.x + (distance * this.viewport.scale),
        CAMERA.NUDGE_TWEEN_MS
      )
    },
    moveRight (distance) {
      this.viewport.xTween = new Tween(
        this.viewport.x,
        this.viewport.x - (distance * this.viewport.scale),
        CAMERA.NUDGE_TWEEN_MS
      )
    },
    scaleBy (scaler) {
      this.viewport.scale =  Math.min(CAMERA.MAX_SCALE, scaler * this.viewport.scale)
    },
    scaleAnimateBy ({scaler, time}) {
      if (this.viewport.scaleTween == null) {
        this.viewport.scaleTween = new Tween(
          this.viewport.scale,
          Math.min(CAMERA.MAX_SCALE, scaler * this.viewport.scale),
          time
        )
        this.viewport.scaleTween.useLinear()
      } else {
        this.viewport.scaleTween.updateTarget(
          Math.min(CAMERA.MAX_SCALE, scaler * this.viewport.scaleTween.target)
        )
      }
    },
    scaleTo (scale) {
      this.viewport.scale = scale
    },
    scaleAnimateTo ({scale, time}) {
      this.viewport.scaleTween = new Tween(
        this.viewport.scale,
        scale,
        time
      )
    },
    rotateTo (rotation) {
      this.viewport.rotationTween = new Tween(
        this.viewport.rotation,
        rotation,
        CAMERA.NUDGE_TWEEN_MS
      )
    },
    viewTo (location) {
      this.viewport.x = location.x
      this.viewport.y = location.y
    },
    viewAnimateMoveTo (location) {
      if (this.viewport.xTween == null) {
        this.viewport.xTween = new Tween(
          this.viewport.x,
          location.x,
          location.time
        )
        this.viewport.xTween.useLinear()
      } else {
        this.viewport.xTween.updateTarget(location.x)
      }

      if (this.viewport.yTween == null) {
        this.viewport.yTween = new Tween(
          this.viewport.y,
          location.y,
          location.time
        )
        this.viewport.yTween.useLinear()
      } else {
        this.viewport.yTween.updateTarget(location.y)
      }
    },
    mousewheelAnimateTo ({scale, time}) {
      if (this.viewport.scaleTween == null) {
        this.viewport.scaleTween = new Tween(
          this.viewport.scale,
          Math.min(CAMERA.MAX_SCALE, scale * this.viewport.scale),
          time
        )
        this.viewport.scaleTween.useLinear()
      } else {
        this.viewport.scaleTween.updateTarget(
          Math.min(CAMERA.MAX_SCALE, scale * this.viewport.scaleTween.target),
        )
      }
    },

    setMouse (payload) {
      this.container.mouse.x = payload.x
      this.container.mouse.y = payload.y
      this.container.mouse.xPercent = payload.x / this.container.width
      this.container.mouse.yPercent = payload.y / this.container.height
    },
    addToHistory (payload) {
      this.minerva.terminal.history.push(payload)
    },
    clearHistory () {
      this.minerva.terminal.history = []
    },
    jumpMenuOn () {
      this.selectedSprite = STAR_KEY
      this.viewport.scaleTween = new Tween(
        this.viewport.scale,
        CAMERA.JUMP_MENU_SCALE,
        CAMERA.JUMP_MENU_TWEEN_MS
      )
      this.hud.menuState.jumpMenu = true
    },
    jumpMenuOff () {
      if (this.hud.menuState.jumpMenu) {
        this.viewport.scaleTween = new Tween(
          this.viewport.scale,
          CAMERA.JUMP_MENU_CLOSE_SCALE,
          CAMERA.JUMP_MENU_TWEEN_MS
        )
        this.hud.menuState.jumpMenu = false
      }
    },
    openMenu (menu) {
      this.hud.menuState.shipsMenu = false
      this.hud.menuState.planetsMenu = false
      this.hud.menuState.settingsMenu = false
      this.hud.menuState.tradeMenu = false
      this.hud.menuState.shipyardMenu = false
      this.hud.menuState.chatMenu = false
      switch(menu) {
        case 'planets':
          this.hud.menuState.planetsMenu = true
          break
        case 'ships':
          this.hud.menuState.shipsMenu = true
          break
        case 'settings':
          this.hud.menuState.settingsMenu = true
          break
        case 'trade':
          this.hud.menuState.tradeMenu = true
          break
        case 'shipyard':
          this.hud.menuState.shipyardMenu = true
          break
        case 'chat':
          this.hud.menuState.chatMenu = true
          break
        case 'jump':
          break
        case 'sprite':
          break
      }
    },
    closeMenu () {
      this.hud.menuState.shipsMenu = false
      this.hud.menuState.planetsMenu = false
      this.hud.menuState.settingsMenu = false
      this.hud.menuState.jumpMenu = false
      this.hud.menuState.tradeMenu = false
      this.hud.menuState.shipyardMenu = false
      this.hud.menuState.chatMenu = false
    },
    // unevaluated

    setSpriteToDisplay (payload) {
      this.hud.spriteToDisplay = payload
    },
    jumpAnimationOff () {
      if (this.hud.jumpAnimationState) {
        this.hud.jumpAnimationState = false
      }
    },
    jumpAnimationOn () {
      this.selectedSprite = null
      this.viewport.x = 0
      this.viewport.y = 0
      this.viewport.scale = CAMERA.JUMP_ANIMATION_SCALE
      this.hud.jumpAnimationState = true
    },
  }
})
