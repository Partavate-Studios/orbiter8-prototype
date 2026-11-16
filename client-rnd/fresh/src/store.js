// The client's one store: the interface's own state, the filings (moves on their way to the chain),
// and the reads the SDK's game client doesn't make (the pilot's planets at other stars; other
// pilots' defenses). The SDK's `game` stays the source of truth for the game itself; components
// read `game.state` directly and re-render when this store says something changed.
import { useEffect, useReducer } from 'preact/hooks'
import { game } from '@orbiter8/sdk/client'
import { createGame } from '@orbiter8/sdk/contracts'
import { networkFor } from '@orbiter8/sdk/chain/networks'
import { getSession, walletErrorKind } from '@orbiter8/sdk/chain/wallet'
import { looks } from '@orbiter8/sdk/system-gen'
import { cue } from './sound'
import { roundFell } from './logic/agenda'

export const ui = {
  /** boot | connect | wrongNetwork | play (registration is `play` with no pilot) */
  phase: 'boot',
  wallets: [],
  devWallet: false,
  error: null,
  tab: 'system',
  /** whether the working sheet is open (phones; the desktop panel is always there) */
  open: false,
  /** the selection in the system: { type: 'planet' | 'star', id } */
  sel: null,
  /** the star selected on the galaxy chart, and the course to it */
  gsel: null,
  drawer: null,
  filings: [],
  /** planets the pilot owns, anywhere */
  holdings: [],
  /** other pilots' defenses, by planet, read when one is selected */
  scouted: {},
  /** other pilots' Armory stores, by planet, read when their desk is open */
  stores: {},
  /** a jump on its way: { from, to, at } */
  jump: null,
  scanReady: false,
  traded: false,
  sound: false,
  /** the chain's clock, in ms: what every game timer is measured against (see syncClock) */
  now: Date.now(),
  /** how far the chain's clock is ahead of this device's, in ms */
  skew: 0
}

const listeners = new Set()
let queued = false
/** Tells every subscriber the store changed (once per frame at most). */
export function bump() {
  if (queued) return
  queued = true
  queueMicrotask(() => {
    queued = false
    listeners.forEach((listener) => listener())
  })
}
export const subscribe = (listener) => (listeners.add(listener), () => listeners.delete(listener))
/** Re-renders the calling component whenever the store or the game changes. */
export function useStore() {
  const [, force] = useReducer((n) => n + 1, 0)
  useEffect(() => subscribe(force), [])
  return ui
}
export function set(patch) {
  Object.assign(ui, patch)
  bump()
}

// ── filings: a move's life from the button to the block ─────────────────────────────────────────

let filingId = 0
/**
 * Files a move: `run` gets the SDK's options ({ onSent }) and returns the action's promise.
 * Resolves true once it's mined, false if it was declined or refused (the filing says why).
 */
export async function commit(label, run, { quiet = false, jump = null, scan = false } = {}) {
  const filing = { id: ++filingId, label, status: 'signing', at: Date.now(), quiet, scan }
  ui.filings = [filing, ...ui.filings].slice(0, 40)
  bump()
  try {
    const receipt = await run({
      onSent: (hash) => {
        Object.assign(filing, { status: 'sent', hash })
        if (jump) ui.jump = { ...jump, at: performance.now() }
        if (!quiet) cue('sent')
        bump()
      }
    })
    Object.assign(filing, { status: 'stamped', block: receipt?.blockNumber ?? null, done: Date.now() })
    if (!quiet) cue('stamped')
    refreshHoldings()
    return true
  } catch (error) {
    const declined = walletErrorKind(error) === 'rejected'
    Object.assign(filing, {
      status: declined ? 'declined' : 'refused',
      error: declined ? 'Not approved in the wallet.' : (error.shortMessage ?? error.reason ?? error.message ?? 'It failed.'),
      done: Date.now()
    })
    if (!quiet) cue('refused')
    console.warn(label, error)
    return false
  } finally {
    if (jump) ui.jump = null
    bump()
  }
}
export const busy = () => ui.filings.some((f) => f.status === 'signing' || f.status === 'sent')
export function dismiss(id) {
  ui.filings = ui.filings.map((f) => (f.id === id ? { ...f, seen: true } : f))
  bump()
}

// ── reads beside the game client's ──────────────────────────────────────────────────────────────

let reader = null
function getReader() {
  if (!reader) reader = createGame(getSession().provider, networkFor(game.state.chainId).contracts)
  return reader
}

let holdingsAt = 0
let holdingsRun = null
let holdingsAgain = false
/**
 * Reads every planet the pilot owns, wherever it is: its state, defenses, factory and any siege.
 * A call while a read is running queues one more read after it, so a move stamped mid-read is seen.
 */
export function refreshHoldings() {
  const s = game.state
  if (!s.pilot || !s.economy) return
  if (holdingsRun) {
    holdingsAgain = true
    return holdingsRun
  }
  holdingsAt = Date.now()
  holdingsRun = (async () => {
    const r = getReader()
    const ids = s.deeds ? await r.ownedPlanets(s.account) : []
    const goods = s.economy.goods.length
    const list = await Promise.all(
      ids.map(async (id) => {
        const cell = Math.floor(id / 65536) // BodyId: cell << 16 | kind << 8 | index
        const [view, defenses, names, sieges] = await Promise.all([
          r.planetView(id, goods),
          r.defenses(id),
          r.namesOf(id),
          r.siegesAt(cell)
        ])
        const factory = view.autofactory || view.building === 7 ? await r.factoryAt(id) : null
        return { ...view, cell, name: names.planet || game.derivedPlanetName(id), names, defenses, factory, siege: sieges.find((x) => x.planet === id) ?? null }
      })
    )
    ui.holdings = list.sort((a, b) => a.id - b.id)
    bump()
  })()
    .catch((error) => console.warn('Reading holdings failed:', error))
    .finally(() => {
      holdingsRun = null
      if (holdingsAgain) {
        holdingsAgain = false
        refreshHoldings()
      }
    })
  return holdingsRun
}

