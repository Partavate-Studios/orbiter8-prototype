// The intro mockup's screens: each moment as a desktop and a phone layout. Copy marked "draft" is
// placeholder in the right voice (the brief: the words are on Koda's to-do list).

import {
  C,
  CORPS,
  HOTSPOTS,
  MONO,
  ROOM,
  button,
  city,
  consoleFrame,
  corpLogo,
  draft,
  earth,
  focusRing,
  hand,
  label,
  note,
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
  const world = (svg) => `<g transform="translate(${tx} ${ty}) scale(${k})">${svg}</g>`
  return { k, tx, ty, world, at: (x, y) => [tx + x * k, ty + y * k] }
}
const dim = (W, H, opacity = 0.55) => rect(0, 0, W, H, { fill: '#0b0916', opacity })

/** Phone: the room's things as big round buttons along the bottom (reachable by thumb and by focus). */
function phoneStrip(W, H, focused) {
  const items = [
    ['door', 'Door'],
    ['tv', 'TV'],
    ['terminal', 'Terminal'],
    ['balcony', 'Balcony']
  ]
  let s = rect(0, H - 128, W, 128, { fill: '#0b0916', opacity: 0.88 }) + rect(0, H - 128, W, 1, { fill: C.border })
  const step = W / items.length
  items.forEach(([key, name], i) => {
    const cx = step * i + step / 2
    const cy = H - 80
    const on = key === focused
    if (on) s += `<circle cx="${cx}" cy="${cy}" r="35" fill="none" stroke="${C.brand300}" stroke-width="2.5"/>`
    s += `<circle cx="${cx}" cy="${cy}" r="29" fill="${on ? C.lavender : C.button}" stroke="#ffffff55" stroke-width="1.2"/>`
    s += stripIcon(key, cx, cy, on ? '#1c0838' : '#ffffff')
    s += text(cx, H - 22, name, {
      size: 13,
      anchor: 'middle',
      fill: on ? C.text : C.text2
    })
  })
  return s
}
function stripIcon(key, cx, cy, c) {
  if (key === 'door')
    return (
      rect(cx - 9, cy - 15, 18, 30, { r: 2, stroke: c, sw: 2.5 }) +
      `<circle cx="${cx + 4}" cy="${cy + 2}" r="2" fill="${c}"/>`
    )
  if (key === 'tv')
    return (
      rect(cx - 15, cy - 11, 30, 20, { r: 3, stroke: c, sw: 2.5 }) +
      `<path d="M${cx - 7} ${cy + 15} l14 0" stroke="${c}" stroke-width="2.5"/>`
    )
  if (key === 'terminal') return owl(cx, cy, 34, c, { eyes: false })
  return `<path d="M${cx - 15} ${cy - 4} l30 0 M${cx - 15} ${cy - 4} l0 18 M${cx - 5} ${cy - 4} l0 18 M${cx + 5} ${cy - 4} l0 18 M${cx + 15} ${cy - 4} l0 18" stroke="${c}" stroke-width="2.5" fill="none"/><circle cx="${cx + 8}" cy="${cy - 13}" r="3" fill="${c}"/>`
}
const panArrows = (W, H) =>
  [
    [18, '‹'],
    [W - 18, '›']
  ]
    .map(
      ([x, g]) =>
        `<circle cx="${x}" cy="${H * 0.45}" r="16" fill="#0b0916aa" stroke="#ffffff40"/>` +
        text(x, H * 0.45 + 8, g, { size: 24, anchor: 'middle', fill: C.text2 })
    )
    .join('')

/** A Minerva notice: her owl and a short line. `attention` frames it in pink (it needs you). */
function notice(x, y, w, title, body, o = {}) {
  const lines = para(0, 0, body, {
    size: o.size ?? 14,
    chars: Math.floor((w - 70) / ((o.size ?? 14) * 0.52))
  })
  const h = 46 + lines.height
  let s = rect(x, y, w, h, {
    r: 12,
    fill: '#12052af2',
    stroke: o.attention ? C.pink : C.borderStrong,
    sw: o.attention ? 2 : 1.2
  })
  s += owl(x + 30, y + 26, 36, '#ffffff', { eyes: false })
  s += text(x + 58, y + 26, title, {
    size: (o.size ?? 14) + 1,
    weight: 700,
    fill: o.attention ? C.pinkLight : C.text
  })
  s += `<g transform="translate(${x + 58} ${y + 48})">${lines.svg.replaceAll('fill="#f1eefa"', `fill="${C.text2}"`)}</g>`
  if (o.draft !== false) s += draft(x + w - 52, y + 22)
  return s
}

// ---------------------------------------------------------------- 1. the apartment
const apartment = {
  id: '01-apartment',
  title: 'the apartment, with what’s interactive',
  desktop(W, H) {
    const v = roomView(W, H)
    let s = v.world(room({ tv: 'X' }))
    // focus rings on everything you can use; the TV has focus
    s += v.world(
      Object.entries(HOTSPOTS)
        .map(([key, h]) => focusRing(h.x, h.y, h.w, h.h, { focused: key === 'tv', sw: 3.5 }))
        .join('')
    )
    for (const [key, h] of Object.entries(HOTSPOTS)) {
      const [lx, ly] = v.at(h.x + h.w / 2, h.y - 14)
      s += label(lx, ly, key === 'door' ? 'Door · ID scanner' : h.label, {
        anchor: 'middle',
        focused: key === 'tv'
      })
    }
    // the hand points at the focused thing
    s += hand(...v.at(845, 662), 0.72)
    s += statusLine(W)
    // hints along the bottom
    s += rect(0, H - 44, W, 44, { fill: '#0b0916', opacity: 0.8 })
    s += text(24, H - 16, 'Click or tap a thing to use it · Tab, arrows or the D-pad move between things', {
      size: 14,
      fill: C.text2
    })
    s += padGlyph(W - 280, H - 22, 'A', 11) + text(W - 262, H - 17, 'Use', { size: 14, fill: C.text2 })
    s += padGlyph(W - 200, H - 22, 'B', 11) + text(W - 182, H - 17, 'Back', { size: 14, fill: C.text2 })
    s += padGlyph(W - 120, H - 22, '≡', 11) + text(W - 102, H - 17, 'Menu', { size: 14, fill: C.text2 })
    s += note(24, 64, 470, [
      'Mockup notes. Layers, back to front: the city (seen through the glass), the balcony, the room, the hand, and Minerva’s console when a terminal opens.',
      'Dashed rings: things you can use. The solid ring and the hand: what has focus (the TV).'
    ])
    return s
  },
  phone(W, H) {
    const v = roomView(W, H, { cx: 850 })
    let s = v.world(room({ tv: 'X' }))
    s += v.world(
      focusRing(HOTSPOTS.tv.x, HOTSPOTS.tv.y, HOTSPOTS.tv.w, HOTSPOTS.tv.h, {
        focused: true,
        sw: 4
      }) + focusRing(HOTSPOTS.terminal.x, HOTSPOTS.terminal.y, HOTSPOTS.terminal.w, HOTSPOTS.terminal.h, { sw: 4 })
    )
    s += label(...v.at(795, 470), 'TV', { anchor: 'middle', focused: true })
    s += label(...v.at(1022, 500), 'Terminal', { anchor: 'middle' })
    s += hand(...v.at(845, 664), 0.62)
    s += panArrows(W, H)
    s += statusLine(W)
    s += phoneStrip(W, H, 'tv')
    s += note(
      12,
      54,
      250,
      ['Swipe or ‹ › to look around the room. The strip reaches every thing by thumb, focus or gamepad.'],
      { size: 11 }
    )
    return s
  }
}

