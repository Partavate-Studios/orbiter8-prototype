// The Orbiter 8 drawn from what's fitted to it (docs/demo4-plan.md, D25; redrawn 2026-11-22 from Koda's
// rounds on docs/mockups/ship-upgrades/). Two pictures:
// - As it flies (shipSvg, shipArtParts): only what changes the ship's shape. This is the NFT's image,
//   and it mirrors contracts/src/art/ShipArt.sol character for character (sdk/ship-art.test.js pins
//   Solidity's hashes). Only numbers and fixed strings go in, so the result is safe to place in the page.
// - Opened up (shipInsideParts): what's fitted inside, which a ship flying by doesn't show. The game's
//   only; the contract doesn't draw it.
// The Orbiter 8 is a frame you build out, like a flatbed truck (Koda): the fuselage is a big bay for
// cargo holds and drone bays; the pods are engines and hold the capacitor bank. One family of colors:
// the hull's white, two lavenders, a dark inset; the shield is blue, damage pink, the capacitors warm.
import { SHIP_DESIGNS } from './ship-designs'

const HULL = SHIP_DESIGNS.orbiter8.d

// The hull, nose up, centered: the fuselage is 847 either side, from its nose at -2300 to its skirt at
// about 1270, its sides straight from -1453 to -358 and from -160 to 430; a pod each side is centered
// 1820 out, 478 either side, from about -640 to 950; struts join them at about -400.

/** One longer pod (jump range): the pod's lower end again, `len` further down. */
const pod = (a, b, c, d, e, f, len) =>
  `M${a} 330V${640 + len}L${b} ${700 + len}V${800 + len}L${c} ${950 + len}H${d}L${e} ${800 + len}V${700 + len}L${f} ${640 + len}V330z`

/** Longer range: the pods themselves are longer, 170 a step (they hold the capacitor bank). Empty at range 1. */
const pods = (range) => {
  const len = (Math.min(4, Math.max(1, range)) - 1) * 170
  return len ? pod(-2298, -2130, -2200, -1440, -1510, -1342, len) + pod(1342, 1510, 1440, 2200, 2130, 2298, len) : ''
}

/** The shield: the ship's own outline, fat and blue, behind it; fatter each level; it breathes. */
const shield = (levels, id, long) =>
  levels
    ? `<g fill="none" stroke="#7fd4ff" stroke-width="${180 + levels * 130}" stroke-linejoin="round"><use href="#${id}h"/>` +
      (long ? `<use href="#${id}p"/>` : '') +
      '<animate attributeName="stroke-opacity" values="0.9;0.45;0.9" dur="5s" repeatCount="indefinite"/></g>'
    : ''

/** Railguns: twin rails with a breech, small against so big a ship: one beside each shoulder of the fuselage, the third down the spine. */
const railguns = (count) => {
  const xs = [-960, 960, 0]
  const tops = [-1950, -1950, -2600]
  const lengths = [1250, 1250, 760]
  let out = ''
  for (let i = 0; i < count && i < 3; i++) {
    const x = xs[i]
    const t = tops[i]
    out +=
      `<g fill="#e6dcf5" stroke="#8f7fb0" stroke-width="26"><rect x="${x - 78}" y="${t}" width="52" height="${lengths[i]}"/>` +
      `<rect x="${x + 26}" y="${t}" width="52" height="${lengths[i]}"/>` +
      `<rect x="${x - 105}" y="${t + lengths[i] - 360}" width="210" height="320" rx="44"/>` +
      `<rect x="${x - 92}" y="${t + 220}" width="184" height="64"/></g>`
  }
  return out
}

/** Armor: plating cut to the hull's shape, growing back from the nose and the pods' fronts, further each level. */
const armor = (levels, id) => {
  if (!levels) return ''
  const n = Math.min(5, levels)
  const fy = -1820 + n * 290
  const py = -430 + n * 190
  return (
    `<g clip-path="url(#${id}c)" fill="#b9a6d6"><rect x="-900" y="-2400" width="1800" height="${fy + 2400}"/>` +
    `<rect x="-2400" y="-800" width="1160" height="${py + 800}"/><rect x="1240" y="-800" width="1160" height="${py + 800}"/>` +
    `<path d="M-900 ${fy}h1800M-2400 ${py}h1160M1240 ${py}h1160" stroke="#8f7fb0" stroke-width="50"/></g>`
  )
}

/** Missile racks: six round ports each, set into the fuselage, a rack below a rack. Never on the pods: those are engines. */
const missiles = (count) => {
  let out = ''
  for (let i = 0; i < count && i < 3; i++) {
    for (let k = 0; k < 6; k++) {
      out += `<circle cx="${-240 + (k % 3) * 240}" cy="${-1150 + i * 560 + Math.floor(k / 3) * 240}" r="80" fill="#2a1a4a"/>`
    }
  }
  return out
}

/** Point defense: dots in the hull's own color on its edge, in pairs: the nose, then down the fuselage's sides. */
const turrets = (count) => {
  const xs = [-600, 600, -847, 847, -847, 847]
  const ys = [-2051, -2051, -40, -40, 300, 300]
  let out = ''
  for (let i = 0; i < count && i < 6; i++) out += `<circle cx="${xs[i]}" cy="${ys[i]}" r="125" fill="#e6dcf5"/>`
  return out
}

/** Damage: cracks in pink (it needs you). */
const SCARS =
  '<g fill="none" stroke="#ff6fb0" stroke-width="56" stroke-linecap="round" stroke-linejoin="round">' +
  '<path d="M-1050 620l190 150l-130 170l250 130"/><path d="M180 -1020l-150 140l170 120"/><path d="M1620 550l150 170l-190 120"/></g>'

