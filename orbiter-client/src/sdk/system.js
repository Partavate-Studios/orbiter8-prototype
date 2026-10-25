// Turns a loaded star system (sdk/load.js loadSystem) into the game's objects: plain data, keyed by a
// stable identity, with their relationships and orbits resolved. No drawing data; renderers build
// their own sprites from these.
import {
  planetOrbitRadius,
  moonOrbitRadius,
  stationOrbitRadius,
  shipOrbitRadius,
  shipOrbitSpeed,
  SHIP_ORBIT_RADIUS_AROUND_STAR,
  STATION_ORBIT_SPEED
} from '@/sdk/game/orbits'

/** The star at the center of every system has a fixed key. */
export const STAR_KEY = 'star'

/**
 * A stable identity for an object, built from contract ids, so it stays the same across reloads even
 * when other objects appear or disappear. Moons are numbered per planet, so their key includes the planet.
 * @param {'star' | 'planet' | 'station' | 'moon' | 'ship'} type
 */
export function objectKey(type, { id, planet }) {
  switch (type) {
    case 'star':
      return STAR_KEY
    case 'moon':
      return `moon:${planet}:${id}`
    default:
      return `${type}:${id}`
  }
}

/**
 * @typedef {object} GameObject
 * @property {string} key  e.g. 'planet:3'
 * @property {'star' | 'planet' | 'station' | 'moon' | 'ship'} type
 * @property {number | string} id  the contract id (a moon's is its orbit number around its planet)
 * @property {number} objectId  `id` as a number
 * @property {string} name
 * @property {string | number} owner  address (lowercase), or 0 when unowned
 * @property {string} ownerName
 * @property {boolean} isMine  owned by the connected player
 * @property {string | null} orbiting  key of what it orbits (null for the star)
 * @property {{ radius: number, speed: number }} orbit  see sdk/game/orbits orbitAt()
 *
 * Plus, by type:
 * - star: size, birth
 * - planet: size, class, rings, orbitalPosition, hasStation, stationKey, stationName,
 *   moons ([{ moonId: key, moonName }])
 * - station: size, inventory, prices (see sdk/chain/decode decodeStation)
 * - moon: size, class, orbitalPosition, planet (the planet's id)
 * - ship: location (system id)
 */

/**
 * @param {object} system  what loadSystem() returns
 * @param {string} playerAccount  the connected address, lowercase
 * @returns {{ objects: Record<string, GameObject>, keys: { planets: string[], moons: string[], stations: string[], ships: string[] } }}
 *   `objects` is in drawing order: the star, each planet followed by its station and moons, then ships.
 */
export function buildSystem(system, playerAccount) {
  const objects = {}
  const keys = { planets: [], moons: [], stations: [], ships: [] }
  const ownerName = (owner, fallback) => (owner > 0 ? system.avatarNames[owner] : fallback)
  const add = (type, fields) => {
    const object = {
      type,
      key: objectKey(type, fields),
      objectId: parseInt(fields.id),
      isMine: false,
      owner: 0,
      ownerName: '',
      orbiting: null,
      orbit: { radius: 0, speed: 100 },
      ...fields
    }
    objects[object.key] = object
    return object
  }

  add('star', {
    id: system.id,
    name: system.starName,
    size: system.starSize,
    birth: system.birthTime,
    owner: system.discoveredBy,
    ownerName: system.avatarNames[system.discoveredBy],
    isMine: String(playerAccount) == String(system.discoveredBy)
  })

  for (const orbitalPosition in system.planets) {
    const planet = system.planets[orbitalPosition]
    const planetOwnerName = ownerName(planet.owner, 'unclaimed')
    const isMine = String(playerAccount) == String(planet.owner)
    const planetObject = add('planet', {
      id: planet.id,
      name: planet.name,
      size: planet.size,
      class: planet.class,
      rings: planet.rings,
      orbitalPosition,
      owner: planet.owner,
      ownerName: planetOwnerName,
      isMine,
      orbiting: STAR_KEY,
      orbit: { radius: planetOrbitRadius(orbitalPosition), speed: planet.orbitSpeed },
      hasStation: planet.hasStation,
      moons: []
    })
    keys.planets.push(planetObject.key)

    if (planet.hasStation) {
      const station = add('station', {
        id: planet.id,
        name: planet.station.name,
        size: planet.station.size,
        owner: planet.owner,
        ownerName: planetOwnerName,
        isMine,
        orbiting: planetObject.key,
        orbit: { radius: stationOrbitRadius(planet.size), speed: STATION_ORBIT_SPEED },
        orbitalPosition: 0,
        inventory: planet.station.inventory,
        prices: planet.station.prices
      })
      keys.stations.push(station.key)
      planetObject.stationKey = station.key
      planetObject.stationName = planet.station.name
    }

    for (const moonPosition in planet.moons) {
      const moon = planet.moons[moonPosition]
      const radius = moonOrbitRadius(planet.size, moonPosition)
      const moonObject = add('moon', {
        id: moonPosition,
        name: moon.name,
        size: moon.size,
        class: moon.class,
        orbitalPosition: moonPosition,
        planet: planet.id,
        owner: planet.owner,
        ownerName: planetOwnerName,
        isMine,
        orbiting: planetObject.key,
        // The contract's moon speed is per unit of distance.
        orbit: { radius, speed: moon.orbitSpeed * radius }
      })
      keys.moons.push(moonObject.key)
      planetObject.moons.push({ moonId: moonObject.key, moonName: moon.name })
    }
  }

  for (const shipId in system.ships) {
    const ship = system.ships[shipId]
    // Ships orbit the planet they're at, or the star if they aren't at one.
    let orbiting = STAR_KEY
    let radius = SHIP_ORBIT_RADIUS_AROUND_STAR
    for (const object of Object.values(objects)) {
      if (object.id == ship.orbit && object.type == 'planet') {
        orbiting = object.key
        radius = shipOrbitRadius(object.size)
      }
    }
    const shipObject = add('ship', {
      id: ship.id,
      name: ship.name,
      location: ship.location,
      owner: ship.owner,
      ownerName: ownerName(ship.owner, 'Unknown'),
      isMine: String(ship.owner) == String(playerAccount),
      orbiting,
      orbit: { radius, speed: shipOrbitSpeed(ship.id) }
    })
    keys.ships.push(shipObject.key)
  }

  return { objects, keys }
}
