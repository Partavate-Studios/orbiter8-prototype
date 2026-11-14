// Draws docs/mockups/color-choices.svg: every color choice made lately or under consideration, one row
// each, with the game as it is now on the left and the proposed options to its right. Cells are labeled
// (A1 · Now, A1 · 1, A1 · 2…) so Koda can answer row by row. Colors come from libs/palette.js and
// libs/card-theme.js, so "Now" is the game's own; the options are written here.
//   npx vite-node dev/mockups/color-choices.mjs        (from orbiter-client/; vite-node resolves the client's imports)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { YELLOW, YELLOW_LIGHT, PINK, PINK_LIGHT, PLANET_COLORS, STAR_CLASSES, HUD_TINT, CARD_GRAY } from '../../src/libs/palette.js'
import { shades, CARD_THEMES } from '../../src/libs/card-theme.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(here, '../../../docs/mockups/color-choices.svg')

const LABEL_W = 330
const COL_W = 360
const COLS = 4 // Now + up to three options
const W = LABEL_W + COL_W * COLS + 40
const SPACE = '#160631'
const PANEL = '#21103d'
const LAV = '#c3b3da'
const FONT = "font-family=\"Ubuntu, 'Segoe UI', sans-serif\""

let defs = []
let uid = 0
const id = (p) => `${p}${++uid}`
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
const text = (x, y, s, { size = 13, fill = '#ffffff', anchor = 'start', weight = 400, opacity = 1 } = {}) =>
  `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" text-anchor="${anchor}" font-weight="${weight}" opacity="${opacity}">${esc(s)}</text>`
const wrap = (x, y, s, width, opts = {}) => {
  const size = opts.size ?? 12
  const per = Math.floor(width / (size * 0.52))
  const lines = []
  let line = ''
  for (const word of s.split(' ')) {
    if ((line + ' ' + word).trim().length > per) {
      lines.push(line.trim())
      line = word
    } else line += ' ' + word
  }
  if (line.trim()) lines.push(line.trim())
  return lines.map((l, i) => text(x, y + i * (size + 4), l, opts)).join('')
}

// ── drawing helpers ─────────────────────────────────────────────────────────
function sphere(cx, cy, r, light, mid, dark) {
  const g = id('sph')
  defs.push(`<radialGradient id="${g}" cx="0.35" cy="0.32" r="0.75"><stop offset="0" stop-color="${light}"/><stop offset="0.5" stop-color="${mid}"/><stop offset="1" stop-color="${dark}"/></radialGradient>`)
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${g})"/>`
}
function star(cx, cy, r, core, mid, glow) {
  const g = id('glow')
  const b = id('body')
  defs.push(`<radialGradient id="${g}"><stop offset="0" stop-color="${glow}" stop-opacity="0.55"/><stop offset="1" stop-color="${glow}" stop-opacity="0"/></radialGradient>`)
  defs.push(`<radialGradient id="${b}"><stop offset="0" stop-color="${core}"/><stop offset="0.6" stop-color="${mid}"/><stop offset="1" stop-color="${mid}"/></radialGradient>`)
  return `<circle cx="${cx}" cy="${cy}" r="${r * 2.6}" fill="url(#${g})"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${b})"/>`
}
const box = (x, y, w, h, fill, stroke = '#ffffff44', rx = 6, sw = 1) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`
const hexPath = (cx, cy, r) =>
  'M' + [0, 1, 2, 3, 4, 5].map((i) => {
    const a = (Math.PI / 3) * i + Math.PI / 6
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`
  }).join('L') + 'Z'

