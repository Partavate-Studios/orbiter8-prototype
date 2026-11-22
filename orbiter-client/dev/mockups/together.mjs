// Draws docs/mockups/together/*.svg (and a PNG beside each): the four mockups for docs/ui-plan.md,
// "bringing the system together" (ui-guide.md section 10). Mockups only: nothing here is the game's code.
// The colors are copied from libs/palette.js and libs/card-theme.js; the art is the game's own
// (assets/art/*.svg, the ship's and the station's silhouettes from components/star-map/sprites/).
//   node dev/mockups/together.mjs          (from orbiter-client/; add --png to render PNGs with Chrome)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const SRC = path.join(here, '../../src')
const OUT = path.join(here, '../../../docs/mockups/together')
fs.mkdirSync(OUT, { recursive: true })

// ── palette (libs/palette.js) ────────────────────────────────────────────────
const PINK_LIGHT = '#ff6fb0'
const YELLOW = '#ccff00'
const YELLOW_LIGHT = '#ebff99'
const SPACE = '#130e24'
const SPACE_DEEP = '#0b0916'
const S1 = '#1b1531'
const S2 = '#251d40'
const S3 = '#302651'
const BORDER = '#3f3566'
const BORDER_STRONG = '#5a4c8c'
const TEXT = '#f1eefa'
const TEXT_2 = '#bdb5d4'
const TEXT_3 = '#9088aa'
const LAV = '#c3b3da'
const BRAND_500 = '#7b4fe6'
const BRAND_300 = '#b9a0ff'
const GREEN = '#5be37d'
const GOODS = { WAT: '#7fddf0', MET: '#a9b3c1', RAR: '#d9e1ec', HE3: '#6f8cff', ORG: '#74cf84', SIL: '#7a90a6', EQP: '#e08a4f', ELC: '#3cc7a8' }
const TINT = { you: '#ebff99', help: '#7fd4ff', sieges: '#ff8a5c', ranks: '#e6cf8f', chat: '#4fe0d0', settings: '#a59fb3', objects: '#6fa8ff', map: '#fff1c4', ships: '#e6dcf5' }
const PLANET = {
  Terrestrial: ['#a8e6ff', '#2f7fd9', '#1a2a6e'],
  Rocky: ['#efe8f7', '#9a8fb2', '#352d4f'],
  Oceanic: ['#9ff0ff', '#1e8fd8', '#122a6e'],
  Desert: ['#ffe0b0', '#e5823e', '#5e2440'],
  Ice: ['#f2fdff', '#9adfff', '#33569e'],
  Volcanic: ['#b0566a', '#5a1424', '#1c0618'],
  Gaseous: ['#ffe4c4', '#e58fb5', '#5e2a78'],
  Ferrous: ['#f0c2ac', '#a5583c', '#3e1a32'],
  Moon: ['#f4f0fa', '#a59fb3', '#3a3350']
}

const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16))
const mix = (a, b, t) => '#' + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * t).toString(16).padStart(2, '0')).join('')
/** libs/card-theme.js shades(): a card's colors from its one identity color. */
const shades = (base) => ({ base, mid: mix(base, '#0b0218', 0.35), deep: mix(base, '#0b0218', 0.78), accent: mix(base, '#ffffff', 0.35) })
const THEME = {
  ship: { base: '#7c39cd', mid: '#5c1aae', deep: '#280b4b', accent: '#c9b6ff', ship: true },
  earth: shades(PLANET.Terrestrial[1]),
  oceanic: shades(PLANET.Oceanic[1]),
  station: shades('#7d8bc4'),
  moon: shades('#a59fb3')
}

// ── svg basics ───────────────────────────────────────────────────────────────
let defs = []
let uid = 0
const id = (p) => `${p}${++uid}`
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
const T = (x, y, s, { size = 13, fill = TEXT, anchor = 'start', weight = 400, opacity = 1, spacing = 0, mono = false } = {}) =>
  `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" text-anchor="${anchor}" font-weight="${weight}"${opacity < 1 ? ` opacity="${opacity}"` : ''}${spacing ? ` letter-spacing="${spacing}"` : ''}${mono ? ` font-family="'Ubuntu Mono', monospace"` : ''}>${esc(s)}</text>`
const R = (x, y, w, h, { rx = 0, ry = rx, fill = 'none', stroke = 'none', sw = 1, dash = '', opacity = 1 } = {}) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${dash ? ` stroke-dasharray="${dash}"` : ''}${opacity < 1 ? ` opacity="${opacity}"` : ''}/>`
const C = (cx, cy, r, { fill = 'none', stroke = 'none', sw = 1, dash = '', opacity = 1 } = {}) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${dash ? ` stroke-dasharray="${dash}"` : ''}${opacity < 1 ? ` opacity="${opacity}"` : ''}/>`
const L = (x1, y1, x2, y2, { stroke = LAV, sw = 1, dash = '', opacity = 1 } = {}) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round"${dash ? ` stroke-dasharray="${dash}"` : ''}${opacity < 1 ? ` opacity="${opacity}"` : ''}/>`
const G = (inner, { opacity = 1, transform = '' } = {}) => `<g${opacity < 1 ? ` opacity="${opacity}"` : ''}${transform ? ` transform="${transform}"` : ''}>${inner}</g>`

// ── the game's art ───────────────────────────────────────────────────────────
const artCache = {}
/** One of assets/art/*.svg, `size` px square, centered at cx, cy (its ids made unique per use). */
function art(name, cx, cy, size, opacity = 1) {
  artCache[name] ??= fs.readFileSync(path.join(SRC, 'assets/art', name + '.svg'), 'utf8')
  const p = id('a')
  const body = artCache[name]
    .replace(/<\?xml[^>]*>/, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/id="([^"]+)"/g, `id="${p}-$1"`)
    .replace(/url\(#([^)]+)\)/g, `url(#${p}-$1)`)
    .replace(/href="#([^"]+)"/g, `href="#${p}-$1"`)
    .replace(/<svg[^>]*>/, `<svg x="${cx - size / 2}" y="${cy - size / 2}" width="${size}" height="${size}" viewBox="-60 -60 120 120"${opacity < 1 ? ` opacity="${opacity}"` : ''}>`)
  return body
}
const pathOf = (file) => fs.readFileSync(path.join(SRC, file), 'utf8').match(/\sd="([^"]+)"/)[1]
const SHIP_D = pathOf('components/star-map/sprites/ship.svg.vue')
const STATION_D = pathOf('components/star-map/sprites/station.svg.vue')
/** The Orbiter 8's silhouette, `size` px long, nose up unless turned. */
const ship = (cx, cy, size, turn = 0, fill = '#ffffff', opacity = 1) =>
  `<g transform="translate(${cx} ${cy}) rotate(${turn}) scale(${size / 4600})" opacity="${opacity}"><path transform="translate(-2300 -2300)" fill="${fill}" d="${SHIP_D}"/></g>`
const station = (cx, cy, size, fill = '#ffffff', opacity = 1) =>
  `<g transform="translate(${cx} ${cy}) scale(${size / 600})" opacity="${opacity}"><path transform="translate(-290 -301)" fill="${fill}" fill-rule="evenodd" d="${STATION_D}"/></g>`

function sphere(cx, cy, r, [light, mid, dark], { earth = false } = {}) {
  const g = id('sph')
  defs.push(`<radialGradient id="${g}" cx="0.35" cy="0.32" r="0.8"><stop offset="0" stop-color="${light}"/><stop offset="0.45" stop-color="${mid}"/><stop offset="1" stop-color="${dark}"/></radialGradient>`)
  let out = C(cx, cy, r, { fill: `url(#${g})` })
  if (earth) {
    const c = id('clip')
    defs.push(`<clipPath id="${c}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>`)
    const band = (x, y, w, h, o) => R(cx + x * r, cy + y * r, w * r, h * r, { rx: (h * r) / 2, fill: '#5fd27e', opacity: o })
    out += `<g clip-path="url(#${c})">${band(-0.9, -0.62, 1.0, 0.24, 0.9)}${band(-0.2, -0.3, 1.2, 0.26, 0.85)}${band(-1.0, 0.02, 1.3, 0.26, 0.9)}${band(-0.4, 0.36, 1.3, 0.24, 0.8)}${band(-0.8, 0.66, 0.9, 0.2, 0.75)}</g>`
  }
  return out
}
function starBody(cx, cy, r, color = '#fff1c4') {
  const g = id('glow')
  defs.push(`<radialGradient id="${g}"><stop offset="0" stop-color="${color}" stop-opacity="0.6"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`)
  return C(cx, cy, r * 2.4, { fill: `url(#${g})` }) + C(cx, cy, r, { fill: '#fffdf2', stroke: color, sw: r * 0.25 })
}

/** Space, with a few far stars (the same ones every run). */
function space(w, h, seed = 7, dim = 0) {
  const g = id('space')
  defs.push(`<radialGradient id="${g}" cx="0.55" cy="0.4" r="0.9"><stop offset="0" stop-color="#23143f"/><stop offset="0.55" stop-color="${SPACE}"/><stop offset="1" stop-color="${SPACE_DEEP}"/></radialGradient>`)
  let s = seed
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647)
  let out = R(0, 0, w, h, { fill: `url(#${g})` })
  for (let i = 0; i < (w * h) / 9000; i++) out += C((rnd() * w).toFixed(0), (rnd() * h).toFixed(0), (rnd() * 1.1 + 0.3).toFixed(1), { fill: '#af6fff', opacity: 0.25 + rnd() * 0.5 })
  if (dim) out += R(0, 0, w, h, { fill: '#05020c', opacity: dim })
  return out
}

// ── widgets ──────────────────────────────────────────────────────────────────
/**
 * A pictured well with its one-word caption: the card drawer's `.o8-well`, grown to a button.
 * `main`: the card's one main action. `on`: the pressed one. `off`: "not yet" (a dashed socket).
 * `dim`: can't right now.
 */
function well(cx, cy, r, { pic = '', caption = '', sub = '', main = false, on = false, off = false, dim = false, key = '', subFill = TEXT_3, badge = '' } = {}) {
  const g = id('well')
  defs.push(
    main
      ? `<radialGradient id="${g}" cx="0.5" cy="0.4" r="0.7"><stop offset="0" stop-color="#9a78f5"/><stop offset="1" stop-color="${BRAND_500}"/></radialGradient>`
      : `<radialGradient id="${g}" cx="0.5" cy="0.4" r="0.8"><stop offset="0" stop-color="#3d2a6e"/><stop offset="1" stop-color="#1a1331"/></radialGradient>`
  )
  let out = ''
  if (off) out += C(cx, cy, r, { fill: '#1a133166', stroke: BORDER_STRONG, sw: 1.2, dash: '4 4' })
  else out += C(cx, cy, r, { fill: `url(#${g})`, stroke: main ? BRAND_300 : on ? BRAND_300 : BORDER_STRONG, sw: main || on ? 2.2 : 1.5 })
  if (on) out += C(cx, cy, r + 4, { stroke: BRAND_300, sw: 1.5, opacity: 0.7 })
  out += G(pic, { opacity: off ? 0.3 : dim ? 0.4 : 1 })
  if (badge) out += C(cx + r * 0.75, cy - r * 0.75, 8, { fill: '#230b41', stroke: '#ffffff88' }) + T(cx + r * 0.75, cy - r * 0.75 + 3.5, badge, { size: 9.5, anchor: 'middle', fill: '#fff' })
  if (caption) out += T(cx, cy + r + 14, caption, { size: 11, anchor: 'middle', fill: off || dim ? '#efe7ff77' : '#efe7ff', weight: main ? 700 : 500 })
  if (sub) out += T(cx, cy + r + 26, sub, { size: 9.5, anchor: 'middle', fill: subFill })
  if (key) out += T(cx - r + 1, cy - r + 6, key, { size: 9, fill: TEXT_3, anchor: 'middle' })
  return out
}
// little line glyphs, as the drawer's ACTION_GLYPH: drawn in a 24-unit box around 0,0
const glyph = (cx, cy, d, { size = 22, stroke = '#d9ccf5', fill = 'none' } = {}) =>
  `<g transform="translate(${cx} ${cy}) scale(${size / 24})"><path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></g>`
