// The intro mockup's screens: each moment as a desktop and a phone layout. Copy marked "draft" is
// placeholder in the right voice (the brief: the words are on Koda's to-do list). Minerva's face is drawn
// from the face widget's poses; a dashed "widget:" tag beside it names the state (a note, not the design).

import {
  C,
  CORPS,
  HOTSPOTS,
  MONO,
  ROOM,
  SCANNER,
  TICKER,
  button,
  city,
  consoleFrame,
  corpLogo,
  draft,
  earth,
  face,
  faceTag,
  focusRing,
  hand,
  label,
  note,
  notice,
  owl,
  padGlyph,
  para,
  rect,
  room,
  ship,
  statusLine,
  text,
  tvAdArt
} from './art.mjs'

// ---------------------------------------------------------------- views of the room
/** The room scaled into the screen: desktop shows all of it; phone, a slice centered on `cx`. */
function roomView(W, H, o = {}) {
  const phone = W < 600
  const k = phone ? H / ROOM.h : W / ROOM.w
  const cx = o.cx ?? ROOM.w / 2
  const tx = phone ? W / 2 - cx * k : 0
  const ty = phone ? 0 : (H - ROOM.h * k) / 2
  return {
    k,
    world: (svg) => `<g transform="translate(${tx} ${ty}) scale(${k})">${svg}</g>`,
    at: (x, y) => [tx + x * k, ty + y * k]
  }
}
const dim = (W, H, opacity = 0.55) => rect(0, 0, W, H, { fill: C.black, opacity })
const tagOf = (state, oneOff) => `widget: ${state}${oneOff ? ` + ${oneOff}` : ''}`

/** The console, with a tag naming her face's state. */
function minervaConsole(x, y, w, h, o) {
  const f = consoleFrame(x, y, w, h, o)
  const tag = tagOf(o.state ?? 'talking', o.oneOffName)
  f.svg += o.phone ? faceTag(x + 74, y + 46 + 14, tag) : faceTag(x + 160, y + 46 + 18, tag)
  return f
}

/** Phone: the room's things as big round buttons along the bottom, left to right as in the room. */
function phoneStrip(W, H, focused) {
  const items = [
    ['balcony', 'Balcony'],
    ['tv', 'TV'],
    ['terminal', 'Terminal'],
    ['door', 'Door']
  ]
  let s = rect(0, H - 128, W, 128, { fill: C.black, opacity: 0.9 }) + rect(0, H - 128, W, 1, { fill: C.border })
  const step = W / items.length
  items.forEach(([key, name], i) => {
    const cx = step * i + step / 2
    const cy = H - 80
    const on = key === focused
    if (on) s += `<circle cx="${cx}" cy="${cy}" r="35" fill="none" stroke="${C.brand300}" stroke-width="2.5"/>`
    s += `<circle cx="${cx}" cy="${cy}" r="29" fill="${on ? C.lavender : C.button}" stroke="#ffffff55" stroke-width="1.2"/>`
    s += stripIcon(key, cx, cy, on ? '#1c0838' : '#ffffff')
    s += text(cx, H - 22, name, { size: 13, anchor: 'middle', fill: on ? C.text : C.text2 })
  })
  return s
}
function stripIcon(key, cx, cy, c) {
  if (key === 'door')
    return (
      rect(cx - 9, cy - 15, 18, 30, { r: 2, stroke: c, sw: 2.5 }) +
      `<circle cx="${cx - 4}" cy="${cy + 2}" r="2" fill="${c}"/>`
    )
  if (key === 'tv')
    return (
      rect(cx - 15, cy - 11, 30, 20, { r: 3, stroke: c, sw: 2.5 }) +
      `<path d="M${cx - 7} ${cy + 15} l14 0" stroke="${c}" stroke-width="2.5"/>`
    )
  if (key === 'terminal') return owl(cx, cy, 34, c)
  return `<path d="M${cx - 15} ${cy - 4} l30 0 M${cx - 15} ${cy - 4} l0 18 M${cx - 5} ${cy - 4} l0 18 M${cx + 5} ${cy - 4} l0 18 M${cx + 15} ${cy - 4} l0 18" stroke="${c}" stroke-width="2.5" fill="none"/>`
}
const panArrows = (W, H) =>
  [
    [18, '‹'],
    [W - 18, '›']
  ]
    .map(
      ([x, g]) =>
        `<circle cx="${x}" cy="${H * 0.45}" r="16" fill="#030306aa" stroke="#ffffff40"/>` +
        text(x, H * 0.45 + 8, g, { size: 24, anchor: 'middle', fill: C.text2 })
    )
    .join('')
function idCard(x, y, k = 1, rotate = -8) {
  return `<g transform="translate(${x} ${y}) rotate(${rotate}) scale(${k})">${rect(0, 0, 190, 120, { r: 10, fill: '#b9b4c6', stroke: '#6a6188', sw: 2 })}${rect(14, 18, 50, 62, { r: 4, fill: '#6a6188' })}<circle cx="39" cy="40" r="12" fill="#b9b4c6"/>${rect(26, 56, 26, 20, { r: 8, fill: '#b9b4c6' })}${rect(78, 22, 90, 8, { fill: '#6a6188' })}${rect(78, 40, 70, 6, { fill: '#8f88a6' })}${rect(78, 54, 80, 6, { fill: '#8f88a6' })}${text(14, 104, 'NON-CITIZEN · STIPEND', { size: 10, fill: '#3a3352', weight: 700, family: MONO })}</g>`
}

// ---------------------------------------------------------------- 1. dark: the power's off until you scan your card
const dark = {
  id: '01-dark',
  title: 'the apartment in the dark: only the ID scanner is lit',
  desktop(W, H) {
    const v = roomView(W, H)
    let s = v.world(room({ lights: false, scanner: 'idle' }))
    const [sx, sy] = v.at(SCANNER.cx, SCANNER.cy)
    s += focusRing(sx - 60, sy - 80, 120, 160, { focused: true })
    s += label(sx, sy - 96, 'Scan your ID card', { focused: true })
    s += hand(sx - 170, sy + 120, 0.9, { pose: 'hold' }) + idCard(sx - 250, sy + 40, 0.9, -12)
    s += faceTag(sx, sy + 100, tagOf('idle'))
    s += statusLine(W, { dark: true })
    s += rect(0, H - 44, W, 44, { fill: C.black, opacity: 0.9 })
    s += text(24, H - 16, 'Click or tap the scanner · Enter or A to scan', { size: 14, fill: C.text2 })
    s += note(40, 80, 500, [
      'The power is off until you scan your card: everything is black but the scanner by the door, Minerva’s face glowing on its screen. It’s the only thing to do.',
      'The room is there in the dark; the scanner’s glow catches the door’s edge.'
    ])
    return s
  },
  phone(W, H) {
    const v = roomView(W, H, { cx: 1330 })
    let s = v.world(room({ lights: false, scanner: 'idle' }))
    const [sx, sy] = v.at(SCANNER.cx, SCANNER.cy)
    s += focusRing(sx - 44, sy - 60, 88, 120, { focused: true })
    s += faceTag(sx, sy + 78, tagOf('idle'))
    s += statusLine(W, { dark: true })
    s += button(20, H - 100, W - 40, 60, 'Scan your ID card', { kind: 'primary', size: 19, focus: true })
    s += note(14, 56, 260, ['All black but the scanner. One thing to do: scan your card.'], { size: 11 })
    return s
  }
}