// A small card: one background, frame and title in a theme (libs/card-theme.js).
function card(x, y, w, h, theme, title, { bg = CARD_GRAY, swatch = null, badge = false, siege = false, mine = false } = {}) {
  let s = box(x, y, w, h, bg, theme.base, 10, 2.5)
  s += `<rect x="${x + 8}" y="${y + 8}" width="${w - 16}" height="24" rx="12" fill="${theme.mid}" stroke="${theme.stroke}"/>`
  s += text(x + w / 2, y + 25, title, { size: 13, anchor: 'middle', weight: 600 })
  if (swatch) s += `<circle cx="${x + 22}" cy="${y + 20}" r="7" fill="${swatch}" stroke="#ffffff66"/>`
  if (mine) s += text(x + w / 2, y + 52, 'Mine', { size: 11, anchor: 'middle', fill: YELLOW })
  if (badge) s += `<g transform="translate(${x + w - 2} ${y + 2})"><circle r="10" fill="${YELLOW}"/><text y="4" font-size="11" text-anchor="middle" fill="#1a1a1a" font-weight="700">★</text></g>`
  if (siege) s += `<rect x="${x - 5}" y="${y - 5}" width="${w + 10}" height="${h + 10}" rx="13" fill="none" stroke="${PINK}" stroke-width="2.5" stroke-dasharray="7 5"/>`
  for (let i = 0; i < 2; i++) s += `<rect x="${x + 14}" y="${y + h - 62 + i * 26}" width="${w - 28}" height="20" rx="10" fill="#5c1aae" stroke="#5b1aaa"/>`
  return s
}

// ── the rows ────────────────────────────────────────────────────────────────
// Each row: id, title, note, and cells [{ label, caption, draw(x, y, w, h) }]; the first cell is Now.
const GOODS = ['Water ice', 'Metals', 'Rare elements', 'Helium-3', 'Organics', 'Silicon', 'Equipment', 'Electronics']
const CODES = ['WTR', 'MTL', 'RAR', 'HE3', 'ORG', 'SIL', 'EQP', 'ELC']
const GOODS_P1 = ['#7FDDF0', '#A9B3C1', '#D9E1EC', '#6F8CFF', '#74CF84', '#7A90A6', '#E08A4F', '#3CC7A8']
const GOODS_P2 = ['#8fc9d6', '#a3a8b4', '#d3d6e0', '#8a9bd6', '#8cbf93', '#7d8a99', '#c9926a', '#6fb5a5']

function goodsList(x, y, colors) {
  return GOODS.map((g, i) => {
    const gy = y + 14 + i * 24
    const chip = colors ? `<rect x="${x}" y="${gy - 11}" width="14" height="14" rx="3" fill="${colors[i]}"/>` : `<rect x="${x}" y="${gy - 11}" width="14" height="14" rx="3" fill="none" stroke="#ffffff66"/>`
    return chip + text(x + 22, gy, CODES[i], { size: 12, fill: colors ? colors[i] : '#ffffffcc', weight: 700 }) + text(x + 62, gy, g, { size: 12, fill: '#ffffffcc' })
  }).join('')
}
const HUD_ORDER = ['you', 'help', 'sieges', 'leaderboard', 'chat', 'settings', 'planets', 'ships']
function hudRow(x, y, tints, w) {
  const step = Math.min(42, (w - 10) / HUD_ORDER.length)
  return HUD_ORDER.map((k, i) => {
    const cx = x + 18 + i * step
    return `<circle cx="${cx}" cy="${y}" r="15" fill="${tints[k]}" fill-opacity="0.35" stroke="${tints[k]}" stroke-width="2"/>` + text(cx, y + 30, k, { size: 9, anchor: 'middle', fill: '#ffffffaa' })
  }).join('')
}

