// E. The comic page: the moment told as a graphic novel. A wide establishing panel (the block, your
// window lighting up, the flicker as a sound effect), then one panel per thing you can use, each panel
// a button, captions in the narrator's voice and Minerva in a speech balloon.

import { C, FONT, MONO, rect, text, label, face, tvAdArt, city, CORPS } from '../intro/art.mjs'
import { chrome, approach, poly } from './shared.mjs'

export const title = 'the comic page'

const INK = C.rimLit
const COMIC = "'Comic Neue', 'Bangers', Ubuntu, sans-serif"

function caption(x, y, w, lines, o = {}) {
  const lh = 20
  const h = lines.length * lh + 16
  return (
    rect(x, y, w, h, { fill: o.fill ?? C.lavender, stroke: C.black, sw: 2 }) +
    lines.map((l, i) => text(x + 10, y + 24 + i * lh, l, { size: 15, fill: '#1c0838', weight: 700, family: FONT, ls: 0.3 })).join('')
  )
}
function balloon(x, y, w, h, tail, lines) {
  const [tx, ty] = tail
  return (
    `<path d="M${x + w * 0.3} ${y + h - 4} L${tx} ${ty} L${x + w * 0.45} ${y + h - 6}z" fill="${C.text}" stroke="${C.black}" stroke-width="2"/>` +
    `<ellipse cx="${x + w / 2}" cy="${y + h / 2}" rx="${w / 2}" ry="${h / 2}" fill="${C.text}" stroke="${C.black}" stroke-width="2"/>` +
    `<path d="M${x + w * 0.31} ${y + h - 7} L${x + w * 0.44} ${y + h - 8}" stroke="${C.text}" stroke-width="5"/>` +
    lines.map((l, i) => text(x + w / 2, y + h / 2 - ((lines.length - 1) * 19) / 2 + 6 + i * 19, l, { size: 16, fill: '#1c0838', weight: 700, anchor: 'middle' })).join('')
  )
}
const halftone = `<pattern id="dots" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><circle cx="3.5" cy="3.5" r="1.3" fill="#e6dcf5" opacity="0.12"/></pattern>`

