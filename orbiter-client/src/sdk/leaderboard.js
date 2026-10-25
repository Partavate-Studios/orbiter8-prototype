// Who's winning: every player with a ship, with the planets, ports and credits they hold. Built from
// the token contracts alone (no contract changes needed): every player who has launched owns a ship
// NFT, ship tokens are enumerable, and planet ownership in the game *is* the planet NFT.
import Orbiter8Abi from '@/sdk/chain/abi/Orbiter8.json'
import AvatarControlsAbi from '@/sdk/chain/abi/AvatarControls.json'
import { readMany, readOnlyContract } from '@/sdk/chain/batch'
import { decodePlanet } from '@/sdk/chain/decode'

const ERC721_ABI = [
  'function totalSupply() view returns (uint256)',
  'function tokenByIndex(uint256 index) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function balanceOf(address owner) view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)'
]
const ERC20_ABI = ['function balanceOf(address owner) view returns (uint256)']

/**
 * The house account that owns Sol and stocks the galaxy. Deploy migration 13 creates its avatar
 * with this name, on every network, so it's recognized by name and left off the board.
 */
export const HOUSE_AVATAR_NAME = 'The Federation'

/**
 * @typedef {object} LeaderboardPlayer
 * @property {string} address  lowercase
 * @property {string} name  avatar name ('' if the address has no avatar)
 * @property {number} planets
 * @property {number} ports  planets with a space station
 * @property {number} credits
 */

/**
 * Orders players for the board: most of `by` first, ties broken by the other measure, then by name.
 * The house account is left out.
 * @param {LeaderboardPlayer[]} players
 * @param {'planets' | 'credits'} by
 */
export function rankPlayers(players, by = 'planets') {
  const other = by === 'planets' ? 'credits' : 'planets'
  return players
    .filter((player) => player.name !== HOUSE_AVATAR_NAME)
    .sort((a, b) => b[by] - a[by] || b[other] - a[other] || a.name.localeCompare(b.name))
}

/**
 * Reads every player's holdings. About five reads per player, batched (see sdk/chain/batch.js).
 * @param {{ game: string, avatars: string, planetToken: string, shipToken: string, creditToken: string }} contracts
 * @returns {Promise<LeaderboardPlayer[]>}  unranked; see rankPlayers
 */
export async function loadLeaderboard(contracts) {
  const ships = readOnlyContract(contracts.shipToken, ERC721_ABI)
  const planets = readOnlyContract(contracts.planetToken, ERC721_ABI)
  const credits = readOnlyContract(contracts.creditToken, ERC20_ABI)
  const avatars = readOnlyContract(contracts.avatars, AvatarControlsAbi)
  const game = readOnlyContract(contracts.game, Orbiter8Abi)

  // Every ship's owner is a player. The game contract itself never launches one, but skip it anyway.
  const [shipCount] = await readMany([{ contract: ships, method: 'totalSupply' }])
  const shipIds = await readMany(
    range(shipCount).map((index) => ({ contract: ships, method: 'tokenByIndex', args: [index] }))
  )
  const shipOwners = await readMany(shipIds.map((id) => ({ contract: ships, method: 'ownerOf', args: [id] })))
  const gameAddress = contracts.game.toLowerCase()
  const addresses = [...new Set(shipOwners.filter(Boolean).map((owner) => owner.toLowerCase()))].filter(
    (address) => address !== gameAddress
  )

  const holdings = await readMany(
    addresses.flatMap((address) => [
      { contract: avatars, method: 'getAvatarNameByAddress', args: [address] },
      { contract: planets, method: 'balanceOf', args: [address] },
      { contract: credits, method: 'balanceOf', args: [address] }
    ])
  )
  const players = addresses.map((address, index) => ({
    address,
    name: holdings[index * 3] ?? '',
    planets: Number(holdings[index * 3 + 1] ?? 0),
    credits: Number(holdings[index * 3 + 2] ?? 0),
    ports: 0
  }))

  // Ports: which of each player's planets have a space station.
  const owned = players.flatMap((player) =>
    range(player.planets).map((index) => ({
      player,
      call: { contract: planets, method: 'tokenOfOwnerByIndex', args: [player.address, index] }
    }))
  )
  const planetIds = await readMany(owned.map(({ call }) => call))
  const planetData = await readMany(planetIds.map((id) => ({ contract: game, method: 'getPlanet', args: [id] })))
  planetData.forEach((tuple, index) => {
    if (tuple && decodePlanet(planetIds[index], tuple).hasStation) owned[index].player.ports++
  })
  return players
}

function range(count) {
  return Array.from({ length: Number(count) || 0 }, (_, index) => index)
}
