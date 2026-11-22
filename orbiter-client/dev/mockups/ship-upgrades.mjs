// Draws docs/mockups/ship-upgrades/sheet.svg (and its PNG with --png): a new concept for how the
// Orbiter 8's upgrades are drawn (Koda, 2026-11-21: "the color is bad, the shapes don't cut it... you
// can re-conceptualize them completely"), beside today's (sdk/src/ship-art.js, the NFT's own picture).
// A proposal: once Koda agrees, the new parts go into sdk/src/ship-art.js and contracts/src/art/ShipArt.sol
// together (they must match character for character), so each part is kept to a few simple shapes.
//   npx vite-node dev/mockups/ship-upgrades.mjs [--png]     (from orbiter-client/)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { shipArtParts, SHIP_ART_VIEWBOX } from '../../../sdk/src/ship-art.js'
import { SHIP_DESIGNS } from '../../../sdk/src/ship-designs.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(here, '../../../docs/mockups/ship-upgrades')
const HULL_D = SHIP_DESIGNS.orbiter8.d

// ── the new concept, round 2 (Koda's notes on round 1, 2026-11-21) ───────────
// The Orbiter 8 is a frame you build out, like a flatbed truck: a big empty bay in the fuselage, and
// what you fit goes inside it. So:
// - the fuselage always shows its bay; cargo holds and drone bays fill it, cell by cell;
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
const WELL = '#d3c7ea'
const GLOW = '#ffd2a1'
const COLD = '#cfd9ff'
const PINK = '#ff6fb0'
// The hull, nose up, centered: the fuselage is ±847 wide from its nose at -2300 to its skirt at about
// 1270; a pod each side is centered ±1820, ±475 wide, from about -640 to 950.
const hullPath = (attrs) => `<path transform="translate(-2300,-2300)" d="${HULL_D}" ${attrs}/>`

/** A shield wraps the hull: its outline again, wider and fainter, a band a level. */
const shield = (levels) => {
  let out = ''
  for (let i = levels; i > 0; i--) out += hullPath(`fill="none" stroke="${COLD}" stroke-width="${150 + i * 150}" stroke-opacity="0.13" stroke-linejoin="round"`)
  if (levels) out += hullPath(`fill="none" stroke="${COLD}" stroke-width="130" stroke-opacity="0.75" stroke-linejoin="round"`)
  return out
}
/** Longer range: longer thrusters under the fuselage and each pod, a warm tip on them. */
const thrusters = (range) => {
  const len = Math.min(3, range - 1) * 190
  if (len <= 0) return ''
  const bell = (x, y, top, bottom) => `<path d="M${x - top} ${y}h${top * 2}l${bottom - top} ${len}h${-bottom * 2}z" fill="${HULL}" stroke="${LINE}" stroke-width="40" stroke-linejoin="round"/><rect x="${x - bottom + 50}" y="${y + len - 75}" width="${bottom * 2 - 100}" height="50" rx="25" fill="${GLOW}"/>`
  return bell(-1820, 900, 250, 330) + bell(1820, 900, 250, 330) + bell(0, 1210, 400, 500)
}
/**
 * The bay: the fuselage's open inside, always there. Cargo holds fill it from the back, then drone
 * bays (each with a dart in it), a cell for every ten.
 */
