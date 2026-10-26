// Everything a player can do, as plain async functions. Each sends a transaction and resolves once
// it's mined; a rejection carries the revert reason (error.shortMessage). No UI: callers decide
// what to show while waiting and on failure.
import { galaxy, avatars } from '@/sdk/chain/contracts'

/**
 * Registers the connected account as a player.
 * @param {{ onSent?: (hash: string) => void }} [options]  onSent: the wallet has sent it (before it's mined)
 */
export function createAvatar(name, options) {
  return avatars.createAvatar(name, options)
}

/**
 * Builds the player's first ship.
 * @param {{ onSent?: (hash: string) => void }} [options]
 */
export function launchShip(name, options) {
  return galaxy.launchShip(name, options)
}

/**
 * Jumps the player's ship to a neighboring star system.
 * @param {{ onSent?: (hash: string) => void }} [options]  onSent: the wallet has sent the move (before it's mined)
 */
export function moveTo(systemId, options) {
  return galaxy.moveToSystem(systemId, options)
}

/** Sends a message to the galaxy-wide chat (a ChatLog event). */
export function sendChat(message) {
  return galaxy.sendChat(message)
}

/** Claims an unowned planet in the ship's system and names it. */
export function claimPlanet(planetId, name) {
  return galaxy.claimPlanet(String(planetId), String(name))
}

/** Builds a space station (a trading port) at one of the player's planets. */
export function buildStation(planetId, name) {
  return galaxy.buildStation(String(planetId), String(name))
}

/**
 * Trades at the station orbiting `planetId`: positive amounts buy from the port, negative sell to it.
 * @param {{ equipment: number, fuel: number, organics: number }} amounts
 */
export function trade(planetId, { equipment, fuel, organics }) {
  return galaxy.tradeAtPort(String(planetId), equipment, fuel, organics)
}

/** Buys cargo holds at the shipyard of the station orbiting `planetId`. */
export function buyHolds(planetId, amount) {
  return galaxy.addHoldsToShip(planetId, amount)
}

/**
 * Renames something the player owns: the star they discovered, a planet, a moon (`parentId` is its
 * planet), a station (`objectId` is its planet) or their ship.
 * @param {{ type: 'star' | 'planet' | 'moon' | 'station' | 'ship', objectId?: number, parentId?: number, name: string }} target
 */
export function rename({ type, objectId, parentId, name }) {
  switch (type) {
    case 'star':
      return galaxy.renameStar(name)
    case 'planet':
      return galaxy.renamePlanet(objectId, name)
    case 'moon':
      return galaxy.renameMoon(parentId, objectId, name)
    case 'station':
      return galaxy.renameStation(objectId, name)
    case 'ship':
      return galaxy.renameMyShip(name)
  }
}
