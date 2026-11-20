// The intro's world, in isometric (Koda, 2026-11-20; mockups in docs/mockups/intro-zoom/): the city,
// Block 7's tower, and unit 7-2216 cut open in it. One world, seen through one camera; using a thing is
// the camera zooming into it, never a change of scene.
//
// Everything here is in "world-screen" coordinates (WS): the isometric projection at K0 px per world unit,
// with the world's origin at (0, 0). World units are about half a meter; x runs to the screen's lower
// right, y to its lower left, z up. The camera (intro-screen.vue) is a CSS translate and scale of this one
// plane, so everything placed in it (the city's bitmaps, the room's SVG, Minerva's faces, the TV's
// picture, the hotspots) moves together.
//
// How it stays fast: the city and the tower's outside never change, so they're drawn once, from the
// same seed every time, into bitmaps at three levels of detail (cityLayers) and the camera only slides and
// scales them. Only the room (a few dozen shapes) is live SVG, and only a handful of small things move.

import { CORP_LOOKS, TICKER } from './intro'

export const K0 = 60
const CS = Math.cos(Math.PI / 6)
const SN = 0.5
const r2 = (v) => Math.round(v * 100) / 100

/** A world point in WS px. */
export const ws = (x, y, z = 0) => [(x - y) * CS * K0, (x + y) * SN * K0 - z * K0]
const pts = (a) => a.map((p) => `${r2(p[0])},${r2(p[1])}`).join(' ')
const mat = (a, b, c, d, [e, f]) => `matrix(${r2(a)} ${r2(b)} ${r2(c)} ${r2(d)} ${r2(e)} ${r2(f)})`
/** Flat art on the plane y = y1 (facing the screen's lower left), origin (x0, y1, zTop); local units are world units, u along +x, v down. */
const onY = (x0, y1, zTop, inner) => `<g transform="${mat(CS * K0, SN * K0, 0, K0, ws(x0, y1, zTop))}">${inner}</g>`
/** Flat art on the plane x = x1 (facing the lower right), origin (x1, yMax, zTop); u along −y, v down. */
const onX = (x1, yMax, zTop, inner) =>
  `<g transform="${mat(CS * K0, -SN * K0, 0, K0, ws(x1, yMax, zTop))}">${inner}</g>`
/** Flat art on the ground plane z, origin (x0, y0); u along +x, v along +y. */
const onZ = (x0, y0, z, inner) =>
  `<g transform="${mat(CS * K0, SN * K0, -CS * K0, SN * K0, ws(x0, y0, z))}">${inner}</g>`
/** The same planes as CSS transforms, for HTML placed on them (Minerva's faces, the TV's picture): the element's px are world units × K0. */
export const cssOnY = (x0, y1, zTop) => {
  const [e, f] = ws(x0, y1, zTop)
  return `matrix(${r2(CS)}, ${SN}, 0, 1, ${r2(e)}, ${r2(f)})`
}

// ---------------------------------------------------------------- tiny SVG helpers
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
function rect(x, y, w, h, o = {}) {
  let s = `<rect x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="${r2(h)}"`
  if (o.r) s += ` rx="${r2(o.r)}"`
  s += ` fill="${o.fill ?? 'none'}"`
  if (o.stroke) s += ` stroke="${o.stroke}" stroke-width="${o.sw ?? 1}"`
  if (o.opacity !== undefined) s += ` opacity="${o.opacity}"`
  return s + '/>'
}
function text(x, y, str, o = {}) {
  return `<text x="${r2(x)}" y="${r2(y)}" font-size="${r2(o.size ?? 16)}" fill="${o.fill ?? '#f1eefa'}" font-family="${o.family ?? 'Ubuntu, system-ui, sans-serif'}"${o.weight ? ` font-weight="${o.weight}"` : ''}${o.anchor ? ` text-anchor="${o.anchor}"` : ''}${o.opacity !== undefined ? ` opacity="${o.opacity}"` : ''}>${esc(str)}</text>`
}
const poly = (a, fill, o = {}) =>
  `<polygon points="${pts(a)}" fill="${fill}"${o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.sw ?? 1}" stroke-linejoin="round"` : ''}${o.opacity !== undefined ? ` opacity="${o.opacity}"` : ''}${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`
function rng(seed) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}
export function corpLogo(key, cx, cy, size, color) {
  const g = (inner) =>
    `<g transform="translate(${r2(cx)} ${r2(cy)}) scale(${r2(size / 40)})" fill="none" stroke="${color}" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round">${inner}</g>`
  if (key === 'X')
    return g(`<rect x="-17" y="-17" width="34" height="34" rx="3"/><path d="M-10 -10 L10 10 M10 -10 L-10 10"/>`)
  if (key === 'Y') return g(`<circle cx="0" cy="-7" r="9"/><circle cx="-8" cy="6" r="9"/><circle cx="8" cy="6" r="9"/>`)
  return g(
    `<circle cx="-4" cy="4" r="9"/><path d="M-19 12 C -4 -2, 8 -10, 18 -16"/><circle cx="18" cy="-16" r="2.6" fill="#c49a78" stroke="none"/>`
  )
}