function tradeMock(x, y, w, opt) {
  // opt: 'now' | 'p1' | 'p2'
  const rw = w - 40
  let s = ''
  const readout = opt === 'now' ? '#3d1273' : opt === 'p1' ? '#2f2939' : 'none'
  const rStroke = opt === 'p2' ? 'none' : '#ffffff44'
  s += box(x + 20, y, rw, 30, readout, rStroke)
  s += text(x + 20 + rw / 2, y + 20, 'Gain: ↑ 720¢', { size: 14, anchor: 'middle', fill: opt === 'now' ? '#ffffff' : YELLOW_LIGHT, weight: 600 })
  s += box(x + 20, y + 38, rw, 30, readout, rStroke)
  s += text(x + 20 + rw / 2, y + 58, 'Pay: ↓ 242¢', { size: 14, anchor: 'middle', fill: '#ffffff' })
  const insuff = opt === 'now' ? box(x + 20, y + 76, rw, 30, '#280b4b') : box(x + 20, y + 76, rw, 30, opt === 'p1' ? '#2f2939' : 'none', PINK_LIGHT, 6, 1.5)
  s += insuff + text(x + 20 + rw / 2, y + 96, 'Insufficient Funds', { size: 14, anchor: 'middle', fill: opt === 'now' ? '#ffffff' : PINK_LIGHT })
  const main = opt === 'now' ? box(x + 20, y + 116, rw, 34, '#5D1EB0') : box(x + 20, y + 116, rw, 34, '#7c39cd', '#c3b3da', 8, 2)
  s += main + text(x + 20 + rw / 2, y + 138, 'Make Trade', { size: 15, anchor: 'middle', weight: 700 })
  return s
}

