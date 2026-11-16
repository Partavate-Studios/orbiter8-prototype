// The Ship: the Orbiter 8 as registered, what it carries, and the desks that change it when one is
// at this star (shipyard, armory, Earth's recruiters); names; Autopilot (the session key).
import { useEffect, useState } from 'preact/hooks'
import { usedBays } from '@orbiter8/sdk/client'
import { SHIP_PARTS, mountsUsed } from '@orbiter8/sdk/parts'
import { shipSvg } from '@orbiter8/sdk/ship-art'
import { game, ui, commit, scoutStore } from '../store'
import { cr, num, nameProblem } from '../format'
import { freeBays, goodName, portName, yards, armories, ship, shipCell } from '../helpers'
import { Commit, Qty, Section, Bar, Fact, Tag, Timer, NameField } from './parts'

function Bays() {
  const sh = ship()
  const l = sh.loadout
  const people = Math.ceil(sh.colonists / 100)
  const parts = l.drones * 2 + l.repairBots * 5 + l.armor * 10 + l.shields * 20
  return (
    <div>
      <Bar total={sh.bays} parts={[{ value: sh.cargo, tone: 'cyan' }, { value: people, tone: 'green' }, { value: parts, tone: 'amber' }, { value: sh.baysLost, tone: 'red' }]} />
      <div class="legend">
        <span><i class="cyan" />cargo {sh.cargo}</span>
        {people > 0 && <span><i class="green" />people {people}</span>}
        {parts > 0 && <span><i class="amber" />parts {parts}</span>}
        {sh.baysLost > 0 && <span><i class="red" />damaged {sh.baysLost}</span>}
        <span class="dim">free {sh.bays - usedBays(sh)} of {sh.bays}</span>
      </div>
    </div>
  )
}

function Shipyard() {
  const s = game.state
  const sh = ship()
  const yard = yards()[0]
  const [count, setCount] = useState(1)
  if (!yard) return <p class="empty">No shipyard at this star. Earth's I.S.S. has one; so does any planet with Yards.</p>
  const maxBays = 250 - sh.bays
  const n = Math.min(count, maxBays)
  const baysCost = n > 0 ? game.baysQuote(n) : 0
  const rangeCost = game.rangeQuote()
  const c = s.condition
  const damaged = c && (c.armorLost > 0 || c.off.some(Boolean) || c.retreated || sh.rangeLost > 0 || sh.baysLost > 0)
  return (
    <div class="stack">
      <p class="hint">{portName(yard.port, true)}</p>
      <div class="deskrow">
        <div>
          <b>Bays</b>
          <span class="dim"> · each costs more than the last</span>
          {maxBays > 0 ? <Qty value={n} min={1} max={maxBays} onChange={setCount} /> : <p class="dim">All 250 fitted.</p>}
        </div>
        {maxBays > 0 && (
          <Commit small label={`Fit ${n} ${n === 1 ? 'bay' : 'bays'}`} sub={`${cr(baysCost)} cr`} why={s.credits < baysCost ? `needs ${cr(baysCost)}` : null} run={() => commit(`Fit ${n} bays`, (o) => game.actions.buyHolds(yard.port, n, o))} />
        )}
      </div>
      <div class="deskrow">
        <div>
          <b>Engines</b>
          <span class="dim"> · range {sh.range} of 4</span>
        </div>
        {rangeCost !== null ? (
          <Commit small label={`Range ${sh.range + 1}`} sub={`${cr(rangeCost)} cr`} why={s.credits < rangeCost ? `needs ${cr(rangeCost)}` : null} run={() => commit(`Engines to range ${sh.range + 1}`, (o) => game.actions.buyRange(yard.port, o))} />
        ) : (
          <Tag tone="mine">full range</Tag>
        )}
      </div>
      <div class="deskrow">
        <div>
          <b>Repairs</b>
          <span class="dim"> · everything restored, then 3 h in the yard</span>
        </div>
        <Commit small label="Repair" sub="3,000 cr" why={!damaged ? 'nothing to repair' : s.credits < 3000 ? 'needs 3,000' : null} run={() => commit('Repair the ship', (o) => game.actions.repair(yard.port, o))} />
      </div>
    </div>
  )
}