// ---------------------------------------------------------------- colors
const C = {
  black: '#030306',
  rim: '#3a3352',
  rimLit: '#6a6188',
  smoke: '#d8d4e4',
  wallLit: '#16131f',
  floor: '#08070d',
  text3: '#9088aa',
  brand300: '#b9a0ff',
  lavenderLight: '#e6dcf5'
}
const HAZE = '#231d66'
/** Sign colors: the game's purples and blues with cyan, violet and amber; no pink (it means "needs you") and no yellow (it means you). */
const BB = ['#7b4fe6', '#4f6bff', '#3fc8ff', '#a45cff', '#ff9e4f', '#56d9d0', '#8d7bff', '#5f8bff']
const WORDS = [
  ['READ THE', 'CONTRACT', 'X'],
  ['WE PLAN IN', 'CENTURIES', 'Y'],
  ['BORN', 'OUT THERE', 'Z'],
  ['NUTRI', 'PASTE'],
  ['OXY+', 'BREATHE'],
  ['LOAN', 'NOW'],
  ['JOBS', 'OFF-WORLD'],
  ['SYNTH', 'SLEEP'],
  ['VITA', '24/7'],
  ['ORBIT', 'BANK']
]

/** Gradients and lit-window patterns, shared by the world's drawings. */
export function worldDefs() {
  const r = rng(99)
  let s = '<defs>'
  s += `<linearGradient id="w-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05041a"/><stop offset="0.55" stop-color="#140f45"/><stop offset="1" stop-color="#2c2290"/></linearGradient>`
  s += `<radialGradient id="w-light"><stop offset="0" stop-color="#d8d4e4" stop-opacity="0.22"/><stop offset="1" stop-color="#d8d4e4" stop-opacity="0"/></radialGradient>`
  s += `<radialGradient id="w-light-strong"><stop offset="0" stop-color="#e6dcf5" stop-opacity="0.45"/><stop offset="1" stop-color="#e6dcf5" stop-opacity="0"/></radialGradient>`
  s += `<linearGradient id="w-pane" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#3a3170" stop-opacity="0.78"/><stop offset="0.6" stop-color="#2a2358" stop-opacity="0.82"/><stop offset="1" stop-color="#4a3a8a" stop-opacity="0.72"/></linearGradient>`
  s += `<linearGradient id="w-glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d8d4e4" stop-opacity="0.12"/><stop offset="0.5" stop-color="#d8d4e4" stop-opacity="0.02"/><stop offset="1" stop-color="#d8d4e4" stop-opacity="0.08"/></linearGradient>`
  BB.forEach((c, i) => {
    s += `<radialGradient id="bb-glow-${i}"><stop offset="0" stop-color="${c}" stop-opacity="0.7"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`
    s += `<linearGradient id="bb-fill-${i}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c}"/><stop offset="1" stop-color="${c}" stop-opacity="0.55"/></linearGradient>`
  })
  const sets = [
    ['#8f7cff', '#6aa8ff', '#b9a0ff'],
    ['#5fb8ff', '#8fd8ff', '#7b8cff'],
    ['#ffb36b', '#ffd59a', '#b9a0ff'],
    ['#a98bff', '#d6c8ff', '#5f8bff']
  ]
  sets.forEach((cols, i) => {
    s += `<pattern id="win${i}" width="12" height="16" patternUnits="userSpaceOnUse">`
    for (let y = 1; y < 16; y += 2)
      for (let x = 0.5; x < 12; x += 1.5)
        if (r() < 0.24)
          s += `<rect x="${x}" y="${y}" width="0.8" height="1.1" fill="${cols[Math.floor(r() * 3)]}" opacity="${r2(0.35 + r() * 0.6)}"/>`
    s += `</pattern>`
  })
  // the tower's own windows: one per bay per floor, mostly dark, some lit
  s += `<pattern id="tw-dim" width="3.5" height="6" patternUnits="userSpaceOnUse"><rect x="0.55" y="1.4" width="2.4" height="3" fill="#120e34" stroke="#2a2466" stroke-width="0.08"/></pattern>`
  s += `<pattern id="tw-lit" width="14" height="24" patternUnits="userSpaceOnUse">`
  for (let y = 0; y < 24; y += 6)
    for (let x = 0; x < 14; x += 3.5)
      if (r() < 0.3)
        s += `<rect x="${x + 0.55}" y="${y + 1.4}" width="2.4" height="3" fill="${r() < 0.5 ? '#6a5ad0' : '#c49a78'}" opacity="${r2(0.35 + r() * 0.4)}"/>`
  s += `</pattern>`
  return s + '</defs>'
}

// ---------------------------------------------------------------- boxes, culled to a region
/** A box's three visible faces: +y (left), +x (right) and top; o.fy / o.fx: art on those faces. */
function box(region, x, y, z, w, d, h, o = {}) {
  const P = ws
  const hex = [
    P(x, y, z + h),
    P(x + w, y, z + h),
    P(x + w, y, z),
    P(x + w, y + d, z),
    P(x, y + d, z),
    P(x, y + d, z + h)
  ]
  if (region && !inRegion(region, hex)) return ''
  const top = [P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)]
  const fx = [P(x + w, y, z + h), P(x + w, y + d, z + h), P(x + w, y + d, z), P(x + w, y, z)]
  const fy = [P(x, y + d, z + h), P(x + w, y + d, z + h), P(x + w, y + d, z), P(x, y + d, z)]
  const rim = o.rim ?? C.rim
  const sw = o.sw ?? 1
  let s = poly(fy, o.left ?? '#0a0820', { stroke: o.edge ?? rim, sw: sw * 0.6 })
  if (o.fy) s += onY(x, y + d, z + h, o.fy)
  s += poly(fx, o.right ?? '#110e2e', { stroke: o.edge ?? rim, sw: sw * 0.6 })
  if (o.fx) s += onX(x + w, y + d, z + h, o.fx)
  if (o.top !== false) s += poly(top, o.top ?? '#1b1648', { stroke: o.rimTop ?? rim, sw: sw * 0.7 })
  if (o.haze) s += poly(hex, HAZE, { opacity: r2(o.haze) })
  return s
}
function inRegion([x0, y0, w, h], points, m = 40) {
  const xs = points.map((p) => p[0])
  const ys = points.map((p) => p[1])
  return (
    Math.max(...xs) > x0 - m && Math.min(...xs) < x0 + w + m && Math.max(...ys) > y0 - m && Math.min(...ys) < y0 + h + m
  )
}

