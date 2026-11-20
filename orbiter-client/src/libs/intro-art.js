// The intro's still art, as SVG strings (the approved mockup's drawing, docs/mockups/intro/art.mjs): the
// apartment, the city, the balcony's railing, the corporations' ads and logos, the player's hand. Noir:
// near-black silhouettes, lit only by what gives light, a thin rim of light on their edges, muted color.
// What moves or changes (Minerva's faces, the TV's picture, the lights, the hotspots) is drawn by the
// components over this art, in the same room units.

import { CORP_LOOKS } from './intro'

export const ROOM = { w: 1600, h: 1000, floor: 820 }
/** What the player can use in the room, in room units: where it is and what it's called. */
export const HOTSPOTS = {
  balcony: { x: 0, y: 190, w: 390, h: 640, label: 'Balcony' },
  tv: { x: 690, y: 495, w: 290, h: 190, label: 'TV' },
  terminal: { x: 985, y: 520, w: 190, h: 150, label: 'Terminal' },
  door: { x: 1340, y: 250, w: 260, h: 580, label: 'Door' },
  scanner: { x: 1228, y: 405, w: 94, h: 150, label: 'ID scanner' }
}
/** Screens in the room where Minerva's face shows: the ID scanner's, the desk terminal's. */
export const SCREENS = {
  scanner: { x: 1248, y: 430, w: 54, h: 46 },
  terminal: { x: 1013, y: 543, w: 134, h: 84 },
  tv: { x: 718, y: 515, w: 234, h: 150 }
}

const BLACK = '#030306'
const RIM = '#3a3352'
const RIM_LIT = '#6a6188'
const SMOKE = '#d8d4e4'

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
function rect(x, y, w, h, o = {}) {
  const a = [`x="${x}" y="${y}" width="${w}" height="${h}"`]
  if (o.r) a.push(`rx="${o.r}"`)
  a.push(`fill="${o.fill ?? 'none'}"`)
  if (o.stroke) a.push(`stroke="${o.stroke}" stroke-width="${o.sw ?? 1}"`)
  if (o.opacity !== undefined) a.push(`opacity="${o.opacity}"`)
  if (o.cls) a.push(`class="${o.cls}"`)
  return `<rect ${a.join(' ')}/>`
}
function text(x, y, s, o = {}) {
  return `<text x="${x}" y="${y}" font-size="${o.size ?? 16}" fill="${o.fill ?? SMOKE}" font-family="${o.family ?? 'Ubuntu, system-ui, sans-serif'}"${o.weight ? ` font-weight="${o.weight}"` : ''}${o.anchor ? ` text-anchor="${o.anchor}"` : ''}${o.opacity !== undefined ? ` opacity="${o.opacity}"` : ''}${o.ls ? ` letter-spacing="${o.ls}"` : ''}>${esc(s)}</text>`
}
function rng(seed) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

/** Gradients the art uses; ids are prefixed so several drawings can share a page. */
export function artDefs(p) {
  return `<defs>
  <linearGradient id="${p}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#040308"/><stop offset="0.7" stop-color="#0f0d18"/><stop offset="1" stop-color="#211c2c"/></linearGradient>
  <radialGradient id="${p}light"><stop offset="0" stop-color="#d8d4e4" stop-opacity="0.22"/><stop offset="1" stop-color="#d8d4e4" stop-opacity="0"/></radialGradient>
  <linearGradient id="${p}glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d8d4e4" stop-opacity="0.07"/><stop offset="0.5" stop-color="#d8d4e4" stop-opacity="0.01"/><stop offset="1" stop-color="#d8d4e4" stop-opacity="0.05"/></linearGradient>
  <linearGradient id="${p}ad-X" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3a4462"/><stop offset="1" stop-color="#11141f"/></linearGradient>
  <linearGradient id="${p}ad-Y" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#34483f"/><stop offset="1" stop-color="#0e1512"/></linearGradient>
  <linearGradient id="${p}ad-Z" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#14232a"/><stop offset="0.6" stop-color="#2a4a54"/><stop offset="1" stop-color="#4e3a2c"/></linearGradient>
  <linearGradient id="${p}ad-1" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5a3434"/><stop offset="1" stop-color="#5e4632"/></linearGradient>
  <linearGradient id="${p}ad-2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f5440"/><stop offset="1" stop-color="#1f2c22"/></linearGradient>
  <linearGradient id="${p}ad-3" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#47395e"/><stop offset="1" stop-color="#1f1a33"/></linearGradient>
</defs>`
}