const bay = (holds, droneBays) => {
  let out = `<rect x="-540" y="-460" width="1080" height="1280" rx="90" fill="${WELL}" stroke="${LINE}" stroke-width="36"/>`
  const cargoCells = Math.min(25, Math.ceil(holds / 10))
  const droneCells = Math.min(25 - cargoCells, Math.ceil(droneBays / 10))
  for (let i = 0; i < cargoCells + droneCells; i++) {
    const x = -485 + (i % 5) * 200
    const y = 560 - Math.floor(i / 5) * 240
    if (i < cargoCells) out += `<rect x="${x}" y="${y}" width="170" height="200" rx="34" fill="${LINE}"/>`
    else out += `<rect x="${x}" y="${y}" width="170" height="200" rx="34" fill="${DARK}"/><path d="M${x + 85} ${y + 45}l55 115l-55 -32l-55 32z" fill="${HULL}"/>`
  }
  return out
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
/** Battle drones: darts flying escort off the tail, one for every ten. */
const drones = (count, below) => {
  let out = ''
  for (let i = 0; i < Math.min(8, Math.ceil(count / 10)); i++) {
    const x = (i % 2 === 0 ? -1 : 1) * (760 + Math.floor(i / 2) * 430)
    const y = 1900 + below + Math.floor(i / 2) * 150
    out += `<path d="M${x} ${y - 170}l125 330l-125 -80l-125 80z" fill="${HULL}"/>`
  }
  return out
}
/** Mining drones: rings in a line astern, one for every ten. */
const miners = (count, below) => {
  let out = ''
  const n = Math.min(4, Math.ceil(count / 10))
  for (let i = 0; i < n; i++) out += `<circle cx="${(i - (n - 1) / 2) * 300}" cy="${1560 + below}" r="80" fill="none" stroke="${HULL}" stroke-width="54"/>`
  return out
}
/** Repair bots: small crawlers in a column each side of the bay. */
const bots = (count) => {
  let out = ''
  for (let i = 0; i < count && i < 6; i++) {
    const x = i % 2 === 0 ? -690 : 690
    const y = -250 + Math.floor(i / 2) * 330
    out += `<path d="M${x - 105} ${y - 45}h210M${x - 105} ${y + 45}h210" stroke="${DARK}" stroke-width="30" stroke-linecap="round"/><rect x="${x - 60}" y="${y - 80}" width="120" height="160" rx="46" fill="${DARK}"/>`
  }
  return out
}
/** Damage: cracks in pink (it needs you), not dark holes. */
const SCARS = `<g fill="none" stroke="${PINK}" stroke-width="56" stroke-linecap="round" stroke-linejoin="round"><path d="M-1050 620l190 150l-130 170l250 130"/><path d="M180 -1020l-150 140l170 120"/><path d="M1620 550l150 170l-190 120"/></g>`

let clips = 0
function newShip(ship, scarred = false) {
  const l = ship.loadout
  const clip = 'hull' + ++clips
  const below = Math.min(3, (ship.range ?? 1) - 1) * 190
  return (
    `<clipPath id="${clip}">${hullPath('')}</clipPath>` +
    shield(l.shields) +
    drones(l.drones, below) +
    miners(l.miningDrones ?? 0, below) +
    railguns(l.railguns) +
    thrusters(ship.range ?? 1) +
    hullPath(`fill="${HULL}" stroke="${LINE}" stroke-width="40"`) +
    armor(l.armor, clip) +
    bay(ship.bays, ship.droneBays ?? 0) +
    missiles(l.missiles) +
    turrets(l.pointDefense) +
    bots(l.repairBots) +
    (scarred ? SCARS : '')
  )
}

// ── the sheet ────────────────────────────────────────────────────────────────
const none = { railguns: 0, missiles: 0, pointDefense: 0, drones: 0, miningDrones: 0, repairBots: 0, armor: 0, shields: 0 }
const shipWith = (loadout = {}, extra = {}) => ({ bays: 5, range: 1, rangeLost: 0, baysLost: 0, loadout: { ...none, ...loadout }, ...extra })
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
const T = (x, y, s, { size = 13, fill = '#f1eefa', weight = 400, anchor = 'start' } = {}) => `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" font-weight="${weight}" text-anchor="${anchor}">${esc(s)}</text>`
const frame = (x, y, size, inner) => `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="12" fill="#160f2c" stroke="#3f3566"/><svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="${SHIP_ART_VIEWBOX}">${inner}</svg>`

const PARTS = [
  ['The bay', 'The fuselage is a big empty bay. Cargo holds fill it from the back, then drone bays, a cell for every ten.', shipWith({}, { bays: 120, droneBays: 40 })],
  ['Railguns', 'Twin white rails with a breech along each pod; the third down the spine.', shipWith({ railguns: 3 })],
  ['Missile racks', 'Six tubes set into each pod; the third in the nose.', shipWith({ missiles: 3 })],
  ['Point defense', 'A ring and a stub of a barrel, in pairs.', shipWith({ pointDefense: 6 })],
  ['Armor', 'Plating that grows back from the nose and the pods, cut to the hull\'s shape: further each level.', shipWith({ armor: 3 })],
  ['Shields', 'The hull\'s own outline, wider and fainter: it wraps the ship. A band a level.', shipWith({ shields: 3 })],
  ['Battle drones', 'Darts flying escort off the tail, one for every ten. (Kept from round 1.)', shipWith({ drones: 60 })],
  ['Mining drones', 'Rings in a line astern. Not drawn today.', shipWith({ miningDrones: 30 })],
  ['Repair bots', 'Small crawlers in a column each side of the bay.', shipWith({ repairBots: 6 })],
  ['Jump range', 'Longer thrusters, a step a level. Not drawn today.', shipWith({}, { range: 4 })],
  ['Damage', 'Cracks in pink (it needs you), not dark holes.', shipWith({}, { rangeLost: 1 }), true]
]
const LOADOUTS = [
  ['A new pilot', shipWith()],
  ['A trader', shipWith({ pointDefense: 2, miningDrones: 20 }, { bays: 150, droneBays: 20, range: 3 })],
  ['A raider', shipWith({ railguns: 2, missiles: 1, armor: 2, shields: 1, drones: 30 }, { bays: 60, droneBays: 30, range: 2 })],
  ['Everything', shipWith({ railguns: 2, missiles: 1, armor: 5, shields: 3, drones: 80, miningDrones: 40, repairBots: 6 }, { bays: 130, droneBays: 120, range: 4 })]
]

const W = 1440
const CELL = 150
let body = T(30, 40, 'The Orbiter 8\'s upgrades, re-drawn: round 2', { size: 18, weight: 700, fill: '#fff' })
body += T(30, 62, 'A frame you build out: the fuselage is a big empty bay and what you fit goes inside it. The pods carry the weapons. Armor and the shield follow the hull\'s own shape. Longer range is longer thrusters.', { size: 12.5, fill: '#c3b3da' })
let y = 96
PARTS.forEach(([name, text, ship, scarred], i) => {
  const col = i % 3
  const row = Math.floor(i / 3)
  const x = 30 + col * 470
  const cy = y + row * (CELL + 62)
  body += frame(x, cy, CELL, shipArtParts(ship, scarred)) + T(x + CELL / 2, cy + CELL + 16, 'today', { size: 11, fill: '#9088aa', anchor: 'middle' })
  body += frame(x + CELL + 12, cy, CELL, newShip(ship, scarred)) + T(x + CELL + 12 + CELL / 2, cy + CELL + 16, 'proposed', { size: 11, fill: '#c9b6ff', anchor: 'middle' })
  body += T(x + CELL * 2 + 26, cy + 22, name, { size: 14.5, weight: 700, fill: '#fff' })
  const words = text.split(' ')
  let line = ''
  let n = 0
  for (const word of words) {
    if ((line + ' ' + word).length > 22) {
      body += T(x + CELL * 2 + 26, cy + 44 + n * 16, line.trim(), { size: 11.5, fill: '#c3b3da' })
      n++
      line = word
    } else line += ' ' + word
  }
  body += T(x + CELL * 2 + 26, cy + 44 + n * 16, line.trim(), { size: 11.5, fill: '#c3b3da' })
})
y += Math.ceil(PARTS.length / 3) * (CELL + 62) + 16
body += `<rect x="30" y="${y}" width="${W - 60}" height="1" fill="#ffffff" opacity="0.12"/>` + T(30, y + 28, 'WHOLE SHIPS', { size: 11, weight: 700, fill: '#c9b6ff' })
y += 44
const BIG = 300
LOADOUTS.forEach(([name, ship], i) => {
  const x = 30 + i * 348
  body += frame(x, y, BIG, newShip(ship)) + T(x, y + BIG + 22, name, { size: 14.5, weight: 700, fill: '#fff' })
  // today's, and both at the size the card and the pilot plate show them
  body += frame(x, y + BIG + 36, 92, shipArtParts(ship)) + T(x + 46, y + BIG + 144, 'today', { size: 11, fill: '#9088aa', anchor: 'middle' })
  body += frame(x + 104, y + BIG + 36, 92, newShip(ship)) + T(x + 150, y + BIG + 144, 'proposed', { size: 11, fill: '#c9b6ff', anchor: 'middle' })
  body += frame(x + 208, y + BIG + 36, 44, newShip(ship)) + T(x + 230, y + BIG + 96, '44 px', { size: 10, fill: '#9088aa', anchor: 'middle' })
})
const H = y + BIG + 170
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