/**
 * The ship as it flies, without the NFT's frame (its <svg> and background): for drawing inline in the
 * game, in a viewBox of SHIP_ART_VIEWBOX.
 * @param {{ range?: number, rangeLost: number, baysLost: number, loadout: object }} ship  (game.js pilot().ship)
 * @param {boolean} scarred  damaged in battle, beyond engines and bays
 * @param {string} id  a prefix for the drawing's ids, when more than one ship is drawn in a page
 */
export function shipArtParts(ship, scarred = false, id = '') {
  const l = ship.loadout
  const long = pods(ship.range ?? 1)
  return (
    `<defs><path id="${id}h" transform="translate(-2300,-2300)" d="${HULL}"/>` +
    (long ? `<path id="${id}p" d="${long}"/>` : '') +
    `<clipPath id="${id}c"><use href="#${id}h"/></clipPath></defs>` +
    shield(l.shields, id, Boolean(long)) +
    railguns(l.railguns) +
    `<use href="#${id}h" fill="#e6dcf5" stroke="#8f7fb0" stroke-width="40"/>` +
    (long
      ? `<use href="#${id}p" fill="#e6dcf5" stroke="#8f7fb0" stroke-width="40" stroke-linejoin="round"/>` +
        '<rect x="-2278" y="300" width="916" height="60" fill="#e6dcf5"/><rect x="1362" y="300" width="916" height="60" fill="#e6dcf5"/>'
      : '') +
    armor(l.armor, id) +
    missiles(l.missiles) +
    turrets(l.pointDefense) +
    (scarred || ship.rangeLost > 0 || ship.baysLost > 0 ? SCARS : '')
  )
}

export const SHIP_ART_VIEWBOX = '-2800 -2800 5600 5600'

/** The NFT's picture, identical to ShipArt.sol's tokenURI image (pinned by hashes in the tests). */
export function shipSvg(ship, scarred = false) {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${SHIP_ART_VIEWBOX}">` +
    '<rect x="-2800" y="-2800" width="5600" height="5600" fill="#160631"/>' +
    shipArtParts(ship, scarred) +
    '</svg>'
  )
}

/**
 * The ship opened up, as a yard or its details show it (the game's only): the hull as a drawing, and
 * what's fitted inside. The bay takes the fuselage: cargo holds fill it from the back, then drone bays
 * (a dart for battle drones, a ring for mining drones), a cell for every ten. The repair bots are
 * racked in the nose. The capacitor bank is in the pods, a cell a step of range.
 * @param {{ bays: number, droneBays?: number, range?: number, loadout: object }} ship
 */
export function shipInsideParts(ship) {
  const l = ship.loadout
  const range = Math.min(4, Math.max(1, ship.range ?? 1))
  const long = pods(range)
  let out =
    `<path transform="translate(-2300,-2300)" d="${HULL}" fill="#1d1436" stroke="#8f7fb0" stroke-width="50"/>` +
    (long ? `<path d="${long}" fill="#1d1436" stroke="#8f7fb0" stroke-width="50" stroke-linejoin="round"/><rect x="-2273" y="300" width="906" height="60" fill="#1d1436"/><rect x="1367" y="300" width="906" height="60" fill="#1d1436"/>` : '') +
    '<rect x="-740" y="-1560" width="1480" height="2500" rx="120" fill="#150f28" stroke="#8f7fb0" stroke-width="36" stroke-dasharray="90 60"/>'
  const cargoCells = Math.min(25, Math.ceil(ship.bays / 10))
  const battle = Math.ceil((l.drones ?? 0) / 10)
  const mining = Math.ceil((l.miningDrones ?? 0) / 10)
  const droneCells = Math.min(25 - cargoCells, Math.max(Math.ceil((ship.droneBays ?? 0) / 10), battle + mining))
  for (let i = 0; i < cargoCells + droneCells; i++) {
    const x = -680 + (i % 5) * 276
    const y = 410 - Math.floor(i / 5) * 480
    const k = i - cargoCells
    if (k < 0) {
      out += `<rect x="${x}" y="${y}" width="256" height="440" rx="50" fill="#b9a6d6"/><path d="M${x + 50} ${y + 150}h156M${x + 50} ${y + 290}h156" stroke="#8f7fb0" stroke-width="30"/>`
    } else {
      out += `<rect x="${x}" y="${y}" width="256" height="440" rx="50" fill="none" stroke="#b9a6d6" stroke-width="34"/>`
      if (k < battle) out += `<path d="M${x + 128} ${y + 90}l90 250l-90 -62l-90 62z" fill="#e6dcf5"/>`
      else if (k < battle + mining) out += `<circle cx="${x + 128}" cy="${y + 220}" r="70" fill="none" stroke="#e6dcf5" stroke-width="40"/>`
    }
  }
  for (let i = 0; i < 4; i++) {
    const on = i < range
    for (const cx of [-1820, 1820]) {
      out += `<rect x="${cx - 300}" y="${440 - i * 250}" width="600" height="190" rx="50" fill="${on ? '#ffd2a1' : 'none'}" stroke="${on ? '#ffd2a1' : '#8f7fb0'}" stroke-width="30"${on ? '' : ' stroke-dasharray="60 50"'}/>`
    }
  }
  for (let i = 0; i < (l.repairBots ?? 0) && i < 6; i++) {
    const x = -450 + i * 180
    out += `<path d="M${x - 62} -1910v160M${x + 62} -1910v160" stroke="#b9a6d6" stroke-width="26" stroke-linecap="round"/><rect x="${x - 45}" y="-1930" width="90" height="200" rx="40" fill="#b9a6d6"/>`
  }
  return out
}
