// The intro mockup's shared art: helpers, the city, the apartment, the hand, Minerva's face (drawn from the
// face widget's own pose data), the Minerva console and the three corporations' draft identities.
// build.mjs frames these into the moments, at desktop and phone size.
//
// The look is noir: near-black silhouettes, lit only by what gives light (the scanner, the TV, the
// terminal, the city through the glass), with thin rim light on their edges. Color is kept low: the ads and
// the corporations are muted, and the accents (yellow yours, pink needs you) keep their meanings.

import fs from 'node:fs'
import { ART_ORIGIN, PARTS } from '../../../orbiter-client/src/components/minerva/minerva-parts.js'
import {
  addOneOff,
  addState,
  compileOneOff,
  compileState,
  emptyPose
} from '../../../orbiter-client/src/components/minerva/minerva-poses.js'

// ---------------------------------------------------------------- palette (libs/palette.js) and the noir tones
export const C = {
  space: '#130e24',
  spaceDeep: '#0b0916',
  orbit: '#4a3f75',
  s1: '#1b1531',
  s2: '#251d40',
  s3: '#302651',
  border: '#3f3566',
  borderStrong: '#5a4c8c',
  text: '#f1eefa',
  text2: '#bdb5d4',
  text3: '#9088aa',
  brand500: '#7b4fe6',
  brand300: '#b9a0ff',
  lavender: '#c3b3da',
  lavenderLight: '#e6dcf5',
  button: '#3a1a66',
  pink: '#e1177c',
  pinkLight: '#ff6fb0',
  yellow: '#ccff00',
  yellowLight: '#ebff99',
  // noir
  black: '#030306',
  wall: '#0f0d17',
  wallLit: '#16131f',
  floor: '#08070d',
  rim: '#3a3352',
  rimLit: '#6a6188',
  smoke: '#d8d4e4'
}
export const FONT = "Ubuntu, 'Segoe UI', system-ui, sans-serif"
export const MONO = "'Ubuntu Mono', ui-monospace, monospace"

// ---------------------------------------------------------------- the three corporations (all draft)
// X the shareholder corporation, Y the family conglomerate, Z the space-born upstart (README, call I1).
// Their colors are muted, for the noir look: a slate blue, a sage, a cold teal with a dull copper spark.
const CURFEW_WHY = 'violence high, security response limited'
export const CORPS = {
  X: {
    key: 'X',
    name: 'Corp X',
    kind: 'Shareholder corporation · Old Earth',
    character: 'Contracts, lawyers, quarterly results. Your rights, in writing.',
    feels: '“Your rights are protected by contract.”',
    color: '#8395c4',
    band: '#181c2c',
    headFont: "Georgia, 'Times New Roman', serif",
    greeting: 'Account summary. Terms and conditions apply.',
    curfew:
      'Curfew, 22:00–05:00. Violent incidents in Block 7 exceed contract thresholds, and security response after hours is not guaranteed. Leaving voids your coverage under clause 14(c).',
    ad: { head: 'Read the contract.', head2: 'Then sign it.', sub: 'Corp X. Your rights, in writing.' }
  },
  Y: {
    key: 'Y',
    name: 'Corp Y',
    kind: 'Family conglomerate · Old Earth',
    character: 'Plans in generations. Loyalty for life. The group first.',
    feels: '“You’re taken care of, as long as you belong.”',
    color: '#86b09f',
    band: '#141d1a',
    headFont: FONT,
    greeting: 'Welcome home. We look after our own.',
    curfew:
      'Please stay inside until 05:00. There has been violence in the block tonight, and our guards can’t reach Block 7 in time. We worry when you don’t.',
    ad: { head: 'We plan', head2: 'in centuries.', sub: 'Corp Y. Belong, and be looked after.' }
  },
  Z: {
    key: 'Z',
    name: 'Corp Z',
    kind: 'Space-born upstart · The colonies',
    character: 'New money, new science, moving fast. Sometimes too fast.',
    feels: '“Get out there. We’ll figure out the rest.”',
    color: '#7fb5c2',
    accent: '#c49a78',
    band: '#121d21',
    headFont: MONO,
    greeting: 'hey. let’s get your numbers up.',
    curfew:
      'Stay in till 05:00. Block 7 gets rough after dark, and security out here is thin. Hang tight: we’ll get you off-world soon.',
    ad: { head: 'Born out there.', head2: 'Built fast.', sub: 'Corp Z. Tomorrow ships today.' }
  }
}
export const TICKER = `MINERVA PUBLIC NOTICE · Curfew 22:00–05:00 · Block 7: ${CURFEW_WHY} · Pilot program hiring`

// ---------------------------------------------------------------- tiny SVG helpers
export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const attrs = (o) =>
  Object.entries(o)
    .filter(([, v]) => v !== undefined && v !== null && v !== false)
    .map(([k, v]) => `${k}="${esc(v)}"`)
    .join(' ')

