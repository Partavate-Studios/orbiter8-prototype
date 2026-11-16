// The Agenda: every timer the pilot has, wherever it is, as one list sorted by when it comes due.
// Pure: built from a snapshot of state, so it can be tested and rebuilt every second cheaply.
const ROUND = 30 * 60

/**
 * When a siege's next round falls (ms). The contracts play every round due whenever anyone reads or
 * moves, so the last checkpoint is often rounds behind: count on from it to the first round after `now`.
 */
export function nextRound(checkpoint, now) {
  const done = now ? Math.max(0, Math.floor((now / 1000 - checkpoint) / ROUND)) : 0
  return (checkpoint + ROUND * (done + 1)) * 1000
}
/** Whether a round of a siege fell between two moments (ms). */
export const roundFell = (checkpoint, before, now) =>
  Math.floor((now / 1000 - checkpoint) / ROUND) > Math.floor((before / 1000 - checkpoint) / ROUND)
const FIRST_CLAIM = 10 * 60
const BUILDINGS = ['', 'Citadel', 'Colony', 'Station', 'Port', 'Yards', 'Armory', 'Autofactory']

/**
 * @param {object} s
 * @param {string} s.account
 * @param {{ cell: number, readyAt: number, status: string } | null} s.scan  (ms)
 * @param {object[]} s.holdings  [{ id, name, building, readyAt, factory, siege }]
 * @param {object[]} s.sieges  sieges at the ship's star (sdk toSiege)
 * @param {object | null} s.condition
 * @param {{ expiry: number } | null} s.session
 * @param {{ cell: number, discoverer: string, discoveredAt: number, unclaimed: number } | null} s.here
 * @param {(cell: number) => string} s.starName
 * @param {(id: number) => string} s.planetName
 * @param {string[]} s.partNames
 * @param {number} [s.now]  the chain's clock (ms), to count siege rounds on from their checkpoint
 * @returns {{ id: string, kind: string, title: string, where: string, at: number, planet?: number, cell?: number }[]}  `at` in ms
 */
export function buildAgenda(s) {
  const items = []
  const add = (item) => items.push(item)
  if (s.scan) {
    add({ id: 'scan', kind: 'scan', title: 'Long-range scan', where: s.starName(s.scan.cell), at: s.scan.readyAt, cell: s.scan.cell })
  }
  for (const p of s.holdings ?? []) {
    if (p.building) {
      add({ id: `build:${p.id}`, kind: 'build', title: `${BUILDINGS[p.building]} finishes`, where: p.name, at: p.readyAt * 1000, planet: p.id })
    }
    for (const [i, order] of (p.factory?.queue ?? []).entries()) {
      add({
        id: `order:${p.id}:${i}`,
        kind: 'order',
        title: `${order.count} × ${s.partNames[order.part] ?? 'part'}`,
        where: p.name,
        at: order.readyAt * 1000,
        planet: p.id
      })
    }
  }
  const seen = new Set()
  const sieges = [...(s.sieges ?? []), ...(s.holdings ?? []).map((p) => p.siege).filter(Boolean)]
  for (const siege of sieges) {
    if (seen.has(siege.planet)) continue
    seen.add(siege.planet)
    const mine = siege.attacker === s.account
    const defending = (s.holdings ?? []).some((p) => p.id === siege.planet)
    if (!mine && !defending) continue
    const where = s.planetName(siege.planet)
    if (siege.claimAt) {
      add({ id: `claim:${siege.planet}`, kind: 'claim', title: mine ? 'Your claim completes' : 'Claim against you completes', where, at: siege.claimAt * 1000, planet: siege.planet })
    }
    add({ id: `round:${siege.planet}`, kind: 'siege', title: mine ? 'Siege: next round' : 'Under siege: next round', where, at: nextRound(siege.checkpoint, s.now), planet: siege.planet })
  }
  if (s.condition?.dockedUntil) {
    add({ id: 'yard', kind: 'yard', title: 'Out of the repair yard', where: 'Your ship', at: s.condition.dockedUntil * 1000 })
  }
  if (s.session) add({ id: 'session', kind: 'session', title: 'Autopilot ends', where: 'Your ship', at: s.session.expiry * 1000 })
  if (s.here && s.here.discoverer === s.account && s.here.unclaimed > 0) {
    add({ id: 'first', kind: 'first', title: 'First-claim window closes', where: s.starName(s.here.cell), at: (s.here.discoveredAt + FIRST_CLAIM) * 1000, cell: s.here.cell })
  }
  return items.sort((a, b) => a.at - b.at)
}

/** Items already due are dropped when nothing is left to do about them. */
export const liveAgenda = (items, now) =>
  items.filter((item) => item.at > now || ['scan', 'claim', 'siege'].includes(item.kind))
