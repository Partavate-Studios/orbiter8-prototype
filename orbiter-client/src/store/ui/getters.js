export default {
  /* Approved */
  viewport: state => state.viewport,
  container: state => state.container,
  showLabels: state => state.showLabels,
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
}
