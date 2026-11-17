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

/*
 * The color system's tokens (docs/color-guide.md), chosen by Koda on 2026-11-14 from the proposal
 * (docs/mockups/color-choices.svg). Text in pink uses PINK_LIGHT (PINK is too dark for small text);
 * PINK stays for frames, fills and large marks.
 */
/** Deep space: the universe behind everything; SPACE_DEEP for its darkest edges. */
export const SPACE = '#130e24'
export const SPACE_DEEP = '#0b0916'
/** Faint purple for low-opacity glows in space, and the hex grid's fill. */
export const SPACE_NEBULA = '#2a1a4a'
/** Orbit lines and the hex grid's lines. */
export const SPACE_ORBIT = '#4a3f75'
/** Inside every card and menu (1), readouts and inputs (2), hover and selected rows (3): steps of lightness. */
export const SURFACE_1 = '#1b1531'
export const SURFACE_2 = '#251d40'
export const SURFACE_3 = '#302651'
export const BORDER = '#3f3566'
export const BORDER_STRONG = '#5a4c8c'
/** Text: main, secondary, and hints (never on SURFACE_3). */
export const TEXT = '#f1eefa'
export const TEXT_2 = '#bdb5d4'
export const TEXT_3 = '#9088aa'
/** The main action's purple (500), its hover and selection outline (400), focus rings and links (300). */
export const BRAND_500 = '#7b4fe6'
export const BRAND_400 = '#8b5cf6'
export const BRAND_300 = '#b9a0ff'

/**
 * Each good's color, in the Market's order (Water ice, Metals, Rare elements, Helium-3, Organics,
 * Silicon, Equipment, Electronics): muted material tones, never yellow, pink or purple. With the good's
 * code or icon, never alone; it names the good, never buy or sell, or profit.
 */
export const GOODS_COLORS = ['#7fddf0', '#a9b3c1', '#d9e1ec', '#6f8cff', '#74cf84', '#7a90a6', '#e08a4f', '#3cc7a8']
/** A good's color by its index, gray for one added later without a color. */
export const goodColor = (index) => GOODS_COLORS[index] ?? TEXT_2

/**
 * The galaxy map's colors, in Orbiter 8's: deep purples for space and panels, lavender for what's
 * charted, yellow for you and where you can go, pink-red for what needs someone (sieges).
 */
export const MAP = {
  spaceCenter: SPACE,
  spaceEdge: SPACE_DEEP,
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
 * yellow G, orange K, red M, in pale blackbody tints (Koda, 2026-11-14: the color system's, row E3),
 * so a star's yellow stays soft beside the flat "yours" yellow. A star's color lights its whole system
 * a little (the guides canvas's glow), but the system stays purple: deep space is the game's color.
 * Sol is drawn pale yellow, as people know it (science would say white).
 * - core: the star's center; mid: its body and its dot on the galaxy map; glow: the light around it.
 */
/**
 * The asteroid belt (D67-D71): world colors, muted (the accents stay for what's yours and what needs
 * attention). Rocks by composition (carbonaceous, silicate, metallic), and the band's haze.
 */
export const BELT = {
  rock: ['#5f544f', '#a8977d', '#8f99a6'],
  rockLight: ['#8a7d75', '#cdbb9c', '#c3cbd6'],
  band: '#9a8fae'
}

export const STAR_CLASSES = {
  O: { name: 'blue', core: '#ffffff', mid: '#9db4ff', glow: '#9db4ff' },
  B: { name: 'blue-white', core: '#ffffff', mid: '#aabfff', glow: '#aabfff' },
  A: { name: 'white', core: '#ffffff', mid: '#cad7ff', glow: '#cad7ff' },
  F: { name: 'yellow-white', core: '#ffffff', mid: '#f8f7ff', glow: '#f8f7ff' },
  G: { name: 'yellow', core: '#ffffff', mid: '#fff1c4', glow: '#fff1c4' },
  K: { name: 'orange', core: '#ffffff', mid: '#ffd2a1', glow: '#ffd2a1' },
  M: { name: 'red', core: '#ffffff', mid: '#ffb08a', glow: '#ffb08a' }
}

/**
 * Planets by class (sdk/game/planet-types.js order): light, mid and dark for the sphere, the color of
 * its surface marks, and its card's color (libs/card-theme.js). Purple stays in the shadows, so a
 * system still reads as Orbiter 8's.
 */
export const PLANET_COLORS = [
  { light: '#a8e6ff', mid: '#2f7fd9', dark: '#1a2a6e', mark: '#5fd27e', markOpacity: 0.75, card: '#2f7fd9' }, // Terrestrial
  { light: '#efe8f7', mid: '#9a8fb2', dark: '#352d4f', mark: '#4a3f63', markOpacity: 0.45, card: '#8a80a3' }, // Rocky
  { light: '#9ff0ff', mid: '#1e8fd8', dark: '#122a6e', mark: '#e9fbff', markOpacity: 0.5, card: '#1e8fd8' }, // Oceanic
  { light: '#ffe0b0', mid: '#e5823e', dark: '#5e2440', mark: '#ffcf8a', markOpacity: 0.45, card: '#e5823e' }, // Desert
  { light: '#f2fdff', mid: '#9adfff', dark: '#33569e', mark: '#ffffff', markOpacity: 0.55, card: '#5fb8e8' }, // Ice
  { light: '#b0566a', mid: '#5a1424', dark: '#1c0618', mark: '#ff7a2f', markOpacity: 0.5, card: '#c2413a' }, // Volcanic
  { light: '#ffe4c4', mid: '#e58fb5', dark: '#5e2a78', mark: '#fff0e0', markOpacity: 0.3, card: '#d97aa8' }, // Gaseous
  { light: '#f0c2ac', mid: '#a5583c', dark: '#3e1a32', mark: '#5a2418', markOpacity: 0.45, card: '#b0623f' }, // Ferrous
  { light: '#fff0a0', mid: '#ff6a1f', dark: '#7a1230', mark: '#ffe08a', markOpacity: 0.6, card: '#ff6a1f' }, // Lava
  { light: '#d6f7a6', mid: '#3fae6a', dark: '#163f4a', mark: '#1f6b4a', markOpacity: 0.55, card: '#3fae6a' } // Swamp
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

/**
 * The HUD buttons at rest: each tint softened toward a quiet gray, brightening to HUD_TINT under the
 * pointer (Koda, 2026-11-14, rows A2 and H2). The leaderboard's soft gold is Koda's pick (A2).
 */
const softTint = (hex) => {
  const c = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
  const [a, b] = [c(hex), c('#8a80a3')]
  return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * 0.35).toString(16).padStart(2, '0')).join('')
}
export const HUD_REST = { ...Object.fromEntries(Object.entries(HUD_TINT).map(([k, v]) => [k, softTint(v)])), leaderboard: '#e6cf8f' }

/** The inside of cards and menus: the color system's first surface (row B1). Purple stays for edges and buttons. */
export const CARD_GRAY = SURFACE_1

/**
 * The backdrop art's purples (components/star-map/assets/backdrop-art.js), deepened toward SPACE so
 * space is dark (Koda, 2026-11-14): the art's base becomes SPACE exactly; its lighter shapes keep
 * their place and their difference from it, much darker.
 */
export function deepSpace(hex) {
  if (hex.toLowerCase() === '#280b4b') return SPACE
  const c = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
  const [x, y] = [c(hex), c(SPACE_DEEP)]
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * 0.6).toString(16).padStart(2, '0')).join('')
}
