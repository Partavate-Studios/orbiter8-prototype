// The six panels: one world, six zooms. Furthest out first.

import { C, MONO, CORPS, rect, text, notice, note, statusLine, consoleFrame, para } from '../intro/art.mjs'
import { camera, world, worldDefs, SPOTS, T } from './world.mjs'
import { vista, railing } from './vista.mjs'


// ---------------------------------------------------------------- the card drawer's buttons (hud/selection-panel.vue .action)
// Koda (2026-11-20): the buttons that slide out from behind the selection card are the ones to use for
// Minerva: a plum gradient pill, a thin violet edge, its picture in a round well, bold pale text; hover
// lights the edge lavender. The one you're on gets the hover look and the focus ring, never a lavender fill.
const DRAWER_DEFS = `<defs><linearGradient id="dr-pill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2e2354"/><stop offset="1" stop-color="#211839"/></linearGradient><linearGradient id="dr-pill-on" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2c69"/><stop offset="1" stop-color="#2a1f4c"/></linearGradient><radialGradient id="dr-well" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#3d2a6e"/><stop offset="1" stop-color="#1a1331"/></radialGradient></defs>`
const GLYPHS = {
  Account: 'M-8 -5 h16 a2 2 0 0 1 2 2 v8 a2 2 0 0 1 -2 2 h-16 a2 2 0 0 1 -2 -2 v-8 a2 2 0 0 1 2 -2z M-10 -1 h20 M-6 4 h5',
  Health: 'M0 8 C-9 2 -10 -3 -7 -6 C-4 -9 -1 -7 0 -4 C1 -7 4 -9 7 -6 C10 -3 9 2 0 8z',
  Mail: 'M-9 -6 h18 v12 h-18z M-9 -6 L0 2 L9 -6',
  Jobs: 'M-9 -3 h18 v10 h-18z M-4 -3 v-3 h8 v3 M-9 2 h18'
}
function pill(x, y, w, h, label, o = {}) {
  let s = ''
  if (o.on) s += rect(x - 5, y - 5, w + 10, h + 10, { r: (h + 10) / 2, stroke: C.brand300, sw: 2.5 })
  s += rect(x, y, w, h, { r: h / 2, fill: o.on ? 'url(#dr-pill-on)' : 'url(#dr-pill)', stroke: o.on ? '#b9a0ff' : '#4a3d7a', sw: 1.5 })
  const wr = h / 2 - 5
  const wx = x + 5 + wr
  const wy = y + h / 2
  if (o.glyph) {
    s += `<circle cx="${wx}" cy="${wy}" r="${wr}" fill="url(#dr-well)" stroke="#5a4c8c" stroke-width="1"/>`
    s += `<g transform="translate(${wx} ${wy}) scale(${(wr * 0.62) / 10})"><path d="${o.glyph}" fill="none" stroke="#d9ccf5" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></g>`
  }
  s += text(o.glyph ? x + 10 + wr * 2 + 8 : x + 18, y + h / 2 + (o.size ?? 17) * 0.36, label, { size: o.size ?? 17, weight: 700, fill: '#efe7ff' })
  if (o.badge) s += `<circle cx="${x + w - 18}" cy="${y + h / 2}" r="11" fill="${C.pink}"/>` + text(x + w - 18, y + h / 2 + 4.5, String(o.badge), { size: 12, anchor: 'middle', weight: 700 })
  return s
}

const hint = (W, H, s) => rect(0, H - 40, W, 40, { fill: C.black, opacity: 0.8 }) + text(24, H - 15, s, { size: 14, fill: C.text2 })
const memo = (x, y, w, name, lines) => note(x, y, w, [`${name}.`, ...lines], { size: 12.5 })
const vignette = (W, H) => rect(0, 0, W, H, { fill: 'url(#w-farhaze)' }) + rect(0, 0, W, H, { fill: 'url(#w-vignette)' })

