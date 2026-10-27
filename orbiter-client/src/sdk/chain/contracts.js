// Every call the client makes to the Orbiter 8 contracts. Stores call these; nothing else touches ethers.
// Reads return plain JS values (see toPlain). Writes wait for the transaction to be mined and
// return the receipt. Failures reject, so callers can show them instead of hanging.
import { Contract, formatEther } from 'ethers'
import Orbiter8Abi from './abi/Orbiter8.json'
import AvatarControlsAbi from './abi/AvatarControls.json'
import { toPlain, toPlainEvent } from './convert'
import { getSession } from './wallet'
import { networkFor } from './networks'

/** @type {{ game: Contract, avatars: Contract } | null} */
let contracts = null

/** Binds the contracts for the connected network. Returns false if the game isn't deployed there. */
export async function initContracts() {
  const { signer, chainId, provider } = getSession()
  const network = networkFor(chainId)
  if (!network) return false
  // Make sure the addresses really hold contracts (a reset testnet keeps its chain id but loses its state).
  const [gameCode, avatarCode] = await Promise.all([
    provider.getCode(network.contracts.Orbiter8),
    provider.getCode(network.contracts.AvatarControls)
  ])
  if (gameCode === '0x' || avatarCode === '0x') return false
  contracts = {
    // Views run through the signer too, so msg.sender is the player (getMyShip etc. depend on it).
    game: new Contract(network.contracts.Orbiter8, Orbiter8Abi, signer),
    avatars: new Contract(network.contracts.AvatarControls, AvatarControlsAbi, signer)
  }
  return true
}

/** Addresses of the bound game and avatar contracts. */
export function contractAddresses() {
  return { game: contracts.game.target, avatars: contracts.avatars.target }
}

/**
 * Calls a view function and converts the result to plain JS values (bigints become numbers).
 * @param {'game' | 'avatars'} contract
 * @param {string} method  the ABI function name
 */
async function read(contract, method, ...args) {
  return toPlain(await contracts[contract][method](...args))
}

/**
 * Sends a transaction and waits for it to be mined; rejects with the revert reason if it fails.
 * `onSent` reports the moment the wallet has sent it (it's committed, not yet mined).
 * @param {'game' | 'avatars'} contract
 * @param {string} method
 * @param {unknown[]} args
 * @param {{ onSent?: (hash: string) => void }} [options]
 */
async function send(contract, method, args, { onSent } = {}) {
  const tx = await contracts[contract][method](...args)
  onSent?.(tx.hash)
  return settle(tx.wait())
}

/**
 * A mined transaction's receipt. A transaction the player sped up in their wallet is replaced by one
 * doing the same thing at a higher price ("repriced"): that counts as success. Cancelled or otherwise
 * replaced transactions, and reverts, still reject.
 */
async function settle(waiting) {
  try {
    return await waiting
  } catch (error) {
    if (error.code === 'TRANSACTION_REPLACED' && error.reason === 'repriced' && error.receipt?.status === 1) {
      return error.receipt
    }
    throw error
  }
}

/**
 * Waits for a transaction sent earlier (e.g. before a reload) to be mined. Resolves with its receipt,
 * or rejects if it reverted.
 * @param {string} hash
 */
export async function waitForTransaction(hash) {
  const receipt = await getSession().provider.waitForTransaction(hash)
  if (!receipt || receipt.status !== 1) throw new Error('The transaction failed on chain')
  return receipt
}

/**
 * Past events, shaped like web3's (`returnValues`, `blockNumber`) so the stores didn't need to change.
 * @param {'game' | 'avatars'} contract
 * @param {string} eventName
 * @param {number | 'latest'} fromBlock
 * @param {number | 'latest'} [toBlock]
 */
async function events(contract, eventName, fromBlock, toBlock = 'latest') {
  // Clamp: "the last N blocks" goes negative on a young chain (e.g. the local dev chain).
  const from = typeof fromBlock === 'number' ? Math.max(0, fromBlock) : fromBlock
  const logs = await contracts[contract].queryFilter(eventName, from, toBlock)
  return logs.map(toPlainEvent)
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
export const avatars = {
  getEvents: () => events('avatars', 'New', 'latest'),
  createAvatar: (name, options) => send('avatars', 'createAvatar', [name], options),
  getAvatarNameById: (id) => read('avatars', 'getAvatarNameById', id),
  getMyAvatarName: () => read('avatars', 'getMyAvatarName'),
  getAvatarNameByAddress: (owner) => read('avatars', 'getAvatarNameByAddress', owner),
  haveAvatar: () => read('avatars', 'haveAvatar'),
  getAvatarCount: () => read('avatars', 'getAvatarCount')
}

/** The Orbiter8 game contract. Method names match the ABI, except the three token getters. */
export const galaxy = {
  getEvents: (name, fromBlock) => events('game', name, fromBlock),
  getPlanetToken: () => read('game', 'getPlanetTokenizer'),
  getShipToken: () => read('game', 'getShipTokenizer'),
  getCreditToken: () => read('game', 'getCreditTokenizer'),
  myBalance: () => read('game', 'myBalance'),
  getSystemCount: () => read('game', 'getSystemCount'),
  getPlayerSystemData: () => read('game', 'getPlayerSystemData'),
  getSystemName: (systemId) => read('game', 'getSystemName', systemId),
  getPlanet: (planetId) => read('game', 'getPlanet', planetId),
  getMoon: (planetId, moonId) => read('game', 'getMoon', planetId, moonId),
  getStation: (planetId) => read('game', 'getStation', planetId),
  getShip: (shipId) => read('game', 'getShip', shipId),
  getMyShipLocation: () => read('game', 'getMyShipLocation'),
  getMyShipId: () => read('game', 'getMyShipId'),
  getMyShip: () => read('game', 'getMyShip'),

  // Transactions: each takes `options` last ({ onSent }, see send).
  sendChat: (message, options) => send('game', 'sendChat', [message], options),
  moveToSystem: (systemId, options) => send('game', 'moveToSystem', [systemId], options),
  renameStar: (name, options) => send('game', 'renameStar', [name], options),
  claimPlanet: (planetId, name, options) => send('game', 'claimPlanet', [planetId, name], options),
  buildStation: (planetId, name, options) => send('game', 'buildStation', [planetId, name], options),
  renamePlanet: (planetId, name, options) => send('game', 'renamePlanet', [planetId, name], options),
  renameMoon: (planetId, moonId, name, options) => send('game', 'renameMoon', [planetId, moonId, name], options),
  renameStation: (planetId, name, options) => send('game', 'renameStation', [planetId, name], options),
  tradeAtPort: (planetId, equipment, fuel, organics, options) =>
    send('game', 'tradeAtPort', [planetId, equipment, fuel, organics], options),
  launchShip: (name, options) => send('game', 'launchShip', [name], options),
  renameMyShip: (name, options) => send('game', 'renameMyShip', [name], options),
  addHoldsToShip: (planetId, holds, options) => send('game', 'addHoldsToShip', [planetId, holds], options)
}
