// Draws the reference tech trees in docs/tech-trees/ (upgrades, crafting, planet classes) as SVG and
// PNG, from the game's own art where it has some (the planet surfaces by class, Koda's station, ship
// and moon, the ship NFT's drawn parts) and invented art where it doesn't (goods, platforms, the BFG).
// Numbers are the contracts' starting values (Planets, Factory, Market, Pilots, Armory, Combat).
//
//   node dev/tech-trees/build.mjs        (from orbiter-client/; Chrome renders the PNGs)
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import puppeteer from 'puppeteer-core'

const here = path.dirname(fileURLToPath(import.meta.url))
const src = path.join(here, '../../src')
const out = path.join(here, '../../../docs/tech-trees')
fs.mkdirSync(out, { recursive: true })

// The ship NFT's drawing (sdk/ship-art.js), loaded without Vite's '@' alias.
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'o8-trees-'))
const designs = pathToFileURL(path.join(src, 'components/assets/ship-designs.js')).href
fs.writeFileSync(
  path.join(tmp, 'ship-art.mjs'),
  fs.readFileSync(path.join(src, 'sdk/ship-art.js'), 'utf8').replace('@/components/assets/ship-designs', designs)
)
const { shipArtParts } = await import(pathToFileURL(path.join(tmp, 'ship-art.mjs')).href)
const { YELLOW_LIGHT, MAP } = await import(pathToFileURL(path.join(src, 'libs/palette.js')).href)

// ── the game's art ─────────────────────────────────────────────────────────────────────────────

const planetVue = fs.readFileSync(path.join(src, 'components/star-map/sprites/planet.svg.vue'), 'utf8')
const SURFACES = {}
for (const m of planetVue.matchAll(/<g v-if="planet\.class == (\d)"([^>]*)>([\s\S]*?)<\/g>/g)) {
  SURFACES[m[1]] = `<g${m[2]}>${m[3].replace(/<!--[\s\S]*?-->/g, '')}</g>`
}
// Classes the game draws plain: surfaces invented in the same style.
SURFACES[2] = `<g stroke="#ffffff22" stroke-width="0.6" fill="none"><path d="M-10 -4q2.5 -2 5 0t5 0t5 0t5 0"/><path d="M-11 1q2.5 -2 5 0t5 0t5 0t5 0"/><path d="M-10 6q2.5 -2 5 0t5 0t5 0t5 0"/></g>`
SURFACES[3] = `<g stroke="#ffffff1a" stroke-width="0.5" fill="#ffffff14"><path d="M-11 -2q6 -5 12 0t12 0v3q-6 -4 -12 0t-12 0z"/><path d="M-9 4q5 -4 10 0t10 0v2.5q-5 -3.5 -10 0t-10 0z"/><path d="M-6 -7q4 -3 8 0t8 0v2q-4 -3 -8 0t-8 0z"/></g>`
SURFACES[9] = `<g stroke="none" fill="#2b0c5033"><ellipse cx="-4" cy="-3" rx="4" ry="2.5"/><ellipse cx="4" cy="2" rx="5" ry="2"/><ellipse cx="-3" cy="6" rx="3" ry="1.6"/><ellipse cx="5" cy="-6" rx="2.5" ry="1.4"/></g>`

const vueInner = (file) =>
  fs
    .readFileSync(path.join(src, file), 'utf8')
    .match(/<template>([\s\S]*?)<\/template>/)[1]
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s(v-if|class|style)="[^"]*"/g, '')
const STATION = vueInner('components/star-map/sprites/station.svg.vue').replace('<path', '<path fill-rule="evenodd"')
const MOON = vueInner('components/star-map/sprites/moon.svg.vue')

const DEFS = `
  <radialGradient id="space" cx="50%" cy="35%" r="80%"><stop offset="0%" stop-color="${MAP.spaceCenter}"/><stop offset="100%" stop-color="${MAP.spaceEdge}"/></radialGradient>
  <radialGradient id="planetGradient" cx="10%" cy="50%" r="180%" fx="0%" fy="50%">
    <stop offset="0%" stop-color="#e5cfff"/><stop offset="10%" stop-color="#e5cfff"/><stop offset="20%" stop-color="#c3b3da"/>
    <stop offset="30%" stop-color="rgb(140,120,180)"/><stop offset="40%" stop-color="rgb(60,40,90)"/><stop offset="100%" stop-color="rgb(60,40,90)"/>
  </radialGradient>
  <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#c3b3da" stop-opacity="0.1"/><stop offset="50%" stop-color="#e5cfff" stop-opacity="0.9"/><stop offset="100%" stop-color="#c3b3da" stop-opacity="0.1"/></linearGradient>
  <clipPath id="just-the-planet"><circle r="10"/></clipPath>
  <linearGradient id="cardEdge" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="#7c39cd"/><stop offset="20%" stop-color="#280b4b"/><stop offset="50%" stop-color="#5c1aae"/><stop offset="80%" stop-color="#280b4b"/><stop offset="100%" stop-color="#7c39cd"/>
  </linearGradient>
  <linearGradient id="pill" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#3d1273"/><stop offset="50%" stop-color="#7c39cd"/><stop offset="100%" stop-color="#3d1273"/></linearGradient>
  <linearGradient id="artBox" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#1c0838"/><stop offset="100%" stop-color="#0b0218"/></linearGradient>
  <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#c3b3da"/></marker>
  <marker id="arrowDim" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#af6fff"/></marker>`

/** A planet of a class, in a box of about 100 (r 40). */
function planetArt(cls, { r = 40, rings = cls === 6, moons = 0 } = {}) {
  const k = r / 10
  let s = `<g transform="scale(${k})">`
  if (rings) s += `<ellipse rx="19" ry="5" fill="none" stroke="url(#ringGradient)" stroke-width="1.6" opacity="0.7" transform="rotate(-18)"/>`
  s += `<circle r="10" stroke="#c3b3da" stroke-width="0.25" fill="url(#planetGradient)"/>`
  s += `<g clip-path="url(#just-the-planet)">${SURFACES[cls] ?? ''}</g>`
  if (rings) s += `<path d="M-18 5.9A19 5 -18 0 0 18 -5.9" fill="none" stroke="url(#ringGradient)" stroke-width="1.6" opacity="0.7" transform="rotate(-18) rotate(18)"/>`
  s += '</g>'
  for (let i = 0; i < moons; i++) {
    const a = -0.6 + i * 0.9
    s += `<g transform="translate(${Math.cos(a) * (r + 16)} ${Math.sin(a) * (r + 16)}) scale(1.6)">${MOON}</g>`
  }
  return s
}

/** The Orbiter 8 as its NFT draws it (sdk/ship-art.js), in a box of about 100. */
function shipArt(loadout = {}, bays = 5, scale = 1) {
  const l = { railguns: 0, missiles: 0, pointDefense: 0, drones: 0, repairBots: 0, armor: 0, shields: 0, ...loadout }
  return `<g transform="scale(${(95 / 5600) * scale})">${shipArtParts({ bays, rangeLost: 0, baysLost: 0, loadout: l })}</g>`
}

