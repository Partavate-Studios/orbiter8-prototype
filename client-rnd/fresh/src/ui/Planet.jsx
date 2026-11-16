// A planet's sheet. It adapts to whose planet it is: unclaimed (claim it), the Federation's (its
// port), yours (project, people, storage, factory, defenses, names), another pilot's (scout, siege).
// A siege, whoever's, sits on top.
import { useEffect, useState } from 'preact/hooks'
import { PLANET_TYPE_NAMES } from '@orbiter8/sdk/game/planet-types'
import { MODE } from '@orbiter8/sdk/market'
import { game, ui, commit, set, planetModel, scout } from '../store'
import { cr, num, span } from '../format'
import { BUILDINGS, LEVELS, freeBays, goodName, ship, armed } from '../helpers'
import { Commit, Qty, Section, Bar, Fact, Tag, Timer, Tabs, NameField } from './parts'
import { PLANET_COLORS } from '../palette'
import { nextRound } from '../logic/agenda'

const lengthOk = (name) => (name.length > 24 ? 'At most 24 characters.' : null)

// ── the siege ─────────────────────────────────────────────────────────────────────────────────

function Layer({ label, value, total, tone = 'cyan', count }) {
  const gone = count !== undefined ? count === 0 : value === 0
  return (
    <div class={`layer${gone ? ' gone' : ''}`}>
      <span class="label">{label}</span>
      {count !== undefined ? <span class="num">{count}</span> : <Bar total={total || 1} parts={[{ value, tone }]} />}
      {count === undefined && <span class="num">{value}</span>}
    </div>
  )
}

function Siege({ p }) {
  const s = game.state
  const siege = p.siege
  const d = siege.side
  const a = siege.ship
  const attacking = siege.attacker === s.account
  const next = nextRound(siege.checkpoint, ui.now)
  const worn = siege.wornAt > 0
  // allies who joined this siege, from the public feed (the contracts keep the list but don't show it,
  // and would take a second join from the same pilot)
  const started = s.feed.find((e) => e.event === 'SiegeStarted' && e.planet === p.id)?.block ?? 0
  const allies = [...new Set(s.feed.filter((e) => e.event === 'DefenderJoined' && e.planet === p.id && e.block >= started).map((e) => e.who))]
  const joined = allies.includes(s.account)
  const file = (label, action) => () => commit(`${label} · ${p.name}`, (o) => game.actions[action](p.id, o))
  // Completing plays at most 64 rounds and is refused if more are due (a claim left more than a day
  // and a half). The checkpoint we read is the view's (it plays the rounds), not the chain's; but filing
  // the claim recorded every round then, 24 h before claimAt, so count from there and record first.
  const completeClaim = async () => {
    const due = Math.floor((ui.now / 1000 - (siege.claimAt - 86400)) / 1800) + 1
    if (due >= 64) {
      for (let i = 0; i < Math.ceil(due / 64) - 1; i++) if (!(await file('Siege recorded', 'advanceSiege')())) return false
    }
    return file('Claim completed', 'completeClaim')()
  }
  return (
    <Section title="Under siege" aside={<span>next round <Timer at={next} done="due" /></span>}>
      <p class="lede">
        {attacking ? 'You are' : `${s.callsigns[siege.attacker] || 'A pilot'} is`} laying siege{worn ? '. The planet is worn down.' : '. Hits land top to bottom.'}
      </p>
      <div class="sides">
        <div>
          <h4>{p.name}</h4>
          <Layer label="Platforms" value={d.platforms} total={450} />
          <Layer label="Moon guns" count={d.moonPointDefense + d.moonRailguns + d.moonMissiles} />
          <Layer label="Shield" value={d.shield} total={d.shieldMax} />
          <Layer label="Armor" value={d.armor} total={d.armorMax} tone="dimbar" />
          <Layer label="Weapons" count={d.pointDefense + d.railguns + d.missiles + d.drones + d.repairBots + d.bfg} />
          <Layer label="Hull" value={d.hull} total={Math.max(60, p.level * 60)} tone="amber" />
        </div>
        <div>
          <h4>{attacking ? 'Your ship' : 'Attacker'}</h4>
          <Layer label="Shield" value={a.shield} total={a.shieldMax} />
          <Layer label="Armor" value={a.armor} total={a.armorMax} tone="dimbar" />
          <Layer label="Railguns" count={a.railguns} />
          <Layer label="Missiles" count={a.missiles} />
          <Layer label="Drones" count={a.drones} />
          {a.retreated && <Tag tone="bad">driven off</Tag>}
        </div>
      </div>
      {allies.length > 0 && (
        <p class="hint">
          Defending beside {p.name}: {allies.map((a) => (a === s.account ? 'you' : s.callsigns[a] || 'a pilot')).join(', ')} ({allies.length} of 4 allies).
        </p>
      )}
      {siege.claimAt > 0 && (
        <p class="hint">
          {ui.now < siege.claimAt * 1000 ? (
            <>Claim filed with Minerva: completes in <Timer at={siege.claimAt * 1000} /> unless the defenses return or the attacker leaves.</>
          ) : (
            'The claim’s wait is over: anyone may complete it. It succeeds if the planet is still worn down.'
          )}
        </p>
      )}
      <div class="stack">
        {attacking && worn && !siege.claimAt && <Commit primary label="File claim with Minerva" sub="completes after 24 h" run={file('Claim filed', 'fileClaim')} />}
        {siege.claimAt > 0 && <Commit primary={attacking} label="Complete the claim" why={ui.now < siege.claimAt * 1000 ? 'the wait is still running' : null} run={completeClaim} />}
        <Commit small label="Record the rounds so far" sub="anyone may · this view already plays them" run={file('Siege recorded', 'advanceSiege')} />
        {attacking && <Commit small danger label="Withdraw" sub="ends the siege" run={file('Siege withdrawn', 'withdraw')} />}
        {!attacking && !p.mine && p.here && !joined && <Commit small label="Join the defense" why={!armed() ? 'your ship has no weapons' : allies.length >= 4 ? 'four allies already' : s.sieges.some((x) => x.attacker === s.account) ? 'you are laying a siege' : null} run={file('Joined the defense', 'joinDefense')} />}
      </div>
    </Section>
  )
}

