// The intro mockup's shared art: helpers, the city, the apartment, the hand, the Minerva console and the
// three corporations' draft identities. build.mjs frames these into the eight moments, at desktop and
// phone size. Flat silhouettes, like the game's sprites; colors from orbiter-client/src/libs/palette.js.

import fs from 'node:fs'
import { ART_ORIGIN, PARTS } from '../../../orbiter-client/src/components/minerva/minerva-parts.js'

// ---------------------------------------------------------------- palette (libs/palette.js)
export const C = {
  space: '#130e24',
  spaceDeep: '#0b0916',
  nebula: '#2a1a4a',
  orbit: '#4a3f75',
  s1: '#1b1531',
  s2: '#251d40',
  s3: '#302651',
  border: '#3f3566',
  borderStrong: '#5a4c8c',
  text: '#f1eefa',
  text2: '#bdb5d4',
  text3: '#9088aa',
  brand500: '#7b4fe6',
  brand400: '#8b5cf6',
  brand300: '#b9a0ff',
  lavender: '#c3b3da',
  lavenderLight: '#e6dcf5',
  button: '#3a1a66',
  pink: '#e1177c',
  pinkLight: '#ff6fb0',
  yellow: '#ccff00',
  yellowLight: '#ebff99'
}
export const FONT = "Ubuntu, 'Segoe UI', system-ui, sans-serif"
export const MONO = "'Ubuntu Mono', ui-monospace, monospace"

// ---------------------------------------------------------------- the three corporations (all [draft])
// Which letter is which is a call for Koda (README, call I2): X the shareholder corporation, Y the family
// conglomerate, Z the space-born upstart, in the story's order. Colors are their ads' and console skins'
// identity hues: never yellow or pink, which keep their meanings.
export const CORPS = {
  X: {
    key: 'X',
    name: 'Corp X',
    kind: 'Shareholder corporation · Old Earth',
    character: 'Contracts, lawyers, quarterly results. Your rights, in writing.',
    feels: '“Your rights are protected by contract.”',
    color: '#4d7cff',
    deep: '#16234d',
    band: '#1d2c5e',
    headFont: "Georgia, 'Times New Roman', serif",
    greeting: 'Account summary. Terms and conditions apply.',
    curfew: 'Curfew is in effect, 22:00–05:00. Leaving the unit breaches clause 14(c) of your housing agreement.',
    ad: {
      head: 'Read the contract.',
      head2: 'Then sign it.',
      sub: 'Corp X. Your rights, in writing.'
    }
  },
  Y: {
    key: 'Y',
    name: 'Corp Y',
    kind: 'Family conglomerate · Old Earth',
    character: 'Plans in generations. Loyalty for life. The group first.',
    feels: '“You’re taken care of, as long as you belong.”',
    color: '#2fae7e',
    deep: '#0f3327',
    band: '#164336',
    headFont: FONT,
    greeting: 'Welcome home. We look after our own.',
    curfew: 'It’s late. The family asks that you stay inside until 05:00. We worry when you don’t.',
    ad: {
      head: 'We plan',
      head2: 'in centuries.',
      sub: 'Corp Y. Belong, and be looked after.'
    }
  },
  Z: {
    key: 'Z',
    name: 'Corp Z',
    kind: 'Space-born upstart · The colonies',
    character: 'New money, new science, moving fast. Sometimes too fast.',
    feels: '“Get out there. We’ll figure out the rest.”',
    color: '#22c7e6',
    accent: '#ff8a3d',
    deep: '#0b2a33',
    band: '#0f3540',
    headFont: MONO,
    greeting: 'hey. let’s get your numbers up.',
    curfew: 'Curfew’s an Earth thing. We know. Stay in till 05:00 and we’ll get you off-world soon.',
    ad: {
      head: 'Born out there.',
      head2: 'Built fast.',
      sub: 'Corp Z. Tomorrow ships today.'
    }
  }
}

// ---------------------------------------------------------------- tiny SVG helpers
export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const attrs = (o) =>
  Object.entries(o)
    .filter(([, v]) => v !== undefined && v !== null && v !== false)
    .map(([k, v]) => `${k}="${esc(v)}"`)
    .join(' ')

