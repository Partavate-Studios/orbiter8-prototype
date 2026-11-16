// The stage: one canvas behind the interface, drawing either the system the ship is in (an orrery)
// or the galaxy chart (the hex grid of charted stars). One draw loop, no per-object DOM. It reads the
// game's state and the store each frame, and reports taps as selections.
import { position, cellAt, disc, distance } from '@orbiter8/sdk/hex'
import { game, ui, set, bump } from '../store'
import { COLORS, STAR_COLORS, PLANET_COLORS } from '../palette'

const TAU = Math.PI * 2
const STATE = { EMPTY: 1, STAR: 2, BLACK_HOLE: 3 }
const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

export function createStage(canvas) {
  const ctx = canvas.getContext('2d')
  let w = 0
  let h = 0
  let dpr = 1
  /** The part of the canvas not covered by bars and sheets: the scene centres on it. */
  let free = { x: 0, y: 0, w: 0, h: 0 }
  const cams = { system: { zoom: 1, x: 0, y: 0 }, galaxy: { scale: 66, x: 0, y: 0 } }
  let hits = []
  let hover = null
  /** the ship's cell when the chart last checked it was in view */
  let chartedShip = null
  const t0 = performance.now()
  const traits = new Map()
  const glows = new Map()

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2)
    w = canvas.clientWidth
    h = canvas.clientHeight
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
  }
  new ResizeObserver(resize).observe(canvas)
  resize()

  const scene = () => (ui.tab === 'galaxy' ? 'galaxy' : 'system')
  const traitsOf = (cell) => {
    if (!traits.has(cell) && game.state.universe) traits.set(cell, game.traitsOf(cell))
    return traits.get(cell) ?? { spectral: 'G', size: 0.5, jitter: [0, 0] }
  }
  /** A soft glow, drawn once per colour and reused (gradients per star per frame cost phones dearly). */
  function glow(color) {
    if (!glows.has(color)) {
      const c = document.createElement('canvas')
      c.width = c.height = 96
      const g = c.getContext('2d')
      const grad = g.createRadialGradient(48, 48, 0, 48, 48, 48)
      grad.addColorStop(0, color)
      grad.addColorStop(0.18, color + 'cc')
      grad.addColorStop(0.45, color + '33')
      grad.addColorStop(1, color + '00')
      g.fillStyle = grad
      g.fillRect(0, 0, 96, 96)
      glows.set(color, c)
    }
    return glows.get(color)
  }
  const text = (s, x, y, color, size = 11, align = 'center') => {
    ctx.font = `${size}px ui-sans-serif, system-ui, sans-serif`
    ctx.textAlign = align
    ctx.fillStyle = color
    ctx.fillText(s, x, y)
  }
  function reticle(x, y, r, color) {
    ctx.strokeStyle = color
    ctx.lineWidth = 1.5
    for (let i = 0; i < 4; i++) {
      const a = (i * TAU) / 4 + TAU / 8
      ctx.beginPath()
      ctx.arc(x, y, r, a - 0.32, a + 0.32)
      ctx.stroke()
    }
  }
  function chevron(x, y, size, color, angle = -Math.PI / 2) {
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(angle)
    ctx.beginPath()
    ctx.moveTo(size, 0)
    ctx.lineTo(-size * 0.7, size * 0.62)
    ctx.lineTo(-size * 0.3, 0)
    ctx.lineTo(-size * 0.7, -size * 0.62)
    ctx.closePath()
    ctx.fillStyle = color
    ctx.fill()
    ctx.restore()
  }

  // ── the system ────────────────────────────────────────────────────────────────────────────────

  /** Where each planet of the current system is now, in orrery units (the star at 0, 0). */
  function orbitOf(index, id, t) {
    const radius = 2.3 + index * 1.2
    const angle = ((id * 2.399963) % TAU) + (reduced ? 0 : (t * 0.05) / Math.pow(index + 1, 0.9))
    return { radius, x: Math.cos(angle) * radius, y: Math.sin(angle) * radius * 0.94, angle }
  }

  function drawSystem(t) {
    const system = game.state.system
    if (!system) return
    const cam = cams.system
    const planets = Object.values(system.planets)
    const outer = 2.3 + Math.max(0, planets.length - 1) * 1.2 + 1.1
    const unit = (Math.min(free.w, free.h) / 2 / outer) * cam.zoom
    const cx = free.x + free.w / 2 + cam.x
    const cy = free.y + free.h / 2 + cam.y
    const me = game.state.account
    const selected = ui.tab === 'system' ? ui.sel : null

    // the star
    const hole = system.blackHole
    const color = hole ? COLORS.violet : STAR_COLORS[system.spectral] ?? STAR_COLORS.G
    const starR = Math.max(9, unit * (0.55 + system.starSize * 0.09))
    if (hole) {
      ctx.drawImage(glow(COLORS.violet), cx - starR * 3, cy - starR * 3, starR * 6, starR * 6)
      ctx.fillStyle = '#000'
      ctx.beginPath()
      ctx.arc(cx, cy, starR, 0, TAU)
      ctx.fill()
      ctx.strokeStyle = COLORS.violet
      ctx.lineWidth = 1.5
      ctx.stroke()
    } else {
      ctx.drawImage(glow(color), cx - starR * 4, cy - starR * 4, starR * 8, starR * 8)
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(cx, cy, starR, 0, TAU)
      ctx.fill()
    }
    hits.push({ x: cx, y: cy, r: starR + 6, type: 'star', id: system.id, name: system.starName })
    if (selected?.type === 'star') reticle(cx, cy, starR + 8, COLORS.cyan)
    text(system.starName, cx, cy - starR - 9, COLORS.dim, 11)

    const where = new Map()
    planets.forEach((p, index) => {
      const id = Number(p.id)
      const o = orbitOf(index, id, t)
      const x = cx + o.x * unit
      const y = cy + o.y * unit
      where.set(id, { x, y })
      // its orbit
      ctx.strokeStyle = COLORS.orbit
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.ellipse(cx, cy, o.radius * unit, o.radius * unit * 0.94, 0, 0, TAU)
      ctx.stroke()

      const r = Math.max(4, Math.min(unit * 0.42, 3.5 + Math.sqrt(p.size) * 1.9) * Math.sqrt(cam.zoom))
      const tone = PLANET_COLORS[p.class] ?? '#999'
      if (p.rings) {
        ctx.strokeStyle = tone + '99'
        ctx.lineWidth = Math.max(1.5, r * 0.22)
        ctx.beginPath()
        ctx.ellipse(x, y, r * 1.9, r * 0.6, -0.35, 0, TAU)
        ctx.stroke()
      }
      ctx.fillStyle = tone
      ctx.beginPath()
      ctx.arc(x, y, r, 0, TAU)
      ctx.fill()
      // night side: the half away from the star
      ctx.save()
      ctx.beginPath()
      ctx.arc(x, y, r, 0, TAU)
      ctx.clip()
      ctx.fillStyle = 'rgba(3,8,13,0.55)'
      ctx.beginPath()
      ctx.arc(x + Math.cos(o.angle) * r * 0.7, y + Math.sin(o.angle) * r * 0.7, r * 1.05, 0, TAU)
      ctx.fill()
      ctx.restore()

      // moons and the station
      Object.keys(p.moons).forEach((orbit, j) => {
        const a = t * (0.5 / (j + 1)) * (reduced ? 0 : 1) + j * 2.1 + id
        ctx.fillStyle = '#9fb2bf'
        ctx.beginPath()
        ctx.arc(x + Math.cos(a) * (r + 5 + j * 3.2), y + Math.sin(a) * (r + 5 + j * 3.2), 1.2, 0, TAU)
        ctx.fill()
      })
      if (p.hasStation) {
        const a = (reduced ? 0 : t * 0.22) + id * 1.3
        const sx = x + Math.cos(a) * (r + 9)
        const sy = y + Math.sin(a) * (r + 9)
        ctx.save()
        ctx.translate(sx, sy)
        ctx.rotate(Math.PI / 4)
        ctx.fillStyle = p.owner === me ? COLORS.amber : COLORS.text
        ctx.fillRect(-2.6, -2.6, 5.2, 5.2)
        ctx.restore()
      }
      // whose it is, and trouble
      if (p.owner && !p.federation) {
        ctx.strokeStyle = p.owner === me ? COLORS.amber : 'rgba(219,231,238,0.55)'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.arc(x, y, r + 3.5, -2.2, -0.9)
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(x, y, r + 3.5, 0.9, 2.2)
        ctx.stroke()
      }
      if (p.info?.siege) {
        ctx.strokeStyle = COLORS.red
        ctx.lineWidth = 1.5
        ctx.setLineDash([4, 4])
        ctx.lineDashOffset = reduced ? 0 : -t * 8
        ctx.beginPath()
        ctx.arc(x, y, r + 14, 0, TAU)
        ctx.stroke()
        ctx.setLineDash([])
      }
      const isSel = selected?.type === 'planet' && Number(selected.id) === id
      if (isSel) reticle(x, y, r + 12, COLORS.cyan)
      if (unit > 17 || isSel || hover?.id === id) text(p.name, x, y + r + 15, p.owner === me ? COLORS.amber : isSel ? COLORS.text : COLORS.dim, 10.5)
      hits.push({ x, y, r: Math.max(r + 8, 18), type: 'planet', id, name: p.name })
    })

    // ships: beside the planet they last traded at, else close around the star
    const around = new Map()
    for (const ship of Object.values(system.ships)) {
      const key = ship.orbit ?? 'star'
      const n = around.get(key) ?? 0
      around.set(key, n + 1)
      const at = where.get(Number(ship.orbit))
      const a = n * 0.9 + (reduced ? 0 : t * 0.12) + (at ? 0.6 : 0)
      const d = at ? 22 + n * 2 : starR + 16
      const x = (at?.x ?? cx) + Math.cos(a) * d
      const y = (at?.y ?? cy) + Math.sin(a) * d
      chevron(x, y, ship.owner === me ? 7 : 5, ship.owner === me ? COLORS.amber : COLORS.cyan + 'aa', a + Math.PI / 2)
    }
  }

  // ── the galaxy ────────────────────────────────────────────────────────────────────────────────

  function hexPath(x, y, r) {
    ctx.beginPath()
    for (let i = 0; i < 6; i++) {
      const a = Math.PI / 6 + (i * Math.PI) / 3
      ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * r, y + Math.sin(a) * r)
    }
    ctx.closePath()
  }
  /** A cell's place on the chart, in pixels: its grid point plus the star's own drift off it. */
  function place(cell, jitter = true) {
    const cam = cams.galaxy
    const [px, py] = position(cell)
    const [jx, jy] = jitter ? traitsOf(cell).jitter : [0, 0]
    return [free.x + free.w / 2 + (px + jx - cam.x) * cam.scale, free.y + free.h / 2 + (py + jy - cam.y) * cam.scale]
  }

  function drawGalaxy(t) {
    const s = game.state
    const cam = cams.galaxy
    const shipCell = s.pilot ? s.pilot.ship.cell : 0
    const range = s.pilot ? Math.max(1, s.pilot.ship.range - s.pilot.ship.rangeLost) : 1
    const hexR = cam.scale / Math.sqrt(3)
    const inView = (x, y, m = 40) => x > -m && y > -m && x < w + m && y < h + m

    // the ship moved (a jump, or through a black hole far into the void): if it left the free part
    // of the chart, the chart follows it
    if (s.pilot && shipCell !== chartedShip) {
      chartedShip = shipCell
      const [x, y] = place(shipCell, false)
      const m = 40
      if (x < free.x + m || x > free.x + free.w - m || y < free.y + m || y > free.y + free.h - m) stage.centerOn(shipCell)
    }

    // reach: every cell the engines could cross to
    if (s.pilot) {
      for (const cell of disc(shipCell, range)) {
        const [x, y] = place(cell, false)
        if (!inView(x, y)) continue
        hexPath(x, y, hexR - 1)
        ctx.fillStyle = 'rgba(111,211,255,0.045)'
        ctx.fill()
        ctx.strokeStyle = 'rgba(111,211,255,0.16)'
        ctx.lineWidth = 1
        ctx.stroke()
      }
    }
    // the charted void
    if (cam.scale > 22) {
      ctx.fillStyle = COLORS.orbit
      for (const c of s.cells.values()) {
        if (c.state !== STATE.EMPTY) continue
        const [x, y] = place(c.cell, false)
        if (inView(x, y)) ctx.fillRect(x - 1, y - 1, 2, 2)
      }
    }
    // black-hole pairs
    ctx.strokeStyle = COLORS.violet + '66'
    ctx.setLineDash([2, 6])
    for (const c of s.cells.values()) {
      if (c.state !== STATE.BLACK_HOLE || !c.partner || c.partner < c.cell) continue
      const [x1, y1] = place(c.cell)
      const [x2, y2] = place(c.partner)
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
    }
    ctx.setLineDash([])

    // the course
    const course = ui.course
    if (course?.length && !ui.jump) {
      ctx.strokeStyle = COLORS.amber
      ctx.lineWidth = 1.5
      ctx.setLineDash([6, 5])
      ctx.lineDashOffset = reduced ? 0 : -t * 10
      ctx.beginPath()
      ctx.moveTo(...place(shipCell))
      for (const leg of course) ctx.lineTo(...place(leg.to))
      ctx.stroke()
      ctx.setLineDash([])
    }

    for (const c of s.cells.values()) {
      if (c.state !== STATE.STAR && c.state !== STATE.BLACK_HOLE) continue
      const [x, y] = place(c.cell)
      if (!inView(x, y)) continue
      const tr = traitsOf(c.cell)
      const r = Math.max(2.2, (1.6 + tr.size * 4.2) * Math.min(1.6, cam.scale / 54))
      if (c.state === STATE.BLACK_HOLE) {
        ctx.fillStyle = '#000'
        ctx.beginPath()
        ctx.arc(x, y, r + 1, 0, TAU)
        ctx.fill()
        ctx.strokeStyle = COLORS.violet
        ctx.lineWidth = 1.5
        ctx.stroke()
      } else if (c.visited) {
        const color = STAR_COLORS[tr.spectral]
        ctx.drawImage(glow(color), x - r * 3.4, y - r * 3.4, r * 6.8, r * 6.8)
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(x, y, r, 0, TAU)
        ctx.fill()
      } else {
        // known to be there, never visited: whoever arrives first is its discoverer
        ctx.strokeStyle = STAR_COLORS[tr.spectral]
        ctx.lineWidth = 1.3
        ctx.beginPath()
        ctx.arc(x, y, r + 1, 0, TAU)
        ctx.stroke()
      }
      if (c.visited && !c.scanned) {
        // its scan is on its way: a sweep
        ctx.strokeStyle = COLORS.violet
        ctx.lineWidth = 2
        const a = reduced ? 0 : t * 3
        ctx.beginPath()
        ctx.arc(x, y, hexR * 0.9, a, a + 1.6)
        ctx.stroke()
      }
      const owned = s.ownedAt.get(c.cell)
      if (owned) {
        ctx.fillStyle = COLORS.amber
        for (let i = 0; i < Math.min(owned, 5); i++) ctx.fillRect(x - 2 + (i - (Math.min(owned, 5) - 1) / 2) * 6, y + r + 5, 4, 4)
      }
      if (c.cell === shipCell && s.sieges.length) {
        ctx.strokeStyle = COLORS.red
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.arc(x, y, r + 9, 0, TAU)
        ctx.stroke()
      }
      const named = s.names[c.cell]
      const isSel = ui.gsel === c.cell
      if (isSel) reticle(x, y, r + 9, COLORS.cyan)
      if ((named && cam.scale > 30) || isSel || hover?.id === c.cell)
        text(game.starName(c.cell), x, y + r + (owned ? 24 : 16), isSel ? COLORS.text : COLORS.dim, 10.5)
      hits.push({ x, y, r: Math.max(16, hexR * 0.8), type: 'cell', id: c.cell, name: game.starName(c.cell) })
    }

    // the ship: on its star, or on its way
    if (s.pilot) {
      let [x, y] = place(shipCell)
      if (ui.jump) {
        const [fx, fy] = place(ui.jump.from)
        const [tx, ty] = place(ui.jump.to)
        const k = reduced ? 1 : Math.min(1, (performance.now() - ui.jump.at) / 1400)
        const e = k * k * (3 - 2 * k)
        x = fx + (tx - fx) * e
        y = fy + (ty - fy) * e
        const angle = Math.atan2(ty - fy, tx - fx)
        ctx.strokeStyle = COLORS.amber + '88'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(fx, fy)
        ctx.lineTo(x, y)
        ctx.stroke()
        chevron(x, y, 7, COLORS.amber, angle)
      } else {
        chevron(x, y - 15, 6.5, COLORS.amber, Math.PI / 2)
      }
    }
  }

  // ── the loop ──────────────────────────────────────────────────────────────────────────────────

  function frame() {
    requestAnimationFrame(frame)
    if (document.hidden || !w) return
    const t = (performance.now() - t0) / 1000
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)
    hits = []
    if (!game.state.universe) return
    if (scene() === 'galaxy') drawGalaxy(t)
    else drawSystem(t)
    if (hover && !('ontouchstart' in window)) {
      const hit = hits.find((x) => x.type === hover.type && x.id === hover.id)
      if (hit) canvas.style.cursor = 'pointer'
    } else canvas.style.cursor = 'grab'
  }
  requestAnimationFrame(frame)

  // ── input ─────────────────────────────────────────────────────────────────────────────────────

  const pointers = new Map()
  let gesture = null
  const hitAt = (x, y) => {
    let best = null
    for (const hit of hits) {
      const d = Math.hypot(hit.x - x, hit.y - y)
      if (d <= hit.r && (!best || d < best.d)) best = { ...hit, d }
    }
    return best
  }
  function zoomBy(factor, x = free.x + free.w / 2, y = free.y + free.h / 2) {
    if (scene() === 'galaxy') {
      const cam = cams.galaxy
      const next = Math.max(10, Math.min(150, cam.scale * factor))
      // past the closest zoom, over the ship's own star: dive into the system
      if (cam.scale >= 150 && factor > 1.02 && game.state.pilot) return set({ tab: 'system' })
      const gx = cam.x + (x - free.x - free.w / 2) / cam.scale
      const gy = cam.y + (y - free.y - free.h / 2) / cam.scale
      cam.x = gx - (x - free.x - free.w / 2) / next
      cam.y = gy - (y - free.y - free.h / 2) / next
      cam.scale = next
    } else {
      const cam = cams.system
      // past the widest zoom: fall out to the galaxy, centred on this star
      if (cam.zoom <= 0.62 && factor < 0.98) {
        cam.zoom = 1
        cam.x = cam.y = 0
        stage.centerOn(game.state.system?.id ?? 0)
        return set({ tab: 'galaxy', gsel: null, course: null })
      }
      cam.zoom = Math.max(0.6, Math.min(5, cam.zoom * factor))
      if (cam.zoom <= 1) cam.x = cam.y = 0
    }
  }
  function panBy(dx, dy) {
    if (scene() === 'galaxy') {
      cams.galaxy.x -= dx / cams.galaxy.scale
      cams.galaxy.y -= dy / cams.galaxy.scale
    } else {
      cams.system.x += dx
      cams.system.y += dy
    }
  }
  /** Reads the chart around wherever the player has panned to. */
  let loadTimer = null
  function loadView() {
    clearTimeout(loadTimer)
    loadTimer = setTimeout(() => {
      if (scene() !== 'galaxy' || !game.state.universe) return
      game.loadAround(cellAt(cams.galaxy.x, cams.galaxy.y)).catch(() => {})
    }, 250)
  }

  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId)
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.size === 1) gesture = { x: e.clientX, y: e.clientY, at: performance.now(), moved: 0 }
    else gesture = { pinch: pinchSpan(), moved: 99 }
  })
  const pinchSpan = () => {
    const [a, b] = [...pointers.values()]
    return Math.hypot(a.x - b.x, a.y - b.y)
  }
  canvas.addEventListener('pointermove', (e) => {
    const p = pointers.get(e.pointerId)
    if (!p) {
      const hit = hitAt(e.clientX, e.clientY)
      const next = hit ? { type: hit.type, id: hit.id } : null
      if (next?.id !== hover?.id) hover = next
      return
    }
    const dx = e.clientX - p.x
    const dy = e.clientY - p.y
    p.x = e.clientX
    p.y = e.clientY
    if (pointers.size >= 2) {
      const span = pinchSpan()
      if (gesture?.pinch) zoomBy(span / gesture.pinch)
      gesture = { pinch: span, moved: 99 }
    } else if (gesture) {
      gesture.moved += Math.abs(dx) + Math.abs(dy)
      if (gesture.moved > 6) panBy(dx, dy)
    }
  })
  const up = (e) => {
    const tap = pointers.size === 1 && gesture && gesture.moved <= 6 && performance.now() - gesture.at < 500
    pointers.delete(e.pointerId)
    if (tap) select(hitAt(e.clientX, e.clientY))
    else loadView()
    if (!pointers.size) gesture = null
  }
  canvas.addEventListener('pointerup', up)
  canvas.addEventListener('pointercancel', (e) => pointers.delete(e.pointerId))
  canvas.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault()
      zoomBy(Math.exp(-e.deltaY * 0.0016), e.clientX, e.clientY)
      loadView()
    },
    { passive: false }
  )

  function select(hit) {
    if (ui.phase !== 'play' || !game.state.pilot) return
    if (scene() === 'galaxy') {
      stage.onPickStar?.(hit ? hit.id : null)
    } else if (hit) {
      set({ sel: { type: hit.type, id: hit.id }, open: true })
    } else {
      set({ sel: null, open: false })
    }
  }

  const stage = {
    onPickStar: null,
    setFree(rect) {
      free = rect
    },
    zoomBy,
    panBy(dx, dy) {
      panBy(dx, dy)
      loadView()
    },
    centerOn(cell) {
      const [x, y] = position(cell)
      cams.galaxy.x = x
      cams.galaxy.y = y
      loadView()
    },
    /** The stars on the chart nearest first from a cell, for stepping through with keys or a pad. */
    starsNear(cell) {
      return [...game.state.cells.values()]
        .filter((c) => c.state === STATE.STAR || c.state === STATE.BLACK_HOLE)
        .sort((a, b) => distance(cell, a.cell) - distance(cell, b.cell) || a.cell - b.cell)
        .map((c) => c.cell)
    },
    redraw: bump
  }
  return stage
}
