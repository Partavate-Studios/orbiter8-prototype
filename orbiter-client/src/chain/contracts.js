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
 * Sends a transaction and waits for it to be mined. Rejects with the revert reason if it fails.
 * @param {'game' | 'avatars'} contract
 * @param {string} method  the ABI function name
 */
async function write(contract, method, ...args) {
  const tx = await contracts[contract][method](...args)
  return tx.wait()
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
 * Whether any block after `fromBlock` up to `toBlock` has a transaction sent to one of the given
 * contracts. Every game action is such a transaction, but the contracts only emit events for a few
 * of them, so this is how we tell "something in the game changed" without re-reading everything.
 * @param {number} fromBlock  last block already accounted for
 * @param {number} toBlock
 * @param {string[]} addresses  contracts that matter (game, avatars, tokens)
 */
export async function gameChangedBetween(fromBlock, toBlock, addresses) {
  if (toBlock - fromBlock > MAX_BLOCKS_TO_SCAN) return true
  const watched = new Set(addresses.filter(Boolean).map((address) => address.toLowerCase()))
  const { provider } = getSession()
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
  createAvatar: (name) => write('avatars', 'createAvatar', name),
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

  sendChat: (message) => write('game', 'sendChat', message),
  moveToSystem: (systemId) => write('game', 'moveToSystem', systemId),
  renameStar: (name) => write('game', 'renameStar', name),
  claimPlanet: (planetId, name) => write('game', 'claimPlanet', planetId, name),
  buildStation: (planetId, name) => write('game', 'buildStation', planetId, name),
  renamePlanet: (planetId, name) => write('game', 'renamePlanet', planetId, name),
  renameMoon: (planetId, moonId, name) => write('game', 'renameMoon', planetId, moonId, name),
  renameStation: (planetId, name) => write('game', 'renameStation', planetId, name),
  tradeAtPort: (planetId, equipment, fuel, organics) =>
    write('game', 'tradeAtPort', planetId, equipment, fuel, organics),
  launchShip: (name) => write('game', 'launchShip', name),
  renameMyShip: (name) => write('game', 'renameMyShip', name),
  addHoldsToShip: (planetId, holds) => write('game', 'addHoldsToShip', planetId, holds)
}