/** A corporation's logo (draft): X a contract's seal, Y three linked rings, Z a world with an orbit leaving. */
export function corpLogo(key, cx, cy, size, color) {
  const look = CORP_LOOKS.find((c) => c.key === key) ?? CORP_LOOKS[0]
  const c = color ?? look.color
  const g = (inner) =>
    `<g transform="translate(${cx} ${cy}) scale(${size / 40})" fill="none" stroke="${c}" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round">${inner}</g>`
  if (key === 'X')
    return g(
      '<rect x="-17" y="-17" width="34" height="34" rx="3"/><path d="M-10 -10 L10 10 M10 -10 L-10 10"/><rect x="-11" y="-11" width="22" height="22" rx="1" stroke-width="1.4"/>'
    )
  if (key === 'Y') return g('<circle cx="0" cy="-7" r="9"/><circle cx="-8" cy="6" r="9"/><circle cx="8" cy="6" r="9"/>')
  return g(
    `<circle cx="-4" cy="4" r="9"/><path d="M-19 12 C -4 -2, 8 -10, 18 -16"/><circle cx="18" cy="-16" r="2.6" fill="${look.accent ?? c}" stroke="none"/>`
  )
}

// ---------------------------------------------------------------- the city
const ADS = [
  { corp: 'X', words: ['READ THE', 'CONTRACT'] },
  { fill: 'ad-1', words: ['NUTRI', 'PASTE'] },
  { corp: 'Y', words: ['WE PLAN IN', 'CENTURIES'] },
  { fill: 'ad-2', words: ['OXY+', 'BREATHE'] },
  { corp: 'Z', words: ['BORN', 'OUT THERE'] },
  { fill: 'ad-3', words: ['LOAN', 'NOW'] }
]
function billboard(p, x, y, w, h, ad, i) {
  const size = Math.min(h * 0.28, (w / Math.max(...ad.words.map((s) => s.length))) * 1.4)
  // each billboard flickers on its own rhythm (CSS: .intro-flicker)
  return (
    `<g class="intro-flicker" style="animation-delay:-${(i * 2.3) % 7}s">` +
    `<ellipse cx="${x + w / 2}" cy="${y + h / 2}" rx="${w * 0.8}" ry="${h * 0.9}" fill="url(#${p}light)"/>` +
    rect(x - 3, y - 3, w + 6, h + 6, { fill: BLACK }) +
    rect(x, y, w, h, { fill: `url(#${p}${ad.corp ? 'ad-' + ad.corp : ad.fill})` }) +
    ad.words
      .map((s, j) =>
        text(x + w / 2, y + h / 2 + (j - 0.5) * size * 1.05 + size * 0.38, s, {
          size,
          anchor: 'middle',
          weight: 700,
          opacity: 0.85,
          ls: 1
        })
      )
      .join('') +
    (ad.corp ? corpLogo(ad.corp, x + w - h * 0.17, y + h * 0.17, h * 0.2, '#d8d4e4aa') : '') +
    '</g>'
  )
}
/** The city at night in (x, y, w, h): smog sky, far towers, air traffic, near black towers with muted billboards. */
export function cityArt(p, x, y, w, h, o = {}) {
  const zoom = o.zoom ?? 1
  const r = rng(o.seed ?? 7)
  let s = rect(x, y, w, h, { fill: `url(#${p}sky)` })
  s += `<ellipse cx="${x + w / 2}" cy="${y + h * 0.85}" rx="${w * 0.8}" ry="${h * 0.3}" fill="url(#${p}light)"/>`
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
  // air traffic, drifting in lanes (CSS: .intro-traffic)
  for (let i = 0; i < 3; i++) {
    const ty = y + h * (0.2 + i * 0.1)
    s += `<g class="intro-traffic" style="animation-duration:${40 + i * 17}s;animation-direction:${i % 2 ? 'reverse' : 'normal'}">`
    for (let j = 0; j < 7; j++) s += rect(x + r() * w, ty + r() * 6, 6 * zoom, 2 * zoom, { fill: SMOKE, opacity: 0.35 })
    s += '</g>'
  }
  bx = x - 30 * zoom
  let ad = o.adOffset ?? 0
  while (bx < x + w) {
    const bw = (90 + r() * 120) * zoom
    const bh = h * (0.22 + r() * 0.3) * (zoom > 1 ? 1.15 : 1)
    s += rect(bx, y + h - bh, bw, bh + 2, { fill: BLACK })
    for (let wy = y + h - bh + 18 * zoom; wy < y + h - 10; wy += 22 * zoom)
      for (let wx = bx + 10 * zoom; wx < bx + bw - 14 * zoom; wx += 18 * zoom)
        if (r() < 0.06) s += rect(wx, wy, 6 * zoom, 8 * zoom, { fill: '#5a5470', opacity: 0.4 })
    if (r() < 0.7 && bw > 100 * zoom) {
      const aw = bw * 0.72
      const ah = Math.min(aw * 0.55, bh * 0.4)
      s += billboard(p, bx + (bw - aw) / 2, y + h - bh - ah * 0.6, aw, ah, ADS[ad % ADS.length], ad)
      ad++
    }
    bx += bw + 10 * zoom
  }
  return s
}

