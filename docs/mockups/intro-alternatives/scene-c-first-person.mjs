// C. First person: you're sitting up on the mattress, the blanket over your knees, looking across the
// room in one-point perspective. The walls come at you; your own hand points at what has focus. The
// most intimate take: you are in the room, not watching it.

import { C, rect, text, label, face, tvAdArt, city, hand } from '../intro/art.mjs'
import { chrome, approach, poly } from './shared.mjs'

export const title = 'first person (from the mattress)'

const VP = [720, 420]
const BW = { x0: 430, x1: 1010, y0: 210, y1: 600 } // the back wall
const kTop = (BW.y0 - VP[1]) / (BW.x0 - VP[0]) // slope from the vanishing point to the back wall's corners
const kBot = (BW.y1 - VP[1]) / (BW.x0 - VP[0])
/** A point on the left wall at screen x, f of the way from ceiling (0) to floor (1). */
const L = (x, f) => {
  const top = VP[1] + (x - VP[0]) * kTop
  const bot = VP[1] + (x - VP[0]) * kBot
  return [x, top + f * (bot - top)]
}
/** The same on the right wall (mirror). */
const R = (x, f) => {
  const [, y] = L(2 * VP[0] - x, f)
  return [x, y]
}
/** A point on the floor: across (0 = left wall, 1 = right wall), depth d (0 = back wall, 1 = the screen's bottom). */
const FL = (a, d) => {
  const y = BW.y1 + d * (900 - BW.y1)
  const half = (y - VP[1]) / kBot
  return [VP[0] - half + a * 2 * half, y]
}

