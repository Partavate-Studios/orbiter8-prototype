// The actions offered in a selected object's card menu, from its game data.

/**
 * @param {import('@/sdk/system').GameObject} object
 * @param {{ marketName?: string }} [options]  the network's NFT market, if it has one (planets and ships are NFTs)
 * @returns {{ text: string, enabled: boolean, command: string, value?: number }[]}
 */
export function cardMenu(object, { marketName } = {}) {
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
