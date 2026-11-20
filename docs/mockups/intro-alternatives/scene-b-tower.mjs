// B. The tower: the camera is outside, on the face of the block at night. Every unit is a dark facade but
// yours, cut open like a dollhouse, with the corridor beyond your door cut open too. You see where you
// live before you see what's in it: the balcony is outside, the danger is the corridor.

import { C, rect, text, label, room, city, focusRing } from '../intro/art.mjs'
import { chrome, approach } from './shared.mjs'

export const title = 'the tower (a dollhouse cross-section)'

const FH = 400 // one floor, slab included
const SLAB = 22
const Y0 = 290 // your floor's ceiling
const UNIT = 540
const BAL = 130
const CORE = 190
// columns, left to right: [neighbour unit][your balcony][your unit][core][balcony][neighbour unit]
const COLS = { nUnit: -270, bal: 270, unit: 400, core: 940, bal2: 1130, nUnit2: 1260 }

function facadeUnit(x, y, seed) {
  const h = FH - SLAB
  let s = rect(x, y, UNIT, h, { fill: '#08070c' })
  s += rect(x, y, UNIT, 2, { fill: '#1f1b2d' })
  const lit = seed % 3 === 0
  const tv = seed % 4 === 1
  // the window band
  const wx = x + 50
  const wy = y + 70
  const ww = UNIT - 130
  const wh = h * 0.48
  s += rect(wx, wy, ww, wh, { fill: lit ? '#1e1a26' : '#07060b', stroke: '#1d1a28', sw: 6 })
  if (lit) s += rect(wx + 6, wy + 6, ww - 12, wh - 12, { fill: '#5a4f44', opacity: 0.25 })
  if (tv) s += `<ellipse cx="${wx + ww * 0.6}" cy="${wy + wh * 0.7}" rx="${ww * 0.3}" ry="${wh * 0.5}" fill="url(#light)" opacity="0.8"/>`
  for (let i = 1; i < 12; i++) s += rect(wx + 4, wy + (wh / 12) * i, ww - 8, 2, { fill: '#000', opacity: lit ? 0.5 : 0.25 })
  s += rect(wx + ww / 2 - 3, wy, 6, wh, { fill: '#1d1a28' })
  // an air conditioner, a stain, a number
  s += rect(x + UNIT - 70, wy + wh + 30, 48, 34, { r: 3, fill: '#09080e', stroke: C.rim, sw: 1 })
  s += `<path d="M${x + UNIT - 46} ${wy + wh + 64} l0 ${h - wh - 140}" stroke="#1a1626" stroke-width="3"/>`
  s += text(x + 50, y + 44, `7-${2216 + seed}`, { size: 13, fill: '#3a3550', family: 'monospace' })
  return s
}

function balcony(x, y, o = {}) {
  const h = FH - SLAB
  let s = ''
  // the slab sticking out and the railing
  s += rect(x - 10, y + h - 6, BAL + 10, 16, { fill: '#100e17', stroke: C.rim, sw: 1 })
  s += rect(x, y + h - 120, BAL, 6, { fill: C.black, stroke: o.lit ? C.rimLit : C.rim, sw: 1 })
  for (let i = 0; i < 6; i++) s += rect(x + 4 + i * 24, y + h - 114, 4, 108, { fill: C.black, stroke: C.rim, sw: 0.5 })
  if (o.junk) s += `<path d="M${x + 20} ${y + h - 6} l6 -40 l30 0 l6 40z" fill="#0b0a12" stroke="${C.rim}" stroke-width="1"/>`
  return s
}