export function draw(W, H) {
  let s = ''
  // ceiling, walls, floor
  s += poly([[0, -200], [W, -200], R(BW.x1, 0), L(BW.x0, 0)], '#0a0910')
  s += poly([L(0, 0), L(BW.x0, 0), L(BW.x0, 1), L(0, 1)], '#100e17')
  s += poly([R(W, 0), R(BW.x1, 0), R(BW.x1, 1), R(W, 1)], '#121019')
  s += poly([L(0, 1), L(BW.x0, 1), R(BW.x1, 1), R(W, 1), [W, H], [0, H]], C.floor)
  s += rect(BW.x0, BW.y0, BW.x1 - BW.x0, BW.y1 - BW.y0, { fill: C.wallLit })
  // the corners' rim light
  for (const p of [[L(BW.x0, 0), L(BW.x0, 1)], [R(BW.x1, 0), R(BW.x1, 1)], [L(0, 1), L(BW.x0, 1)], [R(W, 1), R(BW.x1, 1)]])
    s += `<path d="M${p[0].join(' ')} L${p[1].join(' ')}" stroke="${C.rim}" stroke-width="1.5"/>`
  s += rect(BW.x0, BW.y1 - 1, BW.x1 - BW.x0, 2, { fill: C.rimLit })
  // the ceiling strip and its light
  s += poly([[650, 178], [790, 178], [804, 192], [636, 192]], C.smoke, { opacity: 0.8 })
  s += `<ellipse cx="720" cy="360" rx="520" ry="320" fill="url(#light)"/>`
  // floor boards running to the vanishing point
  for (let a = 0.1; a < 1; a += 0.1) s += `<path d="M${FL(a, 0).join(' ')} L${FL(a, 1).join(' ')}" stroke="#14121c" stroke-width="1"/>`

  // ---- left wall: the balcony's sliding door, the city through it
  const g = [L(40, 0.12), L(340, 0.12), L(340, 1), L(40, 1)]
  s += `<clipPath id="fp-glass"><polygon points="${g.map((p) => p.join(',')).join(' ')}"/></clipPath>`
  s += `<g clip-path="url(#fp-glass)">${city(0, -60, 360, 900, { seed: 11, zoom: 1.3 })}`
  s += poly([L(0, 0.68), L(360, 0.68), L(360, 0.7), L(0, 0.705)], C.black)
  for (let x = 30; x < 360; x += 34) s += poly([L(x, 0.69), L(x + 6, 0.69), L(x + 6, 1), L(x, 1)], C.black)
  s += `</g>`
  s += poly(g, 'url(#glass)', { stroke: '#1d1a28', sw: 10 })
  s += poly([L(186, 0.12), L(196, 0.12), L(196, 1), L(186, 1)], '#1d1a28')
  // the curtain, bunched against the glass
  s += `<path d="M${L(340, 0.1).join(' ')} q14 140 -4 300 q-10 120 22 ${L(370, 1)[1] - L(340, 0.1)[1] - 300} l40 0 q-20 -200 -10 -330 q8 -150 -14 ${-(L(370, 1)[1] - L(340, 0.1)[1] - 300)}z" fill="#0c0a13" stroke="${C.rim}" stroke-width="2"/>`

  // ---- the back wall: the TV on its crate, the desk and the housing computer, the plant
  s += rect(520, 488, 150, 112, { fill: C.black, stroke: C.rim, sw: 1.5 }) + `<path d="M520 520 L670 520 M520 556 L670 556" stroke="${C.rim}" stroke-width="1.2"/>`
  s += rect(488, 368, 214, 128, { r: 6, fill: C.black, stroke: C.rimLit, sw: 3 })
  s += `<svg x="496" y="376" width="198" height="112" viewBox="0 0 468 300" preserveAspectRatio="xMidYMid slice">${tvAdArt('X')}</svg>`
  s += `<ellipse cx="595" cy="440" rx="190" ry="130" fill="url(#light)"/>`
  s += `<path d="M538 488 l8 -16 24 0 5 16z" fill="#0b0a12" stroke="${C.rim}" stroke-width="1"/>`
  // the desk
  s += rect(740, 480, 190, 12, { fill: C.black, stroke: C.rim, sw: 1.5 }) + rect(748, 492, 9, 108, { fill: C.black }) + rect(913, 492, 9, 108, { fill: C.black })
  s += rect(762, 384, 146, 92, { r: 5, fill: C.black, stroke: C.rimLit, sw: 2.5 }) + rect(826, 476, 18, 6, { fill: C.black })
  s += rect(770, 392, 130, 76, { r: 3, fill: '#0c0a14' }) + face(835, 428, 80, 'idle')
  s += `<ellipse cx="835" cy="440" rx="140" ry="100" fill="url(#light)"/>`
  s += `<g transform="rotate(-8 905 474)">${rect(888, 462, 34, 18, { fill: C.smoke, opacity: 0.55 })}</g>`
  // the bills pinned above the desk, overdue
  s += `<g transform="rotate(4 790 300)">${rect(776, 282, 34, 44, { fill: C.smoke, opacity: 0.4 })}</g><g transform="rotate(-6 836 296)">${rect(822, 278, 34, 44, { fill: C.smoke, opacity: 0.32 })}</g>`
  s += `<circle cx="840" cy="282" r="3" fill="${C.pink}"/>`
  // the plant, dead, in the corner
  s += `<path d="M960 600 l5 -34 l26 0 l5 34z" fill="#0b0a12" stroke="${C.rim}" stroke-width="1.2"/><path d="M978 566 q-10 -26 -26 -22 M978 566 q4 -36 22 -36 M978 566 q-2 -22 -12 -44" stroke="${C.rim}" stroke-width="2.5" fill="none"/>`

  // ---- right wall: the door out, its number, the ID scanner
  const d = [R(1130, 0.18), R(1330, 0.18), R(1330, 1), R(1130, 1)]
  s += poly(d, '#0a0910', { stroke: C.rimLit, sw: 4 })
  s += poly([R(1150, 0.24), R(1310, 0.24), R(1310, 0.52), R(1150, 0.52)], 'none', { stroke: '#1d1a28', sw: 2 })
  s += poly([R(1150, 0.58), R(1310, 0.58), R(1310, 0.96), R(1150, 0.96)], 'none', { stroke: '#1d1a28', sw: 2 })
  s += poly([R(1146, 0.57), R(1160, 0.57), R(1160, 0.66), R(1146, 0.66)], C.rim)
  s += `<circle cx="${R(1152, 0.54)[0]}" cy="${R(1152, 0.54)[1]}" r="5" fill="${C.brand300}"/>`
  s += poly([R(1190, 0.08), R(1280, 0.08), R(1280, 0.14), R(1190, 0.14)], C.black, { stroke: C.rim, sw: 1 })
  s += `<text x="0" y="0" transform="matrix(1 ${(R(1280, 0.12)[1] - R(1190, 0.12)[1]) / 90} 0 1 ${R(1200, 0.125)[0]} ${R(1200, 0.125)[1]})" font-size="16" font-family="monospace" fill="${C.text3}">7-2216</text>`
  // the scanner, by the door
  s += poly([R(1060, 0.38), R(1094, 0.38), R(1094, 0.56), R(1060, 0.56)], '#0c0a14', { stroke: C.rimLit, sw: 1.5 })
  s += face(1077, R(1077, 0.43)[1], 28, 'idle', { glow: false })

  // ---- the foreground: the blanket over your knees, the takeout on the floor, your hand
  s += `<path d="M330 760 q-20 -40 30 -60 l140 -10 q40 -2 52 30 l10 30z" fill="#0b0a12" stroke="${C.rim}" stroke-width="1.5"/>`
  s += rect(390, 676, 26, 30, { r: 3, fill: '#1a1726', stroke: C.rim, sw: 1 })
  s += `<path d="M-40 ${H} q60 -150 250 -170 q120 -14 200 -10 q60 -40 140 -30 q60 10 80 70 q40 -60 120 -70 q90 -6 140 80 l40 130z" fill="${C.black}" stroke="${C.rimLit}" stroke-width="2.5"/>`
  s += `<path d="M150 820 q120 -40 260 0 M560 800 q80 -30 180 10" stroke="${C.rim}" stroke-width="2" fill="none"/>`
  // the vape, on the blanket
  s += `<g transform="rotate(-18 690 780)">${rect(650, 772, 70, 12, { r: 6, fill: '#15121e', stroke: C.rim, sw: 1 })}<circle cx="716" cy="778" r="3" fill="${C.pinkLight}" opacity="0.5"/></g>`
  s += `<g transform="rotate(-14 852 512)">${hand(842, 512, 1.15, { extra: `<path d="M-52 290 L92 282 L120 520 L-80 520z" fill="${C.black}" stroke="${C.rimLit}" stroke-width="2.5"/>` })}</g>`

  // what you can use; the terminal has focus
  s += rect(752, 374, 166, 112, { r: 10, stroke: C.brand300, sw: 3 })
  s += label(190, L(190, 0.12)[1] + 40, 'Balcony')
  s += label(595, 352, 'TV')
  s += label(835, 362, 'Terminal', { focused: true })
  s += label(1225, 330, 'Door · ID scanner')

  s += chrome(W, H, { noticeX: 440, noticeY: 64, noticeW: 560, hint: 'Look and tap · Tab, arrows or the D-pad move between things' })
  s += approach(1064, 64, 356, 'C · First person', [
    'Sitting up on the mattress, looking across the room in one-point perspective; your knees, the vape on the blanket, your hand pointing. The most intimate take: you are in it.',
    'Phone: the same view, narrower; the walls slide in as you look left (balcony) and right (door).'
  ])
  return s
}
