// D. The floor plan: the room as the housing computer sees it, a top-down schematic of unit 7-2216 in the
// game's purples, with Minerva's face and four big buttons beside it. Diegetic: the first screen you see
// with the power on is hers. The most readable take, and the one closest to the game's own map.

import { C, MONO, rect, text, label, face, button, badge, para } from '../intro/art.mjs'
import { chrome, approach } from './shared.mjs'

export const title = 'the floor plan (Minerva’s schematic)'

const WALL = '#6a5aa6'
const LINE = '#4a3f75'
const INK = '#bdb5d4'

function wallRect(x, y, w, h) {
  return rect(x, y, w, h, { fill: WALL, opacity: 0.9 })
}

export function draw(W, H) {
  let s = ''
  // the schematic's ground: a faint grid
  s += rect(0, 0, W, H, { fill: C.spaceDeep })
  for (let x = 40; x < 1010; x += 24) s += rect(x, 70, 1, H - 130, { fill: '#1a1530' })
  for (let y = 70; y < H - 60; y += 24) s += rect(40, y, 970, 1, { fill: '#1a1530' })
  s += text(64, 104, 'UNIT 7-2216 · BLOCK 7 · 18 m²', { size: 14, family: MONO, fill: C.text2, ls: 1 })
  s += text(64, 124, 'POWER RESTORED 23:41 · OCCUPANT: R. OKAFOR', { size: 12, family: MONO, fill: C.text3, ls: 1 })

  // ---- the balcony (outside, left): its slab, railing and terminal on the rail
  s += rect(90, 280, 120, 320, { fill: '#120e22', stroke: LINE, sw: 1.5, dash: '6 5' })
  s += rect(90, 280, 6, 320, { fill: INK, opacity: 0.4 })
  s += rect(98, 410, 16, 46, { r: 2, fill: C.s3, stroke: INK, sw: 1.2 })
  s += text(150, 590, 'BALCONY', { size: 11, family: MONO, fill: C.text3, anchor: 'middle', ls: 1 })
  s += `<path d="M90 300 q40 -10 70 20" stroke="${C.text3}" stroke-width="1" fill="none" opacity="0.5"/>`

  // ---- the walls: the room is 640 × 420 inside, at (230, 230)
  const X0 = 230
  const Y0 = 230
  const RW = 640
  const RH = 420
  const T = 14
  s += rect(X0, Y0, RW, RH, { fill: '#17122b' })
  // the ceiling strip's light
  s += `<ellipse cx="${X0 + 300}" cy="${Y0 + 200}" rx="300" ry="200" fill="url(#light)"/>`
  s += rect(X0 + 230, Y0 + 196, 140, 6, { r: 3, fill: C.smoke, opacity: 0.6 })
  s += text(X0 + 300, Y0 + 222, 'light strip · on', { size: 10, family: MONO, fill: C.text3, anchor: 'middle' })
  s += wallRect(X0 - T, Y0 - T, RW + 2 * T, T) // back wall
  s += wallRect(X0 - T, Y0 + RH, RW + 2 * T, T) // front wall
  s += wallRect(X0 - T, Y0 - T, T, 60) + wallRect(X0 - T, Y0 + 330, T, RH - 316) // left wall, the slider's gap
  s += wallRect(X0 + RW, Y0 - T, T, 250) + wallRect(X0 + RW, Y0 + 350, T, RH - 336) // right wall, the door's gap
  // the sliding glass door: two thin panes
  s += rect(X0 - 10, Y0 + 46, 3, 290, { fill: '#9fb6d0', opacity: 0.6 }) + rect(X0 - 4, Y0 + 40, 3, 150, { fill: '#9fb6d0', opacity: 0.6 })
  // the door out: leaf and its swing
  s += `<path d="M${X0 + RW + T} ${Y0 + 236} L${X0 + RW + T - 110} ${Y0 + 236}" stroke="${INK}" stroke-width="4"/>`
  s += `<path d="M${X0 + RW + T - 110} ${Y0 + 236} A110 110 0 0 0 ${X0 + RW + T} ${Y0 + 346}" stroke="${INK}" stroke-width="1" stroke-dasharray="4 4" fill="none"/>`
  // the ID scanner, on the wall by the door
  s += rect(X0 + RW - 12, Y0 + 196, 12, 26, { r: 2, fill: C.s3, stroke: INK, sw: 1.2 }) + `<circle cx="${X0 + RW - 6}" cy="${Y0 + 204}" r="2.5" fill="${C.brand300}"/>`

  // ---- the furniture, top-down
  // mattress, the pillow, the blanket thrown back; the vape on it
  s += rect(X0 + 16, Y0 + 14, 110, 210, { r: 8, fill: '#221b3a', stroke: INK, sw: 1.2 })
  s += rect(X0 + 26, Y0 + 22, 90, 34, { r: 10, fill: '#2c2449', stroke: INK, sw: 1 })
  s += `<path d="M${X0 + 16} ${Y0 + 120} q55 -20 110 10 l0 94 l-110 0z" fill="#1c1630" stroke="${INK}" stroke-width="1"/>`
  s += rect(X0 + 90, Y0 + 150, 26, 6, { r: 3, fill: C.s3, stroke: C.pinkLight, sw: 1 })
  // the TV on its crate, and its light thrown into the room
  s += `<path d="M${X0 + 225} ${Y0 + 16} L${X0 + 175} ${Y0 + 200} L${X0 + 395} ${Y0 + 200} L${X0 + 345} ${Y0 + 16}z" fill="#8395c4" opacity="0.08"/>`
  s += rect(X0 + 220, Y0 + 2, 130, 40, { fill: '#1c1630', stroke: INK, sw: 1.2 })
  s += rect(X0 + 214, Y0 + 2, 142, 8, { fill: '#8395c4', opacity: 0.8 })
  // takeout on the floor
  s += rect(X0 + 360, Y0 + 60, 18, 18, { r: 2, fill: '#1c1630', stroke: INK, sw: 1 }) + rect(X0 + 384, Y0 + 70, 12, 12, { r: 6, fill: '#1c1630', stroke: INK, sw: 1 })
  // the desk, the housing computer on it (her face, small), the bills, the chair
  s += rect(X0 + 430, Y0 + 2, 160, 66, { fill: '#1c1630', stroke: INK, sw: 1.2 })
  s += rect(X0 + 470, Y0 + 6, 80, 12, { r: 2, fill: C.lavenderLight, opacity: 0.9 })
  s += face(X0 + 510, Y0 + 40, 34, 'idle', { glow: false })
  s += `<g transform="rotate(10 ${X0 + 570} ${Y0 + 46})">${rect(X0 + 558, Y0 + 34, 22, 26, { fill: C.smoke, opacity: 0.5 })}</g>`
  s += rect(X0 + 488, Y0 + 82, 44, 40, { r: 10, fill: '#1c1630', stroke: INK, sw: 1 })
  // the plant, dead
  s += `<circle cx="${X0 + 615}" cy="${Y0 + 30}" r="14" fill="#1c1630" stroke="${INK}" stroke-width="1"/><path d="M${X0 + 615} ${Y0 + 30} l12 -10 M${X0 + 615} ${Y0 + 30} l-14 -4 M${X0 + 615} ${Y0 + 30} l3 14" stroke="${C.text3}" stroke-width="1.5"/>`

  // ---- you: a yellow dot and the way you face
  const yx = X0 + 330
  const yy = Y0 + 300
  s += `<path d="M${yx} ${yy} L${yx + 120} ${yy - 210} L${yx + 230} ${yy - 140}z" fill="${C.yellow}" opacity="0.07"/>`
  s += `<circle cx="${yx}" cy="${yy}" r="18" fill="${C.yellow}" opacity="0.15"/><circle cx="${yx}" cy="${yy}" r="9" fill="${C.yellow}"/>`
  s += text(yx, yy + 34, 'YOU', { size: 11, family: MONO, fill: C.yellowLight, anchor: 'middle', ls: 1 })

  // ---- the corridor past the door (right): what the curfew is about
  s += rect(904, 80, 96, H - 150, { fill: '#100c1d', stroke: LINE, sw: 1.5, dash: '6 5' })
  s += `<text transform="translate(958 ${H / 2 + 40}) rotate(-90)" font-size="11" font-family="${MONO}" fill="${C.text3}" letter-spacing="1" text-anchor="middle">CORRIDOR · CURFEW 22:00–05:00</text>`
  s += rect(918, 120, 54, 54, { fill: '#1c1630', stroke: INK, sw: 1 }) + `<path d="M918 120 l54 54 M972 120 l-54 54" stroke="${INK}" stroke-width="0.8"/>`
  s += text(945, 192, 'LIFT', { size: 10, family: MONO, fill: C.text3, anchor: 'middle' })
  s += text(945, 206, 'out of order', { size: 9, family: MONO, fill: C.text3, anchor: 'middle' })

  // dimension lines, as on a real plan
  s += `<path d="M${X0} ${Y0 + RH + 34} l${RW} 0 M${X0} ${Y0 + RH + 28} l0 12 M${X0 + RW} ${Y0 + RH + 28} l0 12" stroke="${C.text3}" stroke-width="1"/>`
  s += text(X0 + RW / 2, Y0 + RH + 52, '4.6 m', { size: 11, family: MONO, fill: C.text3, anchor: 'middle' })

  // what you can use
  s += rect(X0 + 455, Y0 - 8, 110, 44, { r: 8, stroke: C.brand300, sw: 3 })
  s += label(150, 262, 'Balcony')
  s += label(X0 + 285, Y0 + 90, 'TV')
  s += label(X0 + 510, Y0 + 168, 'Terminal', { focused: true })
  s += `<path d="M${X0 + 510} ${Y0 + 140} L${X0 + 510} ${Y0 + 40}" stroke="${C.brand300}" stroke-width="1.2"/>`
  s += label(X0 + RW - 60, Y0 + 400, 'Door · ID scanner')

  // ---- Minerva, beside the plan, and the four things as big buttons
  const px = 1036
  s += rect(px, 70, W - px - 24, H - 140, { r: 16, fill: C.s1, stroke: C.border, sw: 1.2 })
  s += face(px + (W - px - 24) / 2, 190, 170, 'talking', { oneOff: ['nod', 0.4] })
  s += text(px + (W - px - 24) / 2, 300, 'Minerva', { size: 22, weight: 700, anchor: 'middle' })
  s += text(px + (W - px - 24) / 2, 322, 'Block 7 housing', { size: 13, anchor: 'middle', fill: C.text3 })
  const p = para(px + 28, 360, 'Power’s on, Rhea. Here’s your unit, all of it. The terminal has your account. The door has opinions.', { size: 16, width: W - px - 90, fill: C.text2 })
  s += p.svg
  const by = 460
  const bw = W - px - 80
  const items = [['Balcony'], ['TV'], ['Terminal', true], ['Door']]
  items.forEach(([name, focus], i) => {
    s += button(px + 28, by + i * 70, bw, 54, name, { size: 20, focus, kind: focus ? 'primary' : 'normal' })
    s += text(px + 48, by + i * 70 + 34, String(i + 1), { size: 13, family: MONO, fill: focus ? '#1c0838' : C.text3 })
  })
  s += badge(px + 28 + bw - 14, by + 140 + 6, 2)

  s += chrome(W, H, { notice: false, hint: 'Tap a thing on the plan or a button · 1–4, arrows or the D-pad' })
  s += approach(230, 724, 660, 'D · The floor plan', [
    'The room as the housing computer draws it: top-down, every thing at once, you as a yellow dot. Minerva and four big buttons beside it, the console from the first second.',
    'Phone: the plan above, the buttons below, nothing to pan.'
  ])
  return s
}