// ---------------------------------------------------------------- the apartment
/**
 * The room, in room units (1600 × 1000, floor at 820). Left to right: the sliding glass door to the
 * balcony (running off the left edge) with the city behind it and a terminal on the railing outside; a
 * mattress under an old poster; the TV on a crate; the desk with the housing computer and the bills; a dead
 * plant; the ID scanner; the door out (running off the right edge). Screens are left dark: the components
 * fill them. `lit` lifts the walls and rims a step.
 */
export function roomArt(p, lit = true) {
  const F = ROOM.floor
  const rim = lit ? RIM_LIT : RIM
  let s = rect(-400, 0, ROOM.w + 800, F, { fill: lit ? '#16131f' : '#0f0d17' })
  for (let x = 160; x < ROOM.w; x += 160) s += rect(x, 70, 2, F - 70, { fill: '#1a1726' })
  s += rect(-400, 0, ROOM.w + 800, 70, { fill: '#0a0910' })
  s +=
    rect(-400, F, ROOM.w + 800, ROOM.h - F + 400, { fill: '#08070d' }) + rect(-400, F, ROOM.w + 800, 2, { fill: rim })
  // the ceiling strip (lit by the component), and the pools of light the room's lamps throw when lit
  s += rect(560, 76, 260, 6, { r: 3, fill: '#2a2638' })
  if (lit)
    s += `<ellipse cx="690" cy="300" rx="420" ry="300" fill="url(#${p}light)"/><ellipse cx="835" cy="590" rx="230" ry="170" fill="url(#${p}light)"/><ellipse cx="1080" cy="585" rx="150" ry="110" fill="url(#${p}light)"/>`

  // the balcony door: glass, the city, the railing and its terminal
  s += `<clipPath id="${p}glass-clip"><rect x="-60" y="220" width="400" height="${F - 225}"/></clipPath>`
  s += `<g clip-path="url(#${p}glass-clip)">${cityArt(p, -60, 220, 400, F - 220, { seed: 11 })}`
  s += rect(-60, 690, 400, 10, { fill: BLACK }) + rect(-60, 690, 400, 2, { fill: RIM })
  s += Array.from({ length: 13 }, (_, i) => rect(-54 + i * 32, 700, 5, 130, { fill: BLACK })).join('')
  s +=
    rect(220, 640, 70, 50, { r: 5, fill: '#0c0a14', stroke: RIM_LIT, sw: 1.5 }) +
    rect(227, 646, 56, 30, { r: 2, fill: SMOKE, opacity: 0.5 }) +
    rect(248, 688, 14, 8, { fill: BLACK })
  s += '</g>'
  s += rect(-60, 220, 400, F - 220, { fill: `url(#${p}glass)` })
  s += rect(-70, 210, 420, F - 205, { stroke: '#1d1a28', sw: 12 }) + rect(140, 216, 10, F - 216, { fill: '#1d1a28' })
  s += `<path d="M330 200 q20 200 0 400 q-10 120 30 220 l50 0 q-30 -110 -20 -230 q10 -180 -20 -390z" fill="#0c0a13" stroke="${RIM}" stroke-width="2"/>`

  // the mattress and the poster
  s += rect(450, 300, 170, 230, { r: 3, fill: '#14121c', stroke: RIM, sw: 1.5 })
  s += `<g opacity="0.55">${rect(462, 312, 146, 160, { fill: '#1c2030' })}<circle cx="535" cy="400" r="34" fill="#8a8070" opacity="0.6"/><path d="M480 450 L570 360" stroke="${SMOKE}" stroke-width="3"/></g>`
  s +=
    text(535, 496, 'ORBITER 8', { size: 15, anchor: 'middle', fill: '#9088aa', weight: 700, ls: 2 }) +
    text(535, 515, 'FIRST RETURN · 2131', { size: 10, anchor: 'middle', fill: '#5a5470' })
  s += `<path d="M430 ${F} l0 -46 q0 -12 14 -12 l220 0 q14 0 14 12 l0 46z" fill="${BLACK}" stroke="${RIM}" stroke-width="2"/>`
  s += `<path d="M450 ${F - 56} q30 -26 70 -6 q-30 14 -70 6z M530 ${F - 58} q50 -30 110 -8 q20 10 20 10 l-130 0z" fill="#0b0a12" stroke="${RIM}" stroke-width="1.5"/>`

  // the TV on a crate (its screen is the component's)
  s +=
    rect(740, 690, 190, F - 690, { fill: BLACK, stroke: RIM, sw: 1.5 }) +
    `<path d="M740 730 L930 730 M740 780 L930 780" stroke="${RIM}" stroke-width="1.5"/>`
  s += rect(708, 505, 254, 170, { r: 8, fill: BLACK, stroke: rim, sw: 3 })
  s += rect(820, 676, 30, 14, { fill: BLACK })
  s +=
    `<path d="M760 690 l10 -22 30 0 6 22z" fill="#0b0a12" stroke="${RIM}" stroke-width="1.2"/>` +
    rect(890, 668, 12, 22, { r: 2, fill: '#1a1726' }) +
    rect(906, 672, 12, 18, { r: 2, fill: '#1a1726' })

  // the desk and the housing computer (its screen is the component's)
  s +=
    rect(990, 655, 200, 14, { fill: BLACK, stroke: RIM, sw: 1.5 }) +
    rect(1000, 669, 10, F - 669, { fill: BLACK }) +
    rect(1170, 669, 10, F - 669, { fill: BLACK })
  s += rect(1005, 535, 150, 100, { r: 6, fill: BLACK, stroke: rim, sw: 2.5 }) + rect(1070, 635, 20, 20, { fill: BLACK })
  s += rect(1013, 543, 134, 84, { r: 3, fill: '#07060b' })
  s += rect(1030, 642, 90, 8, { r: 2, fill: '#121019' })
  s += `<g transform="rotate(-8 1150 645)">${rect(1130, 632, 40, 22, { fill: SMOKE, opacity: lit ? 0.55 : 0.1 })}</g>`
  s += `<path d="M1060 ${F} l0 -80 l70 0 l0 80 M1050 740 l90 0 M1128 740 l0 -110 q0 -10 -10 -10" fill="none" stroke="${BLACK}" stroke-width="10"/>`

  // the dead plant
  s += `<path d="M1190 ${F} l6 -40 l30 0 l6 40z" fill="#0b0a12" stroke="${RIM}" stroke-width="1.2"/><path d="M1211 780 q-12 -30 -30 -24 M1211 780 q4 -40 24 -40 M1211 780 q-2 -26 -14 -50" stroke="${RIM}" stroke-width="3" fill="none"/>`

  // the ID scanner (its screen is the component's)
  s +=
    rect(1240, 420, 70, 120, { r: 10, fill: '#0c0a14', stroke: RIM_LIT, sw: 2 }) +
    rect(1248, 430, 54, 46, { r: 5, fill: '#060509' })
  s +=
    rect(1253, 492, 44, 6, { r: 3, fill: SMOKE, opacity: 0.6 }) +
    text(1275, 523, 'ID', { size: 13, anchor: 'middle', fill: '#9088aa', weight: 700 })

  // the door out
  s += rect(1360, 270, 300, F - 270, { fill: '#0a0910', stroke: rim, sw: 5 })
  s +=
    rect(1380, 300, 220, 200, { r: 4, stroke: '#1d1a28', sw: 2 }) +
    rect(1380, 520, 220, 270, { r: 4, stroke: '#1d1a28', sw: 2 })
  s += rect(1385, 540, 14, 60, { r: 6, fill: RIM })
  s +=
    rect(1440, 230, 80, 26, { r: 4, fill: BLACK, stroke: RIM, sw: 1.5 }) +
    text(1480, 249, '7-2216', { size: 15, anchor: 'middle', fill: '#9088aa', family: "'Ubuntu Mono', monospace" })
  s += `<path d="M1430 ${F} q10 -22 40 -18 l18 18z M1480 ${F} q10 -20 38 -16 l16 16z" fill="${BLACK}" stroke="${RIM}" stroke-width="1"/>`
  return s
}

