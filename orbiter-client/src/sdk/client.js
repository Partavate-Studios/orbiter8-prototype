// The game client: connects to a wallet, keeps a plain copy of the game state up to date as blocks
// arrive, and offers every player action. Framework-free: the stores mirror what it reports
// (stores/game-bindings.js), and the screens draw from them. The state and actions keep the shapes
// the screens were built on (player, system, events), plus the pilot's own (sessions, planets, battle).
//
// Moves send published pending scans along (D21) and go through the session key while one is live
// (D41), so neither needs its own wallet approval.
import { parseEther } from 'ethers'
import { connectWallet, getSession } from '@/sdk/chain/wallet'
import { getNativeBalance, waitForTransaction } from '@/sdk/chain/rpc'
import { networkFor } from '@/sdk/chain/networks'
import { createBlockWatcher } from '@/sdk/sync'
import { pendingRegistration, rememberPending, forgetPending } from '@/sdk/pending'
import { createGame, STATE, REGION_RADIUS } from './contracts'
import { timeOf } from './drand'
import { distance } from './hex'
import { starTraits } from './traits'
import { planet as derivePlanet, planetCount, looks, moonName, planetName } from './system-gen'
import { portNames, buyCost, sellProceeds, fee, baysCost, MODE } from './market'
import { SESSION_HOURS, loadKey, saveKey, forgetKey, newKey, keySigner, sweep } from './session-key'

/** A trade line's price limit allows this much movement since the prices were read (B23). */
export const SLIPPAGE = 0.02
/** How far back events are read: recent trades (docking), chat, registrations. */
const LOOKBACK_BLOCKS = 20_000
/** Where an unregistered player's view sits: Sol. */
const SOL = 0
/** Planets.sol's name parts. */
const NAME = { PLANET: 0, STATION: 1, MOON: 2 }
const BUILDING_NAMES = ['', 'Citadel', 'Colony', 'Station', 'Port', 'Yards', 'Armory', 'Autofactory']

/** What an unnamed star is called: "Star 1234", by its cell (a black hole: "Black Hole 1234"). */
export const unnamed = (cell, blackHole = false) => `${blackHole ? 'Black Hole' : 'Star'} ${cell}`

/** The system view draws stars 1–6 in size (Sol 4); star traits run 0.25–1. */
const starSize = (cell, size) => (cell === SOL ? 4 : Math.max(1, Math.min(6, Math.round(1 + ((size - 0.25) / 0.75) * 5))))

/** Events as the HUD and the chat menu read them (returnValues). */
const asEvent = (hash, block, returnValues) => ({ transactionHash: hash, blockNumber: block, returnValues })

/** Bays in use, as Pilots.sol counts them: cargo, people (100 a bay), fitted parts (D59) and damaged bays. */
export function usedBays(ship) {
  const l = ship.loadout
  const parts = l.drones * 2 + l.repairBots * 5 + l.armor * 10 + l.shields * 20
  return ship.cargo + Math.ceil(ship.colonists / 100) + parts + ship.baysLost
}

/** Holds at a yard: each costs more the more a ship has (Market.sol baysCost). */
export const baysQuoteFor = (tuning, bays, count) => baysCost(tuning.bayBase, tuning.bayStep, bays, count)

/** The next range upgrade's price, or null at full range. */
export const rangeQuoteFor = (tuning, range) => (range >= 4 ? null : tuning.rangePrices[range - 1])

/** Parts at an armory: Sol's I.S.S. (port 2) at twice their cost, a pilot's Armory at one and a half. */
export const partPriceFor = (rules, port, part, count) => {
  const unit = rules.parts[part].credits
  return Number(port) === 2 ? unit * 2 * count : Math.floor((unit * 3 * count) / 2)
}

/**
 * What stands between a planet (sdk/contracts.js toPlanet) and a building: [] when it can start now.
 * @param {{ rules: object, economy: object, credits: number }} context
 */
export function missingFor({ rules, economy, credits }, planet, building) {
  const cost = rules.buildings[building]
  const missing = []
  if (planet.building) missing.push('another building under way')
  if (building <= 6 && building !== planet.level + 1) missing.push(`a ${BUILDING_NAMES[building - 1]} first`)
  if (building === 7 && (planet.level < 2 || planet.autofactory))
    missing.push(planet.autofactory ? 'already built' : 'a Colony first')
  const people = building === 2 ? Math.ceil((planet.cap * cost.people) / 100) : cost.people
  if (planet.population < people) missing.push(`${people.toLocaleString()} people`)
  for (const [good, amount] of cost.goods) {
    if ((planet.stock[good] ?? 0) < amount) missing.push(`${amount} ${economy.goods[good].name.toLowerCase()} in storage`)
  }
  if (credits < cost.credits) missing.push(`${cost.credits.toLocaleString()} credits`)
  return missing
}

