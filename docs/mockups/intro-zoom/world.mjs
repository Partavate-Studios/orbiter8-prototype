// One isometric world, drawn through a camera: the city, Block 7's tower, and unit 7-2216 cut open in it.
// Every panel is the same world at another zoom; nothing changes scene. What's drawn depends on the zoom
// (level of detail): the TV is a colored glow from far away and its full ad up close; the terminal is
// Minerva's emblem from far away and her console up close.
//
// World units are about half a meter. x runs to the screen's lower right, y to its lower left, z up.

import { C, rect, text, face, owl, tvAdArt, corpLogo, rng, TICKER } from '../intro/art.mjs'
import { vista } from './vista.mjs'

const CS = Math.cos(Math.PI / 6)
const SN = 0.5
const r2 = (v) => Math.round(v * 100) / 100

// ---------------------------------------------------------------- the camera
/** A camera of scale k (px per world unit) with the world point `at` at the center of a W × H screen. */
export function camera(k, at, W, H) {
  const [cx, cy, cz] = at
  const ox = W / 2 - (cx - cy) * CS * k
  const oy = H / 2 - (cx + cy) * SN * k + cz * k
  const P = (x, y, z = 0) => [ox + (x - y) * CS * k, oy + (x + y) * SN * k - z * k]
  const mat = (a, b, c, d, [e, f]) => `matrix(${r2(a)} ${r2(b)} ${r2(c)} ${r2(d)} ${r2(e)} ${r2(f)})`
  return {
    k,
    W,
    H,
    P,
    /** Flat art on the plane y = y1 (facing +y, the screen's lower left), origin (x0, y1, zTop); local units are world units, u along +x, v down. */
    onY: (x0, y1, zTop, inner, o = '') => `<g transform="${mat(CS * k, SN * k, 0, k, P(x0, y1, zTop))}"${o}>${inner}</g>`,
    /** Flat art on the plane x = x1 (facing +x, the screen's lower right), origin (x1, yMax, zTop); u along −y, v down. */
    onX: (x1, yMax, zTop, inner, o = '') => `<g transform="${mat(CS * k, -SN * k, 0, k, P(x1, yMax, zTop))}"${o}>${inner}</g>`,
    /** Flat art on the ground plane z, origin (x0, y0); u along +x, v along +y. */
    onZ: (x0, y0, z, inner, o = '') => `<g transform="${mat(CS * k, SN * k, -CS * k, SN * k, P(x0, y0, z))}"${o}>${inner}</g>`,
    visible(pts, m = 60) {
      const xs = pts.map((p) => p[0])
      const ys = pts.map((p) => p[1])
      return Math.max(...xs) > -m && Math.min(...xs) < W + m && Math.max(...ys) > -m && Math.min(...ys) < H + m
    },
    rim: Math.max(0.6, Math.min(2.5, k * 0.04))
  }
}

