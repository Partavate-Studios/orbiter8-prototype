// Draws the reference tech trees in docs/tech-trees/ (upgrades, crafting, planet classes) as SVG and
// PNG. The Markdown files beside them are the source of truth: every name, number and line comes from
// their tables, and only the layout lives here. The art is the game's own where it has some (the
// planet surfaces by class, Koda's station, ship and moon, the ship NFT's drawn parts), read live from
// the components, and drawings in orbiter-client/src/assets/art/ where it doesn't (goods, buildings,
// platforms, the BFG). New drawings go in that folder, so the game can use them too.
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


// ── the art files and the Markdown sources ─────────────────────────────────────────────────────

const ART = path.join(src, 'assets/art')
const docs = path.join(here, '../../../docs/tech-trees')

/** A drawing from assets/art (120 units square, centered), without its <svg>, <defs> and comments. */
function artFile(name) {
  const file = path.join(ART, name + '.svg')
  if (!fs.existsSync(file)) throw new Error(`No drawing ${name}.svg in ${ART}`)
  return fs
    .readFileSync(file, 'utf8')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<defs>[\s\S]*?<\/defs>/g, '')
    .replace(/<\/?svg[^>]*>/g, '')
}

/**
 * Art from a Markdown cell: `planet:<class>[,moons=N][,rings]`, `ship:<part>=<n>,…[,bays=N]`,
 * `station`, `moon`, or a drawing's name in assets/art.
 */
function art(spec, { scale = 1, r = 36 } = {}) {
  spec = (spec ?? '').trim()
  if (!spec) return ''
  const opts = (list) => Object.fromEntries(list.filter(Boolean).map((o) => o.split('=')))
  if (spec.startsWith('planet:')) {
    const [cls, ...rest] = spec.slice(7).split(',')
    const o = opts(rest)
    return planetArt(Number(cls), { r, moons: Number(o.moons ?? 0), rings: 'rings' in o || Number(cls) === 6 })
  }
  if (spec.startsWith('ship:')) {
    const o = opts(spec.slice(5).split(','))
    const bays = Number(o.bays ?? 5)
    delete o.bays
    return shipArt(Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Number(v)])), bays, scale)
  }
  if (spec === 'station') return stationArt(scale)
  if (spec === 'moon') return `<g transform="scale(${4 * scale})">${MOON}</g>`
  return `<g transform="scale(${scale})">${artFile(spec)}</g>`
}

/** The tables of a Markdown file, by their section (## heading), as rows keyed by column. */
function tables(file) {
  const out = {}
  let section = ''
  let header = null
  for (const line of fs.readFileSync(path.join(docs, file), 'utf8').split('\n')) {
    const heading = line.match(/^## (.+)/)
    if (heading) {
      section = heading[1].trim()
      header = null
      continue
    }
    if (!line.startsWith('|')) {
      header = null
      continue
    }
    const cells = line.trim().slice(1, -1).split('|').map((c) => c.trim())
    if (cells.every((c) => /^:?-+:?$/.test(c))) continue
    if (!header) {
      header = cells
      out[section] = []
      continue
    }
    out[section].push(Object.fromEntries(header.map((h, i) => [h, cells[i] ?? ''])))
  }
  return out
}

/** A Details cell as card lines: `<br>` between lines, `**…**` a requirement, `_…_` a side note. */
function detailLines(cell) {
  return (cell ?? '')
    .split('<br>')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const req = l.match(/^\*\*(.+)\*\*$/)
      if (req) return { t: req[1], fill: YELLOW_LIGHT }
      const note = l.match(/^_(.+)_$/)
      if (note) return { t: note[1], fill: '#ffffff99', italic: true }
      return l
    })
}

const UP = tables('upgrades.md')
const CR = tables('crafting.md')
const PC = tables('planet-classes.md')
const notesOf = (t) => Object.fromEntries((t.Notes ?? []).map((n) => [n.Title, n.Text.replace(/<br>/g, ' ')]))

/** The goods, by lowercase name. */
const GOODS = CR.Goods.map((g) => ({ name: g.Good, short: g.Short, kind: g.Kind, art: g.Art }))
const goodNamed = (name) => {
  const g = GOODS.find((x) => x.name.toLowerCase() === name.trim().toLowerCase())
  if (!g) throw new Error(`Unknown good "${name}" (crafting.md, Goods)`)
  return g
}
/** "40 metals, 20 equipment" (or "metals, silicon") → [[good, amount]]. */
const goodsList = (cell) =>
  (cell ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const m = s.match(/^(\d+)\s+(.+)$/)
      return m ? [goodNamed(m[2]), Number(m[1])] : [goodNamed(s), null]
    })