export function createGameClient() {
  const state = {
    chainId: 0,
    account: null,
    balance: '0',
    contracts: null,
    blockNumber: 0,
    player: null,
    events: null,
    system: null,
    systemProgress: 0,
    loading: { player: false, system: false },
    // the pilot's own
    universe: null,
    economy: null,
    rules: null,
    /** the raw pilot (sdk/contracts.js pilot()), null before loading, false if unregistered */
    pilot: null,
    credits: 0,
    cargo: [],
    /** planets the pilot owns, anywhere (their deeds) */
    deeds: 0,
    ports: [],
    planets: [],
    sieges: [],
    condition: null,
    defenses: {},
    factories: {},
    feed: [],
    /** the live session key: { key, expiry }, or null */
    session: null,
    /** the pilot's next scan: { cell, readyAt, status }, or null (scheduleScan) */
    scan: null,
    /** the galaxy map: cell number → cell, and star names by cell */
    cells: new Map(),
    names: {},
    loadedCenters: [],
    /** call signs by address (lowercase), for everyone met so far: discoverers, owners, attackers */
    callsigns: {}
  }
  const listeners = new Set()
  const notify = (change) => listeners.forEach((listener) => listener(change, state))
  const setLoading = (what, isLoading) => {
    state.loading[what] = isLoading
    notify('loading')
  }

  let network = null
  let game = null // the wallet's
  let keyGame = null // the session key's
  let keyWallet = null
  let pilots = [] // every registered pilot's address
  let leaderboard = null

  const MAX_TIME_BETWEEN_RELOADS_MS = 2 * 60 * 1000
  let lastReload = 0
  const watcher = createBlockWatcher({
    watchedAddresses: () => (network ? Object.values(network.contracts) : []),
    onBlock: (blockNumber, gameChanged) => {
      state.blockNumber = blockNumber
      notify('block')
      if (gameChanged || Date.now() - lastReload > MAX_TIME_BETWEEN_RELOADS_MS) client.refresh()
    }
  })

  const attempt = async (what, refresh) => {
    try {
      await refresh()
    } catch (error) {
      notify({ error, what })
    }
  }

  const sessionLive = () => Boolean(state.session && state.session.expiry * 1000 > Date.now() + 60_000)

  /** Reads the call signs of `addresses` not yet known, into state.callsigns. */
  async function learnCallsigns(addresses) {
    const unknown = [...new Set(addresses.filter((a) => a && !(a in state.callsigns)))]
    if (!unknown.length) return
    const found = await game.callsigns(unknown)
    for (const a of unknown) state.callsigns[a] = found[a] || ''
  }
  /** Who signs moves: the session key while it's live, otherwise the wallet. */
  const mover = () => (sessionLive() && keyGame ? keyGame : game)
  const proofs = () => game.proofsFor([...state.cells.values()])

  // ── scans: recorded as soon as drand publishes their round (D21) ─────────────────────────────

  /** The pilot's own discoveries still waiting for their scan. */
  const ownPending = () =>
    [...state.cells.values()].filter((c) => c.visited && !c.scanned && c.discoverer === state.account)
  let scanTimer = null
  /** Scans the pilot declined in the wallet: not asked again until something changes. */
  const declinedScans = new Set()
  /**
   * Plans the next scan: `state.scan` is { cell, readyAt (ms), status: 'waiting' | 'due' } for the one
   * at the ship's star (or the soonest), or null; when its round is out, subscribers hear 'scanDue'
   * and record it (stores/game-bindings.js), silently through a session key, else with one approval.
   */
  function scheduleScan() {
    clearTimeout(scanTimer)
    const pending = ownPending().filter((c) => !declinedScans.has(c.cell))
    if (!pending.length || !state.pilot) {
      if (state.scan) {
        state.scan = null
        notify('scan')
      }
      return
    }
    const here = pending.find((c) => c.cell === state.pilot.ship.cell)
    const next = here ?? pending.sort((a, b) => a.scanRound - b.scanRound)[0]
    const readyAt = timeOf(next.scanRound) * 1000
    state.scan = { cell: next.cell, readyAt, status: 'waiting' }
    notify('scan')
    // A moment after the round is due, so the relays have it.
    scanTimer = setTimeout(scanDue, Math.max(0, readyAt - Date.now()) + 1500)
  }
  async function scanDue() {
    if (!state.scan) return
    const ready = await game.proofsFor(ownPending())
    if (!ready.length) {
      scanTimer = setTimeout(scanDue, 3000) // not on the relays yet
      return
    }
    state.scan = { ...state.scan, status: 'due' }
    notify('scanDue')
  }
  const ship = () => state.pilot?.ship

  // ── the call sign, held until the ship is named (the wizard asks for them one at a time; they register in one move)

  const callsignKey = () => `o8.callsign.${state.chainId}.${state.account}`
  const heldCallsign = () => {
    try {
      return localStorage.getItem(callsignKey())
    } catch {
      return null
    }
  }
  let callsignInMemory = null
  const holdCallsign = (name) => {
    callsignInMemory = name
    try {
      localStorage.setItem(callsignKey(), name)
    } catch {
      // kept in memory for this visit
    }
  }
  const releaseCallsign = () => {
    callsignInMemory = null
    try {
      localStorage.removeItem(callsignKey())
    } catch {
      // nothing kept
    }
  }

  // ── reading ───────────────────────────────────────────────────────────────────────────────

  /** The player as the screens read it, from the pilot. */
  function playerShape() {
    const p = state.pilot
    const held = callsignInMemory ?? heldCallsign()
    const avatar = {
      registered: Boolean(p) || Boolean(held),
      name: p ? p.callsign : (held ?? ''),
      shipId: p ? p.shipId : 0,
      credits: state.credits,
      ship: { name: null, location: null, orbit: null, holds: null, cargo: [], usedHolds: 0, owner: null }
    }
    if (p) {
      avatar.ship = {
        name: p.ship.name,
        location: p.ship.cell,
        orbit: dockedAt(state.account, p.ship.cell),
        holds: p.ship.bays,
        cargo: [...state.cargo],
        usedHolds: usedBays(p.ship),
        range: Math.max(1, p.ship.range - p.ship.rangeLost),
        baseRange: p.ship.range,
        rangeLost: p.ship.rangeLost,
        baysLost: p.ship.baysLost,
        colonists: p.ship.colonists,
        loadout: p.ship.loadout,
        owner: state.account
      }
    }
    return { goods: state.economy.goods.map((g) => g.name), avatarCount: pilots.length, starSystemCount: starCount(), avatar }
  }
  const starCount = () => [...state.cells.values()].filter((c) => c.state === STATE.STAR).length

  /**
   * The planet a pilot last traded at, if their ship is still at that star (`cell`), else null: where
   * the ship is drawn (the contracts keep no orbit, B18).
   */
  let trades = []
  function dockedAt(address, cell) {
    for (let i = trades.length - 1; i >= 0; i--) {
      if (trades[i].sender !== address) continue
      return Math.floor(trades[i].port / 256) === cell ? trades[i].port : null
    }
    // null, not 0: Mercury is planet 0
    return null
  }

  async function loadPilot() {
    state.pilot = (await game.pilot(state.account)) ?? false
    if (!state.pilot) {
      Object.assign(state, { credits: 0, cargo: [], condition: null })
      return
    }
    releaseCallsign()
    const goods = state.economy.goods.length
    const [credits, cargo, condition, deeds] = await Promise.all([
      game.balance(state.account),
      game.cargo(state.account, goods),
      game.condition(state.account),
      game.deedCount(state.account)
    ])
    Object.assign(state, { credits, cargo, condition, deeds })
    resumeSession()
  }

  /** Picks up a session key this browser started earlier, if it's still the pilot's live one. */
  function resumeSession() {
    keyGame = keyWallet = null
    state.session = null
    const stored = state.pilot && loadKey(state.chainId, state.account)
    const onChain = state.pilot?.session
    if (!stored || !onChain || stored.address !== onChain.key || onChain.expiry * 1000 <= Date.now()) return
    keyWallet = keySigner(stored.privateKey, network.rpc[0])
    keyGame = createGame(keyWallet, network.contracts)
    state.session = { key: stored.address, expiry: onChain.expiry }
  }

  /** Reads the region around `center` unless a loaded region already covers it (or `force`). */
  async function loadAround(center, force = false) {
    const covered = state.loadedCenters.some((c) => distance(c, center) <= REGION_RADIUS / 2)
    if (covered && !force) return
    const cells = await game.region(center)
    const next = new Map(state.cells)
    for (const c of cells) next.set(c.cell, c)
    state.cells = next
    if (!covered) state.loadedCenters.push(center)
    // Names change (Planets.nameStar), so a forced read fetches the named stars' names again.
    await Promise.all([
      ...cells
        .filter((c) => c.named && (force || !(c.cell in state.names)))
        .map(async (c) => (state.names[c.cell] = await game.nameOf(c.cell))),
      // and the discoverers' call signs, for the map's card
      learnCallsigns(cells.map((c) => c.discoverer))
    ])
    notify('cells')
  }

  /** A star's name as given (genesis or a player, Planets.nameStar), else "Star 1234" by its cell. */
  function starName(cell) {
    return state.names[cell] || unnamed(cell, state.cells.get(cell)?.state === STATE.BLACK_HOLE)
  }

  /** The star the view shows: the ship's, or Sol before there is one. */
  const viewCell = () => (state.pilot ? state.pilot.ship.cell : SOL)

  /** The star system as the screens read it (sdk/system.js buildSystem), from derived planets, ports and pilots. */
  async function loadSystem(onProgress) {
    const cell = viewCell()
    const seed = state.universe.seed
    const goods = state.economy.goods.length
    // Re-read every time: visits and scans change the cells (a stale map never sends its scans).
    await loadAround(cell, true)
    onProgress(10)
    const star = state.cells.get(cell)
    const [planets, ports, sieges, here, recentTrades, keeper, naming] = await Promise.all([
      star?.state === STATE.STAR ? game.system(cell, goods) : [],
      game.portsAt(cell),
      game.siegesAt(cell),
      game.shipsAt(cell, pilots),
      game.recentTrades(LOOKBACK_BLOCKS),
      game.keeperOf(cell),
      state.pilot ? game.mayNameStar(cell, state.account) : { may: false, becomesOwner: false }
    ])
    trades = recentTrades
    onProgress(50)
    const names = await Promise.all(planets.map((p) => (p.owner ? game.namesOf(p.id) : null)))
    const mine = planets.filter((p) => p.owner === state.account)
    await Promise.all(
      mine.map(async (p) => {
        state.defenses[p.id] = await game.defenses(p.id)
        if (p.autofactory || p.building === 7) state.factories[p.id] = await game.factoryAt(p.id)
      })
    )
    Object.assign(state, { planets, ports, sieges })
    onProgress(80)

    const avatarNames = Object.fromEntries(here.map((s) => [s.address, s.callsign]))
    const owners = [...new Set(planets.map((p) => p.owner).filter(Boolean))].filter((a) => !(a in avatarNames))
    if (star?.discoverer && !(star.discoverer in avatarNames)) owners.push(star.discoverer)
    if (keeper && keeper !== network.contracts.galaxy.toLowerCase() && !(keeper in avatarNames)) owners.push(keeper)
    Object.assign(avatarNames, await game.callsigns(owners))
    for (const [a, name] of Object.entries(avatarNames)) if (name) state.callsigns[a] = name

    const name = starName(cell)
    const data = {
      id: cell,
      starName: name,
      starSize: starSize(cell, starTraits(seed, cell).size),
      birthTime: star?.discoveredAt ?? 0,
      discoveredBy: star?.discoverer ?? 0,
      neighborIds: [],
      neighbors: {},
      planetIds: planets.map((p) => p.id),
      planets: {},
      shipIds: here.map((s) => s.shipId),
      ships: {},
      avatarNames,
      recentTrades: trades.map((t) => ({ sender: t.sender, planetId: t.port })),
      // for the screens that show them
      cell: star ?? null,
      blackHole: star?.state === STATE.BLACK_HOLE,
      sieges,
      // its owner (null for none; "federation" for the Federation's) and whether the pilot may name it
      keeper: keeper === network.contracts.galaxy.toLowerCase() ? 'federation' : keeper,
      mayName: naming.may,
      namingOwns: naming.becomesOwner,
      named: Boolean(state.names[cell])
    }

    // Neighbors: every star and black hole the ship can reach from here (the galaxy map shows the rest).
    const reach = state.pilot ? Math.max(1, state.pilot.ship.range - state.pilot.ship.rangeLost) : 1
    const nearby = [...state.cells.values()]
      .filter((c) => (c.state === STATE.STAR || c.state === STATE.BLACK_HOLE) && c.cell !== cell)
      .filter((c) => distance(cell, c.cell) <= reach)
      .sort((a, b) => distance(cell, a.cell) - distance(cell, b.cell) || a.cell - b.cell)
    nearby.forEach((c, i) => {
      data.neighborIds.push(c.cell)
      data.neighbors[i] = {
        id: c.cell,
        exists: true,
        name: starName(c.cell),
        distance: distance(cell, c.cell),
        blackHole: c.state === STATE.BLACK_HOLE
      }
    })

    const portAt = new Map(ports.map((p) => [p.port, p]))
    planets.forEach((p, index) => {
      const look = looks(seed, cell, p.body)
      const given = names[index]
      const pname = given?.planet || planetName(name, cell, p.body)
      const owner = p.owner ?? 0
      const port = portAt.get(p.id)
      const planet = {
        id: String(p.id),
        name: pname,
        star: cell,
        size: p.size,
        class: p.class,
        rings: look.rings,
        orbitSpeed: look.orbitSpeed,
        owner,
        hasMoons: [0, 1, 2, 3, 4, 5, 6, 7].map((j) => look.moons.some((m) => m.orbit === j)),
        hasStation: Boolean(port),
        // Sol's nine are the Federation's (D49): nobody claims them
        federation: cell === SOL,
        moons: {},
        station: {},
        // the planet as the contracts have it, with its siege and defenses
        info: { ...p, siege: sieges.find((s) => s.planet === p.id) ?? null, defenses: state.defenses[p.id] ?? null }
      }
      for (const m of look.moons) {
        planet.moons[m.orbit] = {
          id: String(m.orbit),
          name: given?.moons[m.orbit] || m.name || moonName(pname, m.orbit),
          planet: String(p.id),
          size: m.size,
          class: m.class,
          orbitSpeed: m.orbitSpeed,
          owner
        }
      }
      if (port) {
        planet.station = {
          id: String(p.id),
          name: given?.station || (cell === SOL ? portNames(p.id).station : `${pname} Station`),
          size: look.stationSize,
          orbitSpeed: 1,
          owner,
          yard: port.yard,
          armory: cell === SOL ? p.id === 2 : p.level >= 6,
          goods: stationGoods(port)
        }
      }
      data.planets[p.body] = planet
    })

    for (const s of here) {
      data.ships[s.shipId] = {
        id: s.shipId,
        name: s.name,
        location: cell,
        orbit: dockedAt(s.address, cell),
        owner: s.address
      }
    }
    return data
  }

  /** A port's goods, for the trade menu (sdk/game/trade.js): what it sells or buys, how many, and the price curve. */
  function stationGoods(port) {
    const { goods, capacity, tuning } = state.economy
    return port.quotes
      .map((q, id) => ({ q, id }))
      .filter(({ q }) => q.mode !== MODE.NONE)
      .map(({ q, id }) => ({
        id,
        name: goods[id].name,
        mode: q.mode === MODE.SELLS ? 'sells' : 'buys',
        // sells: units on offer; buys: units the port will take
        stock: capacity - q.shortfall,
        price: q.price,
        curve: { base: goods[id].base, spread: goods[id].spread, capacity, shortfall: q.shortfall, feeBps: tuning.feeBps }
      }))
  }

  async function loadEvents() {
    const [registrations, broadcasts] = await Promise.all([
      game.registrations(LOOKBACK_BLOCKS),
      game.broadcasts(LOOKBACK_BLOCKS)
    ])
    return {
      avatarEvents: registrations.map((r) => asEvent(r.hash, r.block, { _owner: r.pilot, _name: r.callsign })),
      shipEvents: registrations.map((r) => asEvent(r.hash, r.block, { _owner: r.pilot, _name: r.shipName })),
      tradeEvents: trades.map((t) =>
        asEvent(t.hash, 0, { _sender: t.sender, _planetId: t.port, _good: t.good, _units: t.units })
      ),
      chatEvents: broadcasts.map((b) => asEvent(b.hash, b.block, { _sender: b.sender, _message: b.message }))
    }
  }

  // ── moving ──────────────────────────────────────────────────────────────────────────────────

  /** Sends a move (with proofs for published scans) from the session key or the wallet, then reloads. */
  async function move(send, options) {
    const receipt = await send(await proofs(), mover(), options)
    await client.refresh()
    return receipt
  }

  /** Credits for a trade line now: cost with fee for a purchase, proceeds after fee for a sale. */
  function lineValue(port, good, units) {
    const quote = port.quotes[good]
    const g = state.economy.goods[good]
    const { capacity } = state.economy
    const { feeBps } = state.economy.tuning
    if (units > 0) {
      const cost = buyCost(g.base, g.spread, capacity, quote.shortfall, units)
      return cost + fee(cost, feeBps)
    }
    const proceeds = sellProceeds(g.base, g.spread, capacity, quote.shortfall, -units)
    return proceeds - fee(proceeds, feeBps)
  }
  const portFor = (planetId) => {
    const port = state.ports.find((p) => p.port === Number(planetId))
    if (!port) throw new Error('There is no port there')
    return port
  }
  const baysQuote = (count) => baysQuoteFor(state.economy.tuning, ship().bays, count)
  const rangeQuote = () => rangeQuoteFor(state.economy.tuning, ship().range)
  const partPrice = (port, part, count) => partPriceFor(state.rules, port, part, count)

  const actions = {
    /** Holds the call sign (checked free) until the ship is named: both register in one move. */
    async createAvatar(name) {
      if (await game.callsignOwner(name)) throw new Error('That call sign is taken.')
      holdCallsign(name)
      notifyPlayer()
    },
    /** Registers the pilot and their ship together. */
    async launchShip(name, options) {
      const callsign = callsignInMemory ?? heldCallsign()
      if (!callsign) throw new Error('Choose a call sign first.')
      const receipt = await game.register(callsign, name, options)
      await client.refresh()
      return receipt
    },
    moveTo(cell, options) {
      return move((p, by, o) => by.jump(Number(cell), p, o), options)
    },
    sendChat(message, options) {
      return move((p, by, o) => by.broadcast(message, o), options)
    },
    /** Claims a planet, then names it (with a session key, neither asks the wallet). */
    async claimPlanet(planetId, name, options) {
      const receipt = await move((p, by, o) => by.claim(Number(planetId), o), options)
      if (name) await move((p, by) => by.renamePlanet(Number(planetId), NAME.PLANET, name))
      return receipt
    },
    /** Starts a building on the planet (the building line, D57). */
    buildStation(planetId, building, options) {
      return move((p, by, o) => by.build(Number(planetId), Number(building), o), options)
    },
    /** Trades at a planet's port: `lines` is [{ good, units }] (+ buy, - sell). Sales go first, to free bays. */
    trade(planetId, lines, options) {
      const port = portFor(planetId)
      const priced = [...lines]
        .filter((l) => l.units !== 0)
        .sort((a, b) => a.units - b.units)
        .map(({ good, units }) => {
          const value = lineValue(port, good, units)
          const limit = units > 0 ? Math.ceil(value * (1 + SLIPPAGE)) : Math.floor(value * (1 - SLIPPAGE))
          return { good, units, limit }
        })
      return move((p, by, o) => by.trade(port.port, priced, o), options)
    },
    buyHolds(planetId, amount, options) {
      return move((p, by, o) => by.buyBays(Number(planetId), amount, baysQuote(amount), o), options)
    },
    rename({ type, objectId, parentId, name }, options) {
      switch (type) {
        case 'star':
          return move((p, by, o) => by.nameStar(viewCell(), name, o), options)
        case 'planet':
          return move((p, by, o) => by.renamePlanet(Number(objectId), NAME.PLANET, name, o), options)
        case 'station':
          return move((p, by, o) => by.renamePlanet(Number(objectId), NAME.STATION, name, o), options)
        case 'moon':
          return move((p, by, o) => by.renamePlanet(Number(parentId), NAME.MOON + Number(objectId), name, o), options)
        case 'ship':
          return move((p, by, o) => by.renameShip(name, o), options)
      }
    },

    // ── and the rest ──
    buyRange(planetId, options) {
      return move((p, by, o) => by.buyRange(Number(planetId), rangeQuote(), o), options)
    },
    traverse(options) {
      return move((p, by, o) => by.traverse(p, o), options)
    },
    resolveScans(options) {
      return move(async (p, by, o) => (p.length ? by.resolveScans(p, o) : null), options)
    },
    changeCallsign(callsign, options) {
      return move((p, by, o) => by.changeCallsign(callsign, o), options)
    },
    recruit(count, options) {
      return move((p, by, o) => by.recruit(count, o), options)
    },
    land(planet, count, options) {
      return move((p, by, o) => by.land(Number(planet), count, o), options)
    },
    board(planet, count, options) {
      return move((p, by, o) => by.board(Number(planet), count, o), options)
    },
    deliver(planet, good, units, options) {
      return move((p, by, o) => by.deliver(Number(planet), good, units, o), options)
    },
    collect(planet, good, units, options) {
      return move((p, by, o) => by.collect(Number(planet), good, units, o), options)
    },
    order(planet, part, count, options) {
      return move((p, by, o) => by.order(Number(planet), part, count, o), options)
    },
    attack(planet, options) {
      return move((p, by, o) => by.attack(Number(planet), o), options)
    },
    joinDefense(planet, options) {
      return move((p, by, o) => by.joinDefense(Number(planet), o), options)
    },
    advanceSiege(planet, options) {
      return move((p, by, o) => by.advance(Number(planet), o), options)
    },
    fileClaim(planet, options) {
      return move((p, by, o) => by.fileClaim(Number(planet), o), options)
    },
    completeClaim(planet, options) {
      return move((p, by, o) => by.completeClaim(Number(planet), o), options)
    },
    withdraw(planet, options) {
      return move((p, by, o) => by.withdraw(Number(planet), o), options)
    },
    fitShip(planet, part, count, options) {
      return move((p, by, o) => by.fitShip(Number(planet), part, count, o), options)
    },
    unloadShip(planet, part, count, options) {
      return move((p, by, o) => by.unloadShip(Number(planet), part, count, o), options)
    },
    fitPlanet(planet, part, count, options) {
      return move((p, by, o) => by.fitPlanet(Number(planet), part, count, o), options)
    },
    buyParts(port, part, count, options) {
      return move((p, by, o) => by.buyParts(Number(port), part, count, partPrice(port, part, count), o), options)
    },
    repair(port, options) {
      return move((p, by, o) => by.repair(Number(port), o), options)
    },
    /** One wallet approval: a new key may make moves for SESSION_HOURS, with gas money sent along. */
    async startSession(options) {
      const key = newKey()
      const expiry = Math.floor(Date.now() / 1000) + SESSION_HOURS * 3600
      const receipt = await game.startSession(key.address, expiry, parseEther(network.sessionFunds ?? '0.2'), options)
      saveKey(state.chainId, state.account, { ...key, expiry })
      await client.refresh()
      return receipt
    },
    /** Ends the session from the key itself (no wallet popup) and sends its leftover gas money home. */
    async endSession(options) {
      let receipt
      if (keyGame) {
        receipt = await keyGame.endSession(options)
        await sweep(keyWallet, state.account).catch((error) => console.warn('Returning gas money failed:', error))
      } else {
        receipt = await game.endSession(options)
      }
      forgetKey(state.chainId, state.account)
      await client.refresh()
      return receipt
    }
  }

  function notifyPlayer() {
    state.player = playerShape()
    notify('player')
  }

  /** Registration (launchShip) is remembered while in flight, so a reload can pick up the wait. */
  const launch = actions.launchShip
  actions.launchShip = async (name, options = {}) => {
    const { chainId, account } = state
    try {
      return await launch(name, {
        ...options,
        onSent: (hash) => {
          rememberPending(chainId, account, { kind: 'ship', hash, name, sentAt: Date.now() })
          options.onSent?.(hash)
        }
      })
    } finally {
      forgetPending(chainId, account)
    }
  }

  const client = {
    state,
    actions,

    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },

    async connect(wallet) {
      await connectWallet(wallet)
      await client.useSession()
    },

    /** Takes up the wallet session already open (sdk/chain/wallet.js). */
    async useSession() {
      const session = getSession()
      state.chainId = session.chainId
      state.account = session.account.toLowerCase()
      notify('connected')
      state.balance = await getNativeBalance()
      notify('connected')
    },

    /** Binds the contracts on the connected network. Resolves false if the game isn't deployed there. */
    async bindContracts() {
      network = networkFor(state.chainId)
      if (!network) return false
      const { signer, provider } = getSession()
      if ((await provider.getCode(network.contracts.pilots)) === '0x') return false
      game = createGame(signer, network.contracts)
      const c = network.contracts
      state.contracts = {
        game: c.pilots,
        avatars: c.pilots,
        planetToken: c.deeds,
        shipToken: c.ships,
        creditToken: c.credits,
        ...c
      }
      ;[state.universe, state.economy, state.rules, pilots] = await Promise.all([
        game.universe(),
        game.economy(),
        game.planetRules(),
        game.pilotList()
      ])
      notify('contracts')
      return true
    },

    checkForNewBlock() {
      return watcher.check()
    },

    async getLeaderboard({ refresh = false } = {}) {
      const fresh = leaderboard && Date.now() - leaderboard.loadedAt < 60_000
      if (!fresh || refresh) {
        pilots = await game.pilotList()
        const [names, claimed] = await Promise.all([game.callsigns(pilots), game.claimedPlanets()])
        const views = await Promise.all(claimed.map((c) => game.planetView(c.id)))
        const players = await Promise.all(
          pilots.map(async (address) => ({
            address,
            name: names[address],
            planets: claimed.filter((c) => c.owner === address).length,
            ports: claimed.filter((c, i) => c.owner === address && views[i].level >= 4).length,
            credits: await game.balance(address)
          }))
        )
        leaderboard = { players, loadedAt: Date.now() }
      }
      return leaderboard
    },

    pendingRegistration() {
      return state.account ? pendingRegistration(state.chainId, state.account) : null
    },

    async resumeRegistration() {
      const pending = client.pendingRegistration()
      if (!pending) return
      try {
        await waitForTransaction(pending.hash)
      } finally {
        forgetPending(state.chainId, state.account)
        await client.refreshPlayer()
      }
    },

    /** Every call sign in use, lowercased. */
    async listCallsigns() {
      if (!game) return null
      pilots = await game.pilotList()
      return new Set(Object.values(await game.callsigns(pilots)).map((c) => c.toLowerCase()))
    },

    async refreshBalance() {
      state.balance = await getNativeBalance()
      notify('balance')
    },

    refresh() {
      lastReload = Date.now()
      return Promise.all([client.refreshPlayer(), client.refreshEvents()]).then(() => client.refreshSystem())
    },

    refreshPlayer() {
      setLoading('player', true)
      return attempt('player', async () => {
        pilots = await game.pilotList()
        await loadPilot()
        state.player = playerShape()
        notify('player')
        notify('pilot')
      }).finally(() => setLoading('player', false))
    },

    refreshEvents() {
      return attempt('events', async () => {
        state.events = await loadEvents()
        notify('events')
        state.feed = await game.siegeFeed().catch(() => state.feed)
        await learnCallsigns(state.feed.map((e) => e.who)).catch(() => {})
        notify('feed')
      })
    },

    refreshSystem() {
      if (state.loading.system) return Promise.resolve()
      setLoading('system', true)
      state.systemProgress = 1
      notify('systemProgress')
      return attempt('system', async () => {
        state.system = await loadSystem((percent) => {
          state.systemProgress = percent
          notify('systemProgress')
        })
        // The docked planet comes from the trades just read.
        if (state.player) state.player = playerShape()
        notify('player')
        notify('system')
        scheduleScan()
      }).finally(() => setLoading('system', false))
    },

    /** The pilot declined recording a scan: don't ask again for it until the next change. */
    scanDeclined(cell) {
      declinedScans.add(cell)
      scheduleScan()
    },

    // ── reads for the pilot's screens ─────────────────────────────────────────────────────────

    /** Reads the galaxy map's region around `center` (the map view calls this as the player pans). */
    loadAround,
    starName,
    /** A pilot's call sign, if the client has met them, else null. */
    callsignOf(address) {
      return state.callsigns[address] || null
    },
    previewScan(cell) {
      const c = state.cells.get(cell)
      if (!c || !c.visited || c.scanned) return null
      return game.previewScan(cell, c.scanRound)
    },
    sessionLive,
    lineValue,
    baysQuote,
    rangeQuote,
    partPrice,
    usedBays,
    missingFor(planet, building) {
      return missingFor(state, planet, building)
    },
    /** How many planets circle a star, and each one's derived traits (for the map's previews). */
    planetsOf(cell) {
      const n = planetCount(state.universe.seed, cell)
      return Array.from({ length: n }, (_, body) => derivePlanet(state.universe.seed, cell, body))
    }
  }
  return client
}

export { STATE, BUILDING_NAMES }

/** The app's one game client. */
export const game = createGameClient()
