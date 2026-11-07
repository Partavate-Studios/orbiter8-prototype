// The Demo 4 contracts, read and written through ethers (docs/demo4-plan.md, section 8). No Vue: the
// stores decide what to do with the results. `runner` is a signer (to move) or a provider (to read).
import { Contract } from 'ethers'
import GalaxyAbi from './abi/Galaxy.json'
import PilotsAbi from './abi/Pilots.json'
import MarketAbi from './abi/Market.json'
import CreditsAbi from './abi/Credits.json'
import { fetchRound } from './drand'

export const STATE = { UNDECIDED: 0, EMPTY: 1, STAR: 2, BLACK_HOLE: 3 }
/** Cells per region read; the contracts cap it at 10. */
export const REGION_RADIUS = 10
/** At most this many pending scans are resolved along with one move (each costs about 400k gas). */
export const PROOFS_PER_MOVE = 3

const ZERO = '0x0000000000000000000000000000000000000000'

/** A cell from a region read, as plain data. */
function toCell(c) {
  return {
    cell: Number(c.cell),
    state: Number(c.state),
    visited: c.visited,
    scanned: c.scanned,
    scanRound: Number(c.scanRound),
    discoverer: c.discoverer === ZERO ? null : c.discoverer.toLowerCase(),
    discoveredAt: Number(c.discoveredAt),
    partner: Number(c.partner),
    named: c.named
  }
}

/** A port from `Market.portsAt`, as plain data. */
function toPort(p) {
  return {
    port: Number(p.port),
    class: Number(p.class),
    yard: p.yard,
    owner: p.owner === ZERO ? null : p.owner.toLowerCase(),
    quotes: p.quotes.map((q) => ({ mode: Number(q.mode), shortfall: Number(q.shortfall), price: Number(q.price) }))
  }
}

/**
 * @param {import('ethers').ContractRunner} runner
 * @param {{ galaxy: string, pilots: string, market: string, credits: string }} addresses
 */
export function createGame(runner, addresses) {
  const galaxy = new Contract(addresses.galaxy, GalaxyAbi, runner)
  const pilots = new Contract(addresses.pilots, PilotsAbi, runner)
  const market = new Contract(addresses.market, MarketAbi, runner)
  const credits = new Contract(addresses.credits, CreditsAbi, runner)

  const game = {
    galaxy,
    pilots,
    market,

    async universe() {
      const [seed, , scanDelay] = await galaxy.universe()
      return { seed, scanDelay: Number(scanDelay) }
    },

    /** The pilot flying from `address`, or null if they haven't registered. */
    async pilot(address) {
      const p = await pilots.pilotOf(address)
      if (!p.registered) return null
      return {
        callsign: p.callsign,
        shipId: Number(p.shipId),
        ship: {
          name: p.ship.name,
          cell: Number(p.ship.cell),
          range: Number(p.ship.range),
          bays: Number(p.ship.bays),
          cargo: Number(p.ship.cargo)
        },
        session: p.sessionKey === ZERO ? null : { key: p.sessionKey.toLowerCase(), expiry: Number(p.sessionExpiry) }
      }
    },

    /** Credits in a wallet. */
    async balance(address) {
      return Number(await credits.balanceOf(address))
    },

    /** Units of each good aboard the pilot's ship. */
    async cargo(address, goods) {
      return (await pilots.cargoOf(address, goods)).map(Number)
    },

    /** The goods registry, the tuning and the ports' current capacity: what prices are computed from. */
    async economy() {
      const [goods, tuning, capacity] = await Promise.all([market.goods(), market.tuning(), market.capacity()])
      return {
        goods: goods.map((g) => ({ name: g.name, base: Number(g.base), spread: Number(g.spread) })),
        tuning: {
          capacity: Number(tuning.capacity),
          capacityPerPilot: Number(tuning.capacityPerPilot),
          refill: Number(tuning.refill),
          feeBps: Number(tuning.feeBps),
          bayBase: Number(tuning.bayBase),
          bayStep: Number(tuning.bayStep),
          rangePrices: tuning.rangePrices.map(Number)
        },
        capacity: Number(capacity)
      }
    },

    /** Every port at a star, with stock and next-unit prices. */
    async portsAt(cell) {
      return (await market.portsAt(cell)).map(toPort)
    },

    /** Every decided cell within REGION_RADIUS of `center`, in one call. */
    async region(center) {
      return (await galaxy.region(center, REGION_RADIUS)).map(toCell)
    },

    async nameOf(cell) {
      return galaxy.nameOf(cell)
    },

    /** What a pending scan will decide, once its round is published (null before). */
    async previewScan(cell, scanRound) {
      const signature = await fetchRound(scanRound)
      if (!signature) return null
      const [states, partners] = await galaxy.previewScan(cell, signature)
      return { states: states.map(Number), partners: partners.map(Number) }
    },

    /**
     * Proofs for pending scans among `cells` (from region reads) whose rounds are published, to send
     * along with the next move: the explorer never approves a scan separately (D21).
     */
    async proofsFor(cells) {
      const pending = cells.filter((c) => c.visited && !c.scanned).sort((a, b) => a.scanRound - b.scanRound)
      const proofs = []
      for (const c of pending) {
        if (proofs.length >= PROOFS_PER_MOVE) break
        const signature = await fetchRound(c.scanRound).catch(() => null)
        if (signature) proofs.push({ cell: c.cell, signature })
      }
      return proofs
    },

    // Moves resolve after they're mined, with the receipt.
    async register(callsign, shipName) {
      return (await pilots.register(callsign, shipName)).wait()
    },
    async jump(to, proofs = []) {
      return (await pilots.jump(to, proofs)).wait()
    },
    async traverse(proofs = []) {
      return (await pilots.traverse(proofs)).wait()
    },
    async renameStar(cell, name, proofs = []) {
      return (await pilots.renameStar(cell, name, proofs)).wait()
    },
    async resolveScans(proofs) {
      return (await pilots.resolveScans(proofs)).wait()
    },
    /** lines: [{ good, units (+ buy, - sell), limit }], sales first. */
    async trade(port, lines) {
      return (await market.trade(port, lines)).wait()
    },
    async buyBays(port, count, maxCost) {
      return (await market.buyBays(port, count, maxCost)).wait()
    },
    async buyRange(port, maxCost) {
      return (await market.buyRange(port, maxCost)).wait()
    },
    /** From the wallet: lets `key` move for the pilot until `expiry`, sending it `value` (wei) for gas. */
    async startSession(key, expiry, value) {
      return (await pilots.startSession(key, expiry, { value })).wait()
    },
    async endSession() {
      return (await pilots.endSession()).wait()
    }
  }
  return game
}
