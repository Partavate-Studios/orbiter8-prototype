// Draws docs/mockups/ship-upgrades/sheet.svg (and its PNG with --png): a new concept for how the
// Orbiter 8's upgrades are drawn (Koda, 2026-11-21: "the color is bad, the shapes don't cut it... you
// can re-conceptualize them completely"), beside today's (sdk/src/ship-art.js, the NFT's own picture).
// A proposal: once Koda agrees, the new parts go into sdk/src/ship-art.js and contracts/src/art/ShipArt.sol
// together (they must match character for character), so each part is kept to a few simple shapes.
//   npx vite-node dev/mockups/ship-upgrades.mjs [--png]     (from orbiter-client/)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { SHIP_ART_VIEWBOX } from '../../../sdk/src/ship-art.js'
import { SHIP_DESIGNS } from '../../../sdk/src/ship-designs.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(here, '../../../docs/mockups/ship-upgrades')
const HULL_D = SHIP_DESIGNS.orbiter8.d

// ── the new concept, round 2 (Koda's notes on round 1, 2026-11-21) ───────────
// The Orbiter 8 is a frame you build out, like a flatbed truck: a big empty bay in the fuselage, and
// what you fit goes inside it. So:
// - what's inside (holds, drone bays, bots, capacitors) shows only when the ship is opened up (round 3);
// - the pods carry the weapons: rails along their sides, missile tubes set into them;
// - armor is plating that grows back from the nose and the pods' fronts, cut to the hull's own shape;
// - a shield wraps the hull's outline, a band a level;
// - longer range is longer thrusters;
// - drones fly escort off the tail.
// One family of colors: the white hull, two lavenders, a dark inset. The shield is a cold pale line,
// the thrusters' tips are warm, damage is pink. Everything is symmetrical and has its own place.
const HULL = '#e6dcf5'
const PART = '#b9a6d6'
const LINE = '#8f7fb0'
const DARK = '#2a1a4a'
const GLOW = '#ffd2a1'
const PINK = '#ff6fb0'
// The hull, nose up, centered: the fuselage is ±847 wide from its nose at -2300 to its skirt at about
// 1270; a pod each side is centered ±1820, ±475 wide, from about -640 to 950.
const hullPath = (attrs) => `<path transform="translate(-2300,-2300)" d="${HULL_D}" ${attrs}/>`

/**
 * The shield: the hull's own outline in the old shield's blue, drawn fat behind the ship so it wraps
 * it closely (Koda, round 4: not a bigger copy of the ship). Fatter each level. One color; it breathes
 * in and out all the time.
 */
const BLUE = '#7fd4ff'
const shield = (levels) =>
  levels
    ? `<path transform="translate(-2300,-2300)" d="${HULL_D}" fill="none" stroke="${BLUE}" stroke-width="${180 + levels * 130}" stroke-linejoin="round" stroke-opacity="0.9">` +
      '<animate attributeName="stroke-opacity" values="0.9;0.45;0.9" dur="5s" repeatCount="indefinite"/></path>'
    : ''
/**
 * Longer range: the pods themselves are longer (they hold the capacitor bank), a step a level. Drawn
 * over the hull's own pods so the ship's outline simply grows; no cone is added.
 */
