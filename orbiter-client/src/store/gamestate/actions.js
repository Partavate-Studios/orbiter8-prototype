import GalaxyContract from '@/contract-interfaces/galaxy'
import AvatarContract from '@/contract-interfaces/avatar'

export default {
  /** Loads general state information: avatar count, star system acount, player avatar data */
  async loadGameState ({ rootState, commit }) {
    console.log('Loading game state...')
    commit('setGameDataLoading')
    try {
      const gameState = {
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
          credits: 0,
        }
      }
      gameState.avatarCount = await AvatarContract.getAvatarCount(rootState.account)
      gameState.starSystemCount = await GalaxyContract.getSystemCount(rootState.account)
      gameState.avatar.registered = await AvatarContract.haveAvatar(rootState.account)

      /** We have an avatar, but do we have a ship? */
      if (gameState.avatar.registered) {
        gameState.avatar.name = await AvatarContract.getMyAvatarName(rootState.account)
        gameState.avatar.shipId = await GalaxyContract.getMyShipId(rootState.account)
        gameState.avatar.credits = parseInt(await GalaxyContract.myBalance(rootState.account))
        console.log('Name: ', gameState.avatar.name)
        console.log('Ship: ', parseInt(gameState.avatar.shipId))
        console.log('Credits: ', parseInt(gameState.avatar.credits))
        commit('setProp', {key: 'haveAvatar', value: true})
      }

      if (gameState.avatar.shipId > 0) {
        /** We have a ship */
        console.log('loading my own ship ')
        const ship = await GalaxyContract.getMyShip(rootState.account)
        console.log('loaded my own ship ' + parseInt(ship[4]))
        gameState.avatar.ship = {
          name: ship[0],
          location: ship[1],
          orbit: ship[2],
          holds: parseInt(ship[3]),
          equipment: parseInt(ship[4]),
          fuel: parseInt(ship[5]),
          organics: parseInt(ship[6]),
          owner: rootState.account
        }
        //console.log(JSON.stringify(gameState.avatar.ship))
        commit('setProp', {key: 'haveShip', value: true})
      }
      commit('setProp', {key: 'gameState', value: gameState})
      commit('setGameDataLoaded')
    } catch (error) {
      console.log('oops:' + error.message, error)
    }
  },
  async loadEvents({ rootState, commit }) {
    let events = {
      avatarEvents: null,
      shipEvents: null,
      tradeEvents: null,
      chatEvents: null
    }
    let block = rootState.currentBlockId
    if (block > 0) {
      events.avatarEvents = await AvatarContract.getEvents()
      events.shipEvents = await GalaxyContract.getEvents('ShipLaunch', block - 10)
      events.tradeEvents = await GalaxyContract.getEvents('PortTrade', block - 10)
      events.chatEvents = await GalaxyContract.getEvents('ChatLog', block - 950)
    }
    commit('setProp', {key: 'events', value: events})
    console.log('Events: ' + JSON.stringify(events))
  },
  /** player actions */
  async createAvatar ({ rootState, commit }, name) {
    commit('setProp', {key: 'creatingAvatar', value: true})
    try {
      await AvatarContract.createAvatar(
        name,
        rootState.account
      )
//      await dispatch('loadGameState')
    } catch (error) {
      console.log(`Avatar creation failed: ${JSON.stringify(error)}`)
    }
    commit('setProp', {key: 'creatingAvatar', value: false})
  },
  async launchShip ({ rootState, commit }, name) {
    commit('setProp', {key: 'launchingShip', value: true})
    try {
      await GalaxyContract.launchShip(
        name,
        rootState.account
      )
//      await dispatch('loadGameState')
    } catch (error) {
      console.log(`Avatar creation failed: ${JSON.stringify(error)}`)
    }
    commit('setProp', {key: 'launchingShip', value: false})
  },
  async moveToSystem ({ rootState, commit }, system) {
    try {
      console.log('moving to system ' + system)
      commit('UI/jumpAnimationOn', null, {root: true})
      commit('UI/jumpMenuOff', null, {root: true})
      await GalaxyContract.moveToSystem(system, rootState.account)
      console.log('moved ' + system)
    } catch (error) {
      console.log('oops' + error.message)
    }
  },
  async sendChat ({ rootState }, message) {
    try {
      await GalaxyContract.sendChat(message, rootState.account)
      console.log('sent chat ' + message)
    } catch (error) {
      console.log('oops' + error.message)
    }
  },
  async claimPlanet ({ rootState }, {planetId, name}) {
    try {
      console.log('Claiming planet: ' + planetId)
      await GalaxyContract.claimPlanet(String(planetId), String(name), rootState.account)
      //const shipId = await GalaxyContract.getMyShipId(rootState.account)
      //console.log('Updated planet ' + planetId + ' and ship ' + shipId)
    } catch (error) {
      console.log('Didn\'t claim planet  ' + error.message)
    }
  },
  async buildStation ({ rootState }, {planetId, name}) {
    try {
      console.log('Build space station: ' + planetId)
      await GalaxyContract.buildStation(String(planetId), String(name), rootState.account)
      //const shipId = await GalaxyContract.getMyShipId(rootState.account)
      //console.log('Updated planet ' + planetId + ' and ship ' + shipId)
    } catch (error) {
      console.log('Didn\'t build station  ' + error.message)
    }
  },
  async tradeAtPort ({ rootState }, {planetId, equipment, fuel, organics}) {
    try {
      console.log('trading at: ' + planetId+ ' ' + equipment + ' ' + fuel + ' ' + organics)
      await GalaxyContract.tradeAtPort(String(planetId), equipment, fuel, organics, rootState.account)
    } catch (error) {
      console.log('Trade failed.' + error.message)
    }
  },
  async addHoldsToShip ({ rootState }, {planetId, amount}) {
    try {
      console.log('get holds: ' + amount)
      await GalaxyContract.addHoldsToShip(planetId, amount, rootState.account)
    } catch (error) {
      console.log('hold upgrade.' + error.message)
    }

  },
  async renameAsset ({ rootState }, {name, type, objectId, parentId}) {
    console.log('renaming ' + type + ' to ' + name)
    try {
      switch(type) {
        case "star":
          await GalaxyContract.renameStar(name, rootState.account)
          break;
        case "planet":
          await GalaxyContract.renamePlanet(objectId, name, rootState.account)
          break;
        case "moon":
          await GalaxyContract.renameMoon(parentId, objectId, name, rootState.account)
          break;
        case "station":
          await GalaxyContract.renameStation(objectId, name, rootState.account)
          break;
        case "ship":
          await GalaxyContract.renameMyShip(name, rootState.account)
          break;
      }
    } catch (error) {
      console.log('rename star error ' + error.message)
    }
  }
}
