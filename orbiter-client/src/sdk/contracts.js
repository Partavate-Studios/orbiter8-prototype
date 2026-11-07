// The game's contracts, read and written through ethers (docs/demo4-plan.md, section 8). No Vue: the
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

/** Sends a move, tells `options.onSent` its hash, and resolves with the receipt once mined. */
async function sent(transaction, options) {
  const tx = await transaction
  options?.onSent?.(tx.hash)
  return tx.wait()
}

const DEEDS_ABI = ['function balanceOf(address owner) view returns (uint256)']

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
  const deeds = addresses.deeds ? new Contract(addresses.deeds, DEEDS_ABI, runner) : null
  const provider = runner.provider ?? runner
  /** Events from the last `blocks` blocks (all of them on a young chain). */
  const recent = async (contract, filter, blocks) => {
    const latest = await provider.getBlockNumber()
    return contract.queryFilter(filter, Math.max(0, latest - blocks), latest)
  }

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

    /** One planet as it stands now, with `goods` stock entries. */
    async planetView(id, goods = 0) {
      return toPlanet(await planets.planetView(id, goods))
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

    /** Every registered pilot's address (lowercase), oldest first, from the registrations. */
    async pilotList() {
      const logs = await pilots.queryFilter(pilots.filters.Registered(), 0)
      return logs.map((l) => l.args[0].toLowerCase())
    },

    /** The pilots whose ships are at `cell`, among `addresses`: [{ address, shipId, name, callsign }]. */
    async shipsAt(cell, addresses) {
      const all = await Promise.all(addresses.map((a) => pilots.pilotOf(a).then((p) => [a, p])))
      return all
        .filter(([, p]) => p.registered && Number(p.ship.cell) === cell)
        .map(([address, p]) => ({ address, shipId: Number(p.shipId), name: p.ship.name, callsign: p.callsign }))
    },

    /** Call signs by address (lowercase), for `addresses`. */
    async callsigns(addresses) {
      const all = await Promise.all(addresses.map((a) => pilots.pilotOf(a)))
      return Object.fromEntries(addresses.map((a, i) => [a, all[i].callsign]))
    },

    /** Who has the call sign (any case), or null. */
    async callsignOwner(callsign) {
      const owner = await pilots.byCallsign(callsign)
      return owner === ZERO ? null : owner.toLowerCase()
    },

    /** Trades in the last `blocks` blocks, oldest first: [{ sender, port, good, units, hash }]. */
    async recentTrades(blocks) {
      const logs = await recent(market, market.filters.Traded(), blocks)
      return logs.map((l) => ({
        sender: l.args[0].toLowerCase(),
        port: Number(l.args[1]),
        good: Number(l.args[2]),
        units: Number(l.args[3]),
        hash: l.transactionHash
      }))
    },

    /** Galaxy chat in the last `blocks` blocks, oldest first: [{ sender, message, hash, block }]. */
    async broadcasts(blocks) {
      const logs = await recent(pilots, pilots.filters.Broadcast(), blocks)
      return logs.map((l) => ({
        sender: l.args[0].toLowerCase(),
        message: l.args[1],
        hash: l.transactionHash,
        block: l.blockNumber
      }))
    },

    /** Registrations in the last `blocks` blocks: [{ pilot, shipId, callsign, shipName, hash, block }]. */
    async registrations(blocks) {
      const logs = await recent(pilots, pilots.filters.Registered(), blocks)
      return logs.map((l) => ({
        pilot: l.args[0].toLowerCase(),
        shipId: Number(l.args[1]),
        callsign: l.args[2],
        shipName: l.args[3],
        hash: l.transactionHash,
        block: l.blockNumber
      }))
    },

    /** Names an owner gave a planet: { planet, station, moons: [8] } ("" where unnamed). */
    async namesOf(planet) {
      const names = await planets.namesOf(planet)
      return { planet: names[0], station: names[1], moons: names.slice(2) }
    },

    /** Planet deeds a pilot holds. */
    async deedCount(address) {
      return deeds ? Number(await deeds.balanceOf(address)) : 0
    },

    /** Every claimed planet's id and owner now, from the claims and seizures. */
    async claimedPlanets() {
      const claims = await planets.queryFilter(planets.filters.Claimed(), 0)
      const ids = [...new Set(claims.map((l) => Number(l.args[0])))]
      const owners = await Promise.all(ids.map((id) => planets.ownerOf(id)))
      return ids.map((id, i) => ({ id, owner: owners[i].toLowerCase() }))
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

    /** A star's owner (lowercase), or null; the Galaxy contract itself for the Federation's. */
    async keeperOf(cell) {
      const keeper = await galaxy.keeperOf(cell)
      return keeper === ZERO ? null : keeper.toLowerCase()
    },

    /** Whether `address` may name the star at `cell`, and whether doing so makes them its owner. */
    async mayNameStar(cell, address) {
      const [may, becomesOwner] = await planets.mayNameStar(cell, address)
      return { may, becomesOwner }
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

    // Moves resolve after they're mined, with the receipt. Each takes `options` last: `{ onSent(hash) }`
    // hears the moment the wallet has sent it, before it's mined (the jump animation and the tray use it).
    async register(callsign, shipName, options) {
      return sent(pilots.register(callsign, shipName), options)
    },
    async jump(to, proofs = [], options) {
      return sent(pilots.jump(to, proofs), options)
    },
    async traverse(proofs = [], options) {
      return sent(pilots.traverse(proofs), options)
    },
    /** Names part of the player's planet: Planets.NAME_PLANET (0), NAME_STATION (1), NAME_MOON (2) + orbit. */
    async renamePlanet(planet, part, name, options) {
      return sent(planets.rename(planet, part, name), options)
    },
    async renameShip(name, options) {
      return sent(pilots.renameShip(name), options)
    },
    async changeCallsign(callsign, options) {
      return sent(pilots.changeCallsign(callsign), options)
    },
    async broadcast(message, options) {
      return sent(pilots.broadcast(message), options)
    },
    /** Names a star, for the Station's cost, if the pilot may (Planets.mayNameStar). */
    async nameStar(cell, name, options) {
      return sent(planets.nameStar(cell, name), options)
    },
    async resolveScans(proofs, options) {
      return sent(pilots.resolveScans(proofs), options)
    },
    /** lines: [{ good, units (+ buy, - sell), limit }], sales first. */
    async trade(port, lines, options) {
      return sent(market.trade(port, lines), options)
    },
    async buyBays(port, count, maxCost, options) {
      return sent(market.buyBays(port, count, maxCost), options)
    },
    async buyRange(port, maxCost, options) {
      return sent(market.buyRange(port, maxCost), options)
    },
    /** From the wallet: lets `key` move for the pilot until `expiry`, sending it `value` (wei) for gas. */
    async startSession(key, expiry, value, options) {
      return sent(pilots.startSession(key, expiry, { value }), options)
    },
    async endSession(options) {
      return sent(pilots.endSession(), options)
    },
    async claim(planet, options) {
      return sent(planets.claim(planet), options)
    },
    async recruit(count, options) {
      return sent(planets.recruit(count), options)
    },
    async land(planet, count, options) {
      return sent(planets.land(planet, count), options)
    },
    async board(planet, count, options) {
      return sent(planets.board(planet, count), options)
    },
    async deliver(planet, good, units, options) {
      return sent(planets.deliver(planet, good, units), options)
    },
    async collect(planet, good, units, options) {
      return sent(planets.collect(planet, good, units), options)
    },
    async build(planet, building, options) {
      return sent(planets.build(planet, building), options)
    },
    async order(planet, part, count, options) {
      return sent(factory.order(planet, part, count), options)
    },
    async attack(planet, options) {
      return sent(battle.attack(planet), options)
    },
    async joinDefense(planet, options) {
      return sent(battle.joinDefense(planet), options)
    },
    async advance(planet, options) {
      return sent(battle.advance(planet), options)
    },
    async fileClaim(planet, options) {
      return sent(battle.fileClaim(planet), options)
    },
    async completeClaim(planet, options) {
      return sent(battle.completeClaim(planet), options)
    },
    async withdraw(planet, options) {
      return sent(battle.withdraw(planet), options)
    },
    async fitShip(planet, part, count, options) {
      return sent(armory.fitShip(planet, part, count), options)
    },
    async unloadShip(planet, part, count, options) {
      return sent(armory.unloadShip(planet, part, count), options)
    },
    async fitPlanet(planet, part, count, options) {
      return sent(armory.fitPlanet(planet, part, count), options)
    },
    async buyParts(port, part, count, maxCost, options) {
      return sent(armory.buy(port, part, count, maxCost), options)
    },
    async repair(port, options) {
      return sent(armory.repair(port), options)
    }
  }
  return game
}