const pods = (range) => {
  const len = Math.min(3, range - 1) * 170
  if (len <= 0) return ''
  const one = (cx) => {
    const side = (k) => `M${cx + k * 478} 330V${640 + len}L${cx + k * 310} ${700 + len}V${800 + len}L${cx + k * 380} ${950 + len}`
    return `<path d="M${cx - 478} 330V${640 + len}L${cx - 310} ${700 + len}V${800 + len}L${cx - 380} ${950 + len}H${cx + 380}L${cx + 310} ${800 + len}V${700 + len}L${cx + 478} ${640 + len}V330z" fill="${HULL}"/>` +
      `<path d="${side(-1)}H${cx + 380}M${cx + 478} 330V${640 + len}L${cx + 310} ${700 + len}V${800 + len}L${cx + 380} ${950 + len}" fill="none" stroke="${LINE}" stroke-width="40" stroke-linejoin="round"/>`
  }
  return one(-1820) + one(1820)
}
/** Armor: plating that grows back from the nose and the pods' fronts, cut to the hull's shape, further each level. */
const armor = (levels, clip) => {
  if (!levels) return ''
  const n = Math.min(5, levels)
  const nose = -2400
  const fy = (i) => -1820 + i * 290
  const py = (i) => -430 + i * 190
  let out = `<g clip-path="url(#${clip})"><rect x="-900" y="${nose}" width="1800" height="${fy(n) - nose}" fill="${PART}"/><rect x="-2400" y="-800" width="1160" height="${py(n) + 800}" fill="${PART}"/><rect x="1240" y="-800" width="1160" height="${py(n) + 800}" fill="${PART}"/>`
  // one clean edge where the plating ends (round 2: a seam at every level read as stripes)
  out += `<path d="M-900 ${fy(n)}h1800M-2400 ${py(n)}h1160M1240 ${py(n)}h1160" stroke="${LINE}" stroke-width="50"/>`
  return out + '</g>'
}
/** Railguns: twin white rails with a breech, one along each pod, the third down the spine. */
const railguns = (count) => {
  const xs = [-2420, 2420, 0]
  const tops = [-1900, -1900, -2770]
  const lengths = [2100, 2100, 1050]
  let out = ''
  for (let i = 0; i < count && i < 3; i++) {
    const x = xs[i]
    const t = tops[i]
    out += `<g fill="${HULL}" stroke="${LINE}" stroke-width="30"><rect x="${x - 110}" y="${t}" width="80" height="${lengths[i]}"/><rect x="${x + 30}" y="${t}" width="80" height="${lengths[i]}"/><rect x="${x - 150}" y="${t + lengths[i] - 560}" width="300" height="500" rx="60"/><rect x="${x - 130}" y="${t + 300}" width="260" height="90"/></g>`
  }
  return out
}
/** Missile racks: six tubes set into each pod, the third in the nose. */
const missiles = (count) => {
  const xs = [-1820, 1820, 0]
  const ys = [80, 80, -1250]
  let out = ''
  for (let i = 0; i < count && i < 3; i++) {
    for (let k = 0; k < 6; k++) out += `<circle cx="${xs[i] - 130 + (k % 2) * 260}" cy="${ys[i] + Math.floor(k / 2) * 230}" r="78" fill="${DARK}"/>`
  }
  return out
}
/** Point defense: a ring and a stub of a barrel, in pairs: the pods' tops, the struts, the nose's shoulders. */
const turrets = (count) => {
  const xs = [-1820, 1820, -1100, 1100, -430, 430]
  const ys = [-380, -380, -470, -470, -1560, -1560]
  let out = ''
  for (let i = 0; i < count && i < 6; i++) out += `<rect x="${xs[i] - 30}" y="${ys[i] - 300}" width="60" height="230" fill="${DARK}"/><circle cx="${xs[i]}" cy="${ys[i]}" r="125" fill="${HULL}" stroke="${DARK}" stroke-width="56"/>`
  return out
}
/** Damage: cracks in pink (it needs you), not dark holes. */
const SCARS = `<g fill="none" stroke="${PINK}" stroke-width="56" stroke-linecap="round" stroke-linejoin="round"><path d="M-1050 620l190 150l-130 170l250 130"/><path d="M180 -1020l-150 140l170 120"/><path d="M1620 550l150 170l-190 120"/></g>`

let clips = 0
/** The ship from outside, as it flies: only what changes its shape. Holds, bays and bots don't show. */
function newShip(ship, scarred = false) {
  const l = ship.loadout
  const clip = 'hull' + ++clips
  return (
    `<clipPath id="${clip}">${hullPath('')}</clipPath>` +
    shield(l.shields) +
    railguns(l.railguns) +
    hullPath(`fill="${HULL}" stroke="${LINE}" stroke-width="40"`) +
    pods(ship.range ?? 1) +
    armor(l.armor, clip) +
    missiles(l.missiles) +
    turrets(l.pointDefense) +
    (scarred ? SCARS : '')
  )
}
/**
 * The ship opened up, as a yard or its Details would show it: the hull as a drawing, and what's fitted
 * inside. The bay with its cargo holds and drone bays (darts for battle drones, rings for mining
 * drones), the repair bots beside it, the capacitor bank in the pods (a cell a step of range).
 */