const rows = [
  { section: 'A. The two accents' },
  {
    id: 'A1',
    title: 'Pink text on a card',
    note: 'Pink #e1177c is 3.5:1 on the card gray as text; small text needs 4.5:1.',
    h: 120,
    cells: [
      { caption: 'PINK #e1177c', draw: (x, y, w) => box(x + 20, y + 10, w - 40, 60, CARD_GRAY, '#ffffff22') + text(x + w / 2, y + 47, 'Insufficient Funds · 1,200¢ short', { size: 14, anchor: 'middle', fill: PINK }) },
      { caption: 'PINK_LIGHT #ff6fb0 for text (pink stays for frames)', draw: (x, y, w) => box(x + 20, y + 10, w - 40, 60, CARD_GRAY, '#ffffff22') + text(x + w / 2, y + 47, 'Insufficient Funds · 1,200¢ short', { size: 14, anchor: 'middle', fill: PINK_LIGHT }) }
    ]
  },
  {
    id: 'A2',
    title: 'The leaderboard button',
    note: 'The one yellow-ish interface color that isn’t "yours" (gold, 42°). Yours is lime (72°).',
    h: 120,
    cells: [
      { caption: 'gold #ffc94d', draw: (x, y) => trophy(x, y, HUD_TINT.leaderboard) },
      { caption: 'keep the gold', draw: (x, y) => trophy(x, y, HUD_TINT.leaderboard) },
      { caption: 'silver #d8d2e8 (a platinum trophy)', draw: (x, y) => trophy(x, y, '#d8d2e8') },
      { caption: 'soft gold #e6cf8f (less saturated)', draw: (x, y) => trophy(x, y, '#e6cf8f') }
    ]
  },
  { section: 'B. Surfaces' },
  {
    id: 'B1',
    title: 'Layers inside a card or menu',
    note: 'Background, readouts (balances, cargo tiles), hover. Today readouts are purple boxes on the gray.',
    h: 130,
    cells: [
      { caption: 'gray card, purple readouts #2e0d56 / #3E1475', draw: (x, y, w) => layers(x, y, w, [CARD_GRAY, '#2e0d56', '#3E1475']) },
      { caption: 'gray steps #25202f / #2f2939 / #3a3346', draw: (x, y, w) => layers(x, y, w, [CARD_GRAY, '#2f2939', '#3a3346']) },
      { caption: 'the proposal’s purple steps #1B1531 / #251D40 / #302651', draw: (x, y, w) => layers(x, y, w, ['#1B1531', '#251D40', '#302651']) }
    ]
  },
  {
    id: 'B2',
    title: 'Small labels on purple',
    note: 'The port table’s heading and "↓ sells ↑ buys": translucent white on saturated purple reads poorly.',
    h: 100,
    cells: [
      { caption: '#ffffff66 on #2e0d56', draw: (x, y, w) => box(x + 20, y + 10, w - 40, 50, '#2e0d56') + text(x + 40, y + 40, 'Port of Trade', { fill: '#ffffff88', size: 14 }) + text(x + 145, y + 40, '· ↓ sells ↑ buys', { fill: '#ffffff66', size: 11 }) },
      { caption: 'lavender #c3b3da, same purple', draw: (x, y, w) => box(x + 20, y + 10, w - 40, 50, '#2e0d56') + text(x + 40, y + 40, 'Port of Trade', { fill: '#e6dcf5', size: 14 }) + text(x + 145, y + 40, '· ↓ sells ↑ buys', { fill: LAV, size: 11 }) },
      { caption: 'lavender on the quiet gray', draw: (x, y, w) => box(x + 20, y + 10, w - 40, 50, '#2f2939') + text(x + 40, y + 40, 'Port of Trade', { fill: '#e6dcf5', size: 14 }) + text(x + 145, y + 40, '· ↓ sells ↑ buys', { fill: LAV, size: 11 }) }
    ]
  },
  { section: 'C. The trade menu' },
  {
    id: 'C1',
    title: 'Readouts and the main action',
    note: 'Gains yellow, costs plain, can’t-afford pink, Make Trade the strongest thing. Today all white on purple.',
    h: 190,
    cells: [
      { caption: 'all white; Make Trade #5D1EB0', draw: (x, y, w) => tradeMock(x, y + 10, w, 'now') },
      { caption: 'gray readouts, yellow gain, pink outline, brighter Make Trade', draw: (x, y, w) => tradeMock(x, y + 10, w, 'p1') },
      { caption: 'as 1, readouts as plain text (no boxes)', draw: (x, y, w) => tradeMock(x, y + 10, w, 'p2') }
    ]
  },
  { section: 'D. Goods (not built)' },
  {
    id: 'D1',
    title: 'A color per good',
    note: 'With its icon, everywhere a good shows. Never buy/sell or profit. Today goods have no color.',
    h: 230,
    cells: [
      { caption: 'no color (codes and names)', draw: (x, y) => goodsList(x + 30, y + 10, null) },
      { caption: 'the proposal’s material tones', draw: (x, y) => goodsList(x + 30, y + 10, GOODS_P1) },
      { caption: 'muted further, to stay clear of the HUD tints', draw: (x, y) => goodsList(x + 30, y + 10, GOODS_P2) }
    ]
  },
  {
    id: 'D2',
    title: 'The HUD buttons, beside them',
    note: 'Close hues: help ~ water ice, chat ~ electronics, planets ~ Helium-3, sieges ~ equipment. Koda likes the HUD.',
    h: 100,
    cells: [
      { caption: 'HUD_TINT as built', draw: (x, y, w) => hudRow(x + 10, y + 30, HUD_TINT, w) },
      { caption: 'keep (goods move instead: D1 · 2)', draw: (x, y, w) => hudRow(x + 10, y + 30, HUD_TINT, w) }
    ]
  },
  { section: 'E. Planets and stars (world)' },
  {
    id: 'E1',
    title: 'Planets by class',
    note: 'Koda likes today’s. Option 1 is the proposal’s table (from the old contracts’ notes), shown for comparison.',
    h: 160,
    cells: [
      { caption: 'PLANET_COLORS', draw: (x, y, w) => planets(x, y, w, PLANET_COLORS.map((c) => [c.light, c.mid, c.dark])) },
      { caption: 'the proposal’s base / shade / highlight', draw: (x, y, w) => planets(x, y, w, PROPOSAL_PLANETS) }
    ]
  },
  {
    id: 'E2',
    title: 'Mars',
    note: 'Sol’s Mars is Rocky in the contracts, so it’s gray. Ferrous would be red, but changes what its port trades.',
    h: 120,
    cells: [
      { caption: 'Rocky (gray)', draw: (x, y, w) => sphere(x + w / 2, y + 55, 38, ...rgb(1)) + text(x + w / 2, y + 112, 'Mars · Rocky', { anchor: 'middle', size: 11, fill: '#ffffffaa' }) },
      { caption: 'Ferrous (rust red)', draw: (x, y, w) => sphere(x + w / 2, y + 55, 38, ...rgb(7)) + text(x + w / 2, y + 112, 'Mars · Ferrous', { anchor: 'middle', size: 11, fill: '#ffffffaa' }) }
    ]
  },
  {
    id: 'E3',
    title: 'Stars by spectral class',
    note: 'O B A F G K M. Option 1 is the proposal’s paler tints, which keep G further from any yellow.',
    h: 120,
    cells: [
      { caption: 'STAR_CLASSES (core, body, glow)', draw: (x, y, w) => stars(x, y, w, Object.values(STAR_CLASSES).map((c) => [c.core, c.mid, c.glow])) },
      { caption: 'the proposal’s pale tints', draw: (x, y, w) => stars(x, y, w, ['#9DB4FF', '#AABFFF', '#CAD7FF', '#F8F7FF', '#FFF1C4', '#FFD2A1', '#FFB08A'].map((t) => ['#ffffff', t, t])) }
    ]
  },
  { section: 'F. Cards' },
  {
    id: 'F1',
    title: 'A yellow (G) star’s card',
    note: 'Could its gold frame read as "yours"? Probably not with yours lime; the fallback is a neutral frame and a swatch.',
    h: 190,
    cells: [
      { caption: 'frame in the star’s glow', draw: (x, y, w) => card(x + (w - 170) / 2, y + 10, 170, 170, CARD_THEMES['star-G'], 'Alpha Centauri A') },
      { caption: 'neutral frame, star swatch', draw: (x, y, w) => card(x + (w - 170) / 2, y + 10, 170, 170, shades('#8a80a3'), 'Alpha Centauri A', { swatch: STAR_CLASSES.G.mid }) }
    ]
  },
  {
    id: 'F2',
    title: 'A planet that’s yours, under siege',
    note: 'Yours is a mark, never the frame; attention is the pink frame; both can show at once.',
    h: 200,
    cells: [
      { caption: '"Mine" in lime, pink siege frame', draw: (x, y, w) => card(x + (w - 170) / 2, y + 15, 170, 170, CARD_THEMES['planet-0'], 'New Avalon', { mine: true, siege: true }) },
      { caption: '+ a yellow badge in the corner', draw: (x, y, w) => card(x + (w - 170) / 2, y + 15, 170, 170, CARD_THEMES['planet-0'], 'New Avalon', { mine: true, siege: true, badge: true }) }
    ]
  },
  { section: 'G. Galaxy map and focus' },
  {
    id: 'G1',
    title: 'Selected, yours, under attack',
    note: 'Each mark has its own place so all three can show on one hex.',
    h: 160,
    cells: [
      { caption: 'selected: white name and ring; yours: lime hex', draw: (x, y, w) => mapHex(x + w / 2, y + 75, 'now') },
      { caption: 'purple outer glow + pointer; lime outline; pink inner frame', draw: (x, y, w) => mapHex(x + w / 2, y + 75, 'p1') }
    ]
  },
  {
    id: 'G2',
    title: 'Keyboard and gamepad focus',
    note: 'What has focus must be plain from across the room.',
    h: 100,
    cells: [
      { caption: 'browser default (varies)', draw: (x, y, w) => box(x + (w - 180) / 2, y + 25, 180, 40, '#5c1aae', '#5b1aaa', 20) + text(x + w / 2, y + 50, 'Ship Loadout', { anchor: 'middle', weight: 700 }) + `<rect x="${x + (w - 180) / 2 - 2}" y="${y + 23}" width="184" height="44" rx="22" fill="none" stroke="#4d90fe" stroke-width="1" stroke-dasharray="2 2"/>` },
      { caption: 'a 2px lavender ring, 3px out', draw: (x, y, w) => box(x + (w - 180) / 2, y + 25, 180, 40, '#5c1aae', '#5b1aaa', 20) + text(x + w / 2, y + 50, 'Ship Loadout', { anchor: 'middle', weight: 700 }) + `<rect x="${x + (w - 180) / 2 - 4}" y="${y + 21}" width="188" height="48" rx="24" fill="none" stroke="#b9a0ff" stroke-width="2.5"/>` }
    ]
  }
]

