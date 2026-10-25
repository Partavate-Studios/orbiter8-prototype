import { defineStore } from 'pinia'
import { loadPlayer, loadRecentEvents } from '@/sdk/load'
import * as game from '@/sdk/actions'
import { useUIStore } from '@/stores/ui'
import { useChainStore } from '@/stores/chain'

/** Waits for a player action; if it fails, logs why (the revert reason when there is one). */
async function logFailure(what, action) {
  try {
    await action
  } catch (error) {
    console.error(what + ' failed:', error.shortMessage ?? error.message)
  }
}

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
    /** Loads general state information: avatar count, star system count, player avatar data */
    async loadGameState() {
      console.debug('Loading game state...')
      this.setGameDataLoading()
      try {
        const gameState = await loadPlayer()
        if (gameState.avatar.registered) this.haveAvatar = true
        if (gameState.avatar.shipId > 0) this.haveShip = true
        this.gameState = gameState
        this.setGameDataLoaded()
      } catch (error) {
        console.error('Loading game state failed:', error)
      }
    },
    /** Recent avatar sign-ups, ship launches, trades and chat, for the HUD counters and the chat menu. */
    async loadEvents() {
      this.events = await loadRecentEvents(useChainStore().currentBlockId)
    },
    /** player actions */
    async createAvatar(name) {
      this.creatingAvatar = true
      try {
        await game.createAvatar(name)
      } catch (error) {
        console.error('Avatar creation failed:', error.shortMessage ?? error.message)
      }
      this.creatingAvatar = false
    },
    async launchShip(name) {
      this.launchingShip = true
      try {
        await game.launchShip(name)
      } catch (error) {
        console.error('Ship launch failed:', error.shortMessage ?? error.message)
      }
      this.launchingShip = false
    },
    /** Jumps the player's ship to a neighboring system, playing the jump animation until the new system loads. */
    async moveToSystem(system) {
      try {
        useUIStore().jumpAnimationOn()
        useUIStore().jumpMenuOff()
        await game.moveTo(system)
      } catch (error) {
        console.error('Jump failed:', error.shortMessage ?? error.message)
        // Otherwise the "traveling" animation never ends (it stops when the new system loads).
        useUIStore().jumpAnimationOff()
      }
    },
    async sendChat(message) {
      await logFailure('Sending chat', game.sendChat(message))
    },
    async claimPlanet({ planetId, name }) {
      await logFailure('Claiming the planet', game.claimPlanet(planetId, name))
    },
    async buildStation({ planetId, name }) {
      await logFailure('Building the station', game.buildStation(planetId, name))
    },
    async tradeAtPort({ planetId, equipment, fuel, organics }) {
      await logFailure('Trade', game.trade(planetId, { equipment, fuel, organics }))
    },
    async addHoldsToShip({ planetId, amount }) {
      await logFailure('Buying cargo holds', game.buyHolds(planetId, amount))
    },
    /** Renames a star, planet, moon, station or the player's ship. `parentId` is a moon's planet. */
    async renameAsset({ name, type, objectId, parentId }) {
      await logFailure('Renaming', game.rename({ type, objectId, parentId, name }))
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
