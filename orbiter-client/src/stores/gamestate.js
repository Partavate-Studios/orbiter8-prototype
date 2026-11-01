import { defineStore } from 'pinia'
import { game } from '@/sdk/client'
import { useUIStore } from '@/stores/ui'
import { useTransactionsStore } from '@/stores/transactions'
import { gameAudio } from '@/libs/08audio'

/** Shows a transaction's progress in the tray (stores/transactions.js). */
const track = (words, send) => useTransactionsStore().track(words, send)

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
        await game.actions.moveTo(system, {
          onSent: () => {
            gameAudio().speak('jumpStarting')
            ui.jumpAnimationOn()
          }
        })
      } catch (error) {
        ui.jumpPending = false
        const reason = error.shortMessage ?? error.message
        console.error('Jump failed:', reason)
        // Sent, then failed (reverted, dropped or replaced): the jump animation stalls and explains.
        // Rejected in the wallet: nothing was sent, and the neighbor view says so itself.
        if (ui.jumpAnimationState) ui.jumpStalled(reason)
        return false
      }
      return true
    },
    // The rest show their progress in the transaction tray, and resolve true if they went through.
    sendChat(message) {
      return track(
        { doing: 'Sending your message', done: 'Message sent', failed: "Couldn't send your message" },
        (options) => game.actions.sendChat(message, options)
      )
    },
    claimPlanet({ planetId, name }) {
      return track(
        { doing: 'Claiming ' + name, done: name + ' is yours', failed: "Couldn't claim " + name },
        (options) => game.actions.claimPlanet(planetId, name, options)
      )
    },
    buildStation({ planetId, name }) {
      return track(
        { doing: 'Building ' + name, done: name + ' is open for trade', failed: "Couldn't build " + name },
        (options) => game.actions.buildStation(planetId, name, options)
      )
    },
    tradeAtPort({ planetId, equipment, fuel, organics }) {
      return track({ doing: 'Trading', done: 'Trade done', failed: "The trade didn't go through" }, (options) =>
        game.actions.trade(planetId, { equipment, fuel, organics }, options)
      )
    },
    async addHoldsToShip({ planetId, amount }) {
      const holds = amount === 1 ? '1 cargo hold' : amount + ' cargo holds'
      const added = await track(
        { doing: 'Buying ' + holds, done: holds + ' added', failed: "Couldn't buy the cargo holds" },
        (options) => game.actions.buyHolds(planetId, amount, options)
      )
      if (added) gameAudio().speak('upgraded')
      return added
    },
    /** Renames a star, planet, moon, station or the player's ship. `parentId` is a moon's planet. */
    renameAsset({ name, type, objectId, parentId }) {
      return track(
        { doing: 'Renaming to ' + name, done: 'Renamed to ' + name, failed: "Couldn't rename to " + name },
        (options) => game.actions.rename({ type, objectId, parentId, name }, options)
      )
    }
  }
})
