// Demo 4's economy simulator (docs/demo4-plan.md, section 9; D29). Plays many pilots trading at Sol's
// Federation ports with the contracts' own price rules (src/sdk/market.js), and reports when they
// reach the play-time targets: range 2, range 3, full holds (250 bays) and range 4.
//
//   node dev/sim/economy.mjs [pilots=10] [days=21] ['{"tuning": {...}, "goods": [...]}']
//
// The pilots: each plays HOURS_PER_DAY hours a day, at its own time of day, one move every
// SECONDS_PER_MOVE seconds while playing (a session key: no wallet popups). A move is one trade at
// one port (selling what that port buys, then buying something to sell elsewhere) or one purchase
// at the yard. Purchases follow the order of the targets: range 2 first, then bays; once a pilot has
// 100 bays it saves for range 3, and with full holds it saves for range 4.
import { buyCost, sellProceeds, restock, baysCost, fee } from '../../src/sdk/market.js'

const HOURS_PER_DAY = 2
const SECONDS_PER_MOVE = 15
const DAY = 86400

// The contracts' starting values (Market.initialize, Pilots).
export const DEFAULTS = {
  goods: [
    { name: 'Water ice', base: 40, spread: 30 },
    { name: 'Metals', base: 70, spread: 45 },
    { name: 'Rare elements', base: 160, spread: 90 },
    { name: 'Helium-3', base: 120, spread: 70 },
    { name: 'Organics', base: 60, spread: 40 },
    { name: 'Silicon', base: 50, spread: 35 },
    { name: 'Equipment', base: 200, spread: 100 },
    { name: 'Electronics', base: 260, spread: 130 }
  ],
  mixes: [
    [0xd0, 0x2e],
    [0x22, 0x19],
    [0x11, 0xc2],
    [0x24, 0x51],
    [0x01, 0x94],
    [0x06, 0xa1],
    [0x08, 0x52],
    [0x42, 0x19],
    [0x24, 0xc1],
    [0x10, 0xc2]
  ],
  tuning: {
    capacity: 300,
    capacityPerPilot: 220,
    refill: 2 * 3600,
    feeBps: 200,
    bayBase: 200,
    bayStep: 8,
    rangePrices: [15_000, 150_000, 600_000]
  },
  start: { credits: 1000, bays: 5 },
  solClasses: [1, 5, 0, 1, 6, 6, 4, 4, 1],
  // Range 3 is saved for from this many bays; range 4 from full holds.
  rangeAfterBays: [0, 100, 250]
}