const GLYPH = {
  details: 'M-8 -3V-8H-3M3 -8H8V-3M8 3V8H3M-3 8H-8V3M-3 -1H3M-3 3H1',
  jump: 'M-8 8L8 -8M2 -8H8V-2',
  key: 'M-8 4A4 4 0 1 0 -8 3.9M-4 4H8V7M5 4V6.5',
  market: 'M-8 -5H8L6 3H-6ZM-5 7H5',
  list: 'M-8 -6H-6M-2 -6H8M-8 0H-6M-2 0H8M-8 6H-6M-2 6H8',
  person: 'M0 -9A3.5 3.5 0 1 0 0 -2A3.5 3.5 0 1 0 0 -9M-7 9V5A5 5 0 0 1 -2 0H2A5 5 0 0 1 7 5V9',
  copy: 'M-6 -3H4V8H-6ZM-2 -3V-7H8V4H4',
  chev: 'M-3 -6L3 0L-3 6',
  down: 'M-6 -3L0 3L6 -3',
  close: 'M-6 -6L6 6M6 -6L-6 6',
  help: 'M-4 -4A4 4 0 1 1 0 0V3M0 7V7.5',
  siege: 'M-8 -8L8 8M8 -8L-8 8M-8 3L-3 8M3 8L8 3',
  trophy: 'M-5 -8H5V-3A5 5 0 0 1 -5 -3ZM-5 -6H-8V-4A3 3 0 0 0 -5 -1M5 -6H8V-4A3 3 0 0 1 5 -1M0 2V6M-4 8H4',
  chat: 'M0 0V8M-4 -4A5.6 5.6 0 0 1 4 -4M-7 -7A10 10 0 0 1 7 -7M0 -1V-1.2',
  gear: 'M0 -3.2A3.2 3.2 0 1 0 0 3.2A3.2 3.2 0 1 0 0 -3.2M0 -9V-6M0 6V9M-9 0H-6M6 0H9M-6.4 -6.4L-4.3 -4.3M4.3 4.3L6.4 6.4M-6.4 6.4L-4.3 4.3M4.3 -4.3L6.4 -6.4',
  more: 'M-7 0H-6.8M0 0H0.2M7 0H7.2',
  tree: 'M-8 -7H-4M0 -7H8M-4 -7V5M-4 -1H0M3 -1H8M-4 5H0M3 5H8'
}

/** A round HUD button (hud/rim-button.vue): tinted, a white picture, its label under it. */
function rim(cx, cy, tint, pic, label, { badge = '', on = false, r = 23, alert = false } = {}) {
  let out = C(cx, cy, r, { fill: mix('#230b41', tint, 0.18), stroke: tint + 'aa', sw: 1.5 })
  if (on) out += C(cx, cy, r + 3, { stroke: BRAND_300, sw: 2 })
  if (alert) out += C(cx, cy, r + 1, { stroke: PINK_LIGHT, sw: 2.5 })
  out += pic
  if (badge) out += R(cx + r - 9, cy - r - 4, 20, 16, { rx: 8, fill: '#230b41', stroke: '#ffffff88' }) + T(cx + r + 1, cy - r + 8, badge, { size: 10, anchor: 'middle', fill: '#fff' })
  if (label) out += T(cx, cy + r + 14, label, { size: 11, anchor: 'middle', fill: on ? '#fff' : LAV })
  return out
}
/** The new Map icon: three hexes of the galaxy map, your star in the middle, a straight jump to a neighbor. */
function mapIcon(cx, cy, s = 1) {
  const hexAt = (x, y, r, o) => {
    const pts = [0, 1, 2, 3, 4, 5].map((i) => `${(x + r * Math.cos((Math.PI / 3) * i + Math.PI / 6)).toFixed(1)},${(y + r * Math.sin((Math.PI / 3) * i + Math.PI / 6)).toFixed(1)}`).join(' ')
    return `<polygon points="${pts}" fill="none" stroke="#ffffff" stroke-width="1.3" opacity="${o}"/>`
  }
  const r = 7.2
  const dx = r * Math.sqrt(3)
  return G(
    hexAt(-dx / 2, 3.5, r, 0.9) + hexAt(dx / 2, 3.5, r, 0.45) + hexAt(0, 3.5 - r * 1.5, r, 0.9) +
      L(-dx / 2, 3.5, 0, 3.5 - r * 1.5, { stroke: YELLOW_LIGHT, sw: 1.6, dash: '2.2 2.2' }) +
      C(-dx / 2, 3.5, 2.6, { fill: '#ffffff' }) + C(0, 3.5 - r * 1.5, 1.9, { fill: YELLOW_LIGHT }),
    { transform: `translate(${cx} ${cy}) scale(${s})` }
  )
}
const objectsIcon = (cx, cy, s = 1) =>
  G(C(-7, -7, 3, { fill: '#fff1c4' }) + L(-7, -3, -7, 6, { stroke: '#fff', sw: 1.2, opacity: 0.6 }) + L(-7, 0, -3, 0, { stroke: '#fff', sw: 1.2, opacity: 0.6 }) + L(-7, 6, -3, 6, { stroke: '#fff', sw: 1.2, opacity: 0.6 }) +
    C(0, 0, 2.6, { fill: '#6fa8ff' }) + L(5, 0, 10, 0, { stroke: '#fff', sw: 1.6 }) + C(0, 6, 2.6, { fill: '#e58fb5' }) + L(5, 6, 10, 6, { stroke: '#fff', sw: 1.6 }) + L(-1, -7, 10, -7, { stroke: '#fff', sw: 1.6 }),
    { transform: `translate(${cx} ${cy}) scale(${s})` })
const avatar = (cx, cy, s = 1, fill = '#ffffff') =>
  G(C(0, -12, 6, { fill }) + R(-7, -2, 14, 20, { rx: 4, fill }) + R(-12, -4, 24, 7, { rx: 3.5, fill }) + R(-12, -1, 3, 15, { rx: 1.5, fill }) + R(9, -1, 3, 15, { rx: 1.5, fill }), { transform: `translate(${cx} ${cy}) scale(${s})` })

/** Every hold drawn (hud/hold-grid.svg.vue): `cells` is a list of goods codes, null for an empty hold. */
function holds(x, y, cells, size = 9, gap = 3) {
  return cells.map((code, i) => R(x + i * (size + gap), y, size, size, { rx: 2, fill: code ? GOODS[code] : 'none', stroke: code ? 'none' : '#8a80a3', sw: 1 })).join('')
}
// ── the card ─────────────────────────────────────────────────────────────────
const CARD_W = 250
const CARD_H = 418
/** The card's frame (card-background.svg.vue), any width: Koda's striped purple for a ship, else a quiet frame with thick brackets. */
function frame(x, y, w, h, theme) {
  let out = ''
  if (theme.ship) {
    const g = id('cg')
    defs.push(`<linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5c1aae"/><stop offset="0.1" stop-color="#280b4b"/><stop offset="0.5" stop-color="#5c1aae"/><stop offset="0.9" stop-color="#280b4b"/><stop offset="1" stop-color="#5c1aae"/></linearGradient>`)
    out += R(x, y, w, h, { rx: 30, ry: 8, fill: `url(#${g})` })
  } else out += R(x, y, w, h, { rx: 30, ry: 8, fill: BORDER_STRONG })
  out += R(x + 3, y + 3, w - 6, h - 6, { rx: 28, ry: 6, fill: S1 })
  if (!theme.ship) {
    const a = 50
    const b = 44
    const p = `M${x + 1.5} ${y + b}V${y + 9}Q${x + 1.5} ${y + 1.5} ${x + 30} ${y + 1.5}H${x + a + 10}` +
      `M${x + w - a - 10} ${y + 1.5}H${x + w - 30}Q${x + w - 1.5} ${y + 1.5} ${x + w - 1.5} ${y + 9}V${y + b}` +
      `M${x + w - 1.5} ${y + h - b}V${y + h - 9}Q${x + w - 1.5} ${y + h - 1.5} ${x + w - 30} ${y + h - 1.5}H${x + w - a - 10}` +
      `M${x + a + 10} ${y + h - 1.5}H${x + 30}Q${x + 1.5} ${y + h - 1.5} ${x + 1.5} ${y + h - 9}V${y + h - b}`
    out += `<path d="${p}" fill="none" stroke="${theme.base}" stroke-width="6" stroke-linecap="round"/>`
  }
  return out
}
/**
 * One leaf of a card: title pill, art, the family row, readouts, the action row.
 * family and actions are lists of well options ({ pic(cx, cy), caption, … }).
 */
function leaf(x, y, w, { theme, title, picture, kind, tag = '', rows = [], family = null, familyLabel = '', actions = [], dimActions = false, code = null, extra = '' }) {
  let out = ''
  // title pill
  if (theme.ship) {
    const g = id('tp')
    defs.push(`<linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7c39cd"/><stop offset="1" stop-color="#5c1aae"/></linearGradient>`)
    out += R(x + 10, y + 10, w - 20, 24, { rx: 30, ry: 8, fill: `url(#${g})` }) + T(x + w / 2, y + 27, title, { size: 13, weight: 700, anchor: 'middle', fill: '#fff' })
  } else out += R(x + 10, y + 10, w - 20, 24, { rx: 30, ry: 8, fill: theme.base }) + T(x + w / 2, y + 27, title, { size: 13, weight: 700, anchor: 'middle', fill: S1 })
  const artY = family ? y + 96 : y + 118
  out += picture(x + w / 2, artY)
  if (family) {
    out += T(x + w / 2, y + 166, familyLabel, { size: 8.5, anchor: 'middle', fill: theme.accent, weight: 700, spacing: 1.2 })
    const n = family.length
    const step = 62
    family.forEach((f, i) => {
      const cx = x + w / 2 + (i - (n - 1) / 2) * step
      out += well(cx, y + 191, 18, { ...f, pic: f.pic(cx, y + 191) })
    })
  }
  // readouts
  const py = y + 232
  out += R(x + 10, py, w - 20, 102, { rx: 12, fill: '#150f28', stroke: '#00000066' })
  out += T(x + 20, py + 17, kind, { size: 9.5, weight: 700, fill: theme.accent, spacing: 1.2 }) + T(x + w - 20, py + 17, tag, { size: 9, fill: TEXT_3, anchor: 'end' })
  out += R(x + 18, py + 23, w - 36, 1, { fill: '#ffffff', opacity: 0.14 })
  rows.forEach(([label, value, fill = '#ffffff', link], i) => {
    const ry = py + 41 + i * 18
    out += T(x + 20, ry, label, { size: 9.5, fill: '#a99fc6' })
    out += T(x + w - 20, ry, value, { size: 11.5, weight: 700, fill, anchor: 'end' })
    if (link) out += L(x + w - 20 - value.length * 6.3, ry + 3, x + w - 20, ry + 3, { stroke: fill, sw: 0.8, opacity: 0.6 })
  })
  if (code) out += portCode(x + w - 20, py + 41 + rows.length * 18, code, 'end')
  out += extra
  // the action row
  const n = 5
  const step = (w - 20) / n
  out += G(actions.map((a, i) => (a ? well(x + 10 + step * (i + 0.5), y + 364, 19, { ...a, pic: a.pic ? a.pic(x + 10 + step * (i + 0.5), y + 364) : '' }) : C(x + 10 + step * (i + 0.5), y + 364, 19, { stroke: BORDER_STRONG, dash: '3 4', opacity: 0.5 }))).join(''), { opacity: dimActions ? 0.4 : 1 })
  return out
}
/** A port's three-letter-style trade code, one letter per good: S sells, B buys (yellow where it buys what you carry), - neither. */
function portCode(x, y, code, anchor = 'start', size = 12, wanted = []) {
  const chars = code.split('')
  const cw = size * 0.62
  const x0 = anchor === 'end' ? x - chars.length * cw : x
  return chars.map((ch, i) => T(x0 + i * cw, y, ch, { size, mono: true, weight: 700, fill: ch === '-' ? '#6f6890' : wanted.includes(i) ? YELLOW_LIGHT : '#f1eefa' })).join('')
}