export function rect(x, y, w, h, o = {}) {
  return `<rect ${attrs({ x, y, width: w, height: h, rx: o.r, fill: o.fill ?? 'none', stroke: o.stroke, 'stroke-width': o.sw, 'stroke-dasharray': o.dash, opacity: o.opacity })}/>`
}
export function text(x, y, str, o = {}) {
  return `<text ${attrs({
    x,
    y,
    fill: o.fill ?? C.text,
    'font-size': o.size ?? 16,
    'font-family': o.family ?? FONT,
    'font-weight': o.weight,
    'text-anchor': o.anchor,
    'letter-spacing': o.ls,
    opacity: o.opacity,
    'font-style': o.italic ? 'italic' : undefined
  })}>${esc(str)}</text>`
}
export function wrap(str, chars) {
  const lines = []
  let line = ''
  for (const word of String(str).split(/\s+/)) {
    if (line && (line + ' ' + word).length > chars) {
      lines.push(line)
      line = word
    } else line = line ? line + ' ' + word : word
  }
  if (line) lines.push(line)
  return lines
}
/** A paragraph wrapped to `width` px (or `chars`): returns { svg, height }. */
export function para(x, y, str, o = {}) {
  const size = o.size ?? 16
  const lh = o.lh ?? size * 1.4
  const perChar = size * (o.family === MONO ? 0.6 : 0.52)
  const lines = wrap(str, o.chars ?? Math.floor((o.width ?? 600) / perChar))
  return { svg: lines.map((line, i) => text(x, y + i * lh, line, { ...o, size })).join(''), height: lines.length * lh }
}
/** The marker on placeholder copy. */
export function draft(x, y) {
  return (
    rect(x, y - 12, 44, 16, { r: 3, fill: '#00000066', stroke: C.text3, sw: 1, dash: '3 2' }) +
    text(x + 22, y, 'draft', { size: 10, fill: C.text2, anchor: 'middle', family: MONO })
  )
}
/** A game button: purple body; primary is lavender; never a yellow or pink body. */
export function button(x, y, w, h, label, o = {}) {
  const kind = o.kind ?? 'normal'
  const fill = kind === 'primary' ? C.lavender : kind === 'quiet' ? 'none' : C.button
  const stroke = kind === 'primary' ? C.lavender : (o.stroke ?? '#ffffff50')
  const color = kind === 'primary' ? '#1c0838' : C.text
  const size = o.size ?? Math.round(h * 0.4)
  let s = ''
  if (o.focus) s += rect(x - 5, y - 5, w + 10, h + 10, { r: (h + 10) / 2, stroke: C.brand300, sw: 2.5 })
  s += rect(x, y, w, h, { r: o.r ?? h / 2, fill, stroke, sw: 1.2 })
  return s + text(x + w / 2, y + h / 2 + size * 0.35, label, { size, fill: color, anchor: 'middle', weight: 500 })
}
export function padGlyph(cx, cy, letter, r = 10) {
  return (
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#00000066" stroke="${C.text2}" stroke-width="1.2"/>` +
    text(cx, cy + r * 0.42, letter, { size: r * 1.15, anchor: 'middle', weight: 700 })
  )
}
export function focusRing(x, y, w, h, o = {}) {
  return rect(x, y, w, h, { r: o.r ?? 14, stroke: C.brand300, sw: o.sw ?? 3, dash: o.focused ? undefined : '10 8' })
}
export function label(x, y, str, o = {}) {
  const size = o.size ?? 15
  const w = str.length * size * 0.56 + 26
  const x0 = x - w / 2
  return (
    rect(x0, y - size - 8, w, size + 16, {
      r: (size + 16) / 2,
      fill: o.focused ? C.lavender : '#0b0916e6',
      stroke: o.focused ? C.lavender : C.brand300,
      sw: 1.2
    }) + text(x, y + 1, str, { size, anchor: 'middle', fill: o.focused ? '#1c0838' : C.text, weight: 500 })
  )
}
export function rng(seed) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

// ---------------------------------------------------------------- Minerva's face, from the widget's poses
// The same parts, eyes and poses as orbiter-client/src/components/minerva/minerva-face.vue: a still of a
// state (and optionally a one-off part way through), so each screen shows what the widget would be doing.
const EYES = [
  { id: 'eyeL', cx: -27, cy: 4, angle: 10, mirror: false },
  { id: 'eyeR', cx: 27, cy: 4, angle: -10, mirror: true }
]
const DIRS = Object.fromEntries(
  PARTS.map((p) => {
    const l = Math.hypot(p.cx, p.cy)
    return [p.id, l > 1 ? [p.cx / l, p.cy / l] : [0, 0]]
  })
)
const f = (v) => Math.round(v * 100) / 100
/**
 * Minerva's face, `width` wide, centered on (cx, cy), in `state` (a key of STATES).
 * o.oneOff [name, progress] adds a one-off part way through; o.t picks the moment of the state's waves.
 */
export function face(cx, cy, width, state = 'idle', o = {}) {
  const pose = emptyPose()
  addState(pose, compileState(state), o.t ?? 400)
  if (o.oneOff) addOneOff(pose, compileOneOff(o.oneOff[0]), o.oneOff[1])
  const k = width / 180
  const fc = pose.face
  let s = `<g transform="translate(${cx} ${cy}) scale(${k}) translate(${f(fc.x)} ${f(fc.y)}) rotate(${f(fc.r)}) scale(${f(1 + fc.s)})">`
  if (o.glow !== false) s += `<circle r="95" fill="url(#face-glow)" opacity="${o.dim ? 0.3 : 1}"/>`
  for (const eye of EYES) {
    const e = pose[eye.id]
    const size = Math.max(0, 1 + e.s)
    const open = Math.min(1.6, Math.max(0, 1 + e.open))
    const bright = Math.min(2.2, Math.max(0, 1 + e.b))
    const turn = eye.angle + (eye.mirror ? -e.r : e.r)
    s += `<g transform="translate(${f(eye.cx + e.x)} ${f(eye.cy + e.y)}) rotate(${f(turn)}) scale(${f(size)} ${f(size * open)})"><ellipse rx="20" ry="9" fill="url(#owl-eye)" opacity="${f(Math.min(1, 0.6 * bright))}"/><ellipse rx="6" ry="2.3" fill="#fff" opacity="${f(Math.min(1, 0.75 * bright))}"/></g>`
  }
  s += `<g fill="${o.color ?? '#ffffff'}">`
  for (const part of PARTS) {
    const p = pose[part.id]
    const [dx, dy] = DIRS[part.id]
    const x = part.cx + p.x + dx * p.spread
    const y = part.cy + p.y + dy * p.spread
    const sx = (1 + p.s) * (1 + p.sx)
    const sy = (1 + p.s) * (1 + p.sy)
    const op = Math.min(1, Math.max(0, 1 + p.o)) * (o.dim ? 0.35 : 1)
    s += `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(p.r)}) scale(${f(sx)} ${f(sy)}) translate(${-part.cx} ${-part.cy})" opacity="${f(op)}"><path d="${part.d}" transform="translate(${-ART_ORIGIN} ${-ART_ORIGIN})"/></g>`
  }
  return s + `</g></g>`
}
/** A mockup tag naming the face widget's state (a note to Koda, not part of the design). */
export function faceTag(x, y, str, o = {}) {
  const w = str.length * 6.6 + 16
  const x0 = o.anchor === 'start' ? x : x - w / 2
  return (
    rect(x0, y - 12, w, 17, { r: 3, fill: '#000000aa', stroke: C.text3, sw: 1, dash: '3 2' }) +
    text(x0 + w / 2, y + 1, str, { size: 11, fill: C.text2, anchor: 'middle', family: MONO })
  )
}
/** The plain emblem (for tiny icons only). */
export function owl(cx, cy, width, color = '#ffffff') {
  return `<g transform="translate(${cx} ${cy}) scale(${width / 180})"><g fill="${color}" transform="translate(${-ART_ORIGIN} ${-ART_ORIGIN})">${PARTS.map((p) => `<path d="${p.d}"/>`).join('')}</g></g>`
}

