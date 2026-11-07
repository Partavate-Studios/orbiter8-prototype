// The Demo 4 galaxy as the player sees it (docs/demo4-plan.md, milestones 1 and 2): the wallet, the
// universe, the player's pilot, ship, credits and cargo, the ports where the ship is, and the cells
// loaded so far, region by region as the player looks around (D18). Moves send any published pending
// scans along, so scans never need their own approval (D21), and go through the session key when one
// is live, so they need no wallet approval either (D41).
import { defineStore } from 'pinia'
import { markRaw } from 'vue'
import { parseEther } from 'ethers'
import { discoverWallets, preferredWallet, connectWallet } from '@/sdk/chain/wallet'
import { createGame, STATE, REGION_RADIUS } from '@/sdk/v4/game'
import { deployment } from '@/sdk/v4/config'
import { distance } from '@/sdk/v4/hex'
import { buyCost, sellProceeds, fee, baysCost, MODE } from '@/sdk/v4/market'
import { SESSION_HOURS, loadKey, saveKey, forgetKey, newKey, keySigner, sweep } from '@/sdk/v4/session-key'

/** The wallet's game (registering, sessions) and the session key's (moves), outside the reactive state. */
let game = null
let keyGame = null
let keyWallet = null
let where = null

/** A trade line's price limit allows this much movement since the prices were read (B23). */
const SLIPPAGE = 0.02

