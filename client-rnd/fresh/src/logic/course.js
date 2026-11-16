// A jump course: the fewest jumps from one star to another over the stars already charted, with the
// ship's range. A black hole adds one more way on: through to its partner.
import { disc } from '@orbiter8/sdk/hex'

const STAR = 2
const BLACK_HOLE = 3

/**
 * @param {Map<number, { cell: number, state: number, partner: number }>} cells  the charted map
 * @returns {{ to: number, kind: 'jump' | 'traverse' }[] | null}  the legs in order, [] when already there
 */
export function plotCourse(cells, from, to, range) {
  if (from === to) return []
  const landable = (cell) => {
    const state = cells.get(cell)?.state
    return state === STAR || state === BLACK_HOLE
  }
  if (!landable(to)) return null
  const came = new Map([[from, null]])
  const queue = [from]
  while (queue.length) {
    const here = queue.shift()
    if (here === to) break
    const next = disc(here, range)
      .filter((cell) => cell !== here && landable(cell))
      .map((cell) => ({ to: cell, kind: 'jump' }))
    const hole = cells.get(here)
    if (hole?.state === BLACK_HOLE && hole.partner && landable(hole.partner)) next.push({ to: hole.partner, kind: 'traverse' })
    for (const leg of next) {
      if (came.has(leg.to)) continue
      came.set(leg.to, { from: here, leg })
      queue.push(leg.to)
    }
  }
  if (!came.has(to)) return null
  const legs = []
  for (let at = to; came.get(at); at = came.get(at).from) legs.unshift(came.get(at).leg)
  return legs
}
