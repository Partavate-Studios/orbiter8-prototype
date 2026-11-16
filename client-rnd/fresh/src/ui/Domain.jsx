// The Domain: what's next (orders), what's coming due (the agenda), and everything the pilot owns,
// wherever it is. Buildings, factory orders and defenses can be worked from here, from anywhere.
import { game, ui, commit, set, planetModel } from '../store'
import { buildAgenda, liveAgenda } from '../logic/agenda'
import { nextOrder } from '../logic/orders'
import { num } from '../format'
import { LEVELS, BUILDINGS, shipCell, worlds } from '../helpers'
import { Section, Tag, Timer, Commit, Bar } from './parts'
import { PlanetSheet } from './Planet'
import { PLANET_COLORS } from '../palette'

export function agenda() {
  const s = game.state
  if (!s.pilot) return []
  const cell = s.cells.get(shipCell())
  const items = buildAgenda({
    account: s.account,
    // a scan waits on a real-world beacon round: put it on the chain's clock with the rest
    scan: s.scan && { ...s.scan, readyAt: s.scan.readyAt + ui.skew },
    holdings: ui.holdings,
    sieges: s.sieges,
    condition: s.condition,
    session: s.session,
    here: cell && shipCell() !== 0 ? { cell: cell.cell, discoverer: cell.discoverer, discoveredAt: cell.discoveredAt, unclaimed: worlds().filter((p) => !p.owner).length } : null,
    starName: game.starName,
    planetName: (id) => planetModel(id)?.name ?? game.derivedPlanetName(id),
    partNames: s.rules.parts.map((p) => p.name),
    now: ui.now
  })
  return liveAgenda(items, ui.now)
}

const KIND = { scan: 'violet', build: 'amber', order: 'amber', siege: 'red', claim: 'red', yard: 'cyan', session: 'cyan', first: 'violet' }

export function Agenda({ items }) {
  if (!items.length) return <p class="empty">Nothing is running. Buildings, factory orders, scans, sieges and claims will line up here by when they come due.</p>
  return (
    <ul class="agenda">
      {items.map((item) => (
        <li key={item.id} class={item.at <= ui.now ? 'due' : ''} onClick={() => item.planet !== undefined && set({ tab: 'domain', domainSel: item.planet, open: true, drawer: null })}>
          <i class={`pip ${KIND[item.kind]}`} />
          <span class="grow">
            <b>{item.title}</b>
            <span class="dim"> · {item.where}</span>
          </span>
          <Timer at={item.at} done={item.kind === 'scan' ? 'filing…' : 'due'} />
        </li>
      ))}
    </ul>
  )
}

export function Domain() {
  const s = game.state
  if (ui.domainSel !== undefined && ui.domainSel !== null && planetModel(ui.domainSel)) return <PlanetSheet id={ui.domainSel} onBack={() => set({ domainSel: null })} />
  const order = nextOrder({ pilot: s.pilot, credits: s.credits, deeds: s.deeds, traded: ui.traded, holdings: ui.holdings, rangePrice: game.rangeQuote() })
  const items = agenda()
  return (
    <div class="panel-body">
      <h2>Domain</h2>
      {order && (
        <button class="order" onClick={() => set({ tab: order.tab, open: true })}>
          <span class="label">Orders</span>
          <b>{order.title}</b>
          <span>{order.hint}</span>
        </button>
      )}
      <Section title="Agenda" aside={items.length || null}>
        <Agenda items={items} />
        {ui.scanReady && <Commit small label="File the scan" run={() => commit('Scan recorded', (o) => game.actions.resolveScans(o), { scan: true })} />}
      </Section>
      <Section title="Planets" aside={`${ui.holdings.length}`}>
        {!ui.holdings.length && <p class="empty">You hold no planets yet. Any unclaimed world outside Sol can be claimed for {num(s.rules.claimFee)} credits with your ship at its star.</p>}
        {ui.holdings.map((p) => (
          <button class="holding" key={p.id} onClick={() => set({ domainSel: p.id })}>
            <i class="orb" style={{ background: PLANET_COLORS[p.class] }} />
            <span class="grow">
              <b>{p.name}</b>
              <span class="dim"> · {game.starName(p.cell)}{p.cell === shipCell() ? ' (here)' : ''}</span>
              <span class="sub">
                {LEVELS[p.level]}
                {p.autofactory ? ' + Autofactory' : ''} · <span class="num">{num(p.population)}/{num(p.cap)}</span> people
              </span>
              <Bar total={p.cap} parts={[{ value: p.population, tone: 'green' }]} />
            </span>
            <span class="marks">
              {p.siege && <Tag tone="bad">siege</Tag>}
              {p.building ? <Tag tone="warn">{BUILDINGS[p.building]} <Timer at={p.readyAt * 1000} /></Tag> : null}
            </span>
          </button>
        ))}
      </Section>
    </div>
  )
}