function insideShip(ship) {
  const l = ship.loadout
  let out = hullPath(`fill="#1d1436" stroke="${LINE}" stroke-width="50"`) + pods(ship.range ?? 1).replaceAll(HULL, '#1d1436')
  // the bay takes the whole fuselage: nothing else is drawn with it
  out += `<rect x="-740" y="-1560" width="1480" height="2500" rx="120" fill="#150f28" stroke="${LINE}" stroke-width="36" stroke-dasharray="90 60"/>`
  const cargoCells = Math.min(25, Math.ceil(ship.bays / 10))
  const battle = Math.ceil(l.drones / 10)
  const mining = Math.ceil((l.miningDrones ?? 0) / 10)
  const droneCells = Math.min(25 - cargoCells, Math.max(Math.ceil((ship.droneBays ?? 0) / 10), battle + mining))
  for (let i = 0; i < cargoCells + droneCells; i++) {
    const x = -680 + (i % 5) * 276
    const y = 410 - Math.floor(i / 5) * 480
    const cx = x + 128
    const cy = y + 220
    const k = i - cargoCells
    if (k < 0) out += `<rect x="${x}" y="${y}" width="256" height="440" rx="50" fill="${PART}"/><path d="M${x + 50} ${y + 150}h156M${x + 50} ${y + 290}h156" stroke="${LINE}" stroke-width="30"/>`
    else {
      out += `<rect x="${x}" y="${y}" width="256" height="440" rx="50" fill="none" stroke="${PART}" stroke-width="34"/>`
      if (k < battle) out += `<path d="M${cx} ${cy - 130}l90 250l-90 -62l-90 62z" fill="${HULL}"/>`
      else if (k < battle + mining) out += `<circle cx="${cx}" cy="${cy}" r="70" fill="none" stroke="${HULL}" stroke-width="40"/>`
    }
  }
  // the capacitor bank: a cell a step of range, in each pod, in the engines' warm yellow
  for (let i = 0; i < 4; i++) {
    const on = i < (ship.range ?? 1)
    for (const cx of [-1820, 1820]) out += `<rect x="${cx - 300}" y="${440 - i * 250}" width="600" height="190" rx="50" fill="${on ? GLOW : 'none'}" stroke="${on ? GLOW : LINE}" stroke-width="30" ${on ? '' : 'stroke-dasharray="60 50"'}/>`
  }
  // repair bots, racked in the nose over the bay
  for (let i = 0; i < l.repairBots && i < 6; i++) {
    const x = -450 + i * 180
    const y = -1830
    out += `<path d="M${x - 62} ${y - 80}v160M${x + 62} ${y - 80}v160" stroke="${PART}" stroke-width="26" stroke-linecap="round"/><rect x="${x - 45}" y="${y - 100}" width="90" height="200" rx="40" fill="${PART}"/>`
  }
  return out
}

// ── the sheet ────────────────────────────────────────────────────────────────
const none = { railguns: 0, missiles: 0, pointDefense: 0, drones: 0, miningDrones: 0, repairBots: 0, armor: 0, shields: 0 }
const shipWith = (loadout = {}, extra = {}) => ({ bays: 5, range: 1, rangeLost: 0, baysLost: 0, loadout: { ...none, ...loadout }, ...extra })
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
const T = (x, y, s, { size = 13, fill = '#f1eefa', weight = 400, anchor = 'start' } = {}) => `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" font-weight="${weight}" text-anchor="${anchor}">${esc(s)}</text>`
const frame = (x, y, size, inner) => `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="12" fill="#160f2c" stroke="#3f3566"/><svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="${SHIP_ART_VIEWBOX}">${inner}</svg>`

const OUTSIDE = [
  ['Railguns', 'Twin white rails with a breech.', [1, 2, 3].map((n) => shipWith({ railguns: n }))],
  ['Missile racks', 'Round ports set into the pods; the third in the nose.', [1, 2, 3].map((n) => shipWith({ missiles: n }))],
  ['Point defense', 'A ring and a stub of a barrel, in pairs.', [2, 4, 6].map((n) => shipWith({ pointDefense: n }))],
  ['Shields', 'The hull\'s own outline, fat and blue, behind the ship: it wraps it closely. Fatter each level; it breathes (see sheet.svg).', [1, 2, 3].map((n) => shipWith({ shields: n }))],
  ['Armor', 'Plating cut to the hull\'s shape, further back each level.', [1, 3, 5].map((n) => shipWith({ armor: n }))],
  ['Jump range', 'The pods themselves grow longer: they hold the capacitors. No cone added.', [2, 3, 4].map((n) => shipWith({}, { range: n }))]
]
const LOADOUTS = [
  ['A new pilot', shipWith()],
  ['A trader', shipWith({ pointDefense: 2, miningDrones: 20 }, { bays: 150, droneBays: 20, range: 3 })],
  ['A raider', shipWith({ railguns: 2, missiles: 1, armor: 2, shields: 1, drones: 30 }, { bays: 60, droneBays: 30, range: 2 })],
  ['Everything', shipWith({ railguns: 2, missiles: 1, armor: 5, shields: 3, drones: 80, miningDrones: 40, repairBots: 6 }, { bays: 130, droneBays: 120, range: 4 })]
]