// ---------------------------------------------------------------- corp logos (drafts)
export function corpLogo(key, cx, cy, size, color) {
  const c = color ?? CORPS[key].color
  const g = (inner) =>
    `<g transform="translate(${cx} ${cy}) scale(${size / 40})" fill="none" stroke="${c}" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round">${inner}</g>`
  if (key === 'X')
    return g(
      `<rect x="-17" y="-17" width="34" height="34" rx="3"/><path d="M-10 -10 L10 10 M10 -10 L-10 10"/><rect x="-11" y="-11" width="22" height="22" rx="1" stroke-width="1.4"/>`
    )
  if (key === 'Y') return g(`<circle cx="0" cy="-7" r="9"/><circle cx="-8" cy="6" r="9"/><circle cx="8" cy="6" r="9"/>`)
  return g(
    `<circle cx="-4" cy="4" r="9"/><path d="M-19 12 C -4 -2, 8 -10, 18 -16"/><circle cx="18" cy="-16" r="2.6" fill="${CORPS.Z.accent}" stroke="none"/>`
  )
}

// ---------------------------------------------------------------- shared defs
export function defs() {
  return `<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#040308"/><stop offset="0.7" stop-color="#0f0d18"/><stop offset="1" stop-color="#211c2c"/></linearGradient>
  <radialGradient id="owl-eye"><stop offset="0" stop-color="#fff" stop-opacity="0.95"/><stop offset="0.35" stop-color="#fff" stop-opacity="0.45"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
  <radialGradient id="face-glow"><stop offset="0" stop-color="#e6dcf5" stop-opacity="0.16"/><stop offset="1" stop-color="#e6dcf5" stop-opacity="0"/></radialGradient>
  <radialGradient id="light"><stop offset="0" stop-color="#d8d4e4" stop-opacity="0.22"/><stop offset="1" stop-color="#d8d4e4" stop-opacity="0"/></radialGradient>
  <radialGradient id="light-strong"><stop offset="0" stop-color="#e6dcf5" stop-opacity="0.45"/><stop offset="1" stop-color="#e6dcf5" stop-opacity="0"/></radialGradient>
  <radialGradient id="vapor"><stop offset="0" stop-color="#d8d4e4" stop-opacity="0.4"/><stop offset="1" stop-color="#d8d4e4" stop-opacity="0"/></radialGradient>
  <radialGradient id="earth-light" cx="35%" cy="30%" r="75%"><stop offset="0%" stop-color="#a8e6ff"/><stop offset="50%" stop-color="#2f7fd9"/><stop offset="100%" stop-color="#1a2a6e"/></radialGradient>
  <radialGradient id="earth-shade" cx="70%" cy="70%" r="80%"><stop offset="40%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity="0.65"/></radialGradient>
  <linearGradient id="ad-x" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3a4462"/><stop offset="1" stop-color="#11141f"/></linearGradient>
  <linearGradient id="ad-y" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#34483f"/><stop offset="1" stop-color="#0e1512"/></linearGradient>
  <linearGradient id="ad-z" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#14232a"/><stop offset="0.6" stop-color="#2a4a54"/><stop offset="1" stop-color="#4e3a2c"/></linearGradient>
  <linearGradient id="ad-junk1" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5a3434"/><stop offset="1" stop-color="#5e4632"/></linearGradient>
  <linearGradient id="ad-junk2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f5440"/><stop offset="1" stop-color="#1f2c22"/></linearGradient>
  <linearGradient id="ad-junk3" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#47395e"/><stop offset="1" stop-color="#1f1a33"/></linearGradient>
  <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d8d4e4" stop-opacity="0.07"/><stop offset="0.5" stop-color="#d8d4e4" stop-opacity="0.01"/><stop offset="1" stop-color="#d8d4e4" stop-opacity="0.05"/></linearGradient>
  <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#030306" stop-opacity="0.86"/><stop offset="1" stop-color="#030306" stop-opacity="0.94"/></linearGradient>
  <radialGradient id="blackout" gradientUnits="userSpaceOnUse" cx="1275" cy="480" r="330"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="0.3" stop-color="#000" stop-opacity="0.55"/><stop offset="0.75" stop-color="#000" stop-opacity="0.97"/><stop offset="1" stop-color="#000" stop-opacity="1"/></radialGradient>
</defs>`
}