export function rect(x, y, w, h, o = {}) {
  return `<rect ${attrs({ x, y, width: w, height: h, rx: o.r, fill: o.fill ?? 'none', stroke: o.stroke, 'stroke-width': o.sw, 'stroke-dasharray': o.dash, opacity: o.opacity, 'fill-opacity': o.fo, 'stroke-opacity': o.so })}/>`
}
export function text(x, y, str, o = {}) {
  return `<text ${attrs({
    x,
    y,
    fill: o.fill ?? C.text,
    'font-size': o.size ?? 16,
    'font-family': o.family ?? FONT,
    'font-weight': o.weight,
    'text-anchor': o.anchor,
    'letter-spacing': o.ls,
    opacity: o.opacity,
    'font-style': o.italic ? 'italic' : undefined
  })}>${esc(str)}</text>`
}
/** Wraps to about `chars` characters a line. */
export function wrap(str, chars) {
  const lines = []
  let line = ''
  for (const word of String(str).split(/\s+/)) {
    if (line && (line + ' ' + word).length > chars) {
      lines.push(line)
      line = word
    } else line = line ? line + ' ' + word : word
  }
  if (line) lines.push(line)
  return lines
}
/** A paragraph: returns { svg, height }. */
export function para(x, y, str, o = {}) {
  const size = o.size ?? 16
  const lh = o.lh ?? size * 1.4
  const lines = wrap(str, o.chars ?? 60)
  const svg = lines.map((line, i) => text(x, y + i * lh, line, { ...o, size })).join('')
  return { svg, height: lines.length * lh, lines: lines.length }
}
/** The marker on placeholder copy (the brief: copy isn't written yet). */
export function draft(x, y, o = {}) {
  const w = 44
  return (
    rect(x, y - 12, w, 16, {
      r: 3,
      fill: o.fill ?? '#00000055',
      stroke: C.text3,
      sw: 1,
      dash: '3 2'
    }) +
    text(x + w / 2, y, 'draft', {
      size: 10,
      fill: C.text2,
      anchor: 'middle',
      family: MONO
    })
  )
}
/** A rounded game button (purple body; primary is lavender; never yellow or pink bodies). */
export function button(x, y, w, h, label, o = {}) {
  const kind = o.kind ?? 'normal'
  const fill = kind === 'primary' ? C.lavender : kind === 'quiet' ? 'none' : C.button
  const stroke = kind === 'primary' ? C.lavender : (o.stroke ?? '#ffffff55')
  const color = kind === 'primary' ? '#1c0838' : (o.color ?? C.text)
  const size = o.size ?? Math.round(h * 0.4)
  let svg = ''
  if (o.focus)
    svg += rect(x - 5, y - 5, w + 10, h + 10, {
      r: (h + 10) / 2,
      stroke: C.brand300,
      sw: 2.5
    })
  svg += rect(x, y, w, h, { r: o.r ?? h / 2, fill, stroke, sw: o.sw ?? 1.2 })
  svg += text(x + w / 2, y + h / 2 + size * 0.35, label, {
    size,
    fill: color,
    anchor: 'middle',
    weight: o.weight ?? 500,
    family: o.family
  })
  if (o.glyph) svg += padGlyph(x + w - h / 2 - 2, y + h / 2, o.glyph, h * 0.28)
  return svg
}
/** A gamepad button glyph (A, B, X, Y) for hints. */
export function padGlyph(cx, cy, letter, r = 10) {
  return (
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#00000066" stroke="${C.text2}" stroke-width="1.2"/>` +
    text(cx, cy + r * 0.42, letter, {
      size: r * 1.15,
      fill: C.text,
      anchor: 'middle',
      weight: 700
    })
  )
}
/** A focus ring around a box (the game's lavender ring); dashed for "can be focused", solid for "focused". */
export function focusRing(x, y, w, h, o = {}) {
  return rect(x, y, w, h, {
    r: o.r ?? 14,
    stroke: C.brand300,
    sw: o.sw ?? 3,
    dash: o.focused ? undefined : '10 8',
    opacity: o.opacity ?? 1
  })
}
export function label(x, y, str, o = {}) {
  const size = o.size ?? 15
  const w = str.length * size * 0.56 + 26
  const x0 = o.anchor === 'middle' ? x - w / 2 : x
  return (
    rect(x0, y - size - 8, w, size + 16, {
      r: (size + 16) / 2,
      fill: o.focused ? C.lavender : '#12052ae6',
      stroke: o.focused ? C.lavender : C.brand300,
      sw: 1.2
    }) +
    text(x0 + w / 2, y + 1, str, {
      size,
      anchor: 'middle',
      fill: o.focused ? '#1c0838' : C.text,
      weight: 500
    })
  )
}

// ---------------------------------------------------------------- seeded random, for the city
export function rng(seed) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

// ---------------------------------------------------------------- Minerva's owl (stand-in for her face)
export function owl(cx, cy, width, color = '#ffffff', o = {}) {
  const k = width / 180
  const eyes =
    o.eyes === false
      ? ''
      : `<g fill="url(#owl-eye)"><ellipse cx="-27" cy="4" rx="20" ry="9" transform="rotate(10 -27 4)"/><ellipse cx="27" cy="4" rx="20" ry="9" transform="rotate(-10 27 4)"/></g>`
  return `<g transform="translate(${cx} ${cy}) scale(${k})">${eyes}<g fill="${color}" transform="translate(${-ART_ORIGIN} ${-ART_ORIGIN})">${PARTS.map((p) => `<path d="${p.d}"/>`).join('')}</g></g>`
}

// ---------------------------------------------------------------- corp logos (drafts)
export function corpLogo(key, cx, cy, size, color) {
  const c = color ?? CORPS[key].color
  const s = size / 40
  const g = (inner) =>
    `<g transform="translate(${cx} ${cy}) scale(${s})" fill="none" stroke="${c}" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round">${inner}</g>`
  if (key === 'X')
    // A contract's seal: a square with the deal's crossed lines.
    return g(
      `<rect x="-17" y="-17" width="34" height="34" rx="3"/><path d="M-10 -10 L10 10 M10 -10 L-10 10"/><rect x="-11" y="-11" width="22" height="22" rx="1" stroke-width="1.4"/>`
    )
  if (key === 'Y')
    // A family of companies: three linked rings.
    return g(`<circle cx="0" cy="-7" r="9"/><circle cx="-8" cy="6" r="9"/><circle cx="8" cy="6" r="9"/>`)
  // The upstart: a world with an orbit, leaving.
  return g(
    `<circle cx="-4" cy="4" r="9"/><path d="M-19 12 C -4 -2, 8 -10, 18 -16" /><circle cx="18" cy="-16" r="2.6" fill="${CORPS.Z.accent}" stroke="none"/>`
  )
}

