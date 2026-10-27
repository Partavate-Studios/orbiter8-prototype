// Everything a player can do, as plain async functions. Each sends a transaction and resolves once
// it's mined; a rejection carries the revert reason (error.shortMessage). No UI: callers decide
// what to show while waiting and on failure. Each takes `options` last: `{ onSent(hash) }` hears the
// moment the wallet has sent it (before it's mined).
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
export function sendChat(message, options) {
  return galaxy.sendChat(message, options)
}

/** Claims an unowned planet in the ship's system and names it. */
export function claimPlanet(planetId, name, options) {
  return galaxy.claimPlanet(String(planetId), String(name), options)
}

/** Builds a space station (a trading port) at one of the player's planets. */
export function buildStation(planetId, name, options) {
  return galaxy.buildStation(String(planetId), String(name), options)
}

/**
 * Trades at the station orbiting `planetId`: positive amounts buy from the port, negative sell to it.
 * @param {{ equipment: number, fuel: number, organics: number }} amounts
 */
export function trade(planetId, { equipment, fuel, organics }, options) {
  return galaxy.tradeAtPort(String(planetId), equipment, fuel, organics, options)
}

/** Buys cargo holds at the shipyard of the station orbiting `planetId`. */
export function buyHolds(planetId, amount, options) {
  return galaxy.addHoldsToShip(planetId, amount, options)
}

/**
 * Renames something the player owns: the star they discovered, a planet, a moon (`parentId` is its
 * planet), a station (`objectId` is its planet) or their ship.
 * @param {{ type: 'star' | 'planet' | 'moon' | 'station' | 'ship', objectId?: number, parentId?: number, name: string }} target
 */
export function rename({ type, objectId, parentId, name }, options) {
  switch (type) {
    case 'star':
      return galaxy.renameStar(name, options)
    case 'planet':
      return galaxy.renamePlanet(objectId, name, options)
    case 'moon':
      return galaxy.renameMoon(parentId, objectId, name, options)
    case 'station':
      return galaxy.renameStation(objectId, name, options)
    case 'ship':
      return galaxy.renameMyShip(name, options)
  }
}