/** The balcony's view: the city nearer, the railing in front (in a 1600 × 1000 frame). */
export function balconyArt(p) {
  let s = cityArt(p, 0, 0, 1600, 820, { zoom: 2, seed: 23, adOffset: 1 })
  const top = 780
  s += rect(0, top + 16, 1600, 400, { fill: BLACK })
  for (let x = 8; x < 1600; x += 52) s += rect(x, top + 14, 7, 400, { fill: '#0b0a12', stroke: RIM, sw: 1 })
  s += rect(-4, top, 1608, 16, { fill: '#0d0b14', stroke: RIM_LIT, sw: 1.5 })
  // the terminal's bracket on the rail (its screen is the component's)
  s += rect(1218, top - 14, 24, 16, { fill: BLACK, stroke: RIM, sw: 1 })
  s += `<ellipse cx="1230" cy="${top - 80}" rx="190" ry="130" fill="url(#${p}light)"/>`
  s +=
    rect(1140, top - 154, 180, 140, { r: 10, fill: '#0c0a14', stroke: RIM_LIT, sw: 2 }) +
    rect(1150, top - 144, 160, 120, { r: 5, fill: '#07060b' })
  return s
}
/** Where the balcony terminal's screen is, in the balcony's frame. */
export const BALCONY_SCREEN = { x: 1150, y: 636, w: 160, h: 120 }

