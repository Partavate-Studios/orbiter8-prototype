// The Market: one board for the whole star. Routes (what pays, right here, for this ship), Cargo
// (the best port for what's aboard) and Ports (the manual desk: one ticket at one port).
import { useState } from 'preact/hooks'
import { MODE } from '@orbiter8/sdk/market'
import { game, ui, commit, set } from '../store'
import { planRoutes, sellOffers, buyTotal, sellTotal } from '../logic/routes'
import { cr, num, signed } from '../format'
import { freeBays, goodName, portName, worldOf, ship } from '../helpers'
import { Commit, Qty, Section, Tabs, Tag } from './parts'
import { PLANET_COLORS } from '../palette'

const Dot = ({ port }) => <i class="dot" style={{ background: PLANET_COLORS[worldOf(port)?.class] ?? '#888' }} />

async function runRoute(route) {
  const name = goodName(route.good)
  const bought = await commit(`Buy ${route.units} ${name} · ${portName(route.from)}`, (o) =>
    game.actions.trade(route.from, [{ good: route.good, units: route.units }], o)
  )
  if (!bought) return false
  set({ traded: true })
  return commit(`Sell ${route.units} ${name} · ${portName(route.to)}`, (o) =>
    game.actions.trade(route.to, [{ good: route.good, units: -route.units }], o)
  )
}

function Routes() {
  const s = game.state
  const free = freeBays()
  const all = planRoutes({ ports: s.ports, economy: s.economy, freeBays: free, credits: s.credits })
  // the best pair for each good; the rest are the same goods at worse ports
  const routes = all.filter((r, i) => all.findIndex((x) => x.good === r.good) === i).slice(0, 8)
  if (!free) return <p class="empty">No free bays. Sell what's aboard (Cargo), or fit more bays at a shipyard.</p>
  if (!routes.length) return <p class="empty">Nothing here pays right now: the ports have been worked. Stock returns over about two hours.</p>
  return (
    <div class="routes">
      {routes.map((r) => (
        <div class="route" key={`${r.good}-${r.from}-${r.to}`}>
          <div class="route-main">
            <b>{goodName(r.good)}</b>
            <span class="leg">
              <Dot port={r.from} />
              {portName(r.from)} <span class="arrow">→</span> <Dot port={r.to} />
              {portName(r.to)}
            </span>
            <span class="route-fig num">
              {r.units} × <span class="gain">{signed(Math.round(r.profit / r.units))}</span> · pay {cr(r.cost)}
            </span>
          </div>
          <Commit small label={`Run  ${signed(r.profit)}`} sub="buy, then sell" run={() => runRoute(r)} />
        </div>
      ))}
      <p class="hint">Sized to your {free} free {free === 1 ? 'bay' : 'bays'} and {cr(s.credits)} credits. Every unit moves the price, so bigger loads earn less each.</p>
    </div>
  )
}

function Cargo() {
  const s = game.state
  const offers = sellOffers({ ports: s.ports, economy: s.economy, cargo: s.cargo })
  if (!offers.length) return <p class="empty">The bays are empty{ship().colonists ? ' of goods' : ''}.</p>
  const sellable = offers.filter((o) => o.port !== null)
  const byPort = new Map()
  for (const o of sellable) byPort.set(o.port, [...(byPort.get(o.port) ?? []), o])
  const sellAll = async () => {
    for (const [port, lines] of byPort) {
      const ok = await commit(`Sell ${lines.map((l) => `${l.units} ${goodName(l.good)}`).join(', ')} · ${portName(port)}`, (o) =>
        game.actions.trade(port, lines.map((l) => ({ good: l.good, units: -l.units })), o)
      )
      if (!ok) return false
    }
    return true
  }
  return (
    <div class="routes">
      {offers.map((o) => (
        <div class="route" key={o.good}>
          <div class="route-main">
            <b>
              {num(s.cargo[o.good])} {goodName(o.good)}
            </b>
            {o.port !== null ? (
              <span class="leg">
                best at <Dot port={o.port} />
                {portName(o.port, true)}
              </span>
            ) : (
              <span class="leg dim">no port here buys it</span>
            )}
          </div>
          {o.port !== null && (
            <Commit small label={`Sell ${o.units}`} sub={`+${cr(o.proceeds)}`} run={() => commit(`Sell ${o.units} ${goodName(o.good)} · ${portName(o.port)}`, (opt) => game.actions.trade(o.port, [{ good: o.good, units: -o.units }], opt))} />
          )}
        </div>
      ))}
      {sellable.length > 1 && <Commit label="Sell everything at its best port" sub={`+${cr(sellable.reduce((a, o) => a + o.proceeds, 0))} · ${byPort.size} ${byPort.size === 1 ? 'filing' : 'filings'}`} run={sellAll} />}
    </div>
  )
}

