// Conversions at the boundary between ethers and the rest of the client.

/**
 * Converts a contract return value into plain JavaScript: bigints become Numbers and
 * ethers Result objects become arrays, recursively. Game values (ids, counts, coordinates,
 * credits with 0 decimals) are far below 2^53, so Numbers are exact; anything larger throws
 * rather than silently losing precision.
 * @param {unknown} value
 * @returns {any}
 */
export function toPlain (value) {
  if (typeof value === 'bigint') {
    if (value > BigInt(Number.MAX_SAFE_INTEGER) || value < BigInt(Number.MIN_SAFE_INTEGER)) {
      throw new RangeError(`Chain value ${value} is too large to convert to a Number`)
    }
    return Number(value)
  }
  if (Array.isArray(value)) return Array.from(value, toPlain)
  return value
}

/**
 * Converts an ethers EventLog into the shape the UI already uses (web3's `returnValues`).
 * @param {import('ethers').EventLog} log
 */
export function toPlainEvent (log) {
  const args = log.args.toObject()
  const returnValues = {}
  for (const [key, value] of Object.entries(args)) returnValues[key] = toPlain(value)
  return {
    event: log.eventName,
    blockNumber: log.blockNumber,
    transactionHash: log.transactionHash,
    returnValues
  }
}
