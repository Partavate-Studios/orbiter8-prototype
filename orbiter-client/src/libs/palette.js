// The two accents from the Multiverse Portals demo (Moonbeam's pink, Boba's yellow), kept rare so
// they mean something. App.vue repeats them as CSS variables (--o8-pink, --o8-yellow, ...).
//
// Yellow is you, and what's good for you: your ship, what you own, where you are and have been, and
// a port buying what you carry.
// Pink needs you: a transaction waiting for your wallet, something that failed, a name that won't fit.
// It is never a button: a warm color on a good action (a profitable trade) reads as danger.
// Everything else, the buttons included, stays in the game's purples and lavenders.
export const PINK = '#e1177c'
export const PINK_LIGHT = '#ff6fb0'
export const YELLOW = '#ccff00'
export const YELLOW_LIGHT = '#ebff99'

/**
 * The galaxy map's colors, in Orbiter 8's: deep purples for space and panels, lavender for what's
 * charted, yellow for you and where you can go, pink-red for what needs someone (sieges).
 */
export const MAP = {
  spaceCenter: '#2b0c50',
  spaceEdge: '#160631',
  panel: '#12052af0',
  panelEdge: '#c3b3da44',
  text: '#e6dcf5',
  textDim: '#c3b3daaa',
  charted: '#c3b3da',
  /** your jump lines and range */
  route: YELLOW_LIGHT,
  /** a black hole's link to its partner */
  partnerLink: '#af6fff',
  hole: '#05010d',
  alert: PINK_LIGHT
}
