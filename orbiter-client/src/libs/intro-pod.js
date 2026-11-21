// Body storage: the room you're carried to after you sign (Koda, 2026-11-20). The same isometric world as the
// apartment (libs/intro-world.js), a room in cold blues: a cryo pod in the middle on a round plinth, wires
// running to it from racks, tanks and a medical cart, a big vitals screen on the back wall. The pod's lid
// has a window from your chest up, the glass mid-dark blue; intro-freeze.vue lays the live parts over this
// drawing (the glass, which frosts to white, the screens' readouts, the smoke from the vents).
//
// World units, the room's own: x 0..W along the back wall, y 0..D along the left wall, z up.

import { iso, ws } from './intro-world'

const { box, onX, onY, onZ, rect, text, pts, C } = iso
export const POD_ROOM = { W: 10, D: 9, H: 5 }
const { W, D, H } = POD_ROOM

/** The pod: its body, and the lid's top face (the window's plane). */
export const POD = { x: 3.1, y: 3.85, l: 3.8, w: 1.5, lid: { x: 3.25, y: 3.95, z: 1.85, l: 3.5, w: 1.3 } }
/** The window on the lid, in the lid's top-face units (u along x from the lid's corner, v along y): chest up. */
export const POD_WINDOW = { u: 1.55, v: 0.17, w: 1.8, h: 0.96, r: 0.3 }
/** The vitals screen on the back wall (u along x, v down from the wall's top), and the cart's monitor. */
export const VITALS = { u: 3.3, v: 0.75, w: 3.9, h: 1.9 }
export const CART_SCREEN = { x0: 1.65, y1: 6.02, zTop: 1.53, u: 0.04, v: 0.04, w: 0.72, h: 0.52 }
/** Where the cold vents puff, at the plinth's foot. */
export const VENTS = [
  [3.25, 5.3, 0.3],
  [6.75, 5.3, 0.3],
  [7.05, 4.0, 0.3],
  [3.05, 3.9, 0.3],
  [5.0, 5.45, 0.3],
  [7.1, 4.8, 0.3]
]
/** The view: the whole room, the pod in the middle (in world px). */
export const POD_VIEWBOX = [-480, -320, 1010, 910]

const PAL = {
  wall: '#10132a',
  wallLeft: '#0c0f22',
  seam: '#1b2040',
  floor: '#0a0c1c',
  tile: '#151a36',
  cold: '#9fd4ff',
  rim: '#2c3566',
  rimLit: '#5a6aa8',
  pod: { top: '#d9dcea', right: '#a7acc6', left: '#868bab', edge: '#f4f2fa' },
  steel: { top: '#2a2f52', right: '#1a1e3a', left: '#12152c', edge: '#3a4380' }
}

function backWall() {
  let s = rect(0, 0, W, H, { fill: PAL.wall })
  for (let u = 1.25; u < W; u += 1.25) s += rect(u, 0, 0.04, H, { fill: PAL.seam })
  s += rect(0, H - 0.3, W, 0.3, { fill: '#0b0d1e' })
  // the cold light along the top
  s += rect(1.2, 0.22, W - 2.4, 0.09, { r: 0.04, fill: PAL.cold, opacity: 0.85 })
  s += `<ellipse cx="${W / 2}" cy="0.6" rx="${W * 0.45}" ry="1.2" fill="url(#pod-wash)"/>`
  // the vitals screen's frame (its readout is live, intro-freeze.vue)
  const v = VITALS
  s += rect(v.u - 0.12, v.v - 0.12, v.w + 0.24, v.h + 0.24, { r: 0.08, fill: '#080a16', stroke: PAL.rimLit, sw: 0.04 })
  s += rect(v.u, v.v, v.w, v.h, { r: 0.04, fill: '#050915' })
  // a warning panel and a door code
  s += rect(8.25, 3.6, 0.9, 0.5, { r: 0.04, fill: '#0b0e20', stroke: PAL.rim, sw: 0.03 })
  s += text(8.7, 3.8, 'BAY 14', { size: 0.15, anchor: 'middle', fill: '#8fb8e8', family: 'monospace' })
  s += text(8.7, 3.98, '−196 °C', { size: 0.12, anchor: 'middle', fill: '#5f7fb0', family: 'monospace' })
  return onY(0, 0, H, s)
}