// ── your planet ───────────────────────────────────────────────────────────────────────────────

function Project({ p }) {
  const s = game.state
  const options = []
  if (p.level < 6) options.push(p.level + 1)
  if (p.level >= 2 && !p.autofactory && p.building !== 7) options.push(7)
  const [pick, setPick] = useState(null)
  if (p.building)
    return (
      <div class="stack">
        <p class="lede">
          <b>{BUILDINGS[p.building]}</b> under construction: <Timer at={p.readyAt * 1000} done="finished" />. It counts the moment its time is up; nothing more to file.
        </p>
      </div>
    )
  if (!options.length) return <p class="empty">Fully built: {LEVELS[p.level]}{p.autofactory ? ' with an Autofactory' : ''}.</p>
  const building = options.includes(pick) ? pick : options[0]
  const cost = s.rules.buildings[building]
  const people = building === 2 ? Math.ceil((p.cap * cost.people) / 100) : cost.people
  const missing = game.missingFor(p, building)
  const sh = ship()
  const Line = ({ ok, children, fix }) => (
    <li class={ok ? 'ok' : 'todo'}>
      <span class="check">{ok ? '✓' : '·'}</span>
      <span class="grow">{children}</span>
      {!ok && fix}
    </li>
  )
  return (
    <div class="stack">
      {options.length > 1 && <Tabs value={building} onChange={setPick} options={options.map((b) => [b, BUILDINGS[b]])} />}
      <ul class="checklist">
        {people > 0 && (
          <Line ok={p.population >= people} fix={p.here && sh.colonists > 0 ? <Commit small label={`Land ${num(Math.min(sh.colonists, people - p.population))}`} run={() => commit(`Land colonists · ${p.name}`, (o) => game.actions.land(p.id, Math.min(sh.colonists, people - p.population), o))} /> : <span class="dim small">recruit at Earth (Ship)</span>}>
            {num(people)} people <span class="dim num">· {num(p.population)} here</span>
          </Line>
        )}
        {cost.goods.map(([good, amount]) => {
          const have = p.stock[good] ?? 0
          const aboard = s.cargo[good] ?? 0
          const n = Math.min(aboard, amount - have)
          return (
            <Line key={good} ok={have >= amount} fix={p.here && n > 0 ? <Commit small label={`Deliver ${n}`} run={() => commit(`Deliver ${n} ${goodName(good)} · ${p.name}`, (o) => game.actions.deliver(p.id, good, n, o))} /> : <span class="dim small">{p.here ? 'bring it from a port' : 'deliver it there'}</span>}>
              {amount} {goodName(good)} in storage <span class="dim num">· {have} there{aboard ? `, ${aboard} aboard` : ''}</span>
            </Line>
          )
        })}
        <Line ok={s.credits >= cost.credits}>{cr(cost.credits)} credits</Line>
      </ul>
      <Commit primary label={`Build ${BUILDINGS[building]}`} sub={`${cr(cost.credits)} cr · ${span(cost.time)} · from anywhere`} why={missing.length ? `needs ${missing[0]}` : null} run={() => commit(`Build ${BUILDINGS[building]} · ${p.name}`, (o) => game.actions.buildStation(p.id, building, o))} />
    </div>
  )
}

