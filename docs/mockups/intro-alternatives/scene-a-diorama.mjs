// A. The diorama: the apartment as an isometric cutaway, a lit box hanging in the dark tower, the whole
// room readable at once with a small you standing in it. Every usable thing is a solid object with a top.

import { C, rect, text, label, face, tvAdArt, city, corpLogo } from '../intro/art.mjs'
import { chrome, approach, poly } from './shared.mjs'

export const title = 'the diorama (isometric cutaway)'

const K = 46 // px per unit
const CS = Math.cos(Math.PI / 6)
const SN = 0.5
const W = 10 // x: along the right wall
const D = 8 // y: along the left wall
const H = 5.6 // z: up
let OX = 720
let OY = 330

const iso = (x, y, z = 0) => [OX + (x - y) * CS * K, OY + (x + y) * SN * K - z * K]
const m = (a) => a.map((v) => Math.round(v * 1000) / 1000).join(' ')
/** Draw flat art on the plane y = y1 (faces +y, the right wall's face), origin at (x0, y1, zTop), px units. */
const onY = (x0, y1, zTop, inner) => { const [e, f] = iso(x0, y1, zTop); return `<g transform="matrix(${m([CS, SN, 0, 1, e, f])})">${inner}</g>` }
/** Draw flat art on the plane x = x1 (faces +x, the left wall's face), origin at (x1, yMax, zTop). */
const onX = (x1, yMax, zTop, inner) => { const [e, f] = iso(x1, yMax, zTop); return `<g transform="matrix(${m([CS, -SN, 0, 1, e, f])})">${inner}</g>` }
/** Draw flat art on the floor (z = z0), origin at (x0, y0). u along x, v along y. */
const onFloor = (x0, y0, z0, inner) => { const [e, f] = iso(x0, y0, z0); return `<g transform="matrix(${m([CS, SN, -CS, SN, e, f])})">${inner}</g>` }

/** A box from (x, y, z) sized (w, d, h): its top, its +x face and its +y face, with a rim on the top edges. */
function box(x, y, z, w, d, h, o = {}) {
  const top = [iso(x, y, z + h), iso(x + w, y, z + h), iso(x + w, y + d, z + h), iso(x, y + d, z + h)]
  const fx = [iso(x + w, y, z + h), iso(x + w, y + d, z + h), iso(x + w, y + d, z), iso(x + w, y, z)]
  const fy = [iso(x, y + d, z + h), iso(x + w, y + d, z + h), iso(x + w, y + d, z), iso(x, y + d, z)]
  return (
    poly(fy, o.left ?? '#08070d', { stroke: o.rim ?? C.rim, sw: 1 }) +
    poly(fx, o.right ?? '#0b0a12', { stroke: o.rim ?? C.rim, sw: 1 }) +
    poly(top, o.top ?? '#14121c', { stroke: o.rimTop ?? C.rimLit, sw: 1.2 })
  )
}

/** The figure: you, a small silhouette with a yellow rim (yellow means you). */
function you(x, y) {
  const [sx, sy] = iso(x, y, 0)
  return (
    `<ellipse cx="${sx}" cy="${sy}" rx="20" ry="9" fill="#000" opacity="0.6"/>` +
    `<g transform="translate(${sx} ${sy})"><path d="M-9 0 l2 -34 q-6 -2 -6 -16 l2 -14 q2 -8 11 -8 q9 0 11 8 l2 14 q0 14 -6 16 l2 34 l-6 0 l-3 -26 l-3 26z" fill="${C.black}" stroke="${C.yellow}" stroke-width="1.6" stroke-linejoin="round"/><circle cx="0" cy="-80" r="8" fill="${C.black}" stroke="${C.yellow}" stroke-width="1.6"/></g>`
  )
}

function leader(x, y, z, lx, ly, str, focused) {
  const [sx, sy] = iso(x, y, z)
  return (
    `<path d="M${sx} ${sy} L${lx} ${ly}" stroke="${C.brand300}" stroke-width="1.2" opacity="0.7"/>` +
    `<circle cx="${sx}" cy="${sy}" r="3.5" fill="${C.brand300}"/>` +
    label(lx, ly - (ly < sy ? 0 : -24), str, { focused })
  )
}