const pts = (a) => a.map((p) => `${r2(p[0])},${r2(p[1])}`).join(' ')
export const poly = (a, fill, o = {}) =>
  `<polygon points="${pts(a)}" fill="${fill}"${o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.sw ?? 1}" stroke-linejoin="round"` : ''}${o.opacity != null ? ` opacity="${o.opacity}"` : ''}${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`

/** A box's three visible faces: +y (left), +x (right) and top. o.fy / o.fx: art on those faces (local units). */
export function box(cam, x, y, z, w, d, h, o = {}) {
  const P = cam.P
  const hex = [P(x, y, z + h), P(x + w, y, z + h), P(x + w, y, z), P(x + w, y + d, z), P(x, y + d, z), P(x, y + d, z + h)]
  if (!cam.visible(hex)) return ''
  const top = [P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)]
  const fx = [P(x + w, y, z + h), P(x + w, y + d, z + h), P(x + w, y + d, z), P(x + w, y, z)]
  const fy = [P(x, y + d, z + h), P(x + w, y + d, z + h), P(x + w, y + d, z), P(x, y + d, z)]
  const rim = o.rim ?? C.rim
  let s = poly(fy, o.left ?? '#0a0820', { stroke: o.edge ?? rim, sw: cam.rim * 0.6 })
  if (o.fy) s += cam.onY(x, y + d, z + h, o.fy)
  s += poly(fx, o.right ?? '#110e2e', { stroke: o.edge ?? rim, sw: cam.rim * 0.6 })
  if (o.fx) s += cam.onX(x + w, y + d, z + h, o.fx)
  if (o.top !== false) s += poly(top, o.top ?? '#1b1648', { stroke: o.rimTop ?? rim, sw: cam.rim * 0.7 })
  if (o.haze) s += poly(hex, HAZE, { opacity: o.haze })
  return s
}
const HAZE = '#231d66'

// ---------------------------------------------------------------- shared definitions for the world
const BB = ['#7b4fe6', '#4f6bff', '#3fc8ff', '#a45cff', '#ff9e4f', '#56d9d0', '#8d7bff', '#5f8bff']
export function worldDefs() {
  const r = rng(99)
  let s = '<defs>'
  s += `<linearGradient id="w-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05041a"/><stop offset="0.55" stop-color="#140f45"/><stop offset="1" stop-color="#2c2290"/></linearGradient>`
  s += `<linearGradient id="w-farhaze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2fa0" stop-opacity="0.45"/><stop offset="0.6" stop-color="#3a2fa0" stop-opacity="0"/></linearGradient>`
  s += `<radialGradient id="w-vignette" cx="50%" cy="50%" r="75%"><stop offset="0.55" stop-color="#030306" stop-opacity="0"/><stop offset="1" stop-color="#030306" stop-opacity="0.85"/></radialGradient>`
  s += `<radialGradient id="w-street"><stop offset="0" stop-color="#b9a0ff" stop-opacity="0.35"/><stop offset="1" stop-color="#b9a0ff" stop-opacity="0"/></radialGradient>`
  BB.forEach((c, i) => {
    s += `<radialGradient id="bb-glow-${i}"><stop offset="0" stop-color="${c}" stop-opacity="0.7"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`
    s += `<linearGradient id="bb-fill-${i}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c}"/><stop offset="1" stop-color="${c}" stop-opacity="0.55"/></linearGradient>`
  })
  // lit windows, in world units: four tiles, cool and warm
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
        if (r() < 0.24) s += `<rect x="${x}" y="${y}" width="0.8" height="1.1" fill="${cols[Math.floor(r() * 3)]}" opacity="${r2(0.35 + r() * 0.6)}"/>`
    s += `</pattern>`
  })
  s += `<pattern id="win-dim" width="12" height="16" patternUnits="userSpaceOnUse">`
  for (let y = 1; y < 16; y += 2) for (let x = 0.5; x < 12; x += 1.5) if (r() < 0.12) s += `<rect x="${x}" y="${y}" width="0.8" height="1.1" fill="#6a5f9a" opacity="0.5"/>`
  s += `</pattern>`
  // the tower's own windows: one per bay per floor, mostly dark, some lit
  s += `<pattern id="tw-dim" width="3.5" height="6" patternUnits="userSpaceOnUse"><rect x="0.55" y="1.4" width="2.4" height="3" fill="#120e34" stroke="#2a2466" stroke-width="0.08"/></pattern>`
  s += `<pattern id="tw-lit" width="14" height="24" patternUnits="userSpaceOnUse">`
  for (let y = 0; y < 24; y += 6) for (let x = 0; x < 14; x += 3.5) if (r() < 0.3) s += `<rect x="${x + 0.55}" y="${y + 1.4}" width="2.4" height="3" fill="${r() < 0.5 ? '#6a5ad0' : '#c49a78'}" opacity="${r2(0.35 + r() * 0.4)}"/>`
  s += `</pattern>`
  return s + '</defs>'
}
const towerWin = (w, h, lit = true) => rect(0, 0, w, h, { fill: 'url(#tw-dim)' }) + (lit ? rect(0, 0, w, h, { fill: 'url(#tw-lit)' }) : '')

// ---------------------------------------------------------------- the city
const PERIOD = 58
const BLOCK = 44
const WORDS = [
  ['READ THE', 'CONTRACT', 'X'], ['WE PLAN IN', 'CENTURIES', 'Y'], ['BORN', 'OUT THERE', 'Z'], ['NUTRI', 'PASTE'],
  ['OXY+', 'BREATHE'], ['LOAN', 'NOW'], ['JOBS', 'OFF-WORLD'], ['SYNTH', 'SLEEP'], ['VITA', '24/7'], ['ORBIT', 'BANK']
]
/** The city's buildings: deterministic, in world units. Block (0, 0) is the tower's. */
export function cityData() {
  const r = rng(2140)
  const list = []
  for (let i = -7; i <= 6; i++)
    for (let j = -7; j <= 6; j++) {
      if (i === 0 && j === 0) continue
      const bx = i * PERIOD - 14
      const by = j * PERIOD - 10
      // split the block into lots
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
          // in front of the tower, keep low enough not to hide unit 7-2216
          const across = Math.abs(x + w / 2 - (y + d / 2) - (5 - 20))
          if (Math.abs(i) <= 1 && Math.abs(j) <= 1) h = Math.min(h, 30 + r() * 30)
          if (S > 30 && across < 160) h = Math.min(h, Math.max(6, 58 + (S - 34) * 0.45 - across * 0.05))
          const bld = { x, y, w, d, h, S, win: Math.floor(r() * 4), boards: [] }
          // billboards on the faces, a few huge
          const nb = r() < 0.7 ? 1 + Math.floor(r() * 2.4) : 0
          for (let n = 0; n < nb; n++) {
            const onX = r() < 0.5
            const fw = onX ? d : w
            const bw = Math.min(fw * 0.85, 5 + r() * 16)
            const bh = Math.min(h * 0.5, bw * (0.45 + r() * 0.6))
            bld.boards.push({ onX, u: r() * (fw - bw), v: h * (0.08 + r() * 0.5), bw, bh, c: Math.floor(r() * BB.length), words: r() < 0.6 ? WORDS[Math.floor(r() * WORDS.length)] : null })
          }
          if (r() < 0.25) bld.roofSign = { c: Math.floor(r() * BB.length), words: WORDS[Math.floor(r() * WORDS.length)] }
          bld.antenna = r() < 0.35
          list.push(bld)
        }
    }
  return list
}
const CITY = cityData()

function board(b, h) {
  let s = `<ellipse cx="${r2(b.u + b.bw / 2)}" cy="${r2(b.v + b.bh / 2)}" rx="${r2(b.bw * 1.1)}" ry="${r2(b.bh * 1.3)}" fill="url(#bb-glow-${b.c})"/>`
  s += rect(r2(b.u), r2(b.v), r2(b.bw), r2(b.bh), { fill: `url(#bb-fill-${b.c})`, stroke: '#05041a', sw: 0.25 })
  if (b.words) {
    const size = Math.min(b.bh * 0.3, (b.bw / Math.max(b.words[0].length, b.words[1].length)) * 1.5)
    s += text(r2(b.u + b.bw / 2), r2(b.v + b.bh / 2 - size * 0.15), b.words[0], { size: r2(size), anchor: 'middle', weight: 700, fill: '#f1eefa', opacity: 0.9 })
    s += text(r2(b.u + b.bw / 2), r2(b.v + b.bh / 2 + size * 0.95), b.words[1], { size: r2(size), anchor: 'middle', weight: 700, fill: '#f1eefa', opacity: 0.9 })
    if (b.words[2]) s += corpLogo(b.words[2], b.u + b.bw - b.bh * 0.16, b.v + b.bh * 0.17, b.bh * 0.18, '#f1eefacc')
  } else {
    for (let i = 0; i < 3; i++) s += rect(r2(b.u + b.bw * 0.1), r2(b.v + b.bh * (0.2 + i * 0.22)), r2(b.bw * (0.8 - i * 0.2)), r2(b.bh * 0.1), { fill: '#f1eefa', opacity: 0.6 })
  }
  return s
}

function building(cam, b, hazeRef) {
  const haze = Math.max(0, Math.min(0.5, (hazeRef - b.S) / 700))
  const pat = `url(#win${b.win})`
  const fy = rect(0, 0, b.w, b.h, { fill: pat }) + b.boards.filter((q) => !q.onX).map((q) => board(q, b.h)).join('')
  const fx = rect(0, 0, b.d, b.h, { fill: pat }) + b.boards.filter((q) => q.onX).map((q) => board(q, b.h)).join('')
  let s = box(cam, b.x, b.y, 0, b.w, b.d, b.h, { fy, fx, haze })
  if (!s) return ''
  if (b.antenna) {
    const [ax, ay] = cam.P(b.x + b.w / 2, b.y + b.d / 2, b.h)
    const L = (8 + (b.h % 7)) * cam.k
    s += `<path d="M${r2(ax)} ${r2(ay)} l0 ${r2(-L)}" stroke="#3a3270" stroke-width="${r2(cam.rim * 0.8)}"/><circle cx="${r2(ax)}" cy="${r2(ay - L)}" r="${r2(Math.max(1, cam.k * 0.4))}" fill="#ff8a7a"/>`
  }
  if (b.roofSign) {
    const sw = Math.min(b.w * 0.8, 16)
    s += cam.onY(b.x + (b.w - sw) / 2, b.y + b.d * 0.5, b.h + sw * 0.45, board({ u: 0, v: 0, bw: sw, bh: sw * 0.4, c: b.roofSign.c, words: b.roofSign.words }))
  }
  return s
}

/** The ground and the streets' light trails. */
function streets(cam) {
  const P = cam.P
  const E0 = -7 * PERIOD - 40
  const E1 = 7 * PERIOD + 40
  let s = poly([P(E0, E0), P(E1, E0), P(E1, E1), P(E0, E1)], '#0b0826')
  const sw = Math.max(0.6, cam.k * 0.25)
  for (let i = -7; i <= 7; i++) {
    const c = i * PERIOD - 14 - 7 // street centre between blocks
    // glow strip, then lanes: amber one way, pale violet the other
    s += `<path d="M${pts([P(c, E0)])} L${pts([P(c, E1)])}" stroke="#7b5cff" stroke-width="${r2(cam.k * 10)}" opacity="0.12"/>`
    s += `<path d="M${pts([P(E0, c)])} L${pts([P(E1, c)])}" stroke="#7b5cff" stroke-width="${r2(cam.k * 10)}" opacity="0.12"/>`
    for (const [off, col] of [[-3, '#ffb36b'], [-1.5, '#ff8a5c'], [1.5, '#e6dcf5'], [3, '#b9c8ff']]) {
      const dash = `${r2(cam.k * 6)} ${r2(cam.k * 3)}`
      s += `<path d="M${pts([P(c + off, E0)])} L${pts([P(c + off, E1)])}" stroke="${col}" stroke-width="${r2(sw)}" stroke-dasharray="${dash}" opacity="0.75"/>`
      s += `<path d="M${pts([P(E0, c + off)])} L${pts([P(E1, c + off)])}" stroke="${col}" stroke-width="${r2(sw)}" stroke-dasharray="${dash}" opacity="0.75"/>`
    }
  }
  return s
}

/** Air traffic: small lit craft at height, sorted in with the buildings. */
function traffic() {
  const r = rng(77)
  return Array.from({ length: 90 }, () => {
    const x = -380 + r() * 760
    const y = -380 + r() * 760
    return { kind: 'car', x, y, z: 40 + r() * 140, S: x + y, warm: r() < 0.5 }
  })
}
const TRAFFIC = traffic()
function car(cam, c) {
  const [sx, sy] = cam.P(c.x, c.y, c.z)
  if (sx < -40 || sx > cam.W + 40 || sy < -40 || sy > cam.H + 40) return ''
  const L = Math.max(4, cam.k * 3)
  return `<path d="M${r2(sx)} ${r2(sy)} l${r2(L * CS)} ${r2(L * SN)}" stroke="${c.warm ? '#ffb36b' : '#cfe0ff'}" stroke-width="${r2(Math.max(1.2, cam.k * 0.5))}" stroke-linecap="round" opacity="0.85"/>`
}

// ---------------------------------------------------------------- the tower and unit 7-2216
export const T = { x1: 10.4, y1: 24, zu: 84, fh: 6, top: 172 }
export const U = { x: 0.4, y: 16.4, z: T.zu, w: 10, d: 7.6, h: 5.6 } // the unit's inside

/** The things in the room, in world units, for the panels to aim at. */
export const SPOTS = {
  tv: [3.9, 17.0, T.zu + 1.85],
  terminal: [6.85, 16.9, T.zu + 2.1],
  vape: [2.05, 19.4, T.zu + 0.5],
  mattress: [1.6, 19.0, T.zu + 0.5],
  balcony: [-1.6, 21, T.zu + 0.6],
  door: [9.5, 16.4, T.zu + 2.2],
  room: [5.2, 20.2, T.zu + 2.6]
}

/** Glass and frame holes in the unit's outside wall (plane x = 0.4), in its local units (u from the front, v down). */
const GLASS = { u: 0.8, w: 3.2, v: 0.5 }
const WINDOW = { u: 4.9, w: 2.2, v: 1.3, h: 1.9 }

function figure(cam, x, y, z, o = {}) {
  const [sx, sy] = cam.P(x, y, z)
  const sc = cam.k / 50
  const st = `fill="${C.black}" stroke="${C.yellow}" stroke-width="${r2(Math.max(1.4, Math.min(3, cam.k * 0.035)) / sc)}" stroke-linejoin="round"`
  let s = `<g transform="translate(${r2(sx)} ${r2(sy)}) scale(${r2(sc)})"><ellipse rx="22" ry="8" fill="#000" opacity="0.5"/>`
  if (o.sit) {
    s += `<path d="M-12 -4 L-9 -40 Q0 -48 9 -40 L11 -12 L26 -22 L34 -18 L42 2 L33 5 L27 -8 L12 2 Z" ${st}/>`
    s += `<circle cx="0" cy="-56" r="9" ${st}/>`
    s += `<path d="M6 -36 L18 -26 L9 -50" fill="none" stroke="${C.black}" stroke-width="7" stroke-linecap="round"/><path d="M6 -36 L18 -26 L9 -50" fill="none" stroke="${C.yellow}" stroke-width="${r2(1.4 / sc)}" stroke-linecap="round" opacity="0.8"/>`
    s += `<circle cx="9" cy="-52" r="2.6" fill="${C.lavenderLight}"/>`
  } else {
    s += `<path d="M-9 0 l2 -34 q-6 -2 -6 -16 l2 -14 q2 -8 11 -8 q9 0 11 8 l2 14 q0 14 -6 16 l2 34 l-6 0 l-3 -26 l-3 26z" ${st}/>`
    s += `<circle cx="0" cy="-80" r="8" ${st}/>`
    if (o.vape) s += `<circle cx="12" cy="-62" r="2.4" fill="${C.lavenderLight}"/>`
  }
  return s + '</g>'
}

/** The balcony on the unit's outside (−x) wall: slab, railing, the terminal on the rail. */
function balcony(cam, o) {
  const P = cam.P
  const z = T.zu
  let s = box(cam, -3.4, 18.2, z - 0.35, 3.4, 5.4, 0.35, { top: '#1a1540', rim: C.rimLit })
  // railing: the far rail along x = −3.3 and the two side rails, posts
  const rail = (a, b) => `<path d="M${pts([P(...a)])} L${pts([P(...b)])}" stroke="${C.rimLit}" stroke-width="${r2(cam.rim * 1.2)}"/>`
  const RZ = z + 1.15
  s += rail([-3.3, 18.3, RZ], [-3.3, 23.5, RZ]) + rail([-3.3, 18.3, RZ], [0, 18.3, RZ]) + rail([-3.3, 23.5, RZ], [0, 23.5, RZ])
  for (let y = 18.3; y <= 23.6; y += 0.6) s += rail([-3.3, y, z], [-3.3, y, RZ])
  for (let x = -2.7; x < 0; x += 0.6) s += rail([x, 18.3, z], [x, 18.3, RZ]) + rail([x, 23.5, z], [x, 23.5, RZ])
  // the terminal on the far rail
  s += cam.onX(-3.3, 21.6, RZ + 0.55, rect(0, 0, 0.9, 0.6, { r: 0.08, fill: '#0c0a14', stroke: C.rimLit, sw: 0.04 }) + rect(0.08, 0.08, 0.74, 0.4, { r: 0.04, fill: C.smoke, opacity: 0.65 }))
  if (o.figureOnBalcony) s += figure(cam, -1.8, 21.2, z, { vape: true })
  return s
}

/** The room's back wall (plane y = 16.4): a light strip, the poster, the scanner, the door out. */
function backWall(cam, lod) {
  const z = T.zu + U.h
  let s = rect(0, 0, U.w, U.h, { fill: C.wallLit })
  for (let x = 1.6; x < U.w; x += 1.6) s += rect(x, 0, 0.04, U.h, { fill: '#1d1a2a' })
  s += `<ellipse cx="4.5" cy="1.6" rx="5" ry="3" fill="url(#light)"/>`
  s += rect(2.6, 0.3, 3, 0.1, { r: 0.05, fill: C.smoke, opacity: 0.85 })
  // the poster
  s += rect(0.6, 1.0, 1.5, 2.0, { r: 0.05, fill: '#14121c', stroke: C.rim, sw: 0.04 })
  s += `<g opacity="0.55">${rect(0.72, 1.12, 1.26, 1.3, { fill: '#1c2030' })}<circle cx="1.35" cy="1.75" r="0.32" fill="#8a8070" opacity="0.6"/><path d="M0.85 2.3 L1.85 1.25" stroke="${C.smoke}" stroke-width="0.05"/></g>`
  if (lod > 25) s += text(1.35, 2.75, 'ORBITER 8', { size: 0.2, anchor: 'middle', fill: C.text3, weight: 700, ls: 0.03 })
  // the ID scanner and the door out
  s += rect(7.7, 2.2, 0.55, 0.95, { r: 0.08, fill: '#0c0a14', stroke: C.rimLit, sw: 0.035 }) + rect(7.77, 2.28, 0.41, 0.38, { r: 0.04, fill: '#060509' })
  if (lod > 25) s += face(7.975, 2.47, 0.4, 'idle', { glow: false })
  s += rect(8.6, 1.2, 1.4, 4.4, { fill: '#0a0910', stroke: C.rimLit, sw: 0.08 })
  s += rect(8.72, 1.38, 1.16, 1.7, { r: 0.04, stroke: '#1d1a28', sw: 0.04 }) + rect(8.72, 3.2, 1.16, 2.2, { r: 0.04, stroke: '#1d1a28', sw: 0.04 })
  s += rect(8.7, 3.25, 0.1, 0.55, { r: 0.05, fill: C.rim }) + `<circle cx="8.76" cy="3.05" r="0.05" fill="${C.brand300}"/>`
  s += rect(8.95, 0.78, 0.7, 0.26, { r: 0.04, fill: C.black, stroke: C.rim, sw: 0.02 })
  if (lod > 25) s += text(9.3, 0.97, '7-2216', { size: 0.17, anchor: 'middle', fill: C.text3, family: 'monospace' })
  return cam.onY(U.x, U.y, z, s)
}

/** The unit's outside wall (plane x = 0.4) from inside: the sliding glass door and a window cut through it. */
function outsideWall(cam) {
  const z = T.zu + U.h
  const g = GLASS
  const wd = WINDOW
  const holes = `M${g.u} ${g.v} h${g.w} V${U.h} h${-g.w} Z M${wd.u} ${wd.v} h${wd.w} v${wd.h} h${-wd.w} Z`
  let s = `<path d="M0 0 H${U.d} V${U.h} H0 Z ${holes}" fill="#141120" fill-rule="evenodd"/>`
  // close enough, the glass shows the view: the city straight on, as from the balcony
  if (cam.k > 15) {
    const v = vista({ railing: true })
    s += `<svg x="${g.u}" y="${g.v}" width="${g.w}" height="${U.h - g.v}" viewBox="420 0 600 900" preserveAspectRatio="xMidYMid slice">${v}</svg>`
    s += `<svg x="${wd.u}" y="${wd.v}" width="${wd.w}" height="${wd.h}" viewBox="0 120 1440 700" preserveAspectRatio="xMidYMid slice">${v}</svg>`
  }
  s += rect(g.u, g.v, g.w, U.h - g.v, { fill: 'url(#glass)', stroke: '#2a2540', sw: 0.12 }) + rect(g.u + g.w / 2 - 0.04, g.v, 0.08, U.h - g.v, { fill: '#2a2540' })
  s += rect(wd.u, wd.v, wd.w, wd.h, { fill: 'url(#glass)', stroke: '#2a2540', sw: 0.1 }) + rect(wd.u - 0.1, wd.v + wd.h, wd.w + 0.2, 0.1, { fill: '#2a2540' })
  // the curtain bunched by the glass
  s += `<path d="M${g.u + g.w} ${g.v - 0.2} q0.25 1.8 -0.05 3.6 q-0.1 0.8 0.3 ${U.h - g.v - 3.4} l0.5 0 q-0.25 -1 -0.15 -2.2 q0.15 -1.6 -0.2 ${-(U.h - g.v - 1.4)} z" fill="#0c0a13" stroke="${C.rim}" stroke-width="0.04"/>`
  return cam.onX(U.x, U.y + U.d, z, s)
}

/** The furniture, back to front, with the level of detail the zoom allows. */
function furniture(cam, lod, o) {
  const z = T.zu
  let s = ''
  const P = cam.P
  // the light the room throws on its floor
  s += cam.onZ(U.x, U.y, z, `<ellipse cx="5" cy="3" rx="5.5" ry="3.6" fill="url(#light)"/>`)
  // the TV on its crate
  s += box(cam, 3.0, 16.6, z, 1.8, 1.0, 1.1, { top: '#16131f', right: '#0b0a12', left: '#08070d' })
  s += box(cam, 2.8, 16.62, z + 1.1, 2.2, 0.36, 1.48, { top: '#0c0a12', right: '#0a0910', left: '#08070d', rimTop: C.rimLit })
  let screen
  if (lod >= 180)
    screen =
      `<svg x="0" y="0" width="2" height="1.28" viewBox="0 0 468 300" preserveAspectRatio="none">${tvAdArt(o.tv ?? 'X')}</svg>` +
      rect(0, 1.16, 2, 0.12, { fill: '#05041a', opacity: 0.85 }) +
      text(0.05, 1.245, TICKER, { size: 0.065, fill: C.text2, family: 'monospace' }) +
      rect(1.72, 0.06, 0.22, 0.09, { r: 0.02, fill: '#05041a', opacity: 0.7 }) +
      text(1.83, 0.128, 'CH 1', { size: 0.06, anchor: 'middle', fill: C.text2, family: 'monospace' })
  else screen = rect(0, 0, 2, 1.28, { fill: 'url(#ad-x)' }) + corpLogo('X', 1.7, 1.0, 0.36, '#d8d4e4cc') + rect(0.15, 0.2, 0.9, 0.12, { fill: C.smoke, opacity: 0.7 }) + rect(0.15, 0.4, 0.6, 0.08, { fill: C.smoke, opacity: 0.45 })
  s += cam.onY(2.9, 16.98, z + 2.48, screen)
  s += cam.onZ(3.9, 17.0, z, `<ellipse cx="0" cy="1.7" rx="2.3" ry="1.6" fill="url(#light)"/>`)
  // takeout by the crate
  s += box(cam, 5.0, 18.0, z, 0.35, 0.35, 0.3, { top: '#2a2540' }) + box(cam, 5.45, 18.3, z, 0.25, 0.25, 0.22, { top: '#2a2540' })
  // the desk, the housing computer on it, the bills
  s += box(cam, 5.7, 16.6, z, 0.12, 0.12, 1.45) + box(cam, 7.8, 16.6, z, 0.12, 0.12, 1.45)
  s += box(cam, 5.7, 17.6, z, 0.12, 0.12, 1.45) + box(cam, 7.8, 17.6, z, 0.12, 0.12, 1.45)
  s += box(cam, 5.6, 16.5, z + 1.45, 2.4, 1.35, 0.14, { top: '#15131d' })
  s += box(cam, 6.1, 16.6, z + 1.59, 1.5, 0.28, 1.0, { top: '#0c0a12', rimTop: C.rimLit })
  s += cam.onY(6.17, 16.88, z + 2.52, rect(0, 0, 1.36, 0.84, { r: 0.05, fill: '#0c0a14' }) + (lod >= 20 ? face(0.68, 0.42, 0.78, 'idle') : owl(0.68, 0.42, 0.7, '#e6dcf5')))
  s += cam.onZ(6.6, 17.2, z + 1.6, `<g transform="rotate(-12)">${rect(0.1, 0.05, 0.6, 0.4, { fill: C.smoke, opacity: 0.5 })}${rect(0.5, 0.2, 0.6, 0.4, { fill: C.smoke, opacity: 0.35 })}</g>`)
  s += cam.onZ(6.85, 17.0, z, `<ellipse cx="0" cy="1.2" rx="1.6" ry="1.1" fill="url(#light)"/>`)
  // the dead plant
  s += box(cam, 8.0, 17.5, z, 0.45, 0.45, 0.55)
  {
    const [px, py] = P(8.22, 17.72, z + 0.55)
    const q = cam.k / 46
    s += `<path d="M${r2(px)} ${r2(py)} q${r2(-10 * q)} ${r2(-24 * q)} ${r2(-24 * q)} ${r2(-20 * q)} M${r2(px)} ${r2(py)} q${r2(4 * q)} ${r2(-32 * q)} ${r2(18 * q)} ${r2(-32 * q)} M${r2(px)} ${r2(py)} q${r2(-2 * q)} ${r2(-20 * q)} ${r2(-9 * q)} ${r2(-38 * q)}" stroke="${C.rim}" stroke-width="${r2(cam.rim)}" fill="none"/>`
  }
  // the mattress under the window, the pillow, the blanket thrown back
  s += box(cam, 0.55, 17.0, z, 2.2, 3.6, 0.45, { top: '#1b1726' })
  s += box(cam, 0.75, 17.15, z + 0.45, 1.8, 0.7, 0.16, { top: '#25203a' })
  s += cam.onZ(0.6, 18.9, z + 0.47, `<path d="M0 0 L2.1 0 L2.1 1.6 q-1 0.25 -2.1 0z" fill="#120f1c" stroke="${C.rim}" stroke-width="0.03"/>`)
  // the vape, lying on the mattress (gone while it's in your hand)
  if (!o.vapeInHand) {
    s += cam.onZ(1.75, 19.35, z + 0.47, `<g transform="rotate(25)">${rect(0, -0.06, 0.6, 0.12, { r: 0.06, fill: '#2a2440', stroke: C.rimLit, sw: 0.02 })}<circle cx="0.6" cy="0" r="0.05" fill="${C.lavenderLight}"/></g>`)
    const [vx, vy] = P(2.1, 19.5, z + 0.5)
    s += `<circle cx="${r2(vx)}" cy="${r2(vy)}" r="${r2(cam.k * 0.5)}" fill="url(#light-strong)" opacity="0.6"/>`
  }
  if (o.figure !== false && !o.figureOnBalcony) s += o.sit ? figure(cam, 1.6, 19.6, z + 0.45, { sit: true }) : figure(cam, 4.6, 21.0, z)
  return s
}

/**
 * The tower: its podium, the floors below the unit, the unit cut open (its balcony beyond the glass), and
 * the floors above as a ghost so you can see in. o: { tv, figureOnBalcony, sit, vapeInHand, figure, fadeRoom }.
 */
function tower(cam, o) {
  const P = cam.P
  const lod = cam.k
  let s = ''
  // the podium: shops and their signs
  const shop = (w) => rect(0, 14, w, 3, { fill: '#7b4fe6', opacity: 0.55 }) + rect(0, 20, w, 1.2, { fill: '#3fc8ff', opacity: 0.6 }) + rect(0, 0, w, 26, { fill: 'url(#win1)' })
  s += box(cam, -10, -8, 0, 32, 40, 26, { fy: shop(32) + board({ u: 4, v: 2, bw: 18, bh: 9, c: 2, words: ['BLOCK 7', 'MARKET'] }, 26), fx: shop(40) + board({ u: 10, v: 3, bw: 16, bh: 8, c: 0, words: ['READ THE', 'CONTRACT', 'X'] }, 26) })
  // the balcony first: it's beyond the unit's outside wall, seen through the glass
  s += balcony(cam, o)
  // the floors below
  s += box(cam, 0, 0, 26, T.x1, T.y1, T.zu - 26, { fy: towerWin(T.x1, T.zu - 26, false), fx: towerWin(T.y1, T.zu - 26) })
  // the back of the tower, all the way up: its +y face is the room's back wall, then the cut floors above
  const cut = (() => {
    let c = rect(0, 0, T.x1, T.top - T.zu - T.fh, { fill: '#0d0b22' })
    for (let z = 0; z < T.top - T.zu - T.fh; z += T.fh) c += rect(0, z, T.x1, 0.4, { fill: '#1d1844' }) + rect(1.2, z + 1.5, 1.4, 2.6, { fill: '#17133a' }) + rect(6.4, z + 1.2, 1.5, 4.4, { fill: '#120f30' })
    return c
  })()
  s += box(cam, 0, 0, T.zu, T.x1, U.y, T.top - T.zu, { fy: cut, fx: towerWin(U.y, T.top - T.zu) + board({ u: 2, v: 18, bw: 12, bh: 22, c: 3, words: ['JOBS', 'OFF-WORLD'] }, 60) })
  if (o.fadeRoom) s += `<g opacity="${o.fadeRoom}">`
  s += backWall(cam, lod)
  // the floor of the unit
  s += poly([P(U.x, U.y, T.zu), P(T.x1, U.y, T.zu), P(T.x1, T.y1, T.zu), P(U.x, T.y1, T.zu)], C.floor)
  s += outsideWall(cam)
  // the wall's thickness at the cut, front
  s += box(cam, 0, U.y + U.d - 0.0, T.zu, 0.4, 0.001, U.h, { top: '#1d1a2a' })
  s += furniture(cam, lod, o)
  if (o.fadeRoom) s += `</g>`
  // the unit's light, seen from far away
  if (cam.k < 20 && !o.fadeRoom) {
    const [gx, gy] = P(5, 20, T.zu + 2.5)
    s += `<circle cx="${r2(gx)}" cy="${r2(gy)}" r="${r2(cam.k * 22)}" fill="url(#light-strong)"/><circle cx="${r2(gx)}" cy="${r2(gy)}" r="${r2(cam.k * 9)}" fill="url(#light-strong)"/>`
  }
  // the cut edges of the floor, rim lit
  s += `<path d="M${pts([P(0, T.y1, T.zu)])} L${pts([P(T.x1, T.y1, T.zu)])} L${pts([P(T.x1, U.y, T.zu)])}" fill="none" stroke="${C.rimLit}" stroke-width="${r2(cam.rim * 1.4)}"/>`
  // the floors above the unit, as a ghost
  const g0 = T.zu + T.fh
  if (cam.k < 100) {
  for (let z = g0; z <= T.top; z += T.fh)
    s += `<path d="M${pts([P(0, U.y, z)])} L${pts([P(0, T.y1, z)])} L${pts([P(T.x1, T.y1, z)])} L${pts([P(T.x1, U.y, z)])}" fill="none" stroke="#5a4c8c" stroke-width="${r2(cam.rim * 0.6)}" opacity="${cam.k > 20 ? 0.18 : 0.35}"/>`
  s += `<path d="M${pts([P(0, T.y1, g0)])} L${pts([P(0, T.y1, T.top)])} M${pts([P(T.x1, T.y1, g0)])} L${pts([P(T.x1, T.y1, T.top)])} M${pts([P(T.x1, U.y, g0)])} L${pts([P(T.x1, U.y, T.top)])}" stroke="#5a4c8c" stroke-width="${r2(cam.rim * 0.7)}" opacity="${cam.k > 20 ? 0.2 : 0.45}" stroke-dasharray="${r2(cam.k * 0.8)} ${r2(cam.k * 0.6)}"/>`
  s += poly([P(0, T.y1, T.top), P(T.x1, T.y1, T.top), P(T.x1, U.y, T.top), P(0, U.y, T.top)], '#221c58', { opacity: 0.5 })
  }
  // the roof: a mast and its light
  {
    const [ax, ay] = P(5, 8, T.top)
    s += `<path d="M${r2(ax)} ${r2(ay)} l0 ${r2(-22 * cam.k)}" stroke="#3a3270" stroke-width="${r2(cam.rim)}"/><circle cx="${r2(ax)}" cy="${r2(ay - 22 * cam.k)}" r="${r2(Math.max(1.5, cam.k * 0.5))}" fill="#ff8a7a"/>`
  }
  return s
}

/** The whole world through `cam`. o passes through to the tower (and o.noCity skips the far city). */
export function world(cam, o = {}) {
  let s = worldDefs()
  s += rect(0, 0, cam.W, cam.H, { fill: 'url(#w-sky)' })
  s += streets(cam)
  const towerS = 5.2 + 12
  const items = [...CITY.map((b) => ({ kind: 'b', b, S: b.S })), ...TRAFFIC, { kind: 'tower', S: towerS }]
  items.sort((a, b) => a.S - b.S)
  for (const it of items) {
    if (it.kind === 'b') s += building(cam, it.b, towerS)
    else if (it.kind === 'car') s += car(cam, it)
    else s += tower(cam, o)
  }
  return s
}

export { figure }
