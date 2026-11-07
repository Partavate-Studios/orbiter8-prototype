// The pilot's own state and actions: the session key, the economy, planets (people, buildings,
// storage), the ship's loadout and condition, sieges and the siege feed. Mirrors sdk/client.js
// (stores/game-bindings.js keeps it in step); every action shows its progress in the transaction tray.
import { defineStore } from 'pinia'
import { markRaw } from 'vue'
import { game, BUILDING_NAMES, baysQuoteFor, rangeQuoteFor, partPriceFor, missingFor, usedBays } from '@/sdk/client'
import { useTransactionsStore } from '@/stores/transactions'

const track = (words, send) => useTransactionsStore().track(words, send)

export const usePlayerStore = defineStore('Player', {
  state: () => ({
    /** the player's address, lowercase */
    account: null,
    economy: null,
    rules: null,
    /** the raw pilot (sdk/contracts.js pilot()), null before loading, false if unregistered */
    pilot: null,
    credits: 0,
    cargo: [],
    /** the pilot owns a planet somewhere */
    ownsPlanets: false,
    ports: [],
    /** the planets at the ship's star (sdk/contracts.js toPlanet) */
    planets: [],
    sieges: [],
    condition: null,
    defenses: {},
    factories: {},
    feed: [],
    session: null,
    /** the pilot's next scan: { cell, readyAt, status: 'waiting' | 'due' }, or null */
    scan: null,
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
      const s = game.state
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
        session: s.session,
        scan: s.scan
      })
    },
    tick() {
      this.now = Date.now()
    },

    // ── prices and rules (sdk/client.js), from this store's own copy of the state ─────────────
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
        { doing: 'Starting a session', done: 'Session started: no wallet popups for 4 hours', failed: "Couldn't start a session" },
        (o) => game.actions.startSession(o)
      )
    },
    endSession() {
      return track({ doing: 'Ending the session', done: 'Session ended', failed: "Couldn't end the session" }, (o) =>
        game.actions.endSession(o)
      )
    },
    buyBays(planetId, count) {
      const bays = count === 1 ? '1 bay' : `${count} bays`
      return track({ doing: `Fitting ${bays}`, done: `${bays} fitted`, failed: "Couldn't fit the bays" }, (o) =>
        game.actions.buyHolds(planetId, count, o)
      )
    },
    buyRange(planetId) {
      return track({ doing: 'Upgrading the engines', done: 'Range upgraded', failed: "Couldn't upgrade the engines" }, (o) =>
        game.actions.buyRange(planetId, o)
      )
    },
    traverse() {
      return track({ doing: 'Entering the black hole', done: 'Through the black hole', failed: "Couldn't go through" }, (o) =>
        game.actions.traverse(o)
      )
    },
    resolveScans() {
      return track({ doing: 'Recording the long-range scan', done: 'Scan recorded: new stars charted', failed: "Couldn't record the scan" }, (o) =>
        game.actions.resolveScans(o)
      )
    },
    changeCallsign(callsign) {
      return track(
        { doing: `Changing your call sign to ${callsign}`, done: `You're ${callsign} now`, failed: "Couldn't change your call sign" },
        (o) => game.actions.changeCallsign(callsign, o)
      )
    },
    recruit(count) {
      return track({ doing: `Recruiting ${count} colonists`, done: `${count} colonists aboard`, failed: "Couldn't recruit" }, (o) =>
        game.actions.recruit(count, o)
      )
    },
    land(planet, count, name) {
      return track({ doing: `Landing ${count} colonists`, done: `${count} colonists on ${name}`, failed: "Couldn't land them" }, (o) =>
        game.actions.land(planet, count, o)
      )
    },
    board(planet, count) {
      return track({ doing: `Boarding ${count} colonists`, done: `${count} colonists aboard`, failed: "Couldn't board them" }, (o) =>
        game.actions.board(planet, count, o)
      )
    },
    deliver(planet, good, units, name) {
      return track({ doing: `Delivering ${units} ${name}`, done: `${units} ${name} delivered`, failed: "Couldn't deliver" }, (o) =>
        game.actions.deliver(planet, good, units, o)
      )
    },
    collect(planet, good, units, name) {
      return track({ doing: `Collecting ${units} ${name}`, done: `${units} ${name} aboard`, failed: "Couldn't collect" }, (o) =>
        game.actions.collect(planet, good, units, o)
      )
    },
    build(planet, building, name) {
      const what = BUILDING_NAMES[building]
      return track(
        { doing: `Starting a ${what} on ${name}`, done: `${what} under way on ${name}`, failed: `Couldn't start the ${what}` },
        (o) => game.actions.buildStation(planet, building, o)
      )
    },
    order(planet, part, count) {
      const name = this.rules.parts[part].name
      return track({ doing: `Ordering ${count} × ${name}`, done: `${count} × ${name} ordered`, failed: "Couldn't place the order" }, (o) =>
        game.actions.order(planet, part, count, o)
      )
    },
    attack(planet, name) {
      return track({ doing: `Laying siege to ${name}`, done: `Siege of ${name} begun`, failed: "Couldn't attack" }, (o) =>
        game.actions.attack(planet, o)
      )
    },
    joinDefense(planet, name) {
      return track({ doing: `Joining ${name}'s defense`, done: `Defending ${name}`, failed: "Couldn't join the defense" }, (o) =>
        game.actions.joinDefense(planet, o)
      )
    },
    advanceSiege(planet) {
      return track({ doing: 'Recording the rounds', done: 'Rounds recorded', failed: "Couldn't record the rounds" }, (o) =>
        game.actions.advanceSiege(planet, o)
      )
    },
    fileClaim(planet, name) {
      return track({ doing: `Filing a claim on ${name}`, done: 'Claim filed with Minerva', failed: "Couldn't file the claim" }, (o) =>
        game.actions.fileClaim(planet, o)
      )
    },
    completeClaim(planet, name) {
      return track({ doing: `Completing the claim on ${name}`, done: `${name} is yours`, failed: "Couldn't complete the claim" }, (o) =>
        game.actions.completeClaim(planet, o)
      )
    },
    withdraw(planet) {
      return track({ doing: 'Withdrawing', done: 'Withdrawn from the siege', failed: "Couldn't withdraw" }, (o) =>
        game.actions.withdraw(planet, o)
      )
    },
    fitShip(planet, part, count) {
      const name = this.rules.parts[part].name
      return track({ doing: `Fitting ${count} × ${name}`, done: `${count} × ${name} fitted`, failed: "Couldn't fit it" }, (o) =>
        game.actions.fitShip(planet, part, count, o)
      )
    },
    unloadShip(planet, part, count) {
      const name = this.rules.parts[part].name
      return track({ doing: `Unloading ${count} × ${name}`, done: `${count} × ${name} unloaded`, failed: "Couldn't unload it" }, (o) =>
        game.actions.unloadShip(planet, part, count, o)
      )
    },
    fitPlanet(planet, part, count) {
      const name = this.rules.parts[part].name
      return track({ doing: `Installing ${count} × ${name}`, done: `${count} × ${name} installed`, failed: "Couldn't install it" }, (o) =>
        game.actions.fitPlanet(planet, part, count, o)
      )
    },
    buyParts(port, part, count) {
      const name = this.rules.parts[part].name
      return track({ doing: `Buying ${count} × ${name}`, done: `${count} × ${name} fitted`, failed: "Couldn't buy it" }, (o) =>
        game.actions.buyParts(port, part, count, o)
      )
    },
    repair(port) {
      return track({ doing: 'Booking repairs', done: 'Repaired: in the yard for a while', failed: "Couldn't repair" }, (o) =>
        game.actions.repair(port, o)
      )
    }
  }
})
