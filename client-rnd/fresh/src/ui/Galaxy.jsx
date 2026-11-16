// The Galaxy tab's sheet: the survey of the star picked on the chart, and the course to it.
import { PLANET_TYPE_NAMES } from '@orbiter8/sdk/game/planet-types'
import { STATE } from '@orbiter8/sdk/contracts'
import { distance } from '@orbiter8/sdk/hex'
import { game, ui, commit, set } from '../store'
import { plotCourse } from '../logic/course'
import { shipCell, reach } from '../helpers'
import { Commit, Section, Fact, Tag } from './parts'
import { PLANET_COLORS, STAR_COLORS } from '../palette'

/** Files the next leg of a course. */
export async function flyLeg(leg) {
  const from = shipCell()
  const name = game.starName(leg.to)
  const ok =
    leg.kind === 'traverse'
      ? await commit(`Through the black hole to ${name}`, (o) => game.actions.traverse(o), { jump: { from, to: leg.to } })
      : await commit(`Jump to ${name}`, (o) => game.actions.moveTo(leg.to, o), { jump: { from, to: leg.to } })
  // arrived at the star that was picked: the chart goes back to "what's in reach from here"
  if (ok && ui.gsel === leg.to) set({ gsel: null, course: null, sel: null })
  else if (ok) set({ sel: null })
  return ok
}

export function GalaxyPanel({ stage }) {
  const s = game.state
  const here = shipCell()
  const range = reach()
  const cell = ui.gsel !== null ? s.cells.get(ui.gsel) : null
  const stars = [...s.cells.values()].filter((c) => c.state === STATE.STAR || c.state === STATE.BLACK_HOLE)
  const inReach = stars.filter((c) => c.cell !== here && distance(here, c.cell) <= range)
  const fresh = inReach.filter((c) => !c.visited)
  const pick = (id) => {
    set({ gsel: id, open: true })
    stage?.centerOn(id)
  }
  if (!cell) {
    ui.course = null
    return (
      <div class="panel-body">
        <Section title="In reach" aside={`${inReach.length}`}>
          <div class="chips">
            {(fresh.length ? [...fresh, ...inReach.filter((c) => c.visited)] : inReach).slice(0, 14).map((c) => (
              <button key={c.cell} class="chip" onClick={() => pick(c.cell)}>
                <i class="dot" style={c.state === STATE.BLACK_HOLE ? { background: '#000', boxShadow: '0 0 0 1px #b79cff' } : c.visited ? { background: STAR_COLORS[game.traitsOf(c.cell).spectral] } : { boxShadow: `inset 0 0 0 1.5px ${STAR_COLORS[game.traitsOf(c.cell).spectral]}` }} />
                {game.starName(c.cell)}
                {!c.visited && <Tag tone="unknown">new</Tag>}
              </button>
            ))}
            {!inReach.length && <span class="dim">No charted star in reach. A scan may find more; so will more range.</span>}
            {s.cells.get(here)?.state === STATE.BLACK_HOLE && s.cells.get(here).partner > 0 && (
              <button class="chip" onClick={() => pick(s.cells.get(here).partner)}>
                <i class="dot" style={{ background: '#000', boxShadow: '0 0 0 1px #b79cff' }} />
                through to {game.starName(s.cells.get(here).partner)}
              </button>
            )}
          </div>
        </Section>
        <p class="lede">
          {stars.length} stars charted. Your engines reach <b>{range}</b> {range === 1 ? 'cell' : 'cells'} a jump. Open rings are stars nobody has visited: the first pilot there is its discoverer, and its scan charts the cells around it.
        </p>
        {[...s.ownedAt.keys()].length > 0 && (
          <Section title="Your planets are at">
            <div class="chips">
              {[...s.ownedAt.entries()].map(([c, n]) => (
                <button key={c} class="chip" onClick={() => pick(c)}>{game.starName(c)} <span class="num amber">{n}</span></button>
              ))}
            </div>
          </Section>
        )}
        <button class="ghost wide" onClick={() => stage?.centerOn(here)}>Centre on my ship</button>
      </div>
    )
  }
  const hole = cell.state === STATE.BLACK_HOLE
  const traits = game.traitsOf(cell.cell)
  const planets = hole ? [] : game.planetsOf(cell.cell)
  const course = plotCourse(s.cells, here, cell.cell, range)
  ui.course = course
  const steps = distance(here, cell.cell)
  const attacking = s.sieges.some((x) => x.attacker === s.account)
  return (
    <div class="panel-body">
      <div class="head">
        <i class="orb big" style={hole ? { background: '#000', boxShadow: '0 0 0 2px #b79cff' } : cell.visited ? { background: STAR_COLORS[traits.spectral], boxShadow: `0 0 18px ${STAR_COLORS[traits.spectral]}` } : { boxShadow: `inset 0 0 0 2px ${STAR_COLORS[traits.spectral]}` }} />
        <div class="grow">
          <h2>{game.starName(cell.cell)}</h2>
          <p class="lede">{hole ? 'Black hole' : `Class ${traits.spectral} star`} · {steps === 0 ? 'you are here' : `${steps} ${steps === 1 ? 'cell' : 'cells'} away`}</p>
        </div>
        {!cell.visited && <Tag tone="unknown">never visited</Tag>}
        <button class="ghost x" aria-label="Close" onClick={() => set({ gsel: null, course: null })}>×</button>
      </div>
      <div class="facts">
        <Fact label="Discovered by">{cell.cell === 0 ? 'Humanity' : cell.discoverer ? (cell.discoverer === s.account ? 'You' : s.callsigns[cell.discoverer] || 'a pilot') : 'nobody yet'}</Fact>
        <Fact label="Scan">{!cell.visited ? 'starts on arrival' : cell.scanned ? 'charted' : 'pending'}</Fact>
        {s.ownedAt.get(cell.cell) && <Fact label="Yours here"><span class="num amber">{s.ownedAt.get(cell.cell)}</span> planets</Fact>}
        {hole && cell.partner > 0 && <Fact label="Leads to">{game.starName(cell.partner)}</Fact>}
      </div>
      {!hole && (
        <Section title="Survey" aside={`${planets.length} worlds`}>
          <div class="survey">
            {planets.map((p, i) => (
              <span key={i} title={PLANET_TYPE_NAMES[p.class]}>
                <i class="orb" style={{ background: PLANET_COLORS[p.class], width: `${8 + Math.sqrt(p.size) * 2.2}px`, height: `${8 + Math.sqrt(p.size) * 2.2}px` }} />
                {PLANET_TYPE_NAMES[p.class]}
              </span>
            ))}
          </div>
        </Section>
      )}
      {steps === 0 ? (
        <button class="ghost wide" onClick={() => set({ tab: 'system', sel: null, open: false })}>View this system</button>
      ) : course ? (
        <Section title="Course" aside={`${course.length} ${course.length === 1 ? 'jump' : 'jumps'}`}>
          {course.length > 1 && <p class="lede">{course.map((leg) => game.starName(leg.to)).join(' → ')}</p>}
          <Commit primary label={course[0].kind === 'traverse' ? 'Go through the black hole' : `Jump to ${game.starName(course[0].to)}`} sub={`${course.length > 1 ? `leg 1 of ${course.length}` : !cell.visited ? 'you would be its discoverer' : 'one move'}${attacking ? ' · ends your siege' : ''}`} run={() => flyLeg(course[0])} />
        </Section>
      ) : (
        <p class="empty">No course with range {range}: the charted stars between here and there are too far apart. More range, or more charting, opens it.</p>
      )}
    </div>
  )
}
