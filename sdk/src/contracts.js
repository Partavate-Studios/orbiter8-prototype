// The game's contracts, read and written through ethers (docs/demo4-plan.md, section 8). No Vue: the
// stores decide what to do with the results. `runner` is a signer (to move) or a provider (to read).
import { Contract, Interface } from 'ethers'
import GalaxyAbi from './abi/Galaxy.json'
import PilotsAbi from './abi/Pilots.json'
import MarketAbi from './abi/Market.json'
import CreditsAbi from './abi/Credits.json'
import PlanetsAbi from './abi/Planets.json'
import ClaimsAbi from './abi/Claims.json'
import RepairsAbi from './abi/Repairs.json'
import FactoryAbi from './abi/Factory.json'
import BattleAbi from './abi/Battle.json'
import ArmoryAbi from './abi/Armory.json'
import { fetchRound } from './drand'
import { parseRevert } from './reverts'
import { queryChunked } from './event-log'
import { indexOf } from './body-id'

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
    named: c.named,
    // its owner (lowercase; the Galaxy contract itself for the Federation's), or null
    keeper: !c.keeper || c.keeper === ZERO ? null : c.keeper.toLowerCase()
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
    body: indexOf(p.id),
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
  retreated: s.retreated,
  moonPointDefense: Number(s.moonPointDefense),
  moonRailguns: Number(s.moonRailguns),
  moonMissiles: Number(s.moonMissiles)
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

/** The game's ABIs, for putting a refused move into words (sdk/reverts.js). */
const INTERFACES = [GalaxyAbi, PilotsAbi, MarketAbi, CreditsAbi, PlanetsAbi, ClaimsAbi, FactoryAbi, BattleAbi, RepairsAbi, ArmoryAbi].map(
  (abi) => new Interface(abi)
)

/**
 * Sends a move, tells `options.onSent` its hash, and resolves with the receipt once mined. A move
 * the contracts refuse throws with `shortMessage` in plain words (the tray and the wizard show it).
 */
async function sent(transaction, options) {
  let tx
  try {
    tx = await transaction
  } catch (error) {
    const revert = parseRevert(error, INTERFACES)
    if (!revert) throw error
    const refused = new Error(revert.words, { cause: error })
    refused.shortMessage = revert.words
    refused.reason = revert.words
    refused.revertName = revert.name
    refused.code = error.code
    throw refused
  }
  options?.onSent?.(tx.hash)
  return tx.wait()
}

const DEEDS_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function ownerOf(uint256 id) view returns (address)',
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'
]

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
/** An asteroid's line (Planets.sol, D88): its steps and their names. Planets take every step 1–6. */
export const ASTEROID_STEPS = [1, 2, 4, 6]
export const ASTEROID_BUILDING_NAMES = { 1: 'Platform', 2: 'Mine', 4: 'Port', 6: 'Armory' }