// ---------------------------------------------------------------- defs shared by every frame
export function defs() {
  return `<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#07061a"/><stop offset="0.65" stop-color="#1a1242"/><stop offset="1" stop-color="#3a1f55"/></linearGradient>
  <radialGradient id="owl-eye"><stop offset="0" stop-color="#fff" stop-opacity="0.95"/><stop offset="0.35" stop-color="#fff" stop-opacity="0.45"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
  <radialGradient id="tv-glow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#4d7cff" stop-opacity="0.35"/><stop offset="1" stop-color="#4d7cff" stop-opacity="0"/></radialGradient>
  <radialGradient id="screen-glow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#b9a0ff" stop-opacity="0.35"/><stop offset="1" stop-color="#b9a0ff" stop-opacity="0"/></radialGradient>
  <radialGradient id="vapor" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#e6dcf5" stop-opacity="0.5"/><stop offset="1" stop-color="#e6dcf5" stop-opacity="0"/></radialGradient>
  <radialGradient id="earth-light" cx="35%" cy="30%" r="75%"><stop offset="0%" stop-color="#a8e6ff"/><stop offset="50%" stop-color="#2f7fd9"/><stop offset="100%" stop-color="#1a2a6e"/></radialGradient>
  <radialGradient id="earth-shade" cx="70%" cy="70%" r="80%"><stop offset="40%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity="0.65"/></radialGradient>
  <radialGradient id="vignette" cx="0.5" cy="0.5" r="0.75"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.7"/></radialGradient>
  <linearGradient id="ad-x" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4d7cff"/><stop offset="1" stop-color="#1b2f7a"/></linearGradient>
  <linearGradient id="ad-y" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#36c48e"/><stop offset="1" stop-color="#0e5a40"/></linearGradient>
  <linearGradient id="ad-z" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0b2a33"/><stop offset="0.55" stop-color="#127c94"/><stop offset="1" stop-color="#ff8a3d"/></linearGradient>
  <linearGradient id="ad-junk1" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff4d4d"/><stop offset="1" stop-color="#ff9a3d"/></linearGradient>
  <linearGradient id="ad-junk2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7cff6b"/><stop offset="1" stop-color="#1fa34a"/></linearGradient>
  <linearGradient id="ad-junk3" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b65cff"/><stop offset="1" stop-color="#3d1bd1"/></linearGradient>
  <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b9a0ff" stop-opacity="0.10"/><stop offset="0.5" stop-color="#b9a0ff" stop-opacity="0.02"/><stop offset="1" stop-color="#b9a0ff" stop-opacity="0.08"/></linearGradient>
  <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b0916" stop-opacity="0.86"/><stop offset="1" stop-color="#0b0916" stop-opacity="0.92"/></linearGradient>
  <linearGradient id="band-z" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0f3540"/><stop offset="0.7" stop-color="#0f3540"/><stop offset="1" stop-color="#5a2d14"/></linearGradient>
</defs>`
}

// ---------------------------------------------------------------- the city
const ADS = [
  { fill: 'url(#ad-x)', corp: 'X', words: ['READ THE', 'CONTRACT'] },
  { fill: 'url(#ad-junk1)', words: ['NUTRI', 'PASTE'] },
  { fill: 'url(#ad-y)', corp: 'Y', words: ['WE PLAN IN', 'CENTURIES'] },
  { fill: 'url(#ad-junk2)', words: ['OXY+', 'BREATHE'] },
  { fill: 'url(#ad-z)', corp: 'Z', words: ['BORN', 'OUT THERE'] },
  { fill: 'url(#ad-junk3)', words: ['LOAN', 'NOW'] }
]
/** A billboard: a loud rectangle with two words. */
function billboard(x, y, w, h, ad) {
  const size = Math.min(h * 0.3, (w / Math.max(...ad.words.map((s) => s.length))) * 1.45)
  return (
    rect(x - 4, y - 4, w + 8, h + 8, { fill: '#05040b' }) +
    rect(x, y, w, h, { fill: ad.fill }) +
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fff" opacity="0.06"/>` +
    ad.words
      .map((s, i) =>
        text(x + w / 2, y + h / 2 + (i - 0.5) * size * 1.05 + size * 0.38, s, {
          size,
          anchor: 'middle',
          weight: 700,
          fill: '#ffffff',
          ls: 1
        })
      )
      .join('') +
    (ad.corp ? corpLogo(ad.corp, x + w - h * 0.17, y + h * 0.17, h * 0.2, '#ffffffcc') : '')
  )
}
/**
 * The city at night, filling (x, y, w, h): sky, far towers with dim windows, near towers with the loud
 * billboards, and air traffic. `zoom` > 1 is the balcony: nearer, bigger.
 */