// ── row helpers that need the data above ────────────────────────────────────
function trophy(x, y, tint) {
  const cx = x + 60
  return `<circle cx="${cx}" cy="${y + 50}" r="30" fill="${tint}" fill-opacity="0.35" stroke="${tint}" stroke-width="2.5"/>` +
    `<path d="M${cx - 11},${y + 38} h22 v8 a11,11 0 0 1 -22,0 z M${cx - 3},${y + 57} h6 v6 h5 v4 h-16 v-4 h5 z" fill="#ffffff"/>` +
    text(cx + 50, y + 55, 'Leaderboard', { size: 13, fill: tint })
}
function layers(x, y, w, [a, b, c]) {
  return box(x + 15, y + 8, w - 30, 100, a, '#ffffff22', 10) +
    box(x + 30, y + 22, w - 60, 30, b, '#ffffff22') + text(x + 44, y + 42, 'Balance 12,400¢', { size: 12, fill: '#ffffffdd' }) +
    box(x + 30, y + 60, w - 60, 30, c, '#ffffff33') + text(x + 44, y + 80, 'hovered row', { size: 12, fill: '#ffffffdd' })
}
const PROPOSAL_PLANETS = [
  ['#4FB37A', '#2E6FD1', '#1F4E9A'], ['#B5AFC2', '#8A8496', '#615B70'], ['#2A9FD6', '#1E5FB8', '#16407E'], ['#F2D29B', '#D9A35B', '#A8713A'], ['#FFFFFF', '#DDEBF7', '#A9C9E8'],
  ['#FF7A3D', '#3A3036', '#241D22'], ['#F2C98A', '#E9A6C6', '#B58CD9'], ['#C9824F', '#A8553A', '#6E3F33'], ['#FFC15A', '#FF6A2B', '#C8261E'], ['#6FA83E', '#2F7D5B', '#1F5A43']
]
const NAMES = ['Terrestrial', 'Rocky', 'Oceanic', 'Desert', 'Ice', 'Volcanic', 'Gaseous', 'Ferrous', 'Lava', 'Swamp']
const rgb = (i) => [PLANET_COLORS[i].light, PLANET_COLORS[i].mid, PLANET_COLORS[i].dark]
function planets(x, y, w, sets) {
  const step = (w - 20) / 5
  return sets.map(([l, m, d], i) => {
    const cx = x + 10 + step * (i % 5) + step / 2
    const cy = y + 32 + Math.floor(i / 5) * 66
    return sphere(cx, cy, 20, l, m, d) + text(cx, cy + 32, NAMES[i], { size: 9, anchor: 'middle', fill: '#ffffffaa' })
  }).join('')
}
function stars(x, y, w, sets) {
  const step = (w - 20) / 7
  return sets.map(([c, m, g], i) => {
    const cx = x + 10 + step * i + step / 2
    return star(cx, y + 50, 10, c, m, g) + text(cx, y + 95, 'OBAFGKM'[i], { size: 12, anchor: 'middle', fill: '#ffffffcc', weight: 700 })
  }).join('')
}
function mapHex(cx, cy, opt) {
  let s = ''
  if (opt === 'p1') {
    const g = id('sel')
    defs.push(`<filter id="${g}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>`)
    s += `<path d="${hexPath(cx, cy, 64)}" fill="none" stroke="#8b5cf6" stroke-width="8" opacity="0.8" filter="url(#${g})"/>`
    s += `<path d="${hexPath(cx, cy, 64)}" fill="none" stroke="#b9a0ff" stroke-width="2.5"/>`
    s += `<path d="M${cx},${cy - 78} l-8,-12 h16 z" fill="#b9a0ff"/>`
  }
  s += `<path d="${hexPath(cx, cy, 56)}" fill="${YELLOW_LIGHT}" fill-opacity="0.07" stroke="${YELLOW_LIGHT}" stroke-opacity="0.75" stroke-width="1.6"/>`
  if (opt === 'p1') s += `<path d="${hexPath(cx, cy, 46)}" fill="none" stroke="${PINK_LIGHT}" stroke-width="2" stroke-dasharray="5 4"/>`
  s += star(cx, cy - 4, 9, ...Object.values(STAR_CLASSES.K).slice(1))
  if (opt === 'now') s += `<circle cx="${cx}" cy="${cy - 4}" r="16" fill="none" stroke="#ffffff" stroke-width="1.6"/>`
  s += text(cx, cy + 26, 'Wolf 359', { size: 11, anchor: 'middle', fill: '#ffffff' })
  s += `<circle cx="${cx - 8}" cy="${cy - 22}" r="2.6" fill="${YELLOW_LIGHT}"/><circle cx="${cx + 8}" cy="${cy - 22}" r="2.6" fill="${YELLOW_LIGHT}"/>`
  return s
}