// ── HUD regions ──────────────────────────────────────────────────────────────
/** The pilot plate, in two halves: you (your profile), and the ship you're in (your ship; its chevron, your ships). */
function pilotPlate(x, y, { name = 'Tester', corp = 'Corporation Y', credits = '743¢', shipName = 'Taconator', cells = ['HE3', 'HE3', 'HE3', null, null], cargo = 'Cargo 3/5', fleet = false, w = 392 } = {}) {
  const g = id('pp')
  defs.push(`<linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7c39cd"/><stop offset="0.2" stop-color="#280b4b"/><stop offset="0.5" stop-color="#5c1aae"/><stop offset="0.8" stop-color="#280b4b"/><stop offset="1" stop-color="#7c39cd"/></linearGradient>`)
  const mid = x + 212
  let out = R(x, y, w, 68, { rx: 12, fill: `url(#${g})` }) + R(x + 4, y + 4, w - 8, 60, { rx: 9, fill: '#0d0719' })
  // you
  out += C(x + 36, y + 34, 21, { fill: mix('#230b41', TINT.you, 0.18), stroke: TINT.you + 'aa', sw: 1.5 }) + avatar(x + 36, y + 36, 0.95)
  out += T(x + 66, y + 28, name, { size: 16, fill: '#fff' }) + T(x + 66, y + 44, corp, { size: 11, fill: LAV })
  out += T(mid - 12, y + 30, credits, { size: 17, fill: '#fff', anchor: 'end' })
  out += T(mid - 12, y + 52, 'You', { size: 9, fill: TEXT_3, anchor: 'end', spacing: 1 })
  out += L(mid, y + 12, mid, y + 56, { stroke: BORDER_STRONG })
  // the ship you're in
  out += ship(mid + 24, y + 30, 26, 45)
  out += T(mid + 46, y + 28, shipName, { size: 14, fill: '#fff' })
  out += holds(mid + 46, y + 38, cells) + T(mid + 46 + cells.length * 12 + 6, y + 47, cargo, { size: 10.5, fill: LAV })
  out += R(mid + 12, y + 46, 26, 12, { rx: 6, fill: YELLOW }) + T(mid + 25, y + 55, 'IN', { size: 8.5, weight: 700, fill: S1, anchor: 'middle' })
  if (fleet) out += glyph(x + w - 18, y + 34, GLYPH.down, { size: 14 })
  return out
}
const chip = (x, y, w, text, { fill = YELLOW_LIGHT, bar = 0 } = {}) =>
  R(x, y, w, 26, { rx: 12, fill: '#12052a', stroke: fill + '55' }) + T(x + 12, y + 17, text, { size: 12, fill }) + (bar ? R(x + 12, y + 21, (w - 24) * bar, 2.5, { rx: 1, fill }) : '')

/** Minerva's plate, top center: her face, the one thing she's saying, and the tray's rows under it. */
function minervaPlate(cx, y, line, { fill = YELLOW_LIGHT, net = 'Polkadot Hub TestNet', tray = [], w = 320 } = {}) {
  const x = cx - w / 2
  let out = R(x, y, w, 50, { rx: 25, fill: '#12052a', stroke: BORDER_STRONG, sw: 1.5 })
  out += C(x + 26, y + 25, 21, { fill: '#1a1331', stroke: BRAND_300, sw: 1.2 }) + art('minerva-face', x + 26, y + 25, 38)
  out += T(x + 56, y + 21, 'MINERVA', { size: 9, weight: 700, fill: '#c9b6ff', spacing: 1.4 }) + T(x + 112, y + 21, net, { size: 10, fill: TEXT_3 })
  out += T(x + 56, y + 38, line, { size: 13, fill })
  out += C(x + w - 20, y + 25, 4.5, { fill: GREEN }) + C(x + w - 20, y + 25, 8, { stroke: GREEN, opacity: 0.35 })
  tray.forEach(([mark, text], i) => {
    const ty = y + 58 + i * 34
    out += L(cx, ty - 8, cx, ty, { stroke: BORDER_STRONG })
    out += R(x + 10, ty, w - 20, 28, { rx: 12, fill: '#12052a', stroke: '#c3b3da44' }) + C(x + 26, ty + 14, 5, { fill: mark }) + T(x + 40, ty + 18.5, text, { size: 12.5, fill: '#e6dcf5' })
  })
  return out
}

/** Where you are: the system's name, its center's button, the minimap and zoom, and now two buttons. */
function systemBlock(right, y, { name = 'Sol', number = 'Star System 0', count = '27', objectsOn = false } = {}) {
  let out = T(right - 60, y + 12, number, { size: 12, fill: '#ffffffaa', anchor: 'end' }) + T(right - 60, y + 38, name, { size: 28, fill: '#ffffffdd', anchor: 'end' })
  out += C(right - 23, y + 24, 22, { fill: mix('#230b41', TINT.map, 0.18), stroke: TINT.map + 'aa', sw: 1.5 }) + starBody(right - 23, y + 24, 5)
  const my = y + 56
  out += R(right - 132, my, 132, 132, { rx: 8, fill: '#12052a', stroke: '#ffffff33' })
  ;[14, 26, 38, 50, 60].forEach((r) => (out += C(right - 66, my + 66, r, { stroke: '#ffffff22' })))
  out += C(right - 66, my + 66, 3, { fill: '#fff1c4' }) + C(right - 40, my + 66, 2.4, { fill: YELLOW }) + C(right - 92, my + 50, 2, { fill: '#fff' }) + C(right - 50, my + 30, 2, { fill: '#fff' }) + C(right - 100, my + 100, 2, { fill: '#fff' })
  out += R(right - 54, my + 54, 30, 24, { stroke: '#ffffff77', rx: 2 })
  out += R(right - 172, my, 34, 132, { rx: 17, fill: '#12052a', stroke: '#ffffff33' }) + T(right - 155, my + 22, '+', { size: 20, fill: '#fff', anchor: 'middle' }) + T(right - 155, my + 122, '−', { size: 20, fill: '#fff', anchor: 'middle' })
  out += L(right - 155, my + 34, right - 155, my + 100, { stroke: '#ffffff55' }) + R(right - 165, my + 48, 20, 10, { rx: 5, fill: '#e6dcf5' })
  out += T(right - 180, my + 56, 'ship', { size: 9.5, fill: LAV, anchor: 'end' }) + T(right - 180, my + 88, 'system', { size: 9.5, fill: LAV, anchor: 'end' })
  // two buttons where there were four
  out += rim(right - 96, my + 168, TINT.objects, objectsIcon(right - 97, my + 168, 1.15), 'Objects', { badge: count, on: objectsOn })
  out += rim(right - 30, my + 168, TINT.map, mapIcon(right - 30, my + 168, 1.15), 'Map')
  return out
}
function dock(right, bottom) {
  const x = right - 292
  const y = bottom - 80
  let out = R(x, y, 292, 80, { rx: 16, fill: '#12052a', stroke: BORDER, opacity: 0.92 })
  const items = [['help', GLYPH.help, 'Help', '4'], ['sieges', GLYPH.siege, 'Sieges'], ['ranks', GLYPH.trophy, 'Ranks'], ['chat', GLYPH.chat, 'Chat'], ['settings', GLYPH.gear, 'Settings']]
  items.forEach(([tint, d, label, badge], i) => (out += rim(x + 34 + i * 56, y + 33, TINT[tint], glyph(x + 34 + i * 56, y + 33, d, { stroke: '#fff', size: 24 }), label, { badge })))
  return out
}
/** The system strip: the center, each planet and the belt as marks, ‹ › to step, and a list button that opens Objects. */
function strip(x, y, sel = 3, { compact = false } = {}) {
  const marks = [['star'], ['Rocky', 8], ['Volcanic', 9, 'port'], ['Terrestrial', 10, 'port'], ['Ferrous', 9, 'port'], ['belt'], ['Gaseous', 12, 'port'], ['Gaseous', 11], ['Ice', 10, 'port'], ['Ice', 10], ['Rocky', 7]]
  const step = compact ? 29 : 34
  const w = 36 + marks.length * step + 30 + 44
  let out = R(x, y, w, 40, { rx: 20, fill: '#12052a', stroke: BORDER }) + glyph(x + 18, y + 20, 'M3 -6L-3 0L3 6', { size: 16 })
  marks.forEach(([cls, r, port, mine], i) => {
    const cx = x + 36 + step * (i + 0.5)
    if (i === sel) out += C(cx, y + 20, 15, { stroke: BRAND_300, sw: 2 })
    if (cls === 'star') out += starBody(cx, y + 20, 8)
    else if (cls === 'belt') out += C(cx, y + 20, 9, { stroke: '#cdbb9c', sw: 2.5, dash: '2 3' })
    else out += sphere(cx, y + 20, r * 0.92, PLANET[cls], { earth: cls === 'Terrestrial' })
    if (port && i % 2) out += C(cx, y + 4.5, 2.2, { fill: GREEN })
    if (mine) out += C(cx + 9, y + 32, 3, { fill: YELLOW, stroke: '#12052a' })
  })
  const end = x + 36 + marks.length * step
  out += glyph(end + 12, y + 20, GLYPH.chev, { size: 16 })
  out += L(end + 30, y + 8, end + 30, y + 32, { stroke: BORDER }) + C(end + 52, y + 20, 14, { fill: mix('#230b41', TINT.objects, 0.22), stroke: TINT.objects + 'aa' }) + glyph(end + 52, y + 20, GLYPH.list, { size: 15, stroke: '#fff' })
  return { svg: out, w }
}

/** A menu sheet (hud/menu-sheet.vue): the striped frame, the quiet inside, its close button. */
function sheet(x, y, w, h, theme, title, sub = '') {
  const g = id('sh')
  defs.push(`<linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${theme.mid}"/><stop offset="0.1" stop-color="${theme.deep}"/><stop offset="0.5" stop-color="${theme.mid}"/><stop offset="0.9" stop-color="${theme.deep}"/><stop offset="1" stop-color="${theme.mid}"/></linearGradient>`)
  let out = R(x, y, w, h, { rx: 12, fill: `url(#${g})` }) + R(x + 10, y + 10, w - 20, h - 20, { rx: 6, fill: S1, stroke: '#ffffff22', sw: 3 })
  if (title) out += T(x + w / 2, y + 50, title, { size: 24, fill: '#fff', anchor: 'middle' })
  if (sub) out += T(x + w / 2, y + 70, sub, { size: 12, fill: LAV, anchor: 'middle' })
  out += R(x + w - 58, y + 20, 38, 38, { rx: 8, fill: S3, stroke: '#ffffff66' }) + glyph(x + w - 39, y + 39, GLYPH.close, { stroke: '#fff', size: 26 })
  return out
}
const filterChip = (x, y, label, { on = false, count = '', accent = BRAND_300, w = null } = {}) => {
  const width = w ?? label.length * 7.4 + (count ? 26 : 0) + 26
  return {
    svg: R(x, y, width, 30, { rx: 15, fill: on ? S3 : '#1f173a', stroke: on ? accent : '#4a3d7a', sw: on ? 2 : 1.2 }) + T(x + 13, y + 19.5, label, { size: 12.5, fill: on ? '#fff' : '#d9ccf5', weight: on ? 700 : 400 }) + (count ? T(x + width - 12, y + 19.5, count, { size: 11, fill: TEXT_3, anchor: 'end' }) : ''),
    w: width
  }
}
const chips = (x, y, list) => {
  let out = ''
  let cx = x
  for (const [label, opts] of list) {
    const c = filterChip(cx, y, label, opts)
    out += c.svg
    cx += c.w + 8
  }
  return out
}
/** A pill button (App.vue .o8-pill): the main one in the brand purple. */
const pill = (x, y, w, label, { main = false, off = false, h = 38 } = {}) =>
  R(x, y, w, h, { rx: h / 2, fill: off ? 'none' : main ? BRAND_500 : '#2a1f4c', stroke: off ? BORDER_STRONG : main ? BRAND_300 : '#4a3d7a', sw: 1.5, dash: off ? '4 4' : '' }) + T(x + w / 2, y + h / 2 + 5, label, { size: 14, weight: 700, fill: off ? '#efe7ff66' : '#efe7ff', anchor: 'middle' })