function Armory() {
  const places = armories()
  const [at, setAt] = useState(null)
  const [counts, setCounts] = useState({})
  if (!places.length) return <p class="empty">No armory at this star. The I.S.S. at Earth sells ship parts; a pilot's Armory sells from its own store.</p>
  return <ArmoryDesk places={places} at={at} setAt={setAt} counts={counts} setCounts={setCounts} />
}

function ArmoryDesk({ places, at, setAt, counts, setCounts }) {
  const s = game.state
  const sh = ship()
  const place = places.find((p) => p.id === at) ?? places[0]
  const port = place ? Number(place.id) : null
  const theirs = port !== null && port !== 2 && !s.factories[port]
  // read on opening, and again after each of the pilot's own moves (a purchase empties the store)
  const lastStamp = ui.filings.find((f) => f.status === 'stamped')?.id
  useEffect(() => {
    if (theirs) scoutStore(port)
  }, [port, theirs, lastStamp])
  if (!place) return null
  const store = port === 2 ? null : (s.factories[port]?.stored ?? ui.stores[port] ?? null)
  const mounts = mountsUsed(sh.loadout)
  const l = sh.loadout
  /** Why `n` of a part can't be fitted here, or null: the contracts' limits, checked before filing. */
  const blocked = (part, n, price) => {
    if (store && (store[part.id] ?? 0) < n) return (store[part.id] ?? 0) ? `only ${store[part.id]} in its store` : 'none in its store'
    const perMount = { railguns: 2, missiles: 2, pointDefense: 1 }[part.field]
    if (perMount && mounts + perMount * n > 6) return `${6 - mounts} of 6 mounts free`
    if (part.field === 'armor' && l.armor + n > 5) return 'armor is at most 5'
    if (part.field === 'shields' && l.shields + n > 3) return 'shields are at most 3'
    const room = { drones: 2, repairBots: 5, armor: 10, shields: 20 }[part.field]
    if (room && room * n > freeBays()) return `needs ${room * n} free bays`
    if (s.credits < price) return `needs ${cr(price)}`
    return null
  }
  return (
    <div class="stack">
      {places.length > 1 && (
        <div class="chips">
          {places.map((p) => (
            <button key={p.id} class={`chip${p === place ? ' on' : ''}`} onClick={() => setAt(p.id)}>{p.station.name}</button>
          ))}
        </div>
      )}
      <p class="hint">
        {place.station.name} · {port === 2 ? 'twice the parts’ cost' : 'one and a half times cost, from its store'} · mounts {mounts}/6 · free bays {freeBays()}
      </p>
      {SHIP_PARTS.map((part) => {
        const rule = s.rules.parts[part.id]
        const n = counts[part.id] ?? 1
        const price = game.partPrice(port, part.id, n)
        return (
          <div class="deskrow" key={part.id}>
            <div>
              <b>{rule.name}</b> <span class="num dim">× {sh.loadout[part.field]}</span>
              <div class="dim small">{part.space}{store ? ` · ${store[part.id] ?? 0} in store` : ''}</div>
              <Qty value={n} min={1} max={20} onChange={(v) => setCounts({ ...counts, [part.id]: v })} />
            </div>
            <Commit small label={`Fit ${n}`} sub={`${cr(price)} cr`} why={blocked(part, n, price)} run={() => commit(`Fit ${n} × ${rule.name}`, (o) => game.actions.buyParts(port, part.id, n, o))} />
          </div>
        )
      })}
    </div>
  )
}

function Passengers() {
  const s = game.state
  const sh = ship()
  const price = s.rules.colonistPrice
  const room = freeBays() * 100 + ((100 - (sh.colonists % 100)) % 100)
  const max = Math.max(0, Math.min(room, Math.floor(s.credits / price)))
  const [count, setCount] = useState(100)
  const n = Math.min(count, max)
  return (
    <div class="deskrow">
      <div>
        <b>Colonists</b> <span class="num dim">{num(sh.colonists)} aboard</span>
        <div class="dim small">100 to a bay · {price} cr each · recruited at Sol, landed on your planets</div>
        {shipCell() === 0 && max > 0 && <Qty value={n} max={max} step={max >= 100 ? 100 : 1} onChange={setCount} />}
      </div>
      {shipCell() === 0 && (
        <Commit small label={`Recruit ${num(n)}`} sub={`${cr(n * price)} cr`} why={max <= 0 ? 'no room or credits' : n <= 0 ? 'set a number' : null} run={() => commit(`Recruit ${num(n)} colonists`, (o) => game.actions.recruit(n, o))} />
      )}
    </div>
  )
}

