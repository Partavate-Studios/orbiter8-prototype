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
    if (Math.abs(x + w / 2 - VP[0]) < 70) continue
    const top = VP[1] - (90 + r() * 330)
    s += tower(x, top, w, H, { fill: '#130f45', win: Math.floor(r() * 4), k: 2.6 })
    if (r() < 0.75) {
      const sw = w * (0.6 + r() * 0.3)
      const sh = sw * (0.5 + r() * 0.7)
      s += sign(x + (w - sw) / 2, top + 20 + r() * 120, sw, sh, Math.floor(r() * BB.length), r() < 0.7 ? WORDS[Math.floor(r() * WORDS.length)] : null)
    }
  }
  s += rect(0, VP[1] - 120, W, 200, { fill: 'url(#v-haze)', opacity: 0.6 })
  // the street canyon: the road falling to the vanishing point, its light trails
  s += `<path d="M${VP[0] - 30} ${VP[1]} L${VP[0] + 30} ${VP[1]} L${W * 0.86} ${H} L${W * 0.14} ${H}z" fill="#0d0a30"/>`
  s += `<ellipse cx="${VP[0]}" cy="${H}" rx="${W * 0.5}" ry="${H * 0.45}" fill="url(#v-glow)"/>`
  for (let i = 0; i < 18; i++) {
    const a = -0.42 + (i / 17) * 0.84
    const col = i % 3 === 0 ? '#e6dcf5' : i < 13 ? '#ffb36b' : '#ff8a5c'
    s += `<path d="M${r2(VP[0] + a * 50)} ${VP[1]} L${r2(VP[0] + a * W * 0.8)} ${H}" stroke="${col}" stroke-width="${r2(1 + r() * 2.5)}" opacity="${r2(0.35 + r() * 0.5)}" stroke-dasharray="${r2(20 + r() * 60)} ${r2(6 + r() * 20)}"/>`
  }
  // the near towers framing the canyon, faces receding to the vanishing point, signs hung off them
  const near = (side) => {
    const sx = side < 0 ? 0 : W
    const inner = side < 0 ? VP[0] - 330 : VP[0] + 330
    const wall = `M${sx} -20 L${inner} ${VP[1] - 200} L${inner} ${VP[1] + 60} L${sx} ${H + 20}z`
    const cid = `v-near${side}`
    let t = `<clipPath id="${cid}"><path d="${wall}"/></clipPath><path d="${wall}" fill="#0e0b36"/>`
    t += `<g clip-path="url(#${cid})"><g transform="scale(3.2)">${rect(0, 0, W / 3.2, H / 3.2, { fill: `url(#win${side < 0 ? 2 : 1})`, opacity: 0.8 })}</g></g>`
    t += `<path d="M${inner} ${VP[1] - 200} L${inner} ${VP[1] + 60}" stroke="#8f7cff" stroke-width="2" opacity="0.7"/>`
    // floors receding
    for (let f = 0; f < 18; f++) {
      const yy = -20 + f * 52
      const iy = VP[1] - 200 + f * (260 / 18)
      t += `<path d="M${sx} ${yy} L${inner} ${r2(iy)}" stroke="#2a2270" stroke-width="1" opacity="0.7"/>`
    }
    // vertical signs and screens on the face, in perspective (scaled toward the inner edge)
    for (let n = 0; n < 7; n++) {
      const tt = 0.1 + n * 0.12
      const x = sx + (inner - sx) * tt
      const scale = 1 - tt * 0.85
      const y = 120 + r() * 360 * (1 - tt * 0.4)
      const c = Math.floor(r() * BB.length)
      const vw = 34 * scale
      const vh = 180 * scale
      t += `<ellipse cx="${r2(x)}" cy="${r2(y + vh / 2)}" rx="${r2(vw * 2)}" ry="${r2(vh * 0.8)}" fill="url(#bb-glow-${c})"/>`
      t += rect(r2(x - vw / 2), r2(y), r2(vw), r2(vh), { fill: `url(#bb-fill-${c})`, stroke: '#05041a', sw: 1 })
      const word = WORDS[Math.floor(r() * WORDS.length)][0].replace(/ /g, '')
      ;[...word.slice(0, 6)].forEach((ch, i) => (t += text(r2(x), r2(y + (i + 1) * (vh / 7)), ch, { size: r2(vw * 0.6), anchor: 'middle', weight: 700, fill: '#f6f2ff', opacity: 0.9 })))
    }
    // one big screen high on each side
    const bx = side < 0 ? 90 : W - 90 - 300
    t += sign(bx, 70, 300, 170, side < 0 ? 3 : 2, side < 0 ? WORDS[1] : WORDS[2], { glow: 1 })
    return t
  }
  s += near(-1) + near(1)
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