const CLASSES = PC[Object.keys(PC).find((k) => PC[k][0]?.Class)] ?? PC['']
const classes = CLASSES.map((c) => ({
  name: c.Class,
  art: c.Art,
  people: Number(c['People per size']),
  sells: goodsList(c['Mines and sells']).map(([g]) => g),
  buys: goodsList(c['Ports buy']).map(([g]) => g),
  idea: goodsList(c['Could also yield']).map(([g]) => g),
  note: c.Note
}))

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

/** A good (from crafting.md) as a chip: its drawing, amount and short name. */
function chip(x, y, key, amount, { w = 0 } = {}) {
  const g = key
  const label = (amount != null ? amount + ' ' : '') + g.short
  const width = w || 30 + label.length * 6.6
  return {
    w: width,
    s: `<g transform="translate(${x} ${y})"><rect width="${width}" height="22" rx="11" fill="#2e0d56" stroke="#ffffff33"/>
    <g transform="translate(12 11)">${art(g.art, { scale: 0.62 / 3 })}</g>${text(24, 15.5, label, { size: 11.5, fill: '#ffffff' })}</g>`
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


// ── 1. Upgrades (upgrades.md) ──────────────────────────────────────────────────────────────────

function upgrades() {
  const W = 1600
  let b = title(W, 'TECH TREE · UPGRADES', 'What you build on your planets, what defends them, and what your Orbiter 8 can carry') + legend(1270, 140)

  b += ribbon(30, 150, 'PLANET BUILDINGS · one after another')
  const cw = 190
  const gap = 30
  const x0 = 45
  const y0 = 270
  const at = (i) => x0 + i * (cw + gap)
  const line = UP['Planet buildings']
  line.forEach((c, i) => {
    b += card({ x: at(i), y: y0, w: cw, h: 270, title: c.Building, status: c.Status, art: art(c.Art), lines: detailLines(c.Details) })
    if (i < line.length - 1) b += arrow(at(i) + cw + 2, y0 + 96, at(i) + cw + gap - 2, y0 + 96)
  })
  b += text(x0, y0 - 10, 'Each building needs the one before. Credits are spent when it starts; goods come from the planet\'s storage.', { size: 13, fill: '#c3b3da' })

  const by = 610
  for (const br of UP.Branches) {
    const i = line.findIndex((c) => c.Building === br.Under)
    if (i < 0) throw new Error(`Branch ${br.Building}: no building "${br.Under}" (upgrades.md)`)
    b += elbow(at(i) + cw / 2, y0 + 270, at(i) + cw / 2, by - 2, br.Status !== 'now')
    b += card({ x: at(i), y: by, w: cw, h: 270, title: br.Building, status: br.Status, art: art(br.Art), lines: detailLines(br.Details) })
  }

  // Planet defenses: the rings, outermost first, and their rules
  const dy = 930
  b += ribbon(30, dy, 'PLANET DEFENSES · where a siege\'s hits land, in order')
  const layers = UP['Planet defenses']
  const cx = 330
  const cy = dy + 300
  const radii = layers.map((_, i) => 250 - i * (170 / Math.max(1, layers.length - 1)))
  b += `<g transform="translate(${cx} ${cy})">`
  layers.forEach((l, i) => {
    const dashed = /platform|moon/i.test(l.Layer)
    b += `<circle r="${radii[i]}" fill="none" stroke="${l.Color}" stroke-width="${/shield/i.test(l.Layer) ? 4 : 1.6}" ${dashed ? 'stroke-dasharray="6 6"' : ''} opacity="0.75"/>`
  })
  b += planetArt(6, { r: 62, rings: false })
  const ringOf = (re) => radii[layers.findIndex((l) => re.test(l.Layer))]
  if (ringOf(/platform/i)) for (const a of [-2.2, -0.2, 1.6]) b += `<g transform="translate(${Math.cos(a) * ringOf(/platform/i)} ${Math.sin(a) * ringOf(/platform/i)}) rotate(${(a * 180) / Math.PI + 90})">${art('orbital-platform', { scale: 0.5 })}</g>`
  if (ringOf(/moon/i)) {
    for (const a of [-1.2, 0.8, 2.6, 3.9]) b += `<g transform="translate(${Math.cos(a) * ringOf(/moon/i)} ${Math.sin(a) * ringOf(/moon/i)})"><g transform="scale(3)">${MOON}</g><rect x="-2" y="-24" width="4" height="12" fill="#ffd65c"/><circle cx="10" cy="-8" r="3" fill="#5cffc8"/></g>`
  }
  layers.forEach((l, i) => {
    b += `<g transform="translate(${-radii[i] + 6} ${i % 2 ? 14 : -6})">${text(0, 0, i + 1 + '', { size: 15, fill: l.Color, weight: 700 })}</g>`
  })
  b += '</g>'
  layers.forEach((l, i) => {
    const y = dy + 70 + i * 92
    b += `<g transform="translate(660 ${y})"><rect width="900" height="80" rx="10" fill="#12052acc" stroke="#ffffff22"/>
      <circle cx="34" cy="40" r="20" fill="none" stroke="${l.Color}" stroke-width="3"/>${text(34, 46, i + 1 + '', { size: 18, fill: l.Color, anchor: 'middle', weight: 700 })}
      ${text(70, 30, l.Layer, { size: 17, fill: '#ffffff', weight: 500 })}${text(70, 52, l.Rules, { size: 13, fill: '#d9cdee', max: 128 })}</g>`
  })
  b += text(660, dy + 70 + layers.length * 92 + 8, 'Rounds every 30 minutes; both sides fire with what they have at the start of a round. Allies at the star fire with the planet.', { size: 13, fill: '#c3b3da' })

  // The Orbiter 8
  const sy = 1620
  b += ribbon(30, sy, 'YOUR ORBITER 8 · one ship, six mounts')
  const s1 = sy + 70
  const [base, ...ups] = UP['Your Orbiter 8']
  b += card({ x: 45, y: s1, w: 230, h: 270, title: base.Upgrade, status: base.Status, art: art(base.Art, { scale: 1.05 }), artH: 120, lines: detailLines(base.Details) })
  ups.forEach((c, i) => {
    const x = 330 + i * 250
    b += card({ x, y: s1, w: 220, h: 270, title: c.Upgrade, status: c.Status, art: art(c.Art), lines: detailLines(c.Details) })
    if (i === 0) b += arrow(277, s1 + 104, x - 4, s1 + 104)
    else if (c.Status !== 'now') b += `<path d="M${x - 30} ${s1 + 104}H${x - 6}" stroke="#af6fff" stroke-width="2.5" stroke-dasharray="7 5" marker-end="url(#arrowDim)"/>`
  })
  const notes = notesOf(UP)
  const space = notes['How space is shared']
  if (space) {
    b += `<g transform="translate(1340 ${s1 + 10})"><rect width="220" height="250" rx="12" fill="#0b0218cc" stroke="#ffffff33"/>
    ${text(16, 30, 'How space is shared', { size: 15, fill: '#ffffff', weight: 500 })}${text(16, 56, space, { size: 13, max: 30 })}</g>`
  }

  const s2 = s1 + 330
  const parts = UP['Ship parts']
  b += `<path d="M160 ${s1 + 270}V${s2 - 30}H${45 + (parts.length - 1) * 220 + 95}" stroke="#c3b3da" stroke-width="2.5" fill="none"/>`
  b += text(180, s2 - 40, 'Fitted at an armory (Sol\'s I.S.S. sells ship parts at twice their cost) or from your planet\'s Autofactory', { size: 13, fill: '#c3b3da' })
  parts.forEach((p, i) => {
    const x = 45 + i * 220
    b += `<path d="M${x + 95} ${s2 - 30}V${s2 - 2}" stroke="#c3b3da" stroke-width="2.5" marker-end="url(#arrow)"/>`
    b += card({ x, y: s2, w: 190, h: 260, title: p.Part, art: art(p.Art, { scale: 0.95 }), lines: detailLines(p.Details) })
  })
  return svg(W, s2 + 300, b)
}

// ── 2. Crafting (crafting.md, with sources from planet-classes.md) ─────────────────────────────

function crafting() {
  const W = 1600
  let b = title(W, 'TECH TREE · CRAFTING', 'From what planets mine, to what the Autofactory builds, to where it\'s fitted') + legend(1270, 140)

  b += ribbon(30, 150, 'RAW GOODS · mined by settled planets')
  const raw = GOODS.filter((g) => g.kind === 'raw')
  const rw = 190
  const rx = (i) => 45 + i * (rw + 16)
  const ry = 270
  raw.forEach((g, i) => {
    const from = classes.filter((c) => c.sells.includes(g)).map((c) => c.name)
    b += card({ x: rx(i), y: ry, w: rw, h: 200, title: g.name, art: art(g.art, { scale: 0.87 }), artH: 70, lines: [{ t: 'From ' + from.join(', '), size: 12 }] })
  })

  const my = 560
  const made = CR['Manufactured goods']
  const mx = (i) => 120 + i * 300
  made.forEach((m, i) => {
    for (const [g] of goodsList(m.From)) {
      const ri = raw.indexOf(g)
      if (ri < 0) continue
      b += `<path d="M${rx(ri) + rw / 2} ${ry + 200}C${rx(ri) + rw / 2} ${ry + 250} ${mx(i) + 110} ${my - 60} ${mx(i) + 110} ${my - 4}" fill="none" stroke="#ffffff55" stroke-width="2" stroke-dasharray="2 5" stroke-linecap="round" marker-end="url(#arrowDim)"/>`
    }
    b += card({ x: mx(i), y: my, w: 220, h: 250, title: m.Good, art: art(goodNamed(m.Good).art, { scale: 0.87 }), artH: 74, status: m.Status, lines: detailLines(m.Details) })
  })
  b += ribbon(30, my - 50, 'MANUFACTURED GOODS', 320)
  const notes = notesOf(CR)
  const panel = (x, y, w, h, t) =>
    notes[t] ? `<g transform="translate(${x} ${y})"><rect width="${w}" height="${h}" rx="12" fill="#0b0218cc" stroke="#ffffff33"/>${text(16, 30, t, { size: 15, fill: '#ffffff', weight: 500 })}${text(16, 56, notes[t], { size: 13, max: Math.floor((w - 30) / 6.8) })}</g>` : ''
  b += panel(1340, my, 220, 250, 'Today')

  // The Autofactory, its kinds (planned), and its parts by tier
  const py = 920
  b += ribbon(30, py - 50, 'THE AUTOFACTORY · parts, by tier')
  const factory = UP.Branches.find((r) => r.Building === 'Autofactory')
  b += card({ x: 45, y: py + 10, w: 200, h: 250, title: 'Autofactory', status: factory?.Status ?? 'now', art: art(factory?.Art ?? 'autofactory'), lines: ['After Colony', 'Five orders at a time; goods paid when queued, built one after another'] })
  ;(CR['Autofactory kinds (planned, to design)'] ?? []).forEach((k, i) => {
    const y = py + 300 + i * 256
    if (i === 0) b += `<path d="M145 ${py + 262}V${y - 4}" stroke="#af6fff" stroke-width="2.5" stroke-dasharray="7 5" marker-end="url(#arrowDim)"/>`
    b += card({ x: 45, y, w: 200, h: 244, title: k.Kind.replace(' Autofactory', ''), status: k.Status, art: art(k.Art, { scale: 0.8 }), artH: 80, lines: detailLines(k.Details), size: 11.5 })
  })
  const FITS = { ship: 'Ship', planet: 'Planet', moons: 'Moons' }
  const tiers = []
  for (const p of CR['Autofactory parts']) {
    let t = tiers.find((x) => x.label === p.Tier)
    if (!t) tiers.push((t = { label: p.Tier, parts: [] }))
    t.parts.push(p)
  }
  const tx = (i) => 300 + i * 320
  tiers.forEach((tier, t) => {
    b += text(tx(t) + 140, py - 6, 'Tier ' + tier.label, { size: 15, fill: '#ffffff', anchor: 'middle', weight: 500 })
    tier.parts.forEach((p, i) => {
      const y = py + 10 + i * 190
      const w = 280
      const status = p.Status || 'now'
      const st = STATUS[status]
      let s = `<g transform="translate(${tx(t)} ${y})">`
      s += status !== 'now' ? `<rect x="1" y="1" width="${w - 2}" height="176" rx="12" fill="#12052acc" ${st.stroke}/>` : `<rect width="${w}" height="178" rx="12" fill="url(#cardEdge)"/><rect x="4" y="4" width="${w - 8}" height="170" rx="9" fill="#12052a"/>`
      s += `<rect x="10" y="10" width="86" height="86" rx="8" fill="url(#artBox)"/><g transform="translate(53 53) scale(0.8)">${art(p.Art, { scale: 0.9 })}</g>`
      s += text(106, 30, p.Part, { size: 15.5, fill: '#ffffff', weight: 500 })
      const sub = status !== 'now' ? p.Note : [p.Price && p.Time ? `${p.Price} · ${p.Time}` : '', p.Note].filter(Boolean).join(' · ')
      s += text(106, 50, sub, { size: 12.5, fill: status !== 'now' ? '#ffffffaa' : '#d9cdee', italic: status !== 'now', max: 26 })
      s += text(106, 88, 'Fits: ' + p.Fits.split(',').map((f) => FITS[f.trim()] ?? f.trim()).join(' · '), { size: 12, fill: YELLOW_LIGHT })
      s += chips(10, 108, goodsList(p.Recipe), w - 20).s
      if (status !== 'now') s += text(w - 12, 168, st.label, { size: 11, fill: status === 'planned' ? '#c9a2ff' : '#ffffffaa', anchor: 'end', italic: true })
      b += s + '</g>'
    })
    if (t === 0) b += arrow(247, py + 135, tx(0) - 6, py + 135)
    else b += arrow(tx(t) - 38, py + 90, tx(t) - 6, py + 90)
  })

  const kinds = CR['Autofactory kinds (planned, to design)']?.length ?? 0
  const gy = py + Math.max(10 + Math.max(...tiers.map((t) => t.parts.length)) * 190, 300 + kinds * 256) + 20
  b += ribbon(30, gy, 'WHERE PARTS GO')
  CR['Where parts go'].forEach((t, i) => {
    b += card({ x: 45 + i * 420, y: gy + 60, w: 390, h: 240, title: t.Target, art: art(t.Art, { r: 40 }), artH: 110, lines: detailLines(t.Details) })
  })
  b += panel(1310, gy + 60, 250, 240, 'Moving parts')
  return svg(W, gy + 340, b)
}

// ── 3. Planet classes (planet-classes.md) ──────────────────────────────────────────────────────

function planetClasses() {
  const W = 1600
  let b = title(W, 'PLANET CLASSES · WHAT THEY OFFER', 'What each class mines and makes, what its ports buy, and how many people it holds')
  const cw = 290
  const ch = 470
  const gap = 17
  classes.forEach((c, i) => {
    const x = 45 + (i % 5) * (cw + gap)
    const y = 150 + Math.floor(i / 5) * (ch + 24)
    let s = `<g transform="translate(${x} ${y})"><rect width="${cw}" height="${ch}" rx="14" fill="url(#cardEdge)"/><rect x="5" y="5" width="${cw - 10}" height="${ch - 10}" rx="11" fill="#12052a"/>`
    s += `<rect x="12" y="11" width="${cw - 24}" height="28" rx="14" fill="url(#pill)" stroke="#ffffff22"/>${text(cw / 2, 30, c.name, { size: 16, fill: '#ffffff', anchor: 'middle', weight: 500 })}`
    s += `<rect x="12" y="46" width="${cw - 24}" height="150" rx="8" fill="url(#artBox)"/><g transform="translate(${cw / 2} 121)">${art(c.art, { r: 52 })}</g>`
    s += text(16, 220, c.note, { size: 12.5, fill: '#c3b3da', italic: true, max: 42 })
    s += text(16, 240, `${c.people.toLocaleString('en-US')} people per unit of size`, { size: 12, fill: '#ffffffaa' })
    s += text(16, 270, 'Mines and makes · its ports sell', { size: 12.5, fill: YELLOW_LIGHT })
    s += chips(16, 278, c.sells.map((g) => [g]), cw - 32).s
    s += text(16, 336, 'Its ports buy', { size: 12.5, fill: '#d9cdee' })
    s += chips(16, 344, c.buys.map((g) => [g]), cw - 32).s
    s += `<rect x="12" y="${ch - 66}" width="${cw - 24}" height="54" rx="8" fill="none" stroke="#ffffff77" stroke-width="1.5" stroke-dasharray="2 5" stroke-linecap="round"/>`
    s += text(22, ch - 46, 'Idea: could also yield', { size: 12, fill: '#ffffffaa', italic: true })
    s += chips(22, ch - 38, c.idea.map((g) => [g]), cw - 44).s
    b += s + '</g>'
  })
  const rows = Math.ceil(classes.length / 5)
  const fy = 150 + rows * (ch + 24) + 10
  const eight = GOODS.filter((g) => g.kind !== 'intermediate')
  const notes = notesOf(PC)
  b += `<g transform="translate(45 ${fy})"><rect width="1510" height="200" rx="12" fill="#0b0218cc" stroke="#ffffff33"/>
    ${text(20, 32, 'The eight goods', { size: 16, fill: '#ffffff', weight: 500 })}
    ${eight.map((g, i) => `<g transform="translate(${30 + i * 140} 82)">${art(g.art, { scale: 0.53 })}${text(30, 6, g.name, { size: 13 })}${text(30, 24, g.kind, { size: 11.5, fill: g.kind === 'raw' ? '#c3b3da' : YELLOW_LIGHT })}</g>`).join('')}
    ${Object.values(notes).map((t, i) => text(20, 140 + i * 36, t, { size: 13, fill: '#d9cdee', max: 200 })).join('')}</g>`
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
