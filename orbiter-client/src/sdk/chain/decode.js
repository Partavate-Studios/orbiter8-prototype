// Turns the game contract's unnamed return tuples into named objects. This is the only place that
// knows their layouts: if a contract's return values change, this file (and its tests) changes.
// Values have already been through toPlain (bigints are numbers).

/**
 * @typedef {object} SystemData  getPlayerSystemData(): the system the player's ship is in
 * @property {number} id
 * @property {string} name
 * @property {number} size
 * @property {number} birthTime
 * @property {string} discoveredBy  address, lowercase
 * @property {number[]} neighborIds  fixed-length; 0 = empty slot
 * @property {number[]} planetIds  indexed by orbital position; 0 = no planet
 * @property {number[]} shipIds  fixed-length; 0 = empty slot
 */

/** @returns {SystemData} */
export function decodeSystem(tuple) {
  return {
    id: parseInt(tuple[0]),
    name: tuple[1],
    size: tuple[2],
    birthTime: tuple[3],
    discoveredBy: String(tuple[4]).toLowerCase(),
    neighborIds: tuple[5],
    planetIds: tuple[6],
    shipIds: tuple[7]
  }
}

/**
 * getPlanet(id). `hasMoons` has one flag per moon orbit (8 slots).
 * @param {number | string} id
 */
export function decodePlanet(id, tuple) {
  return {
    id: String(id),
    name: tuple[0],
    star: tuple[1],
    size: parseInt(tuple[2][0]),
    class: parseInt(tuple[2][1]),
    rings: parseInt(tuple[2][2]),
    orbitSpeed: parseInt(tuple[2][3]),
    owner: String(tuple[3]).toLowerCase(),
    hasMoons: tuple[4],
    hasStation: tuple[5]
  }
}

/**
 * getStation(planetId). A positive inventory is for sale; a negative one is what the port buys.
 * Prices are per unit, plus the price of one cargo hold.
 */
export function decodeStation(planetId, tuple) {
  return {
    id: planetId,
    name: String(tuple[0]),
    size: parseInt(tuple[1]),
    inventory: {
      equipment: parseInt(tuple[2][0]),
      fuel: parseInt(tuple[2][1]),
      organics: parseInt(tuple[2][2])
    },
    prices: {
      equipment: parseInt(tuple[3][0]),
      fuel: parseInt(tuple[3][1]),
      organics: parseInt(tuple[3][2]),
      holds: parseInt(tuple[3][3])
    }
  }
}

/** getMoon(planetId, moonId). Moons are numbered per planet by orbit. */
export function decodeMoon(planetId, moonId, tuple) {
  return {
    id: String(moonId),
    name: String(tuple[0]),
    planet: planetId,
    size: parseInt(tuple[1]),
    class: parseInt(tuple[2]),
    orbitSpeed: parseInt(tuple[3])
  }
}

/** getShip(id). `orbit` is the id of the planet the ship is at (0 = orbiting the star). */
export function decodeShip(id, tuple) {
  return {
    id,
    name: tuple[0],
    location: tuple[1],
    orbit: tuple[2],
    owner: String(tuple[3]).toLowerCase()
  }
}

/** getMyShip(): the player's ship, with its cargo. */
export function decodeMyShip(tuple) {
  return {
    name: tuple[0],
    location: tuple[1],
    orbit: tuple[2],
    holds: parseInt(tuple[3]),
    equipment: parseInt(tuple[4]),
    fuel: parseInt(tuple[5]),
    organics: parseInt(tuple[6])
  }
}