// ---------------------------------------------------------------- the city
const ADS = [
  { fill: 'url(#ad-x)', corp: 'X', words: ['READ THE', 'CONTRACT'] },
  { fill: 'url(#ad-junk1)', words: ['NUTRI', 'PASTE'] },
  { fill: 'url(#ad-y)', corp: 'Y', words: ['WE PLAN IN', 'CENTURIES'] },
  { fill: 'url(#ad-junk2)', words: ['OXY+', 'BREATHE'] },
  { fill: 'url(#ad-z)', corp: 'Z', words: ['BORN', 'OUT THERE'] },
  { fill: 'url(#ad-junk3)', words: ['LOAN', 'NOW'] }
]
function billboard(x, y, w, h, ad) {
  const size = Math.min(h * 0.28, (w / Math.max(...ad.words.map((s) => s.length))) * 1.4)
  return (
    `<ellipse cx="${x + w / 2}" cy="${y + h / 2}" rx="${w * 0.8}" ry="${h * 0.9}" fill="url(#light)"/>` +
    rect(x - 3, y - 3, w + 6, h + 6, { fill: C.black }) +
    rect(x, y, w, h, { fill: ad.fill }) +
    ad.words
      .map((s, i) =>
        text(x + w / 2, y + h / 2 + (i - 0.5) * size * 1.05 + size * 0.38, s, {
          size,
          anchor: 'middle',
          weight: 700,
          fill: C.smoke,
          opacity: 0.85,
          ls: 1
        })
      )
      .join('') +
    (ad.corp ? corpLogo(ad.corp, x + w - h * 0.17, y + h * 0.17, h * 0.2, '#d8d4e4aa') : '')
  )
}
/** The city at night in (x, y, w, h): smog sky, far towers, near black towers with muted billboards. */
export function city(x, y, w, h, o = {}) {
  const zoom = o.zoom ?? 1
  const r = rng(o.seed ?? 7)
  let s = rect(x, y, w, h, { fill: 'url(#sky)' })
  s += `<ellipse cx="${x + w / 2}" cy="${y + h * 0.85}" rx="${w * 0.8}" ry="${h * 0.3}" fill="url(#light)"/>`
  let bx = x - 20
  while (bx < x + w) {
    const bw = (40 + r() * 70) * zoom
    const bh = h * (0.35 + r() * 0.4)
    s += rect(bx, y + h - bh, bw, bh, { fill: '#0b0a12' })
    for (let wy = y + h - bh + 12 * zoom; wy < y + h - 10; wy += 14 * zoom)
      for (let wx = bx + 6 * zoom; wx < bx + bw - 8 * zoom; wx += 11 * zoom)
        if (r() < 0.1) s += rect(wx, wy, 4 * zoom, 5 * zoom, { fill: r() < 0.7 ? '#4a4560' : '#7a6a54', opacity: 0.6 })
    bx += bw + 4 * zoom
  }
  for (let i = 0; i < 3; i++) {
    const ty = y + h * (0.2 + i * 0.1)
    for (let j = 0; j < 7; j++)
      s += rect(x + r() * w, ty + r() * 6, 6 * zoom, 2 * zoom, { fill: C.smoke, opacity: 0.35 })
  }
  bx = x - 30 * zoom
  let ad = o.adOffset ?? 0
  while (bx < x + w) {
    const bw = (90 + r() * 120) * zoom
    const bh = h * (0.22 + r() * 0.3) * (zoom > 1 ? 1.15 : 1)
    s += rect(bx, y + h - bh, bw, bh + 2, { fill: C.black })
    for (let wy = y + h - bh + 18 * zoom; wy < y + h - 10; wy += 22 * zoom)
      for (let wx = bx + 10 * zoom; wx < bx + bw - 14 * zoom; wx += 18 * zoom)
        if (r() < 0.06) s += rect(wx, wy, 6 * zoom, 8 * zoom, { fill: '#5a5470', opacity: 0.4 })
    if (r() < 0.7 && bw > 100 * zoom) {
      const aw = bw * 0.72
      const ah = Math.min(aw * 0.55, bh * 0.4)
      s += billboard(bx + (bw - aw) / 2, y + h - bh - ah * 0.6, aw, ah, ADS[ad++ % ADS.length])
    }
    bx += bw + 10 * zoom
  }
  return s
}

// ---------------------------------------------------------------- the apartment (world coordinates)
// One room, 1600 × 1000, floor at 820. Left to right: the sliding glass door to the balcony (running off
// the left edge), a mattress under an old poster, the TV on a crate, the desk with the housing computer,
// a dead plant, the ID scanner, and the door out (running off the right edge).
export const ROOM = { w: 1600, h: 1000, floor: 820 }
export const HOTSPOTS = {
  balcony: { x: 0, y: 190, w: 390, h: 640, label: 'Balcony' },
  tv: { x: 690, y: 495, w: 290, h: 190, label: 'TV' },
  terminal: { x: 985, y: 520, w: 190, h: 150, label: 'Terminal' },
  door: { x: 1215, y: 250, w: 385, h: 580, label: 'Door · ID scanner' }
}
export const SCANNER = { x: 1240, y: 420, cx: 1275, cy: 480 }
const F = ROOM.floor
const SIL = C.black

/** A thin rim of light along a silhouette's top edge. */
const rimTop = (x, y, w, color = C.rim) => rect(x, y, w, 2, { fill: color })

/**
 * The room. o.lights false: the power is off and everything is black but the scanner (and its face).
 * o.tv: the corporation whose ad is on the TV (lights on). o.scanner: the scanner's face state.
 */
