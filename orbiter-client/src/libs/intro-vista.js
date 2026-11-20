// The view from unit 7-2216, straight on (docs/mockups/intro-zoom/vista.mjs): what the glass door and the
// window show from the room, and what fills the screen when the camera pushes through the glass onto the
// balcony. You're high up, looking out level, so the streets are out of sight below the rail (Koda,
// 2026-11-20): the towers fall away into the glow of streets you can't see.
//
// One SVG, 1440 × 900, drawn once into a bitmap (intro-screen.vue). The railing, you and the terminal on
// the rail are drawn over it by intro-balcony.vue.

import { corpLogo, worldDefs } from './intro-world'

const W = 1440
const H = 900
const VP = [700, 560]
const BB_COUNT = 8
const WORDS = [
  ['READ THE', 'CONTRACT', 'X'],
  ['WE PLAN IN', 'CENTURIES', 'Y'],
  ['BORN', 'OUT THERE', 'Z'],
  ['NUTRI', 'PASTE'],
  ['OXY+', 'BREATHE'],
  ['LOAN', 'NOW'],
  ['JOBS', 'OFF-WORLD'],
  ['SYNTH', 'SLEEP'],
  ['VITA', '24/7'],
  ['ORBIT', 'BANK']
]
const r1 = (v) => Math.round(v * 10) / 10
function rng(seed) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}
const rect = (x, y, w, h, fill, extra = '') =>
  `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" fill="${fill}"${extra}/>`
const text = (x, y, s, size) =>
  `<text x="${r1(x)}" y="${r1(y)}" font-size="${r1(size)}" fill="#f6f2ff" font-weight="700" text-anchor="middle" font-family="Ubuntu, system-ui, sans-serif">${s}</text>`

