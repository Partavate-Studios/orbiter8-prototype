// Reads game state from the contracts into plain objects. No Vue: the stores (or any other client)
// decide what to do with the results.
import { TIMING } from '@/constants'
import { galaxy, avatars } from '@/sdk/chain/contracts'
import { getSession } from '@/sdk/chain/wallet'
import { decodeSystem, decodePlanet, decodeStation, decodeMoon, decodeShip, decodeMyShip } from '@/sdk/chain/decode'

/**
 * The game as a whole and the player's avatar, ship and credits.
 * `avatar.registered` is false until the player has made an avatar; `avatar.shipId` is 0 until they
 * have launched a ship.
 */
export async function loadPlayer() {
  const player = {
    avatarCount: null,
    starSystemCount: null,
    avatar: {
      registered: false,
      name: '',
      shipId: 0,
      ship: {
        name: null,
        location: null,
        orbit: null,
        holds: null,
        equipment: null,
        fuel: null,
        organics: null,
        owner: null
      },
      credits: 0
    }
  }
  player.avatarCount = await avatars.getAvatarCount()
  player.starSystemCount = await galaxy.getSystemCount()
  player.avatar.registered = await avatars.haveAvatar()

  if (player.avatar.registered) {
    player.avatar.name = await avatars.getMyAvatarName()
    player.avatar.shipId = await galaxy.getMyShipId()
    player.avatar.credits = parseInt(await galaxy.myBalance())
  }

  if (player.avatar.shipId > 0) {
    player.avatar.ship = { ...decodeMyShip(await galaxy.getMyShip()), owner: getSession().account }
  }
  return player
}

/**
 * Recent avatar sign-ups, ship launches, trades and chat, looking back from `blockNumber`.
 * Before the first block is known, everything is null.
 */
export async function loadRecentEvents(blockNumber) {
  const events = {
    avatarEvents: null,
    shipEvents: null,
    tradeEvents: null,
    chatEvents: null
  }
  if (blockNumber > 0) {
    events.avatarEvents = await avatars.getEvents()
    events.shipEvents = await galaxy.getEvents('ShipLaunch', blockNumber - TIMING.EVENT_LOOKBACK_BLOCKS)
    events.tradeEvents = await galaxy.getEvents('PortTrade', blockNumber - TIMING.EVENT_LOOKBACK_BLOCKS)
    events.chatEvents = await galaxy.getEvents('ChatLog', blockNumber - TIMING.CHAT_LOOKBACK_BLOCKS)
  }
  return events
}

/**
 * Everything in the star system the player's ship is in: the star, its neighbors, its planets (with
 * their stations and moons), the ships there, and the names of everyone who owns any of it.
 * Planets are keyed by orbital position, ships by id.
 * @param {(percent: number) => void} [onProgress]  called as loading advances
 */
export async function loadSystem(onProgress = () => {}) {
  const system = decodeSystem(await galaxy.getPlayerSystemData())
  onProgress(2)

  const data = {
    id: system.id,
    starName: system.name,
    starSize: system.size,
    birthTime: system.birthTime,
    discoveredBy: system.discoveredBy,
    neighborIds: system.neighborIds,
    neighbors: {},
    planetIds: system.planetIds,
    planets: {},
    shipIds: system.shipIds,
    ships: {},
    avatarNames: {}
  }
  // Owner addresses → avatar names, each looked up once.
  const addOwnerName = async (owner) => {
    if (typeof data.avatarNames[owner] === 'undefined') {
      data.avatarNames[owner] = await avatars.getAvatarNameByAddress(owner)
    }
  }
  onProgress(4)

  if (data.discoveredBy > 0) await addOwnerName(data.discoveredBy)
  onProgress(5)

  for (const [key, neighborId] of Object.entries(data.neighborIds)) {
    data.neighbors[key] = { id: neighborId, name: await galaxy.getSystemName(String(neighborId)) }
    onProgress(Math.min(24, 6 + Number(key)))
  }
  onProgress(25)

  for (const key of Object.keys(data.shipIds)) {
    const shipId = data.shipIds[key]
    if (shipId > 0 && !(shipId in data.ships)) {
      const ship = decodeShip(shipId, await galaxy.getShip(String(shipId)))
      if (ship.location == data.id) {
        data.ships[shipId] = ship
      }
      if (ship.owner !== '0x0') await addOwnerName(ship.owner)
    }
    onProgress(Math.min(75, 25 + Number(key)))
  }
  onProgress(80)

  // A planet's index in planetIds is its orbital position (the contract's systems[id].planets[orbitalId]).
  for (const [key, planetId] of Object.entries(data.planetIds)) {
    if (planetId > 0) {
      const planet = { ...decodePlanet(planetId, await galaxy.getPlanet(String(planetId))), moons: {}, station: {} }
      if (planet.owner > 0) await addOwnerName(planet.owner)

      if (planet.hasStation) {
        const station = decodeStation(planet.id, await galaxy.getStation(String(planet.id)))
        planet.station = { ...station, orbitSpeed: 1, owner: planet.owner }
      }

      for (const [moonId, hasMoon] of Object.entries(planet.hasMoons)) {
        if (hasMoon) {
          const moon = decodeMoon(planetId, moonId, await galaxy.getMoon(String(planetId), String(moonId)))
          planet.moons[moonId] = { ...moon, owner: planet.owner }
        }
      }
      data.planets[key] = planet
      onProgress(Math.min(98, 80 + Number(key)))
    }
  }
  return data
}
