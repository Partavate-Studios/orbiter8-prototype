// drand's evmnet beacon (docs/demo4-plan.md, D35), mirroring contracts/src/randomness/Drand.sol.
// The contracts name a future round for every scan; the client fetches that round's signature from
// drand's public relays and passes it in with the player's next move. A forged signature would fail
// the contracts' check, so the relays don't need to be trusted, only reachable.

export const GENESIS_TIME = 1727521075
export const PERIOD = 3
const BEACON = 'evmnet'
/** Public relays, tried in turn. */
export const RELAYS = ['https://api.drand.sh', 'https://api2.drand.sh', 'https://api3.drand.sh']

/** The round being published at a Unix time (seconds). */
export function roundAt(timestamp) {
  if (timestamp < GENESIS_TIME) return 0
  return Math.floor((timestamp - GENESIS_TIME) / PERIOD) + 1
}

/** When a round is published (Unix seconds). */
export function timeOf(round) {
  return GENESIS_TIME + (round - 1) * PERIOD
}

const cache = new Map()

/**
 * A round's signature as 0x-hex, or null if it isn't published yet. Cached; signatures never change.
 * @param {number} round
 * @param {typeof fetch} [fetchImpl]
 */
export async function fetchRound(round, fetchImpl = fetch) {
  if (cache.has(round)) return cache.get(round)
  if (timeOf(round) > Date.now() / 1000) return null
  let lastError
  for (const relay of RELAYS) {
    try {
      const res = await fetchImpl(`${relay}/v2/beacons/${BEACON}/rounds/${round}`)
      if (res.status === 404 || res.status === 425) return null
      if (!res.ok) throw new Error(`${relay}: ${res.status}`)
      const { signature } = await res.json()
      const hex = '0x' + signature
      cache.set(round, hex)
      return hex
    } catch (error) {
      lastError = error
    }
  }
  throw lastError ?? new Error('No drand relay answered')
}
