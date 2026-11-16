// The System tab: the worlds of the star the ship is at (the rail), and the sheet for whichever
// is selected: a planet, or the star itself.
import { STATE } from '@orbiter8/sdk/contracts'
import { game, ui, commit, set } from '../store'
import { cr } from '../format'
import { worlds, shipCell } from '../helpers'
import { Commit, Section, Fact, Tag, Timer, NameField } from './parts'
import { PlanetSheet } from './Planet'
import { PLANET_COLORS, STAR_COLORS } from '../palette'

const SPECTRAL_WORDS = { O: 'blue giant', B: 'blue-white', A: 'white', F: 'yellow-white', G: 'yellow', K: 'orange', M: 'red dwarf' }

/** One chip per world: what it is and what matters there, at a glance. */
export function WorldRail() {
  const s = game.state
  const system = s.system
  if (!system) return null
  const list = worlds()
  return (
    <div class="rail">
      <button class={`world star${ui.sel?.type === 'star' ? ' on' : ''}`} onClick={() => set({ sel: { type: 'star', id: system.id }, open: true })}>
        <i class="orb" style={{ background: system.blackHole ? '#000' : STAR_COLORS[system.spectral], boxShadow: system.blackHole ? '0 0 0 1.5px #b79cff' : `0 0 10px ${STAR_COLORS[system.spectral]}` }} />
        <span class="wname">{system.starName}</span>
        <span class="wsub">{system.blackHole ? 'black hole' : `${list.length} worlds`}</span>
      </button>
      {list.map((p) => {
        const mine = p.owner === s.account
        const marks = [p.hasStation && 'port', p.station?.yard && 'yard', p.station?.armory && 'armory'].filter(Boolean)
        return (
          <button key={p.id} class={`world${ui.sel?.type === 'planet' && Number(ui.sel.id) === Number(p.id) ? ' on' : ''}${mine ? ' mine' : ''}`} onClick={() => set({ sel: { type: 'planet', id: Number(p.id) }, open: true })}>
            <i class="orb" style={{ background: PLANET_COLORS[p.class] }} />
            <span class="wname">{p.name}</span>
            <span class="wsub">
              {p.info?.siege ? <b class="bad">siege</b> : mine ? <b class="amber">yours</b> : p.federation ? marks.join(' · ') || 'Federation' : p.owner ? s.callsigns[p.owner] || 'claimed' : 'unclaimed'}
            </span>
          </button>
        )
      })}
      {!list.length && !system.blackHole && <span class="dim rail-note">No planets circle this star.</span>}
    </div>
  )
}

function StarSheet() {
  const s = game.state
  const system = s.system
  const cell = s.cells.get(system.id)
  const scan = s.scan && s.scan.cell === system.id ? s.scan : null
  const nameCost = s.rules.buildings[3].credits
  const partner = cell?.partner
  return (
    <div class="panel-body">
      <div class="head">
        <i class="orb big" style={{ background: system.blackHole ? '#000' : STAR_COLORS[system.spectral], boxShadow: system.blackHole ? '0 0 0 2px #b79cff' : `0 0 18px ${STAR_COLORS[system.spectral]}` }} />
        <div class="grow">
          <h2>{system.starName}</h2>
          <p class="lede">{system.blackHole ? 'Black hole' : `Class ${system.spectral} · ${SPECTRAL_WORDS[system.spectral]}`} · cell {system.id}</p>
        </div>
        {system.keeper === 'federation' && <Tag>Federation</Tag>}
      </div>
      <div class="facts">
        <Fact label="Discovered by">{system.id === 0 ? 'Humanity' : system.discoveredBy === s.account ? 'You' : s.callsigns[system.discoveredBy] || 'unknown'}</Fact>
        <Fact label="Owner">{system.keeper === 'federation' ? 'The Federation' : system.keeper ? (system.keeper === s.account ? 'You' : s.callsigns[system.keeper] || 'a pilot') : 'none'}</Fact>
        <Fact label="Worlds"><span class="num">{worlds().length}</span></Fact>
        <Fact label="Ships here"><span class="num">{Object.keys(system.ships).length}</span></Fact>
      </div>
      {cell?.visited && !cell.scanned && (
        <Section title="Long-range scan">
          <p class="lede">
            The scan that decides the six cells around this star waits on a beacon round nobody can predict.{' '}
            {scan ? <>Ready in <Timer at={scan.readyAt + ui.skew} done="a moment" />.</> : null}
          </p>
          {ui.scanReady && <Commit primary label="File the scan" sub="reveals this star's neighbors" run={() => commit('Scan recorded', (o) => game.actions.resolveScans(o), { scan: true })} />}
        </Section>
      )}
      {system.blackHole && (
        <Section title="The way through">
          <p class="lede">{partner ? `Its partner is ${game.starName(partner)}, far across the void.` : 'It leads somewhere.'} One move takes you through.</p>
          <Commit primary label="Go through" sub={partner ? `to ${game.starName(partner)}` : null} why={shipCell() !== system.id ? 'your ship is not here' : null} run={() => commit('Through the black hole', (o) => game.actions.traverse(o), { jump: partner ? { from: system.id, to: partner } : null })} />
        </Section>
      )}
      {system.mayName && (
        <Section title="Name this star">
          <p class="lede">{system.namingOwns ? 'Naming it makes you its owner.' : 'You may name it.'} The name goes on every pilot's chart.</p>
          <NameField label="File the name" sub={`${cr(nameCost)} cr`} placeholder={system.starName} problem={(n) => (n.length > 24 ? 'At most 24 characters.' : s.credits < nameCost ? `needs ${cr(nameCost)} credits` : null)} run={(name) => commit(`Star named ${name}`, (o) => game.actions.rename({ type: 'star', name }, o))} />
        </Section>
      )}
      <button class="ghost wide" onClick={() => set({ tab: 'galaxy', gsel: null, open: false })}>Open the galaxy chart</button>
    </div>
  )
}

export function SystemPanel() {
  const s = game.state
  if (!s.system) return <div class="panel-body"><p class="empty">Reading the system…</p></div>
  const sel = ui.sel
  const valid = sel && (sel.type === 'star' || worlds().some((p) => Number(p.id) === Number(sel.id)))
  return (
    <>
      <WorldRail />
      {valid && ui.open ? sel.type === 'star' ? <StarSheet /> : <PlanetSheet id={sel.id} /> : <SystemSummary />}
    </>
  )
}

function SystemSummary() {
  const s = game.state
  const pending = [...s.cells.values()].filter((c) => c.state === STATE.STAR && !c.visited).length
  return (
    <div class="panel-body summary">
      <p class="lede">
        You're at <b>{s.system.starName}</b>. Everything here is in reach at once: pick a world, or open the Market.
        {pending > 0 && ` ${pending} charted ${pending === 1 ? 'star has' : 'stars have'} never been visited.`}
      </p>
    </div>
  )
}
