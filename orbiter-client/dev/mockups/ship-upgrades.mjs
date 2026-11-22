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

// ── the new concept ──────────────────────────────────────────────────────────
// One ship, one family of colors: the white hull, two lavenders and a dark inset, so every part reads
// as the ship's own and is told apart by its shape. Two meanings keep a color of their own: the
// capacitors' star-charge (the warm glow engines already have) and the shield (a pale, cold line).
// Damage is pink, as everywhere. No yellow (that's "yours"), no greens or oranges.
const HULL = '#e6dcf5'
const PART = '#b9a6d6'
const LINE = '#8f7fb0'
const DARK = '#2a1a4a'
const GLOW = '#ffd2a1'
const COLD = '#cfd9ff'
const PINK = '#ff6fb0'
// The hull, nose up, centered: fuselage ±847 wide from the nose at -2300 to its tail at about 1650;
// a pod each side centered ±1820, ±475 wide, from -765 to 1400; struts between at about -500.

/** Shields: panelled rings round the ship, one a level, not a filled bubble. */
const shield = (levels) => {
  let out = levels ? `<ellipse cx="0" cy="150" rx="2480" ry="2500" fill="${COLD}" fill-opacity="0.05"/>` : ''
  for (let i = 0; i < levels; i++) out += `<ellipse cx="0" cy="150" rx="${2480 + i * 110}" ry="${2500 + i * 110}" fill="none" stroke="${COLD}" stroke-width="34" stroke-dasharray="430 80" stroke-opacity="${0.8 - i * 0.18}"/>`
  return out
}
/** Jump range: capacitor coils round each pod, one a step, glowing with the star's charge. */
const coils = (range) => {
  let out = ''
  for (let i = 0; i < range - 1 && i < 3; i++) {
    const y = 950 - i * 330
    out += `<rect x="-2345" y="${y}" width="1050" height="130" rx="65" fill="${GLOW}"/><rect x="1295" y="${y}" width="1050" height="130" rx="65" fill="${GLOW}"/>`
  }
  return out
}
/** Cargo: ribbed containers slung between the fuselage and the pods, one for every 50 holds. */
const cargo = (bays) => {
  let out = ''
  for (let i = 0; i < Math.floor(bays / 50) && i < 6; i++) {
    const x = i % 2 === 0 ? -1290 : 890
    const y = -80 + Math.floor(i / 2) * 430
    out += `<rect x="${x}" y="${y}" width="400" height="370" rx="80" fill="${PART}" stroke="${LINE}" stroke-width="40"/><path d="M${x + 60} ${y + 125}h280M${x + 60} ${y + 245}h280" stroke="${LINE}" stroke-width="40"/>`
  }
  return out
}
/** Armor: plates laid over the hull like scales, a band a level, from the nose back. */
const armor = (levels) => {
  let out = ''
  for (let i = 0; i < levels && i < 5; i++) {
    const y = -1250 + i * 520
    const py = -250 + i * 300
    out += `<path d="M-847 ${y}l847 -270l847 270M-2295 ${py}l475 -160l475 160M1345 ${py}l475 -160l475 160" fill="none" stroke="${LINE}" stroke-width="70" stroke-linejoin="round"/>`
  }
  return out
}
/** Railguns: twin rails with a breech, one along each pod, the third down the spine. */
const railguns = (count) => {
  const xs = [-2390, 2390, 0]
  const tops = [-1750, -1750, -2760]
  const lengths = [1900, 1900, 1250]
  let out = ''
  for (let i = 0; i < count && i < 3; i++) {
    const x = xs[i]
    const t = tops[i]
    out += `<rect x="${x - 85}" y="${t}" width="60" height="${lengths[i]}" fill="${PART}"/><rect x="${x + 25}" y="${t}" width="60" height="${lengths[i]}" fill="${PART}"/>` +
      `<rect x="${x - 120}" y="${t + lengths[i] - 520}" width="240" height="460" rx="50" fill="${LINE}"/><rect x="${x - 105}" y="${t + 260}" width="210" height="70" fill="${LINE}"/>`
  }
  return out
}
/** Missile racks: a box of six tubes on each strut, the third on the belly. */
const missiles = (count) => {
  const xs = [-1100, 1100, 0]
  const ys = [-470, -470, 520]
  let out = ''
  for (let i = 0; i < count && i < 3; i++) {
    const x = xs[i] - 220
    const y = ys[i] - 250
    out += `<rect x="${x}" y="${y}" width="440" height="500" rx="70" fill="${LINE}"/>`
    for (let k = 0; k < 6; k++) out += `<circle cx="${x + 130 + (k % 2) * 180}" cy="${y + 105 + Math.floor(k / 2) * 145}" r="52" fill="${DARK}"/>`
  }
  return out
}
/** Point defense: small domed turrets with a stub of a barrel, on the hull's shoulders and pods. */
const turrets = (count) => {
  const xs = [0, -560, 560, -1820, 1820, 0]
  const ys = [-1560, -820, -820, -420, -420, 1180]
  let out = ''
  for (let i = 0; i < count && i < 6; i++) out += `<rect x="${xs[i] - 32}" y="${ys[i] - 330}" width="64" height="260" fill="${DARK}"/><circle cx="${xs[i]}" cy="${ys[i]}" r="150" fill="${PART}" stroke="${DARK}" stroke-width="44"/>`
  return out
}
/** Battle drones: darts flying escort off the tail, one for every ten. */
const drones = (count) => {
  let out = ''
  for (let i = 0; i < Math.min(8, Math.ceil(count / 10)); i++) {
    const x = (i % 2 === 0 ? -1 : 1) * (760 + Math.floor(i / 2) * 430)
    const y = 2050 + Math.floor(i / 2) * 150
    out += `<path d="M${x} ${y - 170}l125 330l-125 -80l-125 80z" fill="${HULL}"/>`
  }
  return out
}
/** Mining drones: round-bodied, a claw each, clustered under the tail, one for every ten. */
const miners = (count) => {
  let out = ''
  const n = Math.min(4, Math.ceil(count / 10))
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * 330
    out += `<circle cx="${x}" cy="1980" r="105" fill="${PART}" stroke="${LINE}" stroke-width="36"/><path d="M${x - 70} 2110l30 110M${x + 70} 2110l-30 110" stroke="${LINE}" stroke-width="40" stroke-linecap="round"/>`
  }
  return out
}
/** Repair bots: little crawlers on the hull itself. */
const bots = (count) => {
  let out = ''
  for (let i = 0; i < count && i < 6; i++) {
    const x = i % 2 === 0 ? -520 : 520
    const y = 150 + Math.floor(i / 2) * 330
    out += `<path d="M${x - 150} ${y - 60}h300M${x - 150} ${y + 60}h300" stroke="${DARK}" stroke-width="34" stroke-linecap="round"/><rect x="${x - 85}" y="${y - 95}" width="170" height="190" rx="60" fill="${DARK}"/>`
  }
  return out
}
/** Damage: cracks in pink (it needs you), not dark holes. */
const SCARS = `<g fill="none" stroke="${PINK}" stroke-width="56" stroke-linecap="round" stroke-linejoin="round"><path d="M-1050 620l190 150l-130 170l250 130"/><path d="M180 -820l-150 140l170 120"/><path d="M1620 1050l150 170l-190 120"/></g>`

