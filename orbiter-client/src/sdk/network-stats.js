// How busy each of the game's networks is (pilots, star systems), read without a wallet through each
// network's public RPC, so a player can see where the game is alive before switching. Two calls per
// network; results are kept for a few minutes.
import { Contract, JsonRpcProvider } from 'ethers'
import PilotsAbi from '@/sdk/abi/Pilots.json'
import GalaxyAbi from '@/sdk/abi/Galaxy.json'
import { queryChunked } from '@/sdk/event-log'

const MAX_AGE_MS = 5 * 60 * 1000
// A public RPC that hasn't answered by then is treated as unreachable (the next one is tried).
const TIMEOUT_MS = 6000

/** chainId → { stats, loadedAt } */
const cache = new Map()

/**
 * @typedef {{ pilots: number, starSystems: number } | null} NetworkStats  null: no RPC answered
 */

/**
 * @param {import('@/sdk/chain/networks').Network} network
 * @returns {Promise<NetworkStats>}
 */
export async function loadNetworkStats(network) {
  const cached = cache.get(network.chainId)
  if (cached && Date.now() - cached.loadedAt < MAX_AGE_MS) return cached.stats
  let stats = null
  for (const url of network.rpc) {
    stats = await readStats(url, network).catch(() => null)
    if (stats) break
  }
  cache.set(network.chainId, { stats, loadedAt: Date.now() })
  return stats
}

async function readStats(url, network) {
  // staticNetwork: no chain-id probing (and no retrying forever when a node is down). No batching:
  // some free RPCs (dRPC) refuse JSON-RPC batches.
  const provider = new JsonRpcProvider(url, network.chainId, { staticNetwork: true, batchMaxCount: 1 })
  try {
    // Pilots registered, and stars discovered (each discovery's event) plus Sol.
    const pilots = new Contract(network.contracts.pilots, PilotsAbi, provider)
    const galaxy = new Contract(network.contracts.galaxy, GalaxyAbi, provider)
    const latest = await withTimeout(provider.getBlockNumber())
    const [count, discovered] = await withTimeout(
      Promise.all([pilots.pilotCount(), queryChunked(galaxy, galaxy.filters.Discovered(), network.startBlock ?? 0, latest)])
    )
    return { pilots: Number(count), starSystems: discovered.length + 1 }
  } finally {
    provider.destroy()
  }
}

function withTimeout(promise) {
  let timer
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('timed out')), TIMEOUT_MS)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}
