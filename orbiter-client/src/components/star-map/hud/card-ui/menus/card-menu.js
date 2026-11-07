// The actions offered in a selected object's card menu, from its game data.

/**
 * The pilot, as the options need them (stores/player.js).
 * @typedef {object} PilotContext
 * @property {number} credits
 * @property {number} claimFee
 * @property {boolean} armed  the ship has weapons in action
 * @property {boolean} retreated  the ship must be repaired before attacking
 * @property {boolean} sessionLive
 * @property {(planetId: number) => object | null} siegeAt
 */

/**
 * @param {import('@/sdk/system').GameObject} object
 * @param {{ marketName?: string, pilot?: PilotContext }} [options]  the network's NFT market, if it has one
 *   (planets and ships are NFTs), and the pilot
 * @returns {{ text: string, enabled: boolean, command: string, value?: number }[]}
 */
export function cardMenu(object, { marketName, pilot } = {}) {
  return pilotMenu(object, pilot ?? NO_PILOT, marketName)
}

/** Before the pilot has loaded: nothing to spend, nothing armed. */
const NO_PILOT = { credits: 0, claimFee: 0, armed: false, retreated: false, sessionLive: false, siegeAt: () => null }

/** Opens the object's NFT on the network's market (planets and ships are tokens). */
function marketItem(marketName) {
  return { text: 'View on ' + marketName, enabled: true, command: 'market' }
}

/** Sol is cell 0; its nine planets are the Federation's (D49). Earth (planet 2) hires colonists. */
const SOL_EARTH = 2

/**
 * The options: claims with a fee, colonies, trade, yards, armories, the ship's loadout, sessions,
 * sieges, black holes and names.
 * @param {import('@/sdk/system').GameObject} object
 * @param {PilotContext} d
 */
function pilotMenu(object, d, marketName) {
  const menu = []
  const add = (text, command, enabled = true, value) => menu.push({ text, enabled, command, value })
  switch (object.type) {
    case 'star':
      add('Jump To Neighbor Star', 'jump')
      if (object.blackHole) add('Go Through the Black Hole', 'traverse')
      break

    case 'moon':
      add('Visit Planet', 'visitPlanet', true, object.objectId)
      break

    case 'planet': {
      const sol = Math.floor(object.objectId / 256) === 0
      const siege = d.siegeAt(object.objectId)
      if (sol && object.objectId === SOL_EARTH) add('Recruit Colonists', 'recruit')
      if (!sol && parseInt(object.owner) === 0) {
        add(`Claim Planet (${d.claimFee.toLocaleString('en-US')}¢)`, 'claim', d.credits >= d.claimFee, object.objectId)
      } else if (object.isMine) {
        add('Colony', 'colony', true, object.objectId)
      } else if (!sol && !siege) {
        add('Attack', 'attack', d.armed && !d.retreated, object.objectId)
      }
      if (siege) add('Siege Status', 'siege', true, object.objectId)
      if (object.hasStation) add('Visit Space Station', 'visitStation', true, object.objectId)
      if (object.moons.length > 0) add('Visit Moon', 'visitMoon', true, object.objectId)
      if (marketName && !sol) menu.push(marketItem(marketName))
      break
    }

    case 'ship':
      if (object.isMine) {
        add('Jump To Neighbor Star', 'jump')
        add('Ship Loadout', 'loadout')
        add(d.sessionLive ? 'End Session' : 'Start Session', 'session')
      }
      if (marketName) menu.push(marketItem(marketName))
      break

    case 'station':
      add('Trade at Port', 'trade')
      if (object.yard) add('Dock at Shipyards', 'shipyards')
      if (object.armory) add('Visit the Armory', 'armory')
      add('Visit Planet', 'visitPlanet', true, object.objectId)
      break
  }
  // Sol's are the Federation's; anything else the player owns, they can name.
  if (object.isMine) add('Rename ' + object.type.charAt(0).toUpperCase() + object.type.slice(1), 'rename')
  return menu
}