function corridor(x, y) {
  const h = FH - SLAB
  let s = rect(x, y, CORE, h, { fill: '#121019' })
  // the strip light, failing, and its pool
  s += rect(x + 40, y + 8, 110, 5, { r: 2, fill: C.smoke, opacity: 0.55 })
  s += `<ellipse cx="${x + 95}" cy="${y + 90}" rx="130" ry="140" fill="url(#light)"/>`
  // the elevator, out of order
  s += rect(x + 100, y + 110, 76, h - 110, { fill: '#0a0910', stroke: C.rim, sw: 2 })
  s += rect(x + 137, y + 110, 2, h - 110, { fill: C.rim })
  s += rect(x + 106, y + 80, 64, 20, { r: 3, fill: C.black, stroke: C.rim, sw: 1 })
  s += text(x + 138, y + 95, '— —', { size: 12, anchor: 'middle', fill: '#5a5470', family: 'monospace' })
  // the camera in the corner, its lens dead
  s += `<path d="M${x + CORE - 14} ${y + 20} l-30 10 l0 14 l30 -6z" fill="${C.black}" stroke="${C.rim}" stroke-width="1"/>`
  // scrawl by the elevator: what the block is like
  s += text(x + 12, y + 230, '3 ASSAULTS', { size: 11, fill: '#6a5f78', family: 'monospace', ls: 1 })
  s += text(x + 12, y + 246, '0 ARRESTS', { size: 11, fill: '#6a5f78', family: 'monospace', ls: 1 })
  // the floor
  s += rect(x, y + h - 2, CORE, 2, { fill: C.rimLit })
  return s
}

function you(x, y) {
  return `<g transform="translate(${x} ${y})"><ellipse rx="22" ry="6" fill="#000" opacity="0.6"/><path d="M-10 0 l2 -40 q-7 -2 -7 -18 l2 -16 q2 -10 13 -10 q11 0 13 10 l2 16 q0 16 -7 18 l2 40 l-7 0 l-3 -30 l-3 30z" fill="${C.black}" stroke="${C.yellow}" stroke-width="1.8" stroke-linejoin="round"/><circle cy="-94" r="10" fill="${C.black}" stroke="${C.yellow}" stroke-width="1.8"/></g>`
}