function Stores({ p }) {
  const s = game.state
  const sh = ship()
  const goods = s.economy.goods.map((g, id) => id).filter((id) => (p.stock[id] ?? 0) > 0 || (s.cargo[id] ?? 0) > 0)
  const [good, setGood] = useState(null)
  const [units, setUnits] = useState(0)
  const [people, setPeople] = useState(0)
  const g = goods.includes(good) ? good : goods[0]
  const stock = p.stock[g] ?? 0
  const aboard = s.cargo[g] ?? 0
  const away = !p.here ? 'your ship must be at this star' : null
  const boardMax = Math.min(p.population, freeBays() * 100 + ((100 - (sh.colonists % 100)) % 100))
  return (
    <div class="stack">
      <div class="facts">
        <Fact label="People">
          <span class="num">{num(p.population)}</span> <span class="dim num">/ {num(p.cap)}</span>
        </Fact>
        <Fact label="Aboard"><span class="num">{num(sh.colonists)}</span></Fact>
      </div>
      <Bar total={p.cap} parts={[{ value: p.population, tone: 'green' }]} />
      {p.level < 1 && <p class="hint">People grow, and the planet works, once a Citadel stands.</p>}
      <Qty value={Math.min(people, Math.max(sh.colonists, boardMax))} max={Math.max(sh.colonists, boardMax)} step={Math.max(sh.colonists, boardMax) >= 100 ? 100 : 1} onChange={setPeople} />
      <div class="pair">
        <Commit small label={`Land ${num(Math.min(people, sh.colonists))}`} why={away ?? (Math.min(people, sh.colonists) <= 0 ? 'none to land' : null)} run={() => commit(`Land colonists · ${p.name}`, (o) => game.actions.land(p.id, Math.min(people, sh.colonists), o))} />
        <Commit small label={`Board ${num(Math.min(people, boardMax))}`} why={away ?? (Math.min(people, boardMax) <= 0 ? 'none to board' : null)} run={() => commit(`Board people · ${p.name}`, (o) => game.actions.board(p.id, Math.min(people, boardMax), o))} />
      </div>
      <h4>Storage</h4>
      {!goods.length ? (
        <p class="empty">Nothing in storage, nothing aboard.</p>
      ) : (
        <>
          <div class="chips">
            {goods.map((id) => (
              <button key={id} class={`chip${id === g ? ' on' : ''}`} onClick={() => (setGood(id), setUnits(0))}>
                {goodName(id)} <span class="num dim">{p.stock[id] ?? 0}</span>
              </button>
            ))}
          </div>
          <p class="hint num">{goodName(g)}: {stock} in storage · {aboard} aboard · {freeBays()} free bays</p>
          <Qty value={units} max={Math.max(aboard, Math.min(stock, freeBays()))} onChange={setUnits} />
          <div class="pair">
            <Commit small label={`Deliver ${Math.min(units, aboard)}`} sub="ship → planet" why={away ?? (Math.min(units, aboard) <= 0 ? 'none aboard' : null)} run={() => commit(`Deliver ${Math.min(units, aboard)} ${goodName(g)} · ${p.name}`, (o) => game.actions.deliver(p.id, g, Math.min(units, aboard), o))} />
            <Commit small label={`Collect ${Math.min(units, stock, freeBays())}`} sub="planet → ship" why={away ?? (Math.min(units, stock, freeBays()) <= 0 ? 'nothing to load' : null)} run={() => commit(`Collect ${Math.min(units, stock, freeBays())} ${goodName(g)} · ${p.name}`, (o) => game.actions.collect(p.id, g, Math.min(units, stock, freeBays()), o))} />
          </div>
        </>
      )}
    </div>
  )
}

