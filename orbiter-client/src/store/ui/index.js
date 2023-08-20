import actions from './actions'
import mutations from './mutations'
import getters from './getters'

const state = {
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
}

state.viewport.moveTime = Date.now()

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
