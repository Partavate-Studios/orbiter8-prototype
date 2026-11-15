// Who's winning: every pilot with their planets, ports and credits (sdk/client.js getLeaderboard).

/**
 * @typedef {object} LeaderboardPlayer
 * @property {string} address  lowercase
 * @property {string} name  call sign
 * @property {number} planets
 * @property {number} ports  planets with a port
 * @property {number} credits
 */

/**
 * Orders players for the board: most of `by` first, ties broken by the other measure, then by name.
 * @param {LeaderboardPlayer[]} players
 * @param {'planets' | 'credits'} by
 */
export function rankPlayers(players, by = 'planets') {
  const other = by === 'planets' ? 'credits' : 'planets'
  return players
    .sort((a, b) => b[by] - a[by] || b[other] - a[other] || a.name.localeCompare(b.name))
}
