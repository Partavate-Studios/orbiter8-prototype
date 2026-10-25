import { defineStore } from 'pinia'
import { galaxy, avatars } from '@/chain/contracts'
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
        gameState.avatarCount = await avatars.getAvatarCount()
        gameState.starSystemCount = await galaxy.getSystemCount()
        gameState.avatar.registered = await avatars.haveAvatar()

        /** We have an avatar, but do we have a ship? */
        if (gameState.avatar.registered) {
          gameState.avatar.name = await avatars.getMyAvatarName()
          gameState.avatar.shipId = await galaxy.getMyShipId()
          gameState.avatar.credits = parseInt(await galaxy.myBalance())
          console.log('Name: ', gameState.avatar.name)
          console.log('Ship: ', parseInt(gameState.avatar.shipId))
          console.log('Credits: ', parseInt(gameState.avatar.credits))
          this.setProp({key: 'haveAvatar', value: true})
        }

        if (gameState.avatar.shipId > 0) {
          /** We have a ship */
          console.log('loading my own ship ')
          const ship = await galaxy.getMyShip()
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
        events.avatarEvents = await avatars.getEvents()
        events.shipEvents = await galaxy.getEvents('ShipLaunch', block - 10)
        events.tradeEvents = await galaxy.getEvents('PortTrade', block - 10)
        events.chatEvents = await galaxy.getEvents('ChatLog', block - 950)
      }
      this.setProp({key: 'events', value: events})
      console.log('Events: ' + JSON.stringify(events))
    },
    /** player actions */
    async createAvatar (name) {
      this.setProp({key: 'creatingAvatar', value: true})
      try {
        await avatars.createAvatar(name)
  //      await dispatch('loadGameState')
      } catch (error) {
        console.log(`Avatar creation failed: ${JSON.stringify(error)}`)
      }
      this.setProp({key: 'creatingAvatar', value: false})
    },
    async launchShip (name) {
      this.setProp({key: 'launchingShip', value: true})
      try {
        await galaxy.launchShip(name)
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
        await galaxy.moveToSystem(system)
        console.log('moved ' + system)
      } catch (error) {
        console.log('oops' + error.message)
      }
    },
    async sendChat (message) {
      try {
        await galaxy.sendChat(message)
        console.log('sent chat ' + message)
      } catch (error) {
        console.log('oops' + error.message)
      }
    },
    async claimPlanet ({planetId, name}) {
      try {
        console.log('Claiming planet: ' + planetId)
        await galaxy.claimPlanet(String(planetId), String(name))
        //const shipId = await galaxy.getMyShipId()
        //console.log('Updated planet ' + planetId + ' and ship ' + shipId)
      } catch (error) {
        console.log('Didn\'t claim planet  ' + error.message)
      }
    },
    async buildStation ({planetId, name}) {
      try {
        console.log('Build space station: ' + planetId)
        await galaxy.buildStation(String(planetId), String(name))
        //const shipId = await galaxy.getMyShipId()
        //console.log('Updated planet ' + planetId + ' and ship ' + shipId)
      } catch (error) {
        console.log('Didn\'t build station  ' + error.message)
      }
    },
    async tradeAtPort ({planetId, equipment, fuel, organics}) {
      try {
        console.log('trading at: ' + planetId+ ' ' + equipment + ' ' + fuel + ' ' + organics)
        await galaxy.tradeAtPort(String(planetId), equipment, fuel, organics)
      } catch (error) {
        console.log('Trade failed.' + error.message)
      }
    },
    async addHoldsToShip ({planetId, amount}) {
      try {
        console.log('get holds: ' + amount)
        await galaxy.addHoldsToShip(planetId, amount)
      } catch (error) {
        console.log('hold upgrade.' + error.message)
      }

    },
    async renameAsset ({name, type, objectId, parentId}) {
      console.log('renaming ' + type + ' to ' + name)
      try {
        switch(type) {
          case "star":
            await galaxy.renameStar(name)
            break;
          case "planet":
            await galaxy.renamePlanet(objectId, name)
            break;
          case "moon":
            await galaxy.renameMoon(parentId, objectId, name)
            break;
          case "station":
            await galaxy.renameStation(objectId, name)
            break;
          case "ship":
            await galaxy.renameMyShip(name)
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
