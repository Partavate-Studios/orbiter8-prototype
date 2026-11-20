// What every alternative shares: the top status line, Minerva's "name on file" notice, the controls line
// along the bottom, and a dashed note naming the approach (a note to Koda, not part of the design).

import { C, MONO, rect, text, statusLine, notice, note, padGlyph } from '../intro/art.mjs'

export function chrome(W, H, o = {}) {
  let s = statusLine(W)
  if (o.notice !== false)
    s += notice(o.noticeX ?? 440, o.noticeY ?? 64, o.noticeW ?? 560, 'Name on file: Rhea Okafor',
      o.noticeBody ?? 'Power’s on. So are the bills. The terminal on the desk has your account.',
      { state: 'talking', oneOff: ['nod', 0.4], faceW: 92 })
  s += rect(0, H - 44, W, 44, { fill: C.black, opacity: 0.85 })
  s += text(24, H - 16, o.hint ?? 'Click or tap a thing to use it · Tab, arrows or the D-pad move between things', { size: 14, fill: C.text2 })
  s += padGlyph(W - 280, H - 22, 'A') + text(W - 262, H - 17, 'Use', { size: 14, fill: C.text2 })
  s += padGlyph(W - 200, H - 22, 'B') + text(W - 182, H - 17, 'Back', { size: 14, fill: C.text2 })
  s += padGlyph(W - 110, H - 22, '≡') + text(W - 92, H - 17, 'Menu', { size: 14, fill: C.text2 })
  return s
}

export function approach(x, y, w, name, lines) {
  return note(x, y, w, [`${name}.`, ...lines], { size: 12.5 })
}

export const pts = (a) => a.map((p) => p.map((v) => Math.round(v * 10) / 10).join(',')).join(' ')
export const poly = (a, fill, o = {}) =>
  `<polygon points="${pts(a)}" fill="${fill}"${o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.sw ?? 1.5}" stroke-linejoin="round"` : ''}${o.opacity != null ? ` opacity="${o.opacity}"` : ''}${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`
export { C, MONO }