export function room(o = {}) {
  const lit = o.lights !== false
  let s = ''
  s += rect(-200, 0, ROOM.w + 400, F, { fill: lit ? C.wallLit : C.wall })
  for (let x = 160; x < ROOM.w; x += 160) s += rect(x, 70, 2, F - 70, { fill: '#1a1726' })
  s += rect(-200, 0, ROOM.w + 400, 70, { fill: '#0a0910' })
  s +=
    rect(-200, F, ROOM.w + 400, ROOM.h - F, { fill: C.floor }) + rimTop(-200, F, ROOM.w + 400, lit ? C.rimLit : C.rim)
  if (lit) {
    // the ceiling strip, cold, and the pools of light it and the screens throw
    s += rect(560, 76, 260, 6, { r: 3, fill: C.smoke, opacity: 0.8 })
    s += `<ellipse cx="690" cy="300" rx="420" ry="300" fill="url(#light)"/>`
    s += `<ellipse cx="835" cy="590" rx="230" ry="170" fill="url(#light)"/><ellipse cx="1080" cy="585" rx="150" ry="110" fill="url(#light)"/>`
  }

  // ---- the balcony door, left, running off the edge: glass, the city, the railing, the terminal on it
  s += `<clipPath id="glass-clip"><rect x="-60" y="220" width="400" height="${F - 225}"/></clipPath>`
  s += `<g clip-path="url(#glass-clip)">${city(-60, 220, 400, F - 220, { seed: 11, adOffset: o.adOffset ?? 0 })}`
  // the railing, and the terminal mounted on it
  s += rect(-60, 690, 400, 10, { fill: C.black }) + rimTop(-60, 690, 400, C.rim)
  s += Array.from({ length: 13 }, (_, i) => rect(-54 + i * 32, 700, 5, 130, { fill: C.black })).join('')
  s +=
    rect(220, 640, 70, 50, { r: 5, fill: '#0c0a14', stroke: C.rimLit, sw: 1.5 }) +
    rect(227, 646, 56, 30, { r: 2, fill: C.smoke, opacity: 0.65 }) +
    rect(248, 688, 14, 8, { fill: C.black })
  s += `</g>`
  s += rect(-60, 220, 400, F - 220, { fill: 'url(#glass)' })
  s += rect(-70, 210, 420, F - 205, { stroke: '#1d1a28', sw: 12 }) + rect(140, 216, 10, F - 216, { fill: '#1d1a28' })
  s += `<path d="M330 200 q20 200 0 400 q-10 120 30 220 l50 0 q-30 -110 -20 -230 q10 -180 -20 -390z" fill="#0c0a13" stroke="${C.rim}" stroke-width="2"/>`

  // ---- the mattress and the poster
  s += rect(450, 300, 170, 230, { r: 3, fill: '#14121c', stroke: C.rim, sw: 1.5 })
  s += `<g opacity="0.55">${rect(462, 312, 146, 160, { fill: '#1c2030' })}<circle cx="535" cy="400" r="34" fill="#8a8070" opacity="0.6"/><path d="M480 450 L570 360" stroke="${C.smoke}" stroke-width="3"/></g>`
  s +=
    text(535, 496, 'ORBITER 8', { size: 15, anchor: 'middle', fill: C.text3, weight: 700, ls: 2 }) +
    text(535, 515, 'FIRST RETURN · 2131', { size: 10, anchor: 'middle', fill: '#5a5470' })
  s += `<path d="M430 ${F} l0 -46 q0 -12 14 -12 l220 0 q14 0 14 12 l0 46z" fill="${SIL}" stroke="${C.rim}" stroke-width="2"/>`
  s += `<path d="M450 ${F - 56} q30 -26 70 -6 q-30 14 -70 6z M530 ${F - 58} q50 -30 110 -8 q20 10 20 10 l-130 0z" fill="#0b0a12" stroke="${C.rim}" stroke-width="1.5"/>`

  // ---- the TV on a crate
  s +=
    rect(740, 690, 190, F - 690, { fill: SIL, stroke: C.rim, sw: 1.5 }) +
    `<path d="M740 730 L930 730 M740 780 L930 780" stroke="${C.rim}" stroke-width="1.5"/>`
  s += rect(708, 505, 254, 170, { r: 8, fill: SIL, stroke: lit ? C.rimLit : C.rim, sw: 3 })
  if (lit) s += `<svg x="718" y="515" width="234" height="150" viewBox="0 0 468 300">${tvAdArt(o.tv ?? 'X')}</svg>`
  s += rect(820, 676, 30, 14, { fill: SIL })
  s +=
    `<path d="M760 690 l10 -22 30 0 6 22z" fill="#0b0a12" stroke="${C.rim}" stroke-width="1.2"/>` +
    rect(890, 668, 12, 22, { r: 2, fill: '#1a1726' }) +
    rect(906, 672, 12, 18, { r: 2, fill: '#1a1726' })

  // ---- the desk and the housing computer (a Minerva terminal: her face on it when the power's on)
  s +=
    rect(990, 655, 200, 14, { fill: SIL, stroke: C.rim, sw: 1.5 }) +
    rect(1000, 669, 10, F - 669, { fill: SIL }) +
    rect(1170, 669, 10, F - 669, { fill: SIL })
  s +=
    rect(1005, 535, 150, 100, { r: 6, fill: SIL, stroke: lit ? C.rimLit : C.rim, sw: 2.5 }) +
    rect(1070, 635, 20, 20, { fill: SIL })
  if (lit) s += rect(1013, 543, 134, 84, { r: 3, fill: '#0c0a14' }) + face(1080, 582, 84, 'idle')
  s += rect(1030, 642, 90, 8, { r: 2, fill: '#121019' })
  s += `<g transform="rotate(-8 1150 645)">${rect(1130, 632, 40, 22, { fill: C.smoke, opacity: lit ? 0.55 : 0.1 })}</g>`
  s += `<path d="M1060 ${F} l0 -80 l70 0 l0 80 M1050 740 l90 0 M1128 740 l0 -110 q0 -10 -10 -10" fill="none" stroke="${SIL}" stroke-width="10"/>`

  // ---- the dead plant
  s += `<path d="M1190 ${F} l6 -40 l30 0 l6 40z" fill="#0b0a12" stroke="${C.rim}" stroke-width="1.2"/><path d="M1211 780 q-12 -30 -30 -24 M1211 780 q4 -40 24 -40 M1211 780 q-2 -26 -14 -50" stroke="${C.rim}" stroke-width="3" fill="none"/>`

  // ---- the door out, right, running off the edge
  s += rect(1360, 270, 300, F - 270, { fill: '#0a0910', stroke: lit ? C.rimLit : C.rim, sw: 5 })
  s +=
    rect(1380, 300, 220, 200, { r: 4, stroke: '#1d1a28', sw: 2 }) +
    rect(1380, 520, 220, 270, { r: 4, stroke: '#1d1a28', sw: 2 })
  s += rect(1385, 540, 14, 60, { r: 6, fill: C.rim })
  s +=
    rect(1440, 230, 80, 26, { r: 4, fill: SIL, stroke: C.rim, sw: 1.5 }) +
    text(1480, 249, '7-2216', { size: 15, anchor: 'middle', fill: C.text3, family: MONO })
  s += `<circle cx="1392" cy="520" r="5" fill="${C.brand300}" opacity="${lit ? 1 : 0.5}"/>`
  s += `<path d="M1430 ${F} q10 -22 40 -18 l18 18z M1480 ${F} q10 -20 38 -16 l16 16z" fill="${SIL}" stroke="${C.rim}" stroke-width="1"/>`

  // the power's off: black, but for the scanner's glow
  if (!lit) s += rect(-200, 0, ROOM.w + 400, ROOM.h, { fill: 'url(#blackout)' })
  s += scanner(o.scanner ?? (lit ? 'idle' : 'offline'), !lit)
  return s
}
/** The ID scanner by the door: a small Minerva device, its screen her face. */
function scanner(state, glowing) {
  const { x, y } = SCANNER
  let s = ''
  if (glowing) s += `<ellipse cx="${x + 35}" cy="${y + 50}" rx="150" ry="150" fill="url(#light-strong)"/>`
  s += rect(x, y, 70, 120, { r: 10, fill: '#0c0a14', stroke: C.rimLit, sw: 2 })
  s += rect(x + 8, y + 10, 54, 46, { r: 5, fill: '#060509' }) + face(x + 35, y + 33, 50, state, { glow: false })
  s += rect(x + 13, y + 72, 44, 6, { r: 3, fill: C.smoke, opacity: glowing ? 0.7 : 0.25 })
  s += text(x + 35, y + 103, 'ID', { size: 13, anchor: 'middle', fill: C.text3, weight: 700 })
  return s
}