export function city(x, y, w, h, o = {}) {
  const zoom = o.zoom ?? 1
  const r = rng(o.seed ?? 7)
  let svg = `<g>` + rect(x, y, w, h, { fill: 'url(#sky)' })
  // haze over the skyline
  svg += `<ellipse cx="${x + w / 2}" cy="${y + h * 0.78}" rx="${w * 0.7}" ry="${h * 0.3}" fill="#6b3fa0" opacity="0.18"/>`
  // far towers
  let bx = x - 20
  while (bx < x + w) {
    const bw = (40 + r() * 70) * zoom
    const bh = h * (0.35 + r() * 0.4)
    svg += rect(bx, y + h - bh, bw, bh, { fill: '#171130' })
    for (let wy = y + h - bh + 12 * zoom; wy < y + h - 10; wy += 14 * zoom)
      for (let wx = bx + 6 * zoom; wx < bx + bw - 8 * zoom; wx += 11 * zoom)
        if (r() < 0.16)
          svg += rect(wx, wy, 4 * zoom, 5 * zoom, {
            fill: r() < 0.5 ? '#6f5fa8' : '#c3b3da',
            opacity: 0.55
          })
    // a red light on some roofs
    if (r() < 0.3)
      svg += `<circle cx="${bx + bw / 2}" cy="${y + h - bh - 4}" r="${2 * zoom}" fill="#ff5a5a" opacity="0.7"/>`
    bx += bw + 4 * zoom
  }
  // traffic: lines of tiny lights crossing the sky
  for (let i = 0; i < 4; i++) {
    const ty = y + h * (0.18 + i * 0.09)
    for (let j = 0; j < 9; j++) {
      const tx = x + r() * w
      svg += rect(tx, ty + r() * 6, 7 * zoom, 2 * zoom, {
        fill: i % 2 ? '#e6dcf5' : '#ff9a6b',
        opacity: 0.6
      })
    }
  }
  // near towers, with billboards
  bx = x - 30 * zoom
  let ad = o.adOffset ?? 0
  while (bx < x + w) {
    const bw = (90 + r() * 120) * zoom
    const bh = h * (0.22 + r() * 0.3) * (zoom > 1 ? 1.15 : 1)
    svg += rect(bx, y + h - bh, bw, bh + 2, { fill: '#08060f' })
    for (let wy = y + h - bh + 18 * zoom; wy < y + h - 10; wy += 22 * zoom)
      for (let wx = bx + 10 * zoom; wx < bx + bw - 14 * zoom; wx += 18 * zoom)
        if (r() < 0.1)
          svg += rect(wx, wy, 6 * zoom, 8 * zoom, {
            fill: '#8b7cc2',
            opacity: 0.4
          })
    if (r() < 0.75 && bw > 100 * zoom) {
      const aw = bw * 0.72
      const ah = Math.min(aw * 0.55, bh * 0.4)
      svg += billboard(bx + (bw - aw) / 2, y + h - bh - ah * 0.6, aw, ah, ADS[ad++ % ADS.length])
    }
    bx += bw + 10 * zoom
  }
  return svg + `</g>`
}

// ---------------------------------------------------------------- the apartment (world coordinates)
// One room, 1600 × 1000, floor at 820. Left to right: the door and its ID scanner, the mattress under an
// old poster, the TV on a crate, the desk with the housing computer (a Minerva terminal), a dead plant,
// and the sliding glass door to the balcony with the city behind it and a second terminal outside.
export const ROOM = { w: 1600, h: 1000, floor: 820 }
export const HOTSPOTS = {
  door: { x: 50, y: 250, w: 350, h: 580, label: 'Door' },
  tv: { x: 650, y: 495, w: 290, h: 190, label: 'TV' },
  terminal: { x: 935, y: 520, w: 175, h: 150, label: 'Terminal' },
  balcony: { x: 1170, y: 200, w: 410, h: 630, label: 'Balcony' }
}
const F = ROOM.floor
const SIL = '#0c0919'
const RIM = '#3f3566'