export function draw(Wpx, Hpx) {
  OX = 720
  OY = 345
  let s = ''
  // the tower around us: the city far below and behind, and the neighbours' units as dim outlines
  s += `<g opacity="0.55">${city(0, 120, Wpx, 740, { seed: 3, zoom: 1.2 })}</g>`
  s += rect(0, 0, Wpx, Hpx, { fill: '#030306', opacity: 0.35 })
  for (const [dx, dz] of [[-1, 0], [1, 0], [0, 1], [-1, 1], [1, 1], [0, -1], [-1, -1], [1, -1]]) {
    const sh = dx * W
    const sz = dz * H
    const a = [iso(sh, 0, sz + H), iso(sh + W, 0, sz + H), iso(sh + W, 0, sz), iso(sh, 0, sz)]
    s += poly(a, 'none', { stroke: '#2a2540', sw: 1, opacity: 0.6 })
    if ((dx + dz) % 2) s += onY(sh + 3, 0, sz + 3, rect(0, 0, 40, 30, { fill: '#4a4560', opacity: 0.35 }))
  }

  // the shell: floor, left wall (x = 0), right wall (y = 0)
  const floor = [iso(0, 0), iso(W, 0), iso(W, D), iso(0, D)]
  const wallR = [iso(0, 0, H), iso(W, 0, H), iso(W, 0, 0), iso(0, 0, 0)]
  const wallL = [iso(0, 0, H), iso(0, D, H), iso(0, D, 0), iso(0, 0, 0)]
  s += poly(wallR, C.wallLit) + poly(wallL, '#121019') + poly(floor, C.floor)
  // wall panels and the cold light the ceiling strip throws
  for (let x = 1.6; x < W; x += 1.6) s += `<path d="M${iso(x, 0, H).join(' ')} L${iso(x, 0, 0).join(' ')}" stroke="#1d1a2a" stroke-width="1.5"/>`
  s += onFloor(0, 0, 0, `<ellipse cx="${4.5 * K}" cy="${3 * K}" rx="${4.5 * K}" ry="${3 * K}" fill="url(#light)"/>`)
  s += onY(0, 0, H, `<ellipse cx="${4 * K}" cy="${1.4 * K}" rx="${4 * K}" ry="${2.4 * K}" fill="url(#light)"/>`)
  s += onY(2.8, 0, H - 0.08, rect(0, 0, 2.4 * K, 5, { r: 2.5, fill: C.smoke, opacity: 0.8 }))

  // ---- left wall: the balcony door (glass, the city through it) and the poster
  const gw = 3.4 * K
  const gh = 4.6 * K
  s += onX(0, D - 0.3, 4.7,
    `<clipPath id="iso-glass"><rect width="${gw}" height="${gh}"/></clipPath><g clip-path="url(#iso-glass)">${city(0, 0, gw, gh, { seed: 11, zoom: 0.7 })}${rect(0, gh * 0.72, gw, 7, { fill: C.black })}${Array.from({ length: 9 }, (_, i) => rect(6 + i * 18, gh * 0.72, 3, gh, { fill: C.black })).join('')}</g>` +
    rect(0, 0, gw, gh, { fill: 'url(#glass)' }) + rect(0, 0, gw, gh, { stroke: '#1d1a28', sw: 8 }) + rect(gw / 2 - 3, 0, 6, gh, { fill: '#1d1a28' }))
  s += onX(0, 3.6, 4.4,
    rect(0, 0, 1.6 * K, 2.2 * K, { r: 3, fill: '#14121c', stroke: C.rim, sw: 1.5 }) +
    `<g opacity="0.55">${rect(8, 8, 1.6 * K - 16, 1.5 * K - 8, { fill: '#1c2030' })}<circle cx="${0.8 * K}" cy="${0.85 * K}" r="16" fill="#8a8070" opacity="0.6"/><path d="M14 ${1.4 * K} L${1.4 * K} 20" stroke="${C.smoke}" stroke-width="2"/></g>` +
    text(0.8 * K, 1.9 * K, 'ORBITER 8', { size: 10, anchor: 'middle', fill: C.text3, weight: 700, ls: 1.5 }))

  // ---- right wall: the door out (off the far end), its number, the ID scanner
  s += onY(8.4, 0, 4.4,
    rect(0, 0, 1.6 * K, 4.4 * K, { fill: '#0a0910', stroke: C.rimLit, sw: 4 }) +
    rect(8, 10, 1.6 * K - 16, 1.7 * K, { r: 3, stroke: '#1d1a28', sw: 2 }) +
    rect(12, 2.3 * K, 9, 34, { r: 4, fill: C.rim }) +
    `<circle cx="16" cy="${2.1 * K}" r="4" fill="${C.brand300}"/>` +
    rect(0.3 * K, -30, 1.1 * K, 20, { r: 3, fill: C.black, stroke: C.rim, sw: 1 }) +
    text(0.85 * K, -15, '7-2216', { size: 12, anchor: 'middle', fill: C.text3, family: 'monospace' }))
  s += onY(7.6, 0, 3.3,
    rect(0, 0, 30, 54, { r: 6, fill: '#0c0a14', stroke: C.rimLit, sw: 1.5 }) +
    rect(4, 5, 22, 20, { r: 3, fill: '#060509' }) + face(15, 15, 22, 'idle', { glow: false }) +
    rect(7, 33, 16, 3, { r: 1.5, fill: C.smoke, opacity: 0.5 }))

  // ---- the floor's things, back to front: crate and TV, desk and terminal, mattress, plant
  s += box(3.0, 0.2, 0, 1.8, 1.0, 1.1, { top: '#110f18' })
  s += box(2.8, 0.25, 1.1, 2.2, 0.35, 1.45, { top: '#0c0a12', rimTop: C.rimLit })
  s += onY(2.9, 0.6, 2.47, `<svg width="${2.0 * K}" height="${1.25 * K}" viewBox="0 0 468 300" preserveAspectRatio="none">${tvAdArt('X')}</svg>`)
  s += onFloor(3.9, 0.6, 0, `<ellipse cx="0" cy="${1.6 * K}" rx="${2 * K}" ry="${1.4 * K}" fill="url(#light)"/>`)
  // the desk
  s += box(5.6, 0.1, 1.45, 2.4, 1.3, 0.15, { top: '#15131d' })
  s += box(5.7, 0.2, 0, 0.15, 0.15, 1.45) + box(7.75, 0.2, 0, 0.15, 0.15, 1.45) + box(5.7, 1.1, 0, 0.15, 0.15, 1.45) + box(7.75, 1.1, 0, 0.15, 0.15, 1.45)
  s += box(6.1, 0.3, 1.6, 1.5, 0.3, 1.0, { top: '#0c0a12', rimTop: C.rimLit })
  s += onY(6.18, 0.6, 2.52, rect(0, 0, 1.34 * K, 0.84 * K, { r: 3, fill: '#0c0a14' }) + face(0.67 * K, 0.42 * K, 44, 'idle'))
  s += onFloor(6.7, 1.1, 1.6, `<g transform="rotate(-12)">${rect(10, 4, 34, 22, { fill: C.smoke, opacity: 0.5 })}</g>`)
  // the mattress under the poster
  s += box(0.15, 1.2, 0, 2.2, 3.6, 0.45, { top: '#17141f' })
  s += box(0.35, 1.4, 0.45, 1.8, 0.7, 0.18, { top: '#1d1a27' })
  s += onFloor(0.25, 2.4, 0.47, `<path d="M0 0 L${2 * K} 0 L${2 * K} ${2.2 * K} q-${K} 14 -${2 * K} 0z" fill="#0f0d16" stroke="${C.rim}" stroke-width="1.2"/>`)
  // the dead plant
  s += box(8.3, 0.4, 0, 0.5, 0.5, 0.6)
  {
    const [px, py] = iso(8.55, 0.65, 0.6)
    s += `<path d="M${px} ${py} q-10 -26 -26 -22 M${px} ${py} q4 -34 20 -34 M${px} ${py} q-2 -22 -10 -40" stroke="${C.rim}" stroke-width="2.5" fill="none"/>`
  }

  // the focus: the terminal, in the lavender ring
  {
    const a = [iso(6.0, 0.6, 2.75), iso(7.7, 0.6, 2.75), iso(7.7, 0.6, 1.45), iso(6.0, 0.6, 1.45)]
    s += poly(a, 'none', { stroke: C.brand300, sw: 3 })
  }
  // you, in the middle of the floor, facing the desk
  s += you(5.2, 3.6)

  // the room's open edges: a thin cut line, as in a cutaway
  s += `<path d="M${iso(0, D, H).join(' ')} L${iso(0, D, 0).join(' ')} L${iso(W, D, 0).join(' ')} L${iso(W, 0, 0).join(' ')} L${iso(W, 0, H).join(' ')}" fill="none" stroke="${C.rimLit}" stroke-width="2"/>`
  s += `<path d="M${iso(0, D, 0).join(' ')} l0 18 L${iso(W, D, 0)[0]} ${iso(W, D, 0)[1] + 18} L${iso(W, 0, 0)[0]} ${iso(W, 0, 0)[1] + 18} l0 -18" fill="#050409" stroke="${C.rim}" stroke-width="1.5"/>`

  // what you can use, labelled with leader lines
  s += leader(0, 6.3, 3.4, 220, 520, 'Balcony')
  s += leader(3.9, 0.6, 2.6, 780, 250, 'TV')
  s += leader(6.85, 0.6, 2.75, 1010, 300, 'Terminal', true)
  s += leader(9.2, 0, 4.4, 1260, 345, 'Door · ID scanner')

  s += chrome(Wpx, Hpx, { noticeX: 24, noticeY: 64, noticeW: 520 })
  s += approach(1060, 70, 360, 'A · The diorama', [
    'The room as an isometric cutaway hanging in the tower, neighbours as outlines. Everything at once, nothing off the edges; you are the small figure (yellow), so the room has a person in it.',
    'Phone: the same box fills the width; no panning needed.'
  ])
  return s
}
