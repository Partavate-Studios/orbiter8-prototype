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
export async function initContracts () {
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

export function contractAddresses () {
  return { game: contracts.game.target, avatars: contracts.avatars.target }
}

async function read (contract, method, ...args) {
  return toPlain(await contracts[contract][method](...args))
}

async function write (contract, method, ...args) {
  const tx = await contracts[contract][method](...args)
  return tx.wait()
}

async function events (contract, eventName, fromBlock, toBlock = 'latest') {
  // Clamp: "the last N blocks" goes negative on a young chain (e.g. the local dev chain).
  const from = typeof fromBlock === 'number' ? Math.max(0, fromBlock) : fromBlock
  const logs = await contracts[contract].queryFilter(eventName, from, toBlock)
  return logs.map(toPlainEvent)
}

export async function getBlockNumber () {
  return getSession().provider.getBlockNumber()
}

/** Native currency balance of the connected account, as a decimal string (e.g. "0.25"). */
export async function getNativeBalance () {
  const { provider, account } = getSession()
  return formatEther(await provider.getBalance(account))
}

export const avatars = {
  getEvents: () => events('avatars', 'New', 'latest'),
  createAvatar: name => write('avatars', 'createAvatar', name),
  getMyAvatarName: () => read('avatars', 'getMyAvatarName'),
  getAvatarNameByAddress: owner => read('avatars', 'getAvatarNameByAddress', owner),
  haveAvatar: () => read('avatars', 'haveAvatar'),
  getAvatarCount: () => read('avatars', 'getAvatarCount')
}

export const galaxy = {
  getEvents: (name, fromBlock) => events('game', name, fromBlock),
  getPlanetToken: () => read('game', 'getPlanetTokenizer'),
  getShipToken: () => read('game', 'getShipTokenizer'),
  getCreditToken: () => read('game', 'getCreditTokenizer'),
  myBalance: () => read('game', 'myBalance'),
  getSystemCount: () => read('game', 'getSystemCount'),
  getPlayerSystemData: () => read('game', 'getPlayerSystemData'),
  getSystemName: systemId => read('game', 'getSystemName', systemId),
  getPlanet: planetId => read('game', 'getPlanet', planetId),
  getMoon: (planetId, moonId) => read('game', 'getMoon', planetId, moonId),
  getStation: planetId => read('game', 'getStation', planetId),
  getShip: shipId => read('game', 'getShip', shipId),
  getMyShipLocation: () => read('game', 'getMyShipLocation'),
  getMyShipId: () => read('game', 'getMyShipId'),
  getMyShip: () => read('game', 'getMyShip'),

  sendChat: message => write('game', 'sendChat', message),
  moveToSystem: systemId => write('game', 'moveToSystem', systemId),
  renameStar: name => write('game', 'renameStar', name),
  claimPlanet: (planetId, name) => write('game', 'claimPlanet', planetId, name),
  buildStation: (planetId, name) => write('game', 'buildStation', planetId, name),
  renamePlanet: (planetId, name) => write('game', 'renamePlanet', planetId, name),
  renameMoon: (planetId, moonId, name) => write('game', 'renameMoon', planetId, moonId, name),
  renameStation: (planetId, name) => write('game', 'renameStation', planetId, name),
  tradeAtPort: (planetId, equipment, fuel, organics) => write('game', 'tradeAtPort', planetId, equipment, fuel, organics),
  launchShip: name => write('game', 'launchShip', name),
  renameMyShip: name => write('game', 'renameMyShip', name),
  addHoldsToShip: (planetId, holds) => write('game', 'addHoldsToShip', planetId, holds)
}