/** A corporation's ad, muted, in a 468 × 300 frame (the TV). */
export function adArt(p, key, look) {
  const ink = SMOKE
  let s = rect(0, 0, 468, 300, { fill: `url(#${p}ad-${key})` })
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
    s += `<circle cx="330" cy="225" r="52" fill="${look.accent ?? '#c49a78'}" opacity="0.55"/><ellipse cx="330" cy="225" rx="92" ry="17" fill="none" stroke="${ink}" stroke-width="4" opacity="0.7" transform="rotate(-14 330 225)"/>`
    s += `<path d="M120 270 C 180 230, 230 200, 280 190" stroke="${ink}" stroke-width="3" stroke-dasharray="2 10" fill="none" opacity="0.7"/>`
  }
  const family = look.font ?? 'Ubuntu, system-ui, sans-serif'
  const size = key === 'Z' ? 30 : 34
  s +=
    text(28, 64, look.ad[0], { size, weight: 700, family }) + text(28, 106, look.ad[1], { size, weight: 700, family })
  s += text(28, 142, `${look.name}. ${look.ad[2]}`, { size: 16, opacity: 0.75, family })
  return s + corpLogo(key, 432, 262, 38, '#d8d4e4cc')
}

/** The player's hand: a black silhouette with a rim of light, fingertip (or grip) at the origin. */
export function handArt(pose = 'point', extra = '') {
  const point =
    'M0 0 c8 -3 16 2 17 11 l6 74 c4 -6 14 -9 22 -4 c5 -8 17 -10 25 -3 c6 -6 18 -6 24 2 c8 10 9 30 6 52 c-4 30 -12 52 -24 76 l-10 60 l-120 0 l6 -70 c-22 -20 -38 -44 -50 -66 c-6 -12 2 -24 16 -20 c10 4 22 18 34 30 l-8 -128 c-1 -8 4 -13 6 -14z'
  const hold =
    'M10 40 c10 -6 30 -6 44 2 c14 -4 28 0 34 12 c10 0 20 10 18 26 c-2 26 -10 50 -24 72 l-10 60 l-120 0 l6 -70 c-20 -24 -30 -50 -30 -72 c0 -20 16 -30 40 -34 c14 -2 30 -1 42 4z'
  return `<path d="${pose === 'hold' ? hold : point}" fill="${BLACK}" stroke="${RIM_LIT}" stroke-width="2.5" stroke-linejoin="round"/>${extra}`
}
/** The vape, for the hand to hold. */
export const VAPE_ART = `<g transform="translate(40 30) rotate(-30) scale(1.3)"><rect x="-8" y="-60" width="16" height="70" rx="6" fill="#1a1726" stroke="${RIM_LIT}" stroke-width="2"/><rect x="-5" y="-72" width="10" height="14" rx="3" fill="${RIM}"/><circle class="intro-vape-glow" cx="0" cy="-30" r="3" fill="#b9a0ff"/></g>`
/** The ID card, for the hand to hold. */
export const CARD_ART = `<g transform="translate(-60 -40) rotate(-10)"><rect width="150" height="95" rx="8" fill="#b9b4c6" stroke="#6a6188" stroke-width="2"/><rect x="11" y="14" width="40" height="50" rx="3" fill="#6a6188"/><circle cx="31" cy="31" r="9" fill="#b9b4c6"/><rect x="21" y="44" width="20" height="16" rx="6" fill="#b9b4c6"/><rect x="62" y="17" width="70" height="7" fill="#6a6188"/><rect x="62" y="32" width="55" height="5" fill="#8f88a6"/><rect x="62" y="43" width="62" height="5" fill="#8f88a6"/><text x="11" y="83" font-size="8" font-weight="700" fill="#3a3352" font-family="'Ubuntu Mono', monospace">NON-CITIZEN · STIPEND</text></g>`