function newShip(ship, scarred = false) {
  const l = ship.loadout
  return (
    shield(l.shields) +
    drones(l.drones) +
    miners(l.miningDrones ?? 0) +
    `<path transform="translate(-2300,-2300)" d="${HULL_D}" fill="${HULL}" stroke="${LINE}" stroke-width="${40 + l.armor * 14}"/>` +
    coils(ship.range ?? 1) +
    cargo(ship.bays) +
    armor(l.armor) +
    railguns(l.railguns) +
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
  ['Railguns', 'Twin rails with a breech: one along each pod, the third down the spine.', shipWith({ railguns: 3 })],
  ['Missile racks', 'A box of six tubes on each strut, the third on the belly.', shipWith({ missiles: 3 })],
  ['Point defense', 'Small domed turrets with a stub of a barrel.', shipWith({ pointDefense: 6 })],
  ['Armor', 'Plates laid over the hull like scales, a band a level.', shipWith({ armor: 5 })],
  ['Shields', 'Panelled rings round the ship, one a level; not a bubble.', shipWith({ shields: 3 })],
  ['Battle drones', 'Darts flying escort off the tail, one for every ten.', shipWith({ drones: 60 })],
  ['Mining drones', 'Round-bodied, a claw each, under the tail. Not drawn today.', shipWith({ miningDrones: 30 })],
  ['Repair bots', 'Little crawlers on the hull itself.', shipWith({ repairBots: 6 })],
  ['Cargo holds', 'Ribbed containers slung beside the fuselage, one per 50 holds.', shipWith({}, { bays: 250 })],
  ['Jump range', 'Capacitor coils round each pod, glowing with a star\'s charge. Not drawn today.', shipWith({}, { range: 4 })],
  ['Damage', 'Cracks in pink (it needs you), not dark holes.', shipWith({}, { rangeLost: 1 }), true]
]
const LOADOUTS = [
  ['A new pilot', shipWith()],
  ['A trader', shipWith({ pointDefense: 2, miningDrones: 20 }, { bays: 150, range: 3 })],
  ['A raider', shipWith({ railguns: 2, missiles: 1, armor: 2, shields: 1, drones: 30 }, { bays: 60, range: 2 })],
  ['Everything', shipWith({ railguns: 1, missiles: 1, pointDefense: 2, armor: 5, shields: 3, drones: 80, miningDrones: 40, repairBots: 6 }, { bays: 250, range: 4 })]
]

const W = 1440
const CELL = 150
let body = T(30, 40, 'The Orbiter 8\'s upgrades, re-drawn', { size: 18, weight: 700, fill: '#fff' })
body += T(30, 62, 'One ship, one family of colors: the white hull, two lavenders and a dark inset. Parts are told apart by shape. Only the capacitors (a star\'s warm charge), the shield (a cold line) and damage (pink) keep a color.', { size: 12.5, fill: '#c3b3da' })
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
