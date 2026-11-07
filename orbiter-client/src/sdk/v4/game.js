// The Demo 4 contracts, read and written through ethers (docs/demo4-plan.md, section 8). No Vue: the
// stores decide what to do with the results. `runner` is a signer (to move) or a provider (to read).
import { Contract } from 'ethers'
import GalaxyAbi from './abi/Galaxy.json'
import PilotsAbi from './abi/Pilots.json'
import MarketAbi from './abi/Market.json'
import CreditsAbi from './abi/Credits.json'
import PlanetsAbi from './abi/Planets.json'
import FactoryAbi from './abi/Factory.json'
import BattleAbi from './abi/Battle.json'
import ArmoryAbi from './abi/Armory.json'
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

/** A planet from `Planets.system` / `planetView`, as plain data. */
function toPlanet(p) {
  return {
    id: Number(p.id),
    body: Number(p.id) % 256,
    class: Number(p.class),
    size: Number(p.size),
    cap: Number(p.cap),
    owner: p.owner === ZERO ? null : p.owner.toLowerCase(),
    level: Number(p.level),
    autofactory: p.autofactory,
    building: Number(p.building),
    readyAt: Number(p.readyAt),
    population: Number(p.population),
    stock: p.stock.map(Number)
  }
}

/** A ship's or planet's side in a siege (Combat.Side), as plain data. */
const toSide = (s) => ({
  platforms: Number(s.platforms),
  shield: Number(s.shield),
  shieldMax: Number(s.shieldMax),
  armor: Number(s.armor),
  armorMax: Number(s.armorMax),
  hull: Number(s.hull),
  pointDefense: Number(s.pointDefense),
  railguns: Number(s.railguns),
  missiles: Number(s.missiles),
  drones: Number(s.drones),
  repairBots: Number(s.repairBots),
  bfg: Number(s.bfg),
  retreated: s.retreated
})

const toSiege = (planet, s) => ({
  planet,
  attacker: s.attacker.toLowerCase(),
  started: Number(s.started),
  checkpoint: Number(s.checkpoint),
  wornAt: Number(s.wornAt),
  claimAt: Number(s.claimAt),
  ship: toSide(s.ship),
  side: toSide(s.planet)
})

const toCost = (c) => ({
  credits: Number(c.credits),
  time: Number(c.time),
  people: Number(c.people),
  goods: c.amounts.map((a, i) => [Number(c.goods[i]), Number(a)]).filter(([, a]) => a > 0)
})

/**
 * @param {import('ethers').ContractRunner} runner
 * @param {{ galaxy: string, pilots: string, market: string, credits: string }} addresses
 */
