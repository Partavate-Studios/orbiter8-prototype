// What the player has seen of the galaxy. The contracts tell a player the neighbors of the system
// they're in, but not of any other system (getSystemData is internal). So each visit's neighbor list
// is remembered here, and the map of known systems grows as the player explores.

const PREFIX = 'o8.explored.'

/**
 * @param {{ chainId: number, game: string }} where  the network and game deployment (lists differ per deployment)
 * @param {Storage | null} [storage]  defaults to localStorage; missing or failing storage just remembers nothing
 */
export function createExploredMap(where, storage = defaultStorage()) {
  const key = PREFIX + where.chainId + '.' + String(where.game).toLowerCase()
  let systems = read()

  function read() {
    try {
      return JSON.parse(storage?.getItem(key) ?? '{}') ?? {}
    } catch {
      return {}
    }
  }

  return {
    /** Remembers a system's neighbors (non-empty slots only). */
    record(systemId, neighborIds) {
      const ids = neighborIds.map(Number).filter((id) => id > 0)
      systems = { ...systems, [Number(systemId)]: ids }
      try {
        storage?.setItem(key, JSON.stringify(systems))
      } catch {
        // full or blocked storage: the map just won't persist
      }
    },
    /** A system's neighbors, if the player has been there; otherwise null. */
    neighborsOf(systemId) {
      return systems[Number(systemId)] ?? null
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
