// The Orbiter 8 drawn from what it carries (docs/demo4-plan.md, D25), mirroring
// contracts/src/art/ShipArt.sol character for character: the NFT's image and the client's
// picture are the same drawing (sdk/ship-art.test.js pins Solidity's hashes). Only numbers and
// fixed strings go in, so the result is safe to place in the page.
import { SHIP_DESIGNS } from '@/components/assets/ship-designs'

const HULL = SHIP_DESIGNS.orbiter8.d

const shield = (levels) =>
  levels
    ? `<ellipse cx="0" cy="200" rx="2700" ry="2650" fill="#7fd4ff" fill-opacity="0.${levels * 6}" stroke="#7fd4ff" stroke-width="${levels * 30}"/>`
    : ''

const cargo = (bays) => {
  let out = ''
  for (let i = 0; i < Math.floor(bays / 50); i++) {
    out += `<rect x="-260" y="${1700 + i * 170}" width="520" height="140" rx="60" fill="#b9a6d6"/>`
  }
  return out
}

const railguns = (count) => {
  const xs = [-1800, 1800, 0]
  const tops = [-1500, -1500, -2700]
  let out = ''
  for (let i = 0; i < count && i < 3; i++) {
    out += `<rect x="${xs[i] - 50}" y="${tops[i]}" width="100" height="900" fill="#ffd65c"/>`
  }
  return out
}

const missiles = (count) => {
  const xs = [-1250, 1050, -100]
  let out = ''
  for (let i = 0; i < count && i < 3; i++) {
    out +=
      `<g fill="#ff8a5c"><rect x="${xs[i]}" y="-100" width="60" height="320"/>` +
      `<rect x="${xs[i] + 70}" y="-100" width="60" height="320"/>` +
      `<rect x="${xs[i] + 140}" y="-100" width="60" height="320"/></g>`
  }
  return out
}

const turrets = (count) => {
  const xs = [0, -700, 700, -1800, 1800, 0]
  const ys = [-1300, 300, 300, 500, 500, 900]
  let out = ''
  for (let i = 0; i < count && i < 6; i++) out += `<circle cx="${xs[i]}" cy="${ys[i]}" r="110" fill="#5cffc8"/>`
  return out
}

const drones = (count) => {
  if (!count) return ''
  const marks = Math.min(8, Math.ceil(count / 10))
  let out = ''
  for (let i = 0; i < marks; i++) {
    out += `<path d="M-150 ${400 + i * 130}l150 90l150 -90" fill="none" stroke="#c38bff" stroke-width="50"/>`
  }
  return out
}

const bots = (count) => {
  let out = ''
  for (let i = 0; i < count && i < 6; i++) {
    out += `<rect x="${i % 2 === 0 ? -520 : 400}" y="${1000 + Math.floor(i / 2) * 200}" width="120" height="140" rx="40" fill="#9effa0"/>`
  }
  return out
}

const SCARS =
  '<g fill="#1c0838" fill-opacity="0.7"><circle cx="-900" cy="900" r="160"/><circle cx="300" cy="-600" r="120"/><circle cx="1500" cy="1400" r="140"/></g>'

/**
 * @param {{ bays: number, rangeLost: number, baysLost: number, loadout: object }} ship  (game.js pilot().ship)
 * @param {boolean} scarred  damaged in battle, beyond engines and bays
 */
export function shipSvg(ship, scarred = false) {
  const l = ship.loadout
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2800 -2800 5600 5600">' +
    '<rect x="-2800" y="-2800" width="5600" height="5600" fill="#160631"/>' +
    shield(l.shields) +
    cargo(ship.bays) +
    `<path transform="translate(-2300,-2300)" d="${HULL}" fill="#e6dcf5" stroke="#8f7fb0" stroke-width="${40 + l.armor * 50}"/>` +
    railguns(l.railguns) +
    missiles(l.missiles) +
    turrets(l.pointDefense) +
    drones(l.drones) +
    bots(l.repairBots) +
    (scarred || ship.rangeLost > 0 || ship.baysLost > 0 ? SCARS : '') +
    '</svg>'
  )
}