// ---------------------------------------------------------------- the city
const PERIOD = 58
const BLOCK = 44
/** The tower and the unit: the tower is a slender slab, so the unit's outside wall can hold the glass door and a window. */
export const T = { x1: 10.4, y1: 24, zu: 84, fh: 6, top: 172 }
export const U = { x: 0.4, y: 16.4, z: T.zu, w: 10, d: 7.6, h: 5.6 }

/** The city's buildings: the same every time (seeded). Block (0, 0) is the tower's. */
function cityData() {
  const r = rng(2140)
  const list = []
  for (let i = -7; i <= 6; i++)
    for (let j = -7; j <= 6; j++) {
      if (i === 0 && j === 0) continue
      const bx = i * PERIOD - 14
      const by = j * PERIOD - 10
      const nx = r() < 0.5 ? 2 : r() < 0.5 ? 1 : 3
      const ny = r() < 0.5 ? 2 : 1
      for (let a = 0; a < nx; a++)
        for (let b = 0; b < ny; b++) {
          const lw = BLOCK / nx
          const ld = BLOCK / ny
          const w = lw - 2 - r() * 4
          const d = ld - 2 - r() * 4
          const x = bx + a * lw + 1
          const y = by + b * ld + 1
          const S = x + w / 2 + y + d / 2
          let h = 18 + r() * r() * 150
          if (r() < 0.08) h = 170 + r() * 90
          if (Math.abs(i) <= 1 && Math.abs(j) <= 1) h = Math.min(h, 30 + r() * 30)
          // in front of the tower, low enough never to hide the unit
          const across = Math.abs(x + w / 2 - (y + d / 2) - (5 - 20))
          if (S > 30 && across < 160) h = Math.min(h, Math.max(6, 58 + (S - 34) * 0.45 - across * 0.05))
          const bld = { x, y, w, d, h, S, win: Math.floor(r() * 4), boards: [] }
          const nb = r() < 0.7 ? 1 + Math.floor(r() * 2.4) : 0
          for (let n = 0; n < nb; n++) {
            const onXFace = r() < 0.5
            const fw = onXFace ? d : w
            const bw = Math.min(fw * 0.85, 5 + r() * 16)
            const bh = Math.min(h * 0.5, bw * (0.45 + r() * 0.6))
            bld.boards.push({
              onX: onXFace,
              u: r() * (fw - bw),
              v: h * (0.08 + r() * 0.5),
              bw,
              bh,
              c: Math.floor(r() * BB.length),
              words: r() < 0.6 ? WORDS[Math.floor(r() * WORDS.length)] : null
            })
          }
          if (r() < 0.25)
            bld.roofSign = { c: Math.floor(r() * BB.length), words: WORDS[Math.floor(r() * WORDS.length)] }
          bld.antenna = r() < 0.35
          list.push(bld)
        }
    }
  return list
}

function board(b) {
  let s = `<ellipse cx="${r2(b.u + b.bw / 2)}" cy="${r2(b.v + b.bh / 2)}" rx="${r2(b.bw * 1.1)}" ry="${r2(b.bh * 1.3)}" fill="url(#bb-glow-${b.c})"/>`
  s += rect(b.u, b.v, b.bw, b.bh, { fill: `url(#bb-fill-${b.c})`, stroke: '#05041a', sw: 0.25 })
  if (b.words) {
    const size = Math.min(b.bh * 0.3, (b.bw / Math.max(b.words[0].length, b.words[1].length)) * 1.5)
    s += text(b.u + b.bw / 2, b.v + b.bh / 2 - size * 0.15, b.words[0], {
      size,
      anchor: 'middle',
      weight: 700,
      opacity: 0.9
    })
    s += text(b.u + b.bw / 2, b.v + b.bh / 2 + size * 0.95, b.words[1], {
      size,
      anchor: 'middle',
      weight: 700,
      opacity: 0.9
    })
    if (b.words[2]) s += corpLogo(b.words[2], b.u + b.bw - b.bh * 0.16, b.v + b.bh * 0.17, b.bh * 0.18, '#f1eefacc')
  } else
    for (let i = 0; i < 3; i++)
      s += rect(b.u + b.bw * 0.1, b.v + b.bh * (0.2 + i * 0.22), b.bw * (0.8 - i * 0.2), b.bh * 0.1, {
        fill: '#f1eefa',
        opacity: 0.6
      })
  return s
}