// ---------------------------------------------------------------- the door: the curfew, in your corporation's voice
function doorPanel(x, y, w, key, o = {}) {
  const corp = CORPS[key]
  const lines = para(0, 0, corp.curfew, {
    size: o.size ?? 17,
    chars: Math.floor((w - 48) / ((o.size ?? 17) * (corp.headFont === MONO ? 0.62 : 0.5))),
    family: corp.headFont
  })
  const h = 110 + lines.height
  let s = rect(x, y, w, h, {
    r: 14,
    fill: '#12052af2',
    stroke: o.on ? C.lavender : C.border,
    sw: o.on ? 2 : 1.2
  })
  s += rect(x, y, w, 6, { r: 3, fill: corp.color })
  s +=
    corpLogo(key, x + 34, y + 44, 30) +
    text(x + 62, y + 42, `${corp.name} · Curfew`, {
      size: 15,
      weight: 600,
      family: corp.headFont
    })
  s += text(x + 62, y + 62, o.on ? 'Your subscription' : 'If you were subscribed', { size: 12, fill: C.text3 })
  s += `<g transform="translate(${x + 24} ${y + 100})">${lines.svg}</g>`
  s += draft(x + w - 60, y + 40)
  return s
}
const door = {
  id: '01b-door-curfew',
  title: 'the door: the curfew warning, in your corporation’s voice',
  desktop(W, H) {
    const v = roomView(W, H)
    let s = v.world(room({ tv: 'Y' })) + dim(W, H, 0.6)
    s += v.world(
      focusRing(HOTSPOTS.door.x, HOTSPOTS.door.y, HOTSPOTS.door.w, HOTSPOTS.door.h, { focused: true, sw: 4 })
    )
    s += hand(...v.at(250, 560), 0.72)
    s += doorPanel(420, 110, 560, 'Y', { on: true, size: 21 })
    s += text(420, 420, 'The same moment under the other two:', {
      size: 15,
      fill: C.text2
    })
    s += doorPanel(420, 440, 470, 'X', { size: 15 })
    s += doorPanel(910, 440, 470, 'Z', { size: 15 })
    s += button(420, 330, 200, 52, 'OK', {
      kind: 'primary',
      size: 18,
      focus: true
    })
    s += statusLine(W)
    s += note(
      1010,
      110,
      400,
      [
        'The door stays locked; its panel speaks for your corporation (it enforces the curfew). Only the subscribed one shows in the game; the other two are here to compare voices.'
      ],
      { size: 12 }
    )
    return s
  },
  phone(W, H) {
    const v = roomView(W, H, { cx: 220 })
    let s = v.world(room({ tv: 'Y' })) + dim(W, H, 0.6)
    s += v.world(
      focusRing(HOTSPOTS.door.x, HOTSPOTS.door.y, HOTSPOTS.door.w, HOTSPOTS.door.h, { focused: true, sw: 4 })
    )
    s += doorPanel(16, 330, W - 32, 'Y', { on: true, size: 16 })
    s += button(16, 540, W - 32, 52, 'OK', {
      kind: 'primary',
      size: 18,
      focus: true
    })
    s += statusLine(W)
    s += phoneStrip(W, H, 'door')
    return s
  }
}

// ---------------------------------------------------------------- 2. the ID scanner and your name
/** The scanner's face, big: a lavender device screen, the card in the hand. */
function scannerDevice(x, y, w, h, inner) {
  let s = rect(x - 8, y - 8, w + 16, h + 16, { r: 30, fill: '#120d22' })
  s += rect(x, y, w, h, { r: 24, fill: '#251d40', stroke: '#5a4c8c', sw: 3 })
  s += rect(x + 20, y + 20, w - 40, h - 110, {
    r: 14,
    fill: '#130e24',
    stroke: '#3f3566',
    sw: 2
  })
  s += rect(x + w / 2 - 90, y + h - 70, 180, 14, { r: 7, fill: '#0b0916' })
  s += text(x + w / 2, y + h - 30, 'MINERVA · ID', {
    size: 13,
    anchor: 'middle',
    fill: C.text3,
    ls: 3,
    weight: 700
  })
  return s + inner(x + 20, y + 20, w - 40, h - 110)
}
function idCard(x, y, k = 1, o = {}) {
  return `<g transform="translate(${x} ${y}) rotate(${o.rotate ?? -8}) scale(${k})">${rect(0, 0, 190, 120, { r: 10, fill: '#d9d2ec', stroke: '#9088aa', sw: 2 })}${rect(14, 18, 50, 62, { r: 4, fill: '#9088aa' })}<circle cx="39" cy="40" r="12" fill="#d9d2ec"/>${rect(26, 56, 26, 20, { r: 8, fill: '#d9d2ec' })}${rect(78, 22, 90, 8, { fill: '#9088aa' })}${rect(78, 40, 70, 6, { fill: '#b5acd0' })}${rect(78, 54, 80, 6, { fill: '#b5acd0' })}${text(14, 104, 'NON-CITIZEN · STIPEND', { size: 10, fill: '#5a4c8c', weight: 700, family: MONO })}</g>`
}
const scannerName = {
  id: '02a-scanner-name',
  title: 'the ID scanner asks your name (the first transaction)',
  desktop(W, H) {
    const v = roomView(W, H)
    let s = v.world(room({ tv: 'X' })) + dim(W, H, 0.7)
    s += scannerDevice(480, 120, 480, 640, (x, y, w) => {
      let t = text(x + 28, y + 50, 'Card read.', { size: 30, weight: 500 })
      t += text(x + 28, y + 86, 'No name on file for this card.', {
        size: 18,
        fill: C.text2
      })
      t += text(x + 28, y + 150, 'Your name', { size: 15, fill: C.text2 })
      t += rect(x + 22, y + 164, w - 44, 64, {
        r: 12,
        fill: '#251d40',
        stroke: C.brand300,
        sw: 2.5
      })
      t +=
        text(x + 44, y + 206, 'Rhea Okafor', { size: 26 }) + rect(x + 196, y + 182, 2.5, 30, { fill: C.lavenderLight })
      t += text(x + 28, y + 258, 'Filed with Minerva. Pilot names are unique.', { size: 14, fill: C.text3 })
      t += draft(x + w - 70, y + 50)
      t += button(x + 22, y + 290, w - 44, 66, 'Register with Minerva', {
        kind: 'primary',
        size: 22,
        focus: true
      })
      t += text(x + w / 2, y + 390, 'Your wallet signs this: your first move on chain.', {
        size: 13,
        fill: C.text3,
        anchor: 'middle'
      })
      return t
    })
    s += idCard(330, 560, 1.2)
    s += hand(390, 820, 1.1, { pose: 'hold' })
    s += statusLine(W)
    s += note(1000, 140, 400, [
      'The prompt is the scanner’s own screen, not a web form: the room dims, the scanner comes forward.',
      'Typing: the device’s field takes the keyboard; on a phone the system keyboard opens; with a gamepad the A button opens the platform keyboard (Steam Deck) or an on-screen one.',
      'Enter or A registers; B or ✕ backs out to the room.'
    ])
    return s
  },
  phone(W, H) {
    const v = roomView(W, H, { cx: 260 })
    let s = v.world(room({ tv: 'X' })) + dim(W, H, 0.75)
    s += scannerDevice(24, 70, W - 48, 470, (x, y, w) => {
      let t = text(x + 18, y + 40, 'Card read.', { size: 24, weight: 500 })
      t += text(x + 18, y + 66, 'No name on file for this card.', {
        size: 14,
        fill: C.text2
      })
      t += draft(x + w - 60, y + 40)
      t += text(x + 18, y + 108, 'Your name', { size: 13, fill: C.text2 })
      t += rect(x + 14, y + 118, w - 28, 54, {
        r: 10,
        fill: '#251d40',
        stroke: C.brand300,
        sw: 2.5
      })
      t +=
        text(x + 30, y + 153, 'Rhea Okafor', { size: 21 }) + rect(x + 154, y + 134, 2.5, 24, { fill: C.lavenderLight })
      t += button(x + 14, y + 196, w - 28, 56, 'Register with Minerva', {
        kind: 'primary',
        size: 18,
        focus: true
      })
      t += text(x + w / 2, y + 282, 'Your wallet signs this.', {
        size: 12,
        fill: C.text3,
        anchor: 'middle'
      })
      return t
    })
    // the phone's keyboard comes up under it
    s += rect(0, H - 270, W, 270, { fill: '#26213a' })
    const rows = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM']
    rows.forEach((row, r) => {
      const kw = 34
      const off = (W - row.length * (kw + 4)) / 2
      ;[...row].forEach(
        (ch, i) =>
          (s +=
            rect(off + i * (kw + 4), H - 252 + r * 52, kw, 44, {
              r: 6,
              fill: '#4a4460'
            }) +
            text(off + i * (kw + 4) + kw / 2, H - 222 + r * 52, ch, {
              size: 18,
              anchor: 'middle'
            }))
      )
    })
    s += rect(80, H - 96, W - 160, 44, { r: 6, fill: '#4a4460' })
    s += statusLine(W)
    return s
  }
}