function leftWall() {
  let s = rect(0, 0, D, H, { fill: PAL.wallLeft })
  for (let u = 1.5; u < D; u += 1.5) s += rect(u, 0, 0.04, H, { fill: PAL.seam })
  s += rect(0, H - 0.3, D, 0.3, { fill: '#090b1a' })
  s += rect(0.8, 0.22, D - 1.6, 0.09, { r: 0.04, fill: PAL.cold, opacity: 0.7 })
  // a wall screen: the body bay map, small blocks lit
  s += rect(1.3, 1.0, 2.4, 1.4, { r: 0.05, fill: '#060a17', stroke: PAL.rimLit, sw: 0.04 })
  s += text(1.45, 1.25, 'BODY STORAGE · BLOCK 7', { size: 0.12, fill: '#8fb8e8', family: 'monospace' })
  for (let i = 0; i < 24; i++) {
    const col = i % 8
    const row = Math.floor(i / 8)
    const here = i === 13
    s += rect(1.45 + col * 0.27, 1.45 + row * 0.27, 0.2, 0.2, {
      fill: here ? PAL.cold : i % 3 === 0 ? '#1d2550' : '#2f3c7a',
      opacity: here ? 1 : 0.8
    })
  }
  s += `<rect class="pod-blink" x="${1.45 + 5 * 0.27}" y="${1.45 + 1 * 0.27}" width="0.2" height="0.2" fill="#ffffff"/>`
  // hazard stripes by the floor
  s += rect(5.2, 3.9, 2.6, 0.3, { fill: '#141838' })
  for (let u = 5.25; u < 7.7; u += 0.3) s += `<path d="M${u} 4.2 l0.15 -0.3 h0.12 l-0.15 0.3z" fill="#3a4380"/>`
  return onX(0, D, H, s)
}

function floor() {
  let s = rect(0, 0, W, D, { fill: PAL.floor })
  for (let u = 1; u < W; u++) s += rect(u, 0, 0.025, D, { fill: PAL.tile })
  for (let v = 1; v < D; v++) s += rect(0, v, W, 0.025, { fill: PAL.tile })
  s += `<ellipse cx="5" cy="4.6" rx="4.2" ry="3.6" fill="url(#pod-floorglow)"/>`
  s += text(5.05, 7.0, 'BAY 14', { size: 0.42, anchor: 'middle', fill: '#26305f', weight: 700, family: 'monospace' })
  return onZ(0, 0, 0, s)
}

/** A cable on the floor (in the floor's plane) or hanging (screen space). */
const cable = (d, color = '#05060c', edge = '#252c55', w = 0.14) =>
  `<path d="${d}" fill="none" stroke="${edge}" stroke-width="${w + 0.05}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>`

function floorCables() {
  let s = ''
  // to the racks (back left), the tanks (back right), the cart (left), and one across the front
  s += cable('M3.6 4.2 C2.8 3.4 2.4 2.2 1.4 1.0')
  s += cable('M3.8 4.0 C3.2 3.0 2.6 1.8 2.6 1.0', '#0a1440', '#2f4aa0', 0.11)
  s += cable('M6.6 4.0 C7.2 3.2 7.8 2.0 8.5 1.0')
  s += cable('M6.8 4.3 C7.6 3.6 8.6 2.6 9.3 1.0', '#05060c', '#252c55', 0.1)
  s += cable('M3.3 5.0 C2.6 5.6 2.4 6.0 2.1 6.1')
  s += cable('M3.4 5.2 C2.0 5.4 1.0 4.6 0.7 3.4', '#0a1440', '#2f4aa0', 0.1)
  return onZ(0, 0, 0, s)
}

function racks() {
  let s = ''
  for (const x of [0.3, 1.45]) {
    let face = rect(0.06, 0.08, 0.98, 3.4, { fill: '#0a0c1c' })
    for (let row = 0; row < 14; row++) {
      const v = 0.18 + row * 0.24
      face += rect(0.12, v, 0.86, 0.17, { fill: '#121630', stroke: '#1f2650', sw: 0.015 })
      for (let i = 0; i < 4; i++) {
        const lit = (row * 7 + i * 3 + Math.round(x * 10)) % 5
        const color = lit === 0 ? '#ffffff' : lit < 3 ? '#5fb8ff' : '#2f3c7a'
        const cls = lit === 1 ? ` class="pod-blink b${(row + i) % 4}"` : ''
        face += `<rect${cls} x="${0.62 + i * 0.08}" y="${v + 0.06}" width="0.05" height="0.05" fill="${color}"/>`
      }
    }
    s += box(x, 0, 0, 1.1, 0.9, 3.6, { ...PAL.steel, edge: PAL.steel.edge, fy: face })
  }
  return s
}

