// What's going on, for Minerva's plate (hud/minerva-plate.vue) and her Waiting page
// (hud/panels/minerva-panel.vue): one entry per thing that's under way.
// kind: 'needs' (it's waiting on the player: pink), 'failed' (pink, filled), 'busy' (nothing else of
// its sort can start until it's through: filled), 'wait' (only waiting: outlined).
import { game, BUILDING_NAMES } from '@orbiter8/sdk/client'
import { miningProgress } from '@orbiter8/sdk/game/mining'

/** "40 s", "12 min", "1.5 h": how long is left. */
export function leftWords(seconds) {
  if (seconds <= 0) return 'any moment'
  if (seconds < 60) return `${Math.ceil(seconds)} s`
  const minutes = Math.ceil(seconds / 60)
  return minutes < 60 ? `${minutes} min` : `${(minutes / 60).toFixed(1)} h`
}

/**
 * @param {object} context  { player (the Player store), transactions (its items), now (ms), myShip (the system's object for the ship, for where it's mining) }
 * @returns {{ id: string, kind: string, icon: string, words: string, where?: string, left?: string, part?: number, select?: string, menu?: string }[]}
 *   part: how far along, 0 to 1, when it's known; select: a sprite key the entry leads to; menu: a menu it leads to
 */
export function activities({ player, transactions, now, myShip }) {
  const list = []
  // moves: waiting for the wallet, on their way, failed
  for (const item of transactions) {
    if (item.status === 'wallet') list.push({ id: 'tx' + item.id, kind: 'needs', icon: 'wallet', words: item.doing, left: 'your signature' })
    else if (item.status === 'sent') list.push({ id: 'tx' + item.id, kind: 'busy', icon: 'go', words: item.doing, left: 'on its way' })
    else if (item.status === 'failed') list.push({ id: 'tx' + item.id, kind: 'failed', icon: 'close', words: item.failed, left: item.reason ?? '' })
  }
  // the ship mining (D93): busy until it stops
  const mining = miningProgress(player.mining, now)
  if (mining) {
    list.push({
      id: 'mining',
      kind: 'busy',
      icon: 'mine',
      words: `Mining${mining.drones ? ', ' + mining.drones + (mining.drones === 1 ? ' drone' : ' drones') : ''}`,
      where: `${mining.mined} of ${mining.room}`,
      left: mining.full ? 'holds full' : leftWords(mining.secondsLeft),
      part: mining.fraction,
      full: mining.full,
      select: myShip?.mining?.section
    })
  }
  // one of your planets under siege: it needs you
  for (const cell of player.besiegedCells ?? []) {
    list.push({ id: 'siege' + cell, kind: 'needs', icon: 'siege', words: 'One of your planets is under siege', where: game.starName(cell), left: '', menu: 'feed' })
  }
  // a long-range scan of the star you arrived at
  const scan = player.scan
  if (scan) {
    const seconds = Math.max(0, (scan.readyAt - now) / 1000)
    const where = scan.cell === player.ship?.cell ? 'this star' : game.starName(scan.cell)
    list.push({ id: 'scan', kind: 'wait', icon: 'scan', words: scan.status === 'due' ? 'Recording the scan' : 'Scanning', where, left: scan.status === 'due' ? 'with your next move' : leftWords(seconds), part: Math.min(1, 1 - seconds / 30) })
  }
  // buildings under way on your planets
  for (const planet of player.planets ?? []) {
    if (!planet.building || planet.owner !== player.account) continue
    const seconds = planet.readyAt - now / 1000
    const total = player.rules?.buildings?.[planet.building]?.time ?? 0
    list.push({ id: 'build' + planet.id, kind: 'wait', icon: 'build', words: 'Building the ' + (BUILDING_NAMES[planet.building] ?? 'next step'), where: planet.name ?? '', left: leftWords(seconds), part: total ? Math.max(0, Math.min(1, 1 - seconds / total)) : undefined, select: 'planet:' + planet.id })
  }
  // the Autofactories' orders
  for (const [id, factory] of Object.entries(player.factories ?? {})) {
    for (const [i, order] of (factory.queue ?? []).entries()) {
      const seconds = order.readyAt - now / 1000
      list.push({ id: `order${id}-${i}`, kind: 'wait', icon: 'order', words: `${order.count} × ${player.rules?.parts?.[order.part]?.name ?? 'part'}`, where: 'Autofactory', left: leftWords(seconds), select: 'planet:' + id })
    }
  }
  const order = { needs: 0, failed: 1, busy: 2, wait: 3 }
  return list.sort((a, b) => order[a.kind] - order[b.kind])
}

/** The session's time left in words ("3h 12m"), or null with no live session. */
export function sessionLeft(player) {
  if (!player.sessionLive) return null
  const seconds = Math.max(0, player.session.expiry - player.now / 1000)
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h ? `${h}h ${m}m` : `${m}m`
}