function Autopilot() {
  const s = game.state
  if (ui.devWallet && !s.session)
    return (
      <div class="deskrow">
        <div>
          <b>Autopilot</b>
          <div class="dim small">The dev wallet never prompts, so there is nothing to clear. With a real wallet: approve once, move freely for 4 hours.</div>
        </div>
        <Commit small label="Engage" sub="one approval" run={() => commit('Autopilot engaged', (o) => game.actions.startSession(o))} />
      </div>
    )
  return (
    <div class="deskrow">
      <div>
        <b>Autopilot</b>{' '}
        {!s.session ? <Tag>off</Tag> : s.session.expiry * 1000 > ui.now ? <Tag tone="mine">on · <Timer at={s.session.expiry * 1000} /></Tag> : <Tag tone="warn">expired</Tag>}
        <div class="dim small">A key kept in this browser makes game moves without a wallet prompt for 4 hours. It can't touch your wallet; its gas money comes back when it ends.</div>
      </div>
      {s.session ? (
        <Commit small label="Disengage" sub={s.session.expiry * 1000 > ui.now ? null : 'returns its gas money'} run={() => commit('Autopilot ended', (o) => game.actions.endSession(o))} />
      ) : (
        <Commit small label="Engage" sub="one approval" run={() => commit('Autopilot engaged', (o) => game.actions.startSession(o))} />
      )}
    </div>
  )
}

export function Ship() {
  const s = game.state
  const sh = ship()
  const l = sh.loadout
  const c = s.condition
  const scarred = Boolean(c && (c.armorLost > 0 || c.off.some(Boolean)))
  const docked = c && c.dockedUntil * 1000 > ui.now
  return (
    <div class="panel-body">
      <div class="shiphead">
        <div class="shipart" dangerouslySetInnerHTML={{ __html: shipSvg(sh, scarred) }} />
        <div>
          <h2>{sh.name}</h2>
          <p class="lede">Orbiter 8 · registry #{s.pilot.shipId} · {s.pilot.callsign}</p>
          <div class="pips" title={`Range ${sh.range}`}>
            <span class="label">Range</span>
            {[1, 2, 3, 4].map((i) => (
              <i key={i} class={i <= sh.range - sh.rangeLost ? 'on' : i <= sh.range ? 'hurt' : ''} />
            ))}
          </div>
          {c?.retreated && <Tag tone="bad">driven off · needs repairs</Tag>}
          {docked && <Tag tone="warn">in the yard <Timer at={c.dockedUntil * 1000} /></Tag>}
        </div>
      </div>
      <Section title="Bays">
        <Bays />
        {s.cargo.some(Boolean) && (
          <div class="manifest">
            {s.cargo.map((units, id) => (units ? <span key={id}><b class="num">{units}</b> {goodName(id)}</span> : null))}
          </div>
        )}
      </Section>
      <Section title="Fitted" aside={`mounts ${mountsUsed(l)}/6`}>
        <div class="facts">
          {SHIP_PARTS.map((part) => {
            const off = part.off !== undefined && c ? c.off[part.off] : 0
            return (
              <Fact key={part.id} label={s.rules.parts[part.id].name}>
                <span class="num">{l[part.field]}</span>
                {off > 0 && <span class="bad num"> −{off}</span>}
              </Fact>
            )
          })}
        </div>
        {c?.armorLost > 0 && <p class="hint bad">Armor down {c.armorLost} points.</p>}
      </Section>
      <Section title="Shipyard"><Shipyard /></Section>
      <Section title="Armory"><Armory /></Section>
      <Section title="Passengers"><Passengers /></Section>
      <Section title="Registry">
        <div class="stack">
          <NameField label="Rename ship" sub="500 cr" placeholder={sh.name} problem={nameProblem} run={(name) => commit(`Ship renamed ${name}`, (o) => game.actions.rename({ type: 'ship', name }, o))} />
          <NameField label="New call sign" sub="2,000 cr · wallet" placeholder={s.pilot.callsign} problem={nameProblem} run={(name) => commit(`Call sign ${name}`, (o) => game.actions.changeCallsign(name, o))} />
          <Autopilot />
        </div>
      </Section>
    </div>
  )
}