function tanks() {
  let s = ''
  for (const [x, y] of [
    [8.3, 0.25],
    [9.1, 0.25]
  ]) {
    let face = rect(0.08, 0.4, 0.5, 0.3, { r: 0.03, fill: '#0b0e20' })
    face += text(0.33, 0.6, 'LN₂', { size: 0.17, anchor: 'middle', fill: '#9fd4ff', weight: 700 })
    face += rect(0, 1.2, 0.66, 0.06, { fill: '#5a6aa8', opacity: 0.6 })
    face += rect(0, 2.4, 0.66, 0.06, { fill: '#5a6aa8', opacity: 0.6 })
    s += box(x, y, 0, 0.66, 0.66, 3.0, { top: '#3a4a86', right: '#25305e', left: '#1b2449', edge: '#5a6aa8', fy: face })
    s += box(x + 0.23, y + 0.23, 3.0, 0.2, 0.2, 0.25, { top: '#5a6aa8', right: '#3a4a86', left: '#2a3566' })
  }
  return s
}

function cabinet() {
  let face = rect(0.08, 0.1, 2.44, 2.2, { r: 0.04, fill: '#0b1a33', opacity: 0.85 })
  for (const v of [0.8, 1.5]) face += rect(0.08, v, 2.44, 0.05, { fill: '#3a4a86' })
  for (let i = 0; i < 9; i++)
    face += rect(0.25 + (i % 5) * 0.45, 0.35 + Math.floor(i / 5) * 0.7, 0.16, 0.38, {
      r: 0.04,
      fill: i % 3 ? '#9fd4ff' : '#e6dcf5',
      opacity: 0.55
    })
  return box(0, 1.2, 0, 0.7, 2.6, 2.4, { ...PAL.steel, fx: face })
}

function cart() {
  let s = box(1.6, 5.8, 0.85, 0.9, 0.7, 0.08, PAL.steel)
  for (const [lx, ly] of [
    [1.62, 5.82],
    [2.42, 5.82],
    [1.62, 6.42],
    [2.42, 6.42]
  ])
    s += box(lx, ly, 0, 0.06, 0.06, 0.85, PAL.steel)
  s += box(1.6, 5.8, 0.25, 0.9, 0.7, 0.06, PAL.steel)
  // the monitor: its screen faces the room (+y), the live line is drawn over it
  const m = CART_SCREEN
  s += box(m.x0, m.y1 - 0.12, 0.93, m.w + 2 * m.u, 0.12, m.zTop - 0.93, {
    ...PAL.steel,
    fy: rect(m.u, m.v, m.w, m.h, { fill: '#050915' })
  })
  // the IV stand, its bag
  s += box(2.95, 6.55, 0, 0.05, 0.05, 2.4, PAL.steel)
  s += box(2.82, 6.5, 1.75, 0.3, 0.12, 0.4, {
    top: '#9fd4ff',
    right: '#5f9fd8',
    left: '#4a86c4',
    edge: '#cfe8ff'
  })
  return s
}

function plinth() {
  // a round plinth: stacked rings make its side, then its top with a glowing edge
  let s = ''
  for (let z = 0; z <= 0.25; z += 0.05)
    s += onZ(5, 4.6, z, `<circle r="2.5" fill="${z < 0.25 ? '#141936' : '#1c2246'}"/>`)
  s += onZ(
    5,
    4.6,
    0.25,
    `<circle r="2.5" fill="#1c2246" stroke="${PAL.cold}" stroke-width="0.04" stroke-opacity="0.8"/><circle r="2.1" fill="none" stroke="#2c3566" stroke-width="0.03"/>`
  )
  return s
}

