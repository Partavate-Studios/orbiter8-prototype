// Turns a loaded star system (sdk/load.js loadSystem) into the game's objects: plain data, keyed by a
// stable identity, with their relationships and orbits resolved. No drawing data; renderers build
// their own sprites from these.
import {
  planetOrbitRadius,
  moonOrbitRadius,
  stationOrbitRadius,
  shipOrbitRadius,
  shipOrbitPhases,
  SHIP_ORBIT_SPEED,
  planetOrbitSpeed,
  moonOrbitSpeed,
  stationOrbitSpeed,
  SHIP_ORBIT_RADIUS_AROUND_STAR
} from '@/sdk/game/orbits'
import { dockedShips } from '@/sdk/game/docking'

/** Who owns Sol's planets (D49). */
const FEDERATION = 'The Federation'

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
 * @property {{ radius: number, speed: number, phase?: number }} orbit  see sdk/game/orbits orbitAt()
 * @property {{ station: string, pad: number } | null} [dock]  ships: the station it's docked at, and which pad (degrees)
 *
 * Plus, by type:
 * - star: size, birth
 * - planet: size, class, rings, orbitalPosition, hasStation, stationKey, stationName,
 *   moons ([{ moonId: key, moonName }])
 * - station: size, goods (what the port sells and buys, sdk/game/trade.js), yard, armory
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
  const ownerName = (owner, fallback) => (owner ? system.avatarNames[owner] : fallback)
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
    // "Mine" on the card: the star's owner (the keeper, by its planets), not its discoverer
    isMine: Boolean(system.keeper) && system.keeper !== 'federation' && String(playerAccount) == String(system.keeper),
    // a black hole, with a partner to go through to
    blackHole: system.blackHole ?? false,
    // its owner ('federation', an address or null), and whether the player may name it (Planets.mayNameStar)
    keeper: system.keeper ?? null,
    keeperName:
      system.keeper === 'federation' ? FEDERATION : system.keeper ? (system.avatarNames[system.keeper] ?? '') : '',
    mayName: system.mayName ?? false,
    namingOwns: system.namingOwns ?? false,
    named: system.named ?? true
  })

  for (const orbitalPosition in system.planets) {
    const planet = system.planets[orbitalPosition]
    const planetOwnerName = planet.federation ? FEDERATION : ownerName(planet.owner, 'unclaimed')
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
      orbit: {
        radius: planetOrbitRadius(orbitalPosition),
        speed: planetOrbitSpeed(planet.orbitSpeed, orbitalPosition)
      },
      hasStation: planet.hasStation,
      federation: planet.federation ?? false,
      moons: [],
      // level, buildings, people, storage, siege, defenses (sdk/client.js)
      info: planet.info ?? null
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
        orbit: { radius: stationOrbitRadius(planet.size), speed: stationOrbitSpeed(planet.size) },
        orbitalPosition: 0,
        goods: planet.station.goods ?? [],
        yard: planet.station.yard ?? false,
        armory: planet.station.armory ?? false
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
        orbit: { radius, speed: moonOrbitSpeed(moon.orbitSpeed, moonPosition, radius) }
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
      orbit: { radius, speed: SHIP_ORBIT_SPEED, phase: 0 }
    })
    keys.ships.push(shipObject.key)
  }

  // The last few to trade at a station, still at its planet, are docked there (sdk/game/docking.js).
  const planetIdOf = (key) => (objects[key]?.type === 'planet' ? objects[key].id : null)
  const docked = dockedShips(
    system.recentTrades ?? [],
    keys.ships.map((key) => ({
      id: objects[key].id,
      owner: objects[key].owner,
      planetId: planetIdOf(objects[key].orbiting)
    })),
    keys.planets.filter((key) => objects[key].hasStation).map((key) => objects[key].id)
  )
  for (const key of keys.ships) {
    const dock = docked.get(String(objects[key].id))
    objects[key].dock = dock ? { station: objectKey('station', { id: dock.planetId }), pad: dock.pad } : null
  }

  // The other ships sharing an orbit are spread round it.
  const shipsAround = {}
  for (const key of keys.ships) {
    if (!objects[key].dock) (shipsAround[objects[key].orbiting] ??= []).push(objects[key])
  }
  for (const ships of Object.values(shipsAround)) {
    const phases = shipOrbitPhases(ships.map((ship) => ship.id))
    for (const ship of ships) ship.orbit.phase = phases.get(String(ship.id))
  }

  return { objects, keys }
}
