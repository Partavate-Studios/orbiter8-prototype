// Parts that go aboard an Orbiter 8 (Factory ids 0–6 and 9, D59, D75): each one's loadout field, which slot of
// Battle's condition counts it out of action, and the room it takes.
export const SHIP_PARTS = [
  { id: 3, field: 'railguns', off: 1, space: '2 mounts each' },
  { id: 4, field: 'missiles', off: 2, space: '2 mounts each' },
  { id: 2, field: 'pointDefense', off: 0, space: '1 mount each' },
  { id: 0, field: 'drones', off: 3, space: '1 drone bay each' },
  { id: 9, field: 'miningDrones', space: '1 drone bay each, never lost' },
  { id: 1, field: 'repairBots', off: 4, space: '5 holds each' },
  { id: 5, field: 'armor', space: '10 holds a level, up to 5' },
  { id: 6, field: 'shields', space: '20 holds a level, up to 3' }
]

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