/** What the TV shows: a corporation's ad in a 468 × 300 frame, muted. */
export function tvAdArt(key, o = {}) {
  const corp = CORPS[key]
  let s = rect(0, 0, 468, 300, { fill: `url(#ad-${key.toLowerCase()})` })
  const ink = C.smoke
  if (key === 'X') {
    s += Array.from({ length: 5 }, (_, i) =>
      rect(40 + i * 26, 300 - 70 - (i % 3) * 36, 22, 70 + (i % 3) * 36, { fill: ink, opacity: 0.08 })
    ).join('')
    s += `<g transform="rotate(-6 340 200)" opacity="0.85">${rect(280, 120, 130, 160, { fill: ink })}${Array.from({ length: 6 }, (_, i) => rect(296, 140 + i * 17, 98 - (i % 2) * 26, 5, { fill: '#5a6380' })).join('')}<path d="M298 256 q18 -16 30 0 t32 -4" stroke="#20263a" stroke-width="3" fill="none"/></g>`
  } else if (key === 'Y') {
    s += `<path d="M250 200 L340 140 L430 200" stroke="${ink}" stroke-width="7" fill="none" stroke-linejoin="round" opacity="0.8"/>`
    for (const [x, hgt] of [
      [290, 84],
      [340, 66],
      [384, 48]
    ])
      s += `<g opacity="0.8"><circle cx="${x}" cy="${300 - hgt - 38}" r="${hgt * 0.13}" fill="${ink}"/>${rect(x - hgt * 0.14, 300 - hgt - 24, hgt * 0.28, hgt, { r: hgt * 0.1, fill: ink })}</g>`
  } else {
    s += `<circle cx="330" cy="225" r="52" fill="${CORPS.Z.accent}" opacity="0.55"/><ellipse cx="330" cy="225" rx="92" ry="17" fill="none" stroke="${ink}" stroke-width="4" opacity="0.7" transform="rotate(-14 330 225)"/>`
    s += `<path d="M120 270 C 180 230, 230 200, 280 190" stroke="${ink}" stroke-width="3" stroke-dasharray="2 10" fill="none" opacity="0.7"/>`
  }
  if (o.copy !== false) {
    const fam = corp.headFont
    const size = key === 'Z' ? 30 : 34
    s += text(28, 64, corp.ad.head, { size, fill: ink, weight: 700, family: fam })
    s += text(28, 106, corp.ad.head2, { size, fill: ink, weight: 700, family: fam })
    s += text(28, 142, corp.ad.sub, { size: 16, fill: ink, opacity: 0.75, family: fam })
  }
  return s + corpLogo(key, 432, 262, 38, '#d8d4e4cc')
}

