import { TIMING } from '@/constants'
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
        credits: 0
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
    avatar: (state) => state.gameState.avatar
  },
  actions: {
    /** Loads general state information: avatar count, star system acount, player avatar data */
    async loadGameState() {
      console.debug('Loading game state...')
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
            credits: 0
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
          this.setProp({ key: 'haveAvatar', value: true })
        }

        if (gameState.avatar.shipId > 0) {
          /** We have a ship */
          const ship = await galaxy.getMyShip()
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
          this.setProp({ key: 'haveShip', value: true })
        }
        this.setProp({ key: 'gameState', value: gameState })
        this.setGameDataLoaded()
      } catch (error) {
        console.error('Loading game state failed:', error)
      }
    },
    /** Recent avatar sign-ups, ship launches, trades and chat, for the HUD counters and the chat menu. */
    async loadEvents() {
      let events = {
        avatarEvents: null,
        shipEvents: null,
        tradeEvents: null,
        chatEvents: null
      }
      let block = useChainStore().currentBlockId
      if (block > 0) {
        events.avatarEvents = await avatars.getEvents()
        events.shipEvents = await galaxy.getEvents('ShipLaunch', block - TIMING.EVENT_LOOKBACK_BLOCKS)
        events.tradeEvents = await galaxy.getEvents('PortTrade', block - TIMING.EVENT_LOOKBACK_BLOCKS)
        events.chatEvents = await galaxy.getEvents('ChatLog', block - TIMING.CHAT_LOOKBACK_BLOCKS)
      }
      this.setProp({ key: 'events', value: events })
    },
    /** player actions */
    async createAvatar(name) {
      this.setProp({ key: 'creatingAvatar', value: true })
      try {
        await avatars.createAvatar(name)
      } catch (error) {
        console.error('Avatar creation failed:', error.shortMessage ?? error.message)
      }
      this.setProp({ key: 'creatingAvatar', value: false })
    },
    async launchShip(name) {
      this.setProp({ key: 'launchingShip', value: true })
      try {
        await galaxy.launchShip(name)
      } catch (error) {
        console.error('Ship launch failed:', error.shortMessage ?? error.message)
      }
      this.setProp({ key: 'launchingShip', value: false })
    },
    /** Jumps the player's ship to a neighboring system, playing the jump animation until the new system loads. */
    async moveToSystem(system) {
      try {
        useUIStore().jumpAnimationOn()
        useUIStore().jumpMenuOff()
        await galaxy.moveToSystem(system)
      } catch (error) {
        console.error('Jump failed:', error.shortMessage ?? error.message)
        // Otherwise the "traveling" animation never ends (it stops when the new system loads).
        useUIStore().jumpAnimationOff()
      }
    },
    async sendChat(message) {
      try {
        await galaxy.sendChat(message)
      } catch (error) {
        console.error('Sending chat failed:', error.shortMessage ?? error.message)
      }
    },
    async claimPlanet({ planetId, name }) {
      try {
        await galaxy.claimPlanet(String(planetId), String(name))
      } catch (error) {
        console.error('Claiming the planet failed:', error.shortMessage ?? error.message)
      }
    },
    async buildStation({ planetId, name }) {
      try {
        await galaxy.buildStation(String(planetId), String(name))
      } catch (error) {
        console.error('Building the station failed:', error.shortMessage ?? error.message)
      }
    },
    async tradeAtPort({ planetId, equipment, fuel, organics }) {
      try {
        await galaxy.tradeAtPort(String(planetId), equipment, fuel, organics)
      } catch (error) {
        console.error('Trade failed:', error.shortMessage ?? error.message)
      }
    },
    async addHoldsToShip({ planetId, amount }) {
      try {
        await galaxy.addHoldsToShip(planetId, amount)
      } catch (error) {
        console.error('Buying cargo holds failed:', error.shortMessage ?? error.message)
      }
    },
    /** Renames a star, planet, moon, station or the player's ship. `parentId` is a moon's planet. */
    async renameAsset({ name, type, objectId, parentId }) {
      try {
        switch (type) {
          case 'star':
            await galaxy.renameStar(name)
            break
          case 'planet':
            await galaxy.renamePlanet(objectId, name)
            break
          case 'moon':
            await galaxy.renameMoon(parentId, objectId, name)
            break
          case 'station':
            await galaxy.renameStation(objectId, name)
            break
          case 'ship':
            await galaxy.renameMyShip(name)
            break
        }
      } catch (error) {
        console.error('Renaming failed:', error.shortMessage ?? error.message)
      }
    },
    setProp({ key, value }) {
      this[key] = value
    },
    setGameDataLoaded() {
      this.gameDataLoaded = true
      this.gameDataLoading = false
    },
    setGameDataLoading() {
      this.gameDataLoading = true
    }
  }
})
