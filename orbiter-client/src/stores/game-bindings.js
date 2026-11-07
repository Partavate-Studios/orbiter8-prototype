// Keeps the Pinia stores in step with the SDK's game client (sdk/client.js). The client owns loading
// and refreshing; the stores only mirror what it reports, plus the UI's own reactions (sprites,
// the jump animation).
import { useChainStore } from '@/stores/chain'
import { useGameStateStore } from '@/stores/gamestate'
import { useStarMapStore } from '@/stores/starmap'
import { useDemo4Store } from '@/stores/demo4'
import { gameAudio } from '@/libs/08audio'

const FAILURE_MESSAGES = {
  player: 'Loading game state failed:',
  events: 'Loading recent events failed:',
  system: 'Loading the star map failed:'
}

// Broadcasts already heard of: the first load only fills it, so only new ones are announced.
let heardBroadcasts = null

/** Minerva announces a broadcast from another pilot that arrived since the last load. */
function announceBroadcasts(chatEvents, account) {
  if (!chatEvents) return
  const keys = chatEvents.map((event) => event.transactionHash)
  const fresh = heardBroadcasts
    ? chatEvents.filter(
        (event) =>
          !heardBroadcasts.has(event.transactionHash) &&
          String(event.returnValues._sender).toLowerCase() !== String(account).toLowerCase()
      )
    : []
  heardBroadcasts = new Set([...(heardBroadcasts ?? []), ...keys])
  if (fresh.length) gameAudio().speak('transmission')
}

/** @param {ReturnType<import('@/sdk/client').createGameClient>} game */
export function bindStoresToGame(game) {
  return game.subscribe((change, state) => {
    const chain = useChainStore()
    const gameState = useGameStateStore()
    const starMap = useStarMapStore()

    if (typeof change === 'object') {
      console.error(FAILURE_MESSAGES[change.what], change.error)
      return
    }
    // Demo 4's own state (sessions, planets, battle) follows every change.
    if (game.version === 4) useDemo4Store().sync()
    switch (change) {
      case 'connected':
        chain.chainId = state.chainId
        chain.account = state.account
        chain.balance = state.balance
        break
      case 'contracts':
        chain.galaxyAddress = state.contracts.game
        chain.avatarAddress = state.contracts.avatars
        chain.planetTokenAddress = state.contracts.planetToken
        chain.shipTokenAddress = state.contracts.shipToken
        chain.creditTokenAddress = state.contracts.creditToken
        break
      case 'balance':
        chain.balance = state.balance
        break
      case 'block':
        chain.currentBlockId = state.blockNumber
        break
      case 'loading':
        gameState.gameDataLoading = state.loading.player
        starMap.isLoading = state.loading.system
        break
      case 'player':
        gameState.importPlayer(state.player)
        break
      case 'events':
        gameState.events = state.events
        announceBroadcasts(state.events.chatEvents, chain.account)
        break
      case 'systemProgress':
        starMap.loadProgress = state.systemProgress
        break
      case 'system':
        starMap.importSystem(state.system, String(chain.account).toLowerCase())
        break
    }
  })
}
