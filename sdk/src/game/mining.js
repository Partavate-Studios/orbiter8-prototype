/** What one mining drone makes an hour, in thousandths of a unit: `Drones.milliPerHour` as deployed (a tunable). */
export const MINING_MILLI_PER_HOUR = 1875

/**
 * A ship mining an empty belt section (D93), as Drones.sol counts it: `rate` thousandths of a unit an
 * hour, from `since` (seconds), up to `room` units (the free bays when it started). Lazily, like the
 * contract: nothing is aboard until the pilot stops, but this is what stopping would load.
 *
 * `drones` is how many the contract counted when mining started (its rate is fixed then): the drones
 * that are mining, whatever the pilot has reassigned since.
 *
 * Returns { drones, mined, room, fraction, full, secondsLeft }, or null when the ship isn't mining.
 */
export function miningProgress(mining, nowMs) {
  if (!mining || !mining.since || !mining.rate || !mining.room) return null
  const { rate, room, since } = mining
  const elapsed = Math.max(0, nowMs / 1000 - since)
  // whole units, as _mined() rounds them down
  const mined = Math.min(room, Math.floor((rate * elapsed) / 3600 / 1000))
  const fullAt = since + (room * 1000 * 3600) / rate
  const secondsLeft = Math.max(0, Math.ceil(fullAt - nowMs / 1000))
  const drones = Math.round(rate / MINING_MILLI_PER_HOUR)
  return { drones, mined, room, fraction: Math.min(1, elapsed / (fullAt - since)), full: secondsLeft === 0, secondsLeft }
}