function sign(x, y, w, h, c, words, glow = 0.9) {
  let s = `<ellipse cx="${r1(x + w / 2)}" cy="${r1(y + h / 2)}" rx="${r1(w * 1.2)}" ry="${r1(h * 1.4)}" fill="url(#bb-glow-${c})" opacity="${glow}"/>`
  s += rect(x, y, w, h, `url(#bb-fill-${c})`, ' stroke="#05041a" stroke-width="1.5"')
  if (words) {
    const size = Math.min(h * 0.32, (w / Math.max(words[0].length, words[1].length)) * 1.45)
    s +=
      text(x + w / 2, y + h / 2 - size * 0.12, words[0], size) +
      text(x + w / 2, y + h / 2 + size * 0.95, words[1], size)
    if (words[2]) s += corpLogo(words[2], x + w - h * 0.15, y + h * 0.16, h * 0.17, '#f6f2ffcc')
  } else
    for (let i = 0; i < 3; i++)
      s += rect(x + w * 0.1, y + h * (0.2 + i * 0.22), w * (0.75 - i * 0.18), h * 0.1, '#f6f2ff', ' opacity="0.65"')
  return s
}
function tower(x, top, w, base, fill, win, k, winOpacity = 1, rim = '#5a4c8c') {
  return (
    rect(x, top, w, base - top, fill) +
    `<g transform="translate(${r1(x)} ${r1(top)}) scale(${k})">${rect(0, 0, w / k, (base - top) / k, `url(#win${win})`, ` opacity="${winOpacity}"`)}</g>` +
    rect(x, top, w, 1.5, rim, ' opacity="0.8"')
  )
}

/** The view as a standalone SVG document. */
export function vistaSvg() {
  const r = rng(314)
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${worldDefs()}`
  s += `<defs><linearGradient id="v-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05041a"/><stop offset="0.5" stop-color="#1a1460"/><stop offset="0.75" stop-color="#3a2cb0"/><stop offset="1" stop-color="#5a3fd0"/></linearGradient>`
  s += `<linearGradient id="v-haze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a3ad0" stop-opacity="0"/><stop offset="1" stop-color="#4a3ad0" stop-opacity="0.5"/></linearGradient>`
  s += `<radialGradient id="v-glow" cx="50%" cy="100%" r="70%"><stop offset="0" stop-color="#b9a0ff" stop-opacity="0.55"/><stop offset="1" stop-color="#b9a0ff" stop-opacity="0"/></radialGradient></defs>`
  s += rect(0, 0, W, H, 'url(#v-sky)')
  for (let i = 0; i < 6; i++)
    s += `<ellipse cx="${r1(r() * W)}" cy="${r1(60 + r() * 160)}" rx="${r1(200 + r() * 260)}" ry="${r1(20 + r() * 30)}" fill="#3a2cb0" opacity="0.18"/>`
  // the far skyline: many thin towers, hazy, a few spires
  for (let i = 0; i < 110; i++) {
    const w = 14 + r() * 40
    const x = r() * (W + 40) - 20
    const top = VP[1] - (40 + r() * r() * 380)
    s += tower(x, top, w, VP[1] + 20, '#241c78', Math.floor(r() * 4), 1.6, 0.7, '#6a5ad0')
  }
  for (let i = 0; i < 6; i++) {
    const x = 80 + r() * (W - 160)
    const top = 40 + r() * 140
    const w = 10 + r() * 14
    s += `<path d="M${r1(x)} ${VP[1]} L${r1(x)} ${r1(top + 40)} L${r1(x + w / 2)} ${r1(top)} L${r1(x + w)} ${r1(top + 40)} L${r1(x + w)} ${VP[1]}z" fill="#2c2390"/>`
    s +=
      rect(x + w / 2 - 0.7, top - 30, 1.4, 30, '#8f7cff') +
      `<circle cx="${r1(x + w / 2)}" cy="${r1(top - 30)}" r="2.5" fill="#ff8a7a"/>`
  }
  s += rect(0, VP[1] - 240, W, 260, 'url(#v-haze)')
  // the middle towers, darker, with big screens
  for (let i = 0; i < 26; i++) {
    const w = 50 + r() * 90
    const x = r() * (W + 100) - 50
    const top = VP[1] - (90 + r() * 330)
    s += tower(x, top, w, H, '#130f45', Math.floor(r() * 4), 2.6)
    if (r() < 0.75) {
      const sw = w * (0.6 + r() * 0.3)
      const sh = sw * (0.5 + r() * 0.7)
      s += sign(
        x + (w - sw) / 2,
        top + 20 + r() * 120,
        sw,
        sh,
        Math.floor(r() * BB_COUNT),
        r() < 0.7 ? WORDS[Math.floor(r() * WORDS.length)] : null
      )
    }
  }
  s += rect(0, VP[1] - 120, W, 200, 'url(#v-haze)', ' opacity="0.6"')
  // no streets: the glow of the ones below the rail
  s += `<ellipse cx="${W / 2}" cy="${H}" rx="${W * 0.7}" ry="${H * 0.3}" fill="url(#v-glow)"/>`
  // near towers at the sides, straight on: big screens, vertical signs
  for (const [x, w, top, c, words] of [
    [-40, 260, 150, 3, WORDS[1]],
    [W - 230, 270, 90, 2, WORDS[2]],
    [250, 120, 330, 6, null],
    [W - 380, 110, 380, 5, null]
  ]) {
    s += tower(x, top, w, H, '#0c0a2e', 2, 3.4)
    s += sign(x + w * 0.12, top + 40, w * 0.76, w * 0.5, c, words, 1)
    const vx = x + (x < W / 2 ? w - 22 : 22)
    const c2 = (c + 2) % BB_COUNT
    const word = (words ? words[0] : 'VITA').replace(/ /g, '')
    s +=
      `<ellipse cx="${vx}" cy="${top + 380}" rx="40" ry="140" fill="url(#bb-glow-${c2})"/>` +
      rect(vx - 16, top + 260, 32, 230, `url(#bb-fill-${c2})`, ' stroke="#05041a" stroke-width="1"')
    ;[...word.slice(0, 7)].forEach((ch, i) => (s += text(vx, top + 290 + i * 30, ch, 20)))
  }
  // air traffic
  for (let i = 0; i < 40; i++) {
    const x = r() * W
    const y = 80 + r() * 420
    const L = 8 + r() * 30
    s += `<path d="M${r1(x)} ${r1(y)} l${r1(L)} ${r1(L * 0.08)}" stroke="${r() < 0.5 ? '#ffb36b' : '#cfe0ff'}" stroke-width="${r1(1 + r() * 1.5)}" stroke-linecap="round" opacity="0.85"/>`
  }
  return s + '</svg>'
}