/** The three steps of a transaction, as a small row: done, now (pink while it waits on you), next. */
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
  title: 'the scanner while the first transaction goes through',
  desktop(W, H) {
    const v = roomView(W, H)
    let s = v.world(room({ tv: 'X' })) + dim(W, H, 0.7)
    s += scannerDevice(480, 120, 480, 640, (x, y, w) => {
      let t = text(x + 28, y + 50, 'Rhea Okafor', { size: 30, weight: 500 })
      t += text(x + 28, y + 86, 'Filing your name with Minerva.', {
        size: 18,
        fill: C.text2
      })
      // the card, being read: scan lines over a card outline
      t += rect(x + 100, y + 120, w - 200, 130, {
        r: 12,
        stroke: C.brand300,
        sw: 2
      })
      for (let i = 0; i < 6; i++)
        t += rect(x + 106, y + 134 + i * 20, w - 212, 3, {
          fill: C.brand300,
          opacity: 0.15 + (i === 3 ? 0.7 : 0)
        })
      t += steps(x + 28, y + 300, w - 40, [
        ['Card read', 'done'],
        ['Your signature', 'you'],
        ['Filed', 'next']
      ])
      t += rect(x + 22, y + 368, w - 44, 54, { r: 27, stroke: C.pink, sw: 2 })
      t += text(x + w / 2, y + 401, 'Confirm it in your wallet', {
        size: 18,
        anchor: 'middle',
        fill: C.pinkLight,
        weight: 500
      })
      return t
    })
    s += idCard(190, 600, 1.1, { rotate: -4 })
    s += hand(250, 860, 1.1, { pose: 'hold' })
    s += statusLine(W)
    s += note(1000, 140, 400, [
      'The wait is the card being read: a scan line sweeps it, in time with the chain.',
      'Three steps: card read, your signature (pink while it waits on you), filed. Once signed, the middle step turns lavender and the line keeps sweeping until the block lands (a few seconds), then “Name on file” and the unit powers up: lights, the TV, the terminal’s first boot.',
      'Nothing to click while it waits; after 30 s unanswered, a Try again button appears (ui-guide §3).'
    ])
    return s
  },
  phone(W, H) {
    const v = roomView(W, H, { cx: 260 })
    let s = v.world(room({ tv: 'X' })) + dim(W, H, 0.75)
    s += scannerDevice(24, 90, W - 48, 520, (x, y, w) => {
      let t = text(x + 18, y + 40, 'Rhea Okafor', { size: 24, weight: 500 })
      t += text(x + 18, y + 66, 'Filing your name with Minerva.', {
        size: 14,
        fill: C.text2
      })
      t += rect(x + 40, y + 92, w - 80, 100, {
        r: 10,
        stroke: C.brand300,
        sw: 2
      })
      for (let i = 0; i < 5; i++)
        t += rect(x + 46, y + 104 + i * 18, w - 92, 3, {
          fill: C.brand300,
          opacity: 0.15 + (i === 2 ? 0.7 : 0)
        })
      t += steps(
        x + 10,
        y + 232,
        w - 10,
        [
          ['Read', 'done'],
          ['Sign', 'you'],
          ['Filed', 'next']
        ],
        { size: 13 }
      )
      t += rect(x + 14, y + 300, w - 28, 50, { r: 25, stroke: C.pink, sw: 2 })
      t += text(x + w / 2, y + 331, 'Confirm in your wallet', {
        size: 16,
        anchor: 'middle',
        fill: C.pinkLight,
        weight: 500
      })
      return t
    })
    s += idCard(120, 660, 0.8, { rotate: 0 })
    s += hand(160, 860, 0.8, { pose: 'hold' })
    s += statusLine(W)
    return s
  }
}

// ---------------------------------------------------------------- 3. first boot: choosing a corporation
function corpCard(x, y, w, h, key, o = {}) {
  const corp = CORPS[key]
  let s = ''
  if (o.focus)
    s += rect(x - 6, y - 6, w + 12, h + 12, {
      r: 20,
      stroke: C.brand300,
      sw: 2.5
    })
  s += rect(x, y, w, h, {
    r: 16,
    fill: '#221a3d',
    stroke: o.focus ? C.lavender : C.border,
    sw: o.focus ? 2 : 1.2
  })
  s += rect(x, y, w, 8, { r: 4, fill: corp.color })
  if (o.compact) {
    s += corpLogo(key, x + 36, y + h / 2 + 4, 34)
    s += text(x + 70, y + 36, corp.name, {
      size: 19,
      weight: 600,
      family: corp.headFont
    })
    s += text(x + 70, y + 58, corp.kind, { size: 12, fill: C.text3 })
    const p = para(x + 70, y + 80, corp.feels, {
      size: 13,
      chars: Math.floor((w - 90) / 7),
      fill: C.text2,
      italic: true
    })
    s += p.svg
    return s
  }
  s += corpLogo(key, x + w / 2, y + 74, 64)
  s += text(x + w / 2, y + 146, corp.name, {
    size: 26,
    weight: 600,
    anchor: 'middle',
    family: corp.headFont
  })
  s += text(x + w / 2, y + 172, corp.kind, {
    size: 13,
    fill: C.text3,
    anchor: 'middle'
  })
  const p = para(x + 24, y + 214, corp.character, {
    size: 15,
    chars: Math.floor((w - 48) / 8),
    fill: C.text2
  })
  s += p.svg
  s += para(x + 24, y + 222 + p.height, corp.feels, {
    size: 15,
    chars: Math.floor((w - 48) / 8),
    italic: true
  }).svg
  s += draft(x + w - 60, y + 26)
  s += button(x + 24, y + h - 76, w - 48, 54, 'Subscribe', {
    kind: o.focus ? 'primary' : 'normal',
    size: 19
  })
  return s
}
const firstBoot = {
  id: '03a-first-boot',
  title: 'the housing computer’s first boot: choosing a corporation',
  desktop(W, H) {
    const v = roomView(W, H)
    let s = v.world(room({ tv: 'X' })) + rect(0, 0, W, H, { fill: 'url(#scrim)' })
    const f = consoleFrame(60, 64, W - 120, H - 100, {
      corp: null,
      tabs: false
    })
    s += f.svg
    const c = f.content
    s += text(c.x, c.y + 26, 'Choose a corporation to subscribe to.', {
      size: 28,
      weight: 500
    })
    s += text(
      c.x,
      c.y + 58,
      'Your unit, your job board and this console run through your corporation. Minerva works the same for everyone.',
      { size: 16, fill: C.text2 }
    )
    s += draft(c.x + c.w - 50, c.y + 22)
    const cw = (c.w - 40) / 3
    ;['X', 'Y', 'Z'].forEach(
      (key, i) =>
        (s += corpCard(c.x + i * (cw + 20), c.y + 96, cw, 440, key, {
          focus: key === 'Y'
        }))
    )
    s += rect(c.x, c.y + 562, c.w, 52, {
      r: 12,
      fill: '#140f27',
      stroke: C.border
    })
    s += text(
      c.x + 20,
      c.y + 594,
      'You can switch at any time, from Settings in this console. It’s free here, on Earth.',
      { size: 16, fill: C.text2 }
    )
    s += draft(c.x + c.w - 60, c.y + 590)
    s += statusLine(W, { skip: true })
    return s
  },
  phone(W, H) {
    let s = rect(0, 0, W, H, { fill: '#0b0916' })
    const f = consoleFrame(0, 44, W, H - 44, {
      corp: null,
      tabs: false,
      phone: true
    })
    s += f.svg
    const c = f.content
    s += para(c.x, c.y + 22, 'Choose a corporation to subscribe to.', {
      size: 21,
      chars: 28,
      weight: 500
    }).svg
    s += para(c.x, c.y + 80, 'Your unit, job board and this console run through it. Switch any time.', {
      size: 13,
      chars: 46,
      fill: C.text2
    }).svg
    s += draft(c.x + c.w - 50, c.y + 2)
    ;['X', 'Y', 'Z'].forEach(
      (key, i) =>
        (s += corpCard(c.x, c.y + 128 + i * 142, c.w, 128, key, {
          compact: true,
          focus: key === 'Y'
        }))
    )
    s += button(c.x, H - 90, c.w, 56, 'Subscribe to Corp Y', {
      kind: 'primary',
      size: 18
    })
    s += statusLine(W)
    return s
  }
}