function building(region, b, hazeRef) {
  const haze = Math.max(0, Math.min(0.5, (hazeRef - b.S) / 700))
  const pat = `url(#win${b.win})`
  const fy =
    rect(0, 0, b.w, b.h, { fill: pat }) +
    b.boards
      .filter((q) => !q.onX)
      .map(board)
      .join('')
  const fx =
    rect(0, 0, b.d, b.h, { fill: pat }) +
    b.boards
      .filter((q) => q.onX)
      .map(board)
      .join('')
  let s = box(region, b.x, b.y, 0, b.w, b.d, b.h, { fy, fx, haze, sw: 2 })
  if (!s) return ''
  if (b.antenna) {
    const [ax, ay] = ws(b.x + b.w / 2, b.y + b.d / 2, b.h)
    const L = (8 + (b.h % 7)) * K0
    s += `<path d="M${r2(ax)} ${r2(ay)} l0 ${r2(-L)}" stroke="#3a3270" stroke-width="12"/><circle cx="${r2(ax)}" cy="${r2(ay - L)}" r="24" fill="#ff8a7a"/>`
  }
  if (b.roofSign) {
    const sw = Math.min(b.w * 0.8, 16)
    s += onY(
      b.x + (b.w - sw) / 2,
      b.y + b.d * 0.5,
      b.h + sw * 0.45,
      board({ u: 0, v: 0, bw: sw, bh: sw * 0.4, c: b.roofSign.c, words: b.roofSign.words })
    )
  }
  return s
}

function streets() {
  const E0 = -7 * PERIOD - 40
  const E1 = 7 * PERIOD + 40
  let s = poly([ws(E0, E0), ws(E1, E0), ws(E1, E1), ws(E0, E1)], '#0b0826')
  const line = (a, b, col, w, o = '') =>
    `<path d="M${pts([ws(...a)])} L${pts([ws(...b)])}" stroke="${col}" stroke-width="${w}"${o}/>`
  const dash = ` stroke-dasharray="${6 * K0} ${3 * K0}" opacity="0.75"`
  for (let i = -7; i <= 7; i++) {
    const c = i * PERIOD - 14 - 7
    s +=
      line([c, E0], [c, E1], '#7b5cff', 10 * K0, ' opacity="0.12"') +
      line([E0, c], [E1, c], '#7b5cff', 10 * K0, ' opacity="0.12"')
    for (const [off, col] of [
      [-3, '#ffb36b'],
      [-1.5, '#ff8a5c'],
      [1.5, '#e6dcf5'],
      [3, '#b9c8ff']
    ])
      s +=
        line([c + off, E0], [c + off, E1], col, 0.25 * K0, dash) +
        line([E0, c + off], [E1, c + off], col, 0.25 * K0, dash)
  }
  return s
}

function traffic() {
  const r = rng(77)
  return Array.from({ length: 90 }, () => {
    const x = -380 + r() * 760
    const y = -380 + r() * 760
    return { kind: 'car', x, y, z: 40 + r() * 140, S: x + y, warm: r() < 0.5 }
  })
}
function car(region, c) {
  const [sx, sy] = ws(c.x, c.y, c.z)
  if (region && !inRegion(region, [[sx, sy]])) return ''
  const L = 3 * K0
  return `<path d="M${r2(sx)} ${r2(sy)} l${r2(L * CS)} ${r2(L * SN)}" stroke="${c.warm ? '#ffb36b' : '#cfe0ff'}" stroke-width="${0.5 * K0}" stroke-linecap="round" opacity="0.85"/>`
}

// ---------------------------------------------------------------- the tower, outside (static: it goes in the bitmaps)
const towerWin = (w, h, lit = true) =>
  rect(0, 0, w, h, { fill: 'url(#tw-dim)' }) + (lit ? rect(0, 0, w, h, { fill: 'url(#tw-lit)' }) : '')
