// Events read a page at a time, and from then on only what's new. Public RPC providers cap how
// many blocks one eth_getLogs may span (Infura 10,000; some nodes 2,000), so every range is read
// in chunks of CHUNK_BLOCKS; and a log keeps its place, so each reload reads only the blocks since.

/** Blocks per eth_getLogs call: under every provider's cap seen so far. */
export const CHUNK_BLOCKS = 2000

/**
 * Reads `filter`'s events from `fromBlock` to `toBlock` (inclusive), CHUNK_BLOCKS at a time.
 * @param {import('ethers').BaseContract} contract
 * @param {unknown} filter  a contract filter, or '*' for every event
 */
export async function queryChunked(contract, filter, fromBlock, toBlock) {
  const logs = []
  for (let from = fromBlock; from <= toBlock; from += CHUNK_BLOCKS) {
    const to = Math.min(toBlock, from + CHUNK_BLOCKS - 1)
    logs.push(...(await contract.queryFilter(filter, from, to)))
  }
  return logs
}

/**
 * A rolling window of events: the last `lookback` blocks on the first read, then only the new
 * blocks on each `update`, with what fell out of the window dropped.
 * @template T
 * @param {object} options
 * @param {(fromBlock: number, toBlock: number) => Promise<T[]>} options.read  events in a block range, oldest first, each with a `block`
 * @param {number} options.lookback  how many blocks back the window reaches
 * @param {number} [options.startBlock]  the chain has no game events before this block (the deployment)
 */
export function createEventLog({ read, lookback, startBlock = 0 }) {
  /** @type {T[]} oldest first */
  let items = []
  let readTo = -1
  return {
    /** The events in the window, oldest first. */
    get items() {
      return items
    },
    /** Reads up to `latest` and returns the window. A failed read leaves the window as it was. */
    async update(latest) {
      const windowStart = Math.max(startBlock, latest - lookback + 1)
      const from = readTo < 0 ? windowStart : readTo + 1
      if (from <= latest) {
        const fresh = await read(from, latest)
        items = [...items, ...fresh]
        readTo = latest
      }
      items = items.filter((item) => item.block >= windowStart)
      return items
    }
  }
}