/** Reads another pilot's planet's defenses (to weigh a siege before starting one). */
export async function scout(id) {
  try {
    ui.scouted = { ...ui.scouted, [id]: await getReader().defenses(id) }
    bump()
  } catch (error) {
    console.warn('Scouting failed:', error)
  }
}

/** Reads another pilot's Armory store (what it can sell): the game client loads only the pilot's own. */
export async function scoutStore(id) {
  try {
    ui.stores = { ...ui.stores, [id]: (await getReader().factoryAt(id)).stored }
    bump()
  } catch (error) {
    console.warn('Reading the armory failed:', error)
  }
}

/**
 * A planet as the sheets read it, from the current system or from the holdings: the contracts'
 * view plus its name, where it is, whose it is, and what the client knows around it.
 */
export function planetModel(id) {
  const s = game.state
  id = Number(id)
  const cell = Math.floor(id / 65536) // BodyId: cell << 16 | kind << 8 | index
  const body = id % 256
  const held = ui.holdings.find((p) => p.id === id)
  const here = s.system?.id === cell ? Object.values(s.system.planets).find((p) => Number(p.id) === id) : null
  if (!here && !held) return null
  const info = here?.info ?? held
  const mine = info.owner === s.account
  const moons = looks(s.universe.seed, cell, body).moons.map((m) => ({
    orbit: m.orbit,
    name: here?.moons[m.orbit]?.name ?? held?.names.moons[m.orbit] ?? m.name ?? `Moon ${m.orbit + 1}`
  }))
  return {
    ...info,
    id,
    cell,
    body,
    name: here?.name ?? held.name,
    here: Boolean(here) && Boolean(s.pilot) && s.pilot.ship.cell === cell,
    mine,
    federation: cell === 0,
    ownerName: cell === 0 ? 'The Federation' : info.owner ? (mine ? 'You' : s.callsigns[info.owner] || 'Another pilot') : null,
    station: here?.hasStation ? here.station : null,
    port: s.system?.id === cell ? (s.ports.find((p) => p.port === id) ?? null) : null,
    moons,
    defenses: mine ? (held?.defenses ?? info.defenses) : (ui.scouted[id] ?? null),
    factory: held?.factory ?? s.factories[id] ?? null,
    siege: info.siege ?? held?.siege ?? null
  }
}

// ── wiring ──────────────────────────────────────────────────────────────────────────────────────

let lastDeeds = null
game.subscribe((change) => {
  const s = game.state
  if (change === 'scanDue') {
    // File it without asking when no wallet prompt would appear; otherwise offer it once.
    // The SDK can announce the same scan again while the first filing is in flight (it re-plans on
    // every refresh): one filing at a time, or the second one only burns gas.
    const filing = ui.filings.some((f) => f.scan && (f.status === 'signing' || f.status === 'sent'))
    if (filing) return bump()
    if (ui.devWallet || game.sessionLive()) commit('Scan recorded', (o) => game.actions.resolveScans(o), { quiet: true, scan: true })
    else ui.scanReady = true
  }
  if (change === 'scan' && !s.scan) ui.scanReady = false
  if (change === 'pilot' && s.pilot && s.deeds !== lastDeeds) {
    lastDeeds = s.deeds
    refreshHoldings()
  }
  if (change === 'system' && s.pilot && Date.now() - holdingsAt > 8000) refreshHoldings()
  if (change === 'block') syncClock()
  if (change?.error) console.warn('Reading the', change.what, 'failed:', change.error)
  bump()
})

/** Buildings and factory orders finish with no transaction, so no block announces them: re-read when one's time is up. */
function timersPassed(before, now) {
  const passed = (at) => at * 1000 > before && at * 1000 <= now
  const sieges = [...game.state.sieges, ...ui.holdings.map((p) => p.siege).filter(Boolean)]
  return (
    ui.holdings.some((p) => (p.building && passed(p.readyAt)) || (p.factory?.queue ?? []).some((o) => passed(o.readyAt))) ||
    // a siege round fell (the views play it) or a claim's wait ran out
    sieges.some((x) => roundFell(x.checkpoint, before, now) || (x.claimAt && passed(x.claimAt)))
  )
}
/**
 * Game timers (buildings, siege rounds, claims) run on block timestamps, which can sit well off the
 * device's clock (Polkadot Hub's step in 24 s; a test chain can be warped). Read now and then.
 */
let clockAt = 0
async function syncClock() {
  if (Date.now() - clockAt < 20_000) return
  clockAt = Date.now()
  try {
    const block = await getSession().provider.getBlock('latest')
    const skew = block.timestamp * 1000 - Date.now()
    // within a few seconds it's only block spacing: leave the device's clock alone
    ui.skew = Math.abs(skew) > 5000 ? skew : 0
  } catch {
    // keep the last reading
  }
}
setInterval(() => {
  const before = ui.now
  ui.now = Date.now() + ui.skew
  if (timersPassed(before, ui.now)) {
    // a moment later, so the chain's clock has passed it too
    setTimeout(() => (refreshHoldings(), game.refreshSystem()), 1500)
  }
  bump()
}, 1000)

export { game }
