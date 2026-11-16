// The shell: top bar, dock, the working sheet, the filing ticker, the Minerva drawer; and the
// first-launch screens. Keyboard and gamepad are wired here.
import { useEffect, useLayoutEffect, useState } from 'preact/hooks'
import { usedBays } from '@orbiter8/sdk/client'
import { game, ui, set, useStore, commit, dismiss } from '../store'
import { cr, nameProblem } from '../format'
import { ship, shipCell, worlds } from '../helpers'
import { nextOrder } from '../logic/orders'
import { Commit } from './parts'
import { SystemPanel } from './System'
import { GalaxyPanel } from './Galaxy'
import { Market } from './Market'
import { Ship } from './Ship'
import { Domain, agenda } from './Domain'
import { Minerva } from './Minerva'

const TABS = [
  ['system', 'System', 'M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M3 12a9 4.5 0 1 0 18 0a9 4.5 0 1 0 -18 0'],
  ['galaxy', 'Galaxy', 'M12 3l7.8 4.5v9L12 21l-7.8-4.5v-9zM12 9.5v5M9.8 11l4.4 2M14.2 11l-4.4 2'],
  ['market', 'Market', 'M4 8h13l-3-3M20 16H7l3 3'],
  ['ship', 'Ship', 'M12 3l6 17-6-4-6 4z'],
  ['domain', 'Domain', 'M6 21V4M6 5h11l-2.5 3.5L17 12H6']
]

export function go(tab) {
  const working = tab === 'market' || tab === 'ship' || tab === 'domain'
  set({ tab, open: working || (tab === 'system' ? Boolean(ui.sel) : ui.gsel !== null), full: false, domainSel: tab === 'domain' ? ui.domainSel : null })
}

function TopBar() {
  const s = game.state
  const sh = ship()
  const flying = ui.filings.filter((f) => f.status === 'signing' || f.status === 'sent').length
  return (
    <header class="top">
      <button class="where" onClick={() => go('system')}>
        <span class="label">{s.pilot ? s.pilot.callsign : 'Orbiter 8'}</span>
        <b>{s.system?.starName ?? '…'}</b>
      </button>
      {sh && (
        <>
          <button class="stat" onClick={() => go('market')}>
            <span class="label">Credits</span>
            <b class="num">{cr(s.credits, true)}</b>
          </button>
          <button class="stat" onClick={() => go('ship')}>
            <span class="label">Bays</span>
            <b class="num">{usedBays(sh)}<span class="dim">/{sh.bays}</span></b>
          </button>
        </>
      )}
      <button class={`minerva${flying ? ' flying' : ''}`} aria-label="Minerva" onClick={() => set({ drawer: ui.drawer ? null : 'filings' })}>
        <svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 2.5l8.2 4.75v9.5L12 21.5l-8.2-4.75v-9.5z" fill="none" stroke="currentColor" stroke-width="1.5" /><circle cx="12" cy="12" r="2.4" fill="currentColor" /></svg>
        {flying > 0 && <b>{flying}</b>}
      </button>
    </header>
  )
}

function Dock({ due, hint }) {
  return (
    <nav class="dock">
      {TABS.map(([id, label, path]) => (
        <button key={id} class={ui.tab === id ? 'on' : ''} aria-current={ui.tab === id} onClick={() => go(id)}>
          <svg viewBox="0 0 24 24" width="22" height="22"><path d={path} fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" /></svg>
          <span>{label}</span>
          {id === 'domain' && due > 0 && <b class="badge">{due}</b>}
          {id === hint && ui.tab !== id && <b class="badge dot" />}
        </button>
      ))}
    </nav>
  )
}

function Ticker() {
  const f = ui.filings.find((x) => !x.quiet && !x.seen)
  if (!f) return null
  const flying = f.status === 'signing' || f.status === 'sent'
  const failed = f.status === 'refused' || f.status === 'declined'
  if (!flying && !failed && ui.now - (f.done ?? 0) > 2500) return null
  return (
    <div class={`ticker ${f.status}`} role="status">
      <i class="pip" />
      <span class="grow" onClick={() => set({ drawer: 'filings' })}>
        <b>{f.label}</b>
        <span class="sub">{failed ? f.error : f.status === 'signing' ? 'approve in your wallet' : f.status === 'sent' ? 'sent to Minerva…' : 'stamped'}</span>
      </span>
      {!flying && <button class="ghost x" aria-label="Dismiss" onClick={() => dismiss(f.id)}>×</button>}
    </div>
  )
}