/** Runs the simulation; returns each pilot's milestones (seconds of calendar time and of play). */
export function simulate({ pilots = 10, days = 21, config = DEFAULTS, seed = 1 } = {}) {
  const { goods, mixes, start, solClasses, rangeAfterBays } = config
  // Federation ports hold more as more pilots register (Market: capacity per pilot, with a floor).
  const tuning = { ...config.tuning }
  if (tuning.capacityPerPilot) tuning.capacity = Math.max(tuning.capacity, tuning.capacityPerPilot * pilots)
  const G = goods.length
  const P = solClasses.length
  const mode = (port, g) => {
    const [sells, buys] = mixes[solClasses[port]]
    return (sells >> g) & 1 ? 1 : (buys >> g) & 1 ? 2 : 0
  }
  const stock = Array.from({ length: P }, () => Array.from({ length: G }, () => [0, 0]))
  let rand = seed
  const random = () => (rand = (rand * 1103515245 + 12345) % 2 ** 31) / 2 ** 31

  const players = Array.from({ length: pilots }, (_, i) => ({
    id: i,
    credits: start.credits,
    bays: start.bays,
    range: 1,
    cargo: new Array(G).fill(0),
    offset: Math.floor(random() * DAY),
    played: 0,
    milestones: {},
    moves: 0
  }))

  const shortfall = (port, g, now) =>
    restock(stock[port][g][0], stock[port][g][1], now, tuning.capacity, tuning.refill)[0]
  const take = (port, g, units, now) => {
    const [s, updated] = restock(stock[port][g][0], stock[port][g][1], now, tuning.capacity, tuning.refill)
    stock[port][g] = [s + units, updated]
  }
  const room = (port, g, now) => tuning.capacity - shortfall(port, g, now)
  const used = (p) => p.cargo.reduce((a, b) => a + b, 0)
  const buyTotal = (port, g, n, now) => {
    const c = buyCost(goods[g].base, goods[g].spread, tuning.capacity, shortfall(port, g, now), n)
    return c + fee(c, tuning.feeBps)
  }
  const sellTotal = (port, g, n, now) => {
    const c = sellProceeds(goods[g].base, goods[g].spread, tuning.capacity, shortfall(port, g, now), n)
    return c - fee(c, tuning.feeBps)
  }

  /** The best purchase at `port` to sell elsewhere: [good, units, profit]. */
  function bestBuy(p, port, credits, free, now) {
    let best = [0, 0, 0]
    for (let g = 0; g < G; g++) {
      if (mode(port, g) !== 1) continue
      for (let q = 0; q < P; q++) {
        if (mode(q, g) !== 2) continue
        let max = Math.min(free, room(port, g, now), room(q, g, now))
        // Largest n whose last unit still pays, then what fits the purse (both shrink as n grows).
        let lo = 0
        let hi = max
        while (lo < hi) {
          const mid = Math.ceil((lo + hi) / 2)
          const last =
            sellTotal(q, g, mid, now) -
            sellTotal(q, g, mid - 1, now) -
            (buyTotal(port, g, mid, now) - buyTotal(port, g, mid - 1, now))
          if (last > 0 && buyTotal(port, g, mid, now) <= credits) lo = mid
          else hi = mid - 1
        }
        const profit = sellTotal(q, g, lo, now) - buyTotal(port, g, lo, now)
        if (profit > best[2]) best = [g, lo, profit]
      }
    }
    return best
  }

  function mark(p, name, now) {
    if (!(name in p.milestones)) p.milestones[name] = { day: now / DAY, hours: p.played / 3600 }
  }

  function move(p, now) {
    p.moves++
    // The yard: range first when it's unlocked and affordable; otherwise bays unless saving for range.
    const next = p.range < 4 ? p.range + 1 : null
    const reserve = Math.min(p.credits, 60 * p.bays)
    if (next && p.bays >= rangeAfterBays[next - 2]) {
      const price = tuning.rangePrices[next - 2]
      if (p.credits >= price + reserve) {
        p.credits -= price
        p.range = next
        mark(p, `range ${next}`, now)
        return
      }
      if (next > 2) return trade(p, now) // saving
    }
    if (p.bays < 250) {
      let n = 0
      while (n < 250 - p.bays && baysCost(tuning.bayBase, tuning.bayStep, p.bays, n + 1) <= p.credits - reserve) n++
      if (n >= Math.max(1, Math.floor(p.bays / 10)) || (n > 0 && p.bays + n === 250)) {
        p.credits -= baysCost(tuning.bayBase, tuning.bayStep, p.bays, n)
        p.bays += n
        for (const b of [50, 100, 250]) if (p.bays >= b) mark(p, `${b} bays`, now)
        return
      }
    }
    trade(p, now)
  }

  /** One trade at the port that pays best right now: sell what it buys, then buy for elsewhere. */
  function trade(p, now) {
    let best = null
    for (let port = 0; port < P; port++) {
      let credits = p.credits
      let proceeds = 0
      const sells = []
      for (let g = 0; g < G; g++) {
        if (!p.cargo[g] || mode(port, g) !== 2) continue
        const n = Math.min(p.cargo[g], room(port, g, now))
        if (n <= 0) continue
        const value = sellTotal(port, g, n, now)
        sells.push([g, n])
        proceeds += value
        credits += value
      }
      const free = p.bays - used(p) + sells.reduce((a, [, n]) => a + n, 0)
      const [g, n, profit] = bestBuy(p, port, credits, free, now)
      const value = proceeds + profit
      if (!best || value > best.value) best = { port, sells, buy: [g, n], value }
    }
    if (!best || best.value <= 0) return
    for (const [g, n] of best.sells) {
      p.credits += sellTotal(best.port, g, n, now)
      take(best.port, g, n, now)
      p.cargo[g] -= n
    }
    const [g, n] = best.buy
    if (n > 0) {
      p.credits -= buyTotal(best.port, g, n, now)
      take(best.port, g, n, now)
      p.cargo[g] += n
    }
  }

  // Each pilot plays HOURS_PER_DAY a day from its offset; moves interleave in time order.
  for (let day = 0; day < days; day++) {
    const sessionMoves = (HOURS_PER_DAY * 3600) / SECONDS_PER_MOVE
    const events = []
    for (const p of players) {
      for (let k = 0; k < sessionMoves; k++) events.push([day * DAY + p.offset + k * SECONDS_PER_MOVE, p])
    }
    events.sort((a, b) => a[0] - b[0])
    for (const [now, p] of events) {
      p.played += SECONDS_PER_MOVE
      move(p, now)
    }
  }
  return players
}

/** The median of each milestone across pilots (null where under half reached it). */
export function summarize(players) {
  const names = ['range 2', '50 bays', '100 bays', 'range 3', '250 bays', 'range 4']
  return Object.fromEntries(
    names.map((name) => {
      const reached = players.map((p) => p.milestones[name]).filter(Boolean)
      if (reached.length < players.length / 2) return [name, null]
      const sorted = [...reached].sort((a, b) => a.hours - b.hours)
      const mid = sorted[Math.floor(players.length / 2)] ?? sorted[sorted.length - 1]
      return [
        name,
        { hours: +mid.hours.toFixed(1), day: +mid.day.toFixed(1), reached: `${reached.length}/${players.length}` }
      ]
    })
  )
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [pilots = 10, days = 21, override] = process.argv.slice(2)
  const extra = override ? JSON.parse(override) : {}
  const config = { ...DEFAULTS, ...extra, tuning: { ...DEFAULTS.tuning, ...(extra.tuning ?? {}) } }
  const players = simulate({ pilots: Number(pilots), days: Number(days), config })
  console.log(
    JSON.stringify(
      { pilots: Number(pilots), days: Number(days), tuning: config.tuning, medians: summarize(players) },
      null,
      1
    )
  )
  const rich = [...players].sort((a, b) => b.credits - a.credits)[0]
  console.log('richest:', { credits: rich.credits, bays: rich.bays, range: rich.range })
}
