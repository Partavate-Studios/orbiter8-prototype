// The chain itself, through the connected wallet: block numbers, whether the game changed, the
// player's native balance, and waiting for a transaction. The game's contracts are in sdk/contracts.js.
import { formatEther } from 'ethers'
import { getSession } from './wallet'

export async function waitForTransaction(hash) {
  const receipt = await getSession().provider.waitForTransaction(hash)
  if (!receipt || receipt.status !== 1) throw new Error('The transaction failed on chain')
  return receipt
}

/** The chain's latest block number. */
export async function getBlockNumber() {
  return getSession().provider.getBlockNumber()
}

// Past this many unseen blocks, checking each one costs more than just reloading.
const MAX_BLOCKS_TO_SCAN = 30

/**
 * Whether anything in the game changed in the blocks after `fromBlock` up to `toBlock`, without
 * re-reading everything. Two signs:
 * - any event from the game, avatar or token contracts (chat, trades, launches, and every claim,
 *   purchase or reward, since those move tokens or credits). This also catches actions sent from
 *   smart accounts (EIP-7702, Safe…), whose transactions go to a wallet contract that then calls
 *   the game, so the game never appears as a transaction's recipient;
 * - a transaction sent straight to one of those contracts, for the actions that emit no event
 *   (jumps, renames) from ordinary accounts.
 * Silent actions from smart accounts are still missed; the game client's periodic reload catches those.
 * @param {number} fromBlock  last block already accounted for
 * @param {number} toBlock
 * @param {string[]} addresses  contracts that matter (game, avatars, tokens)
 */
export async function gameChangedBetween(fromBlock, toBlock, addresses) {
  if (toBlock - fromBlock > MAX_BLOCKS_TO_SCAN) return true
  const contracts = addresses.filter(Boolean)
  const watched = new Set(contracts.map((address) => address.toLowerCase()))
  const { provider } = getSession()
  const logs = await provider.getLogs({ address: contracts, fromBlock: fromBlock + 1, toBlock })
  if (logs.length > 0) return true
  for (let number = fromBlock + 1; number <= toBlock; number++) {
    const block = await provider.getBlock(number, true)
    if (!block) return true
    if (block.prefetchedTransactions.some((tx) => tx.to && watched.has(tx.to.toLowerCase()))) return true
  }
  return false
}

/** Native currency balance of the connected account, as a decimal string (e.g. "0.25"). */
export async function getNativeBalance() {
  const { provider, account } = getSession()
  return formatEther(await provider.getBalance(account))
}

/** The AvatarControls contract: player names. Method names match the ABI. */