const stationArt = (scale = 1) => `<g transform="scale(${4.8 * scale})">${STATION}</g>`

// ── invented art ───────────────────────────────────────────────────────────────────────────────

/** Glyphs for the eight goods, about 24 across, centered. */
const GLYPH = {
  water: `<g fill="none" stroke="#bfe6ff" stroke-width="2" stroke-linecap="round"><path d="M0 -11V11M-9.5 -5.5L9.5 5.5M-9.5 5.5L9.5 -5.5"/><path d="M-3 -9L0 -6L3 -9M-3 9L0 6L3 9" stroke-width="1.5"/></g>`,
  metals: `<g><path d="M-11 6L-7 -4H7L11 6Z" fill="#b9a6d6" stroke="#e5cfff" stroke-width="1"/><path d="M-7 -4L-5 -8H5L7 -4Z" fill="#e5cfff"/></g>`,
  rare: `<g><path d="M0 -11L9 -3L0 11L-9 -3Z" fill="#c38bff" stroke="#e5cfff" stroke-width="1"/><path d="M-9 -3H9M0 -11L-3 -3L0 11L3 -3Z" fill="none" stroke="#e5cfff" stroke-width="0.8"/></g>`,
  he3: `<g fill="none" stroke="#7fd4ff" stroke-width="1.4"><ellipse rx="11" ry="4.5"/><ellipse rx="11" ry="4.5" transform="rotate(60)"/><ellipse rx="11" ry="4.5" transform="rotate(-60)"/><circle r="2.6" fill="#ffd65c" stroke="none"/></g>`,
  organics: `<g><path d="M-9 9C-11 -3 -2 -10 10 -10C10 2 3 10 -9 9Z" fill="#9effa0" stroke="#e5ffe6" stroke-width="1"/><path d="M-9 9L5 -5" stroke="#2b5c2c" stroke-width="1.3"/></g>`,
  silicon: `<g><circle r="10.5" fill="#8f7fb0" stroke="#e5cfff" stroke-width="1"/><path d="M-7 -3.5H7M-7 0H7M-7 3.5H7M-3.5 -7V7M0 -7V7M3.5 -7V7" stroke="#2b0c50" stroke-width="0.8"/></g>`,
  equipment: `<g fill="#ffd65c" stroke="#fff3c2" stroke-width="0.8">${[0, 45, 90, 135].map((a) => `<rect x="-2.5" y="-11.5" width="5" height="23" rx="1" transform="rotate(${a})"/>`).join('')}<circle r="7.5"/><circle r="3" fill="#2b0c50"/></g>`,
  electronics: `<g><rect x="-8" y="-8" width="16" height="16" rx="2" fill="#5cffc8" stroke="#d6fff1" stroke-width="1"/><rect x="-4" y="-4" width="8" height="8" fill="#1c0838"/><path d="M-5 -8V-11M0 -8V-11M5 -8V-11M-5 8V11M0 8V11M5 8V11M-8 -5H-11M-8 0H-11M-8 5H-11M8 -5H11M8 0H11M8 5H11" stroke="#5cffc8" stroke-width="1.4"/></g>`,
  alloy: `<g><rect x="-11" y="-6" width="22" height="12" rx="2" fill="#b9a6d6" stroke="#c38bff" stroke-width="1.6"/><path d="M-11 0H11" stroke="#c38bff" stroke-width="1"/></g>`,
  fuel: `<g><rect x="-6" y="-10" width="12" height="20" rx="3" fill="#7fd4ff" stroke="#d6f2ff" stroke-width="1"/><rect x="-3" y="-13" width="6" height="3" fill="#d6f2ff"/><path d="M-2 -4L2 0H-2L2 5" fill="none" stroke="#1c0838" stroke-width="1.4"/></g>`
}
const GOODS = [
  { key: 'water', name: 'Water ice', short: 'Water', raw: true },
  { key: 'metals', name: 'Metals', short: 'Metals', raw: true },
  { key: 'rare', name: 'Rare elements', short: 'Rares', raw: true },
  { key: 'he3', name: 'Helium-3', short: 'He-3', raw: true },
  { key: 'organics', name: 'Organics', short: 'Organics', raw: true },
  { key: 'silicon', name: 'Silicon', short: 'Silicon', raw: true },
  { key: 'equipment', name: 'Equipment', short: 'Equip.', raw: false },
  { key: 'electronics', name: 'Electronics', short: 'Electr.', raw: false }
]
const G = Object.fromEntries(GOODS.map((g, i) => [g.key, { ...g, id: i }]))

// What each class sells (makes) and buys (Market._setMix), and people per unit of size (SystemGen).
const CLASSES = [
  { name: 'Terrestrial', sells: ['organics', 'equipment', 'electronics'], buys: ['metals', 'rare', 'he3', 'silicon'], people: 1000, idea: ['water'], note: 'The most livable: the industry worlds' },
  { name: 'Rocky', sells: ['metals', 'silicon'], buys: ['water', 'he3', 'organics'], people: 300, idea: ['rare'], note: 'Thin crust, rich veins' },
  { name: 'Oceanic', sells: ['water', 'organics'], buys: ['metals', 'equipment', 'electronics'], people: 800, idea: ['silicon'], note: 'Sea farms; sand on the sea floor' },
  { name: 'Desert', sells: ['rare', 'silicon'], buys: ['water', 'organics', 'equipment'], people: 300, idea: ['metals'], note: 'Dune fields over old ore beds' },
  { name: 'Ice', sells: ['water'], buys: ['rare', 'organics', 'electronics'], people: 200, idea: ['he3'], note: 'Helium-3 trapped in the ice' },
  { name: 'Volcanic', sells: ['metals', 'rare'], buys: ['water', 'silicon', 'electronics'], people: 100, idea: ['silicon'], note: 'Glass fields around the vents' },
  { name: 'Gaseous', sells: ['he3'], buys: ['metals', 'organics', 'equipment'], people: 100, idea: ['water'], note: 'Floating cities; ice in the rings. Sizes 16–63' },
  { name: 'Ferrous', sells: ['metals', 'equipment'], buys: ['water', 'he3', 'organics'], people: 200, idea: ['rare'], note: 'Iron worlds with foundries' },
  { name: 'Lava', sells: ['rare', 'silicon'], buys: ['water', 'equipment', 'electronics'], people: 100, idea: ['metals'], note: 'Molten metal near the surface' },
  { name: 'Swamp', sells: ['organics'], buys: ['metals', 'equipment', 'electronics'], people: 600, idea: ['water'], note: 'Thick air, thicker water' }
]

