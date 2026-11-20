// F. Menu first: "the buttons are the game", taken literally. The room shrinks to a letterboxed shot
// across the top; below it the moment is narrated in a few lines of prose, and four big verb buttons do
// the rest. The cheapest to build and the kindest to phones; the words carry the mood.

import { C, rect, text, room, face, owl, para } from '../intro/art.mjs'
import { chrome, approach } from './shared.mjs'

export const title = 'menu first (narrated, big verbs)'

function icon(kind, cx, cy, color) {
  const st = `stroke="${color}" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"`
  if (kind === 'balcony') return `<path d="M${cx - 14} ${cy - 8} l28 0 M${cx - 12} ${cy - 8} l0 18 M${cx - 4} ${cy - 8} l0 18 M${cx + 4} ${cy - 8} l0 18 M${cx + 12} ${cy - 8} l0 18" ${st}/>`
  if (kind === 'tv') return `<rect x="${cx - 15}" y="${cy - 11}" width="30" height="20" rx="3" ${st}/><path d="M${cx - 6} ${cy + 14} l12 0" ${st}/>`
  if (kind === 'door') return `<rect x="${cx - 10}" y="${cy - 15}" width="20" height="30" rx="2" ${st}/><circle cx="${cx + 5}" cy="${cy + 1}" r="1.8" fill="${color}"/>`
  return owl(cx, cy, 34, color)
}

function verb(x, y, w, h, kind, head, sub, o = {}) {
  const focus = o.focus
  let s = ''
  if (focus) s += rect(x - 6, y - 6, w + 12, h + 12, { r: 20, stroke: C.brand300, sw: 2.5 })
  s += rect(x, y, w, h, { r: 16, fill: focus ? C.lavender : C.button, stroke: focus ? C.lavender : '#ffffff40', sw: 1.2 })
  const ink = focus ? '#1c0838' : C.text
  s += `<circle cx="${x + 46}" cy="${y + h / 2}" r="28" fill="${focus ? '#1c083822' : '#00000040'}"/>` + icon(kind, x + 46, y + h / 2, ink)
  s += text(x + 92, y + h / 2 - 4, head, { size: 22, weight: 700, fill: ink })
  s += text(x + 92, y + h / 2 + 20, sub, { size: 14, fill: focus ? '#3a2466' : C.text2 })
  s += text(x + w - 26, y + h / 2 + 6, o.key, { size: 14, fill: focus ? '#3a2466' : C.text3, anchor: 'end', family: 'monospace' })
  return s
}

export function draw(W, H) {
  let s = ''
  // the shot: the room, letterboxed, edges falling to black
  const top = 48
  const sh = 330
  s += `<svg x="0" y="${top}" width="${W}" height="${sh}" viewBox="40 380 1520 ${(1520 * sh) / W}" preserveAspectRatio="xMidYMid slice">${room({ tv: 'X' })}</svg>`
  s += `<linearGradient id="lb-l" x1="0" x2="1"><stop offset="0" stop-color="#030306"/><stop offset="0.12" stop-color="#030306" stop-opacity="0"/><stop offset="0.88" stop-color="#030306" stop-opacity="0"/><stop offset="1" stop-color="#030306"/></linearGradient>`
  s += `<linearGradient id="lb-b" x1="0" y1="0" x2="0" y2="1"><stop offset="0.7" stop-color="#030306" stop-opacity="0"/><stop offset="1" stop-color="#030306"/></linearGradient>`
  s += rect(0, top, W, sh, { fill: 'url(#lb-l)' }) + rect(0, top, W, sh, { fill: 'url(#lb-b)' })
  s += rect(0, top + sh, W, 3, { fill: C.border })

  // the narration: a few lines, the room in words
  const nx = 96
  s += text(nx, 438, 'Unit 7-2216. 23:41.', { size: 15, fill: C.text3, family: 'monospace', ls: 1 })
  const p = para(nx, 480, 'The strip light blinks twice and holds. The room is smaller with the lights on: a mattress on the floor, a TV on a crate already selling you something, a desk with a terminal that is awake and looking at you. Through the glass, Block 7’s billboards. Behind the door, the curfew.', { size: 21, width: 640, lh: 32, fill: C.text2 })
  s += p.svg
  // Minerva's line, under it
  const my = 480 + p.height + 36
  s += rect(nx - 16, my - 46, 680, 92, { r: 14, fill: C.s1, stroke: C.border, sw: 1.2 })
  s += face(nx + 40, my, 84, 'talking', { oneOff: ['nod', 0.4] })
  s += text(nx + 100, my - 8, 'Minerva', { size: 15, weight: 700, fill: C.text })
  s += text(nx + 100, my + 18, 'Power’s on, Rhea. So are the bills. Sit down.', { size: 18, fill: C.text2 })

  // the verbs
  const bx = 824
  const bw = W - bx - 72
  const items = [
    ['terminal', 'Sit at the terminal', 'Your account, your mail, the job board', true, '1'],
    ['tv', 'Watch the TV', 'Three corporations want you', false, '2'],
    ['balcony', 'Step onto the balcony', 'The city, the vape, the air', false, '3'],
    ['door', 'Check the door', 'Curfew until 05:00', false, '4']
  ]
  items.forEach(([kind, head, sub, focus, key], i) => {
    s += verb(bx, 420 + i * 98, bw, 80, kind, head, sub, { focus, key })
  })

  s += chrome(W, H, { notice: false, hint: 'Choose · 1–4, arrows or the D-pad · the shot above is just to look at' })
  s += approach(80, 742, 680, 'F · Menu first', [
    'The buttons are the game, literally: a letterboxed shot of the room, a few lines of prose, Minerva, and four big verbs. Cheapest to build, kindest to phones; the words carry the mood.',
    'Phone: the shot shrinks to a band; the verbs fill the thumb zone.'
  ])
  return s
}