// ---------------------------------------------------------------- 2. the scanner: your name, the wait, the lights
/** The scanner's face, close: a device with Minerva's face at the top of its screen. */
function scannerDevice(x, y, w, h, state, inner, o = {}) {
  let s = `<ellipse cx="${x + w / 2}" cy="${y + h / 2}" rx="${w}" ry="${h * 0.75}" fill="url(#light)"/>`
  s += rect(x, y, w, h, { r: 24, fill: '#0c0a14', stroke: C.rimLit, sw: 2.5 })
  s += rect(x + 18, y + 18, w - 36, h - 76, { r: 14, fill: '#07060b', stroke: C.rim, sw: 1.5 })
  const fw = o.faceW ?? 170
  s += face(x + w / 2, y + 30 + fw * 0.32, fw, state, { oneOff: o.oneOff })
  s += faceTag(x + w / 2, y + 36 + fw * 0.66, tagOf(state, o.oneOff?.[0]))
  s += text(x + w / 2, y + h - 24, 'MINERVA · ID', { size: 12, anchor: 'middle', fill: C.text3, ls: 3, weight: 700 })
  return s + inner(x + 18, y + 44 + fw * 0.72, w - 36)
}
const scannerName = {
  id: '02a-scanner-name',
  title: 'the ID scanner asks your name (the first transaction), in the dark',
  desktop(W, H) {
    const v = roomView(W, H)
    let s = v.world(room({ lights: false, scanner: 'listening' })) + dim(W, H, 0.6)
    s += scannerDevice(500, 100, 440, 640, 'listening', (x, y, w) => {
      let t = para(x + 24, y + 30, 'Card read. No name on file for this card. What’s your name?', {
        size: 22,
        width: w - 48,
        lh: 30
      }).svg
      t += draft(x + w - 64, y + 4)
      t += rect(x + 18, y + 112, w - 36, 64, { r: 12, fill: '#120f1c', stroke: C.brand300, sw: 2.5 })
      t +=
        text(x + 40, y + 154, 'Rhea Okafor', { size: 26 }) + rect(x + 194, y + 130, 2.5, 30, { fill: C.lavenderLight })
      t += text(x + 24, y + 204, 'Filed with Minerva. Names are unique.', { size: 14, fill: C.text3 })
      t += button(x + 18, y + 232, w - 36, 64, 'Register with Minerva', { kind: 'primary', size: 21, focus: true })
      t += text(x + w / 2, y + 328, 'Your wallet signs this: your first move on chain.', {
        size: 13,
        fill: C.text3,
        anchor: 'middle'
      })
      return t
    })
    s += hand(290, 700, 1.1, { pose: 'hold' }) + idCard(200, 560, 1.1, -6)
    s += statusLine(W, { dark: true })
    s += note(990, 90, 420, [
      'Still dark: the scanner comes forward and its light is all there is. Minerva asks, face at the top of its screen, listening while you type (each key flashes her eyes).',
      'Typing: the system keyboard on phones; with a gamepad, A opens the platform or an on-screen keyboard. Enter or A registers; B backs out.'
    ])
    return s
  },
  phone(W, H) {
    const v = roomView(W, H, { cx: 1330 })
    let s = v.world(room({ lights: false, scanner: 'listening' })) + dim(W, H, 0.7)
    s += scannerDevice(
      16,
      54,
      W - 32,
      520,
      'listening',
      (x, y, w) => {
        let t = para(x + 14, y + 10, 'Card read. No name on file. What’s your name?', {
          size: 17,
          width: w - 28,
          lh: 23
        }).svg
        t += rect(x + 10, y + 60, w - 20, 52, { r: 10, fill: '#120f1c', stroke: C.brand300, sw: 2.5 })
        t +=
          text(x + 26, y + 94, 'Rhea Okafor', { size: 20 }) + rect(x + 146, y + 76, 2.5, 22, { fill: C.lavenderLight })
        t += button(x + 10, y + 128, w - 20, 54, 'Register with Minerva', { kind: 'primary', size: 17, focus: true })
        return t
      },
      { faceW: 130 }
    )
    s += rect(0, H - 262, W, 262, { fill: '#1c1a24' })
    ;['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'].forEach((row, r) => {
      const off = (W - row.length * 38) / 2
      ;[...row].forEach(
        (ch, i) =>
          (s +=
            rect(off + i * 38, H - 246 + r * 52, 34, 44, { r: 6, fill: '#34313f' }) +
            text(off + i * 38 + 17, H - 216 + r * 52, ch, { size: 18, anchor: 'middle' }))
      )
    })
    s += rect(80, H - 90, W - 160, 44, { r: 6, fill: '#34313f' })
    s += statusLine(W, { dark: true })
    return s
  }
}
function steps(x, y, w, items, o = {}) {
  const size = o.size ?? 14
  let s = ''
  const step = w / items.length
  items.forEach(([name, state], i) => {
    const cx = x + step * i + 14
    const color = state === 'done' ? C.lavender : state === 'you' ? C.pinkLight : state === 'now' ? C.brand300 : C.text3
    if (i)
      s += rect(x + step * i - step + 30, y - 1, step - 34, 2, {
        fill: state === 'next' ? C.border : C.lavender,
        opacity: 0.6
      })
    s += `<circle cx="${cx}" cy="${y}" r="11" fill="${state === 'done' ? C.lavender : 'none'}" stroke="${color}" stroke-width="2.5" ${state === 'you' ? 'stroke-dasharray="4 3"' : ''}/>`
    if (state === 'done') s += `<path d="M${cx - 5} ${y} l4 4 7 -8" stroke="#1c0838" stroke-width="2.5" fill="none"/>`
    s += text(x + step * i, y + 32, name, { size, fill: color })
  })
  return s
}
const scannerWait = {
  id: '02b-scanner-waiting',
  title: 'the scanner while the first transaction goes through, still dark',
  desktop(W, H) {
    const v = roomView(W, H)
    let s = v.world(room({ lights: false, scanner: 'thinking' })) + dim(W, H, 0.6)
    s += scannerDevice(500, 100, 440, 620, 'thinking', (x, y, w) => {
      let t = text(x + 24, y + 36, 'Rhea Okafor', { size: 28, weight: 500 })
      t += text(x + 24, y + 68, 'Filing your name.', { size: 18, fill: C.text2 })
      t += rect(x + 80, y + 92, w - 160, 100, { r: 12, stroke: C.brand300, sw: 2 })
      for (let i = 0; i < 5; i++)
        t += rect(x + 86, y + 104 + i * 18, w - 172, 3, { fill: C.brand300, opacity: i === 2 ? 0.85 : 0.15 })
      t += steps(x + 24, y + 234, w - 40, [
        ['Card read', 'done'],
        ['Your signature', 'you'],
        ['Filed', 'next']
      ])
      t += rect(x + 18, y + 298, w - 36, 54, { r: 27, stroke: C.pink, sw: 2 })
      t += text(x + w / 2, y + 331, 'Confirm it in your wallet', {
        size: 18,
        anchor: 'middle',
        fill: C.pinkLight,
        weight: 500
      })
      return t
    })
    s += statusLine(W, { dark: true })
    s += note(990, 90, 420, [
      'The wait is the scanner reading your card: a scan line sweeps it while Minerva thinks (her parts circle, her eyes scan).',
      'Signature step pink while it waits on your wallet; then it keeps sweeping until the block lands. Try again after 30 s unanswered.'
    ])
    return s
  },
  phone(W, H) {
    const v = roomView(W, H, { cx: 1330 })
    let s = v.world(room({ lights: false, scanner: 'thinking' })) + dim(W, H, 0.7)
    s += scannerDevice(
      16,
      70,
      W - 32,
      540,
      'thinking',
      (x, y, w) => {
        let t =
          text(x + 14, y + 26, 'Rhea Okafor', { size: 22, weight: 500 }) +
          text(x + 14, y + 52, 'Filing your name.', { size: 14, fill: C.text2 })
        t += rect(x + 40, y + 70, w - 80, 86, { r: 10, stroke: C.brand300, sw: 2 })
        for (let i = 0; i < 4; i++)
          t += rect(x + 46, y + 82 + i * 18, w - 92, 3, { fill: C.brand300, opacity: i === 1 ? 0.85 : 0.15 })
        t += steps(
          x + 10,
          y + 192,
          w - 10,
          [
            ['Read', 'done'],
            ['Sign', 'you'],
            ['Filed', 'next']
          ],
          { size: 13 }
        )
        t +=
          rect(x + 10, y + 250, w - 20, 50, { r: 25, stroke: C.pink, sw: 2 }) +
          text(x + w / 2, y + 281, 'Confirm in your wallet', {
            size: 16,
            anchor: 'middle',
            fill: C.pinkLight,
            weight: 500
          })
        return t
      },
      { faceW: 130 }
    )
    s += statusLine(W, { dark: true })
    return s
  }
}
const lightsOn = {
  id: '02c-lights-on',
  title: 'name filed: the lights come on, and the room opens up',
  desktop(W, H) {
    const v = roomView(W, H)
    let s = v.world(room({ tv: 'X', scanner: 'talking' }))
    s += v.world(
      Object.entries(HOTSPOTS)
        .map(([key, h]) => focusRing(h.x, h.y, h.w, h.h, { focused: key === 'terminal', sw: 3.5 }))
        .join('')
    )
    for (const [key, h] of Object.entries(HOTSPOTS))
      s += label(...v.at(h.x + h.w / 2, h.y - 14), h.label, { focused: key === 'terminal' })
    s += hand(...v.at(1080, 690), 0.72)
    s += notice(
      440,
      64,
      560,
      'Name on file: Rhea Okafor',
      'Power’s on. So are the bills. The terminal on the desk has your account.',
      { state: 'talking', oneOff: ['nod', 0.35], faceW: 96 }
    )
    s += faceTag(500, 158, tagOf('talking', 'nod'))
    s += statusLine(W)
    s += rect(0, H - 44, W, 44, { fill: C.black, opacity: 0.85 })
    s += text(24, H - 16, 'Click or tap a thing to use it · Tab, arrows or the D-pad move between things', {
      size: 14,
      fill: C.text2
    })
    s += padGlyph(W - 280, H - 22, 'A', 11) + text(W - 262, H - 17, 'Use', { size: 14, fill: C.text2 })
    s += padGlyph(W - 200, H - 22, 'B', 11) + text(W - 182, H - 17, 'Back', { size: 14, fill: C.text2 })
    s += padGlyph(W - 120, H - 22, '≡', 11) + text(W - 102, H - 17, 'Menu', { size: 14, fill: C.text2 })
    s += note(
      1030,
      64,
      390,
      [
        'Once the name is filed the lights come on: the ceiling strip, the TV, the terminal, in that order. Minerva nods and points you at the terminal (it has focus).',
        'Dashed rings: things you can use (first visit only?). The balcony door is left, the door out right; both run off the edges.'
      ],
      { size: 12 }
    )
    return s
  },
  phone(W, H) {
    const v = roomView(W, H, { cx: 960 })
    let s = v.world(room({ tv: 'X', scanner: 'talking' }))
    s += v.world(
      focusRing(HOTSPOTS.terminal.x, HOTSPOTS.terminal.y, HOTSPOTS.terminal.w, HOTSPOTS.terminal.h, {
        focused: true,
        sw: 4
      }) + focusRing(HOTSPOTS.tv.x, HOTSPOTS.tv.y, HOTSPOTS.tv.w, HOTSPOTS.tv.h, { sw: 4 })
    )
    s += label(...v.at(1080, 506), 'Terminal', { focused: true })
    s += hand(...v.at(1080, 690), 0.6)
    s += panArrows(W, H)
    s += notice(10, 52, W - 20, 'Name on file', 'Power’s on. So are the bills.', {
      state: 'talking',
      oneOff: ['nod', 0.35],
      faceW: 70,
      size: 14
    })
    s += statusLine(W)
    s += phoneStrip(W, H, 'terminal')
    return s
  }
}