// ── drawing helpers ────────────────────────────────────────────────────────────────────────────

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const FONT = `font-family="Ubuntu, 'Ubuntu Sans', sans-serif"`

/** Wraps text into lines of at most `max` characters. */
function wrap(text, max) {
  const words = String(text).split(' ')
  const lines = []
  let line = ''
  for (const w of words) {
    if (line && (line + ' ' + w).length > max) {
      lines.push(line)
      line = w
    } else line = line ? line + ' ' + w : w
  }
  if (line) lines.push(line)
  return lines
}

function text(x, y, s, { size = 13, fill = '#e6dcf5', anchor = 'start', weight = 400, italic = false, max = 0, lh = 1.3 } = {}) {
  const lines = max ? wrap(s, max) : [s]
  const attrs = `x="${x}" font-size="${size}" fill="${fill}" text-anchor="${anchor}" font-weight="${weight}"${italic ? ' font-style="italic"' : ''}`
  return lines.map((l, i) => `<text ${attrs} y="${y + i * size * lh}">${esc(l)}</text>`).join('')
}
const lineCount = (s, max) => wrap(s, max).length

/** A starfield, the same every build. */
function stars(w, h, n) {
  let seed = 8
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  let s = ''
  for (let i = 0; i < n; i++) s += `<circle cx="${(rnd() * w).toFixed(1)}" cy="${(rnd() * h).toFixed(1)}" r="${(rnd() * 1.3 + 0.2).toFixed(2)}" fill="#ffffff" opacity="${(rnd() * 0.5 + 0.1).toFixed(2)}"/>`
  return s
}

const STATUS = {
  now: { label: 'in the game', stroke: null },
  planned: { label: 'planned', stroke: `stroke="#af6fff" stroke-width="2.5" stroke-dasharray="10 6"` },
  idea: { label: 'idea', stroke: `stroke="#ffffff77" stroke-width="2" stroke-dasharray="2 5" stroke-linecap="round"` }
}

/** A card in the game's playing-card style: striped edge (in the game) or a dashed / dotted one. */
function card({ x, y, w = 190, h = 250, title, art = '', artH = 104, lines = [], status = 'now', size = 12, max }) {
  const st = STATUS[status]
  max = max ?? Math.floor((w - 24) / (size * 0.52))
  let s = `<g transform="translate(${x} ${y})">`
  if (status === 'now') s += `<rect width="${w}" height="${h}" rx="14" fill="url(#cardEdge)"/><rect x="5" y="5" width="${w - 10}" height="${h - 10}" rx="11" fill="#12052a"/>`
  else s += `<rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="14" fill="#12052acc" ${st.stroke}/>`
  s += `<rect x="12" y="11" width="${w - 24}" height="26" rx="13" fill="url(#pill)" stroke="#ffffff22"/>`
  s += text(w / 2, 29, title, { size: 14.5, fill: '#ffffff', anchor: 'middle', weight: 500 })
  if (art) {
    s += `<rect x="12" y="44" width="${w - 24}" height="${artH}" rx="8" fill="url(#artBox)"/>`
    s += `<g transform="translate(${w / 2} ${44 + artH / 2})">${art}</g>`
  }
  let ty = (art ? 44 + artH : 40) + 20
  for (const line of lines) {
    const opt = typeof line === 'string' ? { t: line } : line
    s += text(14, ty, opt.t, { size: opt.size ?? size, fill: opt.fill ?? '#d9cdee', max, weight: opt.weight ?? 400, italic: opt.italic })
    ty += lineCount(opt.t, max) * (opt.size ?? size) * 1.3 + 4
  }
  if (status !== 'now') s += text(w - 14, h - 12, st.label, { size: 11, fill: status === 'planned' ? '#c9a2ff' : '#ffffffaa', anchor: 'end', italic: true })
  return s + '</g>'
}

/** A section header: a ribbon with the menus' title type. */
function ribbon(x, y, label, w = 560) {
  return `<g transform="translate(${x} ${y})"><path d="M0 0H${w}L${w - 24} 34H0Z" fill="#12052a" stroke="url(#cardEdge)" stroke-width="2"/>
  ${[0, 1, 2].map((i) => `<path d="M${w - 70 + i * 16} 4H${w - 60 + i * 16}L${w - 76 + i * 16} 30H${w - 86 + i * 16}Z" fill="#7c39cd"/>`).join('')}
  ${text(18, 23, label, { size: 17, fill: '#ffffff', weight: 500 })}</g>`
}

function title(w, label, sub) {
  return `<g><rect x="${w / 2 - 430}" y="22" width="860" height="64" rx="32" fill="#12052a" stroke="url(#cardEdge)" stroke-width="4"/>
  <path d="M${w / 2 - 400} 54l22 -12v24z M${w / 2 + 400} 54l-22 -12v24z" fill="${YELLOW_LIGHT}"/>
  ${text(w / 2, 67, label, { size: 34, fill: '#ffffff', anchor: 'middle', weight: 700 })}
  ${text(w / 2, 112, sub, { size: 15, fill: '#c3b3da', anchor: 'middle' })}</g>`
}

function legend(x, y) {
  const row = (i, status, label) => {
    const st = STATUS[status]
    const box =
      status === 'now'
        ? `<rect width="34" height="22" rx="6" fill="url(#cardEdge)"/><rect x="3" y="3" width="28" height="16" rx="4" fill="#12052a"/>`
        : `<rect x="1" y="1" width="32" height="20" rx="6" fill="#12052a" ${st.stroke}/>`
    return `<g transform="translate(14 ${16 + i * 30})">${box}${text(46, 16, label, { size: 13 })}</g>`
  }
  return `<g transform="translate(${x} ${y})"><rect width="300" height="110" rx="10" fill="#0b0218cc" stroke="#ffffff33"/>
  ${row(0, 'now', 'In the game now')}${row(1, 'planned', 'Planned: decided, not built yet')}${row(2, 'idea', 'Idea: proposed here, for Koda')}</g>`
}

const arrow = (x1, y1, x2, y2, dim = false) =>
  `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${dim ? '#af6fff' : '#c3b3da'}" stroke-width="2.5" fill="none" ${dim ? 'stroke-dasharray="7 5"' : ''} marker-end="url(#${dim ? 'arrowDim' : 'arrow'})"/>`
const elbow = (x1, y1, x2, y2, dim = false) =>
  `<path d="M${x1} ${y1}V${(y1 + y2) / 2}H${x2}V${y2}" stroke="${dim ? '#af6fff' : '#c3b3da'}" stroke-width="2.5" fill="none" ${dim ? 'stroke-dasharray="7 5"' : ''} marker-end="url(#${dim ? 'arrowDim' : 'arrow'})"/>`

