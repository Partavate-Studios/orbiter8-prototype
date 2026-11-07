// Notices when the game changes on chain. The contracts emit events for only a few actions, so for
// now "changed" means a new block contains a transaction to one of the game's contracts.
import { getBlockNumber, gameChangedBetween } from '@/sdk/chain/rpc'

/**
 * @param {object} options
 * @param {() => string[]} options.watchedAddresses  contracts whose transactions change the game
 * @param {(blockNumber: number, gameChanged: boolean) => void} options.onBlock  called once per new
 *   block number seen; `gameChanged` is always true for the first one
 */
export function createBlockWatcher({ watchedAddresses, onBlock }) {
  let lastBlock = 0
  let checking = false

  return {
    /** Looks for a new block. Calls overlapping a check still in flight are ignored. Rejects if the node fails. */
    async check() {
      if (checking) return
      checking = true
      try {
        const blockNumber = await getBlockNumber()
        if (blockNumber <= lastBlock) return
        const gameChanged = lastBlock === 0 || (await gameChangedBetween(lastBlock, blockNumber, watchedAddresses()))
        lastBlock = blockNumber
        onBlock(blockNumber, gameChanged)
      } finally {
        checking = false
      }
    }
  }
}
