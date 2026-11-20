// The view through the glass: the city straight on, deep and busy, in one-point perspective. It's what the
// glass door and the window show from the room (small, on the wall's slant), and what fills the screen
// when the camera pushes through the glass onto the balcony.
//
// Drawn in a 1440 × 900 frame. o.railing adds the balcony's railing and terminal in the foreground.

import { C, rect, text, corpLogo, rng, owl } from '../intro/art.mjs'

const W = 1440
const H = 900
const VP = [700, 560]
const BB = ['#7b4fe6', '#4f6bff', '#3fc8ff', '#a45cff', '#ff9e4f', '#56d9d0', '#8d7bff', '#5f8bff']
const WORDS = [['READ THE', 'CONTRACT', 'X'], ['WE PLAN IN', 'CENTURIES', 'Y'], ['BORN', 'OUT THERE', 'Z'], ['NUTRI', 'PASTE'], ['OXY+', 'BREATHE'], ['LOAN', 'NOW'], ['JOBS', 'OFF-WORLD'], ['SYNTH', 'SLEEP'], ['VITA', '24/7'], ['ORBIT', 'BANK']]
const r2 = (v) => Math.round(v * 10) / 10

function sign(x, y, w, h, c, words, o = {}) {
  let s = `<ellipse cx="${r2(x + w / 2)}" cy="${r2(y + h / 2)}" rx="${r2(w * 1.2)}" ry="${r2(h * 1.4)}" fill="url(#bb-glow-${c})" opacity="${o.glow ?? 0.9}"/>`
  s += rect(r2(x), r2(y), r2(w), r2(h), { fill: `url(#bb-fill-${c})`, stroke: '#05041a', sw: 1.5 })
  if (words) {
    const size = Math.min(h * 0.32, (w / Math.max(words[0].length, words[1].length)) * 1.45)
    s += text(r2(x + w / 2), r2(y + h / 2 - size * 0.12), words[0], { size: r2(size), anchor: 'middle', weight: 700, fill: '#f6f2ff' })
    s += text(r2(x + w / 2), r2(y + h / 2 + size * 0.95), words[1], { size: r2(size), anchor: 'middle', weight: 700, fill: '#f6f2ff' })
    if (words[2]) s += corpLogo(words[2], x + w - h * 0.15, y + h * 0.16, h * 0.17, '#f6f2ffcc')
  } else for (let i = 0; i < 3; i++) s += rect(r2(x + w * 0.1), r2(y + h * (0.2 + i * 0.22)), r2(w * (0.75 - i * 0.18)), r2(h * 0.1), { fill: '#f6f2ff', opacity: 0.65 })
  return s
}
/** A tower face straight on: body, lit windows at a scale, an antenna. */
function tower(x, top, w, base, o) {
  const k = o.k
  let s = rect(r2(x), r2(top), r2(w), r2(base - top), { fill: o.fill })
  s += `<g transform="translate(${r2(x)} ${r2(top)}) scale(${k})">${rect(0, 0, r2(w / k), r2((base - top) / k), { fill: `url(#win${o.win})`, opacity: o.winOpacity ?? 1 })}</g>`
  s += rect(r2(x), r2(top), r2(w), 1.5, { fill: o.rim ?? '#5a4c8c', opacity: 0.8 })
  return s
}

export function vista(o = {}) {
  const r = rng(o.seed ?? 314)
  let s = ''
  s += `<linearGradient id="v-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05041a"/><stop offset="0.5" stop-color="#1a1460"/><stop offset="0.75" stop-color="#3a2cb0"/><stop offset="1" stop-color="#5a3fd0"/></linearGradient>`
  s += `<linearGradient id="v-haze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a3ad0" stop-opacity="0"/><stop offset="1" stop-color="#4a3ad0" stop-opacity="0.5"/></linearGradient>`
  s += `<radialGradient id="v-glow" cx="50%" cy="100%" r="70%"><stop offset="0" stop-color="#b9a0ff" stop-opacity="0.55"/><stop offset="1" stop-color="#b9a0ff" stop-opacity="0"/></radialGradient>`
  s += rect(0, 0, W, H, { fill: 'url(#v-sky)' })
  // smog drifting high up
  for (let i = 0; i < 6; i++) s += `<ellipse cx="${r() * W}" cy="${60 + r() * 160}" rx="${200 + r() * 260}" ry="${20 + r() * 30}" fill="#3a2cb0" opacity="0.18"/>`
  // the far skyline: many thin towers, hazy, a few spires
  for (let i = 0; i < 110; i++) {
    const w = 14 + r() * 40
    const x = r() * (W + 40) - 20
    const top = VP[1] - (40 + r() * r() * 380)
    s += tower(x, top, w, VP[1] + 20, { fill: '#241c78', win: Math.floor(r() * 4), k: 1.6, winOpacity: 0.7, rim: '#6a5ad0' })
  }
  for (let i = 0; i < 6; i++) {
    const x = 80 + r() * (W - 160)
    const top = 40 + r() * 140
    const w = 10 + r() * 14
    s += `<path d="M${r2(x)} ${VP[1]} L${r2(x)} ${r2(top + 40)} L${r2(x + w / 2)} ${r2(top)} L${r2(x + w)} ${r2(top + 40)} L${r2(x + w)} ${VP[1]}z" fill="#2c2390"/>` + rect(r2(x + w / 2 - 0.7), r2(top - 30), 1.4, 30, { fill: '#8f7cff' }) + `<circle cx="${r2(x + w / 2)}" cy="${r2(top - 30)}" r="2.5" fill="#ff8a7a"/>`
  }
  s += rect(0, VP[1] - 240, W, 260, { fill: 'url(#v-haze)' })
  // the middle towers, darker, with big screens
  for (let i = 0; i < 26; i++) {
    const w = 50 + r() * 90
    const x = r() * (W + 100) - 50
    const top = VP[1] - (90 + r() * 330)
    s += tower(x, top, w, H, { fill: '#130f45', win: Math.floor(r() * 4), k: 2.6 })
    if (r() < 0.75) {
      const sw = w * (0.6 + r() * 0.3)
      const sh = sw * (0.5 + r() * 0.7)
      s += sign(x + (w - sw) / 2, top + 20 + r() * 120, sw, sh, Math.floor(r() * BB.length), r() < 0.7 ? WORDS[Math.floor(r() * WORDS.length)] : null)
    }
  }
  s += rect(0, VP[1] - 120, W, 200, { fill: 'url(#v-haze)', opacity: 0.6 })
  // no streets: you're high up, looking out level; the towers fall away below the rail into the glow
  // of the streets you can't see
  s += `<ellipse cx="${W / 2}" cy="${H}" rx="${W * 0.7}" ry="${H * 0.3}" fill="url(#v-glow)"/>`
  // a few near towers, straight on, at the sides: big screens, vertical signs
  for (const [x, w, top, c, words] of [[-40, 260, 150, 3, WORDS[1]], [W - 230, 270, 90, 2, WORDS[2]], [250, 120, 330, 6, null], [W - 380, 110, 380, 5, null]]) {
    s += tower(x, top, w, H, { fill: '#0c0a2e', win: 2, k: 3.4 })
    s += sign(x + w * 0.12, top + 40, w * 0.76, w * 0.5, c, words, { glow: 1 })
    const vx = x + (x < W / 2 ? w - 22 : 22)
    const c2 = (c + 2) % BB.length
    const word = (words ? words[0] : 'VITA').replace(/ /g, '')
    s += `<ellipse cx="${vx}" cy="${top + 380}" rx="40" ry="140" fill="url(#bb-glow-${c2})"/>` + rect(vx - 16, top + 260, 32, 230, { fill: `url(#bb-fill-${c2})`, stroke: '#05041a', sw: 1 })
    ;[...word.slice(0, 7)].forEach((ch, i) => (s += text(vx, top + 290 + i * 30, ch, { size: 20, anchor: 'middle', weight: 700, fill: '#f6f2ff' })))
  }
  // air traffic
  for (let i = 0; i < 40; i++) {
    const x = r() * W
    const y = 80 + r() * 420
    const L = 8 + r() * 30
    s += `<path d="M${r2(x)} ${r2(y)} l${r2(L)} ${r2(L * 0.08)}" stroke="${r() < 0.5 ? '#ffb36b' : '#cfe0ff'}" stroke-width="${r2(1 + r() * 1.5)}" stroke-linecap="round" opacity="0.85"/>`
  }
  if (o.railing) s += railing()
  return s
}

/** The balcony's rail across the bottom, its posts, and Minerva's terminal mounted on it. */
export function railing() {
  const ry = H - 190
  let s = rect(0, ry, W, 14, { fill: C.black, stroke: C.rimLit, sw: 2 })
  for (let x = 20; x < W; x += 44) s += rect(x, ry + 14, 8, 190, { fill: C.black, stroke: C.rim, sw: 1 })
  s += rect(1040, ry - 92, 150, 92, { r: 8, fill: '#0c0a14', stroke: C.rimLit, sw: 2 }) + rect(1052, ry - 82, 126, 62, { r: 4, fill: '#0c0a14' }) + owl(1115, ry - 51, 60, '#e6dcf5') + rect(1105, ry - 4, 20, 8, { fill: C.black })
  return s
}