// ---------------------------------------------------------------- the door: the curfew, in your corporation's voice
function doorPanel(x, y, w, key, o = {}) {
  const corp = CORPS[key]
  const size = o.size ?? 17
  const lines = para(0, 0, corp.curfew, { size, width: w - 48, family: corp.headFont, lh: size * 1.35 })
  const h = 96 + lines.height
  let s = rect(x, y, w, h, { r: 14, fill: '#0b0912f2', stroke: o.on ? C.lavender : C.border, sw: o.on ? 2 : 1.2 })
  s += rect(x + 14, y, w - 28, 3, { fill: corp.color, opacity: 0.8 })
  s +=
    corpLogo(key, x + 34, y + 40, 28) +
    text(x + 60, y + 38, `${corp.name} · Curfew`, { size: 15, weight: 600, family: corp.headFont })
  s += text(x + 60, y + 58, o.on ? 'Your subscription' : 'If you were subscribed', { size: 12, fill: C.text3 })
  s += `<g transform="translate(${x + 24} ${y + 92})">${lines.svg}</g>`
  s += draft(x + w - 60, y + 36)
  return s
}
const door = {
  id: '02d-door-curfew',
  title: 'the door: the curfew warning, in your corporation’s voice',
  desktop(W, H) {
    const v = roomView(W, H)
    let s = v.world(room({ tv: 'Y' })) + dim(W, H, 0.65)
    s += v.world(
      focusRing(HOTSPOTS.door.x, HOTSPOTS.door.y, HOTSPOTS.door.w, HOTSPOTS.door.h, { focused: true, sw: 4 })
    )
    s += hand(...v.at(1440, 600), 0.72)
    s += doorPanel(110, 100, 560, 'Y', { on: true, size: 20 })
    s += button(110, 360, 200, 52, 'OK', { kind: 'primary', size: 18, focus: true })
    s += text(110, 470, 'The same moment under the other two:', { size: 15, fill: C.text2 })
    s += doorPanel(110, 490, 470, 'X', { size: 15 })
    s += doorPanel(600, 490, 470, 'Z', { size: 15 })
    s += statusLine(W)
    s += note(
      700,
      100,
      380,
      [
        'The door stays locked; its panel speaks for your corporation, which enforces the curfew: violence in the block, and too little security to answer. Only your subscription shows in the game; the other two are here to compare voices.'
      ],
      { size: 12 }
    )
    return s
  },
  phone(W, H) {
    const v = roomView(W, H, { cx: 1380 })
    let s = v.world(room({ tv: 'Y' })) + dim(W, H, 0.65)
    s += v.world(
      focusRing(HOTSPOTS.door.x, HOTSPOTS.door.y, HOTSPOTS.door.w, HOTSPOTS.door.h, { focused: true, sw: 4 })
    )
    s += doorPanel(16, 250, W - 32, 'Y', { on: true, size: 16 })
    s += button(16, 500, W - 32, 52, 'OK', { kind: 'primary', size: 18, focus: true })
    s += statusLine(W)
    s += phoneStrip(W, H, 'door')
    return s
  }
}

