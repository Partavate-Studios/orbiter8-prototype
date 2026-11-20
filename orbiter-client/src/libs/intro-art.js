// The corporations' art for the intro, as SVG strings: their ads (the TV's picture) and logos (Minerva's
// console). Muted, noir. The world itself (the city, the tower, the room) is libs/intro-world.js.

import { CORP_LOOKS } from './intro'

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