export function room(o = {}) {
  const tvAd = o.tv ?? 'X'
  let s = ''
  // wall, ceiling shadow, floor
  s += rect(0, 0, ROOM.w, F, { fill: '#1b1531' })
  for (let x = 160; x < ROOM.w; x += 160) s += rect(x, 70, 2, F - 70, { fill: '#221a3a' })
  s += rect(0, 0, ROOM.w, 70, { fill: '#120d24' })
  s += rect(0, 70, ROOM.w, 6, { fill: '#0e0a1c' })
  s += rect(0, F, ROOM.w, ROOM.h - F, { fill: '#100c1e' })
  s += rect(0, F, ROOM.w, 4, { fill: RIM })
  // a strip light on the ceiling, cold, half dead
  s +=
    rect(560, 76, 260, 8, { r: 3, fill: '#c3b3da', opacity: 0.35 }) +
    rect(560, 76, 90, 8, { r: 3, fill: '#e6dcf5', opacity: 0.7 })
  // TV glow on the wall
  s += `<ellipse cx="795" cy="560" rx="260" ry="200" fill="url(#tv-glow)"/>`
  s += `<ellipse cx="1020" cy="580" rx="170" ry="130" fill="url(#screen-glow)"/>`

  // ---- the door
  s += rect(80, 270, 220, F - 270, { fill: '#120d22', stroke: RIM, sw: 6 })
  s += rect(100, 300, 180, 200, {
    r: 4,
    fill: '#161029',
    stroke: '#2a2147',
    sw: 2
  })
  s += rect(100, 520, 180, 270, {
    r: 4,
    fill: '#161029',
    stroke: '#2a2147',
    sw: 2
  })
  s += rect(255, 540, 14, 60, { r: 6, fill: RIM })
  s +=
    rect(150, 230, 80, 26, { r: 4, fill: '#0e0a1c', stroke: RIM, sw: 1.5 }) +
    text(190, 249, '7-2216', {
      size: 15,
      anchor: 'middle',
      fill: C.text3,
      family: MONO
    })
  // the door's lock light: lavender (locked for curfew)
  s += `<circle cx="262" cy="520" r="5" fill="${C.brand300}"/>`
  // the ID scanner
  const scannerOn = o.scanner !== 'off'
  s += rect(318, 420, 74, 120, {
    r: 10,
    fill: '#251d40',
    stroke: '#5a4c8c',
    sw: 2.5
  })
  s += rect(328, 432, 54, 44, {
    r: 5,
    fill: scannerOn ? '#e6dcf5' : '#0e0a1c',
    opacity: scannerOn ? 0.9 : 1
  })
  if (scannerOn)
    s +=
      `<ellipse cx="355" cy="454" rx="60" ry="50" fill="url(#screen-glow)"/>` +
      rect(334, 452, 42, 3, { fill: C.brand500 })
  s +=
    rect(333, 494, 44, 6, { r: 3, fill: '#0e0a1c' }) +
    text(355, 525, 'ID', {
      size: 13,
      anchor: 'middle',
      fill: C.text3,
      weight: 700
    })
  // shoes and a bag by the door
  s += `<path d="M110 ${F} q10 -22 40 -18 l18 18z M160 ${F} q10 -20 38 -16 l16 16z" fill="${SIL}"/>`

  // ---- the mattress and the poster
  s += rect(420, 300, 170, 230, {
    r: 3,
    fill: '#2a2147',
    stroke: '#3f3566',
    sw: 2
  })
  s += `<g opacity="0.75">${rect(432, 312, 146, 160, { fill: '#1a2a6e' })}<circle cx="505" cy="400" r="34" fill="#f5d76e" opacity="0.65"/><path d="M450 450 L540 360" stroke="#e6dcf5" stroke-width="3"/><path d="M536 362 l10 -6 -4 10z" fill="#e6dcf5"/></g>`
  s +=
    text(505, 496, 'ORBITER 8', {
      size: 15,
      anchor: 'middle',
      fill: C.lavender,
      weight: 700,
      ls: 2
    }) +
    text(505, 515, 'FIRST RETURN · 2131', {
      size: 10,
      anchor: 'middle',
      fill: C.text3
    })
  s += `<path d="M400 ${F} l0 -46 q0 -12 14 -12 l220 0 q14 0 14 12 l0 46z" fill="${SIL}" stroke="${RIM}" stroke-width="2"/>`
  s += `<path d="M420 ${F - 56} q30 -26 70 -6 q-30 14 -70 6z" fill="#2a2147"/>` // pillow
  s += `<path d="M500 ${F - 58} q50 -30 110 -8 q20 10 20 10 l-130 0z" fill="#221a3a"/>` // blanket lump
  // laundry on the floor
  s += `<path d="M330 ${F} q20 -24 52 -10 q14 -6 24 10z" fill="#221a3a"/>`

  // ---- the TV on a crate
  s +=
    rect(700, 690, 190, F - 690, { fill: SIL, stroke: RIM, sw: 2 }) +
    `<path d="M700 730 L890 730 M700 780 L890 780" stroke="${RIM}" stroke-width="2"/>`
  s += rect(668, 505, 254, 170, {
    r: 8,
    fill: '#07060f',
    stroke: '#4a3f75',
    sw: 4
  })
  s += `<svg x="678" y="515" width="234" height="150" viewBox="0 0 468 300">${tvAdArt(tvAd)}</svg>`
  s += rect(780, 676, 30, 14, { fill: SIL })
  // takeout and cans on the crate
  s +=
    `<path d="M720 690 l10 -22 30 0 6 22z" fill="#2a2147"/>` +
    rect(850, 668, 12, 22, { r: 2, fill: '#3f3566' }) +
    rect(866, 672, 12, 18, { r: 2, fill: '#3f3566' })

  // ---- the desk and the housing computer
  s +=
    rect(940, 655, 200, 14, { fill: SIL, stroke: RIM, sw: 2 }) +
    rect(950, 669, 10, F - 669, { fill: SIL }) +
    rect(1120, 669, 10, F - 669, { fill: SIL })
  s +=
    rect(955, 535, 150, 100, {
      r: 6,
      fill: '#0e0a1c',
      stroke: '#5a4c8c',
      sw: 3
    }) + rect(1020, 635, 20, 20, { fill: SIL })
  s += rect(963, 543, 134, 84, { r: 3, fill: '#1b1531' }) + owl(1030, 580, 76, '#ffffffdd')
  s += rect(980, 642, 90, 8, { r: 2, fill: '#251d40' })
  // the bills: a pile of envelopes, one marked
  s +=
    `<g transform="rotate(-8 1100 645)">${rect(1080, 632, 40, 22, { fill: '#e6dcf5', opacity: 0.8 })}</g>` +
    rect(1078, 640, 40, 14, { fill: '#c3b3da', opacity: 0.9 })
  // a chair
  s += `<path d="M1010 ${F} l0 -80 l70 0 l0 80 M1000 740 l90 0 M1078 740 l0 -110 q0 -10 -10 -10" fill="none" stroke="${SIL}" stroke-width="10"/>`

  // ---- the dead plant
  s +=
    `<path d="M1145 ${F} l6 -40 l30 0 l6 40z" fill="#2a2147"/>` +
    `<path d="M1166 780 q-12 -30 -30 -24 M1166 780 q4 -40 24 -40 M1166 780 q-2 -26 -14 -50" stroke="#4a3f75" stroke-width="3" fill="none"/>`

  // ---- the balcony door: glass, the city behind, the railing and the outside terminal
  s += `<clipPath id="glass-clip"><rect x="1190" y="220" width="370" height="${F - 225}"/></clipPath>`
  s += `<g clip-path="url(#glass-clip)">${city(1190, 220, 370, F - 220, { seed: 11, adOffset: o.adOffset ?? 0 })}`
  s +=
    rect(1190, 690, 370, 10, { fill: '#05040b' }) +
    Array.from({ length: 12 }, (_, i) => rect(1196 + i * 32, 700, 5, 130, { fill: '#05040b' })).join('')
  s +=
    rect(1480, 640, 40, 70, {
      r: 5,
      fill: '#120d22',
      stroke: '#5a4c8c',
      sw: 2
    }) +
    rect(1486, 648, 28, 22, { r: 2, fill: '#e6dcf5', opacity: 0.8 }) +
    rect(1495, 710, 10, 120, { fill: '#05040b' })
  s += `</g>`
  s += rect(1190, 220, 370, F - 220, { fill: 'url(#glass)' })
  s += rect(1180, 210, 390, F - 205, { stroke: '#4a3f75', sw: 12 }) + rect(1372, 216, 10, F - 216, { fill: '#4a3f75' })
  // a curtain, half drawn
  s += `<path d="M1170 200 q20 200 0 400 q-10 120 30 220 l50 0 q-30 -110 -20 -230 q10 -180 -20 -390z" fill="#2a1a4a" stroke="#3f3566" stroke-width="2"/>`
  return s
}

