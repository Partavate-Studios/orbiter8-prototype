// Keeps the Pinia stores in step with the SDK's game client (sdk/client.js). The client owns loading
// and refreshing; the stores only mirror what it reports, plus the UI's own reactions (sprites,
// the jump animation).
import { useChainStore } from '@/stores/chain'
import { useGameStateStore } from '@/stores/gamestate'
import { useStarMapStore } from '@/stores/starmap'

const FAILURE_MESSAGES = {
  player: 'Loading game state failed:',
  events: 'Loading recent events failed:',
  system: 'Loading the star map failed:'
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