function Register() {
  const [callsign, setCallsign] = useState('')
  const [shipName, setShipName] = useState('')
  const [taken, setTaken] = useState(null)
  useEffect(() => {
    game.listCallsigns().then(setTaken, () => {})
  }, [])
  const pending = game.pendingRegistration()
  const callProblem = callsign ? (nameProblem(callsign) ?? (taken?.has(callsign.toLowerCase()) ? 'That call sign is taken.' : null)) : null
  const shipProblem = shipName ? nameProblem(shipName) : null
  if (pending)
    return (
      <div class="card">
        <h1>Registering…</h1>
        <p class="lede">Your registration for <b>{pending.name}</b> is on its way to Minerva. This screen will change by itself.</p>
      </div>
    )
  return (
    <div class="card">
      <span class="label">Minerva Galactic Network · Sol · 2140</span>
      <h1>Register a pilot</h1>
      <p class="lede">One pilot, one Orbiter 8. You start at Sol with 1,000 credits and five bays; the galaxy past it is uncharted until someone goes.</p>
      <label>
        <span class="label">Call sign</span>
        <input type="text" name="callsign" maxLength={24} autoComplete="off" placeholder="How other pilots know you" value={callsign} onInput={(e) => setCallsign(e.currentTarget.value)} />
        {callProblem && <span class="bad small">{callProblem}</span>}
      </label>
      <label>
        <span class="label">Ship's name</span>
        <input type="text" name="ship" maxLength={24} autoComplete="off" placeholder="Painted on the hull" value={shipName} onInput={(e) => setShipName(e.currentTarget.value)} />
        {shipProblem && <span class="bad small">{shipProblem}</span>}
      </label>
      <Commit primary label="Register with Minerva" sub="one filing · free" why={callProblem ?? shipProblem} disabled={!callsign || !shipName} run={() => commit(`Register ${callsign}`, async (o) => {
        await game.actions.createAvatar(callsign.trim())
        return game.actions.launchShip(shipName.trim(), o)
      })} />
    </div>
  )
}

function Gate({ enter }) {
  if (ui.phase === 'boot') return <div class="card center"><h1>Orbiter 8</h1><p class="lede">Raising Minerva…</p></div>
  if (ui.phase === 'wrongNetwork')
    return <div class="card"><h1>Wrong network</h1><p class="lede">Orbiter 8 isn't deployed on the network your wallet is on. Switch to Polkadot Hub TestNet (or the local chain) and reload.</p></div>
  return (
    <div class="card">
      <span class="label">Minerva Galactic Network</span>
      <h1>Orbiter 8</h1>
      <p class="lede">Explore a galaxy that exists only where pilots have been. Trade, claim worlds, build them up, defend them.</p>
      {ui.error && <p class="bad">{ui.error}</p>}
      {ui.wallets.map((w) => (
        <button key={w.info.uuid} class="ghost wide" onClick={() => enter(w)}>Connect {w.info.name}</button>
      ))}
      {!ui.wallets.length && <p class="hint">No wallet found. Inside the Polkadot App your account is already here; in a browser, install a wallet and reload.</p>}
    </div>
  )
}

/** Tells the stage which part of the canvas is free of bars and sheets. */
function useFreeArea(stage) {
  useLayoutEffect(() => {
    const measure = () => {
      const top = document.querySelector('.top')?.getBoundingClientRect().bottom ?? 0
      const dock = document.querySelector('.dock')?.getBoundingClientRect()
      const sheet = document.querySelector('.sheet')?.getBoundingClientRect()
      const wide = innerWidth >= 900
      if (wide) {
        const left = dock?.right ?? 0
        stage.setFree({ x: left, y: top, w: (sheet?.left ?? innerWidth) - left, h: innerHeight - top })
      } else {
        const bottom = Math.max(top + 120, sheet?.top ?? dock?.top ?? innerHeight)
        stage.setFree({ x: 0, y: top, w: innerWidth, h: bottom - top })
      }
    }
    measure()
    const timer = setTimeout(measure, 260)
    addEventListener('resize', measure)
    return () => (clearTimeout(timer), removeEventListener('resize', measure))
  })
}