export function draw(W, H) {
  let s = ''
  // a sliver of sky and the city beyond the block's edge, far left
  s += city(0, 0, W, H, { seed: 21, zoom: 0.9 })
  // the block's face: three floors, ours in the middle
  s += rect(-20, -40, W + 40, H + 80, { fill: '#060509' })
  for (let f = -1; f <= 1; f++) {
    const y = Y0 + f * FH
    // slab between floors
    s += rect(-20, y - SLAB, W + 40, SLAB, { fill: '#100e17' }) + rect(-20, y - SLAB, W + 40, 1.5, { fill: '#221d33' })
    s += facadeUnit(COLS.nUnit, y, 7 + f * 3)
    s += facadeUnit(COLS.nUnit2, y, 8 + f * 5)
    if (f !== 0) {
      s += facadeUnit(COLS.unit, y, f < 0 ? 4 : 9)
      // the core's face: a stair window
      s += rect(COLS.core, y, CORE, FH - SLAB, { fill: '#0b0a11' })
      s += rect(COLS.core + 70, y + 60, 50, FH - SLAB - 120, { fill: '#07060b', stroke: '#1d1a28', sw: 4 })
    }
    s += balcony(COLS.bal, y, { junk: f === 1 })
    s += balcony(COLS.bal2, y, { junk: f === -1 })
  }
  // a corporate billboard bolted to the core, two floors up, lighting the facade
  {
    const bx = 1200
    const by = Y0 + FH + 70
    s += `<ellipse cx="${bx + 120}" cy="${by + 60}" rx="300" ry="180" fill="url(#light)"/>`
    s += rect(bx, by, 240, 110, { fill: 'url(#ad-y)', stroke: C.black, sw: 6 })
    s += text(bx + 120, by + 50, 'WE PLAN IN', { size: 24, anchor: 'middle', weight: 700, fill: C.smoke, opacity: 0.85 })
    s += text(bx + 120, by + 80, 'CENTURIES', { size: 24, anchor: 'middle', weight: 700, fill: C.smoke, opacity: 0.85 })
  }
  // a neighbour's lit window with someone in it, and laundry on a balcony
  s += `<path d="M120 ${Y0 + 180} l2 -40 q-7 -2 -7 -18 l2 -16 q2 -10 13 -10 q11 0 13 10 l2 16 q0 16 -7 18 l2 40z" fill="${C.black}" opacity="0.9"/><circle cx="130" cy="${Y0 + 76}" r="10" fill="${C.black}"/>`
  s += `<path d="M${COLS.bal2} ${Y0 - FH + 120} q65 18 130 0" stroke="${C.rim}" stroke-width="1.5" fill="none"/>` + [0, 1, 2].map((i) => rect(COLS.bal2 + 18 + i * 36, Y0 - FH + 124 + (i === 1 ? 5 : 0), 22, 34 + i * 6, { fill: '#17141f', stroke: C.rim, sw: 1 })).join('')

  // ---- your unit, cut open: the room itself, seen straight on through the missing front wall
  const ih = FH - SLAB
  s += `<ellipse cx="${COLS.unit + UNIT / 2}" cy="${Y0 + ih / 2}" rx="${UNIT * 0.8}" ry="${ih * 0.8}" fill="url(#light)" opacity="0.6"/>`
  s += `<svg x="${COLS.unit}" y="${Y0}" width="${UNIT}" height="${ih}" viewBox="380 180 1220 ${1220 * ih / UNIT}" preserveAspectRatio="xMidYMax slice">${room({ tv: 'X' })}</svg>`
  // the side walls' thickness, cut: the glass door to the balcony on the left, the wall to the corridor on the right
  s += rect(COLS.unit - 6, Y0, 10, ih, { fill: '#1d1a28' })
  s += rect(COLS.unit - 3, Y0 + 40, 4, ih - 40, { fill: C.smoke, opacity: 0.25 })
  s += rect(COLS.core - 8, Y0, 14, ih, { fill: '#1d1a28' })
  // the cut edges, rim-lit
  s += rect(COLS.unit - 6, Y0 - 2, UNIT + 14, 2, { fill: C.rimLit }) + rect(COLS.unit - 6, Y0 + ih, UNIT + 14, 3, { fill: C.rimLit })
  // the corridor, cut open too
  s += corridor(COLS.core + 6, Y0)
  // your balcony's terminal on its railing, lit, and the city glow on it
  s += rect(COLS.bal + 46, Y0 + ih - 152, 48, 32, { r: 4, fill: '#0c0a14', stroke: C.rimLit, sw: 1.5 })
  s += rect(COLS.bal + 51, Y0 + ih - 147, 38, 20, { r: 2, fill: C.smoke, opacity: 0.6 })
  s += balcony(COLS.bal, Y0, { lit: true })

  // you, by the TV
  s += you(COLS.unit + 255, Y0 + ih - 18)

  // what you can use
  const k = UNIT / 1220
  const rx = (x) => COLS.unit + (x - 380) * k
  const ry = (y) => Y0 + ih - (1000 - y) * k
  s += focusRing(rx(985) - 4, ry(520) - 4, 190 * k + 8, 150 * k + 8, { focused: true, r: 8 })
  s += label(COLS.bal + 65, Y0 + ih - 172, 'Balcony')
  s += label(rx(835), ry(495) - 10, 'TV')
  s += label(rx(1080), ry(520) - 10, 'Terminal', { focused: true })
  s += label(COLS.core - 10, Y0 + 40, 'Door · ID scanner')

  s += chrome(W, H, { noticeX: 24, noticeY: 64, noticeW: 520 })
  s += approach(1060, 64, 360, 'B · The tower', [
    'Outside, on the face of the block. Every unit dark but yours, cut open; the corridor past your door is cut open too: empty, the camera dead, "3 assaults, 0 arrests". The curfew is shown, not told.',
    'Later beats play in the same frame: the escort comes up the corridor and knocks.',
    'Phone: one column (balcony, unit, corridor stacked by panning up and down the block).'
  ])
  return s
}