// ---------------------------------------------------------------- 3. first boot: choosing a corporation
function corpCard(x, y, w, h, key, o = {}) {
  const corp = CORPS[key]
  let s = ''
  if (o.focus) s += rect(x - 6, y - 6, w + 12, h + 12, { r: 20, stroke: C.brand300, sw: 2.5 })
  s += rect(x, y, w, h, { r: 16, fill: '#17141f', stroke: o.focus ? C.lavender : C.border, sw: o.focus ? 2 : 1.2 })
  s += rect(x + 16, y, w - 32, 3, { fill: corp.color, opacity: 0.8 })
  if (o.compact) {
    s += corpLogo(key, x + 36, y + h / 2 + 2, 32)
    s += text(x + 70, y + 34, corp.name, { size: 19, weight: 600, family: corp.headFont })
    s += text(x + 70, y + 54, corp.kind, { size: 12, fill: C.text3 })
    return s + para(x + 70, y + 78, corp.feels, { size: 13, width: w - 90, fill: C.text2, italic: true }).svg
  }
  s += corpLogo(key, x + w / 2, y + 66, 56)
  s += text(x + w / 2, y + 130, corp.name, { size: 24, weight: 600, anchor: 'middle', family: corp.headFont })
  s += text(x + w / 2, y + 154, corp.kind, { size: 12, fill: C.text3, anchor: 'middle' })
  const p = para(x + 22, y + 194, corp.character, { size: 15, width: w - 44, fill: C.text2 })
  s += p.svg + para(x + 22, y + 204 + p.height, corp.feels, { size: 15, width: w - 44, italic: true }).svg
  s += draft(x + w - 58, y + 26)
  return s + button(x + 22, y + h - 72, w - 44, 52, 'Subscribe', { kind: o.focus ? 'primary' : 'normal', size: 18 })
}
const firstBoot = {
  id: '03a-first-boot',
  title: 'the housing computer’s first boot: choosing a corporation',
  desktop(W, H) {
    const v = roomView(W, H)
    let s = v.world(room({ tv: 'X' })) + rect(0, 0, W, H, { fill: 'url(#scrim)' })
    const f = minervaConsole(60, 64, W - 120, H - 100, {
      corp: null,
      tabs: false,
      state: 'talking',
      say: 'This unit runs through a corporation. Pick one. You can switch later; on Earth it’s free.'
    })
    s += f.svg
    const c = f.content
    s += text(c.x, c.y + 20, 'Subscribe to a corporation', { size: 24, weight: 500 })
    s += draft(c.x + c.w - 50, c.y + 16)
    const cw = (c.w - 32) / 3
    ;['X', 'Y', 'Z'].forEach(
      (key, i) => (s += corpCard(c.x + i * (cw + 16), c.y + 50, cw, 440, key, { focus: key === 'Y' }))
    )
    s += para(
      c.x,
      c.y + 530,
      'Your corporation runs this unit, your job board, the curfew and this console’s look. Minerva works the same for everyone.',
      { size: 15, width: c.w, fill: C.text2 }
    ).svg
    s += statusLine(W)
    return s
  },
  phone(W, H) {
    let s = rect(0, 0, W, H, { fill: C.black })
    const f = minervaConsole(0, 44, W, H - 44, {
      corp: null,
      tabs: false,
      phone: true,
      state: 'talking',
      say: 'This unit runs through a corporation. Pick one. Switch any time.'
    })
    s += f.svg
    const c = f.content
    ;['X', 'Y', 'Z'].forEach(
      (key, i) => (s += corpCard(c.x, c.y + i * 136, c.w, 122, key, { compact: true, focus: key === 'Y' }))
    )
    s += draft(c.x + c.w - 50, c.y - 4)
    s += button(c.x, H - 86, c.w, 56, 'Subscribe to Corp Y', { kind: 'primary', size: 18 })
    s += statusLine(W)
    return s
  }
}
function skinPreview(x, y, w, key, o = {}) {
  const corp = CORPS[key]
  const h = 150
  let s = rect(x, y, w, h, { r: 12, fill: '#120f1c', stroke: o.on ? C.lavender : C.border, sw: o.on ? 2 : 1 })
  s +=
    rect(x + 1, y + 1, w - 2, 34, { r: 11, fill: corp.band }) +
    rect(x, y + 34, w, 2, { fill: corp.color, opacity: 0.8 })
  s +=
    corpLogo(key, x + 20, y + 18, 16) +
    text(x + 36, y + 23, `${corp.name} housing`, { size: 11, fill: C.text2, family: corp.headFont })
  s += face(x + 44, y + 76, 64, 'idle')
  s += para(x + 84, y + 64, corp.greeting, { size: 12, width: w - 96, family: corp.headFont }).svg
  return (
    s +
    text(x + 16, y + h - 14, o.on ? 'Subscribed' : 'Switch', {
      size: 13,
      fill: o.on ? C.lavender : C.brand300,
      weight: 600
    })
  )
}
const switching = {
  id: '03b-switching',
  title: 'switching corporation later: what changes',
  desktop(W, H) {
    const v = roomView(W, H)
    let s = v.world(room({ tv: 'X' })) + rect(0, 0, W, H, { fill: 'url(#scrim)' })
    const f = minervaConsole(60, 64, W - 120, H - 100, {
      corp: 'Y',
      tab: null,
      state: 'talking',
      say: 'Switching is free while you’re on Earth. Out there it costs, and your property moves with you.',
      bandText: 'Corp Y housing · Settings'
    })
    s += f.svg
    const c = f.content
    s += text(c.x, c.y + 20, 'Your corporation', { size: 24, weight: 500 })
    s += draft(c.x + c.w - 50, c.y + 16)
    const pw = (c.w - 32) / 3
    ;['X', 'Y', 'Z'].forEach((key, i) => {
      if (key === 'Z')
        s += rect(c.x + i * (pw + 16) - 5, c.y + 45, pw + 10, 160, { r: 15, stroke: C.brand300, sw: 2.5 })
      s += skinPreview(c.x + i * (pw + 16), c.y + 50, pw, key, { on: key === 'Y' })
    })
    s += text(c.x, c.y + 250, 'What switching to Corp Z changes', { size: 18, weight: 500 })
    ;[
      ['Here, on Earth', 'Free. Your curfew warnings, ads, job board and this console’s look become Corp Z’s.'],
      [
        'Later, as a pilot',
        'A fee, and maybe a wait before some benefits start. Your ports’ taxes, and the law over what you own, move with you.'
      ],
      ['Never', 'Minerva: her face, her records and how she speaks to you.']
    ].forEach(([k, val], i) => {
      s += text(c.x, c.y + 290 + i * 60, k, { size: 15, fill: C.text3 })
      s += para(c.x + 170, c.y + 290 + i * 60, val, { size: 15, width: c.w - 170, fill: C.text2 }).svg
    })
    s +=
      button(c.x, c.y + 480, 280, 58, 'Switch to Corp Z', { size: 19, focus: true }) +
      button(c.x + 300, c.y + 480, 200, 58, 'Stay with Corp Y', { kind: 'quiet', size: 17 })
    s += statusLine(W)
    return s
  },
  phone(W, H) {
    let s = rect(0, 0, W, H, { fill: C.black })
    const f = minervaConsole(0, 44, W, H - 44, {
      corp: 'Y',
      phone: true,
      tab: null,
      badges: { Mail: 2 },
      state: 'talking',
      say: 'Switching is free while you’re on Earth.',
      bandText: 'Corp Y housing · Settings'
    })
    s += f.svg
    const c = f.content
    s += skinPreview(c.x, c.y, c.w, 'Y', { on: true })
    s +=
      rect(c.x - 5, c.y + 165, c.w + 10, 160, { r: 15, stroke: C.brand300, sw: 2.5 }) +
      skinPreview(c.x, c.y + 170, c.w, 'Z')
    s += para(c.x, c.y + 348, 'Your curfew, ads, job board and this look become Corp Z’s. Minerva doesn’t change.', {
      size: 13,
      width: c.w,
      fill: C.text2
    }).svg
    s += button(c.x, c.y + 398, c.w, 54, 'Switch to Corp Z', { size: 18 })
    s += draft(c.x + c.w - 50, c.y + 348)
    s += statusLine(W)
    return s
  }
}

// ---------------------------------------------------------------- 4. the TV
function tvMoment(key) {
  const corp = CORPS[key]
  const n = { X: 1, Y: 2, Z: 3 }[key]
  return {
    id: `04${{ X: 'a', Y: 'b', Z: 'c' }[key]}-tv-${key.toLowerCase()}`,
    title: `the TV: a ${corp.name} ad`,
    desktop(W, H) {
      const v = roomView(W, H)
      let s = v.world(room({ tv: key })) + dim(W, H, 0.85)
      s += `<ellipse cx="${W / 2}" cy="${H / 2 - 40}" rx="640" ry="380" fill="url(#light)"/>`
      s += rect(W / 2 - 480, 90, 960, 600, { r: 20, fill: C.black, stroke: C.rimLit, sw: 4 })
      s += `<svg x="${W / 2 - 468}" y="102" width="936" height="576" viewBox="0 0 468 288" preserveAspectRatio="xMidYMid slice">${tvAdArt(key)}</svg>`
      s += draft(W / 2 + 400, 130)
      s +=
        rect(W / 2 - 468, 644, 936, 34, { fill: '#000000c0' }) +
        text(W / 2 - 452, 667, TICKER, { size: 14, fill: C.text2, family: MONO })
      s +=
        button(W / 2 - 330, 730, 200, 56, '‹ Previous', { size: 18 }) +
        button(W / 2 - 100, 730, 200, 56, 'Next ad ›', { size: 18, focus: true }) +
        button(W / 2 + 130, 730, 200, 56, 'Turn off', { size: 18, kind: 'quiet' })
      s += text(W / 2, 820, `Ad ${n} of 3 · they cycle on their own every 8 s`, {
        size: 14,
        anchor: 'middle',
        fill: C.text3
      })
      s += statusLine(W)
      if (key === 'X')
        s += note(
          W / 2 + 350,
          726,
          370,
          [
            'Each corporation’s ad sells its business model: X the contract, Y belonging, Z speed. Muted, like everything in the city: the noir look. The ticker under every channel is Minerva’s, with the curfew and why.'
          ],
          { size: 12 }
        )
      return s
    },
    phone(W, H) {
      let s = rect(0, 0, W, H, { fill: C.black })
      s += `<ellipse cx="${W / 2}" cy="320" rx="300" ry="260" fill="url(#light)"/>`
      s += rect(12, 110, W - 24, 420, { r: 14, fill: C.black, stroke: C.rimLit, sw: 3 })
      s += `<svg x="20" y="118" width="${W - 40}" height="404" viewBox="0 0 468 300" preserveAspectRatio="xMaxYMid slice">${tvAdArt(key, { copy: false })}</svg>`
      const fam = corp.headFont
      s +=
        rect(20, 390, W - 40, 132, { fill: '#000000', opacity: 0.72 }) +
        text(36, 430, corp.ad.head, { size: 25, weight: 700, family: fam, fill: C.smoke }) +
        text(36, 461, corp.ad.head2, { size: 25, weight: 700, family: fam, fill: C.smoke }) +
        text(36, 492, corp.ad.sub, { size: 14, family: fam, fill: C.text2 })
      s += draft(W - 80, 140)
      s +=
        rect(20, 538, W - 40, 30, { fill: '#000000c0' }) +
        text(30, 558, 'MINERVA · Curfew 22:00–05:00 · violence high', { size: 12, fill: C.text2, family: MONO })
      s +=
        button(20, 600, (W - 52) / 2, 54, '‹ Previous', { size: 16 }) +
        button(32 + (W - 52) / 2, 600, (W - 52) / 2, 54, 'Next ad ›', { size: 16, focus: true })
      s +=
        button(20, 670, W - 40, 50, 'Turn off', { size: 16, kind: 'quiet' }) +
        text(W / 2, 750, `Ad ${n} of 3`, { size: 13, anchor: 'middle', fill: C.text3 })
      s += statusLine(W)
      return s
    }
  }
}