/** A place drawn and switched off: the drawer's dashed socket, a dimmed picture, "Not yet". */
function notYet(x, y, w, h, name, artName, line = 'Not yet') {
  return R(x, y, w, h, { rx: 10, stroke: BORDER_STRONG, dash: '4 4', opacity: 0.8 }) + (artName ? art(artName, x + 24, y + h / 2, 30, 0.35) : '') + T(x + (artName ? 46 : 14), y + h / 2 - 2, name, { size: 12.5, fill: '#efe7ff88', weight: 500 }) + T(x + (artName ? 46 : 14), y + h / 2 + 13, line, { size: 10.5, fill: TEXT_3 })
}
const section = (x, y, label, w) => T(x, y, label, { size: 9.5, weight: 700, fill: '#c9b6ff', spacing: 1.3 }) + R(x, y + 6, w, 1, { fill: '#ffffff', opacity: 0.12 })
const note = (x, y, n, text, w = 300) => {
  const words = text.split(' ')
  const lines = []
  let line = ''
  for (const word of words) {
    if ((line + ' ' + word).length > w / 6.1) {
      lines.push(line.trim())
      line = word
    } else line += ' ' + word
  }
  lines.push(line.trim())
  return C(x + 9, y - 4, 9, { fill: '#fff', opacity: 0.92 }) + T(x + 9, y, n, { size: 11, weight: 700, fill: '#130e24', anchor: 'middle' }) + lines.map((l, i) => T(x + 26, y + i * 15, l, { size: 11.5, fill: '#ffffffcc' })).join('')
}
const pin = (cx, cy, n) => C(cx, cy, 9, { fill: '#fff', opacity: 0.92 }) + T(cx, cy + 4, n, { size: 11, weight: 700, fill: '#130e24', anchor: 'middle' })

function doc(w, h, body, name) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" font-family="Ubuntu, 'Segoe UI', sans-serif">\n<defs>${defs.join('')}</defs>\n${body}\n</svg>\n`
  fs.writeFileSync(path.join(OUT, name + '.svg'), svg)
  defs = []
  console.log('wrote', name + '.svg', Math.round(svg.length / 1024) + ' KB')
}

// pictures used by wells
const P = {
  art: (name, k = 1.5) => (cx, cy) => art(name, cx, cy, 19 * k),
  station: (cx, cy) => station(cx, cy, 24),
  moon: (cx, cy) => sphere(cx, cy, 11, PLANET.Moon),
  earth: (cx, cy) => sphere(cx, cy, 12, PLANET.Terrestrial, { earth: true }),
  glyph: (d) => (cx, cy) => glyph(cx, cy, d, { size: 20 })
}

// ═════════════════════════════════════════════════════════════════════════════
// 1. The card and its wing
// ═════════════════════════════════════════════════════════════════════════════
function world1(dim = 0) {
  let out = space(1440, 900, 11)
  // Earth's orbit round Sol, the station's and the moon's round Earth
  out += `<path d="M-40 520Q700 380 1480 250" fill="none" stroke="#4a3f75" stroke-width="1.2"/>`
  out += C(900, 400, 170, { stroke: '#c3b3da', sw: 3, dash: '2 9', opacity: 0.75 }) + C(900, 400, 290, { stroke: '#4a3f75', dash: '3 6' })
  out += sphere(900, 400, 56, PLANET.Terrestrial, { earth: true }) + T(900, 482, 'Earth', { size: 17, fill: '#ffffff77', anchor: 'middle' })
  out += sphere(1146, 246, 13, PLANET.Moon)
  out += station(752, 316, 46) + ship(716, 300, 24, 110)
  out += C(752, 316, 62, { stroke: THEME.station.accent, dash: '3 5', opacity: 0.7 })
  out += `<path d="M700 350L560 470H540" fill="none" stroke="${THEME.station.accent}" stroke-dasharray="3 5" opacity="0.55"/>`
  if (dim) out += R(0, 0, 1440, 900, { fill: '#05020c', opacity: dim })
  return out
}
const earthRows = [['Owner', 'Minerva', '#c9b6ff'], ['World', 'Terrestrial · size 12'], ['Moons', '1'], ['Built', 'Fully built']]
const earthFamily = (on) => [
  { pic: P.station, caption: 'Station', on: on === 0 },
  { pic: P.moon, caption: 'Luna', on: on === 1 }
]
// Sol's worlds are Minerva's: no claim, colony or siege here, so those slots stay empty sockets
const earthActions = [
  null,
  null,
  { pic: P.art('colonists', 1.7), caption: 'Recruit', sub: '10¢ each', main: true, key: '3' },
  null,
  { pic: P.glyph(GLYPH.details), caption: 'Details', key: '5' }
]
function earthLeaf(x, y, opts = {}) {
  return leaf(x, y, CARD_W, {
    theme: THEME.earth, title: 'Earth', kind: 'PLANET', tag: 'Orbit 3',
    picture: (cx, cy) => sphere(cx, cy, 40, PLANET.Terrestrial, { earth: true }) +
      [['citadel', -54], ['colony', -18], ['port', 18], ['yards', 54]].map(([a, dx]) => C(cx + dx, cy + 46 - Math.abs(dx) * 0.16, 13, { fill: '#1a1331', stroke: '#8f7fd0' }) + art(a, cx + dx, cy + 46 - Math.abs(dx) * 0.16, 22)).join(''),
    rows: earthRows, family: earthFamily(opts.on), familyLabel: 'IN ORBIT', actions: earthActions, dimActions: opts.dim
  })
}
function stationLeaf(x, y) {
  const goods = [['MET', '119¢', 'B'], ['RAR', '259¢', 'B'], ['HE3', '197¢', 'B', true], ['SIL', '88¢', 'B'], ['ORG', '57¢', 'S'], ['EQP', '190¢', 'S'], ['ELC', '247¢', 'S']]
  const py = y + 232
  let extra = ''
  goods.forEach(([code, price, side, wanted], i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    const gx = x + 20 + col * 104
    const gy = py + 60 + row * 13.5
    extra += T(gx, gy, code, { size: 10, weight: 700, fill: GOODS[code] }) + T(gx + 30, gy, side === 'B' ? '↑ buys' : '↓ sells', { size: 9.5, fill: wanted ? YELLOW_LIGHT : '#a99fc6' }) + T(gx + 94, gy, price, { size: 10, fill: wanted ? YELLOW_LIGHT : '#e6dcf5', anchor: 'end', weight: wanted ? 700 : 400 })
  })
  return leaf(x, y, CARD_W - 14, {
    theme: THEME.station, title: 'I.S.S.', kind: 'SPACE STATION', tag: 'at Earth',
    picture: (cx, cy) => station(cx, cy, 78) + ship(cx - 52, cy - 22, 22, 110),
    rows: [['Trades', '']], code: null,
    extra: portCode(x + CARD_W - 34, py + 41, '-BBBSBSS', 'end', 12.5, [3]) + extra,
    actions: [
      { pic: P.earth, caption: 'Earth', key: '1' },
      { pic: P.art('port'), caption: 'Trade', main: true, key: '2', sub: '+591¢', subFill: YELLOW_LIGHT },
      { pic: P.art('yards'), caption: 'Yards', key: '3' },
      { pic: P.art('armory'), caption: 'Armory', key: '4' },
      { pic: P.glyph(GLYPH.details), caption: 'Details', key: '5' }
    ]
  })
}
/** Earth's card with the station's wing open: one frame, two leaves, a hinge between. */
function cardWithWing(x, y) {
  const w = CARD_W * 2 - 14
  let out = frame(x, y, w, CARD_H, THEME.earth)
  out += earthLeaf(x, y, { on: 0, dim: true })
  // the hinge, and the wing's lighter ground
  out += R(x + CARD_W, y + 8, w - CARD_W - 8, CARD_H - 16, { rx: 14, fill: '#221a3d' })
  out += L(x + CARD_W, y + 14, x + CARD_W, y + CARD_H - 14, { stroke: THEME.station.base, sw: 2, opacity: 0.8 })
  ;[60, 209, 358].forEach((dy) => (out += R(x + CARD_W - 4, y + dy, 8, 18, { rx: 3, fill: S1, stroke: THEME.station.base })))
  out += stationLeaf(x + CARD_W, y)
  return { svg: out, w }
}

function mock1() {
  let out = world1()
  out += pilotPlate(18, 16) + chip(18, 92, 232, 'Mining · 4 drones · 1/2 · full in 44s', { bar: 0.55 })
  out += minervaPlate(720, 14, 'Session · 3h 12m left', { tray: [[LAV, 'Selling 3 Helium-3 at I.S.S. … sent']] })
  out += systemBlock(1422, 16)
  out += dock(1422, 882)
  const s = strip(18, 410, 3)
  out += s.svg
  const card = cardWithWing(18, 464)
  out += card.svg
  // notes
  out += pin(56, 640, '1') + pin(286, 620, '2') + pin(522, 486, '3') + pin(522, 828, '4') + pin(8, 828, '5') + pin(536, 38, '6') + pin(1262, 240, '7') + pin(236, 12, '8') + pin(522, 430, '9')
  const nx = 548
  const ny = 560
  out += R(nx - 16, ny - 26, 560, 312, { rx: 12, fill: '#0b0916', stroke: '#ffffff22', opacity: 0.92 })
  out += T(nx, ny - 4, 'Mockup 1 · the card and its wing', { size: 15, weight: 700, fill: '#fff' })
  const notes = [
    ['1', 'The family row: what orbits Earth, as captioned wells inside the card. They were the buttons hanging off the bottom edge.'],
    ['2', 'The hinge. Pressing Station unfolds a wing from the planet\'s card, inside one frame. Earth stays in view and lit.'],
    ['3', 'The wing has its own title, art, readouts and actions. The trade code and prices are on it; yellow marks what buys your cargo.'],
    ['4', 'Actions are pictured wells in the card, one word each. Fixed slots, keys 1–5. One main action, here Trade. The first well goes back to Earth.'],
    ['5', 'Earth\'s own actions dim while the wing is open; empty slots keep their places. The last slot is always Details.'],
    ['6', 'Minerva: the network in one place. Session and scans are her line; a move on its way hangs under her.'],
    ['7', 'Two buttons where there were four: Objects (everything here) and Map, with its new hex-to-hex icon.'],
    ['8', 'The pilot plate in two halves: you (your profile) and the ship you\'re in.'],
    ['9', 'The strip stays as the short form; its list button opens Objects. The nearby strip is gone.']
  ]
  let yy = ny + 22
  for (const [n, text] of notes) {
    out += note(nx, yy, n, text, 500)
    yy += text.length > 82 ? 32 : 17
  }
  doc(1440, 900, out, '1-card-and-wing')
}