/** Steps the selection to the next or previous world (system) or star (galaxy). */
function step(stage, by) {
  if (ui.tab === 'galaxy') {
    const stars = stage.starsNear(shipCell())
    const i = stars.indexOf(ui.gsel)
    const next = stars[(i + by + stars.length) % stars.length]
    set({ gsel: next, open: true })
    stage.centerOn(next)
  } else {
    const list = [{ type: 'star', id: game.state.system?.id }, ...worlds().map((p) => ({ type: 'planet', id: Number(p.id) }))]
    const i = list.findIndex((x) => x.type === ui.sel?.type && x.id === Number(ui.sel?.id))
    set({ tab: 'system', sel: list[(i + by + list.length) % list.length], open: true })
  }
}
function back() {
  if (ui.drawer) return set({ drawer: null })
  if (ui.tab === 'domain' && ui.domainSel != null) return set({ domainSel: null })
  if (ui.tab === 'galaxy' && ui.gsel !== null) return set({ gsel: null, course: null, open: false })
  if (ui.tab === 'system' && ui.sel) return set({ sel: null, open: false })
  go('system')
}
const primary = () => document.querySelector('.sheet [data-primary]:not([disabled]), .card [data-primary]:not([disabled])')?.click()

function useControls(stage) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return
      const n = Number(e.key)
      if (n >= 1 && n <= 5 && game.state.pilot) return go(TABS[n - 1][0])
      const pan = { ArrowLeft: [60, 0], ArrowRight: [-60, 0], ArrowUp: [0, 60], ArrowDown: [0, -60] }[e.key]
      if (pan) return stage.panBy(...pan)
      switch (e.key) {
        case 'm': case 'M': return set({ drawer: ui.drawer ? null : 'filings' })
        case '+': case '=': return stage.zoomBy(1.25)
        case '-': case '_': return stage.zoomBy(0.8)
        case '[': return step(stage, -1)
        case ']': return step(stage, 1)
        case 'Escape': return back()
        case 'Enter': return primary()
      }
    }
    addEventListener('keydown', onKey)
    // the gamepad: polled, with edges on the buttons
    let held = []
    let raf = 0
    const poll = () => {
      raf = requestAnimationFrame(poll)
      const pad = [...(navigator.getGamepads?.() ?? [])].find(Boolean)
      if (!pad) return
      const down = pad.buttons.map((b) => b.pressed)
      const hit = (i) => down[i] && !held[i]
      const order = TABS.map((t) => t[0])
      if (game.state.pilot) {
        if (hit(4)) go(order[(order.indexOf(ui.tab) + order.length - 1) % order.length])
        if (hit(5)) go(order[(order.indexOf(ui.tab) + 1) % order.length])
        if (hit(14) || hit(12)) step(stage, -1)
        if (hit(15) || hit(13)) step(stage, 1)
      }
      if (hit(0)) primary()
      if (hit(1)) back()
      if (hit(3)) set({ drawer: ui.drawer ? null : 'filings' })
      const [x, y] = [pad.axes[2] ?? 0, pad.axes[3] ?? 0]
      if (Math.abs(x) > 0.2 || Math.abs(y) > 0.2) stage.panBy(-x * 9, -y * 9)
      const zoom = (pad.buttons[7]?.value ?? 0) - (pad.buttons[6]?.value ?? 0)
      if (Math.abs(zoom) > 0.1) stage.zoomBy(1 + zoom * 0.03)
      held = down
    }
    raf = requestAnimationFrame(poll)
    return () => (removeEventListener('keydown', onKey), cancelAnimationFrame(raf))
  }, [])
}

export function App({ stage, enter }) {
  useStore()
  useFreeArea(stage)
  useControls(stage)
  const s = game.state
  if (ui.phase !== 'play') return <div class="gate"><Gate enter={enter} /></div>
  if (!s.pilot)
    return (
      <>
        <TopBar />
        <Ticker />
        <div class="gate over"><Register /></div>
      </>
    )
  const due = agenda().filter((i) => i.at <= ui.now).length
  const order = nextOrder({ pilot: s.pilot, credits: s.credits, deeds: s.deeds, traded: ui.traded, holdings: ui.holdings, rangePrice: game.rangeQuote() })
  const size = ui.full ? 'full' : ui.open ? 'half' : 'slim'
  return (
    <>
      <TopBar />
      <Ticker />
      <section class={`sheet ${size} tab-${ui.tab}`}>
        <button class="handle" aria-label="Resize the panel" onClick={() => (ui.full ? set({ full: false, open: false }) : ui.open ? set({ full: true }) : set({ open: true }))}><i /></button>
        <div class="sheet-scroll" key={ui.tab}>
          {ui.tab === 'system' ? <SystemPanel /> : ui.tab === 'galaxy' ? <GalaxyPanel stage={stage} /> : ui.tab === 'market' ? <Market /> : ui.tab === 'ship' ? <Ship /> : <Domain />}
        </div>
      </section>
      <Dock due={due} hint={order?.tab} />
      {ui.drawer && <Minerva />}
    </>
  )
}