// ---------------------------------------------------------------- 5. the balcony
function vapor(cx, cy, k = 1) {
  return [
    [0, 0, 70, 40],
    [60, -50, 90, 50],
    [140, -110, 120, 60]
  ]
    .map(
      ([dx, dy, rx, ry]) =>
        `<ellipse cx="${cx + dx * k}" cy="${cy + dy * k}" rx="${rx * k}" ry="${ry * k}" fill="url(#vapor)"/>`
    )
    .join('')
}
function vape(x, y, k = 1) {
  return `<g transform="translate(${x} ${y}) rotate(-30) scale(${k})">${rect(-8, -60, 16, 70, { r: 6, fill: '#1a1726', stroke: C.rimLit, sw: 2 })}${rect(-5, -72, 10, 14, { r: 3, fill: C.rim })}<circle cx="0" cy="-30" r="3" fill="${C.brand300}"/></g>`
}
/** The railing across the bottom of the screen, with the terminal mounted on its top rail at `tx`. */
function railing(W, H, top, gap, tx, k = 1) {
  let s = rect(0, top + 16, W, H - top, { fill: C.black })
  for (let x = 8; x < W; x += gap) s += rect(x, top + 14, 7 * k, H - top, { fill: '#0b0a12', stroke: C.rim, sw: 1 })
  s += rect(-4, top, W + 8, 16 * k, { fill: '#0d0b14', stroke: C.rimLit, sw: 1.5 })
  // the terminal sits on the rail, on a short bracket
  const tw = 170 * k
  const th = 120 * k
  s += rect(tx + tw / 2 - 12 * k, top - 14 * k, 24 * k, 16 * k, { fill: C.black, stroke: C.rim, sw: 1 })
  s += `<ellipse cx="${tx + tw / 2}" cy="${top - th / 2 - 14 * k}" rx="${tw}" ry="${th}" fill="url(#light)"/>`
  s += rect(tx, top - th - 14 * k, tw, th, { r: 10 * k, fill: '#0c0a14', stroke: C.rimLit, sw: 2 })
  s += rect(tx + 10 * k, top - th - 4 * k, tw - 20 * k, th - 20 * k, { r: 5, fill: '#07060b' })
  s += face(tx + tw / 2, top - th / 2 - 22 * k, 120 * k, 'skeptical', { glow: false })
  s += text(tx + tw / 2, top - 30 * k, 'HEALTH −1', {
    size: 12 * k,
    anchor: 'middle',
    fill: C.pinkLight,
    weight: 700,
    family: MONO
  })
  return s
}
const balcony = {
  id: '05-balcony',
  title: 'the balcony: the city, the vape, a health notice',
  desktop(W, H) {
    let s = city(0, 0, W, H - 200, { zoom: 2, seed: 23, adOffset: 1 })
    s += railing(W, H, H - 250, 52, 1120)
    s += focusRing(1105, H - 400, 200, 162, { sw: 3 }) + label(1205, H - 412, 'Terminal')
    s += faceTag(1205, H - 230, tagOf('skeptical'))
    s += vapor(760, 420, 1.4) + hand(680, 700, 1.2, { pose: 'hold', extra: vape(40, 30, 1.3) })
    s += notice(
      60,
      70,
      560,
      'Health score 14 (−1)',
      'Vape. Fourth today. At this rate your score reaches zero in 14 days. I’m only counting.',
      { attention: true, state: 'skeptical', faceW: 96, size: 15 }
    )
    s +=
      button(60, H - 90, 220, 60, 'Take a hit', { size: 19, focus: true }) +
      button(300, H - 90, 220, 60, 'Inside ›', { size: 19 })
    s += statusLine(W)
    s += note(
      W - 470,
      70,
      440,
      [
        'Going out: the room slides away to the right and scales up past the camera; the city’s layers move forward at different speeds (parallax) until the railing is in front.',
        'The terminal sits on the railing. Each hit costs a health point: the notice pops in the corner and on the railing terminal, Minerva skeptical. Pink: it needs you.'
      ],
      { size: 12 }
    )
    return s
  },
  phone(W, H) {
    let s = city(0, 0, W, H - 200, { zoom: 1.6, seed: 23, adOffset: 1 })
    s += railing(W, H, H - 310, 46, W - 150, 0.78)
    s += vapor(150, 330, 1) + hand(130, 520, 0.8, { pose: 'hold', extra: vape(40, 30, 1.3) })
    s += notice(10, 52, W - 20, 'Health score 14 (−1)', 'Vape. Fourth today. I’m only counting.', {
      attention: true,
      state: 'skeptical',
      faceW: 70,
      size: 14
    })
    s +=
      button(16, H - 120, (W - 44) / 2, 56, 'Take a hit', { size: 17, focus: true }) +
      button(28 + (W - 44) / 2, H - 120, (W - 44) / 2, 56, 'Terminal', { size: 17 })
    s += button(16, H - 52, W - 32, 40, 'Inside ›', { size: 15, kind: 'quiet' })
    s += statusLine(W)
    return s
  }
}

