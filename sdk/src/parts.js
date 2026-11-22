// Parts that go aboard an Orbiter 8 (Factory ids 0–6 and 9, D59, D75): each one's loadout field, which slot of
// Battle's condition counts it out of action, and the room it takes.
export const SHIP_PARTS = [
  { id: 3, field: 'railguns', off: 1, space: '2 mounts each', mounts: 2 },
  { id: 4, field: 'missiles', off: 2, space: '2 mounts each', mounts: 2 },
  { id: 2, field: 'pointDefense', off: 0, space: '1 mount each', mounts: 1 },
  { id: 0, field: 'drones', off: 3, space: '1 drone bay each', droneBay: true },
  { id: 9, field: 'miningDrones', space: '1 drone bay each, never lost', droneBay: true },
  { id: 1, field: 'repairBots', off: 4, space: '5 holds each', holds: 5 },
  { id: 5, field: 'armor', space: '10 holds a level, up to 5', holds: 10, max: 5 },
  { id: 6, field: 'shields', space: '20 holds a level, up to 3', holds: 20, max: 3 }
]

/** The ship's weapon mounts. */
export const SHIP_MOUNTS = 6

/**
 * How many more of a part the ship has room for, and what's in the way when it's none: its mounts
 * (weapons), its drone bays (drones), its free holds (bots, armor, shields), or the part's own limit.
 * @param {(typeof SHIP_PARTS)[number]} part
 * @param {{ droneBays?: number, loadout: object }} ship
 * @param {{ freeBays: number, dronesPerBay?: number }} room  free cargo holds, and drones a drone bay takes
 * @returns {{ fits: number, why: string }}
 */
export function partRoom(part, ship, { freeBays, dronesPerBay = 1 }) {
  const l = ship.loadout
  if (part.mounts) {
    const fits = Math.floor((SHIP_MOUNTS - mountsUsed(l)) / part.mounts)
    return { fits: Math.max(0, fits), why: fits > 0 ? '' : 'No mounts free' }
  }
  if (part.droneBay) {
    const fits = (ship.droneBays ?? 0) * dronesPerBay - (l.drones ?? 0) - (l.miningDrones ?? 0)
    return { fits: Math.max(0, fits), why: fits > 0 ? '' : 'No drone bay free' }
  }
  const left = part.max ? part.max - (l[part.field] ?? 0) : Infinity
  if (left <= 0) return { fits: 0, why: 'At its limit' }
  const fits = Math.min(left, Math.floor(freeBays / part.holds))
  return { fits: Math.max(0, fits), why: fits > 0 ? '' : 'No free holds' }
}

/** Factory's mining drone (D75): ship-only for now; bodies' drone pools come with the belts. */
export const MINING_DRONE = 9
/** Whether a part can go aboard a ship. */
export const fitsShip = (part) => SHIP_PARTS.some((p) => p.id === Number(part))

/** A part's name in the plural, for counts ("How many railguns"). */
const PLURALS = {
  Railgun: 'railguns',
  'Missile rack': 'missile racks',
  'Point defense': 'point-defense turrets',
  Drone: 'drones',
  'Mining drone': 'mining drones',
  'Repair bot': 'repair bots',
  'Armor plating': 'armor plates',
  'Shield generator': 'shield levels',
  'Orbital platform': 'orbital platforms',
  BFG: 'BFGs'
}
export const partPlural = (name) => PLURALS[name] ?? name.toLowerCase() + 's'

/** Weapon mounts in use (of 6): point defense 1, railguns and missile racks 2 each. */
export const mountsUsed = (l) => l.pointDefense + 2 * l.railguns + 2 * l.missiles
