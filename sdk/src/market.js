// Goods, ports and prices (docs/demo4-plan.md, section 4), mirroring contracts/src/market/Pricing.sol
// and Market.sol. Pure functions: the store, the play bot and the simulator share them.
//
// A port either sells a good or buys it. Its stock is a shortfall from full that restocks over time.
// Every unit moves the price, so a big trade pays the average over its units: costs round up,
// proceeds round down, as on chain.

const ceilDiv = (a, b) => (a === 0 ? 0 : Math.floor((a - 1) / b) + 1)

/** Credits for buying `units` from a selling port whose shortfall is `shortfall`. */
export function buyCost(base, spread, capacity, shortfall, units) {
  if (units === 0) return 0
  const bias = Math.floor(spread / 10)
  const steps = units * shortfall + (units * (units - 1)) / 2
  return units * (base - bias) + ceilDiv(spread * steps, capacity)
}

/** Credits for selling `units` to a buying port whose shortfall is `shortfall`. */
export function sellProceeds(base, spread, capacity, shortfall, units) {
  if (units === 0) return 0
  const bias = Math.floor(spread / 10)
  const steps = units * capacity - units * shortfall - (units * (units - 1)) / 2
  return units * (base + bias) + Math.floor((spread * steps) / capacity)
}

/** The shortfall after `elapsed` seconds of restocking. */
export function restocked(shortfall, elapsed, capacity, refill) {
  const regrown = Math.floor((elapsed * capacity) / refill)
  return regrown >= shortfall ? 0 : shortfall - regrown
}

/**
 * Restocks a stored shortfall up to `now`, returning [shortfall, updated] to store. The clock moves on
 * only by the time the regrown whole units took, so frequent trades don't lose partial units.
 */
export function restock(shortfall, updated, now, capacity, refill) {
  const regrown = Math.floor(((now - updated) * capacity) / refill)
  if (regrown >= shortfall) return [0, now]
  return [shortfall - regrown, updated + Math.floor((regrown * refill) / capacity)]
}

/** Credits for `count` more bays on a ship with `have`. */
export function baysCost(base, step, have, count) {
  return count * base + step * (count * have + (count * (count - 1)) / 2)
}

/** A fee of `bps` hundredths of a percent, rounded up. */
export function fee(amount, bps) {
  return ceilDiv(amount * bps, 10_000)
}

export const MODE = { NONE: 0, SELLS: 1, BUYS: 2 }

/** A port's id: the star, then the planet's place in its system. */
export const portId = (cell, body) => cell * 256 + body
export const portCell = (port) => Math.floor(port / 256)
export const portBody = (port) => port % 256

/** Sol's nine Federation stations (Market.sol's order), with their planets. Earth's has the yard. */
export const SOL_PORTS = [
  { station: 'Icarus', planet: 'Mercury' },
  { station: 'Port Hesperus', planet: 'Venus' },
  { station: 'I.S.S.', planet: 'Earth' },
  { station: 'Tiangong', planet: 'Mars' },
  { station: 'Tycho Station', planet: 'Jupiter' },
  { station: 'Ticonderoga', planet: 'Saturn' },
  { station: 'Oberon', planet: 'Uranus' },
  { station: 'Terra Venture', planet: 'Neptune' },
  { station: 'Nerva Beacon', planet: 'Pluto' }
]

/** A port's display names. */
export function portNames(port) {
  if (portCell(port) === 0 && portBody(port) < SOL_PORTS.length) return SOL_PORTS[portBody(port)]
  return { station: `Port ${portBody(port) + 1}`, planet: `Planet ${portBody(port) + 1}` }
}

/** What a port's next unit of a good costs (its quote's mode tells which way). */
export function unitPrice(good, tuning, quote) {
  return quote.mode === MODE.SELLS
    ? buyCost(good.base, good.spread, tuning.capacity, quote.shortfall, 1)
    : sellProceeds(good.base, good.spread, tuning.capacity, quote.shortfall, 1)
}
