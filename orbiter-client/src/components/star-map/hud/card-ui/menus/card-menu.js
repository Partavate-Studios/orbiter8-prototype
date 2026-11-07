// The actions offered in a selected object's card menu, from its game data.

/**
 * Demo 4's view of the player, for its options (stores/demo4.js).
 * @typedef {object} Demo4Context
 * @property {number} credits
 * @property {number} claimFee
 * @property {boolean} armed  the ship has weapons in action
 * @property {boolean} retreated  the ship must be repaired before attacking
 * @property {boolean} sessionLive
 * @property {(planetId: number) => object | null} siegeAt
 */

/**
 * @param {import('@/sdk/system').GameObject} object
 * @param {{ marketName?: string, demo4?: Demo4Context }} [options]  the network's NFT market, if it has one
 *   (planets and ships are NFTs); Demo 4's context when playing Demo 4's contracts
 * @returns {{ text: string, enabled: boolean, command: string, value?: number }[]}
 */
export function cardMenu(object, { marketName, demo4 } = {}) {
  if (demo4) return demo4Menu(object, demo4, marketName)
  let menu = []
  switch (object.type) {
    case 'star':
      menu.push({
        text: 'Jump To Neighbor Star',
        enabled: true,
        command: 'jump'
      })
      break

    case 'moon':
      if (object.isMine) {
        menu.push({
          text: 'Build Infrastructure',
          enabled: false,
          command: 'build'
        })
      }
      menu.push({
        text: 'Visit Planet',
        enabled: true,
        command: 'visitPlanet',
        value: object.objectId
      })
      break

    case 'planet':
      if (parseInt(object.owner) === 0) {
        menu.push({
          text: 'Claim Planet',
          enabled: true,
          command: 'claim',
          value: object.objectId
        })
      } else if (object.isMine) {
        if (!object.hasStation) {
          menu.push({
            text: 'Build Space Station',
            enabled: true,
            command: 'buildStation',
            value: object.objectId
          })
        }
      } else {
        menu.push({
          text: 'Attack',
          enabled: false,
          command: 'attack'
        })
      }
      if (object.hasStation) {
        menu.push({
          text: 'Visit Space Station',
          enabled: true,
          command: 'visitStation',
          value: object.objectId
        })
      }
      if (object.moons.length > 0) {
        menu.push({
          text: 'Visit Moon',
          enabled: true,
          command: 'visitMoon',
          value: object.objectId
        })
      }
      if (marketName) menu.push(marketItem(marketName))
      break

    case 'ship':
      if (object.isMine) {
        menu.push({
          text: 'Jump To Neighbor Star',
          enabled: true,
          command: 'jump'
        })
      } else {
        menu.push({
          text: 'Attack',
          enabled: false,
          command: 'attack'
        })
      }
      if (marketName) menu.push(marketItem(marketName))
      break

    case 'station':
      menu.push({
        text: 'Trade at Port',
        enabled: true,
        command: 'trade'
      })
      menu.push({
        text: 'Dock at Shipyards',
        enabled: true,
        command: 'shipyards'
      })
      menu.push({
        text: 'Visit Planet',
        enabled: true,
        command: 'visitPlanet',
        value: object.objectId
      })
      break
  }

  if (object.isMine) {
    menu.push({
      text: 'Rename ' + object.type.charAt(0).toUpperCase() + object.type.slice(1),
      enabled: true,
      command: 'rename'
    })
  } else {
    if (object.owner != null && object.owner.length === 0) {
      menu.push({
        text: 'Claim Ownership',
        enabled: true,
        command: 'claim'
      })
    }
  }

  return menu
}

/** Opens the object's NFT on the network's market (planets and ships are tokens). */
function marketItem(marketName) {
  return { text: 'View on ' + marketName, enabled: true, command: 'market' }
}

/** Sol is cell 0; its nine planets are the Federation's (D49). Earth (planet 2) hires colonists. */
const SOL_EARTH = 2

/**
 * Demo 4's card menu: Demo 3's options where the rules are the same, and Demo 4's own: claims with
 * a fee, colonies, armories, the ship's loadout, sessions, sieges and black holes.
 * @param {import('@/sdk/system').GameObject} object
 * @param {Demo4Context} d
 */
function demo4Menu(object, d, marketName) {
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
      const sol = object.v4 && Math.floor(object.objectId / 256) === 0
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