function Factory({ p }) {
  const s = game.state
  const [counts, setCounts] = useState({})
  if (!p.autofactory)
    return <p class="empty">{p.building === 7 ? 'The Autofactory is being built.' : p.level >= 2 ? 'No Autofactory yet: it is on the Project tab.' : 'An Autofactory can be built once this is a Colony.'}</p>
  const queue = p.factory?.queue ?? []
  return (
    <div class="stack">
      {queue.length > 0 && (
        <ul class="plain">
          {queue.map((order, i) => (
            <li key={i}>
              <span class="grow">{order.count} × {s.rules.parts[order.part].name}</span>
              <Timer at={order.readyAt * 1000} />
            </li>
          ))}
        </ul>
      )}
      <p class="hint">{queue.length}/5 orders. Credits and goods (from this planet's storage) are paid when you order; works from anywhere.</p>
      {s.rules.parts.map((part, id) => {
        const n = counts[id] ?? 1
        const lack = part.goods.find(([good, amount]) => (p.stock[good] ?? 0) < amount * n)
        const why = queue.length >= 5 ? 'queue full' : lack ? `needs ${lack[1] * n} ${goodName(lack[0])}` : s.credits < part.credits * n ? `needs ${cr(part.credits * n)}` : null
        return (
          <div class="deskrow" key={id}>
            <div>
              <b>{part.name}</b> {part.planetOnly && <Tag>planet only</Tag>}
              <div class="dim small num">{part.goods.map(([good, amount]) => `${amount} ${goodName(good)}`).join(' · ')} · {span(part.time)} each</div>
              <Qty value={n} min={1} max={20} onChange={(v) => setCounts({ ...counts, [id]: v })} />
            </div>
            <Commit small label={`Order ${n}`} sub={`${cr(part.credits * n)} cr`} why={why} run={() => commit(`Order ${n} × ${part.name} · ${p.name}`, (o) => game.actions.order(p.id, id, n, o))} />
          </div>
        )
      })}
    </div>
  )
}

const FIELDS = ['drones', 'repairBots', 'pointDefense', 'railguns', 'missiles', 'armor', 'shields', 'platforms', 'bfg']
const MOON_FIELDS = { 2: 'moonPointDefense', 3: 'moonRailguns', 4: 'moonMissiles' }

function Defenses({ p }) {
  const s = game.state
  const d = p.defenses
  const stored = p.factory?.stored ?? []
  const sh = ship()
  const [counts, setCounts] = useState({})
  if (!d) return <p class="empty">Reading the defenses…</p>
  const mounts = d.pointDefense + 2 * d.railguns + 2 * d.missiles
  const moonMounts = d.moonPointDefense + 2 * d.moonRailguns + 2 * d.moonMissiles
  const act = (label, action, part, n) => () => commit(`${label} · ${p.name}`, (o) => game.actions[action](p.id, part, n, o))
  return (
    <div class="stack">
      <div class="facts">
        <Fact label="Mounts"><span class="num">{mounts}/{12 + 4 * d.platforms}</span></Fact>
        <Fact label="Moon mounts"><span class="num">{moonMounts}/{6 * p.moons.length}</span></Fact>
        <Fact label="Hull"><span class="num">{p.level * 60}</span></Fact>
      </div>
      {s.rules.parts.map((part, id) => {
        const fitted = d[FIELDS[id]]
        const onMoons = MOON_FIELDS[id] ? d[MOON_FIELDS[id]] : null
        const inStore = stored[id] ?? 0
        const onShip = id < 7 ? sh.loadout[FIELDS[id]] : 0
        if (!fitted && !onMoons && !inStore && !onShip) return null
        const n = Math.max(1, Math.min(counts[id] ?? 1, Math.max(inStore, onShip, 1)))
        return (
          <div class="defrow" key={id}>
            <div class="defhead">
              <b>{part.name}</b>
              <span class="num dim">planet {fitted}{onMoons !== null ? ` · moons ${onMoons}` : ''} · store {inStore}{id < 7 ? ` · ship ${onShip}` : ''}</span>
            </div>
            <Qty value={n} min={1} max={Math.max(inStore, onShip, 1)} onChange={(v) => setCounts({ ...counts, [id]: v })} />
            <div class="pair wrap">
              <Commit small label={`${n} → planet`} why={inStore < n ? 'not in store' : null} run={act(`Fit ${n} × ${part.name}`, 'fitPlanet', id, n)} />
              {MOON_FIELDS[id] && p.moons.length > 0 && <Commit small label={`${n} → moons`} why={inStore < n ? 'not in store' : null} run={act(`Fit ${n} × ${part.name} on the moons`, 'fitMoons', id, n)} />}
              {id < 7 && <Commit small label={`${n} → ship`} why={!p.here ? 'ship not here' : inStore < n ? 'not in store' : null} run={act(`Load ${n} × ${part.name} onto the ship`, 'fitShip', id, n)} />}
              {id < 7 && onShip > 0 && <Commit small label={`ship → store`} why={!p.here ? 'ship not here' : onShip < n ? 'not aboard' : null} run={act(`Unload ${n} × ${part.name}`, 'unloadShip', id, n)} />}
            </div>
          </div>
        )
      })}
      <p class="hint">Parts come from this planet's Autofactory. Planet and moon defenses can be fitted from anywhere, even mid-siege.</p>
    </div>
  )
}

function Names({ p }) {
  const rename = (type, extra, what) => (name) => commit(`${what} named ${name}`, (o) => game.actions.rename({ type, objectId: p.id, name, ...extra }, o))
  return (
    <div class="stack">
      <NameField label="Name planet" placeholder={p.name} problem={lengthOk} run={rename('planet', {}, 'Planet')} />
      {p.station && <NameField label="Name station" placeholder={p.station.name} problem={lengthOk} run={rename('station', {}, 'Station')} />}
      {p.moons.map((m) => (
        <NameField key={m.orbit} label="Name moon" placeholder={m.name} problem={lengthOk} run={(name) => commit(`Moon named ${name}`, (o) => game.actions.rename({ type: 'moon', objectId: m.orbit, parentId: p.id, name }, o))} />
      ))}
      <p class="hint">Names are filed with Minerva and free for the owner.</p>
    </div>
  )
}

function Mine({ p }) {
  const [tab, setTab] = useState('project')
  const stored = (p.factory?.stored ?? []).reduce((a, b) => a + b, 0)
  return (
    <>
      <Tabs value={tab} onChange={setTab} options={[['project', 'Project'], ['stores', 'People & storage'], ['factory', 'Factory', p.factory?.queue.length || null], ['defenses', 'Defenses', stored || null], ['names', 'Names']]} />
      <Section>{tab === 'project' ? <Project p={p} /> : tab === 'stores' ? <Stores p={p} /> : tab === 'factory' ? <Factory p={p} /> : tab === 'defenses' ? <Defenses p={p} /> : <Names p={p} />}</Section>
    </>
  )
}

// ── everyone else's ───────────────────────────────────────────────────────────────────────────

function PortBoard({ p }) {
  if (!p.port) return null
  return (
    <Section title={p.station?.name ?? 'Port'} aside={[p.port.yard && 'shipyard', p.station?.armory && 'armory'].filter(Boolean).join(' · ')}>
      <div class="portboard">
        {p.port.quotes.map((q, id) =>
          q.mode === MODE.NONE ? null : (
            <div key={id} class={q.mode === MODE.SELLS ? 'sells' : 'buys'}>
              <span>{q.mode === MODE.SELLS ? 'sells' : 'buys'}</span>
              <b>{goodName(id)}</b>
              <span class="num">{cr(q.price)}</span>
            </div>
          )
        )}
      </div>
      {p.here && (
        <div class="pair">
          <button class="ghost wide" onClick={() => ((ui.deskPort = p.id), set({ tab: 'market', open: true }))}>Trade here</button>
          {(p.port.yard || p.station?.armory) && <button class="ghost wide" onClick={() => set({ tab: 'ship', open: true })}>{p.port.yard ? 'Shipyard' : 'Armory'}</button>}
        </div>
      )}
    </Section>
  )
}

function Unclaimed({ p }) {
  const s = game.state
  const [name, setName] = useState('')
  const star = s.cells.get(p.cell)
  const windowEnds = star ? (star.discoveredAt + 600) * 1000 : 0
  const theirs = star && star.discoverer !== s.account && ui.now < windowEnds
  const fee = s.rules.claimFee
  const issue = name ? lengthOk(name) : null
  return (
    <Section title="Unclaimed">
      <p class="lede">Claim it and its deed is yours. Then people from Earth and a Citadel make it work.</p>
      {theirs && <p class="hint">Its discoverer has first claim for <Timer at={windowEnds} done="a moment" /> (unless they've flown on).</p>}
      <input type="text" maxLength={24} placeholder="A name for it (optional)" value={name} onInput={(e) => setName(e.currentTarget.value)} />
      <Commit primary label="Claim this planet" sub={`${cr(fee)} cr · filed with Minerva`} why={!p.here ? 'your ship must be at this star' : issue ?? (s.credits < fee ? `needs ${cr(fee)} credits` : null)} run={() => commit(`Claim ${name || p.name}`, (o) => game.actions.claimPlanet(p.id, name.trim() || null, o))} />
    </Section>
  )
}

function Theirs({ p }) {
  const s = game.state
  useEffect(() => {
    scout(p.id)
  }, [p.id])
  const d = p.defenses
  const c = s.condition
  const why = !p.here ? 'your ship must be at this star' : !armed() ? 'your ship has no weapons' : c?.retreated ? 'your ship needs repairs first' : c && c.dockedUntil * 1000 > ui.now ? 'your ship is in the yard' : null
  return (
    <Section title="Scouted defenses">
      {!d ? (
        <p class="empty">Scanning…</p>
      ) : (
        <div class="facts">
          <Fact label="Hull"><span class="num">{p.level * 60}</span></Fact>
          <Fact label="Shield"><span class="num">{d.shields * 60}</span></Fact>
          <Fact label="Armor"><span class="num">{d.armor * 50}</span></Fact>
          <Fact label="Platforms"><span class="num">{d.platforms}</span></Fact>
          <Fact label="Railguns"><span class="num">{d.railguns + d.moonRailguns}</span></Fact>
          <Fact label="Missiles"><span class="num">{d.missiles + d.moonMissiles}</span></Fact>
          <Fact label="Point def."><span class="num">{d.pointDefense + d.moonPointDefense}</span></Fact>
          <Fact label="Drones"><span class="num">{d.drones}</span></Fact>
          <Fact label="BFG"><span class="num">{d.bfg}</span></Fact>
        </div>
      )}
      {!p.siege && <Commit primary danger label="Lay siege" sub="public · rounds every 30 min · leaving ends it" why={why} run={() => commit(`Siege laid · ${p.name}`, (o) => game.actions.attack(p.id, o))} />}
    </Section>
  )
}

export function PlanetSheet({ id, onBack }) {
  const s = game.state
  const p = planetModel(id)
  if (!p) return <div class="panel-body"><p class="empty">That planet isn't in view.</p></div>
  return (
    <div class="panel-body">
      {onBack && <button class="back" onClick={onBack}>‹ Domain</button>}
      <div class="head">
        <i class="orb" style={{ background: PLANET_COLORS[p.class] }} />
        <div class="grow">
          <h2>{p.name}</h2>
          <p class="lede">
            {PLANET_TYPE_NAMES[p.class]} world · size {p.size} · {game.starName(p.cell)}
          </p>
        </div>
        {p.mine ? <Tag tone="mine">yours</Tag> : p.federation ? <Tag>Federation</Tag> : p.owner ? <Tag>{p.ownerName}</Tag> : <Tag tone="unknown">unclaimed</Tag>}
      </div>
      <div class="facts">
        <Fact label="Stage">{p.federation ? 'Federation station' : p.owner ? LEVELS[p.level] : '—'}{p.autofactory ? ' + Autofactory' : ''}</Fact>
        <Fact label="Holds"><span class="num">{num(p.cap)}</span> people</Fact>
        <Fact label="Moons"><span class="num">{p.moons.length}</span></Fact>
        {!p.here && <Fact label="Where">{game.starName(p.cell)} <span class="dim">(not here)</span></Fact>}
      </div>
      {p.siege && <Siege p={p} />}
      {p.mine ? <Mine p={p} /> : null}
      <PortBoard p={p} />
      {p.federation && p.body === 2 && <p class="hint">Earth recruits colonists: Ship → Passengers.</p>}
      {!p.owner && !p.federation && <Unclaimed p={p} />}
      {p.owner && !p.mine && !p.federation && <Theirs p={p} />}
      {s.pilot && p.mine && p.siege && <p class="hint">Fit parts from the store under Defenses: they join the fight at once.</p>}
    </div>
  )
}