/** A miniature of the console's header band in a corporation's skin, for the switching screen. */
function skinPreview(x, y, w, key, o = {}) {
  const corp = CORPS[key]
  const h = 150
  let s = rect(x, y, w, h, {
    r: 12,
    fill: '#1b1531',
    stroke: o.on ? C.lavender : C.border,
    sw: o.on ? 2 : 1
  })
  s +=
    rect(x, y, w, 52, {
      r: 12,
      fill: key === 'Z' ? 'url(#band-z)' : corp.band
    }) +
    rect(x, y + 40, w, 12, { fill: key === 'Z' ? '#0f3540' : corp.band }) +
    rect(x, y + 50, w, 3, { fill: corp.color })
  s +=
    owl(x + 28, y + 26, 34, '#ffffff', { eyes: false }) +
    text(x + 52, y + 24, 'MINERVA', { size: 12, weight: 700, ls: 2 }) +
    text(x + 52, y + 40, `via ${corp.name}`, {
      size: 10,
      fill: C.text2,
      family: corp.headFont
    })
  s += corpLogo(key, x + w - 24, y + 26, 22)
  s += para(x + 16, y + 80, corp.greeting, {
    size: 13,
    chars: Math.floor((w - 30) / 7),
    family: corp.headFont,
    fill: C.text
  }).svg
  s += text(x + 16, y + h - 16, o.on ? 'Subscribed' : 'Switch', {
    size: 13,
    fill: o.on ? C.lavender : C.brand300,
    weight: 600
  })
  return s
}
const switching = {
  id: '03b-switching',
  title: 'switching corporation later: what changes',
  desktop(W, H) {
    const v = roomView(W, H)
    let s = v.world(room({ tv: 'X' })) + rect(0, 0, W, H, { fill: 'url(#scrim)' })
    const f = consoleFrame(60, 64, W - 120, H - 100, {
      corp: 'Y',
      tab: null,
      subtitle: 'via Corp Y · Settings'
    })
    s += f.svg
    const c = f.content
    s += text(c.x, c.y + 26, 'Your corporation', { size: 28, weight: 500 })
    s += text(
      c.x,
      c.y + 58,
      'Switching changes this console’s look and voice, the news, and your job board. Minerva’s records stay the same.',
      { size: 15, fill: C.text2 }
    )
    s += draft(c.x + c.w - 50, c.y + 22)
    const pw = (c.w - 40) / 3
    ;['X', 'Y', 'Z'].forEach((key, i) => {
      if (key !== 'Y')
        s += rect(c.x + i * (pw + 20) - 5, c.y + 95, pw + 10, 160, {
          r: 15,
          stroke: key === 'Z' ? C.brand300 : 'none',
          sw: 2.5
        })
      s += skinPreview(c.x + i * (pw + 20), c.y + 100, pw, key, {
        on: key === 'Y'
      })
    })
    s += text(c.x, c.y + 310, 'What switching to Corp Z would mean', {
      size: 18,
      weight: 500
    })
    const lines = [
      ['Here, on Earth', 'Free. Your curfew, ads and job board become Corp Z’s.'],
      [
        'Later, as a pilot',
        'A fee, and maybe a wait before some benefits start. Your ports’ taxes, and the law over what you own, move with you.'
      ]
    ]
    lines.forEach(([k, val], i) => {
      s += text(c.x, c.y + 350 + i * 56, k, { size: 15, fill: C.text3 })
      s += para(c.x + 180, c.y + 350 + i * 56, val, {
        size: 15,
        chars: 90,
        fill: C.text2
      }).svg
    })
    s += button(c.x, c.y + 480, 300, 58, 'Switch to Corp Z', {
      kind: 'normal',
      size: 19,
      focus: true
    })
    s += button(c.x + 320, c.y + 480, 200, 58, 'Stay with Corp Y', {
      kind: 'quiet',
      size: 17
    })
    s += note(c.x + 600, c.y + 470, c.w - 600, [
      'The skin is the corporation’s layer over Minerva: a band color, logo, typeface and greeting. Her owl, layout and buttons never change.'
    ])
    s += statusLine(W)
    return s
  },
  phone(W, H) {
    let s = rect(0, 0, W, H, { fill: '#0b0916' })
    const f = consoleFrame(0, 44, W, H - 44, {
      corp: 'Y',
      phone: true,
      tab: null,
      badges: { Mail: 3 },
      subtitle: 'via Corp Y · Settings'
    })
    s += f.svg
    const c = f.content
    s += text(c.x, c.y + 22, 'Your corporation', { size: 21, weight: 500 })
    s += draft(c.x + c.w - 50, c.y + 20)
    s += skinPreview(c.x, c.y + 44, c.w, 'Y', { on: true })
    s += rect(c.x - 5, c.y + 205, c.w + 10, 160, {
      r: 15,
      stroke: C.brand300,
      sw: 2.5
    })
    s += skinPreview(c.x, c.y + 210, c.w, 'Z')
    s += para(c.x, c.y + 392, 'Free here on Earth. As a pilot: a fee, and your ports’ taxes and law move with you.', {
      size: 13,
      chars: 46,
      fill: C.text2
    }).svg
    s += button(c.x, c.y + 440, c.w, 54, 'Switch to Corp Z', { size: 18 })
    s += statusLine(W)
    return s
  }
}