/** What the TV shows: a corporation's ad, drawn in a 468 × 300 frame. */
export function tvAdArt(key, o = {}) {
  const corp = CORPS[key]
  const fill = `url(#ad-${key.toLowerCase()})`
  let s = rect(0, 0, 468, 300, { fill })
  if (key === 'X') {
    // a contract with a signature line, beside glass towers
    s += Array.from({ length: 5 }, (_, i) =>
      rect(40 + i * 26, 300 - 70 - (i % 3) * 36, 22, 70 + (i % 3) * 36, {
        fill: '#ffffff',
        opacity: 0.12
      })
    ).join('')
    s += `<g transform="rotate(-6 340 200)">${rect(280, 120, 130, 160, { fill: '#f4f6ff' })}${Array.from({ length: 6 }, (_, i) => rect(296, 140 + i * 17, 98 - (i % 2) * 26, 5, { fill: '#9fb2e6' })).join('')}<path d="M298 256 q18 -16 30 0 t32 -4" stroke="#1b2f7a" stroke-width="3" fill="none"/>${rect(296, 262, 98, 2, { fill: '#1b2f7a' })}</g>`
  } else if (key === 'Y') {
    // three generations, side by side, under one roof
    s += `<path d="M250 200 L340 140 L430 200" stroke="#e8fff4" stroke-width="7" fill="none" stroke-linejoin="round"/>`
    for (const [x, hgt] of [
      [290, 84],
      [340, 66],
      [384, 48]
    ])
      s +=
        `<circle cx="${x}" cy="${300 - hgt - 38}" r="${hgt * 0.13}" fill="#e8fff4"/>` +
        rect(x - hgt * 0.14, 300 - hgt - 24, hgt * 0.28, hgt, {
          r: hgt * 0.1,
          fill: '#e8fff4'
        })
  } else {
    // a ship leaving a ringed world
    s += `<circle cx="330" cy="225" r="52" fill="#ffb27a" opacity="0.9"/><ellipse cx="330" cy="225" rx="92" ry="17" fill="none" stroke="#e6faff" stroke-width="4" transform="rotate(-14 330 225)"/>`
    s += `<path d="M120 270 C 180 230, 230 200, 280 190" stroke="#e6faff" stroke-width="3" stroke-dasharray="2 10" fill="none"/>`
  }
  if (o.copy !== false) {
    const big = key === 'Z' ? MONO : corp.headFont
    const size = key === 'Z' ? 30 : 34
    s += text(28, 64, corp.ad.head, {
      size,
      fill: '#ffffff',
      weight: 700,
      family: big
    })
    s += text(28, 106, corp.ad.head2, {
      size,
      fill: '#ffffff',
      weight: 700,
      family: big
    })
    s += text(28, 142, corp.ad.sub, {
      size: 16,
      fill: '#ffffffd9',
      family: big
    })
  }
  s += corpLogo(key, 432, 262, 38, '#ffffff')
  return s
}