// ── layout ──────────────────────────────────────────────────────────────────
let y = 150
let body = ''
for (const row of rows) {
  if (row.section) {
    body += text(30, y + 26, row.section, { size: 20, weight: 700, fill: LAV })
    body += `<line x1="30" x2="${W - 30}" y1="${y + 36}" y2="${y + 36}" stroke="${LAV}" stroke-opacity="0.3"/>`
    y += 52
    continue
  }
  const h = row.h + 44
  body += text(30, y + 26, row.id, { size: 22, weight: 700, fill: YELLOW_LIGHT })
  body += text(76, y + 26, row.title, { size: 15, weight: 600 })
  body += wrap(30, y + 50, row.note, LABEL_W - 50, { size: 11.5, fill: '#ffffffaa' })
  row.cells.forEach((cell, i) => {
    const x = LABEL_W + i * COL_W
    const label = i === 0 ? `${row.id} · Now` : `${row.id} · ${i}`
    body += box(x + 6, y + 4, COL_W - 12, h - 8, i === 0 ? '#1c0b35' : PANEL, i === 0 ? '#ffffff22' : '#c3b3da55', 10)
    body += text(x + 18, y + 24, label, { size: 13, weight: 700, fill: i === 0 ? '#ffffff' : YELLOW_LIGHT })
    body += wrap(x + 18, y + 40, cell.caption, COL_W - 40, { size: 10.5, fill: '#ffffffaa' })
    const capLines = Math.ceil(cell.caption.length / Math.floor((COL_W - 40) / (10.5 * 0.52)))
    body += `<g>${cell.draw(x + 6, y + 30 + capLines * 14, COL_W - 12, row.h)}</g>`
  })
  y += h + 10
}
const H = y + 40
const header =
  text(30, 52, 'Orbiter 8 · color choices to review', { size: 30, weight: 700 }) +
  text(30, 82, 'Left: the game now. Right: the options. Answer by label, e.g. "A2 · 2" or "D1 · Now". Cells are sketches of the game’s screens in its exact colors (libs/palette.js); drawn by orbiter-client/dev/mockups/color-choices.mjs.', { size: 13, fill: '#ffffffaa' }) +
  ['Now', 'Option 1', 'Option 2', 'Option 3'].map((c, i) => text(LABEL_W + i * COL_W + COL_W / 2, 132, c, { size: 16, weight: 700, anchor: 'middle', fill: i === 0 ? '#ffffff' : YELLOW_LIGHT })).join('')

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" ${FONT}>
<defs>${defs.join('')}</defs>
<rect width="${W}" height="${H}" fill="${SPACE}"/>
${header}
${body}
</svg>
`
fs.writeFileSync(OUT, svg)
console.log('wrote', path.relative(process.cwd(), OUT), `${W}×${H}`)
