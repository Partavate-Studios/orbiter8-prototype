// Trade planning at one star. Every port at a star is reachable at once (the rules only ask that the
// ship be at the port's star), so the useful question is not "what does this port sell" but "which
// buy here pairs with which sell here, for the bays and credits I have". Prices come from the SDK's
// mirror of Pricing.sol, so a plan's figures are what the contracts will charge if nobody trades
// in between.
import { buyCost, sellProceeds, fee, MODE } from '@orbiter8/sdk/market'

/** What buying `units` costs, fee included. */
export function buyTotal(good, capacity, shortfall, units, feeBps) {
  const cost = buyCost(good.base, good.spread, capacity, shortfall, units)
  return cost + fee(cost, feeBps)
}
/** What selling `units` pays, fee taken. */
export function sellTotal(good, capacity, shortfall, units, feeBps) {
  const proceeds = sellProceeds(good.base, good.spread, capacity, shortfall, units)
  return proceeds - fee(proceeds, feeBps)
}

/**
 * The load that earns the most between a selling port and a buying port: each unit bought costs
 * more and each unit sold fetches less, so profit rises, peaks, then falls.
 * @returns {{ units: number, cost: number, proceeds: number, profit: number } | null}
 */
export function bestLoad({ good, capacity, feeBps, fromShortfall, toShortfall, maxUnits, credits }) {
  const limit = Math.min(maxUnits, capacity - fromShortfall, capacity - toShortfall)
  let best = null
  for (let units = 1; units <= limit; units++) {
    const cost = buyTotal(good, capacity, fromShortfall, units, feeBps)
    if (cost > credits) break
    const proceeds = sellTotal(good, capacity, toShortfall, units, feeBps)
    const profit = proceeds - cost
    if (best && profit <= best.profit) break
    if (profit > 0) best = { units, cost, proceeds, profit }
  }
  return best
}

/**
 * Every profitable buy→sell pair among `ports` (sdk state.ports), best first; one per good and pair.
 * @param {{ ports: object[], economy: object, freeBays: number, credits: number }} at
 */
export function planRoutes({ ports, economy, freeBays, credits }) {
  const { goods, capacity } = economy
  const { feeBps } = economy.tuning
  const routes = []
  goods.forEach((good, id) => {
    const sellers = ports.filter((p) => p.quotes[id]?.mode === MODE.SELLS)
    const buyers = ports.filter((p) => p.quotes[id]?.mode === MODE.BUYS)
    for (const from of sellers) {
      for (const to of buyers) {
        const load = bestLoad({
          good,
          capacity,
          feeBps,
          fromShortfall: from.quotes[id].shortfall,
          toShortfall: to.quotes[id].shortfall,
          maxUnits: freeBays,
          credits
        })
        if (load) routes.push({ good: id, from: from.port, to: to.port, ...load })
      }
    }
  })
  return routes.sort((a, b) => b.profit - a.profit)
}

/** For each good aboard, the port here that pays most for it: [{ good, port, units, proceeds }]. */
export function sellOffers({ ports, economy, cargo }) {
  const { goods, capacity } = economy
  const { feeBps } = economy.tuning
  const offers = []
  cargo.forEach((aboard, id) => {
    if (!aboard) return
    let best = null
    for (const port of ports) {
      const quote = port.quotes[id]
      if (quote?.mode !== MODE.BUYS) continue
      const units = Math.min(aboard, capacity - quote.shortfall)
      if (units <= 0) continue
      const proceeds = sellTotal(goods[id], capacity, quote.shortfall, units, feeBps)
      if (!best || proceeds > best.proceeds) best = { good: id, port: port.port, units, proceeds }
    }
    offers.push(best ?? { good: id, port: null, units: aboard, proceeds: 0 })
  })
  return offers
}