function towerOutside(region) {
  let s = ''
  const shop = (w) =>
    rect(0, 14, w, 3, { fill: '#7b4fe6', opacity: 0.55 }) +
    rect(0, 20, w, 1.2, { fill: '#3fc8ff', opacity: 0.6 }) +
    rect(0, 0, w, 26, { fill: 'url(#win1)' })
  s += box(region, -10, -8, 0, 32, 40, 26, {
    fy: shop(32) + board({ u: 4, v: 2, bw: 18, bh: 9, c: 2, words: ['BLOCK 7', 'MARKET'] }),
    fx: shop(40) + board({ u: 10, v: 3, bw: 16, bh: 8, c: 0, words: ['READ THE', 'CONTRACT', 'X'] })
  })
  s += balcony()
  s += box(region, 0, 0, 26, T.x1, T.y1, T.zu - 26, {
    fy: towerWin(T.x1, T.zu - 26, false),
    fx: towerWin(T.y1, T.zu - 26)
  })
  // the back of the tower, all the way up: its +y face behind the unit, then the cut floors above
  let cut = rect(0, 0, T.x1, T.top - T.zu, { fill: '#0d0b22' })
  for (let z = 0; z < T.top - T.zu; z += T.fh)
    cut +=
      rect(0, z, T.x1, 0.4, { fill: '#1d1844' }) +
      rect(1.2, z + 1.5, 1.4, 2.6, { fill: '#17133a' }) +
      rect(6.4, z + 1.2, 1.5, 4.4, { fill: '#120f30' })
  s += box(region, 0, 0, T.zu, T.x1, U.y, T.top - T.zu, {
    fy: cut,
    fx: towerWin(U.y, T.top - T.zu) + board({ u: 2, v: 18, bw: 12, bh: 22, c: 3, words: ['JOBS', 'OFF-WORLD'] })
  })
  // the unit's floor, dark until the room is drawn over it
  s += poly([ws(0, U.y, T.zu), ws(T.x1, U.y, T.zu), ws(T.x1, T.y1, T.zu), ws(0, T.y1, T.zu)], C.floor)
  // the floors above the unit, as a ghost so you can see in
  const g0 = T.zu + T.fh
  const ghost = '#5a4c8c'
  for (let z = g0; z <= T.top; z += T.fh)
    s += `<path d="M${pts([ws(0, U.y, z)])} L${pts([ws(0, T.y1, z)])} L${pts([ws(T.x1, T.y1, z)])} L${pts([ws(T.x1, U.y, z)])}" fill="none" stroke="${ghost}" stroke-width="2" opacity="0.3"/>`
  s += `<path d="M${pts([ws(0, T.y1, g0)])} L${pts([ws(0, T.y1, T.top)])} M${pts([ws(T.x1, T.y1, g0)])} L${pts([ws(T.x1, T.y1, T.top)])} M${pts([ws(T.x1, U.y, g0)])} L${pts([ws(T.x1, U.y, T.top)])}" stroke="${ghost}" stroke-width="2.5" opacity="0.4" stroke-dasharray="${0.8 * K0} ${0.6 * K0}"/>`
  s += poly([ws(0, T.y1, T.top), ws(T.x1, T.y1, T.top), ws(T.x1, U.y, T.top), ws(0, U.y, T.top)], '#221c58', {
    opacity: 0.5
  })
  const [ax, ay] = ws(5, 8, T.top)
  s += `<path d="M${r2(ax)} ${r2(ay)} l0 ${-22 * K0}" stroke="#3a3270" stroke-width="10"/><circle cx="${r2(ax)}" cy="${r2(ay - 22 * K0)}" r="20" fill="#ff8a7a"/>`
  return s
}
/** The balcony, on the unit's outside (−x) wall: slab, railing, the terminal on the rail. */
function balcony() {
  const z = T.zu
  let s = box(null, -3.4, 18.2, z - 0.35, 3.4, 5.4, 0.35, { top: '#1a1540', rim: C.rimLit })
  const rail = (a, b) => `<path d="M${pts([ws(...a)])} L${pts([ws(...b)])}" stroke="${C.rimLit}" stroke-width="2.5"/>`
  const RZ = z + 1.15
  s +=
    rail([-3.3, 18.3, RZ], [-3.3, 23.5, RZ]) +
    rail([-3.3, 18.3, RZ], [0, 18.3, RZ]) +
    rail([-3.3, 23.5, RZ], [0, 23.5, RZ])
  for (let y = 18.3; y <= 23.6; y += 0.6) s += rail([-3.3, y, z], [-3.3, y, RZ])
  for (let x = -2.7; x < 0; x += 0.6) s += rail([x, 18.3, z], [x, 18.3, RZ]) + rail([x, 23.5, z], [x, 23.5, RZ])
  s += onX(
    -3.3,
    21.6,
    RZ + 0.55,
    rect(0, 0, 0.9, 0.6, { r: 0.08, fill: '#0c0a14', stroke: C.rimLit, sw: 0.04 }) +
      rect(0.08, 0.08, 0.74, 0.4, { r: 0.04, fill: C.smoke, opacity: 0.65 })
  )
  return s
}

/**
 * The outside world (the city, the tower, its balcony) as one SVG in WS coordinates, cut to a region of
 * the plane and drawn at pxW × pxH: one level of detail for the camera's bitmaps. Fonts in it fall back
 * to the system's (an SVG drawn as an image can't use the page's web fonts).
 */
export function outsideSvg(region, pxW, pxH) {
  const [x0, y0, w, h] = region
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${r2(x0)} ${r2(y0)} ${r2(w)} ${r2(h)}" width="${pxW}" height="${pxH}">`
  s += worldDefs() + rect(x0, y0, w, h, { fill: 'url(#w-sky)' })
  s += streets()
  const towerS = 5.2 + 12
  const items = [...city().map((b) => ({ kind: 'b', b, S: b.S })), ...cars(), { kind: 'tower', S: towerS }]
  items.sort((a, b) => a.S - b.S)
  for (const it of items) {
    if (it.kind === 'b') s += building(region, it.b, towerS)
    else if (it.kind === 'car') s += car(region, it)
    else s += towerOutside(region)
  }
  return s + '</svg>'
}
let cityCache = null
let trafficCache = null
const city = () => (cityCache ??= cityData())
const cars = () => (trafficCache ??= traffic())

/**
 * The camera's bitmaps: three levels of detail, each a region of the plane at a scale (px per world
 * unit), around a world point. Stacked far to near, they line up; where the nearer one ends the farther
 * one shows. Sizes stay small enough for phones.
 */
export function cityLayers(small) {
  const n = small ? 1536 : 2048
  const mk = (k, at, pxW, pxH) => {
    const [cx, cy] = ws(...at)
    const w = (pxW / k) * K0
    const h = (pxH / k) * K0
    return { k, pxW, pxH, region: [cx - w / 2, cy - h / 2, w, h] }
  }
  return [
    mk(4.5, [6, 18, T.zu + 30], small ? 2048 : 2560, small ? 2048 : 2048),
    mk(14, VIEW_AT.room, n, n),
    mk(48, VIEW_AT.room, n, n)
  ]
}