const W = 1440
const CELL = 132
let body = T(30, 40, 'The Orbiter 8\'s upgrades, re-drawn: round 5', { size: 18, weight: 700, fill: '#fff' })
body += T(30, 62, 'Two kinds of thing (Koda): what\'s on the outside changes the ship\'s shape; what\'s inside you wouldn\'t see on a ship flying by. So two pictures: the ship as it flies, and the ship opened up.', { size: 12.5, fill: '#c3b3da' })
let y = 92
body += T(30, y + 12, 'ON THE OUTSIDE: THREE STEPS OF EACH', { size: 11, weight: 700, fill: '#c9b6ff' })
y += 26
OUTSIDE.forEach(([name, text, ships], i) => {
  const x = 30 + (i % 2) * 700
  const cy = y + Math.floor(i / 2) * (CELL + 28)
  ships.forEach((ship, k) => (body += frame(x + k * (CELL + 8), cy, CELL, newShip(ship))))
  body += T(x + 3 * (CELL + 8) + 10, cy + 24, name, { size: 14.5, weight: 700, fill: '#fff' })
  const words = text.split(' ')
  let line = ''
  let n = 0
  for (const word of words) {
    if ((line + ' ' + word).length > 34) {
      body += T(x + 3 * (CELL + 8) + 10, cy + 46 + n * 16, line.trim(), { size: 11.5, fill: '#c3b3da' })
      n++
      line = word
    } else line += ' ' + word
  }
  body += T(x + 3 * (CELL + 8) + 10, cy + 46 + n * 16, line.trim(), { size: 11.5, fill: '#c3b3da' })
})
y += Math.ceil(OUTSIDE.length / 2) * (CELL + 28) + 8
body += `<rect x="30" y="${y}" width="${W - 60}" height="1" fill="#ffffff" opacity="0.12"/>` + T(30, y + 28, 'WHOLE SHIPS: AS THEY FLY, AND OPENED UP', { size: 11, weight: 700, fill: '#c9b6ff' })
y += 44
const BIG = 300
LOADOUTS.forEach(([name, ship], i) => {
  const x = 30 + i * 348
  body += frame(x, y, BIG, newShip(ship)) + T(x, y + BIG + 22, name, { size: 14.5, weight: 700, fill: '#fff' }) + T(x + BIG, y + BIG + 22, 'as it flies', { size: 11, fill: '#9088aa', anchor: 'end' })
  body += frame(x, y + BIG + 36, BIG, insideShip(ship)) + T(x + BIG, y + BIG * 2 + 56, 'opened up: holds and drone bays, bots, capacitors', { size: 11, fill: '#9088aa', anchor: 'end' })
  body += frame(x, y + BIG * 2 + 70, 64, newShip(ship)) + frame(x + 74, y + BIG * 2 + 70, 44, newShip(ship)) + T(x + 130, y + BIG * 2 + 100, 'at 64 and 44 px', { size: 10.5, fill: '#9088aa' })
})
const H = y + BIG * 2 + 154
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="Ubuntu, 'Segoe UI', sans-serif">\n<rect width="${W}" height="${H}" fill="#130e24"/>\n${body}\n</svg>\n`
fs.mkdirSync(OUT, { recursive: true })
fs.writeFileSync(path.join(OUT, 'sheet.svg'), svg)
console.log('wrote sheet.svg')
if (process.argv.includes('--png')) {
  const { default: puppeteer } = await import('puppeteer-core')
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', args: ['--no-sandbox'] })
  const page = await browser.newPage()
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 })
  await page.setContent(`<body style="margin:0">${svg}</body>`)
  await page.screenshot({ path: path.join(OUT, 'sheet.png') })
  console.log('wrote sheet.png')
  await browser.close()
}
