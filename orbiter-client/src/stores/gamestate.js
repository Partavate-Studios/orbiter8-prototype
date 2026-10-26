import { defineStore } from 'pinia'
import { game } from '@/sdk/client'
import { useUIStore } from '@/stores/ui'

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
    /** Reloads the player's avatar, ship and credits; the result arrives through importPlayer. */
    loadGameState() {
      console.debug('Loading game state...')
      return game.refreshPlayer()
    },
    /** Takes in freshly loaded player data (sdk/load.js loadPlayer) from the game client. */
    importPlayer(player) {
      if (player.avatar.registered) this.haveAvatar = true
      if (player.avatar.shipId > 0) this.haveShip = true
      this.gameState = player
      this.gameDataLoaded = true
    },
    /** Recent avatar sign-ups, ship launches, trades and chat, for the HUD counters and the chat menu. */
    loadEvents() {
      return game.refreshEvents()
    },
    /** player actions */
    async createAvatar(name) {
      await logFailure('Avatar creation', game.actions.createAvatar(name))
    },
    async launchShip(name) {
      await logFailure('Ship launch', game.actions.launchShip(name))
    },
    /**
     * Jumps the player's ship to a neighboring system. The jump animation starts as soon as the wallet
     * has sent the move (committed, not yet mined) and plays until the new system loads (StarMap
     * importSystem). Resolves true if the jump went through.
     */
    async moveToSystem(system) {
      const ui = useUIStore()
      ui.jumpPending = true
      try {
        await game.actions.moveTo(system, { onSent: () => ui.jumpAnimationOn() })
      } catch (error) {
        ui.jumpPending = false
        // A move that was sent but then failed: stop the animation (after its minimum time).
        ui.jumpAnimationOff()
        console.error('Jump failed:', error.shortMessage ?? error.message)
        return false
      }
      return true
    },
    async sendChat(message) {
      await logFailure('Sending chat', game.actions.sendChat(message))
    },
    async claimPlanet({ planetId, name }) {
      await logFailure('Claiming the planet', game.actions.claimPlanet(planetId, name))
    },
    async buildStation({ planetId, name }) {
      await logFailure('Building the station', game.actions.buildStation(planetId, name))
    },
    async tradeAtPort({ planetId, equipment, fuel, organics }) {
      await logFailure('Trade', game.actions.trade(planetId, { equipment, fuel, organics }))
    },
    async addHoldsToShip({ planetId, amount }) {
      await logFailure('Buying cargo holds', game.actions.buyHolds(planetId, amount))
    },
    /** Renames a star, planet, moon, station or the player's ship. `parentId` is a moon's planet. */
    async renameAsset({ name, type, objectId, parentId }) {
      await logFailure('Renaming', game.actions.rename({ type, objectId, parentId, name }))
    }
  }
})