// ---------------------------------------------------------------- the room: live, drawn over the bitmaps
/** Holes in the unit's outside wall (plane x = 0.4), in its local units (u from the front, v down). */
const GLASS = { u: 0.8, w: 3.2, v: 0.5 }
const WINDOW = { u: 4.9, w: 2.2, v: 1.3, h: 1.9 }

/** Where the things are, in world units, for the camera to aim at and the hotspots. */
export const SPOTS = {
  tv: [3.9, 16.98, T.zu + 1.84],
  terminal: [6.85, 16.88, T.zu + 2.1],
  vape: [2.05, 19.4, T.zu + 0.5],
  mattress: [1.6, 19.0, T.zu + 0.5],
  door: [9.3, 16.4, T.zu + 2.6],
  scanner: [7.98, 16.4, T.zu + 2.75],
  glass: [U.x, 24 - (GLASS.u + GLASS.w / 2), T.zu + 2.8],
  window: [U.x, 24 - (WINDOW.u + WINDOW.w / 2), T.zu + U.h - WINDOW.v - WINDOW.h / 2],
  room: [5.0, 20.0, T.zu + 2.2]
}
/** The world points the views center on. */
export const VIEW_AT = { room: [4.4, 19.6, T.zu + 2.6], block: [6, 18, T.zu + 26] }

/** A thing's outline on screen (WS px), for its hotspot and its focus ring. */
export const OUTLINES = (() => {
  const yWall = (x0, x1, z0, z1, y = U.y) => [ws(x0, y, z1), ws(x1, y, z1), ws(x1, y, z0), ws(x0, y, z0)]
  const xWall = (y0, y1, z0, z1, x = U.x) => [ws(x, y1, z1), ws(x, y0, z1), ws(x, y0, z0), ws(x, y1, z0)]
  const z = T.zu
  return {
    glass: xWall(24 - GLASS.u - GLASS.w, 24 - GLASS.u, z, z + U.h - GLASS.v),
    window: xWall(24 - WINDOW.u - WINDOW.w, 24 - WINDOW.u, z + U.h - WINDOW.v - WINDOW.h, z + U.h - WINDOW.v),
    tv: yWall(2.8, 5.0, z + 1.1, z + 2.58, 16.98),
    terminal: yWall(6.1, 7.6, z + 1.59, z + 2.6, 16.88),
    scanner: yWall(7.7 + U.x, 8.25 + U.x, z + U.h - 3.15, z + U.h - 2.2),
    door: yWall(8.6 + U.x, 10.0 + U.x, z, z + U.h - 1.2),
    vape: [ws(1.6, 19.1, z + 0.5), ws(2.5, 19.1, z + 0.5), ws(2.5, 19.8, z + 0.5), ws(1.6, 19.8, z + 0.5)].map(
      ([x, y], i) => [x + (i % 3 ? 14 : -14), y + (i < 2 ? -16 : 16)]
    )
  }
})()

/** The box the room view frames: the unit and its balcony, with room for you above the floor. */
export const ROOM_BOX = (() => {
  const p = [
    ws(-3.4, 23.6, T.zu),
    ws(0, U.y, T.zu + U.h + 0.4),
    ws(T.x1, U.y, T.zu + U.h),
    ws(T.x1, T.y1, T.zu),
    ws(0, T.y1, T.zu - 0.6)
  ]
  return bounds(p)
})()
export function bounds(points) {
  const xs = points.map((p) => p[0])
  const ys = points.map((p) => p[1])
  return {
    x: Math.min(...xs),
    y: Math.min(...ys),
    w: Math.max(...xs) - Math.min(...xs),
    h: Math.max(...ys) - Math.min(...ys)
  }
}

const FLOOR_CORNERS = [ws(U.x, U.y, T.zu), ws(T.x1, U.y, T.zu), ws(T.x1, T.y1, T.zu), ws(U.x, T.y1, T.zu)]
/** The unit as seen from outside: everything drawn of the room lies inside this outline (for the dark). */
export const UNIT_OUTLINE = [
  ws(U.x, T.y1, T.zu),
  ws(U.x, T.y1, T.zu + U.h),
  ws(U.x, U.y, T.zu + U.h),
  ws(T.x1, U.y, T.zu + U.h),
  ws(T.x1, U.y, T.zu),
  ws(T.x1, T.y1, T.zu)
]