// ═════════════════════════════════════════════════════════════════════════════
// 2. Objects
// ═════════════════════════════════════════════════════════════════════════════
/** One row of the Objects tree. */
function objRow(x, y, w, { depth = 0, pic, name, sub = '', right = '', rightFill = TEXT_2, fold = null, selected = false, mine = false, siege = false, marks = '', code = null, wanted = [], h = 44 }) {
  const ix = x + 14 + depth * 34
  let out = ''
  if (selected) out += R(x, y, w, h, { rx: 10, fill: S3, stroke: BRAND_300, sw: 1.5 })
  if (depth) out += `<path d="M${ix - 18} ${y - 4}V${y + h / 2}H${ix - 4}" fill="none" stroke="${BORDER_STRONG}"/>`
  if (fold !== null) out += glyph(ix + 6, y + h / 2, fold ? GLYPH.down : GLYPH.chev, { size: 13 })
  out += pic(ix + 38, y + h / 2)
  if (siege) out += C(ix + 38, y + h / 2, 17, { stroke: PINK_LIGHT, sw: 1.8, dash: '4 3' })
  if (mine) out += C(ix + 50, y + h / 2 + 11, 4, { fill: YELLOW, stroke: S1, sw: 1.5 })
  out += T(ix + 64, y + h / 2 - (sub ? 2 : -4), name, { size: 14.5, fill: '#fff', weight: 500 })
  if (sub) out += T(ix + 64, y + h / 2 + 13, sub, { size: 11, fill: TEXT_3 })
  if (code) out += portCode(x + w - 16, y + h / 2 + 4, code, 'end', 13, wanted)
  else if (right) out += T(x + w - 16, y + h / 2 + 4, right, { size: 12, fill: rightFill, anchor: 'end' })
  out += marks ? G(marks, { transform: `translate(${x + w - 16} ${y + h / 2})` }) : ''
  return out
}
function objectsSheet(x, y, w, h) {
  let out = sheet(x, y, w, h, THEME.ship, 'Objects of Sol', '27 things here · press one to select it, again to go')
  out += chips(x + 28, y + 86, [['All', { on: true, count: '27' }], ['Planets', { count: '9' }], ['Stations', { count: '15' }], ['Moons', {}], ['Asteroids', { count: '6' }], ['Ships', { count: '3' }]])
  out += filterChip(x + w - 28 - 58, y + 86, 'Mine', { accent: YELLOW_LIGHT }).svg
  // the center, pinned
  const cy = y + 130
  out += R(x + 24, cy, w - 48, 54, { rx: 12, fill: '#150f28', stroke: '#fff1c455' })
  out += starBody(x + 62, cy + 27, 11) + T(x + 92, cy + 24, 'Sol', { size: 17, fill: '#fff', weight: 500 }) + T(x + 92, cy + 41, 'The center · Class G star · Minerva\'s', { size: 11.5, fill: TEXT_3 })
  out += T(x + w - 40, cy + 31, '9 planets · 1 belt · 15 ports', { size: 12, fill: TEXT_2, anchor: 'end' })
  // the tree
  const rx = x + 24
  const rw = w - 48
  let ry = cy + 62
  const sp = (cls, r = 13, earth = false) => (cx, cy2) => sphere(cx, cy2, r, PLANET[cls], { earth })
  const mk = (list) => list.map(([kind, n], i) => (kind === 'port' ? station(-10 - i * 30, 0, 18, '#c9b6ff') : sphere(-10 - i * 30, 0, 7, PLANET.Moon)) + (n ? T(-10 - i * 30 + 12, 4, n, { size: 10, fill: TEXT_3 }) : '')).join('')
  const rows = [
    { pic: sp('Rocky', 10), name: 'Mercury', sub: 'Rocky · Minerva\'s', fold: false, marks: mk([['port']]) },
    { pic: sp('Volcanic', 12), name: 'Venus', sub: 'Volcanic · Minerva\'s', fold: false, marks: mk([['port']]) },
    { pic: sp('Terrestrial', 14, true), name: 'Earth', sub: 'Terrestrial · size 12 · Minerva\'s', fold: true, selected: true },
    { depth: 1, pic: (cx, cy2) => station(cx, cy2, 26), name: 'I.S.S.', sub: 'Station · port, yards, armory · buys your Helium-3', code: '-BBBSBSS', wanted: [3] },
    { depth: 1, pic: (cx, cy2) => sphere(cx, cy2, 9, PLANET.Moon), name: 'Luna', sub: 'Moon · 6 mounts', right: '' },
    { pic: sp('Ferrous', 11), name: 'Mars', sub: 'Ferrous · Minerva\'s', fold: false, marks: mk([['moon', '2'], ['port']]) },
    { pic: (cx, cy2) => C(cx, cy2, 11, { stroke: '#cdbb9c', sw: 3, dash: '2 3' }), name: 'The asteroid belt', sub: '6 asteroids · 2 empty sections · you\'re mining here', fold: false, mine: true, right: 'Mining 1/2', rightFill: YELLOW_LIGHT },
    { pic: sp('Gaseous', 15), name: 'Jupiter', sub: 'Gaseous · Minerva\'s', fold: false, marks: mk([['moon', '4'], ['port']]) },
    { pic: sp('Gaseous', 14), name: 'Saturn', sub: 'Gaseous · rings · Minerva\'s', fold: false, marks: mk([['moon', '1'], ['port']]) }
  ]
  for (const row of rows) {
    out += objRow(rx, ry, rw, row)
    ry += 46
  }
  out += T(rx + 14, ry + 14, 'Uranus, Neptune, Pluto', { size: 11.5, fill: TEXT_3 }) + T(rx + rw - 16, ry + 14, 'scroll', { size: 11, fill: TEXT_3, anchor: 'end' })
  ry += 28
  out += section(rx + 8, ry + 8, 'SHIPS HERE', rw - 16)
  ry += 20
  out += objRow(rx, ry, rw, { pic: (cx, cy2) => ship(cx, cy2, 24, 45), name: 'Taconator', sub: 'Your ship · at the belt', mine: true, right: 'You', rightFill: YELLOW_LIGHT })
  ry += 44
  out += objRow(rx, ry, rw, { pic: (cx, cy2) => ship(cx, cy2, 24, 45), name: 'Spirit Spacelines', sub: 'Mr Sudz · docked at I.S.S.', right: 'Mr Sudz ›', rightFill: '#c9b6ff' })
  return out
}
function buyingSheet(x, y, w, h) {
  let out = sheet(x, y, w, h, THEME.ship, 'Objects of Sol', 'Ports that buy what you carry, best first')
  out += chips(x + 28, y + 86, [['All', { count: '27' }], ['Planets', {}], ['Stations', { on: true, count: '15' }], ['Moons', {}], ['Asteroids', {}], ['Ships', {}]])
  out += L(x + 250, y + 118, x + 250, y + 132, { stroke: BRAND_300 })
  out += chips(x + 216, y + 132, [['Buying', { on: true, count: '4', accent: YELLOW_LIGHT }], ['Yards', {}], ['Armory', {}]])
  const ports = [
    ['I.S.S.', 'at Earth · Minerva\'s', '-BBBSBSS', [3], '591¢', '197¢ each'],
    ['Icarus', 'at Mercury · Minerva\'s', 'BS-BBS--', [3], '591¢', '197¢ each'],
    ['Tiangong', 'at Mars · Minerva\'s', 'BS-BB-S-', [3], '573¢', '191¢ each']
  ]
  let ry = y + 176
  for (const [name, sub, code, wanted, total, each] of ports) {
    out += R(x + 24, ry, w - 48, 92, { rx: 12, fill: '#150f28', stroke: BORDER })
    out += station(x + 56, ry + 28, 30) + C(x + 72, ry + 12, 4, { fill: GREEN }) + T(x + 84, ry + 26, name, { size: 16, weight: 700, fill: '#fff' }) + T(x + 84, ry + 42, sub, { size: 11.5, fill: TEXT_3 })
    out += portCode(x + w - 44, ry + 30, code, 'end', 14, wanted)
    out += T(x + w - 44, ry + 50, `Your 3 Helium-3 here: ${total}`, { size: 12.5, fill: YELLOW_LIGHT, anchor: 'end', weight: 700 }) + T(x + w - 44, ry + 65, each, { size: 10.5, fill: TEXT_3, anchor: 'end' })
    out += well(x + 56, ry + 68, 14, { pic: art('port', x + 56, ry + 68, 20), main: true }) + T(x + 78, ry + 73, 'Trade', { size: 12.5, weight: 700, fill: '#efe7ff' })
    out += well(x + 150, ry + 68, 14, { pic: art('yards', x + 150, ry + 68, 20) }) + T(x + 172, ry + 73, 'Yards', { size: 12.5, fill: '#efe7ff' })
    out += well(x + 244, ry + 68, 14, { pic: art('armory', x + 244, ry + 68, 20) }) + T(x + 266, ry + 73, 'Armory', { size: 12.5, fill: '#efe7ff' })
    ry += 102
  }
  return out
}
function mock2() {
  let out = world1(0.45)
  out += pilotPlate(18, 16) + chip(18, 92, 232, 'Mining · 4 drones · 1/2 · full in 44s', { bar: 0.55 })
  out += minervaPlate(720, 14, 'Session · 3h 12m left')
  out += systemBlock(1422, 16, { objectsOn: true })
  out += dock(1422, 882)
  // the card stays in your hand while you browse: it shows the row you pressed
  const s = strip(18, 410, 3)
  out += s.svg
  out += frame(18, 464, CARD_W, CARD_H, THEME.earth) + earthLeaf(18, 464, {})
  out += objectsSheet(360, 82, 720, 800)
  out += pin(372, 183, '1') + pin(372, 239, '2') + pin(372, 388, '3') + pin(1068, 183, '4') + pin(10, 560, '5')
  // the second state, below
  const by = 930
  out += R(0, 900, 1440, 580, { fill: '#0b0916' }) + L(0, 900, 1440, 900, { stroke: '#ffffff22' })
  out += buyingSheet(360, by, 720, 506)
  out += pin(566, by + 147, '6')
  out += T(40, by + 26, 'Mockup 2 · Objects', { size: 15, weight: 700, fill: '#fff' })
  const left = [
    ['1', 'Filters along the top. All is the tree; a filter flattens it to one kind. Mine is everything you own here.'],
    ['2', 'The center is pinned: a star, a pair or a black hole. Every system has one.'],
    ['3', 'A planet is one thing. Its station and moons fold inside it; folded, small marks show what it holds.'],
    ['4', 'Mine will also carry the industry plan\'s holdings and Transfer, switched off until the contracts exist.'],
    ['5', 'The card stays in your hand and follows the row you press, so you can browse without leaving the menu.']
  ]
  let yy = by + 56
  for (const [n, text] of left) {
    out += note(30, yy, n, text, 280)
    yy += Math.ceil(text.length / 44) * 15 + 14
  }
  out += T(1110, by + 26, 'The same menu, Stations › Buying', { size: 15, weight: 700, fill: '#fff' })
  out += note(1110, by + 56, '6', 'Stations adds a second row of chips. Buying keeps only the ports that buy what you carry, sorted by what your cargo fetches there.', 280)
  out += note(1110, by + 146, '·', 'These are the Ports menu\'s rows, kept whole: trade code, what your cargo fetches, and the Trade, Yards and Armory shortcuts. The Planets, Ports and Ships menus all fold into this one.', 280)
  doc(1440, 1470, out, '2-objects')
}

