// The selection card's colors (Koda, 2026-11-07): "change the purple UI colors to a color that best
// represents the thing selected... for the Orbiter 8 ship, we can stick with the purple." The card's
// frame, title, menu buttons and selection lines take one color in a few shades; ships keep Koda's
// purple. A planet under siege adds a pink frame (pink needs you); the inside stays purple-gray.
import { PLANET_COLORS, STAR_CLASSES, HUD_TINT } from './palette'

const DARK = '#0b0218'

/** `a` blended toward `b` by `t`, as #rrggbb. */
export function mixHex(a, b, t) {
  const c = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  const [x, y] = [c(a), c(b)]
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('')
}

/** A theme in shades of one color: the frame's two tones, the hovered button's, the stroke and the accent. */
export function shades(base) {
  return {
    base,
    mid: mixHex(base, DARK, 0.35),
    deep: mixHex(base, DARK, 0.78),
    hoverMid: mixHex(base, DARK, 0.12),
    hoverDeep: mixHex(base, DARK, 0.55),
    stroke: mixHex(base, DARK, 0.25),
    accent: mixHex(base, '#ffffff', 0.35)
  }
}

/** Ships, the Orbiter 8: Koda's purple, exactly as the cards always were. */
const SHIP = { base: '#7c39cd', mid: '#5c1aae', deep: '#280b4b', hoverMid: '#7c39cd', hoverDeep: '#3d1273', stroke: '#5b1aaa', accent: '#c3b3da' }

export const CARD_THEMES = {
  ship: SHIP,
  moon: shades('#a59fb3'),
  station: shades('#7d8bc4'),
  blackHole: shades('#d98a2b'),
  ...Object.fromEntries(PLANET_COLORS.map((c, i) => ['planet-' + i, shades(c.card)])),
  ...Object.fromEntries(Object.entries(STAR_CLASSES).map(([k, c]) => ['star-' + k, shades(c.glow)]))
}

/** The theme's key for a selected game object (sdk/system.js). */
export function cardThemeKey(object) {
  if (!object) return 'ship'
  switch (object.type) {
    case 'planet':
      return CARD_THEMES['planet-' + object.class] ? 'planet-' + object.class : 'ship'
    case 'star':
      if (object.blackHole) return 'blackHole'
      return object.spectral ? 'star-' + object.spectral : 'ship'
    case 'moon':
      return 'moon'
    case 'station':
      return 'station'
    default:
      return 'ship'
  }
}

/** An injected theme, whether Vue handed over the value or its ref; purple when there's none. */
export function unwrapTheme(theme) {
  if (!theme) return SHIP
  return theme.base ? theme : (theme.value ?? SHIP)
}

/** Menus opened from the HUD's buttons take the button's tint (libs/palette.js HUD_TINT). */
const MENU_TINTS = {
  help: HUD_TINT.help,
  leaderboard: HUD_TINT.leaderboard,
  chat: HUD_TINT.chat,
  settings: HUD_TINT.settings,
  feed: HUD_TINT.sieges,
  planets: HUD_TINT.planets
}

/**
 * A menu's colors: a menu about the selected thing (trade, shipyard, armory at a station; colony and
 * siege on a planet) takes its card's; the ship's loadout and ships list keep the purple; a HUD
 * button's menu takes the button's tint.
 */
export function menuTheme(menu, selectedObject) {
  if (MENU_TINTS[menu]) return shades(MENU_TINTS[menu])
  if (['trade', 'shipyard', 'armory', 'colony', 'siege'].includes(menu)) return CARD_THEMES[cardThemeKey(selectedObject)]
  return SHIP
}