// ---------------------------------------------------------------- 6. the Minerva console
const MAIL = [
  { from: 'Grid Utility', subject: 'Final notice: 3 cycles unpaid', tag: 'Overdue' },
  { from: 'Block 7 Housing', subject: 'Unit fee overdue: 2 cycles', tag: 'Overdue' },
  { from: 'Harlan & Voss Logistics', subject: 'Re: Application 44817', tag: 'Rejection' },
  { from: 'Talent Intake', subject: 'Your application was not reviewed', tag: 'Rejection' },
  { from: 'NutriLoan', subject: 'You’re pre-approved! 0% for 3 days', tag: '' },
  { from: 'Block 7 Security', subject: 'Incident report: 3 assaults, 0 arrests', tag: '' },
  { from: 'OxyPlus', subject: 'Your air could be better', tag: '' }
]
function mailRow(x, y, w, m, o = {}) {
  let s = rect(x, y, w, o.h ?? 62, {
    r: 10,
    fill: o.open ? '#221d30' : '#17141f',
    stroke: o.open ? C.lavender : 'none',
    sw: 1.5
  })
  const overdue = m.tag === 'Overdue'
  s +=
    text(x + 16, y + 26, m.from, { size: o.size ?? 15, weight: 600 }) +
    text(x + 16, y + 48, m.subject, { size: (o.size ?? 15) - 1, fill: C.text2 })
  if (m.tag) {
    const tw = m.tag.length * 7.5 + 18
    s += rect(x + w - tw - 12, y + 12, tw, 22, { r: 11, fill: 'none', stroke: overdue ? C.pink : C.text3, sw: 1.5 })
    s += text(x + w - tw / 2 - 12, y + 27, m.tag, {
      size: 12,
      anchor: 'middle',
      fill: overdue ? C.pinkLight : C.text2,
      weight: 600
    })
  }
  return s
}
const consoleMail = {
  id: '06a-console-mail',
  title: 'the Minerva console over the room: Mail, in Corp X’s skin',
  desktop(W, H) {
    const v = roomView(W, H)
    let s = v.world(room({ tv: 'X' })) + rect(0, 0, W, H, { fill: 'url(#scrim)' })
    const f = minervaConsole(60, 64, W - 120, H - 100, {
      corp: 'X',
      tab: 'Mail',
      badges: { Mail: 2 },
      state: 'talking',
      say: 'Two bills are overdue. One company said no, politely. Another didn’t read it.'
    })
    s += f.svg
    const c = f.content
    s +=
      text(c.x, c.y + 18, 'Mail', { size: 24, weight: 500, family: CORPS.X.headFont }) +
      text(c.x + 70, c.y + 18, '7 · 2 overdue', { size: 14, fill: C.text3 }) +
      draft(c.x + 190, c.y + 14)
    const lw = 360
    MAIL.forEach((m, i) => (s += mailRow(c.x, c.y + 40 + i * 70, lw, m, { open: i === 2, size: 14 })))
    const rx = c.x + lw + 24
    const rw = c.w - lw - 24
    s += rect(rx, c.y + 40, rw, 480, { r: 12, fill: '#0d0b15', stroke: C.border })
    s +=
      text(rx + 24, c.y + 80, 'Re: Application 44817', { size: 21, weight: 500, family: CORPS.X.headFont }) +
      text(rx + 24, c.y + 104, 'Harlan & Voss Logistics, a Corp X company', { size: 13, fill: C.text3 })
    let by = c.y + 150
    for (const line of [
      'Dear Applicant 7-2216,',
      'After careful review against 9,412 applicants, we have selected candidates whose qualifications more closely match the position.',
      'Your rights under this decision are set out in Annex C. You may appeal within 3 days, at your own cost.'
    ]) {
      const p = para(rx + 24, by, line, { size: 15, width: rw - 48, family: CORPS.X.headFont, fill: C.text2 })
      s += p.svg
      by += p.height + 12
    }
    s +=
      button(rx + 24, c.y + 450, 140, 46, 'Delete', { size: 15 }) +
      button(rx + 180, c.y + 450, 140, 46, 'Next ›', { size: 15 })
    s += statusLine(W)
    return s
  },
  phone(W, H) {
    let s = rect(0, 0, W, H, { fill: C.black })
    const f = minervaConsole(0, 44, W, H - 44, {
      corp: 'X',
      phone: true,
      tab: 'Mail',
      badges: { Mail: 2 },
      state: 'talking',
      say: 'Two bills are overdue. One company said no, politely.'
    })
    s += f.svg
    const c = f.content
    MAIL.slice(0, 6).forEach((m, i) => (s += mailRow(c.x, c.y + i * 72, c.w, m, { size: 14, h: 62, open: i === 0 })))
    s += draft(c.x + c.w - 50, c.y - 6)
    s += statusLine(W)
    return s
  }
}
const consoleAccount = {
  id: '06b-console-account',
  title: 'the console in another skin: Account and Health, in Corp Z’s',
  desktop(W, H) {
    const v = roomView(W, H)
    let s = v.world(room({ tv: 'Z' })) + rect(0, 0, W, H, { fill: 'url(#scrim)' })
    const f = minervaConsole(60, 64, W - 120, H - 100, {
      corp: 'Z',
      tab: 'Account',
      badges: { Mail: 2 },
      focusTab: true,
      state: 'skeptical',
      say: 'You owe 45. The stipend comes in 6 days. The bills come first.'
    })
    s += f.svg
    const c = f.content
    s +=
      text(c.x, c.y + 16, CORPS.Z.greeting, { size: 16, fill: CORPS.Z.color, family: MONO }) +
      draft(c.x + 360, c.y + 12)
    const half = (c.w - 20) / 2
    s += rect(c.x, c.y + 36, half, 200, { r: 14, fill: '#0d0b15', stroke: C.border })
    s +=
      text(c.x + 22, c.y + 74, 'Balance', { size: 15, fill: C.text2 }) +
      text(c.x + 22, c.y + 150, '−45¢', { size: 68, weight: 500, fill: C.pinkLight }) +
      text(c.x + 22, c.y + 200, 'Owed. Stipend in 6 days.', { size: 14, fill: C.text2 })
    const rx = c.x + half + 20
    s +=
      rect(rx, c.y + 36, half, 200, { r: 14, fill: '#0d0b15', stroke: C.border }) +
      text(rx + 22, c.y + 74, 'This cycle', { size: 15, fill: C.text2 })
    ;[
      ['Stipend, through Minerva', '+600'],
      ['Unit fee', '−420'],
      ['Grid', '−95'],
      ['Nutrition', '−130']
    ].forEach(
      ([k, val], i) =>
        (s +=
          text(rx + 22, c.y + 110 + i * 28, k, { size: 15 }) +
          text(rx + half - 22, c.y + 110 + i * 28, val, { size: 15, anchor: 'end', family: MONO }))
    )
    s += rect(c.x, c.y + 256, c.w, 160, { r: 14, fill: '#0d0b15', stroke: C.border })
    s +=
      text(c.x + 22, c.y + 292, 'Health score', { size: 15, fill: C.text2 }) +
      text(c.x + 22, c.y + 352, '14', { size: 56, weight: 500, fill: C.pinkLight }) +
      text(c.x + 94, c.y + 352, '/ 100', { size: 18, fill: C.text3 })
    s +=
      rect(c.x + 190, c.y + 324, c.w - 220, 16, { r: 8, fill: '#1a1726' }) +
      rect(c.x + 190, c.y + 324, (c.w - 220) * 0.14, 16, { r: 8, fill: C.pink })
    s += text(c.x + 190, c.y + 370, 'Vape −4 today · Sleep −2 · Air quality −1', { size: 14, fill: C.text2 })
    s += note(
      c.x,
      c.y + 440,
      c.w,
      [
        'Same console as 06a in Corp Z’s skin: the band, logo, monospace greeting. Minerva’s face and words read the same under every skin. Owed money and the low score are pink; the costs are plain text.'
      ],
      { size: 12 }
    )
    s += statusLine(W)
    return s
  },
  phone(W, H) {
    let s = rect(0, 0, W, H, { fill: C.black })
    const f = minervaConsole(0, 44, W, H - 44, {
      corp: 'Z',
      phone: true,
      tab: 'Account',
      badges: { Mail: 2 },
      state: 'skeptical',
      say: 'You owe 45. The stipend comes in 6 days. The bills come first.'
    })
    s += f.svg
    const c = f.content
    s += text(c.x, c.y + 6, CORPS.Z.greeting, { size: 13, fill: CORPS.Z.color, family: MONO })
    s +=
      rect(c.x, c.y + 20, c.w, 130, { r: 14, fill: '#0d0b15', stroke: C.border }) +
      text(c.x + 18, c.y + 48, 'Balance', { size: 14, fill: C.text2 }) +
      text(c.x + 18, c.y + 110, '−45¢', { size: 52, weight: 500, fill: C.pinkLight }) +
      text(c.x + 18, c.y + 138, 'Owed. Stipend in 6 days.', { size: 13, fill: C.text2 })
    s += rect(c.x, c.y + 162, c.w, 132, { r: 14, fill: '#0d0b15', stroke: C.border })
    ;[
      ['Stipend', '+600'],
      ['Unit fee', '−420'],
      ['Grid', '−95'],
      ['Nutrition', '−130']
    ].forEach(
      ([k, val], i) =>
        (s +=
          text(c.x + 18, c.y + 192 + i * 28, k, { size: 14 }) +
          text(c.x + c.w - 18, c.y + 192 + i * 28, val, { size: 14, anchor: 'end', family: MONO }))
    )
    s +=
      rect(c.x, c.y + 306, c.w, 76, { r: 14, fill: '#0d0b15', stroke: C.border }) +
      text(c.x + 18, c.y + 334, 'Health score', { size: 14, fill: C.text2 }) +
      text(c.x + c.w - 18, c.y + 334, '14 / 100', { size: 15, anchor: 'end', fill: C.pinkLight, weight: 600 })
    s +=
      rect(c.x + 18, c.y + 350, c.w - 36, 12, { r: 6, fill: '#1a1726' }) +
      rect(c.x + 18, c.y + 350, (c.w - 36) * 0.14, 12, { r: 6, fill: C.pink })
    s += statusLine(W)
    return s
  }
}