// ═════════════════════════════════════════════════════════════════════════════
// 3. Details, and a pilot's profile
// ═════════════════════════════════════════════════════════════════════════════
function bar(x, y, w, frac, { fill = BRAND_300, h = 7 } = {}) {
  return R(x, y, w, h, { rx: h / 2, fill: '#0f0a1e', stroke: BORDER }) + R(x, y, Math.max(h, w * frac), h, { rx: h / 2, fill })
}
function mock3() {
  let out = space(1440, 960, 23, 0.35)
  const th = THEME.oceanic
  // ── Details: a big card
  const x = 28
  const y = 28
  const w = 872
  const h = 860
  out += frame(x, y, w, h, th)
  out += R(x + 14, y + 12, w - 28, 34, { rx: 30, ry: 10, fill: th.base }) + T(x + w / 2, y + 36, 'New Ceylon', { size: 19, weight: 700, fill: S1, anchor: 'middle' })
  out += R(x + w - 66, y + 56, 38, 38, { rx: 8, fill: S3, stroke: '#ffffff66' }) + glyph(x + w - 47, y + 75, GLYPH.close, { stroke: '#fff', size: 26 })
  out += R(x - 6, y - 6, w + 12, h + 12, { rx: 34, ry: 12, stroke: PINK_LIGHT, sw: 2.5, dash: '8 5' })
  // left: the art, and its family as part of it
  const lx = x + 30
  const lw = 290
  out += sphere(lx + lw / 2, y + 190, 96, PLANET.Oceanic)
  out += `<ellipse cx="${lx + lw / 2}" cy="${y + 190}" rx="150" ry="20" fill="none" stroke="#9ff0ff" stroke-width="1" opacity="0.25"/>`
  ;[['citadel', -120], ['colony', -72], ['port', -24], ['yards', 24], ['armory', 72], ['autofactory', 120]].forEach(([a, dx], i) => {
    const cy = y + 318 - Math.abs(dx) * 0.14
    out += C(lx + lw / 2 + dx, cy, 19, { fill: '#1a1331', stroke: i === 4 ? BRAND_300 : '#8f7fd0', dash: i === 4 ? '4 3' : '' }) + art(a, lx + lw / 2 + dx, cy, 30, i === 4 ? 0.6 : 1)
  })
  out += section(lx, y + 372, 'IN ORBIT · PART OF NEW CEYLON', lw)
  const tile = (ty, pic, name, sub, right = '') => R(lx, ty, lw, 56, { rx: 12, fill: '#150f28', stroke: BORDER }) + pic(lx + 30, ty + 28) + T(lx + 58, ty + 25, name, { size: 14.5, fill: '#fff', weight: 500 }) + T(lx + 58, ty + 42, sub, { size: 11, fill: TEXT_3 }) + right + glyph(lx + lw - 16, ty + 28, GLYPH.chev, { size: 13 })
  out += tile(y + 390, (cx, cy) => station(cx, cy, 32), 'Port Serendib', 'Station · port, yards', portCode(lx + lw - 34, y + 416, 'SB-S-BB-', 'end', 12))
  out += tile(y + 452, (cx, cy) => sphere(cx, cy, 13, PLANET.Moon), 'Galle', 'Moon · 6 mounts, 4 fitted')
  out += tile(y + 514, (cx, cy) => sphere(cx, cy, 11, PLANET.Moon), 'Kandy', 'Moon · 6 mounts, 6 fitted')
  out += section(lx, y + 598, 'NOT YET', lw)
  out += notYet(lx, y + 614, lw, 46, 'Whose law applies here', 'claim') + notYet(lx, y + 666, lw, 46, 'Cargo ships and transfers', 'cargo-pod') + notYet(lx, y + 718, lw, 46, 'Terraforming', 'colony-pod')
  // right: everything the small card can't show
  const rx = x + 352
  const rw = w - 352 - 34
  let ry = y + 78
  out += section(rx, ry, 'WHAT IT IS', rw - 50)
  const fact = (fx, fy, label, value, { fill = '#fff', link = false } = {}) =>
    T(fx, fy, label, { size: 10.5, fill: '#a99fc6' }) + T(fx, fy + 18, value, { size: 14.5, weight: 700, fill }) + (link ? L(fx, fy + 22, fx + value.length * 8, fy + 22, { stroke: fill, sw: 1, opacity: 0.7 }) + glyph(fx + value.length * 8 + 12, fy + 13, GLYPH.chev, { size: 11, stroke: fill }) : '')
  out += fact(rx, ry + 28, 'World', 'Oceanic · size 11') + fact(rx + 170, ry + 28, 'Orbit', '3rd of 5 · no rings') + fact(rx + 330, ry + 28, 'Deed', '#412')
  out += fact(rx, ry + 76, 'Star', 'Barnard\'s Star', { fill: '#ffd2a1', link: true })
  out += fact(rx + 170, ry + 76, 'Besieged by', 'Mr Sudz', { fill: PINK_LIGHT, link: true })
  out += avatar(rx + 318, ry + 92, 0.62, '#c9b6ff') + fact(rx + 336, ry + 76, 'Owner', 'Ada Vance', { fill: '#c9b6ff', link: true })
  out += pin(rx - 14, ry + 86, '2')
  ry += 132
  out += section(rx, ry, 'BUILT', rw)
  const line = [['claim', 'Claim', 1], ['citadel', 'Citadel', 1], ['colony', 'Colony', 1], ['port', 'Station', 1], ['exchange', 'Port', 1], ['yards', 'Yards', 1], ['armory', 'Armory', 2]]
  line.forEach(([a, label, state], i) => {
    const cx = rx + 28 + i * 70
    if (i) out += L(cx - 46, ry + 44, cx - 24, ry + 44, { stroke: state === 2 ? BRAND_300 : '#8f7fd0', dash: state === 2 ? '3 3' : '' })
    out += C(cx, ry + 44, 22, { fill: '#1a1331', stroke: state === 2 ? BRAND_300 : '#8f7fd0', sw: 1.5, dash: state === 2 ? '4 3' : '' }) + art(a, cx, ry + 44, 34, state === 2 ? 0.55 : 1)
    out += T(cx, ry + 82, label, { size: 11, fill: state === 2 ? '#c9b6ff' : '#efe7ff', anchor: 'middle' })
  })
  out += T(rx + 28 + 6 * 70, ry + 96, 'in 4h 20m', { size: 10, fill: TEXT_3, anchor: 'middle' })
  out += `<path d="M${rx + 168} ${ry + 66}V${ry + 122}H${rx + 190}" fill="none" stroke="#8f7fd0"/>` + C(rx + 212, ry + 122, 20, { fill: '#1a1331', stroke: '#8f7fd0', sw: 1.5 }) + art('autofactory', rx + 212, ry + 122, 30) + T(rx + 240, ry + 119, 'Autofactory', { size: 12, fill: '#efe7ff' }) + T(rx + 240, ry + 134, '3 of 5 orders running', { size: 10.5, fill: TEXT_3 })
  ry += 162
  out += section(rx, ry, 'PEOPLE AND WHAT THEY MAKE', rw)
  out += T(rx, ry + 30, 'People', { size: 11, fill: '#a99fc6' }) + T(rx + rw, ry + 30, '8,400 of 11,000', { size: 12.5, weight: 700, fill: '#fff', anchor: 'end' }) + bar(rx + 60, ry + 23, rw - 190, 0.76)
  const made = [['WAT', 'Water ice', '46 an hour', 'good-water'], ['ORG', 'Organics', '34 an hour', 'good-organics']]
  made.forEach(([code, name, rate, a], i) => {
    const gx = rx + i * 246
    out += R(gx, ry + 44, 234, 44, { rx: 10, fill: S2 }) + art(a, gx + 24, ry + 66, 26) + T(gx + 46, ry + 62, name, { size: 13, fill: GOODS[code], weight: 700 }) + T(gx + 46, ry + 78, 'in storage 1,240', { size: 10.5, fill: TEXT_3 }) + T(gx + 222, ry + 70, rate, { size: 12, fill: '#e6dcf5', anchor: 'end' })
  })
  out += T(rx, ry + 106, 'Nothing is made while the siege lasts.', { size: 11.5, fill: PINK_LIGHT })
  ry += 132
  out += section(rx, ry, 'DEFENSES, IN THE ORDER HITS LAND', rw)
  const layers = [['orbital-platform', 'Orbital platforms', '2 of 3', 0.66, '1 lost'], ['moon-guns', 'Moon guns', '10 of 12 mounts', 0.83], ['relay', 'Shield', 'level 3 of 5', 0.4, 'regaining'], ['citadel', 'Armor', '14 of 20 plates', 0.7], ['bfg', 'Weapons', '9 of 12 mounts · 40 drones · BFG', 0.75], ['colony', 'Hull', '300', 1]]
  layers.forEach(([a, name, value, frac, warn], i) => {
    const ly = ry + 22 + i * 31
    out += T(rx + 4, ly + 12, String(i + 1), { size: 10, fill: TEXT_3 }) + art(a, rx + 30, ly + 8, 24) + T(rx + 50, ly + 12, name, { size: 12.5, fill: '#efe7ff' })
    out += bar(rx + 178, ly + 4, 150, frac, { fill: warn ? PINK_LIGHT : BRAND_300 }) + T(rx + 340, ly + 12, value, { size: 11.5, fill: warn ? PINK_LIGHT : TEXT_2 })
  })
  ry += 222
  // its actions, as on the small card
  const acts = [[P.art('siege', 1.7), 'Siege', true], [P.art('siege', 1.7), 'Attack', false, true], [P.glyph(GLYPH.market), 'Market'], [P.glyph(GLYPH.person), 'Owner']]
  acts.forEach(([pic, caption, main, dim], i) => {
    const cx = rx + 30 + i * 74
    out += well(cx, ry + 26, 22, { pic: pic(cx, ry + 26), caption, main, dim })
  })
  out += pin(lx - 14, y + 368, '1') + pin(rx - 14, y + 206, '3') + pin(lx - 14, y + 594, '4')

  // ── the profile: a pilot's card
  const px = 944
  const py = 28
  const pw = 468
  const ph = 620
  out += `<path d="M${rx + 440} ${y + 166}C${rx + 490} ${y + 166} ${px - 60} ${py + 150} ${px - 6} ${py + 150}" fill="none" stroke="#c9b6ff" stroke-width="1.5" stroke-dasharray="4 5"/>` + `<path d="M${px - 17} ${py + 143}L${px - 5} ${py + 150}L${px - 17} ${py + 157}" fill="none" stroke="#c9b6ff" stroke-width="1.5"/>`
  out += frame(px, py, pw, ph, THEME.ship)
  const tg = id('ptp')
  defs.push(`<linearGradient id="${tg}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7c39cd"/><stop offset="1" stop-color="#5c1aae"/></linearGradient>`)
  out += R(px + 14, py + 12, pw - 28, 34, { rx: 30, ry: 10, fill: `url(#${tg})` }) + T(px + pw / 2, py + 36, 'Ada Vance', { size: 19, weight: 700, fill: '#fff', anchor: 'middle' })
  out += C(px + 86, py + 124, 52, { fill: '#1a1331', stroke: '#8f7fd0', sw: 1.5 }) + avatar(px + 86, py + 128, 2.5)
  out += T(px + 160, py + 92, 'PILOT', { size: 9.5, weight: 700, fill: '#c9b6ff', spacing: 1.3 })
  out += T(px + 160, py + 116, 'Citizen of Corporation Y', { size: 15, fill: '#fff' }) + T(px + 160, py + 134, 'since 14 November 2140', { size: 11.5, fill: TEXT_3 })
  out += T(px + 160, py + 162, '48,210¢', { size: 20, fill: '#fff' })
  out += R(px + 280, py + 146, 76, 22, { rx: 11, fill: S3 }) + T(px + 318, py + 161, '3rd · planets', { size: 10.5, fill: '#e6cf8f', anchor: 'middle' })
  out += R(px + 362, py + 146, 82, 22, { rx: 11, fill: S3 }) + T(px + 403, py + 161, '7th · credits', { size: 10.5, fill: '#e6cf8f', anchor: 'middle' })
  out += section(px + 28, py + 206, 'HOLDS', pw - 56)
  ;[['4', 'planets', 'planet-colony'], ['3', 'ports', 'port'], ['1', 'asteroid', 'asteroid-station'], ['2', 'stars named', null]].forEach(([n, label, a], i) => {
    const bx = px + 28 + i * 104
    out += R(bx, py + 222, 96, 60, { rx: 10, fill: S2 }) + (a ? art(a, bx + 22, py + 252, 30) : starBody(bx + 22, py + 252, 6, '#ffd2a1')) + T(bx + 44, py + 250, n, { size: 20, fill: '#fff' }) + T(bx + 44, py + 268, label, { size: 10, fill: TEXT_3 })
  })
  out += section(px + 28, py + 310, 'HERE, IN BARNARD\'S STAR', pw - 56)
  const hold = (hy, pic, name, sub) => pic(px + 46, hy + 18) + T(px + 70, hy + 16, name, { size: 13.5, fill: '#c9b6ff', weight: 500 }) + L(px + 70, hy + 20, px + 70 + name.length * 7.4, hy + 20, { stroke: '#c9b6ff', opacity: 0.6 }) + T(px + 70, hy + 33, sub, { size: 10.5, fill: TEXT_3 })
  out += hold(py + 324, (cx, cy) => sphere(cx, cy, 12, PLANET.Oceanic) + C(cx, cy, 16, { stroke: PINK_LIGHT, dash: '4 3', sw: 1.5 }), 'New Ceylon', 'Oceanic · under siege') + hold(py + 366, (cx, cy) => station(cx, cy, 24), 'Port Serendib', 'Station at New Ceylon')
  out += T(px + pw - 28, py + 346, 'elsewhere: Wolf 359 (2), Star 1187 (1)', { size: 10.5, fill: TEXT_3, anchor: 'end' })
  out += section(px + 28, py + 424, 'SHIP', pw - 56)
  out += ship(px + 46, py + 456, 26, 45) + T(px + 70, py + 454, 'Lantern', { size: 13.5, fill: '#fff' }) + T(px + 70, py + 471, 'Orbiter 8 · last seen at Barnard\'s Star', { size: 10.5, fill: TEXT_3 })
  out += T(px + pw - 28, py + 460, '0x7099…79c8', { size: 11, fill: TEXT_3, anchor: 'end', mono: true }) + glyph(px + pw - 122, py + 456, GLYPH.copy, { size: 12 })
  out += section(px + 28, py + 506, 'NOT YET', pw - 56)
  out += notYet(px + 28, py + 522, 200, 46, 'Achievements', null) + notYet(px + 240, py + 522, 200, 46, 'Corporate rank', null)
  out += T(px + 28, py + 594, 'On your own profile: your debt, and your body in cold storage (not yet).', { size: 10.5, fill: TEXT_3 })
  out += pin(px + 20, py + 60, '5')
  // notes
  const nx = 944
  let yy = 690
  out += T(nx, yy, 'Mockup 3 · Details, and a pilot\'s profile', { size: 15, weight: 700, fill: '#fff' })
  yy += 26
  for (const [n, text] of [
    ['1', 'Details is the card, big: same frame, title and colors (pink dashes: under siege). Its station and moons are part of it, and open their own Details.'],
    ['2', 'Names are links. The star selects it; the owner and the attacker open their profiles.'],
    ['3', 'Everything the small card can\'t hold: the building line, people, production, each layer of defense.'],
    ['4', 'What waits for contracts is drawn in its place and switched off, the same way everywhere.'],
    ['5', 'A profile is a pilot\'s card. Simple now, with room for achievements and rank.']
  ]) {
    out += note(nx, yy, n, text, 420)
    yy += Math.ceil(text.length / 68) * 15 + 10
  }
  doc(1440, 960, out, '3-details-and-profile')
}