export function createGame(runner, addresses) {
  const galaxy = new Contract(addresses.galaxy, GalaxyAbi, runner)
  const pilots = new Contract(addresses.pilots, PilotsAbi, runner)
  const market = new Contract(addresses.market, MarketAbi, runner)
  const credits = new Contract(addresses.credits, CreditsAbi, runner)
  const planets = new Contract(addresses.planets, PlanetsAbi, runner)
  const claims = new Contract(addresses.claims, ClaimsAbi, runner)
  const factory = new Contract(addresses.factory, FactoryAbi, runner)
  const battle = new Contract(addresses.battle, BattleAbi, runner)
  const repairs = new Contract(addresses.repairs, RepairsAbi, runner)
  const armory = new Contract(addresses.armory, ArmoryAbi, runner)
  const deeds = addresses.deeds ? new Contract(addresses.deeds, DEEDS_ABI, runner) : null
  const provider = runner.provider ?? runner
  /** Events after `fromBlock` (exclusive) up to the latest block, and that block: for reading only what's new. */
  const since = async (contract, filter, fromBlock) => {
    const latest = await provider.getBlockNumber()
    if (latest <= fromBlock) return { logs: [], toBlock: fromBlock }
    return { logs: await queryChunked(contract, filter, fromBlock + 1, latest), toBlock: latest }
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
          droneBays: Number(p.ship.droneBays),
          loadout: {
            drones: Number(p.ship.loadout.drones),
            repairBots: Number(p.ship.loadout.repairBots),
            pointDefense: Number(p.ship.loadout.pointDefense),
            railguns: Number(p.ship.loadout.railguns),
            missiles: Number(p.ship.loadout.missiles),
            armor: Number(p.ship.loadout.armor),
            shields: Number(p.ship.loadout.shields),
            miningDrones: Number(p.ship.loadout.miningDrones)
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

    /** The ports' capacity now: it grows as pilots register (Market.capacity), so it's read with each port read. */
    async marketCapacity() {
      return Number(await market.capacity())
    },

    /** The goods registry, the tuning and the ports' current capacity: what prices are computed from. */
    async economy() {
      const [goods, tuning, capacity, dronesPerBay] = await Promise.all([
        market.goods(),
        market.tuning(),
        market.capacity(),
        pilots.dronesPerBay()
      ])
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
        capacity: Number(capacity),
        dronesPerBay: Number(dronesPerBay)
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

    /** Every asteroid in a star's belt, as it stands now (none without a belt). */
    async belt(cell, goods) {
      return (await planets.belt(cell, goods)).map(toPlanet)
    },

    /** What planets cost: buildings 1–7, the claim fee and the colonist price; the Autofactory's parts. */
    async planetRules() {
      const [tuning, claimTuning, parts, ...costs] = await Promise.all([
        planets.tuning(),
        claims.tuning(),
        factory.parts(),
        ...[1, 2, 3, 4, 5, 6, 7].map((b) => planets.costOf(b)),
        // an asteroid's line (D88): Platform, Mine, Port, Armory, at the step + 8
        ...ASTEROID_STEPS.map((b) => planets.costOf(b + 8))
      ])
      const planetCosts = costs.slice(0, 7)
      const asteroidCosts = costs.slice(7)
      return {
        claimFee: Number(claimTuning.claimFee),
        starNameFee: Number(claimTuning.starNameFee),
        colonistPrice: Number(tuning.colonistPrice),
        growthTime: Number(tuning.growthTime),
        producePerHour: Number(tuning.producePerHour),
        storageCap: Number(tuning.storageCap),
        colonyShare: Number(tuning.colonyShare),
        buildings: [null, ...planetCosts.map(toCost)],
        asteroidBuildings: Object.fromEntries(ASTEROID_STEPS.map((b, i) => [b, toCost(asteroidCosts[i])])),
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
      const [c, crew, damage] = await Promise.all([
        repairs.conditionOf(address),
        repairs.dronesOf(address),
        repairs.damageOf(address)
      ])
      return {
        // the built-in drones (D92): how many repair, how many mine; and engine and bay damage now,
        // their repairs counted
        repairing: Number(crew[0]),
        mining: Number(crew[1]),
        rangeLost: Number(damage[0]),
        baysLost: Number(damage[1]),
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
        bfg: Number(d.bfg),
        moonPointDefense: Number(d.moonPointDefense),
        moonRailguns: Number(d.moonRailguns),
        moonMissiles: Number(d.moonMissiles)
      }
    },

    /** The siege feed's events in a block range, oldest first (sdk/event-log.js keeps the window). */
    async siegeEvents(fromBlock, toBlock) {
      const logs = await queryChunked(battle, '*', fromBlock, toBlock)
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
    },

    /** The latest block number. */
    blockNumber() {
      return provider.getBlockNumber()
    },

    /** Stars discovered after `fromBlock` (Galaxy's Discovered events): how many, and the block read up to. */
    async discoveriesSince(fromBlock = -1) {
      const { logs, toBlock } = await since(galaxy, galaxy.filters.Discovered(), fromBlock)
      return { count: logs.length, toBlock }
    },

    /** Pilots registered after `fromBlock`: their addresses (lowercase), oldest first, and the block read up to. */
    async pilotsSince(fromBlock = -1) {
      const { logs, toBlock } = await since(pilots, pilots.filters.Registered(), fromBlock)
      return { pilots: logs.map((l) => l.args[0].toLowerCase()), toBlock }
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

    /** Trades in a block range, oldest first: [{ sender, port, good, units, hash, block }]. */
    async trades(fromBlock, toBlock) {
      const logs = await queryChunked(market, market.filters.Traded(), fromBlock, toBlock)
      return logs.map((l) => ({
        sender: l.args[0].toLowerCase(),
        port: Number(l.args[1]),
        good: Number(l.args[2]),
        units: Number(l.args[3]),
        hash: l.transactionHash,
        block: l.blockNumber,
        logIndex: l.index
      }))
    },

    /** Pilots' arrivals in a system (jumps and black holes) in a block range: [{ pilot, cell, block, logIndex }]. */
    async arrivals(fromBlock, toBlock) {
      const [jumps, holes] = await Promise.all([
        queryChunked(pilots, pilots.filters.Jumped(), fromBlock, toBlock),
        queryChunked(pilots, pilots.filters.Traversed(), fromBlock, toBlock)
      ])
      return [...jumps, ...holes]
        .map((l) => ({ pilot: l.args[0].toLowerCase(), cell: Number(l.args[2]), block: l.blockNumber, logIndex: l.index }))
        .sort((a, b) => a.block - b.block || a.logIndex - b.logIndex)
    },

    /** Galaxy chat in a block range, oldest first: [{ sender, message, hash, block }]. */
    async broadcasts(fromBlock, toBlock) {
      const logs = await queryChunked(pilots, pilots.filters.Broadcast(), fromBlock, toBlock)
      return logs.map((l) => ({
        sender: l.args[0].toLowerCase(),
        message: l.args[1],
        hash: l.transactionHash,
        block: l.blockNumber
      }))
    },

    /** Registrations in a block range: [{ pilot, shipId, callsign, shipName, hash, block }]. */
    async registrations(fromBlock, toBlock) {
      const logs = await queryChunked(pilots, pilots.filters.Registered(), fromBlock, toBlock)
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
      const names = await claims.namesOf(planet)
      return { planet: names[0], station: names[1], moons: names.slice(2) }
    },

    /** Planet deeds a pilot holds. */
    async deedCount(address) {
      return deeds ? Number(await deeds.balanceOf(address)) : 0
    },

    /** The planets `address` owns now: every deed ever sent to it (in chunks), still its own. */
    async ownedPlanets(address) {
      if (!deeds) return []
      const { logs } = await since(deeds, deeds.filters.Transfer(null, address), -1)
      const ids = [...new Set(logs.map((l) => Number(l.args[2])))]
      const owners = await Promise.all(ids.map((id) => deeds.ownerOf(id).catch(() => null)))
      return ids.filter((_, i) => owners[i]?.toLowerCase() === address.toLowerCase())
    },

    /** Every claimed body's id and owner now (planets and asteroids), from the claims and seizures. */
    async claimedPlanets() {
      const logs = await claims.queryFilter(claims.filters.Claimed(), 0)
      const ids = [...new Set(logs.map((l) => Number(l.args[0])))]
      const owners = await Promise.all(ids.map((id) => claims.ownerOf(id)))
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
      const [may, becomesOwner] = await claims.mayNameStar(cell, address)
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
    /** Names part of the player's planet: Claims.NAME_PLANET (0), NAME_STATION (1), NAME_MOON (2) + orbit. */
    async renamePlanet(planet, part, name, options) {
      return sent(claims.rename(planet, part, name), options)
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
    /** Names a star, for its fee (Claims.tuning), if the pilot may (Claims.mayNameStar). */
    async nameStar(cell, name, options) {
      return sent(claims.nameStar(cell, name), options)
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
    /** Drone bays (D91): every drone lives in one; priced like cargo bays. */
    async buyDroneBays(port, count, maxCost, options) {
      return sent(market.buyDroneBays(port, count, maxCost), options)
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
      return sent(claims.claim(planet), options)
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
    /** Weapons onto the planet's moons: six mounts a moon, outside the shield (D61). */
    async fitMoons(planet, part, count, options) {
      return sent(armory.fitMoons(planet, part, count), options)
    },
    async buyParts(port, part, count, maxCost, options) {
      return sent(armory.buy(port, part, count, maxCost), options)
    },
    async repair(port, options) {
      return sent(armory.repair(port), options)
    },
    /** How many of the four built-in drones repair the ship; the rest mine (D92). */
    async assignDrones(repairing, options) {
      return sent(repairs.assignDrones(repairing), options)
    }
  }
  return game
}
