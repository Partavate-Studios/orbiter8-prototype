// How many ports each star has, for the galaxy map (Koda, round 2, item 8: "it might be nice to see how
// many ports a star system has"). Known for the stars someone has been to: the system you're in counts
// its stations as it loads; other visited stars are read from the Market (`portsAt`) as the map shows
// them, a few at a time, over a read-only connection of their own. Unvisited stars have none to count
// (a port needs a claimed planet). Remembered in this browser per deployment, re-read when old.
//
// The SDK's game client doesn't offer other stars' ports, so this reads them itself (listed for Koda).
import { reactive } from 'vue'
import { JsonRpcProvider } from 'ethers'
import { createGame } from '@orbiter8/sdk/contracts'
import { networkFor } from '@orbiter8/sdk/chain/networks'

/** A count older than this is read again when the map shows its star. */
const MAX_AGE_MS = 10 * 60 * 1000
/** Reads at once. */
const PARALLEL = 3

/** cell → { count, at } (at: when it was read, ms). */
const counts = reactive(new Map())
let storageKey = null
let reader = null
const queue = []
const queued = new Set()
let running = 0

/** Starts (or switches) the counts for a network: loads what this browser remembers. */
export function usePortCounts(chainId) {
  const network = networkFor(chainId)
  const key = network ? `o8.ports.${chainId}.${network.contracts.market}` : null
  if (key === storageKey) return counts
  storageKey = key
  reader = null
  counts.clear()
  if (!key) return counts
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? '{}')
    for (const [cell, entry] of Object.entries(saved)) counts.set(Number(cell), entry)
  } catch {
    // (nothing remembered, or storage unavailable)
  }
  reader = () => {
    const provider = new JsonRpcProvider(network.rpc[0], network.chainId, { staticNetwork: true, batchMaxCount: 1 })
    const game = createGame(provider, network.contracts)
    reader = () => game
    return game
  }
  return counts
}

function save() {
  if (!storageKey) return
  try {
    localStorage.setItem(storageKey, JSON.stringify(Object.fromEntries(counts)))
  } catch {
    // (storage full or unavailable: the counts are still known for this visit)
  }
}

/** The system you're in has loaded: its stations are its ports. */
export function recordPorts(cell, count) {
  const known = counts.get(cell)
  if (known && known.count === count && Date.now() - known.at < MAX_AGE_MS) return
  counts.set(cell, { count, at: Date.now() })
  save()
}

/** A star's port count, or null while it isn't known. */
export function portCount(cell) {
  return counts.get(cell)?.count ?? null
}

/** Asks for the counts of these (visited) stars that aren't known or are old; they arrive as they're read. */
export function wantPortCounts(cells) {
  if (!reader) return
  const now = Date.now()
  for (const cell of cells) {
    const known = counts.get(cell)
    if (queued.has(cell) || (known && now - known.at < MAX_AGE_MS)) continue
    queued.add(cell)
    queue.push(cell)
  }
  pump()
}

function pump() {
  while (running < PARALLEL && queue.length && reader) {
    const cell = queue.shift()
    running++
    reader()
      .portsAt(cell)
      .then((ports) => {
        counts.set(cell, { count: ports.length, at: Date.now() })
        save()
      })
      .catch(() => {
        // (the node didn't answer: tried again the next time the map shows this star)
      })
      .finally(() => {
        queued.delete(cell)
        running--
        pump()
      })
  }
}