function pod() {
  const p = POD
  let s = box(3.4, 4.0, 0.25, 3.2, 1.2, 0.5, PAL.steel)
  // the body: lights along its side (+y face), a readout at its foot... its head is at the +x end
  let side = ''
  for (let i = 0; i < 10; i++)
    side += `<rect class="pod-blink b${i % 4}" x="${0.3 + i * 0.32}" y="0.3" width="0.16" height="0.06" rx="0.03" fill="${i % 3 ? '#5fb8ff' : '#9fd4ff'}"/>`
  side += rect(0.2, 0.52, p.l - 0.4, 0.03, { fill: '#6a7099' })
  let end = rect(0.25, 0.15, 0.9, 0.42, { r: 0.04, fill: '#0b0e20' })
  end += text(0.7, 0.42, 'CRYO', { size: 0.16, anchor: 'middle', fill: '#9fd4ff', family: 'monospace', weight: 700 })
  s += box(p.x, p.y, 0.75, p.l, p.w, 0.75, { ...PAL.pod, edge: PAL.pod.edge, rimTop: PAL.pod.edge, fy: side, fx: end })
  // the lid: its top holds the window (the interior and you under it are drawn here; the glass is live)
  const L = p.lid
  const wn = POD_WINDOW
  let top = rect(0, 0, L.l, L.w, { r: 0.06, fill: PAL.pod.top })
  top += rect(wn.u - 0.08, wn.v - 0.08, wn.w + 0.16, wn.h + 0.16, { r: wn.r + 0.06, fill: '#8a90b0' })
  top += rect(wn.u, wn.v, wn.w, wn.h, { r: wn.r, fill: '#070a18' })
  // you, under the glass, from the chest up: lying with your head at the window's far end; yellow is you
  const cy = wn.v + wn.h / 2
  top += `<path d="M${wn.u + 0.02} ${cy - 0.36} Q${wn.u + 0.9} ${cy - 0.42} ${wn.u + 1.1} ${cy - 0.2} L${wn.u + 1.18} ${cy + 0.2} Q${wn.u + 0.9} ${cy + 0.42} ${wn.u + 0.02} ${cy + 0.36} Z" fill="#030306" stroke="#ccff00" stroke-width="0.05" stroke-linejoin="round"/>`
  top += `<ellipse cx="${wn.u + 1.42}" cy="${cy}" rx="0.25" ry="0.21" fill="#030306" stroke="#ccff00" stroke-width="0.05"/>`
  top += rect(0.25, 0.3, 1.0, 0.06, { r: 0.03, fill: '#9aa0bf' })
  top += rect(0.25, L.w - 0.36, 1.0, 0.06, { r: 0.03, fill: '#9aa0bf' })
  s += box(L.x, L.y, 1.5, L.l, L.w, 0.35, { ...PAL.pod, edge: PAL.pod.edge, top: false })
  s += onZ(L.x, L.y, L.z, top)
  return s
}

/** Cables hanging from above the cutaway, into the pod's foot and head. */
function hangingCables() {
  let s = ''
  for (const [x, y, z, sway] of [
    [3.7, 4.3, POD.lid.z + 0.05, -40],
    [4.3, 4.9, POD.lid.z + 0.05, -20],
    [7.0, 4.3, 1.75, 40]
  ]) {
    const [ax, ay] = ws(x, y, z)
    const [tx, ty] = ws(x, y, H + 3)
    const d = `M${tx} ${ty} C${tx + sway} ${ty + 160} ${ax + sway} ${ay - 140} ${ax} ${ay}`
    s += `<path d="${d}" fill="none" stroke="#2c3566" stroke-width="9" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#06070f" stroke-width="6" stroke-linecap="round"/>`
    s += `<circle cx="${ax}" cy="${ay}" r="7" fill="#868bab" stroke="#f4f2fa" stroke-width="1"/>`
  }
  return s
}

function defs() {
  return (
    '<defs>' +
    `<radialGradient id="pod-wash"><stop offset="0" stop-color="${PAL.cold}" stop-opacity="0.18"/><stop offset="1" stop-color="${PAL.cold}" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="pod-floorglow"><stop offset="0" stop-color="#5fb8ff" stop-opacity="0.32"/><stop offset="0.6" stop-color="#3a4ad0" stop-opacity="0.1"/><stop offset="1" stop-color="#3a4ad0" stop-opacity="0"/></radialGradient>` +
    '</defs>'
  )
}

/** The room, drawn back to front (the live parts go over it). */
export function podSvg() {
  return (
    defs() +
    backWall() +
    leftWall() +
    floor() +
    racks() +
    tanks() +
    cabinet() +
    floorCables() +
    plinth() +
    cart() +
    pod() +
    hangingCables() +
    // the room's edges, so it reads as a cutaway
    `<polyline points="${pts([ws(0, D, H), ws(0, 0, H), ws(W, 0, H)])}" fill="none" stroke="${C.rimLit}" stroke-width="1.5"/>` +
    `<polyline points="${pts([ws(0, D, H), ws(0, D, 0), ws(W, D, 0), ws(W, 0, 0), ws(W, 0, H)])}" fill="none" stroke="${PAL.rim}" stroke-width="1.5"/>`
  )
}