// ---------------------------------------------------------------- the player's hand
/** A flat hand silhouette pointing up-left, its fingertip at (x, y); `scale` 1 is about 260 tall. */
export function hand(x, y, scale = 1, o = {}) {
  const fill = o.fill ?? '#05040b'
  const pose = o.pose ?? 'point'
  // drawn with the fingertip at (0, 0)
  const point =
    'M0 0 c8 -3 16 2 17 11 l6 74 c4 -6 14 -9 22 -4 c5 -8 17 -10 25 -3 c6 -6 18 -6 24 2 c8 10 9 30 6 52 c-4 30 -12 52 -24 76 l-10 60 l-120 0 l6 -70 c-22 -20 -38 -44 -50 -66 c-6 -12 2 -24 16 -20 c10 4 22 18 34 30 l-8 -128 c-1 -8 4 -13 6 -14z'
  const hold =
    'M10 40 c10 -6 30 -6 44 2 c14 -4 28 0 34 12 c10 0 20 10 18 26 c-2 26 -10 50 -24 72 l-10 60 l-120 0 l6 -70 c-20 -24 -30 -50 -30 -72 c0 -20 16 -30 40 -34 c14 -2 30 -1 42 4z'
  return `<g transform="translate(${x} ${y}) scale(${scale})"><path d="${pose === 'hold' ? hold : point}" fill="${fill}" stroke="#5a4c8c" stroke-width="3" stroke-linejoin="round"/>${o.extra ?? ''}</g>`
}

// ---------------------------------------------------------------- the ship (the game's sprite)
const shipFile = fs.readFileSync(
  new URL('../../../orbiter-client/src/components/star-map/sprites/ship.svg.vue', import.meta.url),
  'utf8'
)
const SHIP_PATH = shipFile.match(/d="([^"]+)"/)[1]
/** The Orbiter 8, nose up, `size` wide, centered on (cx, cy). */
export function ship(cx, cy, size, fill = '#ffffff', o = {}) {
  const k = size / 4600
  return `<g transform="translate(${cx} ${cy}) rotate(${o.rotate ?? 0}) scale(${k}) translate(-2300 -2300)"><path d="${SHIP_PATH}" fill="${fill}" ${o.stroke ? `stroke="${o.stroke}" stroke-width="${o.sw ?? 60}"` : ''}/></g>`
}

/** Earth, as the title screen draws it. */
export function earth(cx, cy, r) {
  const k = r / 180
  return `<g transform="translate(${cx} ${cy}) scale(${k})"><clipPath id="earth-disc"><circle r="180"/></clipPath>
  <circle r="236" fill="none" stroke="#7fd4ff" stroke-width="44" opacity="0.06"/><circle r="206" fill="none" stroke="#7fd4ff" stroke-width="6" opacity="0.08"/>
  <circle r="180" fill="url(#earth-light)" stroke="#a8e6ff" stroke-width="2" stroke-opacity="0.7"/>
  <g clip-path="url(#earth-disc)"><g fill="#5fd27e" fill-opacity="0.42" transform="scale(18)"><rect x="-2" y="-8" width="12" height="2" rx="1"/><rect x="0" y="-6" width="14" height="2" rx="1"/><rect x="-9" y="-7" width="6" height="2" rx="1"/><rect x="-10" y="-4" width="10" height="2" rx="1"/><rect x="-1" y="-2" width="12" height="2" rx="1"/><rect x="-12" y="1" width="12" height="2" rx="1"/><rect x="-10" y="3" width="14" height="2" rx="1"/><rect x="-4" y="4" width="14" height="2" rx="1"/><rect x="0" y="6" width="6" height="2" rx="1"/><rect x="-10" y="9" width="12" height="2" rx="1"/></g></g>
  <circle r="180" fill="url(#earth-shade)"/></g>`
}

// ---------------------------------------------------------------- the Minerva console
export const TABS = ['Account', 'Health', 'Mail', 'Jobs']
/**
 * The console frame: Minerva's own panel (the game's purples), with the subscribed corporation's skin
 * on its header band: its color, logo, type and greeting. `corp` null is the first boot (unbranded).
 * Returns the svg and the content box. Desktop: tabs down the left. Phone: tabs along the bottom.
 */