/** A good as a chip: glyph, amount and short name. */
function chip(x, y, key, amount, { w = 0 } = {}) {
  const g = G[key] ?? { short: key }
  const label = (amount != null ? amount + ' ' : '') + g.short
  const width = w || 30 + label.length * 6.6
  return {
    w: width,
    s: `<g transform="translate(${x} ${y})"><rect width="${width}" height="22" rx="11" fill="#2e0d56" stroke="#ffffff33"/>
    <g transform="translate(12 11) scale(0.62)">${GLYPH[key] ?? ''}</g>${text(24, 15.5, label, { size: 11.5, fill: '#ffffff' })}</g>`
  }
}
function chips(x, y, list, maxW) {
  let s = ''
  let cx = x
  let cy = y
  for (const [key, amount] of list) {
    const probe = chip(0, 0, key, amount)
    if (cx + probe.w > x + maxW) {
      cx = x
      cy += 27
    }
    s += chip(cx, cy, key, amount).s
    cx += probe.w + 6
  }
  return { s, h: cy - y + 22 }
}

function svg(w, h, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" ${FONT}>
<defs>${DEFS}</defs><rect width="${w}" height="${h}" fill="url(#space)"/>${stars(w, h, 260)}${body}</svg>`
}

// ── invented building and part art ────────────────────────────────────────────────────────────

const flag = `<g transform="translate(14 -30)"><path d="M0 0V-26" stroke="#ffffff" stroke-width="2"/><path d="M0 -26H16L12 -20L16 -14H0Z" fill="${YELLOW_LIGHT}"/></g>`
const dome = (x, y, r) => `<path d="M${x - r} ${y}A${r} ${r} 0 0 1 ${x + r} ${y}Z" fill="#e5cfff" stroke="#ffffff" stroke-width="1"/><path d="M${x - r} ${y}H${x + r}" stroke="#ffffff" stroke-width="1.5"/>`
const citadelArt = `${planetArt(0, { r: 34 })}<g transform="translate(0 -24)">${dome(0, 0, 12)}<rect x="-1" y="-22" width="2" height="10" fill="#ffffff"/></g>`
const colonyArt = `${planetArt(0, { r: 34 })}<g transform="translate(0 -22)">${dome(-14, 4, 8)}${dome(0, 0, 11)}${dome(14, 4, 8)}</g>`
const portArt = `${stationArt(0.85)}<g transform="translate(-34 26) rotate(30)">${shipArt({}, 5, 0.32)}</g><g transform="translate(36 -24) rotate(-140)">${shipArt({}, 5, 0.32)}</g>`
const yardsArt = `<g stroke="#8f7fb0" stroke-width="2" fill="none"><path d="M-44 -40V40M44 -40V40M-44 -24H44M-44 24H44"/><path d="M-44 -40L-30 -24M44 -40L30 -24M-44 40L-30 24M44 40L30 24"/></g>${shipArt({}, 150, 0.7)}`
const armoryArt = shipArt({ railguns: 3, missiles: 2, pointDefense: 2 }, 5, 0.85)
const autofactoryArt = `<g><rect x="-40" y="-8" width="80" height="34" rx="3" fill="#3d1273" stroke="#c3b3da" stroke-width="1.5"/><path d="M-40 -8L-26 -24V-8L-12 -24V-8L2 -24V-8" fill="#5c1aae" stroke="#c3b3da" stroke-width="1.5"/><rect x="14" y="-38" width="10" height="30" fill="#5c1aae" stroke="#c3b3da" stroke-width="1.5"/><circle cx="21" cy="-46" r="5" fill="#ffffff22"/><circle cx="26" cy="-54" r="7" fill="#ffffff14"/>
<g transform="translate(-20 10) scale(0.7)">${GLYPH.equipment}</g><g transform="translate(6 10) scale(0.7)">${GLYPH.electronics}</g><path d="M22 10H34" stroke="${YELLOW_LIGHT}" stroke-width="2" marker-end="url(#arrow)"/></g>`
const scannerArt = `${planetArt(1, { r: 22 })}<g fill="none" stroke="#7fd4ff"><circle r="32" opacity="0.6"/><circle r="44" opacity="0.35"/><path d="M0 0L38 -24" stroke-width="2"/></g>`
const relayArt = `<g><path d="M0 -6V30M-12 30H12" stroke="#c3b3da" stroke-width="3"/><path d="M-18 -22A24 24 0 0 0 18 -22" fill="none" stroke="#c3b3da" stroke-width="3"/><circle cy="-8" r="4" fill="${YELLOW_LIGHT}"/>${[14, 24, 34].map((r) => `<path d="M${-r * 0.7} ${-8 - r * 0.7}A${r} ${r} 0 0 1 ${r * 0.7} ${-8 - r * 0.7}" fill="none" stroke="#7fd4ff" stroke-width="1.6" opacity="${1 - r / 50}"/>`).join('')}</g>`
const shipwrightArt = `<g transform="translate(-22 4)">${shipArt({}, 5, 0.6)}</g><g transform="translate(24 -6)">${shipArt({}, 5, 0.6)}</g><g transform="translate(2 34)" opacity="0.6">${shipArt({}, 5, 0.4)}</g>`
const exchangeArt = `${stationArt(0.6)}<g transform="translate(-30 30) scale(0.9)">${GLYPH.organics}</g><g transform="translate(30 30) scale(0.9)">${GLYPH.metals}</g><path d="M-14 30H14" stroke="${YELLOW_LIGHT}" stroke-width="2" marker-end="url(#arrow)" marker-start="url(#arrow)"/>`
const platformArt = (s = 1) => `<g transform="scale(${s})"><rect x="-26" y="-6" width="52" height="12" rx="3" fill="#b9a6d6" stroke="#e5cfff"/><rect x="-6" y="-20" width="12" height="40" rx="3" fill="#8f7fb0" stroke="#e5cfff"/><rect x="-40" y="-3" width="14" height="6" fill="#7fd4ff"/><rect x="26" y="-3" width="14" height="6" fill="#7fd4ff"/><rect x="-2" y="-34" width="4" height="16" fill="#ffd65c"/><rect x="-14" y="-2" width="4" height="-14" fill="#ffd65c"/></g>`
const bfgArt = `<g><rect x="-34" y="4" width="68" height="22" rx="6" fill="#5c1aae" stroke="#c3b3da" stroke-width="1.5"/><path d="M-14 4L-6 -40H6L14 4Z" fill="#b9a6d6" stroke="#e5cfff"/><rect x="-9" y="-52" width="18" height="14" rx="3" fill="#ffd65c"/><circle cy="-58" r="10" fill="${YELLOW_LIGHT}" opacity="0.35"/><circle cy="-58" r="5" fill="#ffffff"/></g>`
const rangeArt = `${shipArt({}, 5, 0.45)}<g fill="none" stroke="#7fd4ff" stroke-dasharray="4 4">${[24, 36, 48].map((r) => `<circle r="${r}" opacity="${1.2 - r / 50}"/>`).join('')}</g>`
const podArt = `${shipArt({}, 250, 0.9)}`
const beaconArt = `<g><path d="M0 -26L14 0L0 26L-14 0Z" fill="#3d1273" stroke="#c3b3da" stroke-width="2"/><circle r="5" fill="${YELLOW_LIGHT}"/>${[16, 26].map((r) => `<circle r="${r}" fill="none" stroke="#7fd4ff" stroke-width="1.4" opacity="${1 - r / 36}"/>`).join('')}</g>`
const scanArrayArt = `<g><path d="M-20 20L0 -10L20 20Z" fill="#3d1273" stroke="#c3b3da" stroke-width="2"/><path d="M-24 -18A30 30 0 0 1 24 -18" fill="none" stroke="#7fd4ff" stroke-width="3"/><path d="M0 -10V-30" stroke="#c3b3da" stroke-width="2"/></g>`
const glyphArt = (key, s = 3) => `<g transform="scale(${s})">${GLYPH[key]}</g>`

// ── 1. Upgrades ─────────────────────────────────────────────────────────────────────────────────

function upgrades() {
  const W = 1600
  let b = title(W, 'TECH TREE · UPGRADES', 'What you build on your planets, what defends them, and what your Orbiter 8 can carry') + legend(1270, 140)

  b += ribbon(30, 150, 'PLANET BUILDINGS · one after another')
  const cw = 190
  const gap = 30
  const x0 = 45
  const y0 = 270
  const line = [
    { title: 'Claim', art: `${planetArt(0, { r: 36 })}${flag}`, lines: ['2,000¢, your ship at its star', 'The planet\'s deed is an NFT', { t: 'The discoverer has the first 10 minutes', fill: '#ffffff99' }] },
    { title: 'Citadel', art: citadelArt, lines: ['5,000¢ · 40 equip · 40 organics · 10 min', { t: 'Needs 100 people landed', fill: YELLOW_LIGHT }, 'People grow; the planet makes its class\'s goods'] },
    { title: 'Colony', art: colonyArt, lines: ['20,000¢ · 80 equip · 40 electr · 30 min', { t: 'Needs the planet 90% full', fill: YELLOW_LIGHT }, 'Opens the Station and the Autofactory'] },
    { title: 'Station', art: stationArt(), lines: ['50,000¢ · 150 metals · 80 electr · 1 h', 'Opens the Port'] },
    { title: 'Port', art: portArt, lines: ['80,000¢ · 100 equip · 100 electr · 2 h', 'A market at your planet, trading by its class. You take the fee'] },
    { title: 'Yards', art: yardsArt, lines: ['150,000¢ · 200 metals · 100 equip · 4 h', 'Sells holds and engine range to visiting pilots'] },
    { title: 'Armory', art: armoryArt, lines: ['250,000¢ · 150 rares · 100 electr · 6 h', 'Sells weapons and armor; you take a cut'] }
  ]
  line.forEach((c, i) => {
    const x = x0 + i * (cw + gap)
    b += card({ x, y: y0, w: cw, h: 270, ...c })
    if (i < line.length - 1) b += arrow(x + cw + 2, y0 + 96, x + cw + gap - 2, y0 + 96)
  })
  b += text(x0, y0 - 10, 'Each building needs the one before. Credits are spent when it starts; goods come from the planet\'s storage.', { size: 13, fill: '#c3b3da' })

  // Branches under the line
  const by = 610
  const at = (i) => x0 + i * (cw + gap)
  const branches = [
    { i: 1, status: 'idea', title: 'Deep Scanner', art: scannerArt, lines: ['Charts stars two jumps out, not only neighbors', { t: 'Builds on the drand scans', fill: '#ffffff99' }] },
    { i: 2, status: 'now', title: 'Autofactory', art: autofactoryArt, lines: ['60,000¢ · 100 equip · 100 electr · 50 silicon · 2 h', 'Builds parts from storage, five orders at a time (see Crafting)'] },
    { i: 3, status: 'planned', title: 'Relay', art: relayArt, lines: ['Carries orders to ships far away, with signal lag', { t: 'For fleets (D26, "next")', fill: '#ffffff99' }] },
    { i: 4, status: 'idea', title: 'Exchange', art: exchangeArt, lines: ['Standing buy and sell orders at your port, filled while you\'re away'] },
    { i: 5, status: 'planned', title: 'Shipwright', art: shipwrightArt, lines: ['A second Orbiter 8: fleets, flown through Relays', { t: 'Ships are NFTs already', fill: '#ffffff99' }] }
  ]
  for (const br of branches) {
    b += elbow(at(br.i) + cw / 2, y0 + 270, at(br.i) + cw / 2, by - 2, br.status !== 'now')
    b += card({ x: at(br.i), y: by, w: cw, h: 270, ...br })
  }

  // Planet defenses
  const dy = 930
  b += ribbon(30, dy, 'PLANET DEFENSES · where a siege\'s hits land, in order')
  const cx = 330
  const cy = dy + 300
  const layers = [
    [250, '#b9a6d6', 'Platforms'],
    [205, '#ffd65c', 'Moon guns'],
    [165, '#7fd4ff', 'Shield'],
    [135, '#c3b3da', 'Armor'],
    [108, '#5cffc8', 'Weapons'],
    [80, '#e5cfff', 'Hull']
  ]
  b += `<g transform="translate(${cx} ${cy})">`
  layers.forEach(([r, color], i) => {
    b += `<circle r="${r}" fill="none" stroke="${color}" stroke-width="${i === 2 ? 4 : 1.6}" stroke-dasharray="${i === 0 || i === 1 ? '6 6' : 'none'}" opacity="0.75"/>`
  })
  b += planetArt(6, { r: 62, rings: false })
  // platforms on the outer ring, moons with guns on the next
  for (const a of [-2.2, -0.2, 1.6]) b += `<g transform="translate(${Math.cos(a) * 250} ${Math.sin(a) * 250}) rotate(${(a * 180) / Math.PI + 90})">${platformArt(0.55)}</g>`
  for (const a of [-1.2, 0.8, 2.6, 3.9]) {
    b += `<g transform="translate(${Math.cos(a) * 205} ${Math.sin(a) * 205})"><g transform="scale(3)">${MOON}</g><rect x="-2" y="-24" width="4" height="12" fill="#ffd65c"/><circle cx="10" cy="-8" r="3" fill="#5cffc8"/></g>`
  }
  layers.forEach(([r, color], i) => {
    b += `<g transform="translate(${-r + 6} ${i % 2 ? 14 : -6})">${text(0, 0, i + 1 + '', { size: 15, fill: color, weight: 700 })}</g>`
  })
  b += '</g>'

  const rows = [
    ['Orbital platforms', '#b9a6d6', 'Up to 3, from the Autofactory (40,000¢). 150 hit points each; each adds 4 weapon mounts. Missiles do double against them. Destroyed in battle.', 'now'],
    ['Weapons on moons', '#ffd65c', 'Each moon gives 6 free mounts for railguns, missile racks and point defense. Moons can\'t be destroyed; the weapons on them can. Outside the shield, so they\'re hit early.', 'now'],
    ['Shield', '#7fd4ff', 'Up to 5 levels, 60 each. Regains 10% of its strength every round. Railguns do a quarter against it; missiles double.', 'now'],
    ['Armor', '#c3b3da', 'Up to 20 plates, 50 each. Repair bots mend 5 a round each. Railguns do double.', 'now'],
    ['The planet\'s weapons', '#5cffc8', '12 mounts plus the platforms\'. Up to 60 drones, 20 repair bots and one BFG (a 300-damage shot every 6 hours). Drones do double here.', 'now'],
    ['Hull', '#e5cfff', '60 per tech level, the defense grid its buildings support. With all six layers gone the planet is worn down, and the attacker can file a claim (a day).', 'now']
  ]
  rows.forEach(([name, color, desc], i) => {
    const y = dy + 70 + i * 92
    b += `<g transform="translate(660 ${y})"><rect width="900" height="80" rx="10" fill="#12052acc" stroke="#ffffff22"/>
      <circle cx="34" cy="40" r="20" fill="none" stroke="${color}" stroke-width="3"/>${text(34, 46, i + 1 + '', { size: 18, fill: color, anchor: 'middle', weight: 700 })}
      ${text(70, 30, name, { size: 17, fill: '#ffffff', weight: 500 })}${text(70, 52, desc, { size: 13, fill: '#d9cdee', max: 128 })}</g>`
  })
  b += text(660, dy + 640, 'Rounds every 30 minutes; both sides fire with what they have at the start of a round. Allies at the star fire with the planet.', { size: 13, fill: '#c3b3da' })

  // The Orbiter 8
  const sy = 1620
  b += ribbon(30, sy, 'YOUR ORBITER 8 · one ship, six mounts')
  const s1 = sy + 70
  b += card({ x: 45, y: s1, w: 230, h: 270, title: 'Orbiter 8', art: shipArt({}, 5, 1.05), artH: 120, lines: ['5 holds · range 1 · 6 weapon mounts', 'Registered with your call sign; an NFT whose picture shows what it carries'] })
  const top = [
    { title: 'Holds', art: podArt, lines: ['At a shipyard (the I.S.S. or a Yards). Each costs more than the last; up to 250', 'Pods show on the ship from 50'] },
    { title: 'Engine range', art: rangeArt, lines: ['Range 2: 15,000¢', 'Range 3: 150,000¢', 'Range 4: 600,000¢'] },
    { title: 'Repairs', art: `${shipArt({ armor: 2 }, 5, 0.7)}<g transform="translate(30 -24)" fill="#9effa0"><rect x="-3" y="-10" width="6" height="20"/><rect x="-10" y="-3" width="20" height="6"/></g>`, lines: ['3,000¢ at any shipyard: everything restored', 'Then 3 hours in the yard before attacking again'] },
    { title: 'Fleet', status: 'planned', art: shipwrightArt, lines: ['More ships, flown remotely through Relays, with signal lag', { t: 'D26: "consider next"', fill: '#ffffff99' }] }
  ]
  top.forEach((c, i) => {
    const x = 330 + i * 250
    b += card({ x, y: s1, w: 220, h: 270, ...c })
  })
  b += arrow(277, s1 + 104, 326, s1 + 104)
  b += `<path d="M${330 + 3 * 250 - 30} ${s1 + 104}H${330 + 3 * 250 - 6}" stroke="#af6fff" stroke-width="2.5" stroke-dasharray="7 5" marker-end="url(#arrowDim)"/>`
  b += `<g transform="translate(1340 ${s1 + 10})"><rect width="220" height="250" rx="12" fill="#0b0218cc" stroke="#ffffff33"/>
    ${text(16, 30, 'How space is shared', { size: 15, fill: '#ffffff', weight: 500 })}
    ${text(16, 56, 'Mounts (6): railgun 2, missile rack 2, point defense 1.', { size: 13, max: 30 })}
    ${text(16, 110, 'Holds: drones 2 each, repair bots 5, armor 10 a level (up to 5), shields 20 a level (up to 3). Cargo uses the rest; colonists go 100 to a hold.', { size: 13, max: 30 })}</g>`

  const s2 = s1 + 330
  b += `<path d="M160 ${s1 + 270}V${s2 - 30}H${45 + 6 * 220 + 95}" stroke="#c3b3da" stroke-width="2.5" fill="none"/>`
  b += text(180, s2 - 40, 'Fitted at an armory (Sol\'s I.S.S. sells ship parts at twice their cost) or from your planet\'s Autofactory', { size: 13, fill: '#c3b3da' })
  const parts = [
    ['Railguns', { railguns: 3 }, ['2 mounts · 12 damage', 'Double against armor, a quarter against shields']],
    ['Missile racks', { missiles: 3 }, ['2 mounts · 12 damage', 'Double against shields and platforms; point defense stops them']],
    ['Point defense', { pointDefense: 6 }, ['1 mount', 'Stops 15 missile damage a round']],
    ['Drones', { drones: 60 }, ['2 holds each · 2 damage', 'Double against weapons; not stopped']],
    ['Armor', { armor: 5 }, ['10 holds a level, up to 5', '50 each; takes hits after the shield']],
    ['Shield', { shields: 3 }, ['20 holds a level, up to 3', '60 each; regains 10% a round']],
    ['Repair bots', { repairBots: 6 }, ['5 holds each', 'Mend 2 armor a round each']]
  ]
  parts.forEach(([name, l, lines], i) => {
    const x = 45 + i * 220
    b += `<path d="M${x + 95} ${s2 - 30}V${s2 - 2}" stroke="#c3b3da" stroke-width="2.5" marker-end="url(#arrow)"/>`
    b += card({ x, y: s2, w: 190, h: 260, title: name, art: shipArt(l, 5, 0.95), lines })
  })
  return svg(W, s2 + 300, b)
}

// ── 2. Crafting ─────────────────────────────────────────────────────────────────────────────────

function crafting() {
  const W = 1600
  let b = title(W, 'TECH TREE · CRAFTING', 'From what planets mine, to what the Autofactory builds, to where it\'s fitted') + legend(1270, 140)

  // Raw goods
  b += ribbon(30, 150, 'RAW GOODS · mined by settled planets')
  const raw = GOODS.filter((g) => g.raw)
  const rw = 190
  const rx = (i) => 45 + i * (rw + 16)
  const ry = 270
  raw.forEach((g, i) => {
    const from = CLASSES.filter((c) => c.sells.includes(g.key)).map((c) => c.name)
    b += card({ x: rx(i), y: ry, w: rw, h: 200, title: g.name, art: glyphArt(g.key, 2.6), artH: 70, lines: [{ t: 'From ' + from.join(', '), size: 12 }] })
  })

  // Manufactured
  const my = 560
  const made = [
    { key: 'equipment', title: 'Equipment', status: 'now', lines: ['Made by Terrestrial and Ferrous worlds today', { t: 'Idea: refine it at an Autofactory from 2 metals + 1 silicon', fill: '#ffffffaa', italic: true }], from: ['metals', 'silicon'] },
    { key: 'electronics', title: 'Electronics', status: 'now', lines: ['Made by Terrestrial worlds today', { t: 'Idea: from 2 silicon + 1 rare element', fill: '#ffffffaa', italic: true }], from: ['silicon', 'rare'] },
    { key: 'alloy', title: 'Alloy', status: 'idea', lines: ['3 metals + 1 rare element', 'Lighter armor and platforms: a better tier of plating'], from: ['metals', 'rare'] },
    { key: 'fuel', title: 'Fuel cells', status: 'idea', lines: ['2 helium-3 + 1 water ice', 'Charges the BFG faster; a longer jump for one trip'], from: ['he3', 'water'] }
  ]
  const mx = (i) => 120 + i * 300
  made.forEach((m, i) => {
    for (const f of m.from) {
      const ri = raw.findIndex((g) => g.key === f)
      b += `<path d="M${rx(ri) + rw / 2} ${ry + 200}C${rx(ri) + rw / 2} ${ry + 250} ${mx(i) + 110} ${my - 60} ${mx(i) + 110} ${my - 4}" fill="none" stroke="${m.status === 'now' ? '#ffffff55' : '#ffffff55'}" stroke-width="2" stroke-dasharray="2 5" stroke-linecap="round" marker-end="url(#arrowDim)"/>`
    }
    b += card({ x: mx(i), y: my, w: 220, h: 250, title: m.title, art: glyphArt(m.key, 2.6), artH: 74, status: m.status, lines: m.lines })
  })
  b += ribbon(30, my - 50, 'MANUFACTURED GOODS', 320)
  b += `<g transform="translate(1340 ${my})"><rect width="220" height="250" rx="12" fill="#0b0218cc" stroke="#ffffff33"/>
    ${text(16, 30, 'Today', { size: 15, fill: '#ffffff', weight: 500 })}
    ${text(16, 56, 'Every good is made by planets of some class (see Planet Classes) and traded at ports. Nothing is refined yet: the dotted lines are the crafting milestone\'s recipes (D58: "crafting adds recipes later").', { size: 13, max: 30 })}</g>`

  // The Autofactory's parts, by tier
  const py = 920
  b += ribbon(30, py - 50, 'THE AUTOFACTORY · parts, by tier')
  b += card({ x: 45, y: py + 150, w: 200, h: 250, title: 'Autofactory', art: autofactoryArt, lines: ['After Colony', 'Five orders at a time; goods paid when queued, built one after another'] })
  const FITS = { ship: 'Ship', planet: 'Planet', moons: 'Moons' }
  const P = (name, credits, time, recipe, fits, l, art) => ({ name, credits, time, recipe, fits, l, art })
  const tiers = [
    ['Tier I · basics', [
      P('Drone', '500¢', '5 min', [['metals', 5], ['electronics', 3]], ['ship', 'planet'], { drones: 60 }),
      P('Repair bot', '2,000¢', '15 min', [['equipment', 10], ['electronics', 10]], ['ship', 'planet'], { repairBots: 6 }),
      P('Armor plating', '2,500¢', '20 min', [['metals', 50]], ['ship', 'planet'], { armor: 5 }),
      P('Point defense', '3,000¢', '20 min', [['metals', 20], ['electronics', 10]], ['ship', 'planet', 'moons'], { pointDefense: 6 })
    ]],
    ['Tier II · weapons', [
      P('Railgun', '6,000¢', '40 min', [['metals', 40], ['equipment', 20]], ['ship', 'planet', 'moons'], { railguns: 3 }),
      P('Missile rack', '6,000¢', '40 min', [['he3', 30], ['electronics', 20]], ['ship', 'planet', 'moons'], { missiles: 3 }),
      P('Shield generator', '8,000¢', '1 h', [['rare', 20], ['electronics', 30]], ['ship', 'planet'], { shields: 3 })
    ]],
    ['Tier III · planets', [
      P('Orbital platform', '40,000¢', '3 h', [['metals', 200], ['equipment', 100]], ['planet'], null, platformArt(1.1)),
      { ...P('Relay beacon', '?', '?', [['electronics', 40], ['rare', 20]], ['planet'], null, beaconArt), status: 'planned', note: 'For fleets' },
      { ...P('Scanner array', '?', '?', [['silicon', 60], ['electronics', 30]], ['planet'], null, scanArrayArt), status: 'idea', note: 'For a Deep Scanner' }
    ]],
    ['Tier IV · the big one', [
      P('BFG', '150,000¢', '8 h', [['rare', 150], ['electronics', 150]], ['planet'], null, bfgArt),
      { ...P('Cargo pod', '?', '?', [['metals', 30], ['alloy', 10]], ['ship'], null, glyphArt('alloy', 2.4)), status: 'idea', note: '+10 holds without a shipyard' },
      { ...P('Colony pod', '?', '?', [['organics', 60], ['equipment', 40]], ['ship'], null, `${dome(0, 14, 26)}`), status: 'idea', note: 'Claim and land 100 people in one move' }
    ]]
  ]
  const tx = (i) => 300 + i * 320
  tiers.forEach(([label, list], t) => {
    b += text(tx(t) + 140, py - 6, label, { size: 15, fill: '#ffffff', anchor: 'middle', weight: 500 })
    list.forEach((p, i) => {
      const y = py + 10 + i * 190
      const w = 280
      const st = STATUS[p.status ?? 'now']
      let s = `<g transform="translate(${tx(t)} ${y})">`
      s += p.status ? `<rect x="1" y="1" width="${w - 2}" height="176" rx="12" fill="#12052acc" ${st.stroke}/>` : `<rect width="${w}" height="178" rx="12" fill="url(#cardEdge)"/><rect x="4" y="4" width="${w - 8}" height="170" rx="9" fill="#12052a"/>`
      s += `<rect x="10" y="10" width="86" height="86" rx="8" fill="url(#artBox)"/><g transform="translate(53 53) scale(0.8)">${p.art ?? shipArt(p.l, 5, 0.9)}</g>`
      s += text(106, 30, p.name, { size: 15.5, fill: '#ffffff', weight: 500 })
      s += text(106, 50, p.status ? (p.note ?? '') : `${p.credits} · ${p.time}`, { size: 12.5, fill: p.status ? '#ffffffaa' : '#d9cdee', italic: !!p.status, max: 26 })
      s += text(106, 88, 'Fits: ' + p.fits.map((f) => FITS[f]).join(' · '), { size: 12, fill: YELLOW_LIGHT })
      const ch = chips(10, 108, p.recipe, w - 20)
      s += ch.s
      if (p.status) s += text(w - 12, 168, st.label, { size: 11, fill: p.status === 'planned' ? '#c9a2ff' : '#ffffffaa', anchor: 'end', italic: true })
      b += s + '</g>'
    })
    if (t === 0) b += arrow(247, py + 275, tx(0) - 6, py + 275)
    else b += arrow(tx(t) - 38, py + 90, tx(t) - 6, py + 90)
  })

  // Where parts go
  const gy = py + 10 + 4 * 190 + 20
  b += ribbon(30, gy, 'WHERE PARTS GO')
  const targets = [
    ['Your Orbiter 8', shipArt({ railguns: 2, missiles: 1, pointDefense: 2, armor: 2 }, 50, 1), '6 mounts, plus holds for drones, bots, armor and shields. Fitted at your planet, or bought at an armory.'],
    ['Your planet', planetArt(0, { r: 40 }), '12 mounts plus 4 a platform; up to 60 drones, 20 bots, 20 plates, 5 shield levels, 1 BFG. Fitted from anywhere, even mid-siege.'],
    ['Its moons', `<g transform="scale(5)">${MOON}</g><rect x="-3" y="-44" width="6" height="22" fill="#ffd65c"/>`, '6 mounts a moon for railguns, missile racks and point defense. Free, can\'t be destroyed; their weapons sit outside the shield.']
  ]
  targets.forEach(([name, art, desc], i) => {
    b += card({ x: 45 + i * 420, y: gy + 60, w: 390, h: 240, title: name, art, artH: 110, lines: [desc] })
  })
  b += `<g transform="translate(1310 ${gy + 60})"><rect width="250" height="240" rx="12" fill="#0b0218cc" stroke="#ffffff33"/>
    ${text(16, 30, 'Moving parts', { size: 15, fill: '#ffffff', weight: 500 })}
    ${text(16, 56, 'Ship parts go both ways between your ship and your planet. Platforms and the BFG stay on planets. Weapons come off moons only in peace.', { size: 13, max: 34 })}</g>`
  return svg(W, gy + 340, b)
}

// ── 3. Planet classes ───────────────────────────────────────────────────────────────────────────

function planetClasses() {
  const W = 1600
  let b = title(W, 'PLANET CLASSES · WHAT THEY OFFER', 'What each class mines and makes, what its ports buy, and how many people it holds')
  const cw = 290
  const ch = 470
  const gap = 17
  CLASSES.forEach((c, i) => {
    const x = 45 + (i % 5) * (cw + gap)
    const y = 150 + Math.floor(i / 5) * (ch + 24)
    let s = `<g transform="translate(${x} ${y})"><rect width="${cw}" height="${ch}" rx="14" fill="url(#cardEdge)"/><rect x="5" y="5" width="${cw - 10}" height="${ch - 10}" rx="11" fill="#12052a"/>`
    s += `<rect x="12" y="11" width="${cw - 24}" height="28" rx="14" fill="url(#pill)" stroke="#ffffff22"/>${text(cw / 2, 30, c.name, { size: 16, fill: '#ffffff', anchor: 'middle', weight: 500 })}`
    s += `<rect x="12" y="46" width="${cw - 24}" height="150" rx="8" fill="url(#artBox)"/><g transform="translate(${cw / 2} 121)">${planetArt(i, { r: 52, moons: i === 6 ? 3 : i % 3 === 0 ? 1 : 0 })}</g>`
    s += text(16, 220, c.note, { size: 12.5, fill: '#c3b3da', italic: true, max: 42 })
    s += text(16, 240, `${c.people.toLocaleString('en-US')} people per unit of size`, { size: 12, fill: '#ffffffaa' })
    s += text(16, 270, 'Mines and makes · its ports sell', { size: 12.5, fill: YELLOW_LIGHT })
    s += chips(16, 278, c.sells.map((k) => [k]), cw - 32).s
    s += text(16, 336, 'Its ports buy', { size: 12.5, fill: '#d9cdee' })
    s += chips(16, 344, c.buys.map((k) => [k]), cw - 32).s
    s += `<rect x="12" y="${ch - 66}" width="${cw - 24}" height="54" rx="8" fill="none" stroke="#ffffff77" stroke-width="1.5" stroke-dasharray="2 5" stroke-linecap="round"/>`
    s += text(22, ch - 46, 'Idea: could also yield', { size: 12, fill: '#ffffffaa', italic: true })
    s += chips(22, ch - 38, c.idea.map((k) => [k]), cw - 44).s
    b += s + '</g>'
  })
  const fy = 150 + 2 * (ch + 24) + 10
  b += `<g transform="translate(45 ${fy})"><rect width="1510" height="200" rx="12" fill="#0b0218cc" stroke="#ffffff33"/>
    ${text(20, 32, 'The eight goods', { size: 16, fill: '#ffffff', weight: 500 })}
    ${GOODS.map((g, i) => `<g transform="translate(${30 + i * 140} 82)"><g transform="scale(1.6)">${GLYPH[g.key]}</g>${text(30, 6, g.name, { size: 13 })}${text(30, 24, g.raw ? 'raw' : 'manufactured', { size: 11.5, fill: g.raw ? '#c3b3da' : YELLOW_LIGHT })}</g>`).join('')}
    ${text(20, 140, 'A settled planet makes the goods its class sells, faster with more people, into its storage (none while besieged). Ports trade by the planet\'s class: every good is sold and bought somewhere at Sol.', { size: 13, fill: '#d9cdee', max: 200 })}
    ${text(20, 176, 'People per unit of size, times the planet\'s size (1–16; gas giants 16–63), is its population cap. Moons give 6 weapon mounts each. Idea: moons mined for water ice and metals once a planet has a Station.', { size: 13, fill: '#d9cdee', max: 200 })}</g>`
  return svg(W, fy + 240, b)
}

// ── write and render ────────────────────────────────────────────────────────────────────────────

const pages = { upgrades: upgrades(), crafting: crafting(), 'planet-classes': planetClasses() }
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', headless: true })
for (const [name, doc] of Object.entries(pages)) {
  fs.writeFileSync(path.join(out, name + '.svg'), doc)
  const [, w, h] = doc.match(/width="(\d+)" height="(\d+)"/)
  const page = await browser.newPage()
  await page.setViewport({ width: Number(w), height: Number(h), deviceScaleFactor: 1 })
  await page.setContent(`<html><body style="margin:0;background:#160631">${doc}</body></html>`)
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: path.join(out, name + '.png'), clip: { x: 0, y: 0, width: Number(w), height: Number(h) } })
  await page.close()
  console.log('wrote', path.relative(process.cwd(), path.join(out, name + '.png')), w + '×' + h)
}
await browser.close()
fs.rmSync(tmp, { recursive: true, force: true })