// ═════════════════════════════════════════════════════════════════════════════
// 4. The phone: home, Minerva's Link, your ships
// ═════════════════════════════════════════════════════════════════════════════
const PW = 390
const PH = 844
function phoneStrip(x, y, line, { lineFill = YELLOW_LIGHT, on = '' } = {}) {
  const g = id('ps')
  defs.push(`<linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7c39cd"/><stop offset="0.2" stop-color="#280b4b"/><stop offset="0.5" stop-color="#5c1aae"/><stop offset="0.8" stop-color="#280b4b"/><stop offset="1" stop-color="#7c39cd"/></linearGradient>`)
  let out = R(x + 8, y + 8, PW - 16, 60, { rx: 12, fill: `url(#${g})` }) + R(x + 11, y + 11, PW - 22, 54, { rx: 9, fill: '#0d0719' })
  out += C(x + 38, y + 38, 20, { fill: '#1a1331', stroke: on === 'minerva' ? '#fff' : BRAND_300, sw: on === 'minerva' ? 2.2 : 1.2 }) + art('minerva-face', x + 38, y + 38, 36) + C(x + 54, y + 52, 4, { fill: GREEN, stroke: '#0d0719', sw: 1.5 })
  out += T(x + 66, y + 34, 'Tester', { size: 15, fill: '#fff' }) + T(x + 66, y + 51, '743¢', { size: 13, fill: '#fff' })
  out += L(x + 150, y + 18, x + 150, y + 58, { stroke: BORDER_STRONG })
  out += ship(x + 172, y + 34, 22, 45) + T(x + 190, y + 33, 'Taconator', { size: 13, fill: '#fff' }) + R(x + 262, y + 23, 22, 12, { rx: 6, fill: YELLOW }) + T(x + 273, y + 32, 'IN', { size: 8, weight: 700, fill: S1, anchor: 'middle' })
  out += holds(x + 190, y + 42, ['HE3', 'HE3', 'HE3', null, null], 8, 3) + T(x + 250, y + 50, 'Cargo 3/5', { size: 10, fill: LAV })
  if (on === 'ships') out += R(x + 154, y + 14, PW - 170, 48, { rx: 8, stroke: '#fff', sw: 1.5 })
  out += glyph(x + PW - 28, y + 38, GLYPH.down, { size: 13 })
  if (line) out += C(x + 20, y + 84, 3.5, { fill: lineFill }) + T(x + 30, y + 88, line, { size: 12, fill: lineFill })
  return out
}
function tabs(x, y, on = '') {
  let out = R(x, y, PW, 74, { fill: '#12052a' }) + L(x, y, x + PW, y, { stroke: BORDER })
  const items = [['you', (cx, cy) => ship(cx, cy, 22, 45), 'My ship'], ['objects', (cx, cy) => objectsIcon(cx, cy, 1.1), 'Objects', '27'], ['map', (cx, cy) => mapIcon(cx, cy, 1.1), 'Map'], ['chat', (cx, cy) => glyph(cx, cy, GLYPH.chat, { stroke: '#fff', size: 22 }), 'Chat', '1'], ['settings', (cx, cy) => glyph(cx, cy, GLYPH.more, { stroke: '#fff', size: 26 }), 'More', '4']]
  items.forEach(([tint, pic, label, badge], i) => {
    const cx = x + 39 + i * 78
    out += rim(cx, y + 30, TINT[tint], pic(cx, y + 30), label, { badge, r: 21, on: on === label })
  })
  return out
}
const bezel = (x, y) => R(x - 5, y - 5, PW + 10, PH + 10, { rx: 30, stroke: '#ffffff33', sw: 2 })
const clipTo = (x, y, inner) => {
  const c = id('pc')
  defs.push(`<clipPath id="${c}"><rect x="${x}" y="${y}" width="${PW}" height="${PH}" rx="26"/></clipPath>`)
  return `<g clip-path="url(#${c})">${inner}</g>`
}
function phoneHome(x, y) {
  let out = G(space(PW, PH, 5), { transform: `translate(${x} ${y})` })
  out += C(x + 250, y + 300, 150, { stroke: '#c3b3da', sw: 3, dash: '2 9', opacity: 0.7 })
  out += sphere(x + 290, y + 262, 44, PLANET.Terrestrial, { earth: true }) + T(x + 290, y + 328, 'Earth', { size: 15, fill: '#ffffff77', anchor: 'middle' })
  out += station(x + 150, y + 360, 40) + ship(x + 122, y + 344, 20, 110) + C(x + 150, y + 360, 52, { stroke: THEME.station.accent, dash: '3 5', opacity: 0.7 })
  out += phoneStrip(x, y, 'Session · 3h 12m left')
  out += T(x + PW - 112, y + 92, 'Sol', { size: 20, fill: '#ffffffdd', anchor: 'end' })
  out += R(x + PW - 104, y + 76, 96, 96, { rx: 8, fill: '#12052a', stroke: '#ffffff33' })
  ;[12, 24, 36, 44].forEach((r) => (out += C(x + PW - 56, y + 124, r, { stroke: '#ffffff22' })))
  out += C(x + PW - 56, y + 124, 3, { fill: '#fff1c4' }) + C(x + PW - 34, y + 124, 2.4, { fill: YELLOW })
  // the selection: the strip, then the small card with its rows of wells beside it
  out += strip(x + 8, y + 438, 3, { compact: true }).svg
  const sy = y + 486
  out += R(x + 8, sy, PW - 16, 276, { rx: 14, fill: '#150f28', stroke: BORDER, opacity: 0.96 })
  // small card: Earth's tab above the station's face
  const cx0 = x + 16
  out += R(cx0, sy + 8, 132, 24, { rx: 10, fill: THEME.earth.base }) + sphere(cx0 + 16, sy + 20, 8, PLANET.Terrestrial, { earth: true }) + T(cx0 + 30, sy + 25, '‹ Earth', { size: 12, weight: 700, fill: S1 })
  out += frame(cx0, sy + 36, 132, 212, THEME.earth)
  out += R(cx0 + 8, sy + 44, 116, 18, { rx: 9, fill: THEME.station.base }) + T(cx0 + 66, sy + 57, 'I.S.S.', { size: 11, weight: 700, fill: S1, anchor: 'middle' })
  out += station(cx0 + 66, sy + 106, 54)
  out += R(cx0 + 8, sy + 150, 116, 88, { rx: 8, fill: '#150f28', stroke: '#00000066' }) + T(cx0 + 16, sy + 165, 'SPACE STATION', { size: 7.5, weight: 700, fill: THEME.station.accent, spacing: 1 })
  out += portCode(cx0 + 16, sy + 184, '-BBBSBSS', 'start', 12, [3])
  out += T(cx0 + 16, sy + 202, 'HE3', { size: 9.5, weight: 700, fill: GOODS.HE3 }) + T(cx0 + 116, sy + 202, '↑ 197¢', { size: 9.5, fill: YELLOW_LIGHT, anchor: 'end' })
  out += T(cx0 + 16, sy + 216, 'ORG', { size: 9.5, weight: 700, fill: GOODS.ORG }) + T(cx0 + 116, sy + 216, '↓ 57¢', { size: 9.5, fill: '#e6dcf5', anchor: 'end' })
  out += T(cx0 + 16, sy + 230, 'Tap to hold it up', { size: 8.5, fill: TEXT_3 })
  // wells beside it: the family row, then the actions
  const wx = x + 160
  out += T(wx + 4, sy + 24, 'IN ORBIT OF EARTH', { size: 8.5, weight: 700, fill: THEME.earth.accent, spacing: 1.1 })
  ;[[P.earth, 'Earth'], [P.station, 'Station', true], [P.moon, 'Luna']].forEach(([pic, caption, on], i) => {
    const cx = wx + 30 + i * 72
    out += well(cx, sy + 60, 23, { pic: pic(cx, sy + 60), caption, on })
  })
  out += L(wx, sy + 104, x + PW - 20, sy + 104, { stroke: BORDER })
  ;[[P.art('port', 1.7), 'Trade', true, '+591¢'], [P.art('yards', 1.7), 'Yards'], [P.art('armory', 1.7), 'Armory']].forEach(([pic, caption, main, sub], i) => {
    const cx = wx + 30 + i * 72
    out += well(cx, sy + 142, 25, { pic: pic(cx, sy + 142), caption, main, sub, subFill: YELLOW_LIGHT })
  })
  out += well(wx + 30, sy + 236, 20, { pic: glyph(wx + 30, sy + 236, GLYPH.details, { size: 20 }), caption: '' }) + T(wx + 58, sy + 241, 'Details', { size: 12.5, fill: '#efe7ff' })
  out += tabs(x, y + PH - 74, 'My ship')
  return clipTo(x, y, out) + bezel(x, y)
}
function phoneMinerva(x, y) {
  let out = G(space(PW, PH, 5, 0.5), { transform: `translate(${x} ${y})` })
  out += phoneStrip(x, y, '', { on: 'minerva' })
  const sy = y + 78
  const sh = PH - 78
  const g = id('ms')
  defs.push(`<linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5c1aae"/><stop offset="0.1" stop-color="#280b4b"/><stop offset="0.5" stop-color="#5c1aae"/><stop offset="0.9" stop-color="#280b4b"/><stop offset="1" stop-color="#5c1aae"/></linearGradient>`)
  out += R(x, sy, PW, sh, { rx: 12, fill: `url(#${g})` }) + R(x + 7, sy + 7, PW - 14, sh - 14, { rx: 6, fill: S1, stroke: '#ffffff22', sw: 2 })
  out += C(x + 54, sy + 54, 34, { fill: '#1a1331', stroke: BRAND_300, sw: 1.5 }) + art('minerva-face', x + 54, sy + 54, 62)
  out += T(x + 100, sy + 48, 'Minerva', { size: 22, fill: '#fff' }) + T(x + 100, sy + 68, 'Your link to the network', { size: 12, fill: LAV })
  out += chips(x + 20, sy + 102, [['Link', { on: true }], ['Waiting', { count: '3' }]])
  ;[['Library', 176, 62], ['News', 244, 46], ['Mail', 296, 42]].forEach(([label, dx, cw]) => (out += R(x + 20 + dx, sy + 102, cw, 30, { rx: 15, stroke: BORDER_STRONG, dash: '4 4' }) + T(x + 20 + dx + cw / 2, sy + 121, label, { size: 11.5, fill: '#efe7ff66', anchor: 'middle' })))
  const lx = x + 22
  const lw = PW - 44
  let ly = sy + 162
  out += section(lx, ly, 'THE NETWORK', lw)
  out += C(lx + 8, ly + 30, 5, { fill: GREEN }) + T(lx + 22, ly + 35, 'Polkadot Hub TestNet', { size: 15, fill: '#fff' }) + T(lx + lw, ly + 35, 'in contact', { size: 12, fill: GREEN, anchor: 'end' })
  out += T(lx, ly + 58, 'Block', { size: 11, fill: '#a99fc6' }) + T(lx + lw, ly + 58, '2,481,337 · 4 s ago', { size: 13, fill: '#fff', anchor: 'end', weight: 700 })
  ly += 84
  out += section(lx, ly, 'YOUR ACCOUNT', lw)
  out += T(lx, ly + 32, '0x7099…79c8', { size: 15, fill: '#fff', mono: true }) + R(lx + lw - 70, ly + 16, 70, 26, { rx: 13, fill: '#2a1f4c', stroke: '#4a3d7a' }) + T(lx + lw - 35, ly + 33.5, 'Copy', { size: 12, fill: '#efe7ff', anchor: 'middle' })
  const bal = (bx, label, value, off) => (off ? R(bx, ly + 52, 108, 50, { rx: 10, stroke: BORDER_STRONG, dash: '4 4' }) : R(bx, ly + 52, 108, 50, { rx: 10, fill: S2 })) + T(bx + 12, ly + 70, label, { size: 10.5, fill: off ? '#efe7ff66' : '#a99fc6' }) + T(bx + 12, ly + 91, value, { size: off ? 11 : 16, fill: off ? TEXT_3 : '#fff' })
  out += bal(lx, 'PAS · for gas', '4.82') + bal(lx + 119, 'Credits', '743¢') + bal(lx + 238, 'PGAS', 'Not yet', true)
  ly += 128
  out += section(lx, ly, 'HOW YOU\'RE SIGNING', lw)
  out += R(lx, ly + 18, lw, 124, { rx: 12, fill: '#150f28', stroke: YELLOW_LIGHT + '66' })
  out += glyph(lx + 24, ly + 44, GLYPH.key, { size: 22, stroke: YELLOW_LIGHT }) + T(lx + 46, ly + 42, 'A session', { size: 15, fill: '#fff', weight: 700 }) + T(lx + 46, ly + 58, 'Game moves go through without asking.', { size: 11.5, fill: LAV })
  out += T(lx + 14, ly + 84, 'Time left', { size: 11, fill: '#a99fc6' }) + bar(lx + 82, ly + 76, lw - 190, 0.8, { fill: YELLOW_LIGHT }) + T(lx + lw - 14, ly + 84, '3h 12m of 4h', { size: 12, fill: YELLOW_LIGHT, anchor: 'end' })
  out += T(lx + 14, ly + 106, 'Gas left', { size: 11, fill: '#a99fc6' }) + bar(lx + 82, ly + 98, lw - 190, 0.7) + T(lx + lw - 14, ly + 106, '0.14 PAS', { size: 12, fill: '#fff', anchor: 'end' })
  out += T(lx + 14, ly + 130, 'Leftover gas comes back when it ends.', { size: 10.5, fill: TEXT_3 })
  out += pill(lx, ly + 154, lw, 'End Session', { h: 44 })
  out += T(lx, ly + 220, 'Without one, every move asks your phone.', { size: 11.5, fill: TEXT_3 })
  out += notYet(lx, ly + 232, lw, 42, 'AutoSigning', null, 'Not yet: the Polkadot App doesn\'t offer it')
  out += R(x + 120, y + PH - 52, 150, 38, { rx: 10, fill: S3, stroke: '#ffffff44' }) + glyph(x + 195, y + PH - 33, GLYPH.down, { size: 18, stroke: '#fff' })
  return clipTo(x, y, out) + bezel(x, y)
}
function phoneShips(x, y) {
  let out = G(space(PW, PH, 5, 0.5), { transform: `translate(${x} ${y})` })
  out += phoneStrip(x, y, '', { on: 'ships' })
  const sy = y + 270
  const sh = PH - 270
  const g = id('ss')
  defs.push(`<linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5c1aae"/><stop offset="0.1" stop-color="#280b4b"/><stop offset="0.5" stop-color="#5c1aae"/><stop offset="0.9" stop-color="#280b4b"/><stop offset="1" stop-color="#5c1aae"/></linearGradient>`)
  out += R(x, sy, PW, sh, { rx: 12, fill: `url(#${g})` }) + R(x + 7, sy + 7, PW - 14, sh - 14, { rx: 6, fill: S1, stroke: '#ffffff22', sw: 2 })
  out += art('fleet', x + 48, sy + 48, 50) + T(x + 86, sy + 44, 'Your ships', { size: 22, fill: '#fff' }) + T(x + 86, sy + 63, 'One mind, one ship at a time', { size: 12, fill: LAV })
  const lx = x + 20
  const lw = PW - 40
  // the ship you're in
  let ry = sy + 92
  out += R(lx, ry, lw, 132, { rx: 12, fill: '#150f28', stroke: YELLOW_LIGHT, sw: 1.8 })
  out += ship(lx + 36, ry + 40, 40, 45) + T(lx + 70, ry + 34, 'Taconator', { size: 17, fill: '#fff', weight: 700 }) + T(lx + 70, ry + 52, 'Orbiter 8 · range 1', { size: 11.5, fill: TEXT_3 })
  out += R(lx + lw - 106, ry + 18, 92, 24, { rx: 12, fill: YELLOW }) + T(lx + lw - 60, ry + 34.5, 'You\'re here', { size: 11.5, weight: 700, fill: S1, anchor: 'middle' })
  const fact = (fx, label, value, fill = '#fff') => T(fx, ry + 82, label, { size: 10, fill: '#a99fc6' }) + T(fx, ry + 100, value, { size: 13, fill, weight: 700 })
  out += fact(lx + 16, 'Where', 'Sol · the belt') + fact(lx + 136, 'Doing', 'Mining 1/2', YELLOW_LIGHT) + fact(lx + 244, 'Signal', 'Full')
  out += holds(lx + 16, ry + 112, ['HE3', 'HE3', 'HE3', null, null], 9, 3) + T(lx + 84, ry + 121, 'Cargo 3/5', { size: 10.5, fill: LAV })
  // a second ship, as it will look, switched off
  ry += 144
  out += R(lx, ry, lw, 132, { rx: 12, stroke: BORDER_STRONG, dash: '5 5' })
  out += ship(lx + 36, ry + 40, 40, 45, '#ffffff', 0.25) + T(lx + 70, ry + 34, 'A second ship', { size: 17, fill: '#efe7ff77', weight: 700 }) + T(lx + 70, ry + 52, 'Not yet', { size: 11.5, fill: TEXT_3 })
  out += T(lx + 16, ry + 82, 'Where', { size: 10, fill: '#a99fc655' }) + T(lx + 136, ry + 82, 'On autopilot', { size: 10, fill: '#a99fc655' }) + T(lx + 244, ry + 82, 'Signal', { size: 10, fill: '#a99fc655' })
  out += T(lx + 16, ry + 100, 'Wolf 359', { size: 13, fill: '#efe7ff44', weight: 700 }) + T(lx + 136, ry + 100, 'Holding a siege', { size: 13, fill: '#efe7ff44', weight: 700 }) + T(lx + 244, ry + 100, '2 relays', { size: 13, fill: '#efe7ff44', weight: 700 })
  out += pill(lx, ry + 144, lw, 'Take Control', { off: true, h: 44 })
  out += T(lx + lw / 2, ry + 208, 'More ships come from orbital autofactories.', { size: 11.5, fill: TEXT_3, anchor: 'middle' })
  out += R(x + 120, y + PH - 52, 150, 38, { rx: 10, fill: S3, stroke: '#ffffff44' }) + glyph(x + 195, y + PH - 33, GLYPH.down, { size: 18, stroke: '#fff' })
  return clipTo(x, y, out) + bezel(x, y)
}
function mock4() {
  const W = 1440
  const H = 1010
  let out = R(0, 0, W, H, { fill: '#0b0916' })
  const xs = [60, 525, 990]
  const top = 110
  out += T(60, 44, 'Mockup 4 · the phone', { size: 15, weight: 700, fill: '#fff' })
  const heads = [
    ['Home, a station selected', 'Minerva\'s face leads the top strip. Objects and Map are tabs. The family row and the actions sit beside the small card as big wells; the station shows under Earth\'s tab.'],
    ['Minerva › Link', 'Your connection in one place: the network and block, your account and what it holds, and how you\'re signing. Start and End Session live here now, not on the ship.'],
    ['Your ships', 'Opened from the ship half of the top strip. The ship you\'re in is always marked in yellow. The second ship and Take Control are drawn and switched off until pilots can own two.']
  ]
  heads.forEach(([title, text], i) => {
    out += T(xs[i], 72, title, { size: 14, weight: 700, fill: '#c9b6ff' })
    const words = text.split(' ')
    let line = ''
    let n = 0
    for (const word of words) {
      if ((line + ' ' + word).length > 66) {
        out += T(xs[i], 90 + n * 14, line.trim(), { size: 11, fill: '#ffffffaa' })
        n++
        line = word
      } else line += ' ' + word
    }
    out += T(xs[i], 90 + n * 14, line.trim(), { size: 11, fill: '#ffffffaa' })
  })
  out += phoneHome(xs[0], top + 30) + phoneMinerva(xs[1], top + 30) + phoneShips(xs[2], top + 30)
  doc(W, H, out, '4-phone')
}

mock1()
mock2()
mock3()
mock4()

// ── PNGs, with Chrome ────────────────────────────────────────────────────────
if (process.argv.includes('--png')) {
  const { default: puppeteer } = await import('puppeteer-core')
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', args: ['--no-sandbox'] })
  const page = await browser.newPage()
  for (const file of fs.readdirSync(OUT).filter((f) => f.endsWith('.svg'))) {
    const svg = fs.readFileSync(path.join(OUT, file), 'utf8')
    const [, w, h] = svg.match(/viewBox="0 0 (\d+) (\d+)"/)
    await page.setViewport({ width: Number(w), height: Number(h), deviceScaleFactor: 1 })
    await page.setContent(`<body style="margin:0;background:#0b0916">${svg}</body>`)
    await page.screenshot({ path: path.join(OUT, file.replace('.svg', '.png')) })
    console.log('wrote', file.replace('.svg', '.png'))
  }
  await browser.close()
}