// ---------------------------------------------------------------- 4. the TV
function tvMoment(key) {
  const corp = CORPS[key]
  return {
    id: `04${{ X: 'a', Y: 'b', Z: 'c' }[key]}-tv-${key.toLowerCase()}`,
    title: `the TV: a ${corp.name} ad`,
    desktop(W, H) {
      const v = roomView(W, H)
      let s = v.world(room({ tv: key })) + dim(W, H, 0.8)
      s += `<ellipse cx="${W / 2}" cy="${H / 2 - 20}" rx="620" ry="380" fill="url(#tv-glow)"/>`
      // the TV, close: bezel and screen
      s += rect(W / 2 - 480, 110, 960, 600, {
        r: 20,
        fill: '#07060f',
        stroke: '#4a3f75',
        sw: 6
      })
      s += `<svg x="${W / 2 - 468}" y="122" width="936" height="576" viewBox="0 0 468 288" preserveAspectRatio="xMidYMid slice">${tvAdArt(key)}</svg>`
      s += draft(W / 2 + 400, 150, { fill: '#000000aa' })
      // a ticker under the ad: Minerva's public notices run on every channel
      s += rect(W / 2 - 468, 664, 936, 34, { fill: '#000000b3' })
      s +=
        owl(W / 2 - 440, 681, 28, '#ffffff', { eyes: false }) +
        text(
          W / 2 - 416,
          687,
          'MINERVA PUBLIC NOTICE · Curfew 22:00–05:00 · Pilot program hiring, all three corporations',
          { size: 15, fill: C.text2, family: MONO }
        )
      s += rect(W / 2 - 60, 716, 120, 26, { fill: '#07060f' })
      // channel controls, as big buttons under the set
      s += button(W / 2 - 330, 770, 200, 56, '‹ Previous', { size: 18 })
      s += button(W / 2 - 100, 770, 200, 56, 'Next ad ›', {
        size: 18,
        focus: true
      })
      s += button(W / 2 + 130, 770, 200, 56, 'Turn off', {
        size: 18,
        kind: 'quiet'
      })
      s += text(W / 2, 860, `Ad ${{ X: 1, Y: 2, Z: 3 }[key]} of 3 · they cycle on their own every 8 s`, {
        size: 14,
        anchor: 'middle',
        fill: C.text3
      })
      s += statusLine(W)
      if (key === 'X')
        s += note(W / 2 + 350, 726, 370, [
          'Each corporation’s ad sells its business model, not a culture: X sells the contract, Y belonging, Z speed.',
          'The ads are the loudest color in the intro, on purpose (the loud world). The interface around them stays purple.'
        ])
      return s
    },
    phone(W, H) {
      let s = rect(0, 0, W, H, { fill: '#07060f' })
      s += `<ellipse cx="${W / 2}" cy="330" rx="300" ry="260" fill="url(#tv-glow)"/>`
      // the phone turns the TV sideways into a tall crop of the same ad
      s += rect(12, 120, W - 24, 420, {
        r: 14,
        fill: '#07060f',
        stroke: '#4a3f75',
        sw: 4
      })
      s += `<svg x="20" y="128" width="${W - 40}" height="404" viewBox="0 0 468 300" preserveAspectRatio="xMinYMid slice">${tvAdArt(key, { copy: false })}</svg>`
      s += `<g>${rect(20, 400, W - 40, 132, { fill: '#000000', opacity: 0.35 })}${text(40, 440, corp.ad.head, { size: 26, weight: 700, family: key === 'Z' ? MONO : corp.headFont })}${text(40, 472, corp.ad.head2, { size: 26, weight: 700, family: key === 'Z' ? MONO : corp.headFont })}${text(40, 504, corp.ad.sub, { size: 14, family: key === 'Z' ? MONO : corp.headFont, fill: '#ffffffd9' })}</g>`
      s += draft(W - 80, 150)
      s +=
        rect(20, 548, W - 40, 30, { fill: '#000000b3' }) +
        text(30, 568, 'MINERVA · Curfew 22:00–05:00 · Pilots hiring', {
          size: 12,
          fill: C.text2,
          family: MONO
        })
      s += button(20, 610, (W - 52) / 2, 54, '‹ Previous', { size: 16 })
      s += button(32 + (W - 52) / 2, 610, (W - 52) / 2, 54, 'Next ad ›', {
        size: 16,
        focus: true
      })
      s += button(20, 680, W - 40, 50, 'Turn off', { size: 16, kind: 'quiet' })
      s += text(W / 2, 760, `Ad ${{ X: 1, Y: 2, Z: 3 }[key]} of 3`, {
        size: 13,
        anchor: 'middle',
        fill: C.text3
      })
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
  return `<g transform="translate(${x} ${y}) rotate(-30) scale(${k})">${rect(-8, -60, 16, 70, { r: 6, fill: '#3f3566', stroke: '#5a4c8c', sw: 2 })}${rect(-5, -72, 10, 14, { r: 3, fill: '#5a4c8c' })}<circle cx="0" cy="-30" r="3" fill="${C.brand300}"/></g>`
}
const balcony = {
  id: '05-balcony',
  title: 'the balcony: the city, the vape, a health notice',
  desktop(W, H) {
    let s = city(0, 0, W, H - 120, { zoom: 2, seed: 23, adOffset: 1 })
    // the balcony floor and railing, in front
    s += rect(0, H - 130, W, 130, { fill: '#05040b' })
    s +=
      Array.from({ length: 30 }, (_, i) =>
        rect(i * 52 + 10, H - 290, 8, 170, {
          fill: '#0e0a1c',
          stroke: '#3f3566',
          sw: 1.5
        })
      ).join('') + rect(0, H - 304, W, 16, { fill: '#120d22', stroke: '#5a4c8c', sw: 2 })
    // the balcony's terminal, on a post, its screen showing the notice
    s +=
      rect(1150, 360, 150, 120, {
        r: 10,
        fill: '#120d22',
        stroke: '#5a4c8c',
        sw: 3
      }) +
      rect(1162, 372, 126, 82, { r: 4, fill: '#1b1531' }) +
      owl(1225, 400, 60, '#ffffffdd')
    s += text(1225, 446, 'HEALTH −1', {
      size: 13,
      anchor: 'middle',
      fill: C.pinkLight,
      weight: 700,
      family: MONO
    })
    s += rect(1215, 480, 20, H - 480, { fill: '#05040b' })
    s += focusRing(1135, 345, 180, 150, { sw: 3 }) + label(1225, 330, 'Terminal', { anchor: 'middle' })
    // the vape, in hand, and its cloud
    s += vapor(900, 430, 1.4)
    s += hand(820, 760, 1.2, { pose: 'hold', extra: vape(40, 30, 1.3) })
    // Minerva's notice: it needs you (pink frame), dry
    s += notice(
      70,
      90,
      520,
      'Health score 14 (−1)',
      'Vape. Fourth today. At this rate your score reaches zero in 14 days. I’m only counting.',
      { attention: true, size: 16 }
    )
    s += rect(0, 0, W, 0, {})
    // controls: take a hit, go back inside
    s += button(70, H - 100, 220, 60, 'Take a hit', { size: 19, focus: true })
    s += button(310, H - 100, 220, 60, '‹ Inside', { size: 19 })
    s += statusLine(W)
    s += note(W - 470, 70, 440, [
      'Going out: the room slides away and scales up past the camera, the city layers move forward at different speeds (parallax) until the railing is in front.',
      'Each hit costs a health point; the notice pops on the balcony terminal and in the corner. Pink: it needs you. The health score is flavor only and never appears after the intro.'
    ])
    return s
  },
  phone(W, H) {
    let s = city(0, 0, W, H - 140, { zoom: 1.6, seed: 23, adOffset: 1 })
    s += rect(0, H - 150, W, 150, { fill: '#05040b' })
    s +=
      Array.from({ length: 9 }, (_, i) =>
        rect(i * 46 + 6, H - 280, 7, 140, {
          fill: '#0e0a1c',
          stroke: '#3f3566',
          sw: 1.5
        })
      ).join('') + rect(0, H - 292, W, 14, { fill: '#120d22', stroke: '#5a4c8c', sw: 2 })
    s += vapor(250, 300, 1)
    s += hand(240, 500, 0.85, { pose: 'hold', extra: vape(40, 30, 1.3) })
    s += notice(12, 56, W - 24, 'Health score 14 (−1)', 'Vape. Fourth today. I’m only counting.', {
      attention: true,
      size: 14
    })
    s += button(16, H - 120, (W - 44) / 2, 56, 'Take a hit', {
      size: 17,
      focus: true
    })
    s += button(28 + (W - 44) / 2, H - 120, (W - 44) / 2, 56, 'Terminal', {
      size: 17
    })
    s += button(16, H - 52, W - 32, 40, '‹ Inside', {
      size: 15,
      kind: 'quiet'
    })
    s += statusLine(W)
    return s
  }
}

// ---------------------------------------------------------------- 6. the Minerva console
const MAIL = [
  {
    from: 'Grid Utility',
    subject: 'Final notice: 3 cycles unpaid',
    tag: 'Overdue'
  },
  {
    from: 'Block 7 Housing',
    subject: 'Unit fee overdue: 2 cycles',
    tag: 'Overdue'
  },
  {
    from: 'Harlan & Voss Logistics',
    subject: 'Re: Application 44817',
    tag: 'Rejection'
  },
  {
    from: 'Talent Intake',
    subject: 'Your application was not reviewed',
    tag: 'Rejection'
  },
  { from: 'NutriLoan', subject: 'You’re pre-approved! 0% for 3 days', tag: '' },
  { from: 'Minerva', subject: 'Stipend paid. Then spent.', tag: '' },
  { from: 'OxyPlus', subject: 'Your air could be better', tag: '' }
]
function mailRow(x, y, w, m, o = {}) {
  let s = rect(x, y, w, o.h ?? 62, {
    r: 10,
    fill: o.open ? '#302651' : '#221a3d',
    stroke: o.open ? C.lavender : 'none',
    sw: 1.5
  })
  const overdue = m.tag === 'Overdue'
  s += text(x + 16, y + 26, m.from, {
    size: o.size ?? 15,
    weight: 600,
    fill: m.from === 'Minerva' ? C.lavender : C.text
  })
  s += text(x + 16, y + 48, m.subject, {
    size: (o.size ?? 15) - 1,
    fill: C.text2
  })
  if (m.tag) {
    const tw = m.tag.length * 7.5 + 18
    s += rect(x + w - tw - 12, y + 12, tw, 22, {
      r: 11,
      fill: overdue ? 'none' : '#00000033',
      stroke: overdue ? C.pink : C.text3,
      sw: 1.5
    })
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
    const f = consoleFrame(60, 64, W - 120, H - 100, {
      corp: 'X',
      tab: 'Mail',
      badges: { Mail: 2 }
    })
    s += f.svg
    const c = f.content
    s += text(c.x, c.y + 20, 'Mail', {
      size: 26,
      weight: 500,
      family: CORPS.X.headFont
    })
    s += text(c.x + 90, c.y + 20, '7 messages · 2 overdue', {
      size: 15,
      fill: C.text3
    })
    s += draft(c.x + 300, c.y + 16)
    const lw = 420
    MAIL.forEach((m, i) => (s += mailRow(c.x, c.y + 44 + i * 70, lw, m, { open: i === 2 })))
    // the reading pane: a rejection, in Corp X's voice
    const rx = c.x + lw + 30
    const rw = c.w - lw - 30
    s += rect(rx, c.y + 44, rw, 480, {
      r: 12,
      fill: '#140f27',
      stroke: C.border
    })
    s += text(rx + 24, c.y + 84, 'Re: Application 44817', {
      size: 22,
      weight: 500,
      family: CORPS.X.headFont
    })
    s += text(rx + 24, c.y + 110, 'Harlan & Voss Logistics, a Corp X company', {
      size: 14,
      fill: C.text3
    })
    s += draft(rx + rw - 64, c.y + 80)
    const body = [
      'Dear Applicant 7-2216,',
      'After careful review against 9,412 applicants, we have selected candidates whose qualifications more closely match the position.',
      'Your rights under this decision are set out in Annex C. You may appeal within 3 days, at your own cost.',
      'We wish you success in your search.'
    ]
    let by = c.y + 156
    for (const line of body) {
      const p = para(rx + 24, by, line, {
        size: 16,
        chars: Math.floor((rw - 48) / 8.4),
        family: CORPS.X.headFont,
        fill: C.text2
      })
      s += p.svg
      by += p.height + 14
    }
    s += button(rx + 24, c.y + 456, 160, 48, 'Delete', { size: 16 })
    s += button(rx + 200, c.y + 456, 160, 48, 'Next ›', { size: 16 })
    s += statusLine(W)
    s += note(
      c.x + 470,
      H - 160,
      470,
      [
        'Near full screen; the room stays dim around it. Focus is held inside until ✕ or B closes it. Tabs: big buttons, keys 1–4. Overdue is pink (it needs you), with a word, never color alone.'
      ],
      { size: 12 }
    )
    return s
  },
  phone(W, H) {
    let s = rect(0, 0, W, H, { fill: '#0b0916' })
    const f = consoleFrame(0, 44, W, H - 44, {
      corp: 'X',
      phone: true,
      tab: 'Mail',
      badges: { Mail: 2 }
    })
    s += f.svg
    const c = f.content
    s += text(c.x, c.y + 20, 'Mail', {
      size: 22,
      weight: 500,
      family: CORPS.X.headFont
    })
    s += text(c.x + 66, c.y + 20, '7 · 2 overdue', { size: 13, fill: C.text3 })
    s += draft(c.x + c.w - 50, c.y + 18)
    MAIL.slice(0, 7).forEach(
      (m, i) =>
        (s += mailRow(c.x, c.y + 40 + i * 74, c.w, m, {
          size: 14,
          h: 64,
          open: i === 0
        }))
    )
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
    const f = consoleFrame(60, 64, W - 120, H - 100, {
      corp: 'Z',
      tab: 'Account',
      badges: { Mail: 2 },
      focusTab: true
    })
    s += f.svg
    const c = f.content
    s += text(c.x, c.y + 20, CORPS.Z.greeting, {
      size: 18,
      fill: CORPS.Z.color,
      family: MONO
    })
    s += draft(c.x + 420, c.y + 16)
    // the balance
    s += rect(c.x, c.y + 44, 430, 200, {
      r: 14,
      fill: '#140f27',
      stroke: C.border
    })
    s += text(c.x + 24, c.y + 84, 'Balance', { size: 16, fill: C.text2 })
    s += text(c.x + 24, c.y + 160, '−45¢', {
      size: 72,
      weight: 500,
      fill: C.pinkLight
    })
    s += text(c.x + 24, c.y + 210, 'Owed. The stipend comes in 6 days.', {
      size: 15,
      fill: C.text2
    })
    // where the stipend went: costs are neutral text
    s += rect(c.x + 450, c.y + 44, c.w - 450, 200, {
      r: 14,
      fill: '#140f27',
      stroke: C.border
    })
    s += text(c.x + 474, c.y + 84, 'This cycle', { size: 16, fill: C.text2 })
    const rows = [
      ['Stipend, through Minerva', '+600'],
      ['Unit fee, Block 7 Housing', '−420'],
      ['Grid', '−95'],
      ['Nutrition', '−130']
    ]
    rows.forEach(([k, val], i) => {
      s += text(c.x + 474, c.y + 120 + i * 28, k, { size: 15, fill: C.text })
      s += text(c.x + c.w - 24, c.y + 120 + i * 28, val, {
        size: 15,
        fill: C.text,
        anchor: 'end',
        family: MONO
      })
    })
    s += rect(c.x + 474, c.y + 222, c.w - 498, 1, { fill: C.border })
    // health, beside it
    s += rect(c.x, c.y + 268, c.w, 190, {
      r: 14,
      fill: '#140f27',
      stroke: C.border
    })
    s += text(c.x + 24, c.y + 306, 'Health score', { size: 16, fill: C.text2 })
    s +=
      text(c.x + 24, c.y + 370, '14', {
        size: 60,
        weight: 500,
        fill: C.pinkLight
      }) + text(c.x + 100, c.y + 370, '/ 100', { size: 20, fill: C.text3 })
    s +=
      rect(c.x + 200, c.y + 340, c.w - 230, 18, { r: 9, fill: '#251d40' }) +
      rect(c.x + 200, c.y + 340, (c.w - 230) * 0.14, 18, {
        r: 9,
        fill: C.pink
      })
    s += text(c.x + 200, c.y + 386, 'Vape −4 today · Sleep −2 · Air quality −1', { size: 15, fill: C.text2 })
    s += para(c.x + 24, c.y + 426, 'Minerva: “Your score is what your insurer sees. You don’t have an insurer.”', {
      size: 15,
      chars: 120,
      fill: C.text,
      italic: true
    }).svg
    s += draft(c.x + c.w - 64, c.y + 302)
    s += statusLine(W)
    s += note(
      c.x,
      H - 170,
      620,
      [
        'Same console as 06a in Corp Z’s skin: the band’s gradient, the logo, a monospace face and its greeting. Minerva’s own words (the italic line) read the same under every skin.',
        'Owed money and the low score are pink; the cycle’s costs are plain text (color guide: costs are neutral).'
      ],
      { size: 12 }
    )
    return s
  },
  phone(W, H) {
    let s = rect(0, 0, W, H, { fill: '#0b0916' })
    const f = consoleFrame(0, 44, W, H - 44, {
      corp: 'Z',
      phone: true,
      tab: 'Account',
      badges: { Mail: 2 }
    })
    s += f.svg
    const c = f.content
    s += text(c.x, c.y + 18, CORPS.Z.greeting, {
      size: 14,
      fill: CORPS.Z.color,
      family: MONO
    })
    s += draft(c.x + c.w - 50, c.y + 16)
    s += rect(c.x, c.y + 36, c.w, 150, {
      r: 14,
      fill: '#140f27',
      stroke: C.border
    })
    s += text(c.x + 18, c.y + 66, 'Balance', { size: 14, fill: C.text2 })
    s += text(c.x + 18, c.y + 130, '−45¢', {
      size: 56,
      weight: 500,
      fill: C.pinkLight
    })
    s += text(c.x + 18, c.y + 168, 'Owed. Stipend in 6 days.', {
      size: 13,
      fill: C.text2
    })
    const rows = [
      ['Stipend', '+600'],
      ['Unit fee', '−420'],
      ['Grid', '−95'],
      ['Nutrition', '−130']
    ]
    s += rect(c.x, c.y + 200, c.w, 150, {
      r: 14,
      fill: '#140f27',
      stroke: C.border
    })
    rows.forEach(([k, val], i) => {
      s += text(c.x + 18, c.y + 234 + i * 30, k, { size: 14 })
      s += text(c.x + c.w - 18, c.y + 234 + i * 30, val, {
        size: 14,
        anchor: 'end',
        family: MONO
      })
    })
    s += rect(c.x, c.y + 364, c.w, 104, {
      r: 14,
      fill: '#140f27',
      stroke: C.border
    })
    s +=
      text(c.x + 18, c.y + 394, 'Health score', { size: 14, fill: C.text2 }) +
      text(c.x + c.w - 18, c.y + 394, '14 / 100', {
        size: 15,
        anchor: 'end',
        fill: C.pinkLight,
        weight: 600
      })
    s +=
      rect(c.x + 18, c.y + 410, c.w - 36, 14, { r: 7, fill: '#251d40' }) +
      rect(c.x + 18, c.y + 410, (c.w - 36) * 0.14, 14, { r: 7, fill: C.pink })
    s += text(c.x + 18, c.y + 450, 'Vape −4 today', {
      size: 13,
      fill: C.text2
    })
    s += statusLine(W)
    return s
  }
}

// ---------------------------------------------------------------- 7. the job, the ship's name, the escort
const jobTerms = [
  ['Your body', 'is frozen and kept in cold storage, to be bought back one day.'],
  ['Your mind', 'is uploaded to Minerva. You fly a ship; she flies with you.'],
  ['Your name', 'out there is a call sign. Your name on file is it.'],
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
    const f = consoleFrame(60, 64, W - 120, H - 100, {
      corp: 'Y',
      tab: 'Jobs',
      badges: { Mail: 2 }
    })
    s += f.svg
    const c = f.content
    // the board, left: everything else is greyed out
    const lw = 360
    s += text(c.x, c.y + 20, 'Corp Y job board', { size: 22, weight: 500 })
    s += draft(c.x + 250, c.y + 16)
    const others = ['Warehouse picker', 'Debt collector', 'Clinical trial', 'Security, night', 'Courier']
    s += rect(c.x - 4, c.y + 40, lw + 8, 92, {
      r: 14,
      stroke: C.brand300,
      sw: 2.5
    })
    s += rect(c.x, c.y + 44, lw, 84, {
      r: 12,
      fill: '#302651',
      stroke: C.yellow,
      sw: 2
    })
    s += text(c.x + 18, c.y + 76, 'Pilot · Orbiter 8 program', {
      size: 18,
      weight: 600
    })
    s +=
      `<circle cx="${c.x + 26}" cy="${c.y + 102}" r="6" fill="${C.yellow}"/>` +
      text(c.x + 40, c.y + 107, 'You’re eligible', {
        size: 14,
        fill: C.yellowLight,
        weight: 600
      })
    others.forEach((name, i) => {
      s += rect(c.x, c.y + 142 + i * 62, lw, 54, { r: 10, fill: '#1f1838' })
      s += text(c.x + 18, c.y + 166 + i * 62, name, {
        size: 15,
        fill: C.text3
      })
      s += text(c.x + 18, c.y + 185 + i * 62, 'Requires citizenship', {
        size: 12,
        fill: C.text3
      })
    })
    // the opening, right
    const rx = c.x + lw + 30
    const rw = c.w - lw - 30
    s += rect(rx, c.y + 4, rw, 610, {
      r: 14,
      fill: '#140f27',
      stroke: C.border
    })
    s += ship(rx + rw - 90, c.y + 92, 110, 'none', {
      stroke: C.yellow,
      sw: 90,
      rotate: 30
    })
    s += text(rx + 28, c.y + 54, 'Pilot, Orbiter 8 program', {
      size: 28,
      weight: 500
    })
    s += text(rx + 28, c.y + 82, 'Corp Y Shipping · one opening · starts tonight', { size: 15, fill: C.text2 })
    s += draft(rx + 28, c.y + 112)
    s += para(rx + 28, c.y + 150, 'A new life, out there. We’ll be honest about what it takes.', {
      size: 19,
      chars: 60
    }).svg
    jobTerms.forEach(([k, val], i) => {
      s += text(rx + 28, c.y + 210 + i * 46, k, {
        size: 15,
        fill: C.text3,
        weight: 600
      })
      s += text(rx + 150, c.y + 210 + i * 46, val, { size: 16, fill: C.text })
    })
    s += button(rx + 28, c.y + 512, 280, 64, 'Accept the job', {
      kind: 'primary',
      size: 22,
      focus: true
    })
    s += button(rx + 328, c.y + 512, 160, 64, 'Not yet', {
      kind: 'quiet',
      size: 18
    })
    s += text(rx + 28, c.y + 600, 'Accepting is the only way out (or back to the title).', { size: 14, fill: C.text3 })
    s += statusLine(W)
    s += note(
      c.x,
      H - 140,
      380,
      [
        'Yellow appears here for the first time in the intro: the one opening that’s yours, and your ship to be. Everything else on the board is greyed out.'
      ],
      { size: 12 }
    )
    return s
  },
  phone(W, H) {
    let s = rect(0, 0, W, H, { fill: '#0b0916' })
    const f = consoleFrame(0, 44, W, H - 44, {
      corp: 'Y',
      phone: true,
      tab: 'Jobs',
      badges: { Mail: 2 }
    })
    s += f.svg
    const c = f.content
    s += ship(c.x + c.w - 40, c.y + 36, 64, 'none', {
      stroke: C.yellow,
      sw: 110,
      rotate: 30
    })
    s += para(c.x, c.y + 22, 'Pilot, Orbiter 8 program', {
      size: 21,
      chars: 18,
      weight: 500
    }).svg
    s +=
      `<circle cx="${c.x + 6}" cy="${c.y + 76}" r="5" fill="${C.yellow}"/>` +
      text(c.x + 18, c.y + 81, 'You’re eligible · Corp Y Shipping', {
        size: 13,
        fill: C.yellowLight
      })
    s += draft(c.x + c.w - 50, c.y + 106)
    let ty = c.y + 132
    for (const [k, val] of jobTerms) {
      s += text(c.x, ty, k, { size: 13, fill: C.text3, weight: 600 })
      const p = para(c.x, ty + 20, val, { size: 14, chars: 44 })
      s += p.svg
      ty += 20 + p.height + 12
    }
    s += button(c.x, H - 170, c.w, 58, 'Accept the job', {
      kind: 'primary',
      size: 19,
      focus: true
    })
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
    const f = consoleFrame(60, 64, W - 120, H - 100, {
      corp: 'Y',
      tab: 'Jobs',
      badges: { Mail: 2 }
    })
    s += f.svg
    const c = f.content
    s += `<circle cx="${c.x + c.w / 2}" cy="${c.y + 170}" r="130" fill="url(#screen-glow)"/>`
    s += ship(c.x + c.w / 2, c.y + 170, 220, 'none', {
      stroke: C.yellow,
      sw: 50
    })
    s += text(c.x + c.w / 2, c.y + 340, 'Name your ship.', {
      size: 30,
      weight: 500,
      anchor: 'middle'
    })
    s += text(c.x + c.w / 2, c.y + 372, 'Every Orbiter 8 is registered with Minerva by name before pickup.', {
      size: 16,
      fill: C.text2,
      anchor: 'middle'
    })
    s += draft(c.x + c.w / 2 + 290, c.y + 336)
    s += rect(c.x + c.w / 2 - 260, c.y + 396, 520, 66, {
      r: 14,
      fill: '#251d40',
      stroke: C.yellow,
      sw: 2.5
    })
    s +=
      text(c.x + c.w / 2 - 236, c.y + 440, 'Second Chance', {
        size: 28,
        fill: C.yellowLight
      }) + rect(c.x + c.w / 2 - 50, c.y + 414, 2.5, 32, { fill: C.yellowLight })
    s += button(c.x + c.w / 2 - 260, c.y + 490, 520, 66, 'Sign and name her', {
      kind: 'primary',
      size: 22,
      focus: true
    })
    s += text(c.x + c.w / 2, c.y + 590, 'Your wallet signs: the ship is made, and you join Corp Y.', {
      size: 14,
      fill: C.text3,
      anchor: 'middle'
    })
    s += statusLine(W)
    s += note(
      c.x,
      c.y + 470,
      245,
      [
        'The yellow outline is your ship: the first thing in the game that’s yours. The field is yellow-edged for the same reason; the button stays lavender.'
      ],
      { size: 12 }
    )
    return s
  },
  phone(W, H) {
    let s = rect(0, 0, W, H, { fill: '#0b0916' })
    const f = consoleFrame(0, 44, W, H - 44, {
      corp: 'Y',
      phone: true,
      tab: 'Jobs',
      badges: { Mail: 2 }
    })
    s += f.svg
    const c = f.content
    s += ship(c.x + c.w / 2, c.y + 100, 150, 'none', {
      stroke: C.yellow,
      sw: 70
    })
    s += text(c.x + c.w / 2, c.y + 220, 'Name your ship.', {
      size: 24,
      weight: 500,
      anchor: 'middle'
    })
    s += draft(c.x + c.w - 50, c.y + 248)
    s += para(c.x + 6, c.y + 250, 'Registered with Minerva by name before pickup.', {
      size: 13,
      chars: 38,
      fill: C.text2
    }).svg
    s += rect(c.x, c.y + 280, c.w, 56, {
      r: 12,
      fill: '#251d40',
      stroke: C.yellow,
      sw: 2.5
    })
    s += text(c.x + 18, c.y + 317, 'Second Chance', {
      size: 22,
      fill: C.yellowLight
    })
    s += button(c.x, c.y + 356, c.w, 58, 'Sign and name her', {
      kind: 'primary',
      size: 19,
      focus: true
    })
    // the keyboard is up
    s += rect(0, H - 250, W, 250, { fill: '#26213a' })
    ;['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'].forEach((row, r) => {
      const kw = 34
      const off = (W - row.length * (kw + 4)) / 2
      ;[...row].forEach(
        (ch, i) =>
          (s +=
            rect(off + i * (kw + 4), H - 236 + r * 52, kw, 44, {
              r: 6,
              fill: '#4a4460'
            }) +
            text(off + i * (kw + 4) + kw / 2, H - 206 + r * 52, ch, {
              size: 18,
              anchor: 'middle'
            }))
      )
    })
    s += statusLine(W)
    return s
  }
}
/** The street grid outside, with the escort's route: a lit line to your block, the car most of the way. */
function escortMap(x, y, w, h) {
  let s = rect(x, y, w, h, { r: 12, fill: '#0e0a1c', stroke: C.border })
  for (let gx = x + 30; gx < x + w; gx += 60) s += rect(gx, y + 8, 14, h - 16, { fill: '#1b1531' })
  for (let gy = y + 30; gy < y + h; gy += 56) s += rect(x + 8, gy, w - 16, 12, { fill: '#1b1531' })
  const route = `M${x + 37} ${y + h - 20} L${x + 37} ${y + 148} L${x + w - 143} ${y + 148} L${x + w - 143} ${y + 36}`
  s += `<path d="${route}" fill="none" stroke="${C.brand300}" stroke-width="4" stroke-dasharray="2 10" stroke-linecap="round"/>`
  s += `<path d="M${x + 37} ${y + h - 20} L${x + 37} ${y + 148} L${x + w * 0.45} ${y + 148}" fill="none" stroke="${C.brand300}" stroke-width="4"/>`
  s += rect(x + w * 0.45 - 12, y + 140, 24, 16, {
    r: 4,
    fill: C.lavenderLight
  })
  s +=
    rect(x + w - 160, y + 14, 34, 34, {
      r: 4,
      fill: '#302651',
      stroke: C.lavender,
      sw: 2
    }) +
    text(x + w - 143, y + 64, 'Block 7', {
      size: 12,
      anchor: 'middle',
      fill: C.text2
    })
  return s
}
const escort = {
  id: '07c-escort',
  title: 'waiting for the escort while the second transaction goes through',
  desktop(W, H) {
    const v = roomView(W, H)
    let s = v.world(room({ tv: 'Y' })) + rect(0, 0, W, H, { fill: 'url(#scrim)' })
    const f = consoleFrame(60, 64, W - 120, H - 100, {
      corp: 'Y',
      tab: 'Jobs',
      badges: { Mail: 2 }
    })
    s += f.svg
    const c = f.content
    s += owl(c.x + 80, c.y + 70, 130, '#ffffff')
    s += text(c.x + 170, c.y + 56, 'Application filed.', {
      size: 30,
      weight: 500
    })
    s += text(c.x + 170, c.y + 92, 'An escort will arrive shortly to take you to processing.', {
      size: 19,
      fill: C.text2
    })
    s += draft(c.x + 720, c.y + 52)
    s += steps(
      c.x + 20,
      c.y + 170,
      700,
      [
        ['Signed', 'done'],
        ['Ship registered: Second Chance', 'now'],
        ['Escort at your door', 'next']
      ],
      { size: 15 }
    )
    s += escortMap(c.x, c.y + 240, 700, 330)
    s += rect(c.x + 730, c.y + 240, c.w - 730, 330, {
      r: 12,
      fill: '#140f27',
      stroke: C.border
    })
    s += text(c.x + 754, c.y + 280, 'While you wait', {
      size: 16,
      fill: C.text2
    })
    const tips = [
      'Nothing to pack. They take the body as it is.',
      'Your mail, your debts and your name go with you.',
      'The door unlocks when they arrive.'
    ]
    tips.forEach(
      (t, i) =>
        (s += para(c.x + 754, c.y + 318 + i * 62, t, {
          size: 15,
          chars: Math.floor((c.w - 780) / 8)
        }).svg)
    )
    s += draft(c.x + c.w - 64, c.y + 276)
    s += statusLine(W, { skip: false })
    s += note(
      W - 520,
      H - 150,
      480,
      [
        'The wait is the escort’s car crossing the city: it moves with the chain (signed, registered, at your door). When the block lands, the door’s light turns, the screen fades to white: processing, left unsaid. Then the ship.'
      ],
      { size: 12 }
    )
    return s
  },
  phone(W, H) {
    let s = rect(0, 0, W, H, { fill: '#0b0916' })
    const f = consoleFrame(0, 44, W, H - 44, {
      corp: 'Y',
      phone: true,
      tab: 'Jobs',
      badges: { Mail: 2 }
    })
    s += f.svg
    const c = f.content
    s += owl(c.x + 44, c.y + 40, 80, '#ffffff')
    s += text(c.x + 98, c.y + 36, 'Application filed.', {
      size: 20,
      weight: 500
    })
    s += draft(c.x + c.w - 50, c.y + 60)
    s += para(c.x, c.y + 96, 'An escort will arrive shortly to take you to processing.', {
      size: 15,
      chars: 40,
      fill: C.text2
    }).svg
    s += steps(
      c.x,
      c.y + 166,
      c.w,
      [
        ['Signed', 'done'],
        ['Ship', 'now'],
        ['Escort', 'next']
      ],
      { size: 13 }
    )
    s += escortMap(c.x, c.y + 226, c.w, 300)
    s += statusLine(W, { skip: false })
    return s
  }
}

// ---------------------------------------------------------------- 8. waking in orbit
const FIRST =
  'You’re awake. This is your ship, the Second Chance, in orbit over Earth. Your body is in storage. Your mind is here, with me. You owe the pilot program 45 credits. The hold carries the program’s advance: Helium-3 and Electronics. Sell them at the I.S.S., clear the debt, then go find a star nobody has. That’s the job.'
function hudHints(W, H, phone) {
  let s = ''
  // the pilot card, top left, and the star and minimap, top right, as faint placeholders of the game's HUD
  s += rect(phone ? 10 : 20, phone ? 54 : 20, phone ? 150 : 250, phone ? 50 : 76, {
    r: 12,
    fill: '#12052acc',
    stroke: '#ffffff30'
  })
  s += text(phone ? 22 : 36, phone ? 76 : 50, 'Rhea Okafor', {
    size: phone ? 13 : 16,
    weight: 600,
    fill: C.yellowLight
  })
  s += text(phone ? 22 : 36, phone ? 94 : 74, '−45¢ · Corp Y', {
    size: phone ? 12 : 14,
    fill: C.pinkLight
  })
  s += `<circle cx="${phone ? W - 40 : W - 70}" cy="${phone ? 80 : 70}" r="${phone ? 24 : 44}" fill="#12052acc" stroke="#ffffff30"/>`
  s += text(phone ? W - 40 : W - 70, phone ? 84 : 75, 'Sol', {
    size: phone ? 12 : 14,
    anchor: 'middle',
    fill: C.text2
  })
  return s
}
const wake = {
  id: '08-wake-in-orbit',
  title: 'waking in your ship over Earth, with Minerva’s first message',
  desktop(W, H) {
    let s = rect(0, 0, W, H, { fill: C.space })
    const r = (n) => ((n * 9301 + 49297) % 233280) / 233280
    for (let i = 0; i < 160; i++)
      s += `<circle cx="${r(i) * W}" cy="${r(i + 999) * H}" r="${r(i + 77) * 1.4 + 0.3}" fill="#e6dcf5" opacity="${0.3 + r(i + 5) * 0.5}"/>`
    s += earth(330, 560, 420)
    // your ship, in orbit: white like every ship, with your yellow mark and name
    s += `<ellipse cx="330" cy="560" rx="560" ry="200" fill="none" stroke="${C.orbit}" stroke-width="1.5" stroke-dasharray="4 8" transform="rotate(-12 330 560)"/>`
    s += ship(880, 360, 90, '#ffffff', { rotate: 70 })
    s += `<circle cx="880" cy="360" r="66" fill="none" stroke="${C.yellow}" stroke-width="2"/>`
    s += text(880, 452, 'Second Chance', {
      size: 16,
      anchor: 'middle',
      fill: C.yellowLight,
      weight: 600
    })
    s += hudHints(W, H, false)
    // Minerva's first message: the menu container sliding up from the bottom, as every menu does
    const mx = W / 2 - 60
    const my = 520
    const mw = 640
    s += rect(mx, my, mw, 340, {
      r: 18,
      fill: '#1b1531f2',
      stroke: '#5a4c8c',
      sw: 2
    })
    s +=
      rect(mx, my, mw, 64, { r: 18, fill: '#164336' }) +
      rect(mx, my + 46, mw, 18, { fill: '#164336' }) +
      rect(mx, my + 61, mw, 3, { fill: CORPS.Y.color })
    s += owl(mx + 46, my + 32, 60, '#ffffff') + text(mx + 86, my + 38, 'MINERVA', { size: 17, weight: 700, ls: 3 })
    s += draft(mx + mw - 64, my + 36)
    s += para(mx + 28, my + 100, FIRST, { size: 17, chars: 66, lh: 25 }).svg
    s += button(mx + 28, my + 262, 220, 54, 'Understood', {
      kind: 'primary',
      size: 19,
      focus: true
    })
    s += button(mx + 266, my + 262, 200, 54, 'Show me the I.S.S.', {
      size: 16
    })
    s += note(
      20,
      H - 150,
      470,
      [
        'Processing is a fade through white; the ship fades in already in orbit, engines quiet. The HUD arrives piece by piece after the message (not shown). Your ship is white like every ship; yellow marks it as yours.'
      ],
      { size: 12 }
    )
    return s
  },
  phone(W, H) {
    let s = rect(0, 0, W, H, { fill: C.space })
    const r = (n) => ((n * 9301 + 49297) % 233280) / 233280
    for (let i = 0; i < 70; i++)
      s += `<circle cx="${r(i) * W}" cy="${r(i + 999) * H}" r="${r(i + 77) * 1.3 + 0.3}" fill="#e6dcf5" opacity="${0.3 + r(i + 5) * 0.5}"/>`
    s += earth(120, 330, 190)
    s += ship(300, 190, 54, '#ffffff', { rotate: 70 })
    s += `<circle cx="300" cy="190" r="40" fill="none" stroke="${C.yellow}" stroke-width="2"/>`
    s += text(300, 248, 'Second Chance', {
      size: 13,
      anchor: 'middle',
      fill: C.yellowLight,
      weight: 600
    })
    s += hudHints(W, H, true)
    const my = 470
    s += rect(0, my, W, H - my, {
      r: 18,
      fill: '#1b1531f2',
      stroke: '#5a4c8c',
      sw: 2
    })
    s +=
      rect(0, my, W, 56, { r: 18, fill: '#164336' }) +
      rect(0, my + 40, W, 16, { fill: '#164336' }) +
      rect(0, my + 53, W, 3, { fill: CORPS.Y.color })
    s += owl(36, my + 28, 50, '#ffffff') + text(70, my + 34, 'MINERVA', { size: 15, weight: 700, ls: 3 })
    s += draft(W - 64, my + 32)
    s += para(18, my + 86, FIRST, { size: 14, chars: 46, lh: 20 }).svg
    s += button(18, H - 76, W - 36, 54, 'Understood', {
      kind: 'primary',
      size: 18,
      focus: true
    })
    return s
  }
}

export const SCREENS = [
  apartment,
  door,
  scannerName,
  scannerWait,
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
