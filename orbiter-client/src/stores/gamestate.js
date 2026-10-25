import { defineStore } from 'pinia'
import GalaxyContract from '@/contract-interfaces/galaxy'
import AvatarContract from '@/contract-interfaces/avatar'
import { useUIStore } from '@/stores/ui'
import { useChainStore } from '@/stores/chain'

export const useGameStateStore = defineStore('GameState', {
  state: () => ({
    gameDataLoading: false,
    gameDataLoaded: false,
    gameState: {
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
    },
    haveAvatar: false,
    creatingAvatar: false,
    launchingShip: false,
    haveShip: false,
    events: {
      avatarEvents: null,
      shipEvents: null,
      tradeEvents: null
    }
  }),
  getters: {
    avatar: state => state.gameState.avatar
  },
  actions: {
    /** Loads general state information: avatar count, star system acount, player avatar data */
    async loadGameState () {
      console.log('Loading game state...')
      this.setGameDataLoading()
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
        gameState.avatarCount = await AvatarContract.getAvatarCount(useChainStore().account)
        gameState.starSystemCount = await GalaxyContract.getSystemCount(useChainStore().account)
        gameState.avatar.registered = await AvatarContract.haveAvatar(useChainStore().account)

        /** We have an avatar, but do we have a ship? */
        if (gameState.avatar.registered) {
          gameState.avatar.name = await AvatarContract.getMyAvatarName(useChainStore().account)
          gameState.avatar.shipId = await GalaxyContract.getMyShipId(useChainStore().account)
          gameState.avatar.credits = parseInt(await GalaxyContract.myBalance(useChainStore().account))
          console.log('Name: ', gameState.avatar.name)
          console.log('Ship: ', parseInt(gameState.avatar.shipId))
          console.log('Credits: ', parseInt(gameState.avatar.credits))
          this.setProp({key: 'haveAvatar', value: true})
        }

        if (gameState.avatar.shipId > 0) {
          /** We have a ship */
          console.log('loading my own ship ')
          const ship = await GalaxyContract.getMyShip(useChainStore().account)
          console.log('loaded my own ship ' + parseInt(ship[4]))
          gameState.avatar.ship = {
            name: ship[0],
            location: ship[1],
            orbit: ship[2],
            holds: parseInt(ship[3]),
            equipment: parseInt(ship[4]),
            fuel: parseInt(ship[5]),
            organics: parseInt(ship[6]),
            owner: useChainStore().account
          }
          //console.log(JSON.stringify(gameState.avatar.ship))
          this.setProp({key: 'haveShip', value: true})
        }
        this.setProp({key: 'gameState', value: gameState})
        this.setGameDataLoaded()
      } catch (error) {
        console.log('oops:' + error.message, error)
      }
    },
    async loadEvents () {
      let events = {
        avatarEvents: null,
        shipEvents: null,
        tradeEvents: null,
        chatEvents: null
      }
      let block = useChainStore().currentBlockId
      if (block > 0) {
        events.avatarEvents = await AvatarContract.getEvents()
        events.shipEvents = await GalaxyContract.getEvents('ShipLaunch', block - 10)
        events.tradeEvents = await GalaxyContract.getEvents('PortTrade', block - 10)
        events.chatEvents = await GalaxyContract.getEvents('ChatLog', block - 950)
      }
      this.setProp({key: 'events', value: events})
      console.log('Events: ' + JSON.stringify(events))
    },
    /** player actions */
    async createAvatar (name) {
      this.setProp({key: 'creatingAvatar', value: true})
      try {
        await AvatarContract.createAvatar(
          name,
          useChainStore().account
        )
  //      await dispatch('loadGameState')
      } catch (error) {
        console.log(`Avatar creation failed: ${JSON.stringify(error)}`)
      }
      this.setProp({key: 'creatingAvatar', value: false})
    },
    async launchShip (name) {
      this.setProp({key: 'launchingShip', value: true})
      try {
        await GalaxyContract.launchShip(
          name,
          useChainStore().account
        )
  //      await dispatch('loadGameState')
      } catch (error) {
        console.log(`Avatar creation failed: ${JSON.stringify(error)}`)
      }
      this.setProp({key: 'launchingShip', value: false})
    },
    async moveToSystem (system) {
      try {
        console.log('moving to system ' + system)
        useUIStore().jumpAnimationOn()
        useUIStore().jumpMenuOff()
        await GalaxyContract.moveToSystem(system, useChainStore().account)
        console.log('moved ' + system)
      } catch (error) {
        console.log('oops' + error.message)
      }
    },
    async sendChat (message) {
      try {
        await GalaxyContract.sendChat(message, useChainStore().account)
        console.log('sent chat ' + message)
      } catch (error) {
        console.log('oops' + error.message)
      }
    },
    async claimPlanet ({planetId, name}) {
      try {
        console.log('Claiming planet: ' + planetId)
        await GalaxyContract.claimPlanet(String(planetId), String(name), useChainStore().account)
        //const shipId = await GalaxyContract.getMyShipId(useChainStore().account)
        //console.log('Updated planet ' + planetId + ' and ship ' + shipId)
      } catch (error) {
        console.log('Didn\'t claim planet  ' + error.message)
      }
    },
    async buildStation ({planetId, name}) {
      try {
        console.log('Build space station: ' + planetId)
        await GalaxyContract.buildStation(String(planetId), String(name), useChainStore().account)
        //const shipId = await GalaxyContract.getMyShipId(useChainStore().account)
        //console.log('Updated planet ' + planetId + ' and ship ' + shipId)
      } catch (error) {
        console.log('Didn\'t build station  ' + error.message)
      }
    },
    async tradeAtPort ({planetId, equipment, fuel, organics}) {
      try {
        console.log('trading at: ' + planetId+ ' ' + equipment + ' ' + fuel + ' ' + organics)
        await GalaxyContract.tradeAtPort(String(planetId), equipment, fuel, organics, useChainStore().account)
      } catch (error) {
        console.log('Trade failed.' + error.message)
      }
    },
    async addHoldsToShip ({planetId, amount}) {
      try {
        console.log('get holds: ' + amount)
        await GalaxyContract.addHoldsToShip(planetId, amount, useChainStore().account)
      } catch (error) {
        console.log('hold upgrade.' + error.message)
      }

    },
    async renameAsset ({name, type, objectId, parentId}) {
      console.log('renaming ' + type + ' to ' + name)
      try {
        switch(type) {
          case "star":
            await GalaxyContract.renameStar(name, useChainStore().account)
            break;
          case "planet":
            await GalaxyContract.renamePlanet(objectId, name, useChainStore().account)
            break;
          case "moon":
            await GalaxyContract.renameMoon(parentId, objectId, name, useChainStore().account)
            break;
          case "station":
            await GalaxyContract.renameStation(objectId, name, useChainStore().account)
            break;
          case "ship":
            await GalaxyContract.renameMyShip(name, useChainStore().account)
            break;
        }
      } catch (error) {
        console.log('rename star error ' + error.message)
      }
    },
    setProp ({ key, value }) {
      //console.log('setting props', [key, value])
      this[key] = value
    },
    setGameDataLoaded () {
      this.gameDataLoaded = true
      this.gameDataLoading = false
    },
    setGameDataLoading () {
      this.gameDataLoading = true
    }
  }
})