function Desk() {
  const s = game.state
  const [portId, setPort] = useState(ui.deskPort ?? s.ports[0]?.port)
  const [amounts, setAmounts] = useState({})
  const port = s.ports.find((p) => p.port === portId) ?? s.ports[0]
  const { goods, capacity } = s.economy
  const { feeBps } = s.economy.tuning
  const lines = port.quotes.map((q, id) => ({ q, id })).filter(({ q }) => q.mode !== MODE.NONE)
  const pick = (id) => {
    setPort(id)
    setAmounts({})
    ui.deskPort = id
  }
  const selling = lines.filter(({ q }) => q.mode === MODE.BUYS).reduce((a, { id }) => a + (amounts[id] ?? 0), 0)
  const buying = lines.filter(({ q }) => q.mode === MODE.SELLS).reduce((a, { id }) => a + (amounts[id] ?? 0), 0)
  let net = 0
  const ticket = []
  for (const { q, id } of lines) {
    const units = amounts[id] ?? 0
    if (!units) continue
    if (q.mode === MODE.SELLS) net -= buyTotal(goods[id], capacity, q.shortfall, units, feeBps)
    else net += sellTotal(goods[id], capacity, q.shortfall, units, feeBps)
    ticket.push({ good: id, units: q.mode === MODE.SELLS ? units : -units })
  }
  const room = freeBays() + selling
  const why = !ticket.length ? 'Set a quantity' : buying > room ? `Only ${room} free bays` : s.credits + net < 0 ? 'Not enough credits' : null
  return (
    <div>
      <div class="chips scroll">
        {s.ports.map((p) => (
          <button key={p.port} class={`chip${p.port === port.port ? ' on' : ''}`} onClick={() => pick(p.port)}>
            <Dot port={p.port} />
            {portName(p.port)}
            {p.owner === s.account && <Tag tone="mine">yours</Tag>}
          </button>
        ))}
      </div>
      <p class="hint">
        {worldOf(port.port)?.name}
        {port.owner ? ` · its owner takes the ${feeBps / 100}% fee` : ` · Federation port, ${feeBps / 100}% fee`}
      </p>
      <table class="desk">
        <thead>
          <tr>
            <th>Good</th>
            <th class="r">Price</th>
            <th class="r">Port</th>
            <th class="r">Aboard</th>
          </tr>
        </thead>
        <tbody>
          {lines.map(({ q, id }) => {
            const sells = q.mode === MODE.SELLS
            const stock = Math.max(0, capacity - q.shortfall)
            const aboard = s.cargo[id] ?? 0
            const units = amounts[id] ?? 0
            const max = sells ? Math.min(stock, room - (buying - units)) : Math.min(aboard, stock)
            return [
              <tr key={id} class={units ? 'active' : ''}>
                <td>
                  <b>{goods[id].name}</b>
                  <Tag tone={sells ? 'buy' : 'sell'}>{sells ? 'sells' : 'buys'}</Tag>
                </td>
                <td class="r num">{cr(q.price)}</td>
                <td class="r num dim">{sells ? `${num(stock)} left` : `takes ${num(stock)}`}</td>
                <td class="r num">{aboard || '·'}</td>
              </tr>,
              max > 0 || units > 0 ? <tr key={`${id}q`} class="qrow">
                <td colSpan="4">
                  <span class="label">{sells ? 'Buy' : 'Sell'}</span>
                  <Qty value={units} max={Math.max(0, max)} onChange={(v) => setAmounts({ ...amounts, [id]: v })} />
                </td>
              </tr> : null
            ]
          })}
        </tbody>
      </table>
      <Commit
        primary
        label={ticket.length ? `File ticket  ${signed(net)} credits` : 'File ticket'}
        sub={ticket.length ? `${buying ? `buy ${buying}` : ''}${buying && selling ? ' · ' : ''}${selling ? `sell ${selling}` : ''} · prices held within 2%` : null}
        why={why}
        run={async () => {
          // cleared as it's filed, so the next ticket can be written while this one is in flight
          const filed = amounts
          setAmounts({})
          const ok = await commit(`Trade at ${portName(port.port)}  ${signed(net)}`, (o) => game.actions.trade(port.port, ticket, o))
          if (ok) set({ traded: true })
          else setAmounts((now) => (Object.keys(now).length ? now : filed))
        }}
      />
    </div>
  )
}

export function Market() {
  const s = game.state
  const [mode, setMode] = useState('routes')
  const aboard = s.cargo.reduce((a, b) => a + b, 0)
  if (!s.ports.length)
    return (
      <div class="panel-body">
        <h2>Market</h2>
        <p class="empty">No port trades at {s.system?.starName ?? 'this star'}. Sol's nine Federation stations always do; a planet with a Port building opens one of its own.</p>
      </div>
    )
  return (
    <div class="panel-body">
      <h2>
        Market <span class="dim">· {s.system?.starName}</span>
      </h2>
      <p class="lede">Every port at this star is in reach at once. {s.ports.length} trading.</p>
      <Tabs value={mode} onChange={setMode} options={[['routes', 'Routes'], ['cargo', 'Cargo', aboard || null], ['ports', 'Ports']]} />
      <Section>{mode === 'routes' ? <Routes /> : mode === 'cargo' ? <Cargo /> : <Desk key={s.system?.id} />}</Section>
    </div>
  )
}
