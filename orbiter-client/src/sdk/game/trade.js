// Cargo, trading at a port and buying cargo holds at a shipyard, for either demo. Goods are lists:
// a station's `goods` are [{ id, name, mode: 'sells' | 'buys', stock, price, curve }] (sdk/system.js,
// sdk/v4/client.js), and the ship carries `cargo` (units by good id) with `usedHolds` in use. Demo 3's
// prices are flat (`curve` null); Demo 4's move with every unit (`curve`, sdk/v4/market.js).
import { buyCost, sellProceeds, fee } from '@/sdk/v4/market'

/**
 * @typedef {{ holds: number, usedHolds: number, cargo: number[] }} ShipCargo
 * @typedef {{ id: number, name: string, mode: 'sells' | 'buys', stock: number, price: number,
 *   curve: { base: number, spread: number, capacity: number, shortfall: number, feeBps: number } | null }} StationGood
 * @typedef {Record<number, number>} Amounts  units by good id; positive buys from the port, negative sells to it
 */

/** Cargo holds a ship can have at most (enforced by the contracts). */
export const MAX_CARGO_HOLDS = 250

/** Free holds. @param {ShipCargo} ship */
export function emptyHolds(ship) {
  return ship.holds - ship.usedHolds
}

/**
 * Credits for `units` of a good: what buying them costs (fee included), or what selling them pays
 * (fee taken). Always positive.
 * @param {StationGood} good
 * @param {number} units  positive buys, negative sells
 */
export function lineValue(good, units) {
  if (units === 0) return 0
  if (!good.curve) return Math.abs(units) * good.price
  const { base, spread, capacity, shortfall, feeBps } = good.curve
  if (units > 0) {
    const cost = buyCost(base, spread, capacity, shortfall, units)
    return cost + fee(cost, feeBps)
  }
  const proceeds = sellProceeds(base, spread, capacity, shortfall, -units)
  return proceeds - fee(proceeds, feeBps)
}

/**
 * Credits gained by a trade (negative when it costs credits).
 * @param {Amounts} amounts
 * @param {StationGood[]} goods
 */
export function tradeBalance(amounts, goods) {
  return goods.reduce((sum, good) => {
    const units = amounts[good.id] ?? 0
    return sum + (units > 0 ? -lineValue(good, units) : lineValue(good, units))
  }, 0)
}

const totalUnits = (amounts) => Object.values(amounts).reduce((a, b) => a + b, 0)

/** Free holds after the trade. @param {ShipCargo} ship @param {Amounts} amounts */
export function emptyHoldsAfterTrade(ship, amounts) {
  return emptyHolds(ship) - totalUnits(amounts)
}

/** @param {Amounts} amounts */
export function isEmptyTrade(amounts) {
  return Object.values(amounts).every((units) => units === 0)
}

/**
 * Whether a trade can go through: something is traded, the player can pay, and it fits.
 * @param {{ credits: number, ship: ShipCargo, amounts: Amounts, goods: StationGood[] }} trade
 */
export function isValidTrade({ credits, ship, amounts, goods }) {
  if (isEmptyTrade(amounts)) return false
  if (credits + tradeBalance(amounts, goods) < 0) return false
  return emptyHoldsAfterTrade(ship, amounts) >= 0
}

/**
 * The most of one good the player can trade right now: what they carry, up to what the port wants,
 * when it's buying; what fits, up to what the port has, when it's selling.
 * @param {StationGood} good
 * @param {number} shipUnits  how much the ship carries
 * @param {number} freeHolds  free holds, counting this good's current amount in the trade as free
 */
export function maxTradable(good, shipUnits, freeHolds) {
  if (good.mode === 'buys') return Math.min(shipUnits, good.stock)
  return Math.max(0, Math.min(freeHolds, good.stock))
}

/**
 * The trade amount for one good after the player asks for `requested` (e.g. by dragging a slider),
 * keeping the cargo within the ship's free holds. Selling more (a more negative amount) never needs
 * room; anything that adds cargo is limited to the free holds.
 * @param {number} requested  the amount asked for (negative sells)
 * @param {number} current  the amount in the trade so far
 * @param {number} freeHolds  free holds with the trade as it stands
 */
export function clampTradeAmount(requested, current, freeHolds) {
  if (requested <= 0 && requested <= current) {
    return requested
  }
  return current + Math.min(freeHolds, requested - current)
}

/**
 * Cargo holds the player can buy at a flat price (Demo 3): limited by MAX_CARGO_HOLDS and by credits.
 * @param {number} credits
 * @param {number} currentHolds
 * @param {number} holdPrice
 */
export function maxHoldsToBuy(credits, currentHolds, holdPrice) {
  return Math.min(MAX_CARGO_HOLDS - currentHolds, Math.floor(credits / holdPrice))
}

/** Whether the player has enough credits for a purchase. */
export function canAfford(credits, cost) {
  return credits >= cost
}

/**
 * What the ship carries, for the HUD and the ship's card: the goods aboard (all of them when there
 * are few, as in Demo 3), by name, and the free holds.
 * @param {ShipCargo} ship
 * @param {string[]} names  goods by id
 * @returns {Array<{ name: string, units: number }>}
 */
export function cargoLines(ship, names) {
  const cargo = ship.cargo ?? []
  const lines = names.length <= 3 ? names.map((name, id) => ({ name, units: cargo[id] ?? 0 })) : []
  if (names.length > 3) {
    names.forEach((name, id) => {
      if ((cargo[id] ?? 0) > 0) lines.push({ name, units: cargo[id] })
    })
  }
  return lines
}

/** Short names for the HUD's narrow columns (Demo 3 showed "Fuel"); other names are short already. */
const SHORT_NAMES = {
  'Fuel Ore': 'Fuel',
  'Water ice': 'Ice',
  'Rare elements': 'Rares',
  'Helium-3': 'He-3',
  Electronics: 'Electr.',
  Equipment: 'Equip.'
}

/** A good's name for a column: a wide one shortens only the longest names, a narrow one all long ones. */
export function shortGoodName(name, wide = false) {
  if (wide) return name.length > 11 ? (SHORT_NAMES[name] ?? name) : name
  return SHORT_NAMES[name] ?? name
}
