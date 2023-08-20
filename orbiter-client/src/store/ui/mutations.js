import Rubber from '@/libs/rubber'

export default {
  calculateViewableArea (state, {x, y}) {
    let ratio = state.viewport.resolution / y
    state.viewport.width = parseInt(x * ratio * 0.8)
    state.viewport.height = parseInt(state.viewport.resolution * .8)
    state.container.width = parseInt(x)
    state.container.height = parseInt(y)
  },
  toggleShowLabels (state) {
    console.log('toggling labels')
    state.showLabels = !state.showLabels
  },
  selectSprite (state, spriteId) {
    console.log('selecting sprite ', spriteId)
    if (state.selectedSprite != spriteId) {
      // close old menu
      state.selectedSprite = spriteId;

      state.viewport.xRubber = new Rubber(
        state.viewport.x,
        state.viewport.x,
        2000
      )
      state.viewport.yRubber = new Rubber(
        state.viewport.y,
        state.viewport.y,
        2000
      )
      state.viewport.scaleRubber = new Rubber(
        state.viewport.scale,
        state.viewport.scale,
        2000
      )
    }
    //todo: rubber for scale should be here
  },
  selectNone(state) {
    console.log('unselecting sprites')
    state.selectedSprite = null
    state.viewport.xRubber = null
    state.viewport.yRubber = null
  },
  setSelectedTelemetry (state, telemetry) {
    let newX = telemetry.translatex * -1
    let newY = telemetry.translatey * -1
    if (state.viewport.xRubber != null) {
      state.viewport.xRubber.updateTarget(newX)
    } else {
      state.viewport.x = newX
    }
    if (state.viewport.yRubber != null) {
      state.viewport.yRubber.updateTarget(newY)
    } else {
      state.viewport.y = newY
    }
    //look for active rubber with no delta left
    if (state.viewport.scaleRubber != null &&
        state.viewport.scaleRubber.delta == 0 ) {
      state.viewport.scaleRubber.updateTarget(telemetry.scale)
    }
  },
  viewportToTime (state, time) {
    if (state.viewport.scaleRubber != null) {
      state.viewport.scale = state.viewport.scaleRubber.getRubber(time)
      if (state.viewport.scaleRubber.rubberComplete(time)) {
        state.viewport.scaleRubber = null
      }
    }

    if (state.viewport.rotationRubber != null) {
      state.viewport.rotation = state.viewport.rotationRubber.getRubber(time)
      if (state.viewport.rotationRubber.rubberComplete(time)) {
        state.viewport.rotationRubber = null
      }
    }

    if (state.viewport.xRubber != null) {
      state.viewport.x = state.viewport.xRubber.getRubber(time)
      if (state.viewport.xRubber.rubberComplete(time)) {
        state.viewport.xRubber = null
      }
    }

    if (state.viewport.yRubber != null) {
      state.viewport.y = state.viewport.yRubber.getRubber(time)
      if (state.viewport.yRubber.rubberComplete(time)) {
        state.viewport.yRubber = null
      }
    }

    // confine scale
    if (state.viewport.scale > 420) {
      state.viewport.scale = 420
    }
    if (state.viewport.scale < 0.0015) {
      state.viewport.scale = 0.001
    }

    // confine x
    if (Math.abs(state.viewport.x) > 5200) {
      state.viewport.x = 5200 * Math.sign(state.viewport.x)
    }
    // confine y
    if (Math.abs(state.viewport.y) > 5200) {
      state.viewport.y = 5200 * Math.sign(state.viewport.y)
    }
  },
  moveUp (state, distance) {
    state.viewport.yRubber = new Rubber(
      state.viewport.y,
      state.viewport.y + (distance * state.viewport.scale),
      100
    )
  },
  moveDown (state, distance) {
    state.viewport.yRubber = new Rubber(
      state.viewport.y,
      state.viewport.y - (distance * state.viewport.scale),
      100
    )
  },
  moveLeft (state, distance) {
    state.viewport.xRubber = new Rubber(
      state.viewport.x,
      state.viewport.x + (distance * state.viewport.scale),
      100
    )
  },
  moveRight (state, distance) {
    state.viewport.xRubber = new Rubber(
      state.viewport.x,
      state.viewport.x - (distance * state.viewport.scale),
      100
    )
  },
  scaleBy (state, scaler) {
    state.viewport.scale =  Math.min(2000, scaler * state.viewport.scale)
  },
  scaleAnimateBy (state, {scaler, time}) {
    console.log('scale', scaler)
    if (state.viewport.scaleRubber == null) {
      state.viewport.scaleRubber = new Rubber(
        state.viewport.scale,
        Math.min(2000, scaler * state.viewport.scale),
        time
      )
      state.viewport.scaleRubber.setRubberMovementLinear()
    } else {
      state.viewport.scaleRubber.updateTarget(
        Math.min(2000, scaler * state.viewport.scaleRubber.target)
      )
    }
  },
  scaleTo (state, scale) {
    state.viewport.scale = scale
  },
  scaleAnimateTo (state, {scale, time}) {
    state.viewport.scaleRubber = new Rubber(
      state.viewport.scale,
      scale,
      time
    )
  },
  rotateTo (state, rotation) {
    state.viewport.rotationRubber = new Rubber(
      state.viewport.rotation,
      rotation,
      100
    )
  },
  viewTo (state, location) {
    state.viewport.x = location.x
    state.viewport.y = location.y
  },
  viewAnimateMoveTo (state, location) {
    if (state.viewport.xRubber == null) {
      state.viewport.xRubber = new Rubber(
        state.viewport.x,
        location.x,
        location.time
      )
      state.viewport.xRubber.setRubberMovementLinear()
    } else {
      state.viewport.xRubber.updateTarget(location.x)
    }

    if (state.viewport.yRubber == null) {
      state.viewport.yRubber = new Rubber(
        state.viewport.y,
        location.y,
        location.time
      )
      state.viewport.yRubber.setRubberMovementLinear()
    } else {
      state.viewport.yRubber.updateTarget(location.y)
    }
  },
  mousewheelAnimateTo (state, {scale, time}) {
    if (state.viewport.scaleRubber == null) {
      state.viewport.scaleRubber = new Rubber(
        state.viewport.scale,
        Math.min(2000, scale * state.viewport.scale),
        time
      )
      state.viewport.scaleRubber.setRubberMovementLinear()
    } else {
      state.viewport.scaleRubber.updateTarget(
        Math.min(2000, scale * state.viewport.scaleRubber.target),
      )
    }
  },

  setMouse (state, payload) {
    state.container.mouse.x = payload.x
    state.container.mouse.y = payload.y
    // state.container.mouse.xFromCenter = (payload.x - (state.container.width / 2))
    // state.container.mouse.yFromCenter = (payload.y - (state.container.height / 2))
    state.container.mouse.xPercent = payload.x / state.container.width
    state.container.mouse.yPercent = payload.y / state.container.height
  },
  addToHistory (state, payload) {
    console.log(payload)
    state.minerva.terminal.history.push(payload)
  },
  clearHistory (state) {
    state.minerva.terminal.history = []
  },
  jumpMenuOn (state) {
    state.selectedSprite = 0;
    state.viewport.scaleRubber = new Rubber(
      state.viewport.scale,
      2,
      1500
    )
    state.hud.menuState.jumpMenu = true
  },
  jumpMenuOff (state) {
    if (state.hud.menuState.jumpMenu) {
      state.viewport.scaleRubber = new Rubber(
        state.viewport.scale,
        1,
        1500
      )
      state.hud.menuState.jumpMenu = false
    }
  },
  openMenu (state, menu) {
    state.hud.menuState.shipsMenu = false
    state.hud.menuState.planetsMenu = false
    state.hud.menuState.settingsMenu = false
    state.hud.menuState.portMenu = false
    state.hud.menuState.shipyardMenu = false
    state.hud.menuState.chatMenu = false
    switch(menu) {
      case 'planets':
        state.hud.menuState.planetsMenu = true
        break
      case 'ships':
        state.hud.menuState.shipsMenu = true
        break
      case 'settings':
        state.hud.menuState.settingsMenu = true
        break
      case 'trade':
        state.hud.menuState.tradeMenu = true
        break
      case 'shipyard':
        state.hud.menuState.shipyardMenu = true
        break
      case 'chat':
        state.hud.menuState.chatMenu = true
        break
      case 'jump':
        break
      case 'sprite':
        break
    }
  },
  closeMenu (state) {
    state.hud.menuState.shipsMenu = false
    state.hud.menuState.planetsMenu = false
    state.hud.menuState.settingsMenu = false
    state.hud.menuState.jumpMenu = false
    state.hud.menuState.tradeMenu = false
    state.hud.menuState.shipyardMenu = false
    state.hud.menuState.chatMenu = false
  },
  // unevaluated

  setSpriteToDisplay (state, payload) {
    state.hud.spriteToDisplay = payload
  },
  jumpAnimationOff (state) {
    console.log('jump animation off')
    if (state.hud.jumpAnimationState) {
      // state.viewport.scaleRubber = new Rubber(
      //   state.viewport.scale,
      //   1,
      //   5000
      // )
      state.hud.jumpAnimationState = false
    }
  },
  jumpAnimationOn (state) {
    console.log('jump animation on')
    state.selectedSprite = null,
    state.viewport.x = 0,
    state.viewport.y = 0,
    state.viewport.scale = 1500,
    state.hud.jumpAnimationState = true
  },
}