export function createGame(runner, addresses) {
  const galaxy = new Contract(addresses.galaxy, GalaxyAbi, runner)
  const pilots = new Contract(addresses.pilots, PilotsAbi, runner)
  const market = new Contract(addresses.market, MarketAbi, runner)
  const credits = new Contract(addresses.credits, CreditsAbi, runner)
  const planets = new Contract(addresses.planets, PlanetsAbi, runner)
  const factory = new Contract(addresses.factory, FactoryAbi, runner)
  const battle = new Contract(addresses.battle, BattleAbi, runner)
  const armory = new Contract(addresses.armory, ArmoryAbi, runner)

  const game = {
    galaxy,
    pilots,
    market,
    battle,

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
          cargo: Number(p.ship.cargo),
          colonists: Number(p.ship.colonists),
          rangeLost: Number(p.ship.rangeLost),
          baysLost: Number(p.ship.baysLost),
          loadout: {
            drones: Number(p.ship.loadout.drones),
            repairBots: Number(p.ship.loadout.repairBots),
            pointDefense: Number(p.ship.loadout.pointDefense),
            railguns: Number(p.ship.loadout.railguns),
            missiles: Number(p.ship.loadout.missiles),
            armor: Number(p.ship.loadout.armor),
            shields: Number(p.ship.loadout.shields)
          }
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

    /** Every planet at a star, as it stands now, with `goods` stock entries. */
    async system(cell, goods) {
      return (await planets.system(cell, goods)).map(toPlanet)
    },

    /** What planets cost: buildings 1–7, the claim fee and the colonist price; the Autofactory's parts. */
    async planetRules() {
      const [tuning, parts, ...costs] = await Promise.all([
        planets.tuning(),
        factory.parts(),
        ...[1, 2, 3, 4, 5, 6, 7].map((b) => planets.costOf(b))
      ])
      return {
        claimFee: Number(tuning.claimFee),
        colonistPrice: Number(tuning.colonistPrice),
        growthTime: Number(tuning.growthTime),
        producePerHour: Number(tuning.producePerHour),
        storageCap: Number(tuning.storageCap),
        colonyShare: Number(tuning.colonyShare),
        buildings: [null, ...costs.map(toCost)],
        parts: parts.map((p) => ({
          name: p.name,
          credits: Number(p.credits),
          time: Number(p.time),
          planetOnly: p.planetOnly,
          goods: p.amounts.map((a, i) => [Number(p.goods[i]), Number(a)]).filter(([, a]) => a > 0)
        }))
      }
    },

    /** A planet's Autofactory: orders still building, and finished parts by id. */
    async factoryAt(planet) {
      const [queue, stored] = await Promise.all([factory.queueOf(planet), factory.storedAt(planet)])
      return {
        queue: queue.map((o) => ({ part: Number(o.part), count: Number(o.count), readyAt: Number(o.readyAt) })),
        stored: stored.map(Number)
      }
    },

    /** Sieges at a star, each played up to now (Battle.preview). */
    async siegesAt(cell) {
      const planets = (await battle.siegesAt(cell)).map(Number)
      return Promise.all(planets.map(async (p) => toSiege(p, await battle.preview(p))))
    },

    /** A ship's state between battles: what's out of action, retreat, time in the yard. */
    async condition(address) {
      const c = await battle.conditionOf(address)
      return {
        armorLost: Number(c.armorLost),
        off: [
          Number(c.pointDefenseOff),
          Number(c.railgunsOff),
          Number(c.missilesOff),
          Number(c.dronesOff),
          Number(c.botsOff)
        ],
        retreated: c.retreated,
        dockedUntil: Number(c.dockedUntil)
      }
    },

    /** A planet's fitted defenses. */
    async defenses(planet) {
      const d = await battle.defensesOf(planet)
      return {
        pointDefense: Number(d.pointDefense),
        railguns: Number(d.railguns),
        missiles: Number(d.missiles),
        drones: Number(d.drones),
        repairBots: Number(d.repairBots),
        armor: Number(d.armor),
        shields: Number(d.shields),
        platforms: Number(d.platforms),
        bfg: Number(d.bfg)
      }
    },

    /** The siege feed: Battle's events from the last `blocks` blocks, newest first. */
    async siegeFeed(blocks = 50_000) {
      const provider = battle.runner.provider ?? battle.runner
      const latest = await provider.getBlockNumber()
      const logs = await battle.queryFilter('*', Math.max(0, latest - blocks), latest)
      const wanted = ['SiegeStarted', 'DefenderJoined', 'WornDown', 'ClaimFiled', 'ClaimFailed', 'SiegeEnded']
      return logs
        .filter((l) => wanted.includes(l.fragment?.name))
        .map((l) => ({
          event: l.fragment.name,
          planet: Number(l.args[0]),
          who: typeof l.args[1] === 'string' ? l.args[1].toLowerCase() : null,
          args: l.args.map((a) => (typeof a === 'bigint' ? Number(a) : a)),
          block: l.blockNumber
        }))
        .reverse()
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
    },
    async claim(planet) {
      return (await planets.claim(planet)).wait()
    },
    async recruit(count) {
      return (await planets.recruit(count)).wait()
    },
    async land(planet, count) {
      return (await planets.land(planet, count)).wait()
    },
    async board(planet, count) {
      return (await planets.board(planet, count)).wait()
    },
    async deliver(planet, good, units) {
      return (await planets.deliver(planet, good, units)).wait()
    },
    async collect(planet, good, units) {
      return (await planets.collect(planet, good, units)).wait()
    },
    async build(planet, building) {
      return (await planets.build(planet, building)).wait()
    },
    async order(planet, part, count) {
      return (await factory.order(planet, part, count)).wait()
    },
    async attack(planet) {
      return (await battle.attack(planet)).wait()
    },
    async joinDefense(planet) {
      return (await battle.joinDefense(planet)).wait()
    },
    async advance(planet) {
      return (await battle.advance(planet)).wait()
    },
    async fileClaim(planet) {
      return (await battle.fileClaim(planet)).wait()
    },
    async completeClaim(planet) {
      return (await battle.completeClaim(planet)).wait()
    },
    async withdraw(planet) {
      return (await battle.withdraw(planet)).wait()
    },
    async fitShip(planet, part, count) {
      return (await armory.fitShip(planet, part, count)).wait()
    },
    async unloadShip(planet, part, count) {
      return (await armory.unloadShip(planet, part, count)).wait()
    },
    async fitPlanet(planet, part, count) {
      return (await armory.fitPlanet(planet, part, count)).wait()
    },
    async buyParts(port, part, count, maxCost) {
      return (await armory.buy(port, part, count, maxCost)).wait()
    },
    async repair(port) {
      return (await armory.repair(port)).wait()
    }
  }
  return game
}