export function draw(W, H) {
  let s = `<defs>${halftone}</defs>`
  s += rect(0, 0, W, H, { fill: '#050409' })

  // ---- panel 1: the block, from across the street; one window lights up
  const p1 = [[24, 60], [W - 24, 60], [W - 24, 318], [24, 336]]
  s += `<clipPath id="p1"><polygon points="${p1.map((p) => p.join(',')).join(' ')}"/></clipPath><g clip-path="url(#p1)">`
  s += city(24, 60, W - 48, 280, { seed: 5, zoom: 0.8 })
  // our tower, in the middle, its window grid dark
  s += rect(560, 70, 340, 300, { fill: '#07060b', stroke: C.rim, sw: 2 })
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 8; c++) {
      const lit = r === 4 && c === 5
      s += rect(578 + c * 40, 86 + r * 28, 26, 16, { fill: lit ? C.smoke : '#14121c', opacity: lit ? 0.85 : 1 })
    }
  s += `<ellipse cx="${578 + 5 * 40 + 13}" cy="${86 + 4 * 28 + 8}" rx="70" ry="50" fill="url(#light-strong)"/>`
  s += rect(24, 60, W - 48, 280, { fill: 'url(#dots)' })
  // the flicker, as sound
  s += `<g transform="rotate(-8 900 150)">${text(930, 140, 'tik…', { size: 22, weight: 700, fill: C.text2, family: COMIC })}${text(990, 172, 'tik…', { size: 26, weight: 700, fill: C.text2, family: COMIC })}${text(1050, 214, 'HMMMM', { size: 44, weight: 900, fill: C.lavenderLight, family: COMIC, ls: 3 })}</g>`
  s += `<path d="M${578 + 5 * 40 + 30} ${86 + 4 * 28 + 4} Q 880 160 920 150" stroke="${C.text2}" stroke-width="1.5" fill="none" stroke-dasharray="3 4"/>`
  s += `</g>` + poly(p1, 'none', { stroke: INK, sw: 3 })
  s += caption(44, 76, 300, ['BLOCK 7. 23:41.', 'The power comes back on.'])
  s += caption(W - 400, 268, 356, ['So do the bills. And the TV. And Minerva.'], { fill: C.lavenderLight })

  // ---- row two: one panel per thing, slanted gutters
  const top = 352
  const bot = 834
  const G = 14
  const B = [[24, 24], [336, 316], [690, 720], [1112, 1090], [W - 24, W - 24]]
  const panel = (i) => [
    [B[i][0] + (i ? G / 2 : 0), top], [B[i + 1][0] - (i < 3 ? G / 2 : 0), top],
    [B[i + 1][1] - (i < 3 ? G / 2 : 0), bot], [B[i][1] + (i ? G / 2 : 0), bot]
  ]
  const clip = (id, pts, inner) => `<clipPath id="${id}"><polygon points="${pts.map((p) => p.join(',')).join(' ')}"/></clipPath><g clip-path="url(#${id})">${inner}</g>`

  // balcony: the railing up close, the city beyond, the terminal on the rail
  {
    const pts = panel(0)
    let a = city(24, top, 320, bot - top, { seed: 11, zoom: 1.4, adOffset: 2 })
    a += rect(24, 640, 320, 16, { fill: C.black, stroke: INK, sw: 1.5 })
    for (let i = 0; i < 8; i++) a += rect(34 + i * 40, 656, 9, 200, { fill: C.black, stroke: C.rim, sw: 1 })
    a += rect(170, 580, 100, 62, { r: 6, fill: '#0c0a14', stroke: INK, sw: 2 }) + rect(178, 588, 84, 40, { r: 3, fill: C.smoke, opacity: 0.6 })
    a += rect(24, top, 320, bot - top, { fill: 'url(#dots)' })
    s += clip('p2', pts, a) + poly(pts, 'none', { stroke: INK, sw: 3 })
    s += caption(40, top + 16, 250, ['Air’s free out there.', 'Mostly.'])
    s += label(180, bot - 26, 'Balcony')
  }
  // TV: the set on its crate, Corp X's ad
  {
    const pts = panel(1)
    let a = rect(300, top, 440, bot - top, { fill: C.wallLit })
    a += `<ellipse cx="515" cy="560" rx="260" ry="200" fill="url(#light)"/>`
    a += rect(380, 690, 270, 160, { fill: C.black, stroke: INK, sw: 2 })
    a += rect(352, 470, 330, 214, { r: 10, fill: C.black, stroke: INK, sw: 4 })
    a += `<svg x="364" y="482" width="306" height="190" viewBox="0 0 468 300" preserveAspectRatio="xMidYMid slice">${tvAdArt('X')}</svg>`
    a += rect(300, top, 440, bot - top, { fill: 'url(#dots)' })
    s += clip('p3', pts, a) + poly(pts, 'none', { stroke: INK, sw: 3 })
    s += caption(352, top + 16, 300, ['Corp X wants you to', 'read the contract.'])
    s += label(515, bot - 26, 'TV')
  }
  // terminal: Minerva, big on the screen, talking
  {
    const pts = panel(2)
    let a = rect(680, top, 450, bot - top, { fill: '#100e17' })
    a += `<ellipse cx="900" cy="640" rx="300" ry="240" fill="url(#light)"/>`
    a += rect(720, 760, 380, 18, { fill: C.black, stroke: INK, sw: 2 })
    a += rect(760, 520, 300, 220, { r: 10, fill: C.black, stroke: INK, sw: 4 }) + rect(890, 740, 40, 20, { fill: C.black })
    a += rect(774, 534, 272, 192, { r: 4, fill: '#0c0a14' }) + face(910, 630, 190, 'talking')
    a += `<g transform="rotate(-8 1070 760)">${rect(1040, 742, 60, 34, { fill: C.smoke, opacity: 0.55 })}</g>`
    s += clip('p4', pts, a)
    s += poly(pts, 'none', { stroke: C.brand300, sw: 6 })
    s += balloon(756, top + 22, 320, 108, [880, 524], ['Your account’s in here.', 'So are the bills.', 'Sit down, Rhea.'])
    s += label(905, bot - 26, 'Terminal', { focused: true })
  }
  // door: up close, the number, the scanner, the corridor's light under it
  {
    const pts = panel(3)
    let a = rect(1080, top, 360, bot - top, { fill: C.wallLit })
    a += rect(1180, 400, 260, 460, { fill: '#0a0910', stroke: INK, sw: 5 })
    a += rect(1200, 430, 220, 160, { r: 4, stroke: '#1d1a28', sw: 2 }) + rect(1200, 610, 220, 200, { r: 4, stroke: '#1d1a28', sw: 2 })
    a += rect(1194, 600, 14, 60, { r: 6, fill: C.rim })
    a += rect(1260, 370, 100, 24, { r: 4, fill: C.black, stroke: C.rim, sw: 1.5 }) + text(1310, 388, '7-2216', { size: 15, anchor: 'middle', fill: C.text3, family: MONO })
    a += rect(1104, 520, 54, 90, { r: 8, fill: '#0c0a14', stroke: INK, sw: 2 }) + rect(1110, 528, 42, 36, { r: 4, fill: '#060509' }) + face(1131, 546, 38, 'idle', { glow: false })
    a += rect(1180, 828, 260, 4, { fill: C.smoke, opacity: 0.5 })
    a += rect(1080, top, 360, bot - top, { fill: 'url(#dots)' })
    s += clip('p5', pts, a) + poly(pts, 'none', { stroke: INK, sw: 3 })
    s += caption(1112, top + 16, 290, ['Curfew. Security response', 'after hours: not guaranteed.'])
    s += label(1255, bot - 26, 'Door · ID scanner')
  }

  s += chrome(W, H, { notice: false, hint: 'Pick a panel · Tab, arrows or the D-pad move between panels' })
  s += approach(44, 150, 500, 'E · The comic page', [
    'Told as a graphic novel: an establishing panel, then one panel per thing, each a button. Captions narrate; Minerva speaks in balloons; sounds are lettered. Each later beat is a new page.',
    'Phone: the panels stack, one per screen-width, scrolled like a webcomic.'
  ])
  return s
}
