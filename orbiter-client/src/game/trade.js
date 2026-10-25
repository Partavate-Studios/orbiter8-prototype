// Cargo, trading at a port and buying cargo holds at a shipyard.

/**
 * @typedef {{ holds: number, equipment: number, fuel: number, organics: number }} ShipCargo
 * @typedef {{ equipment: number, fuel: number, organics: number }} Goods
 *   amounts per good; in a trade, positive buys from the port and negative sells to it
 */

/** Cargo holds a ship can have at most (enforced by the contract). */
export const MAX_CARGO_HOLDS = 250

/** Holds in use. @param {ShipCargo} ship */
export function usedHolds (ship) {
  return ship.equipment + ship.fuel + ship.organics
}

/** Free holds. @param {ShipCargo} ship */
export function emptyHolds (ship) {
  return ship.holds - usedHolds(ship)
}

/**
 * Credits gained by a trade (negative when it costs credits).
 * @param {Goods} amounts  what the player trades
 * @param {Goods} prices  the port's price per unit
 */
export function tradeBalance (amounts, prices) {
  return -(amounts.equipment * prices.equipment + amounts.fuel * prices.fuel + amounts.organics * prices.organics)
}

/** Free holds after the trade. @param {ShipCargo} ship @param {Goods} amounts */
export function emptyHoldsAfterTrade (ship, amounts) {
  return emptyHolds(ship) - amounts.equipment - amounts.fuel - amounts.organics
}

/** @param {Goods} amounts */
export function isEmptyTrade (amounts) {
  return amounts.equipment === 0 && amounts.fuel === 0 && amounts.organics === 0
}

/**
 * Whether a trade can go through: something is traded, the player can pay, and it fits.
 * @param {{ credits: number, ship: ShipCargo, amounts: Goods, prices: Goods }} trade
 */
export function isValidTrade ({ credits, ship, amounts, prices }) {
  if (isEmptyTrade(amounts)) return false
  if (credits + tradeBalance(amounts, prices) < 0) return false
  return emptyHoldsAfterTrade(ship, amounts) >= 0
}

/**
 * The most of one good the player can trade right now.
 * A port with a negative inventory buys that good: the player can sell what they carry, up to what
 * the port wants. Otherwise the port sells it: the player can buy what fits, up to what the port has.
 * @param {number} portGoods  the port's inventory of the good (negative = it's buying)
 * @param {number} shipGoods  how much the ship carries
 * @param {number} freeHolds  free holds, counting this good's current amount in the trade as free
 */
export function maxTradable (portGoods, shipGoods, freeHolds) {
  if (portGoods < 0) {
    return Math.min(Math.abs(shipGoods), Math.abs(portGoods))
  }
  return Math.min(freeHolds, portGoods)
}

/**
 * The trade amount for one good after the player asks for `requested` (e.g. by dragging a slider),
 * keeping the cargo within the ship's free holds. Selling more (a more negative amount) never needs
 * room; anything that adds cargo is limited to the free holds.
 * @param {number} requested  the amount asked for (negative sells)
 * @param {number} current  the amount in the trade so far
 * @param {number} freeHolds  free holds with the trade as it stands
 */
export function clampTradeAmount (requested, current, freeHolds) {
  if (requested <= 0 && requested <= current) {
    return requested
  }
  return current + Math.min(freeHolds, requested - current)
}

/**
 * Cargo holds the player can buy: limited by MAX_CARGO_HOLDS and by credits.
 * @param {number} credits
 * @param {number} currentHolds
 * @param {number} holdPrice
 */
export function maxHoldsToBuy (credits, currentHolds, holdPrice) {
  return Math.min(MAX_CARGO_HOLDS - currentHolds, Math.floor(credits / holdPrice))
}

/** Whether the player has enough credits for a purchase. */
export function canAfford (credits, cost) {
  return credits > cost
}