// ---------------------------------------------------------------- the player's hand
export function hand(x, y, scale = 1, o = {}) {
  const point =
    'M0 0 c8 -3 16 2 17 11 l6 74 c4 -6 14 -9 22 -4 c5 -8 17 -10 25 -3 c6 -6 18 -6 24 2 c8 10 9 30 6 52 c-4 30 -12 52 -24 76 l-10 60 l-120 0 l6 -70 c-22 -20 -38 -44 -50 -66 c-6 -12 2 -24 16 -20 c10 4 22 18 34 30 l-8 -128 c-1 -8 4 -13 6 -14z'
  const hold =
    'M10 40 c10 -6 30 -6 44 2 c14 -4 28 0 34 12 c10 0 20 10 18 26 c-2 26 -10 50 -24 72 l-10 60 l-120 0 l6 -70 c-20 -24 -30 -50 -30 -72 c0 -20 16 -30 40 -34 c14 -2 30 -1 42 4z'
  return `<g transform="translate(${x} ${y}) scale(${scale})"><path d="${o.pose === 'hold' ? hold : point}" fill="${C.black}" stroke="${C.rimLit}" stroke-width="2.5" stroke-linejoin="round"/>${o.extra ?? ''}</g>`
}

// ---------------------------------------------------------------- the ship and Earth (the game's art)
const shipFile = fs.readFileSync(
  new URL('../../../orbiter-client/src/components/star-map/sprites/ship.svg.vue', import.meta.url),
  'utf8'
)
const SHIP_PATH = shipFile.match(/d="([^"]+)"/)[1]
export function ship(cx, cy, size, fill = '#ffffff', o = {}) {
  return `<g transform="translate(${cx} ${cy}) rotate(${o.rotate ?? 0}) scale(${size / 4600}) translate(-2300 -2300)"><path d="${SHIP_PATH}" fill="${fill}" ${o.stroke ? `stroke="${o.stroke}" stroke-width="${o.sw ?? 60}"` : ''}/></g>`
}
export function earth(cx, cy, r) {
  return `<g transform="translate(${cx} ${cy}) scale(${r / 180})"><clipPath id="earth-disc"><circle r="180"/></clipPath>
  <circle r="236" fill="none" stroke="#7fd4ff" stroke-width="44" opacity="0.06"/><circle r="180" fill="url(#earth-light)" stroke="#a8e6ff" stroke-width="2" stroke-opacity="0.7"/>
  <g clip-path="url(#earth-disc)"><g fill="#5fd27e" fill-opacity="0.42" transform="scale(18)"><rect x="-2" y="-8" width="12" height="2" rx="1"/><rect x="0" y="-6" width="14" height="2" rx="1"/><rect x="-9" y="-7" width="6" height="2" rx="1"/><rect x="-10" y="-4" width="10" height="2" rx="1"/><rect x="-1" y="-2" width="12" height="2" rx="1"/><rect x="-12" y="1" width="12" height="2" rx="1"/><rect x="-10" y="3" width="14" height="2" rx="1"/><rect x="-4" y="4" width="14" height="2" rx="1"/><rect x="0" y="6" width="6" height="2" rx="1"/><rect x="-10" y="9" width="12" height="2" rx="1"/></g></g>
  <circle r="180" fill="url(#earth-shade)"/></g>`
}

// ---------------------------------------------------------------- the Minerva console, with her face at its center
export const TABS = ['Account', 'Health', 'Mail', 'Jobs']
/**
 * The console: Minerva's face and voice are its spine. Desktop: a left column with her face large, her
 * name, what she's saying, then the tabs; the content to the right. Phone: her face and line in a row at
 * the top, the content under them, the tabs along the bottom.
 * The subscribed corporation's skin is a thin band across the top: its color, logo, type and name.
 * o: corp (null: first boot), say (her line), state (her face's state), tab, badges, tabs (false: none),
 *    phone, oneOff.
 */