// ---------------------------------------------------------------- 7. the job, the ship's name, the escort
const jobTerms = [
  ['Your body', 'is frozen and kept in cold storage, to be bought back one day.'],
  ['Your mind', 'is uploaded to Minerva. You fly a ship; she flies with you.'],
  ['Your name', 'out there is a call sign: the one on file.'],
  ['The work', 'Space shipping: trade, explore, claim the worlds you find.'],
  ['The terms', 'Keep most of what you earn. The program advances a hold of goods.'],
  ['And', 'citizenship of Corp Y, from the day you’re processed.']
]
const job = {
  id: '07a-job',
  title: 'the job board’s one eligible opening: the pilot program',
  desktop(W, H) {
    const v = roomView(W, H)
    let s = v.world(room({ tv: 'Y' })) + rect(0, 0, W, H, { fill: 'url(#scrim)' })
    const f = minervaConsole(60, 64, W - 120, H - 100, {
      corp: 'Y',
      tab: 'Jobs',
      badges: { Mail: 2 },
      state: 'listening',
      say: 'One opening you qualify for. Read all of it before you sign.'
    })
    s += f.svg
    const c = f.content
    const lw = 270
    s += text(c.x, c.y + 18, 'Corp Y job board', { size: 19, weight: 500 }) + draft(c.x + 180, c.y + 14)
    s +=
      rect(c.x - 4, c.y + 36, lw + 8, 88, { r: 14, stroke: C.brand300, sw: 2.5 }) +
      rect(c.x, c.y + 40, lw, 80, { r: 12, fill: '#221d30', stroke: C.yellow, sw: 2 })
    s +=
      text(c.x + 16, c.y + 70, 'Pilot · Orbiter 8', { size: 17, weight: 600 }) +
      `<circle cx="${c.x + 23}" cy="${c.y + 96}" r="5" fill="${C.yellow}"/>` +
      text(c.x + 36, c.y + 101, 'You’re eligible', { size: 13, fill: C.yellowLight, weight: 600 })
    ;['Warehouse picker', 'Debt collector', 'Clinical trial', 'Security, night', 'Courier'].forEach((name, i) => {
      s +=
        rect(c.x, c.y + 136 + i * 60, lw, 52, { r: 10, fill: '#14111c' }) +
        text(c.x + 16, c.y + 159 + i * 60, name, { size: 14, fill: C.text3 }) +
        text(c.x + 16, c.y + 177 + i * 60, 'Requires citizenship', { size: 11, fill: C.text3 })
    })
    const rx = c.x + lw + 24
    const rw = c.w - lw - 24
    s += rect(rx, c.y, rw, 620, { r: 14, fill: '#0d0b15', stroke: C.border })
    s += ship(rx + rw - 70, c.y + 70, 90, 'none', { stroke: C.yellow, sw: 110, rotate: 30 })
    s +=
      text(rx + 24, c.y + 46, 'Pilot, Orbiter 8 program', { size: 26, weight: 500 }) +
      text(rx + 24, c.y + 72, 'Corp Y Shipping · one opening · starts tonight', { size: 14, fill: C.text2 }) +
      draft(rx + 24, c.y + 100)
    s += para(rx + 24, c.y + 136, 'A new life, out there. We’ll be honest about what it takes.', {
      size: 18,
      width: rw - 48
    }).svg
    jobTerms.forEach(([k, val], i) => {
      s += text(rx + 24, c.y + 196 + i * 46, k, { size: 14, fill: C.text3, weight: 600 })
      s += para(rx + 130, c.y + 196 + i * 46, val, { size: 15, width: rw - 150 }).svg
    })
    s +=
      button(rx + 24, c.y + 494, 260, 62, 'Accept the job', { kind: 'primary', size: 21, focus: true }) +
      button(rx + 300, c.y + 494, 150, 62, 'Not yet', { kind: 'quiet', size: 17 })
    s += text(rx + 24, c.y + 590, 'Accepting is the only way out (or back to the title).', { size: 13, fill: C.text3 })
    s += statusLine(W)
    return s
  },
  phone(W, H) {
    let s = rect(0, 0, W, H, { fill: C.black })
    const f = minervaConsole(0, 44, W, H - 44, {
      corp: 'Y',
      phone: true,
      tab: 'Jobs',
      badges: { Mail: 2 },
      state: 'listening',
      say: 'One opening you qualify for. Read all of it.'
    })
    s += f.svg
    const c = f.content
    s += ship(c.x + c.w - 30, c.y + 18, 50, 'none', { stroke: C.yellow, sw: 130, rotate: 30 })
    s +=
      text(c.x, c.y + 8, 'Pilot, Orbiter 8 program', { size: 19, weight: 500 }) +
      `<circle cx="${c.x + 6}" cy="${c.y + 30}" r="5" fill="${C.yellow}"/>` +
      text(c.x + 18, c.y + 35, 'You’re eligible · Corp Y Shipping', { size: 13, fill: C.yellowLight })
    let ty = c.y + 66
    for (const [k, val] of jobTerms) {
      s += text(c.x, ty, k, { size: 12, fill: C.text3, weight: 600 })
      const p = para(c.x, ty + 18, val, { size: 14, width: c.w })
      s += p.svg
      ty += 18 + p.height + 8
    }
    s += draft(c.x + c.w - 50, c.y + 60)
    s += button(c.x, H - 160, c.w, 58, 'Accept the job', { kind: 'primary', size: 19, focus: true })
    s += statusLine(W)
    return s
  }
}
const shipName = {
  id: '07b-ship-name',
  title: 'naming your ship before pickup (the second transaction)',
  desktop(W, H) {
    const v = roomView(W, H)
    let s = v.world(room({ tv: 'Y' })) + rect(0, 0, W, H, { fill: 'url(#scrim)' })
    const f = minervaConsole(60, 64, W - 120, H - 100, {
      corp: 'Y',
      tab: 'Jobs',
      badges: { Mail: 2 },
      state: 'listening',
      say: 'Name your ship. It’s registered with me before pickup.'
    })
    s += f.svg
    const c = f.content
    const mx = c.x + c.w / 2
    s +=
      `<circle cx="${mx}" cy="${c.y + 150}" r="140" fill="url(#light)"/>` +
      ship(mx, c.y + 150, 210, 'none', { stroke: C.yellow, sw: 50 })
    s += text(mx, c.y + 310, 'Name your ship', { size: 28, weight: 500, anchor: 'middle' }) + draft(mx + 140, c.y + 306)
    s += rect(mx - 250, c.y + 336, 500, 64, { r: 14, fill: '#120f1c', stroke: C.yellow, sw: 2.5 })
    s +=
      text(mx - 226, c.y + 379, 'Second Chance', { size: 27, fill: C.yellowLight }) +
      rect(mx - 40, c.y + 354, 2.5, 30, { fill: C.yellowLight })
    s += button(mx - 250, c.y + 424, 500, 64, 'Sign and name her', { kind: 'primary', size: 21, focus: true })
    s += text(mx, c.y + 520, 'Your wallet signs: the ship is made, and you join Corp Y.', {
      size: 14,
      fill: C.text3,
      anchor: 'middle'
    })
    s += statusLine(W)
    return s
  },
  phone(W, H) {
    let s = rect(0, 0, W, H, { fill: C.black })
    const f = minervaConsole(0, 44, W, H - 44, {
      corp: 'Y',
      phone: true,
      tab: 'Jobs',
      badges: { Mail: 2 },
      state: 'listening',
      say: 'Name your ship. It’s registered with me before pickup.'
    })
    s += f.svg
    const c = f.content
    s += ship(c.x + c.w / 2, c.y + 60, 110, 'none', { stroke: C.yellow, sw: 80 })
    s +=
      rect(c.x, c.y + 140, c.w, 54, { r: 12, fill: '#120f1c', stroke: C.yellow, sw: 2.5 }) +
      text(c.x + 18, c.y + 176, 'Second Chance', { size: 21, fill: C.yellowLight })
    s += button(c.x, c.y + 210, c.w, 56, 'Sign and name her', { kind: 'primary', size: 18, focus: true })
    s += rect(0, H - 250, W, 250, { fill: '#1c1a24' })
    ;['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'].forEach((row, r) => {
      const off = (W - row.length * 38) / 2
      ;[...row].forEach(
        (ch, i) =>
          (s +=
            rect(off + i * 38, H - 236 + r * 52, 34, 44, { r: 6, fill: '#34313f' }) +
            text(off + i * 38 + 17, H - 206 + r * 52, ch, { size: 18, anchor: 'middle' }))
      )
    })
    s += statusLine(W)
    return s
  }
}
function escortMap(x, y, w, h) {
  let s = rect(x, y, w, h, { r: 12, fill: '#0a0910', stroke: C.border })
  for (let gx = x + 30; gx < x + w; gx += 60) s += rect(gx, y + 8, 14, h - 16, { fill: '#16131f' })
  for (let gy = y + 30; gy < y + h; gy += 56) s += rect(x + 8, gy, w - 16, 12, { fill: '#16131f' })
  s += `<path d="M${x + 37} ${y + h - 20} L${x + 37} ${y + 148} L${x + w - 143} ${y + 148} L${x + w - 143} ${y + 36}" fill="none" stroke="${C.brand300}" stroke-width="4" stroke-dasharray="2 10" stroke-linecap="round"/>`
  s += `<path d="M${x + 37} ${y + h - 20} L${x + 37} ${y + 148} L${x + w * 0.45} ${y + 148}" fill="none" stroke="${C.brand300}" stroke-width="4"/>`
  s += rect(x + w * 0.45 - 12, y + 140, 24, 16, { r: 4, fill: C.lavenderLight })
  s +=
    rect(x + w - 160, y + 14, 34, 34, { r: 4, fill: '#221d30', stroke: C.lavender, sw: 2 }) +
    text(x + w - 143, y + 64, 'Block 7', { size: 12, anchor: 'middle', fill: C.text2 })
  return s
}
const escort = {
  id: '07c-escort',
  title: 'waiting for the escort while the second transaction goes through',
  desktop(W, H) {
    const v = roomView(W, H)
    let s = v.world(room({ tv: 'Y' })) + rect(0, 0, W, H, { fill: 'url(#scrim)' })
    const f = minervaConsole(60, 64, W - 120, H - 100, {
      corp: 'Y',
      tab: 'Jobs',
      badges: { Mail: 2 },
      state: 'thinking',
      say: 'Application filed. An escort will arrive shortly to take you to processing.'
    })
    s += f.svg
    const c = f.content
    s += text(c.x, c.y + 20, 'Pickup', { size: 24, weight: 500 }) + draft(c.x + 100, c.y + 16)
    s += steps(
      c.x + 10,
      c.y + 70,
      c.w - 20,
      [
        ['Signed', 'done'],
        ['Ship registered: Second Chance', 'now'],
        ['Escort at your door', 'next']
      ],
      { size: 15 }
    )
    s += escortMap(c.x, c.y + 130, 560, 330)
    s +=
      rect(c.x + 580, c.y + 130, c.w - 580, 330, { r: 12, fill: '#0d0b15', stroke: C.border }) +
      text(c.x + 600, c.y + 168, 'While you wait', { size: 15, fill: C.text2 })
    ;[
      'Nothing to pack. They take the body as it is.',
      'Your debts and your name go with you.',
      'The door unlocks when they arrive. Curfew doesn’t apply to them.'
    ].forEach((t, i) => (s += para(c.x + 600, c.y + 204 + i * 72, t, { size: 15, width: c.w - 620 }).svg))
    s += note(
      c.x,
      c.y + 490,
      c.w,
      [
        'The wait is the escort’s car crossing the block, in step with the chain (signed, registered, at your door), and Minerva thinking. When the block lands the door’s light turns and the screen fades through white: processing, left unsaid.'
      ],
      { size: 12 }
    )
    s += statusLine(W, { skip: false })
    return s
  },
  phone(W, H) {
    let s = rect(0, 0, W, H, { fill: C.black })
    const f = minervaConsole(0, 44, W, H - 44, {
      corp: 'Y',
      phone: true,
      tab: 'Jobs',
      badges: { Mail: 2 },
      state: 'thinking',
      say: 'Filed. An escort will arrive shortly to take you to processing.'
    })
    s += f.svg
    const c = f.content
    s += steps(
      c.x,
      c.y + 14,
      c.w,
      [
        ['Signed', 'done'],
        ['Ship', 'now'],
        ['Escort', 'next']
      ],
      { size: 13 }
    )
    s += escortMap(c.x, c.y + 70, c.w, 300) + draft(c.x + c.w - 50, c.y + 392)
    s += statusLine(W, { skip: false })
    return s
  }
}

