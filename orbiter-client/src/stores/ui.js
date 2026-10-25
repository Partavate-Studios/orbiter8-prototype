import { defineStore } from 'pinia'
import Rubber from '@/libs/rubber'

export const useUIStore = defineStore('UI', {
  state: () => ({
    /* Approved */
    viewport: {
      resolution: 1200,
      scale: 400,
      scaleRubber: null,
      rotation: 0.0,
      rotationRubber: null,
      x: 0.0,
      xRubber: null,
      y: 0.0,
      yRubber: null,
      width: 1200,
      height: 1200
    },
    //todo: this needs a more verbose name
    container: {
      width: 1200,
      height: 1200,
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
    viewportTotalRubber: state => {
      let x = 0
      let y = 0
      let z = 0
      if ((state.viewport.xRubber != null)) {
        x = Math.abs(state.viewport.x - state.viewport.xRubber.target)
      }
      if ((state.viewport.yRubber != null)) {
        y = Math.abs(state.viewport.y - state.viewport.yRubber.target)
      }
      if ((state.viewport.scaleRubber != null)) {
        z = Math.abs(state.viewport.scale - state.viewport.scaleRubber.target)
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
      console.log('toggling labels')
      this.showLabels = !this.showLabels
    },
    selectSprite (spriteId) {
      console.log('selecting sprite ', spriteId)
      if (this.selectedSprite != spriteId) {
        // close old menu
        this.selectedSprite = spriteId;

        this.viewport.xRubber = new Rubber(
          this.viewport.x,
          this.viewport.x,
          2000
        )
        this.viewport.yRubber = new Rubber(
          this.viewport.y,
          this.viewport.y,
          2000
        )
        this.viewport.scaleRubber = new Rubber(
          this.viewport.scale,
          this.viewport.scale,
          2000
        )
      }
      //todo: rubber for scale should be here
    },
    selectNone () {
      console.log('unselecting sprites')
      this.selectedSprite = null
      this.viewport.xRubber = null
      this.viewport.yRubber = null
    },
    setSelectedTelemetry (telemetry) {
      let newX = telemetry.translatex * -1
      let newY = telemetry.translatey * -1
      if (this.viewport.xRubber != null) {
        this.viewport.xRubber.updateTarget(newX)
      } else {
        this.viewport.x = newX
      }
      if (this.viewport.yRubber != null) {
        this.viewport.yRubber.updateTarget(newY)
      } else {
        this.viewport.y = newY
      }
      //look for active rubber with no delta left
      if (this.viewport.scaleRubber != null &&
          this.viewport.scaleRubber.delta == 0 ) {
        this.viewport.scaleRubber.updateTarget(telemetry.scale)
      }
    },
    viewportToTime (time) {
      if (this.viewport.scaleRubber != null) {
        this.viewport.scale = this.viewport.scaleRubber.getRubber(time)
        if (this.viewport.scaleRubber.rubberComplete(time)) {
          this.viewport.scaleRubber = null
        }
      }

      if (this.viewport.rotationRubber != null) {
        this.viewport.rotation = this.viewport.rotationRubber.getRubber(time)
        if (this.viewport.rotationRubber.rubberComplete(time)) {
          this.viewport.rotationRubber = null
        }
      }

      if (this.viewport.xRubber != null) {
        this.viewport.x = this.viewport.xRubber.getRubber(time)
        if (this.viewport.xRubber.rubberComplete(time)) {
          this.viewport.xRubber = null
        }
      }

      if (this.viewport.yRubber != null) {
        this.viewport.y = this.viewport.yRubber.getRubber(time)
        if (this.viewport.yRubber.rubberComplete(time)) {
          this.viewport.yRubber = null
        }
      }

      // confine scale
      if (this.viewport.scale > 420) {
        this.viewport.scale = 420
      }
      if (this.viewport.scale < 0.0015) {
        this.viewport.scale = 0.001
      }

      // confine x
      if (Math.abs(this.viewport.x) > 5200) {
        this.viewport.x = 5200 * Math.sign(this.viewport.x)
      }
      // confine y
      if (Math.abs(this.viewport.y) > 5200) {
        this.viewport.y = 5200 * Math.sign(this.viewport.y)
      }
    },
    moveUp (distance) {
      this.viewport.yRubber = new Rubber(
        this.viewport.y,
        this.viewport.y + (distance * this.viewport.scale),
        100
      )
    },
    moveDown (distance) {
      this.viewport.yRubber = new Rubber(
        this.viewport.y,
        this.viewport.y - (distance * this.viewport.scale),
        100
      )
    },
    moveLeft (distance) {
      this.viewport.xRubber = new Rubber(
        this.viewport.x,
        this.viewport.x + (distance * this.viewport.scale),
        100
      )
    },
    moveRight (distance) {
      this.viewport.xRubber = new Rubber(
        this.viewport.x,
        this.viewport.x - (distance * this.viewport.scale),
        100
      )
    },
    scaleBy (scaler) {
      this.viewport.scale =  Math.min(2000, scaler * this.viewport.scale)
    },
    scaleAnimateBy ({scaler, time}) {
      console.log('scale', scaler)
      if (this.viewport.scaleRubber == null) {
        this.viewport.scaleRubber = new Rubber(
          this.viewport.scale,
          Math.min(2000, scaler * this.viewport.scale),
          time
        )
        this.viewport.scaleRubber.setRubberMovementLinear()
      } else {
        this.viewport.scaleRubber.updateTarget(
          Math.min(2000, scaler * this.viewport.scaleRubber.target)
        )
      }
    },
    scaleTo (scale) {
      this.viewport.scale = scale
    },
    scaleAnimateTo ({scale, time}) {
      this.viewport.scaleRubber = new Rubber(
        this.viewport.scale,
        scale,
        time
      )
    },
    rotateTo (rotation) {
      this.viewport.rotationRubber = new Rubber(
        this.viewport.rotation,
        rotation,
        100
      )
    },
    viewTo (location) {
      this.viewport.x = location.x
      this.viewport.y = location.y
    },
    viewAnimateMoveTo (location) {
      if (this.viewport.xRubber == null) {
        this.viewport.xRubber = new Rubber(
          this.viewport.x,
          location.x,
          location.time
        )
        this.viewport.xRubber.setRubberMovementLinear()
      } else {
        this.viewport.xRubber.updateTarget(location.x)
      }

      if (this.viewport.yRubber == null) {
        this.viewport.yRubber = new Rubber(
          this.viewport.y,
          location.y,
          location.time
        )
        this.viewport.yRubber.setRubberMovementLinear()
      } else {
        this.viewport.yRubber.updateTarget(location.y)
      }
    },
    mousewheelAnimateTo ({scale, time}) {
      if (this.viewport.scaleRubber == null) {
        this.viewport.scaleRubber = new Rubber(
          this.viewport.scale,
          Math.min(2000, scale * this.viewport.scale),
          time
        )
        this.viewport.scaleRubber.setRubberMovementLinear()
      } else {
        this.viewport.scaleRubber.updateTarget(
          Math.min(2000, scale * this.viewport.scaleRubber.target),
        )
      }
    },

    setMouse (payload) {
      this.container.mouse.x = payload.x
      this.container.mouse.y = payload.y
      // this.container.mouse.xFromCenter = (payload.x - (this.container.width / 2))
      // this.container.mouse.yFromCenter = (payload.y - (this.container.height / 2))
      this.container.mouse.xPercent = payload.x / this.container.width
      this.container.mouse.yPercent = payload.y / this.container.height
    },
    addToHistory (payload) {
      console.log(payload)
      this.minerva.terminal.history.push(payload)
    },
    clearHistory () {
      this.minerva.terminal.history = []
    },
    jumpMenuOn () {
      this.selectedSprite = 0;
      this.viewport.scaleRubber = new Rubber(
        this.viewport.scale,
        2,
        1500
      )
      this.hud.menuState.jumpMenu = true
    },
    jumpMenuOff () {
      if (this.hud.menuState.jumpMenu) {
        this.viewport.scaleRubber = new Rubber(
          this.viewport.scale,
          1,
          1500
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
      console.log('jump animation off')
      if (this.hud.jumpAnimationState) {
        // this.viewport.scaleRubber = new Rubber(
        //   this.viewport.scale,
        //   1,
        //   5000
        // )
        this.hud.jumpAnimationState = false
      }
    },
    jumpAnimationOn () {
      console.log('jump animation on')
      this.selectedSprite = null,
      this.viewport.x = 0,
      this.viewport.y = 0,
      this.viewport.scale = 1500,
      this.hud.jumpAnimationState = true
    },
  }
})
