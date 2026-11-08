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

/**
 * Stars by spectral class (sdk/traits.js), hottest to coolest: blue O and B, white A, yellow-white F,
 * yellow G, orange K, red M. A star's color lights its whole system a little (the guides canvas's
 * glow), but the system stays purple: deep space is the game's color. Sol is drawn yellow, as people
 * know it (science would say white).
 * - core: the star's center; mid: its body and its dot on the galaxy map; glow: the light around it.
 */
export const STAR_CLASSES = {
  O: { name: 'blue', core: '#e6ecff', mid: '#9fb4ff', glow: '#6f8cff' },
  B: { name: 'blue-white', core: '#eef2ff', mid: '#b6c8ff', glow: '#8fb0ff' },
  A: { name: 'white', core: '#ffffff', mid: '#e3eaff', glow: '#c4d4ff' },
  F: { name: 'yellow-white', core: '#fffdf2', mid: '#fff0c8', glow: '#ffe0a0' },
  G: { name: 'yellow', core: '#fffbe6', mid: '#ffe28a', glow: '#ffb347' },
  K: { name: 'orange', core: '#fff1de', mid: '#ffbd72', glow: '#ff8f3c' },
  M: { name: 'red', core: '#ffe4d8', mid: '#ff9472', glow: '#ff5a3c' }
}

/**
 * Planets by class (sdk/game/planet-types.js order): light, mid and dark for the sphere, and the
 * color of its surface marks. Purple stays in the shadows, so a system still reads as Orbiter 8's.
 */
export const PLANET_COLORS = [
  { light: '#a8e6ff', mid: '#2f7fd9', dark: '#1a2a6e', mark: '#5fd27e', markOpacity: 0.75 }, // Terrestrial
  { light: '#efe8f7', mid: '#9a8fb2', dark: '#352d4f', mark: '#4a3f63', markOpacity: 0.45 }, // Rocky
  { light: '#9ff0ff', mid: '#1e8fd8', dark: '#122a6e', mark: '#e9fbff', markOpacity: 0.5 }, // Oceanic
  { light: '#ffe0b0', mid: '#e5823e', dark: '#5e2440', mark: '#ffcf8a', markOpacity: 0.45 }, // Desert
  { light: '#f2fdff', mid: '#9adfff', dark: '#33569e', mark: '#ffffff', markOpacity: 0.55 }, // Ice
  { light: '#b0566a', mid: '#5a1424', dark: '#1c0618', mark: '#ff7a2f', markOpacity: 0.5 }, // Volcanic
  { light: '#ffe4c4', mid: '#e58fb5', dark: '#5e2a78', mark: '#fff0e0', markOpacity: 0.3 }, // Gaseous
  { light: '#f0c2ac', mid: '#a5583c', dark: '#3e1a32', mark: '#5a2418', markOpacity: 0.45 }, // Ferrous
  { light: '#fff0a0', mid: '#ff6a1f', dark: '#7a1230', mark: '#ffe08a', markOpacity: 0.6 }, // Lava
  { light: '#d6f7a6', mid: '#3fae6a', dark: '#163f4a', mark: '#1f6b4a', markOpacity: 0.55 } // Swamp
]

/**
 * The HUD's round buttons, tinted by what they do (the icon stays white). Gray is for the quiet
 * ones; yellow is you; pink stays for what needs you (a running siege rings the sieges button).
 */
export const HUD_TINT = {
  you: YELLOW_LIGHT,
  help: '#7fd4ff',
  sieges: '#ff8a5c',
  leaderboard: '#ffc94d',
  chat: '#4fe0d0',
  settings: '#a59fb3',
  planets: '#6fa8ff',
  ships: '#e6dcf5'
}

/** A quiet purple-gray, for the inside of cards and other calm surfaces: purple stays for edges and buttons. */
export const CARD_GRAY = '#25202f'
