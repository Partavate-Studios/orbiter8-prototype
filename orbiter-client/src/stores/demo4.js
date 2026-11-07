// Demo 4's own state and actions for Demo 3's screens (docs/demo4-plan.md, milestone 5b): the session
// key, the economy, planets (people, buildings, storage), the ship's loadout and condition, sieges and
// the siege feed. Mirrors sdk/v4/client.js (stores/game-bindings.js keeps it in step); every action
// shows its progress in the transaction tray, as Demo 3's do.
import { defineStore } from 'pinia'
import { markRaw } from 'vue'
import { game } from '@/sdk/client'
import { useTransactionsStore } from '@/stores/transactions'
import { BUILDING_NAMES, baysQuoteFor, rangeQuoteFor, partPriceFor, missingFor, usedBays } from '@/sdk/v4/client'

const track = (words, send) => useTransactionsStore().track(words, send)
const v4 = () => game.demo4

export const useDemo4Store = defineStore('Demo4', {
  state: () => ({
    /** Playing Demo 4's contracts (game.version === 4). */
    active: false,
    /** the player's address, lowercase */
    account: null,
    economy: null,
    rules: null,
    /** the raw pilot (sdk/v4/game.js pilot()), null before loading, false if unregistered */
    pilot: null,
    credits: 0,
    cargo: [],
    /** the pilot owns a planet somewhere */
    ownsPlanets: false,
    ports: [],
    /** the planets at the ship's star (sdk/v4/game.js toPlanet) */
    planets: [],
    sieges: [],
    condition: null,
    defenses: {},
    factories: {},
    feed: [],
    session: null,
    /** bumped when the galaxy map's cells change */
    cellsVersion: 0,
    /** Pilots.sol SHIP_NAME_FEE (B16) */
    shipNameFee: 500,
    /** clock for timers (session expiry, buildings, sieges), ticked by the screens */
    now: Date.now()
  }),
  getters: {
    sessionLive: (state) => Boolean(state.session && state.session.expiry * 1000 > state.now + 60_000),
    ship: (state) => (state.pilot ? state.pilot.ship : null),
    freeBays: (state) => (state.pilot ? Math.max(0, state.pilot.ship.bays - usedBays(state.pilot.ship)) : 0),
    /** What the ship can fire now (its loadout less what's out of action). */
    armed: (state) => {
      if (!state.pilot) return false
      const l = state.pilot.ship.loadout
      const off = state.condition?.off ?? [0, 0, 0, 0, 0]
      return l.railguns - off[1] + l.missiles - off[2] + l.drones - off[3] > 0
    },
    /** Stars with a siege running, from the feed: for the map. */
    besiegedCells: (state) => {
      const live = new Set()
      for (const e of [...state.feed].reverse()) {
        if (e.event === 'SiegeStarted') live.add(e.planet)
        if (e.event === 'SiegeEnded') live.delete(e.planet)
      }
      return new Set([...live].map((p) => Math.floor(p / 256)))
    },
    planetById: (state) => (id) => state.planets.find((p) => p.id === Number(id)) ?? null,
    siegeAt: (state) => (id) => state.sieges.find((s) => s.planet === Number(id)) ?? null
  },
  actions: {
    /** Copies the client's state (stores/game-bindings.js calls this on every change). */
    sync() {
      const s = v4().state
      this.active = game.version === 4
      if (!this.active) return
      Object.assign(this, {
        account: s.account,
        economy: s.economy,
        rules: s.rules,
        pilot: s.pilot,
        credits: s.credits,
        cargo: s.cargo,
        ownsPlanets: s.deeds > 0,
        ports: s.ports,
        planets: s.planets,
        sieges: s.sieges,
        condition: s.condition,
        defenses: { ...s.defenses },
        factories: { ...s.factories },
        feed: markRaw(s.feed),
        session: s.session
      })
    },
    tick() {
      this.now = Date.now()
    },

    // ── prices and rules (sdk/v4/client.js), from this store's own copy of the state ─────────────
    baysQuote(count) {
      return baysQuoteFor(this.economy.tuning, this.pilot.ship.bays, count)
    },
    rangeQuote() {
      return rangeQuoteFor(this.economy.tuning, this.pilot.ship.range)
    },
    partPrice(port, part, count) {
      return partPriceFor(this.rules, port, part, count)
    },
    missingFor(planet, building) {
      return missingFor(this, planet, building)
    },

    // ── moves, each shown in the transaction tray ───────────────────────────────────────────────
    startSession() {
      return track(
        { doing: 'Starting a session', done: 'Session started: no wallet popups for a while', failed: "Couldn't start a session" },
        (o) => v4().actions.startSession(o)
      )
    },
    endSession() {
      return track({ doing: 'Ending the session', done: 'Session ended', failed: "Couldn't end the session" }, (o) =>
        v4().actions.endSession(o)
      )
    },
    buyBays(planetId, count) {
      const bays = count === 1 ? '1 bay' : `${count} bays`
      return track({ doing: `Fitting ${bays}`, done: `${bays} fitted`, failed: "Couldn't fit the bays" }, (o) =>
        v4().actions.buyHolds(planetId, count, o)
      )
    },
    buyRange(planetId) {
      return track({ doing: 'Upgrading the engines', done: 'Range upgraded', failed: "Couldn't upgrade the engines" }, (o) =>
        v4().actions.buyRange(planetId, o)
      )
    },
    traverse() {
      return track({ doing: 'Entering the black hole', done: 'Through the black hole', failed: "Couldn't go through" }, (o) =>
        v4().actions.traverse(o)
      )
    },
    resolveScans() {
      return track({ doing: 'Recording the scans', done: 'Scans recorded', failed: "Couldn't record the scans" }, (o) =>
        v4().actions.resolveScans(o)
      )
    },
    changeCallsign(callsign) {
      return track(
        { doing: `Changing your call sign to ${callsign}`, done: `You're ${callsign} now`, failed: "Couldn't change your call sign" },
        (o) => v4().actions.changeCallsign(callsign, o)
      )
    },
    recruit(count) {
      return track({ doing: `Recruiting ${count} colonists`, done: `${count} colonists aboard`, failed: "Couldn't recruit" }, (o) =>
        v4().actions.recruit(count, o)
      )
    },
    land(planet, count, name) {
      return track({ doing: `Landing ${count} colonists`, done: `${count} colonists on ${name}`, failed: "Couldn't land them" }, (o) =>
        v4().actions.land(planet, count, o)
      )
    },
    board(planet, count) {
      return track({ doing: `Boarding ${count} colonists`, done: `${count} colonists aboard`, failed: "Couldn't board them" }, (o) =>
        v4().actions.board(planet, count, o)
      )
    },
    deliver(planet, good, units, name) {
      return track({ doing: `Delivering ${units} ${name}`, done: `${units} ${name} delivered`, failed: "Couldn't deliver" }, (o) =>
        v4().actions.deliver(planet, good, units, o)
      )
    },
    collect(planet, good, units, name) {
      return track({ doing: `Collecting ${units} ${name}`, done: `${units} ${name} aboard`, failed: "Couldn't collect" }, (o) =>
        v4().actions.collect(planet, good, units, o)
      )
    },
    build(planet, building, name) {
      const what = BUILDING_NAMES[building]
      return track(
        { doing: `Starting a ${what} on ${name}`, done: `${what} under way on ${name}`, failed: `Couldn't start the ${what}` },
        (o) => v4().actions.buildStation(planet, building, o)
      )
    },
    order(planet, part, count) {
      const name = this.rules.parts[part].name
      return track({ doing: `Ordering ${count} × ${name}`, done: `${count} × ${name} ordered`, failed: "Couldn't place the order" }, (o) =>
        v4().actions.order(planet, part, count, o)
      )
    },
    attack(planet, name) {
      return track({ doing: `Laying siege to ${name}`, done: `Siege of ${name} begun`, failed: "Couldn't attack" }, (o) =>
        v4().actions.attack(planet, o)
      )
    },
    joinDefense(planet, name) {
      return track({ doing: `Joining ${name}'s defense`, done: `Defending ${name}`, failed: "Couldn't join the defense" }, (o) =>
        v4().actions.joinDefense(planet, o)
      )
    },
    advanceSiege(planet) {
      return track({ doing: 'Recording the rounds', done: 'Rounds recorded', failed: "Couldn't record the rounds" }, (o) =>
        v4().actions.advanceSiege(planet, o)
      )
    },
    fileClaim(planet, name) {
      return track({ doing: `Filing a claim on ${name}`, done: 'Claim filed with Minerva', failed: "Couldn't file the claim" }, (o) =>
        v4().actions.fileClaim(planet, o)
      )
    },
    completeClaim(planet, name) {
      return track({ doing: `Completing the claim on ${name}`, done: `${name} is yours`, failed: "Couldn't complete the claim" }, (o) =>
        v4().actions.completeClaim(planet, o)
      )
    },
    withdraw(planet) {
      return track({ doing: 'Withdrawing', done: 'Withdrawn from the siege', failed: "Couldn't withdraw" }, (o) =>
        v4().actions.withdraw(planet, o)
      )
    },
    fitShip(planet, part, count) {
      const name = this.rules.parts[part].name
      return track({ doing: `Fitting ${count} × ${name}`, done: `${count} × ${name} fitted`, failed: "Couldn't fit it" }, (o) =>
        v4().actions.fitShip(planet, part, count, o)
      )
    },
    unloadShip(planet, part, count) {
      const name = this.rules.parts[part].name
      return track({ doing: `Unloading ${count} × ${name}`, done: `${count} × ${name} unloaded`, failed: "Couldn't unload it" }, (o) =>
        v4().actions.unloadShip(planet, part, count, o)
      )
    },
    fitPlanet(planet, part, count) {
      const name = this.rules.parts[part].name
      return track({ doing: `Installing ${count} × ${name}`, done: `${count} × ${name} installed`, failed: "Couldn't install it" }, (o) =>
        v4().actions.fitPlanet(planet, part, count, o)
      )
    },
    buyParts(port, part, count) {
      const name = this.rules.parts[part].name
      return track({ doing: `Buying ${count} × ${name}`, done: `${count} × ${name} fitted`, failed: "Couldn't buy it" }, (o) =>
        v4().actions.buyParts(port, part, count, o)
      )
    },
    repair(port) {
      return track({ doing: 'Booking repairs', done: 'Repaired: in the yard for a while', failed: "Couldn't repair" }, (o) =>
        v4().actions.repair(port, o)
      )
    }
  }
})