export const PANELS = [
  {
    id: '1-block',
    title: 'the block, all the way out',
    draw(W, H) {
      const cam = camera(3.3, [6, 18, T.zu + 30], W, H)
      let s = world(cam) + vignette(W, H)
      const [fx, fy] = cam.P(4.6, 21, T.zu + 1)
      s += `<circle cx="${fx}" cy="${fy}" r="26" fill="none" stroke="${C.yellow}" stroke-width="1.5" opacity="0.8"/>`
      s += statusLine(W) + hint(W, H, 'Scroll, pinch or the triggers zoom · the camera always comes back to you')
      s += memo(24, 64, 400, '1 · The block, all the way out', [
        'The furthest the camera goes: the city, Block 7’s tower with your unit cut open, and you, a speck with a yellow outline (ringed here). The intro opens here and falls in.',
        'From here everything is simple shapes: windows are dots, the TV is a glow.'
      ])
      return s
    }
  },
  {
    id: '2-room',
    title: 'the room: where you play',
    draw(W, H) {
      const cam = camera(46, [4.4, 19.4, T.zu + 3.2], W, H)
      let s = world(cam) + rect(0, 0, W, H, { fill: 'url(#w-vignette)' })
      // the vape has focus: its outline and its name, nothing more
      const [vx, vy] = cam.P(...SPOTS.vape)
      s += `<ellipse cx="${vx - 2}" cy="${vy - 4}" rx="28" ry="16" fill="none" stroke="${C.brand300}" stroke-width="2.5"/>`
      s += rect(vx - 30, vy - 52, 60, 26, { r: 13, fill: '#0b0916e6', stroke: C.brand300, sw: 1.2 }) + text(vx, vy - 34, 'Vape', { size: 14, anchor: 'middle', fill: C.text, weight: 500 })
      s += notice(24, 64, 470, 'Name on file: Rhea Okafor', 'Power’s on. So are the bills. The terminal on the desk has your account.', { state: 'talking', oneOff: ['nod', 0.4], faceW: 80 })
      s += statusLine(W) + hint(W, H, 'Click a thing to use it: the TV, the terminal, the vape, the glass, the door · Esc or B zooms back out')
      s += memo(1040, 64, 380, '2 · The room, where you play', [
        'The cutaway of scene A, now in its tower: floors below, the floors above as a ghost, the city all round. No menu: you click the thing itself (here the vape, hovered).',
        'The glass door and the window by the mattress show the city straight on, small; they are ways out to the view (panel 5).'
      ])
      return s
    }
  },
  {
    id: '3-tv',
    title: 'the TV, zoomed in',
    draw(W, H) {
      const cam = camera(370, [3.75, 16.98, T.zu + 1.7], W, H)
      let s = world(cam) + rect(0, 0, W, H, { fill: 'url(#w-vignette)' })
      s += statusLine(W) + hint(W, H, 'Click the TV again to change channel · Esc, B or a click off it zooms back to the room')
      s += memo(24, 64, 420, '3 · The TV, zoomed in', [
        'Clicking the TV just pushes the camera in until the set fills the screen; the room is still there round its edges. Far away it was a colored glow; here it runs the full ad and Minerva’s ticker.',
        'It stays on the room’s slant (true to the world). Option: the camera squares up to the screen as it lands.'
      ])
      return s
    }
  },
  {
    id: '4-terminal',
    title: 'the terminal, zoomed in: Minerva’s console',
    draw(W, H) {
      const cam = camera(240, SPOTS.terminal, W, H)
      let s = world(cam) + rect(0, 0, W, H, { fill: C.black, opacity: 0.45 })
      // the console lifts out of the terminal's screen and squares up to you
      const corners = [cam.P(6.17, 16.88, T.zu + 2.52), cam.P(7.53, 16.88, T.zu + 2.52), cam.P(7.53, 16.88, T.zu + 1.68), cam.P(6.17, 16.88, T.zu + 1.68)]
      const x = 150
      const y = 92
      const w = W - 300
      const h = H - 170
      const box = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]
      s += corners.map((c, i) => `<path d="M${c[0]} ${c[1]} L${box[i][0]} ${box[i][1]}" stroke="${C.brand300}" stroke-width="1" opacity="0.35"/>`).join('')
      s += `<polygon points="${corners.map((c) => c.join(',')).join(' ')}" fill="${C.lavenderLight}" opacity="0.08"/>`
      const f = consoleFrame(x, y, w, h, { corp: 'X', tabs: false, state: 'talking', say: 'Two bills are overdue. One company said no, politely. Another didn’t read it.' })
      s += DRAWER_DEFS + f.svg
      // her tabs, as the card drawer's buttons
      ;['Account', 'Health', 'Mail', 'Jobs'].forEach((tab, i) => {
        s += pill(x + 24, y + h - 24 - 4 * 62 + i * 62, 272, 50, tab, { glyph: GLYPHS[tab], on: tab === 'Mail', badge: tab === 'Mail' ? 2 : 0 })
      })
      const c = f.content
      s += text(c.x, c.y + 18, 'Mail', { size: 24, weight: 500, family: CORPS.X.headFont }) + text(c.x + 70, c.y + 18, '7 · 2 overdue', { size: 14, fill: C.text3 })
      const MAIL = [
        ['Grid Utility', 'Final notice: 3 cycles unpaid', 'Overdue'],
        ['Block 7 Housing', 'Unit fee overdue: 2 cycles', 'Overdue'],
        ['Harlan & Voss Logistics', 'Re: Application 44817', 'Rejection'],
        ['Talent Intake', 'Your application was not reviewed', 'Rejection'],
        ['Block 7 Security', 'Incident report: 3 assaults, 0 arrests', '']
      ]
      // the letters, in the drawer's plum: the rows are buttons too
      MAIL.forEach(([from, subj, tag], i) => {
        const ry = c.y + 40 + i * 70
        const open = i === 2
        s += rect(c.x, ry, c.w, 60, { r: 14, fill: open ? 'url(#dr-pill-on)' : 'url(#dr-pill)', stroke: open ? '#b9a0ff' : '#4a3d7a', sw: 1.5 })
        s += `<circle cx="${c.x + 30}" cy="${ry + 30}" r="20" fill="url(#dr-well)" stroke="#5a4c8c" stroke-width="1"/><g transform="translate(${c.x + 30} ${ry + 30}) scale(1.1)"><path d="${GLYPHS.Mail}" fill="none" stroke="#d9ccf5" stroke-width="1.5" stroke-linejoin="round"/></g>`
        s += text(c.x + 62, ry + 25, from, { size: 15, weight: 700, fill: '#efe7ff' }) + text(c.x + 62, ry + 46, subj, { size: 14, fill: C.text2 })
        if (tag) {
          const tw = tag.length * 7.5 + 18
          const od = tag === 'Overdue'
          s += rect(c.x + c.w - tw - 14, ry + 19, tw, 22, { r: 11, stroke: od ? C.pink : C.text3, sw: 1.5 }) + text(c.x + c.w - tw / 2 - 14, ry + 34, tag, { size: 12, anchor: 'middle', fill: od ? C.pinkLight : C.text2, weight: 600 })
        }
      })
      s += statusLine(W) + hint(W, H, 'Here a menu belongs: tabs 1–4, shoulder buttons · ✕, Esc or B shrinks it back into the screen')
      s += memo(W - 450, H - 300, 430, '4 · The terminal, zoomed in', [
        'From far away her screen is just her emblem. Click it and the camera pushes in; the console lifts off the screen and squares up to you, the room still behind it. Menus live here, not in the world.', 'Her buttons are the card drawer’s (the ones that slide out from behind the selection card): plum pills with their picture in a round well. The one you’re on lights its edge and gets the focus ring.'
      ])
      return s
    }
  },
  {
    id: '5-balcony',
    title: 'through the glass: the balcony and the city',
    draw(W, H) {
      let s = worldDefs() + vista()
      // you, from behind, leaning on the rail, the vape lit; its vapor
      s += `<g transform="translate(560 900)"><path d="M-120 0 L-110 -150 Q-100 -210 -40 -224 L-26 -250 Q-30 -300 0 -312 Q30 -300 26 -250 L40 -224 Q100 -210 110 -150 L120 0z" fill="${C.black}" stroke="${C.yellow}" stroke-width="2.5" stroke-linejoin="round"/><circle cx="0" cy="-290" r="40" fill="${C.black}" stroke="${C.yellow}" stroke-width="2.5"/><path d="M110 -150 L170 -205 L150 -232" fill="none" stroke="${C.black}" stroke-width="22" stroke-linecap="round"/><path d="M110 -150 L170 -205 L150 -232" fill="none" stroke="${C.yellow}" stroke-width="2" stroke-linecap="round" opacity="0.6"/><circle cx="150" cy="-236" r="5" fill="${C.lavenderLight}"/></g>`
      s += railing()
      s += [[720, 640, 40], [690, 560, 70], [740, 450, 110]].map(([x, y, rr], i) => `<ellipse cx="${x}" cy="${y}" rx="${rr}" ry="${rr * 0.7}" fill="url(#vapor)" opacity="${0.8 - i * 0.2}"/>`).join('')
      // the glass's frame, just passed, still at the edges on the room's slant
      s += `<path d="M0 0 L60 -35 L60 935 L0 970z" fill="#141120" opacity="0.9"/><path d="M${W} -40 L${W - 50} -12 L${W - 50} 900 L${W} 900z" fill="#141120" opacity="0.9"/>`
      s += statusLine(W) + hint(W, H, 'Click the glass behind you (or Esc, B) to go back in · the vape, the terminal on the rail')
      s += memo(24, 64, 440, '5 · Through the glass', [
        'The glass door works like the TV: from the room it shows this view small, on the wall’s slant; click it and the camera pushes through until the view fills the screen. The balcony is that view, straight on, with you at the rail.',
        'The window by the mattress shows the same city.'
      ])
      return s
    }
  },
  {
    id: '6-vape',
    title: 'the vape, clicked',
    draw(W, H) {
      const cam = camera(120, [1.9, 19.4, T.zu + 1.4], W, H)
      let s = world(cam, { sit: true, vapeInHand: true }) + rect(0, 0, W, H, { fill: 'url(#w-vignette)' })
      // the vapor, rising from where you sit
      const [hx, hy] = cam.P(1.6, 19.6, T.zu + 0.45)
      const sc = cam.k / 50
      const vx = hx + 9 * sc
      const vy = hy - 54 * sc
      s += [[0, 0, 40], [-20, -60, 70], [10, -140, 110], [-30, -240, 150]].map(([dx, dy, rr], i) => `<ellipse cx="${vx + dx}" cy="${vy + dy}" rx="${rr}" ry="${rr * 0.75}" fill="url(#vapor)" opacity="${0.9 - i * 0.18}"/><ellipse cx="${vx + dx}" cy="${vy + dy}" rx="${rr * 0.6}" ry="${rr * 0.45}" fill="url(#vapor)"/>`).join('')
      s += notice(24, 64, 470, 'Health score 14 (−1)', 'Vape. Fourth today. I’m only counting.', { attention: true, state: 'skeptical', faceW: 80 })
      s += statusLine(W) + hint(W, H, 'You clicked the vape on the mattress: you sit and take a hit · click it again for another · Esc zooms out')
      s += memo(W - 430, 64, 410, '6 · The vape, clicked', [
        'No “Take a hit” button: you click the vape where it lies. The camera eases in a little, you sit on the mattress and take a hit, the vapor rises, and Minerva notes the cost (pink: your health).'
      ])
      return s
    }
  }
]