// ---------------------------------------------------------------- 8. waking in orbit
const FIRST =
  'You’re awake. This is your ship, the Second Chance, in orbit over Earth. Your body is in storage. Your mind is here, with me. You owe the pilot program 45 credits. The hold carries the program’s advance: Helium-3 and Electronics. Sell them at the I.S.S., clear the debt, then go find a star nobody has. That’s the job.'
function stars(W, H, n) {
  const r = (i) => ((i * 9301 + 49297) % 233280) / 233280
  return Array.from(
    { length: n },
    (_, i) =>
      `<circle cx="${r(i) * W}" cy="${r(i + 999) * H}" r="${r(i + 77) * 1.4 + 0.3}" fill="#e6dcf5" opacity="${0.3 + r(i + 5) * 0.5}"/>`
  ).join('')
}
function hudHints(W, phone) {
  let s = rect(phone ? 10 : 20, phone ? 54 : 20, phone ? 150 : 250, phone ? 50 : 76, {
    r: 12,
    fill: '#12052acc',
    stroke: '#ffffff30'
  })
  s +=
    text(phone ? 22 : 36, phone ? 76 : 50, 'Rhea Okafor', { size: phone ? 13 : 16, weight: 600, fill: C.yellowLight }) +
    text(phone ? 22 : 36, phone ? 94 : 74, '−45¢ · Corp Y', { size: phone ? 12 : 14, fill: C.pinkLight })
  return (
    s +
    `<circle cx="${phone ? W - 40 : W - 70}" cy="${phone ? 80 : 70}" r="${phone ? 24 : 44}" fill="#12052acc" stroke="#ffffff30"/>` +
    text(phone ? W - 40 : W - 70, phone ? 84 : 75, 'Sol', { size: phone ? 12 : 14, anchor: 'middle', fill: C.text2 })
  )
}
const wake = {
  id: '08-wake-in-orbit',
  title: 'waking in your ship over Earth, with Minerva’s first message',
  desktop(W, H) {
    let s = rect(0, 0, W, H, { fill: C.space }) + stars(W, H, 160) + earth(330, 560, 420)
    s += `<ellipse cx="330" cy="560" rx="560" ry="200" fill="none" stroke="${C.orbit}" stroke-width="1.5" stroke-dasharray="4 8" transform="rotate(-12 330 560)"/>`
    s +=
      ship(880, 330, 90, '#ffffff', { rotate: 70 }) +
      `<circle cx="880" cy="330" r="66" fill="none" stroke="${C.yellow}" stroke-width="2"/>` +
      text(880, 422, 'Second Chance', { size: 16, anchor: 'middle', fill: C.yellowLight, weight: 600 })
    s += hudHints(W, false)
    // Minerva's first message, sliding up like every menu: her face beside her words
    const mx = 560
    const my = 500
    const mw = 820
    s += rect(mx, my, mw, 360, { r: 18, fill: '#120f1cf2', stroke: C.border, sw: 1.5 })
    s +=
      rect(mx + 1, my + 1, mw - 2, 40, { r: 17, fill: CORPS.Y.band }) +
      rect(mx, my + 40, mw, 2, { fill: CORPS.Y.color, opacity: 0.8 }) +
      corpLogo('Y', mx + 26, my + 21, 20) +
      text(mx + 46, my + 26, 'Minerva · aboard the Second Chance', { size: 13, fill: C.text2 })
    s +=
      face(mx + 140, my + 150, 220, 'talking') +
      text(mx + 140, my + 248, 'MINERVA', { size: 12, ls: 4, anchor: 'middle', fill: C.text3, weight: 700 }) +
      faceTag(mx + 140, my + 280, tagOf('talking'))
    s += para(mx + 280, my + 82, FIRST, { size: 17, width: mw - 310, lh: 25 }).svg + draft(mx + mw - 64, my + 70)
    s +=
      button(mx + 280, my + 280, 220, 54, 'Understood', { kind: 'primary', size: 19, focus: true }) +
      button(mx + 516, my + 280, 210, 54, 'Show me the I.S.S.', { size: 16 })
    s += note(
      20,
      H - 120,
      470,
      [
        'Processing is a fade through white; the ship fades in already in orbit. Minerva speaks first, face and all, then the HUD arrives (not drawn). Your ship is white like every ship; yellow marks it as yours.'
      ],
      { size: 12 }
    )
    return s
  },
  phone(W, H) {
    let s = rect(0, 0, W, H, { fill: C.space }) + stars(W, H, 70) + earth(110, 300, 170)
    s +=
      ship(300, 180, 54, '#ffffff', { rotate: 70 }) +
      `<circle cx="300" cy="180" r="40" fill="none" stroke="${C.yellow}" stroke-width="2"/>` +
      text(300, 238, 'Second Chance', { size: 13, anchor: 'middle', fill: C.yellowLight, weight: 600 })
    s += hudHints(W, true)
    const my = 420
    s += rect(0, my, W, H - my, { r: 18, fill: '#120f1cf2', stroke: C.border, sw: 1.5 })
    s += face(W / 2, my + 64, 150, 'talking') + faceTag(W / 2, my + 132, tagOf('talking'))
    s += para(18, my + 164, FIRST, { size: 14, width: W - 36, lh: 20 }).svg
    s += button(18, H - 72, W - 36, 54, 'Understood', { kind: 'primary', size: 18, focus: true })
    return s
  }
}

export const SCREENS = [
  dark,
  scannerName,
  scannerWait,
  lightsOn,
  door,
  firstBoot,
  switching,
  tvMoment('X'),
  tvMoment('Y'),
  tvMoment('Z'),
  balcony,
  consoleMail,
  consoleAccount,
  job,
  shipName,
  escort,
  wake
]