/** The room's back wall (plane y = 16.4): the light strip, the poster, the scanner's frame, the door out. */
function backWall(o) {
  let s = rect(0, 0, U.w, U.h, { fill: C.wallLit })
  for (let x = 1.6; x < U.w; x += 1.6) s += rect(x, 0, 0.04, U.h, { fill: '#1d1a2a' })
  s += `<ellipse class="room-glow" cx="4.5" cy="1.6" rx="5" ry="3" fill="url(#w-light)"/>`
  s += rect(2.6, 0.3, 3, 0.1, { r: 0.05, fill: C.smoke, opacity: 0.25 })
  s += `<rect class="light-strip" x="2.6" y="0.3" width="3" height="0.1" rx="0.05" fill="${C.smoke}"/>`
  s += rect(0.6, 1.0, 1.5, 2.0, { r: 0.05, fill: '#14121c', stroke: C.rim, sw: 0.04 })
  s += `<g opacity="0.55">${rect(0.72, 1.12, 1.26, 1.3, { fill: '#1c2030' })}<circle cx="1.35" cy="1.75" r="0.32" fill="#8a8070" opacity="0.6"/><path d="M0.85 2.3 L1.85 1.25" stroke="${C.smoke}" stroke-width="0.05"/></g>`
  s += text(1.35, 2.75, 'ORBITER 8', { size: 0.2, anchor: 'middle', fill: C.text3, weight: 700 })
  s +=
    rect(7.7, 2.2, 0.55, 0.95, { r: 0.08, fill: '#0c0a14', stroke: C.rimLit, sw: 0.035 }) +
    rect(7.77, 2.28, 0.41, 0.38, { r: 0.04, fill: '#060509' })
  s += rect(7.83, 2.85, 0.29, 0.06, { r: 0.03, fill: C.smoke, opacity: 0.5 })
  s += rect(8.6, 1.2, 1.4, 4.4, { fill: '#0a0910', stroke: C.rimLit, sw: 0.08 })
  s +=
    rect(8.72, 1.38, 1.16, 1.7, { r: 0.04, stroke: '#1d1a28', sw: 0.04 }) +
    rect(8.72, 3.2, 1.16, 2.2, { r: 0.04, stroke: '#1d1a28', sw: 0.04 })
  s += rect(8.7, 3.25, 0.1, 0.55, { r: 0.05, fill: C.rim })
  s += `<circle class="lock-light${o.escort ? ' open' : ''}" cx="8.76" cy="3.05" r="0.06"/>`
  s += rect(8.95, 0.78, 0.7, 0.26, { r: 0.04, fill: C.black, stroke: C.rim, sw: 0.02 })
  s += text(9.3, 0.97, '7-2216', { size: 0.17, anchor: 'middle', fill: C.text3, family: 'monospace' })
  return onY(U.x, U.y, T.zu + U.h, s)
}

/** The unit's outside wall from inside: the sliding glass door and the window, translucent. */
function outsideWall() {
  const g = GLASS
  const wd = WINDOW
  const holes = `M${g.u} ${g.v} h${g.w} V${U.h} h${-g.w} Z M${wd.u} ${wd.v} h${wd.w} v${wd.h} h${-wd.w} Z`
  let s = `<path d="M0 0 H${U.d} V${U.h} H0 Z ${holes}" fill="#141120" fill-rule="evenodd"/>`
  // translucent glass (Koda, 2026-11-20): frosted, the city's light coming through, no picture in it
  s += rect(g.u, g.v, g.w, U.h - g.v, { fill: 'url(#w-pane)' }) + rect(wd.u, wd.v, wd.w, wd.h, { fill: 'url(#w-pane)' })
  s +=
    rect(g.u, g.v, g.w, U.h - g.v, { fill: 'url(#w-glass)', stroke: '#2a2540', sw: 0.12 }) +
    rect(g.u + g.w / 2 - 0.04, g.v, 0.08, U.h - g.v, { fill: '#2a2540' })
  s +=
    rect(wd.u, wd.v, wd.w, wd.h, { fill: 'url(#w-glass)', stroke: '#2a2540', sw: 0.1 }) +
    rect(wd.u - 0.1, wd.v + wd.h, wd.w + 0.2, 0.1, { fill: '#2a2540' })
  s += `<path d="M${g.u + g.w} ${g.v - 0.2} q0.25 1.8 -0.05 3.6 q-0.1 0.8 0.3 ${U.h - g.v - 3.4} l0.5 0 q-0.25 -1 -0.15 -2.2 q0.15 -1.6 -0.2 ${-(U.h - g.v - 1.4)} z" fill="#0c0a13" stroke="${C.rim}" stroke-width="0.04"/>`
  return onX(U.x, U.y + U.d, T.zu + U.h, s)
}