export function consoleFrame(x, y, w, h, o = {}) {
  const corp = o.corp ? CORPS[o.corp] : null
  const phone = o.phone
  let s = rect(x, y, w, h, { r: phone ? 0 : 18, fill: '#120f1c', stroke: phone ? undefined : C.border, sw: 1.5 })
  // the corporation's band
  const bandH = 46
  s += `<path d="M${x} ${y + bandH} L${x} ${y + (phone ? 0 : 18)} ${phone ? '' : `Q${x} ${y} ${x + 18} ${y}`} L${x + w - (phone ? 0 : 18)} ${y} ${phone ? '' : `Q${x + w} ${y} ${x + w} ${y + 18}`} L${x + w} ${y + bandH} Z" fill="${corp ? corp.band : '#14111e'}"/>`
  s += rect(x, y + bandH - 2, w, 2, { fill: corp ? corp.color : C.border, opacity: corp ? 0.8 : 1 })
  if (corp)
    s +=
      corpLogo(corp.key, x + 30, y + bandH / 2, 22) +
      text(x + 52, y + bandH / 2 + 5, o.bandText ?? `${corp.name} housing · Unit 7-2216`, {
        size: 14,
        fill: C.text2,
        family: corp.headFont
      })
  else
    s += text(x + 20, y + bandH / 2 + 5, o.bandText ?? 'Housing unit 7-2216 · first boot', { size: 14, fill: C.text2 })
  s += button(x + w - (phone ? 46 : 60), y + 7, phone ? 36 : 46, 32, '✕', {
    kind: 'quiet',
    size: 16,
    stroke: '#ffffff40'
  })
  if (!phone) s += padGlyph(x + w - 76, y + bandH / 2, 'B', 9)
  const tabs = o.tabs === false ? [] : TABS
  let content
  if (phone) {
    // her face and her line, across the top
    const fy = y + bandH
    s += rect(x, fy, w, 132, { fill: '#0d0b15' }) + rect(x, fy + 132, w, 1, { fill: C.border })
    s += face(x + 74, fy + 62, 124, o.state ?? 'talking', { oneOff: o.oneOff })
    s += text(x + 74, fy + 122, 'MINERVA', { size: 10, ls: 3, anchor: 'middle', fill: C.text3, weight: 700 })
    s += para(x + 150, fy + 32, o.say ?? '', { size: 15, width: w - 166, lh: 20 }).svg
    const barH = tabs.length ? 76 : 0
    if (tabs.length) {
      s += rect(x, y + h - barH, w, barH, { fill: '#0d0b15' }) + rect(x, y + h - barH, w, 1, { fill: C.border })
      const tw = w / tabs.length
      tabs.forEach((tab, i) => {
        const on = tab === o.tab
        s += rect(x + i * tw + 6, y + h - barH + 8, tw - 12, barH - 22, {
          r: 14,
          fill: on ? C.lavender : 'none',
          stroke: on ? undefined : '#ffffff30',
          sw: 1
        })
        s += text(x + i * tw + tw / 2, y + h - barH + 8 + (barH - 22) / 2 + 5, tab, {
          size: 14,
          anchor: 'middle',
          fill: on ? '#1c0838' : C.text,
          weight: 500
        })
        if (o.badges?.[tab]) s += badge(x + i * tw + tw - 16, y + h - barH + 12, o.badges[tab])
      })
    }
    content = { x: x + 18, y: fy + 132 + 20, w: w - 36, h: h - bandH - 132 - barH - 30 }
  } else {
    // her column: the face, large, her name, her line, then the tabs
    const colW = 320
    s +=
      rect(x + 1, y + bandH, colW, h - bandH - 1, { fill: '#0d0b15' }) +
      rect(x + colW, y + bandH, 1, h - bandH, { fill: C.border })
    s += face(x + colW / 2, y + bandH + 108, 230, o.state ?? 'talking', { oneOff: o.oneOff })
    s += text(x + colW / 2, y + bandH + 200, 'MINERVA', {
      size: 13,
      ls: 4,
      anchor: 'middle',
      fill: C.text3,
      weight: 700
    })
    const said = para(x + 28, y + bandH + 240, o.say ?? '', { size: 18, width: colW - 56, lh: 25 })
    s += said.svg
    const ty = Math.max(y + bandH + 270 + said.height, y + h - 24 - tabs.length * 64)
    tabs.forEach((tab, i) => {
      const on = tab === o.tab
      s += button(x + 24, ty + i * 64, colW - 48, 52, tab, {
        kind: on ? 'primary' : 'normal',
        size: 18,
        r: 14,
        focus: on && o.focusTab
      })
      if (o.badges?.[tab]) s += badge(x + colW - 34, ty + i * 64 + 6, o.badges[tab])
    })
    content = { x: x + colW + 30, y: y + bandH + 30, w: w - colW - 60, h: h - bandH - 54 }
  }
  return { svg: s, content }
}
/** A count badge: pink, because what it counts needs you (overdue bills). */
export function badge(cx, cy, n) {
  return (
    `<circle cx="${cx}" cy="${cy}" r="11" fill="${C.pink}"/>` +
    text(cx, cy + 4.5, String(n), { size: 12, anchor: 'middle', weight: 700 })
  )
}
/**
 * A notice from Minerva while the console is closed: her face (small, as in a HUD corner) and a line.
 * `attention` frames it in pink (it needs you).
 */
export function notice(x, y, w, title, body, o = {}) {
  const size = o.size ?? 15
  const fw = o.faceW ?? 84
  const lines = para(0, 0, body, { size, width: w - fw - 40 })
  const h = Math.max(fw * 0.7 + 24, 46 + lines.height)
  let s = rect(x, y, w, h, {
    r: 12,
    fill: '#0b0912f2',
    stroke: o.attention ? C.pink : C.border,
    sw: o.attention ? 2 : 1.2
  })
  s += face(x + 12 + fw / 2, y + h / 2, fw, o.state ?? 'talking', { oneOff: o.oneOff })
  s += text(x + fw + 26, y + 28, title, { size: size + 1, weight: 700, fill: o.attention ? C.pinkLight : C.text })
  s += `<g transform="translate(${x + fw + 26} ${y + 50})">${lines.svg.replaceAll(`fill="${C.text}"`, `fill="${C.text2}"`)}</g>`
  if (o.draft !== false) s += draft(x + w - 52, y + 24)
  return s
}

// ---------------------------------------------------------------- the frame around every screen
export function statusLine(W, o = {}) {
  const phone = W < 600
  let s = rect(0, 0, W, phone ? 44 : 48, { fill: C.black, opacity: 0.8 })
  const line = phone
    ? o.dark
      ? '23:41 · No power'
      : '23:41 · Curfew'
    : o.dark
      ? '23:41 · Unit 7-2216 · No power'
      : `23:41 · Curfew: ${CURFEW_WHY} · Block 7 · Unit 7-2216`
  s += text(phone ? 16 : 24, phone ? 28 : 30, line, { size: phone ? 13 : 14, fill: C.text2, family: MONO })
  if (o.skip !== false)
    s += button(W - (phone ? 112 : 150), phone ? 8 : 9, phone ? 100 : 130, phone ? 28 : 30, 'Skip intro', {
      kind: 'quiet',
      size: phone ? 12 : 13,
      stroke: '#ffffff40'
    })
  return s
}
/** A note to Koda on the mockup itself (not part of the design). */
export function note(x, y, w, lines, o = {}) {
  const size = o.size ?? 13
  const lh = size * 1.35
  const all = lines.flatMap((l) => wrap(l, Math.floor((w - 24) / (size * 0.62))))
  const h = all.length * lh + 18
  return (
    rect(x, y, w, h, { r: 8, fill: '#000000c0', stroke: '#9088aa', sw: 1, dash: '4 3' }) +
    all.map((l, i) => text(x + 12, y + 14 + size * 0.9 + i * lh, l, { size, fill: '#d8d2ea', family: MONO })).join('')
  )
}
export function frame(W, H, body, title) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<title>${esc(title)}</title>
${defs()}
${rect(0, 0, W, H, { fill: C.black })}
${body}
</svg>
`
}
