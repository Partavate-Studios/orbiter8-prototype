// What the player has seen of the galaxy. The contracts tell a player the neighbors of the system
// they're in, but not of any other system (getSystemData is internal). So each visit's neighbor list
// is remembered here, and the map of known systems grows as the player explores.

const PREFIX = 'o8.explored.'
// Remember at most this many systems (the most recently visited), so storage can't grow forever:
// about 60 bytes each. A stopgap until the contracts can describe the galaxy themselves.
const MAX_SYSTEMS = 1000

/**
 * @param {{ chainId: number, game: string }} where  the network and game deployment (lists differ per deployment)
 * @param {Storage | null} [storage]  defaults to localStorage; missing or failing storage just remembers nothing
 */
export function createExploredMap(where, storage = defaultStorage()) {
  const key = PREFIX + where.chainId + '.' + String(where.game).toLowerCase()
  // system id → neighbor ids, oldest visit first (a Map keeps insertion order; plain objects sort
  // integer keys numerically). Stored as a list of [id, neighbors] pairs.
  let systems = read()

  function read() {
    try {
      const pairs = JSON.parse(storage?.getItem(key) ?? '[]')
      return new Map(Array.isArray(pairs) ? pairs : [])
    } catch {
      return new Map()
    }
  }

  return {
    /** Remembers a system's neighbors (non-empty slots only), as the most recent visit. */
    record(systemId, neighborIds) {
      const id = Number(systemId)
      systems.delete(id)
      systems.set(
        id,
        neighborIds.map(Number).filter((neighbor) => neighbor > 0)
      )
      while (systems.size > MAX_SYSTEMS) systems.delete(systems.keys().next().value)
      try {
        storage?.setItem(key, JSON.stringify([...systems]))
      } catch {
        // full or blocked storage: the map just won't persist
      }
    },
    /** A system's neighbors, if the player has been there; otherwise null. */
    neighborsOf(systemId) {
      return systems.get(Number(systemId)) ?? null
    },
    /** The system visited before the most recent one (where the player came from), or null. */
    previousVisit() {
      const visits = [...systems.keys()]
      return visits.length > 1 ? visits[visits.length - 2] : null
    }
  }
}

function defaultStorage() {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}