/** The furniture, back to front. The TV's picture and Minerva's faces are HTML laid over their screens. */
function furniture(o) {
  const z = T.zu
  const R = null
  let s = onZ(U.x, U.y, z, `<ellipse class="room-glow" cx="5" cy="3" rx="5.5" ry="3.6" fill="url(#w-light)"/>`)
  s += box(R, 3.0, 16.6, z, 1.8, 1.0, 1.1, { top: '#16131f', right: '#0b0a12', left: '#08070d' })
  s += box(R, 2.8, 16.62, z + 1.1, 2.2, 0.36, 1.48, {
    top: '#0c0a12',
    right: '#0a0910',
    left: '#08070d',
    rimTop: C.rimLit
  })
  s += onY(2.9, 16.98, z + 2.48, rect(0, 0, 2, 1.28, { fill: '#05040a' }))
  s += onZ(3.9, 17.0, z, `<ellipse class="room-glow" cx="0" cy="1.7" rx="2.3" ry="1.6" fill="url(#w-light)"/>`)
  s +=
    box(R, 5.0, 18.0, z, 0.35, 0.35, 0.3, { top: '#2a2540' }) +
    box(R, 5.45, 18.3, z, 0.25, 0.25, 0.22, { top: '#2a2540' })
  for (const [lx, ly] of [
    [5.7, 16.6],
    [7.8, 16.6],
    [5.7, 17.6],
    [7.8, 17.6]
  ])
    s += box(R, lx, ly, z, 0.12, 0.12, 1.45)
  s += box(R, 5.6, 16.5, z + 1.45, 2.4, 1.35, 0.14, { top: '#15131d' })
  s += box(R, 6.1, 16.6, z + 1.59, 1.5, 0.28, 1.0, { top: '#0c0a12', rimTop: C.rimLit })
  s += onY(6.17, 16.88, z + 2.52, rect(0, 0, 1.36, 0.84, { r: 0.05, fill: '#0c0a14' }))
  s += onZ(
    6.6,
    17.2,
    z + 1.6,
    `<g transform="rotate(-12)">${rect(0.1, 0.05, 0.6, 0.4, { fill: C.smoke, opacity: 0.5 })}${rect(0.5, 0.2, 0.6, 0.4, { fill: C.smoke, opacity: 0.35 })}</g>`
  )
  s += onZ(6.85, 17.0, z, `<ellipse class="room-glow" cx="0" cy="1.2" rx="1.6" ry="1.1" fill="url(#w-light)"/>`)
  s += box(R, 8.0, 17.5, z, 0.45, 0.45, 0.55)
  {
    const [px, py] = ws(8.22, 17.72, z + 0.55)
    const q = K0 / 46
    s += `<path d="M${r2(px)} ${r2(py)} q${r2(-10 * q)} ${r2(-24 * q)} ${r2(-24 * q)} ${r2(-20 * q)} M${r2(px)} ${r2(py)} q${r2(4 * q)} ${r2(-32 * q)} ${r2(18 * q)} ${r2(-32 * q)} M${r2(px)} ${r2(py)} q${r2(-2 * q)} ${r2(-20 * q)} ${r2(-9 * q)} ${r2(-38 * q)}" stroke="${C.rim}" stroke-width="2" fill="none"/>`
  }
  s += box(R, 0.55, 17.0, z, 2.2, 3.6, 0.45, { top: '#1b1726' })
  s += box(R, 0.75, 17.15, z + 0.45, 1.8, 0.7, 0.16, { top: '#25203a' })
  s += onZ(
    0.6,
    18.9,
    z + 0.47,
    `<path d="M0 0 L2.1 0 L2.1 1.6 q-1 0.25 -2.1 0z" fill="#120f1c" stroke="${C.rim}" stroke-width="0.03"/>`
  )
  if (!o.vapeInHand) {
    s += onZ(
      1.75,
      19.35,
      z + 0.47,
      `<g transform="rotate(25)">${rect(0, -0.06, 0.6, 0.12, { r: 0.06, fill: '#2a2440', stroke: C.rimLit, sw: 0.02 })}<circle cx="0.6" cy="0" r="0.05" fill="${C.lavenderLight}"/></g>`
    )
    const [vx, vy] = ws(2.1, 19.5, z + 0.5)
    s += `<circle cx="${r2(vx)}" cy="${r2(vy)}" r="${0.5 * K0}" fill="url(#w-light-strong)" opacity="0.6"/>`
  }
  return s
}

/**
 * The room, live: o.vapeInHand, o.escort (the door's light turned). The lights and the dark are classes
 * on the layer (intro-screen.vue).
 */
export function roomSvg(o = {}) {
  let s = worldDefs()
  s += backWall(o)
  s += poly(FLOOR_CORNERS, C.floor)
  s += outsideWall()
  s += box(null, 0, U.y + U.d, T.zu, 0.4, 0.001, U.h, { top: '#1d1a2a' })
  s += furniture(o)
  s += `<path d="M${pts([ws(0, T.y1, T.zu)])} L${pts([ws(T.x1, T.y1, T.zu)])} L${pts([ws(T.x1, U.y, T.zu)])}" fill="none" stroke="${C.rimLit}" stroke-width="2.4"/>`
  return s
}
/** The region of the plane the room's SVG covers. */
export const ROOM_REGION = (() => {
  const b = bounds([
    ws(-0.5, 24.5, T.zu - 0.5),
    ws(-0.5, U.y - 0.5, T.zu + U.h + 0.6),
    ws(T.x1 + 0.5, U.y - 0.5, T.zu + U.h + 0.6),
    ws(T.x1 + 0.5, T.y1 + 0.5, T.zu - 0.5)
  ])
  return [b.x, b.y, b.w, b.h]
})()

/** Where you stand (or sit) for each view, in world units: you walk to what you use. */
export const STANDS = {
  room: [4.6, 21.0],
  dark: [8.0, 20.0],
  tv: [3.9, 19.3],
  terminal: [6.85, 18.9],
  door: [8.9, 18.9],
  scanner: [8.4, 18.9],
  vape: [1.6, 19.6],
  glass: [1.3, 21.8],
  window: [2.6, 19.3]
}

/** The TV's picture: a corporation's ad and Minerva's ticker, in a 468 × 300 frame (the TV's screen is 2 × 1.28 world units). */
export function tvPicture(adSvg) {
  return `<svg viewBox="0 0 468 300" preserveAspectRatio="none">${adSvg}<rect x="0" y="272" width="468" height="28" fill="#05041a" opacity="0.85"/><text x="10" y="291" font-size="15" fill="#bdb5d4" font-family="'Ubuntu Mono', monospace">${esc(TICKER)}</text></svg>`
}

export { CORP_LOOKS }