export function consoleFrame(x, y, w, h, o = {}) {
  const corp = o.corp ? CORPS[o.corp] : null
  const phone = o.phone
  let s = ''
  s += rect(x, y, w, h, {
    r: phone ? 0 : 18,
    fill: '#1b1531',
    stroke: phone ? undefined : '#5a4c8c',
    sw: 2
  })
  const bandH = phone ? 64 : 74
  const bandFill = corp ? (corp.key === 'Z' ? 'url(#band-z)' : corp.band) : '#221a3d'
  s += `<path d="M${x} ${y + bandH} L${x} ${y + (phone ? 0 : 18)} ${phone ? '' : `Q${x} ${y} ${x + 18} ${y}`} L${x + w - (phone ? 0 : 18)} ${y} ${phone ? '' : `Q${x + w} ${y} ${x + w} ${y + 18}`} L${x + w} ${y + bandH} Z" fill="${bandFill}"/>`
  if (corp) s += rect(x, y + bandH - 3, w, 3, { fill: corp.color })
  s += owl(x + (phone ? 40 : 52), y + bandH / 2, phone ? 56 : 66, '#ffffff')
  s += text(x + (phone ? 78 : 98), y + bandH / 2 - (phone ? 2 : 4), 'MINERVA', {
    size: phone ? 16 : 19,
    weight: 700,
    ls: 3,
    fill: C.text
  })
  s += text(
    x + (phone ? 78 : 98),
    y + bandH / 2 + (phone ? 15 : 17),
    o.subtitle ?? (corp ? `via ${corp.name}` : 'Housing unit 7-2216 · first boot'),
    {
      size: phone ? 11 : 13,
      fill: C.text2,
      family: corp?.headFont
    }
  )
  if (corp && !phone) {
    s +=
      corpLogo(corp.key, x + w - 190, y + bandH / 2, 30, corp.color) +
      text(x + w - 166, y + bandH / 2 + 5, corp.name, {
        size: 15,
        fill: C.text,
        family: corp.headFont,
        weight: 600
      })
  }
  if (corp && phone) s += corpLogo(corp.key, x + w - 92, y + bandH / 2, 24, corp.color)
  s += button(x + w - (phone ? 52 : 74), y + bandH / 2 - 20, phone ? 40 : 56, 40, '✕', {
    kind: 'quiet',
    size: 18,
    stroke: '#ffffff40'
  })
  if (!phone) s += padGlyph(x + w - 10, y + bandH / 2 + 20, 'B', 9)
  const tabs = o.tabs === false ? [] : TABS
  let content
  if (phone) {
    const barH = tabs.length ? 76 : 0
    if (tabs.length) {
      s += rect(x, y + h - barH, w, barH, { fill: '#140f27' }) + rect(x, y + h - barH, w, 1, { fill: C.border })
      const tw = w / tabs.length
      tabs.forEach((tab, i) => {
        const on = tab === o.tab
        s += rect(x + i * tw + 6, y + h - barH + 8, tw - 12, barH - 22, {
          r: 14,
          fill: on ? C.lavender : 'none',
          stroke: on ? undefined : '#ffffff30',
          sw: 1
        })
        s += text(x + i * tw + tw / 2, y + h - barH + 8 + (barH - 22) / 2 + 5, tab, {
          size: 14,
          anchor: 'middle',
          fill: on ? '#1c0838' : C.text,
          weight: 500
        })
        if (o.badges?.[tab]) s += badge(x + i * tw + tw - 16, y + h - barH + 12, o.badges[tab])
      })
    }
    content = {
      x: x + 18,
      y: y + bandH + 18,
      w: w - 36,
      h: h - bandH - barH - 30
    }
  } else {
    const navW = tabs.length ? 210 : 0
    tabs.forEach((tab, i) => {
      const on = tab === o.tab
      const ty = y + bandH + 24 + i * 70
      s += button(x + 20, ty, navW - 40, 54, tab, {
        kind: on ? 'primary' : 'normal',
        size: 19,
        r: 14,
        focus: on && o.focusTab
      })
      if (o.badges?.[tab]) s += badge(x + navW - 30, ty + 6, o.badges[tab])
    })
    if (tabs.length) s += rect(x + navW, y + bandH, 1, h - bandH, { fill: C.border })
    content = {
      x: x + navW + 30,
      y: y + bandH + 28,
      w: w - navW - 60,
      h: h - bandH - 50
    }
  }
  return { svg: s, content }
}
/** A count badge: pink, because what it counts needs you (overdue bills). */
export function badge(cx, cy, n) {
  return (
    `<circle cx="${cx}" cy="${cy}" r="11" fill="${C.pink}"/>` +
    text(cx, cy + 4.5, String(n), { size: 12, anchor: 'middle', weight: 700 })
  )
}

// ---------------------------------------------------------------- the frame around every screen
/** The in-world status line along the top: time, curfew, the unit, and Skip intro. */
export function statusLine(W, o = {}) {
  const phone = W < 600
  let s = rect(0, 0, W, phone ? 44 : 48, { fill: '#0b0916', opacity: 0.72 })
  const line = phone ? '23:41 · Curfew' : '23:41 · After curfew · Earth, Block 7 · Unit 7-2216'
  s += text(phone ? 16 : 24, phone ? 28 : 30, line, {
    size: phone ? 13 : 14,
    fill: C.text2,
    family: MONO
  })
  if (o.skip !== false)
    s += button(W - (phone ? 112 : 150), phone ? 8 : 9, phone ? 100 : 130, phone ? 28 : 30, 'Skip intro', {
      kind: 'quiet',
      size: phone ? 12 : 13,
      stroke: '#ffffff40'
    })
  return s
}
/** A note to Koda on the mockup itself (not part of the design): set in a dashed yellowless box. */
export function note(x, y, w, lines, o = {}) {
  const size = o.size ?? 13
  const lh = size * 1.35
  const all = lines.flatMap((l) => wrap(l, Math.floor((w - 24) / (size * 0.62))))
  const h = all.length * lh + 18
  return (
    rect(x, y, w, h, {
      r: 8,
      fill: '#000000b3',
      stroke: '#9088aa',
      sw: 1,
      dash: '4 3'
    }) +
    all
      .map((l, i) =>
        text(x + 12, y + 14 + size * 0.9 + i * lh, l, {
          size,
          fill: '#d8d2ea',
          family: MONO
        })
      )
      .join('')
  )
}
export function frame(W, H, body, title) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<title>${esc(title)}</title>
${defs()}
${rect(0, 0, W, H, { fill: C.spaceDeep })}
${body}
</svg>
`
}