export const useGalaxyStore = defineStore('Galaxy', {
  state: () => ({
    /** 'idle' | 'connecting' | 'ready' | 'no-deployment' | 'error' */
    status: 'idle',
    error: null,
    account: null,
    universe: null,
    /** null until loaded; false if the wallet has no pilot yet */
    pilot: null,
    /** cell number → cell (see sdk/v4/game.js), raw: replaced whole on each load */
    cells: markRaw(new Map()),
    /** bumped when `cells` changes, for views to follow */
    cellsVersion: 0,
    /** centers already read (each covers REGION_RADIUS around it) */
    loadedCenters: [],
    names: {},
    selected: null,
    /** a move in progress: 'register' | 'jump' | 'traverse' | 'rename' | 'trade' | 'yard' | 'session' */
    busy: null,
    credits: 0,
    /** units aboard, by good id */
    cargo: [],
    /** the goods registry, tuning and port capacity (see sdk/v4/game.js economy()) */
    economy: null,
    /** the ports at the ship's star */
    ports: [],
    /** the live session key, or null: { key, expiry } */
    session: null,
    /** the planets at the ship's star (see sdk/v4/game.js toPlanet) */
    planets: [],
    /** building costs, the claim fee, colonist price and the Autofactory's parts (planetRules) */
    rules: null,
    /** planet id → its Autofactory's queue and finished parts */
    factories: {}
  }),
  getters: {
    shipCell: (state) => (state.pilot ? state.pilot.ship.cell : null),
    freeBays: (state) => {
      if (!state.pilot) return 0
      const { bays, cargo, colonists } = state.pilot.ship
      return bays - cargo - Math.ceil(colonists / 100)
    },
    sessionLive: (state) => Boolean(state.session && state.session.expiry * 1000 > Date.now() + 60_000),
    cellAt: (state) => (n) => state.cells.get(n) ?? null,
    /** Can the ship jump to `n` now? */
    canJumpTo: (state) => (n) => {
      if (!state.pilot) return false
      const c = state.cells.get(n)
      if (!c || (c.state !== STATE.STAR && c.state !== STATE.BLACK_HOLE)) return false
      const steps = distance(state.pilot.ship.cell, n)
      return steps > 0 && steps <= state.pilot.ship.range
    }
  },
  actions: {
    async connect() {
      this.status = 'connecting'
      try {
        where = await deployment()
        if (!where) {
          this.status = 'no-deployment'
          return
        }
        const wallets = await discoverWallets()
        const wallet = preferredWallet(wallets) ?? wallets[0]
        if (!wallet) throw new Error('No wallet found')
        const session = await connectWallet(wallet)
        game = markRaw(createGame(session.signer, where.contracts))
        this.account = session.account.toLowerCase()
        this.universe = await game.universe()
        this.economy = await game.economy()
        this.rules = await game.planetRules()
        await this.refreshPilot()
        this.resumeSession()
        await this.loadAround(this.pilot ? this.pilot.ship.cell : 0, true)
        this.status = 'ready'
      } catch (error) {
        console.error('Connecting to Demo 4 failed:', error)
        this.error = error.shortMessage ?? error.message
        this.status = 'error'
      }
    },
    /** The pilot, their credits and cargo, and the ports where their ship is. */
    async refreshPilot() {
      this.pilot = (await game.pilot(this.account)) ?? false
      if (!this.pilot) return
      const cell = this.pilot.ship.cell
      const goods = this.economy.goods.length
      const [credits, cargo, ports, economy, planets] = await Promise.all([
        game.balance(this.account),
        game.cargo(this.account, goods),
        game.portsAt(cell),
        game.economy(),
        game.system(cell, goods)
      ])
      Object.assign(this, { credits, cargo, ports, economy, planets })
      const mine = planets.filter((p) => p.owner === this.account && (p.autofactory || p.building === 7))
      for (const p of mine) this.factories[p.id] = await game.factoryAt(p.id)
    },
    /** Picks up a session key this browser started earlier, if it's still the pilot's live one. */
    resumeSession() {
      keyGame = keyWallet = null
      this.session = null
      const stored = this.pilot && loadKey(where.chainId, this.account)
      const onChain = this.pilot?.session
      if (!stored || !onChain || stored.address !== onChain.key || onChain.expiry * 1000 <= Date.now()) return
      keyWallet = markRaw(keySigner(stored.privateKey, where.rpc))
      keyGame = markRaw(createGame(keyWallet, where.contracts))
      this.session = { key: stored.address, expiry: onChain.expiry }
    },
    /** Who signs moves: the session key while it's live, otherwise the wallet. */
    mover() {
      return this.sessionLive && keyGame ? keyGame : game
    },
    /** Reads the region around `center` unless a loaded region already covers it (or `force`). */
    async loadAround(center, force = false) {
      const covered = this.loadedCenters.some((c) => distance(c, center) <= REGION_RADIUS / 2)
      if (covered && !force) return
      const cells = await game.region(center)
      const next = new Map(this.cells)
      for (const c of cells) next.set(c.cell, c)
      this.cells = markRaw(next)
      this.cellsVersion++
      if (!covered) this.loadedCenters.push(center)
      for (const c of cells) if (c.named && !(c.cell in this.names)) this.loadName(c.cell)
    },
    async loadName(cell) {
      this.names[cell] = await game.nameOf(cell)
    },
    /** Re-reads every loaded region (after a move). */
    async reload() {
      const centers = [...this.loadedCenters]
      for (const c of centers) await this.loadAround(c, true)
    },
    select(cell) {
      this.selected = cell
    },
    /** Pending scans around the loaded area whose rounds are out, to send with the next move. */
    async proofs() {
      return game.proofsFor([...this.cells.values()])
    },
    async previewScan(cell) {
      const c = this.cells.get(cell)
      if (!c || !c.visited || c.scanned) return null
      return game.previewScan(cell, c.scanRound)
    },
    async move(kind, send) {
      this.busy = kind
      this.error = null
      try {
        await send(await this.proofs(), this.mover())
        await this.refreshPilot()
        await this.loadAround(this.pilot.ship.cell)
        await this.reload()
        return true
      } catch (error) {
        console.error(`${kind} failed:`, error)
        this.error = error.shortMessage ?? error.reason ?? error.message
        return false
      } finally {
        this.busy = null
      }
    },
    register(callsign, shipName) {
      return this.move('register', () => game.register(callsign, shipName))
    },
    jump(to) {
      return this.move('jump', (proofs, by) => by.jump(to, proofs))
    },
    traverse() {
      return this.move('traverse', (proofs, by) => by.traverse(proofs))
    },
    async renameStar(cell, name) {
      const ok = await this.move('rename', (proofs, by) => by.renameStar(cell, name, proofs))
      if (ok) await this.loadName(cell)
      return ok
    },
    /** Writes published scans now, without moving (e.g. the player wants their neighborhood on record). */
    resolveScans() {
      return this.move('resolve', async (proofs, by) => {
        if (proofs.length) await by.resolveScans(proofs)
      })
    },

    // ── trade and the yard (milestone 2) ──────────────────────────────────────────────────────

    /** Credits for a trade line now (cost with fee for a purchase, proceeds after fee for a sale). */
    lineValue(port, good, units) {
      const quote = port.quotes[good]
      const g = this.economy.goods[good]
      const { capacity } = this.economy
      const { feeBps } = this.economy.tuning
      if (units > 0) {
        const cost = buyCost(g.base, g.spread, capacity, quote.shortfall, units)
        return cost + fee(cost, feeBps)
      }
      const proceeds = sellProceeds(g.base, g.spread, capacity, quote.shortfall, -units)
      return proceeds - fee(proceeds, feeBps)
    },
    /** Most units of a good the ship can buy here: bays, credits and the port's stock allowing. */
    maxBuy(port, good) {
      const quote = port.quotes[good]
      if (quote.mode !== MODE.SELLS) return 0
      let n = Math.min(this.freeBays, this.economy.capacity - quote.shortfall)
      while (n > 0 && this.lineValue(port, good, n) > this.credits) n--
      return n
    },
    /** Most units of a good the port will take from the ship. */
    maxSell(port, good) {
      const quote = port.quotes[good]
      if (quote.mode !== MODE.BUYS) return 0
      return Math.min(this.cargo[good] ?? 0, this.economy.capacity - quote.shortfall)
    },
    /** Trades at a port: `lines` is [{ good, units }] (+ buy, - sell). Sales go first, to free bays. */
    trade(port, lines) {
      const priced = [...lines]
        .filter((l) => l.units !== 0)
        .sort((a, b) => a.units - b.units)
        .map(({ good, units }) => {
          const value = this.lineValue(port, good, units)
          const limit = units > 0 ? Math.ceil(value * (1 + SLIPPAGE)) : Math.floor(value * (1 - SLIPPAGE))
          return { good, units, limit }
        })
      return this.move('trade', (proofs, by) => by.trade(port.port, priced))
    },
    baysQuote(count) {
      const t = this.economy.tuning
      return baysCost(t.bayBase, t.bayStep, this.pilot.ship.bays, count)
    },
    rangeQuote() {
      const range = this.pilot.ship.range
      return range >= 4 ? null : this.economy.tuning.rangePrices[range - 1]
    },
    buyBays(port, count) {
      return this.move('yard', (proofs, by) => by.buyBays(port.port, count, this.baysQuote(count)))
    },
    buyRange(port) {
      return this.move('yard', (proofs, by) => by.buyRange(port.port, this.rangeQuote()))
    },

    // ── planets (milestone 3) ─────────────────────────────────────────────────────────────────

    claim(planet) {
      return this.move('claim', (proofs, by) => by.claim(planet))
    },
    recruit(count) {
      return this.move('people', (proofs, by) => by.recruit(count))
    },
    land(planet, count) {
      return this.move('people', (proofs, by) => by.land(planet, count))
    },
    board(planet, count) {
      return this.move('people', (proofs, by) => by.board(planet, count))
    },
    deliver(planet, good, units) {
      return this.move('cargo', (proofs, by) => by.deliver(planet, good, units))
    },
    collect(planet, good, units) {
      return this.move('cargo', (proofs, by) => by.collect(planet, good, units))
    },
    build(planet, building) {
      return this.move('build', (proofs, by) => by.build(planet, building))
    },
    order(planet, part, count) {
      return this.move('build', (proofs, by) => by.order(planet, part, count))
    },
    /** What stands between a planet and a building: [] when it can be started now. */
    missingFor(planet, building) {
      const cost = this.rules.buildings[building]
      const missing = []
      if (planet.building) missing.push('another building under way')
      if (building <= 6 && building !== planet.level + 1)
        missing.push(`a ${['', 'Citadel', 'Colony', 'Station', 'Port', 'Yards'][building - 1]} first`)
      if (building === 7 && (planet.level < 2 || planet.autofactory))
        missing.push(planet.autofactory ? 'already built' : 'a Colony first')
      const people = building === 2 ? Math.ceil((planet.cap * cost.people) / 100) : cost.people
      if (planet.population < people) missing.push(`${people.toLocaleString()} people`)
      for (const [good, amount] of cost.goods) {
        if ((planet.stock[good] ?? 0) < amount)
          missing.push(`${amount} ${this.economy.goods[good].name.toLowerCase()} in storage`)
      }
      if (this.credits < cost.credits) missing.push(`${cost.credits.toLocaleString()} credits`)
      return missing
    },

    // ── session keys (D41) ────────────────────────────────────────────────────────────────────

    /** One wallet approval: a new key may make moves for SESSION_HOURS, with gas money sent along. */
    async startSession() {
      this.busy = 'session'
      this.error = null
      try {
        const key = newKey()
        const expiry = Math.floor(Date.now() / 1000) + SESSION_HOURS * 3600
        await game.startSession(key.address, expiry, parseEther(where.sessionFunds ?? '0.2'))
        saveKey(where.chainId, this.account, { ...key, expiry })
        await this.refreshPilot()
        this.resumeSession()
        return true
      } catch (error) {
        console.error('Starting a session failed:', error)
        this.error = error.shortMessage ?? error.reason ?? error.message
        return false
      } finally {
        this.busy = null
      }
    },
    /** Ends the session from the key itself (no wallet popup) and sends its leftover gas money home. */
    async endSession() {
      this.busy = 'session'
      this.error = null
      try {
        if (keyGame) {
          await keyGame.endSession()
          await sweep(keyWallet, this.account).catch((error) => console.warn('Returning gas money failed:', error))
        } else {
          await game.endSession()
        }
        forgetKey(where.chainId, this.account)
        await this.refreshPilot()
        this.resumeSession()
        return true
      } catch (error) {
        console.error('Ending the session failed:', error)
        this.error = error.shortMessage ?? error.reason ?? error.message
        return false
      } finally {
        this.busy = null
      }
    }
  }
})

export { STATE }
