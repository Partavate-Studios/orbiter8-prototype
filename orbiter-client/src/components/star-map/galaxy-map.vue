<template>
  <!-- The galaxy map, the system view zoomed out (docs/demo4-plan.md section 8): the system's
       heliopause shrinks into its star while the neighbors fly in from the edges, over the same
       starfield, which pans with the map. The hex grid (the color study's look, Koda 2026-11-07), each
       charted star at its cell's center in its spectral class's color, your ship circling your star,
       your jump range, scans, sieges and black-hole partners. Hovering your star fans out every jump
       you can make; hovering a star in range draws its line. Regions load as you pan. -->
  <div
    class="galaxy-map"
    :style="{ '--space-center': MAP.spaceCenter, '--space-edge': MAP.spaceEdge }"
    @pointerdown="onDown"
    @pointermove="onMove"
    @pointerup="onUp"
    @pointercancel="onUp"
    @wheel="onWheel"
  >
    <svg class="map" :viewBox="`0 0 ${width} ${height}`">
      <!-- Charted space (Koda, 2026-11-07): a hex around every cell a scan has decided, star or empty;
           space nobody has scanned stays open, so the frontier shows. -->
      <path v-if="gridPath" :d="gridPath" fill="#2b0c50" fill-opacity="0.35" stroke="#4a2d7a" stroke-width="1" :opacity="gridOpacity" />
      <!-- your jump range: its cells, dashed in your yellow -->
      <path v-if="rangePath" :d="rangePath" fill="none" :stroke="MAP.route" stroke-opacity="0.35" stroke-width="1" stroke-dasharray="4 4" />
      <!-- stars that are yours to name (you discovered them and nobody owns them) or that you own:
           their hexes tinted and outlined in your yellow -->
      <path v-if="yoursPath" :d="yoursPath" :fill="MAP.route" fill-opacity="0.07" :stroke="MAP.route" stroke-opacity="0.55" stroke-width="1.3" :opacity="gridOpacity" />
      <!-- the system's heliopause, shrinking into its star as the map opens -->
      <circle
        v-if="opening < 1 && herePoint"
        :cx="herePoint.x"
        :cy="herePoint.y"
        :r="heliopauseRadius"
        fill="none"
        stroke="#ffffff"
        :stroke-opacity="0.85 * (1 - opening)"
        :stroke-width="10 * (1 - opening) + 1.5"
      />
      <!-- black holes and their partners -->
      <g v-for="link in partnerLinks" :key="'link' + link.key" class="link" @click.stop="followLink(link)">
        <line
          :x1="link.x1"
          :y1="link.y1"
          :x2="link.x2"
          :y2="link.y2"
          :stroke="MAP.partnerLink"
          :stroke-opacity="link.mine ? 0.8 : 0.45"
          :stroke-width="link.mine ? 1.8 : 1.2"
          stroke-dasharray="2 5"
        />
        <!-- a wider, invisible line to click -->
        <line :x1="link.x1" :y1="link.y1" :x2="link.x2" :y2="link.y2" stroke="transparent" stroke-width="14" />
      </g>
      <!-- jump lines: from your star to every star in range (hovering your star), or to one -->
      <line
        v-for="line in routeLines"
        :key="'route' + line.cell"
        :x1="line.x1"
        :y1="line.y1"
        :x2="line.x2"
        :y2="line.y2"
        :stroke="MAP.route"
        stroke-opacity="0.6"
        stroke-width="1.3"
        stroke-dasharray="5 5"
      />
      <g
        v-for="star in drawn"
        :key="star.cell"
        :transform="`translate(${star.x} ${star.y})`"
        class="star"
        :class="{ selected: star.cell === chosen }"
        @click.stop="choose(star.cell)"
        @pointerenter="hover = star.cell"
        @pointerleave="hover = hover === star.cell ? null : hover"
      >
        <circle v-if="star.here" :r="star.r + 7" fill="none" stroke="#ffffff" stroke-width="1.6" />
        <circle v-if="star.pending" :r="star.r + 4" class="scanning" />
        <!-- your planets here: a small yellow dot for each (up to four), arched over the star -->
        <circle
          v-for="(dot, i) in star.owned"
          :key="'own' + i"
          :cx="dot.x"
          :cy="dot.y"
          r="1.7"
          :fill="YELLOW_LIGHT"
          opacity="0.9"
        />
        <circle v-if="star.besieged" :r="star.r + 11" class="besieged" />
        <template v-if="star.blackHole">
          <circle :r="star.r + 1.5" class="hole-ring" />
          <circle :r="star.r" :fill="MAP.hole" />
        </template>
        <template v-else>
          <circle :r="star.r * 2.4" :fill="star.color" opacity="0.14" />
          <circle :r="star.r" :fill="star.color" :opacity="star.visited ? 1 : 0.7" />
        </template>
        <!-- the whole hex takes the pointer (a circle when the hexes are too small to aim at) -->
        <path v-if="scale > 30" :d="hexShape" fill="transparent" />
        <circle v-else :r="Math.max(star.r + 6, touch ? 18 : 12)" fill="transparent" />
        <text :y="star.r + 13" class="name" :style="{ fontSize: star.label.size + 'px' }">{{ star.label.text }}</text>
      </g>
      <!-- your ship, circling your star (racing round while a jump waits for the wallet); placed every frame -->
      <g ref="ship" class="ship" display="none">
        <g transform="scale(2.1)"><fleet-ship type="orbiter8" :engines="true" /></g>
      </g>
    </svg>

    <!-- the hovered star: its name and where it stands, beside the pointer -->
    <div v-if="tip" class="tip" :style="{ left: tip.x + 'px', top: tip.y + 'px' }">
      <b>{{ tip.name }}</b>
      <i>{{ tip.note }}</i>
    </div>

    <header class="title">
      <h2>Galaxy Map</h2>
      <p v-if="touch">
        Tap a star for its path; tap your star for every jump you can make ({{ range }}
        {{ range === 1 ? 'step' : 'steps' }}). Drag to look around.
      </p>
      <p v-else>
        Hover your star to see every jump you can make ({{ range }} {{ range === 1 ? 'step' : 'steps' }}). Drag to look
        around.
      </p>
      <p v-if="scanningNow" class="scanning-now">{{ scanningNow }}</p>
    </header>

    <!-- The chosen star's card, in the frame the in-game dialog and the tech tree use (game-dialog.vue) -->
    <aside v-if="chosen !== null" class="card" :style="chosenTheme">
      <div class="inside">
      <h3 class="pill">{{ chosenName }}</h3>
      <p class="sub">{{ chosenKind }} · {{ distanceAway }} {{ distanceAway === 1 ? 'step' : 'steps' }} away</p>
      <p v-if="chosenCell?.discoverer" class="sub">Discovered by {{ discovererName }}</p>
      <p v-if="isPartnerHere && chosen !== shipCell" class="sub">The far side of the black hole you're at.</p>
      <p v-else-if="isPartnerHere" class="sub">You're at this black hole. Its far side: {{ nameOf(partnerHere) }}.</p>
      <p v-if="scanWords" class="scan">{{ scanWords }}</p>
      <p v-if="besieged" class="alert">A siege is under way here.</p>
      <p v-if="failed" class="alert">That didn't go through: the transaction tray says why.</p>
      <div class="actions">
        <button v-if="isPartnerHere" class="card-pill accent" :disabled="waiting" @click="enterBlackHole">
          {{ waiting ? 'Entering…' : 'Enter the black hole' }}
        </button>
        <button v-else-if="canJump" class="card-pill accent" :disabled="waiting" @click="jump">
          {{ waiting ? 'Waiting for the jump…' : 'Jump to ' + chosenName }}
        </button>
        <p v-else-if="distanceAway > range" class="sub">Out of range: upgrade the engines at a shipyard.</p>
        <button class="card-pill" :disabled="waiting" @click="choose(null)">Cancel</button>
      </div>
      </div>
    </aside>

    <footer class="controls">
      <button class="card-pill back" :disabled="waiting" @click="back">Back to {{ hereName }}</button>
      <button class="card-pill" @click="centerOnShip">My ship</button>
    </footer>
  </div>
</template>

<script>
import { mapActions } from 'pinia'
import { game } from '@/sdk/client'
import { STATE } from '@/sdk/client'
import { MAP, YELLOW_LIGHT } from '@/libs/palette'
import { position, cellAt, distance, neighbors } from '@/sdk/hex'
import { CARD_THEMES } from '@/libs/card-theme'
import { fitText } from '@/libs/fit-text'
import { timeOf } from '@/sdk/drand'
import { usePlayerStore } from '@/stores/player'
import { useGameStateStore } from '@/stores/gamestate'
import { useUIStore } from '@/stores/ui'
import { onFrame, FRAME_ORDER } from '@/libs/frame-loop'
import { writeAttribute } from '@/libs/dom-writes'
import { HELIOPAUSE_RADIUS, WORLD_OFFSET_Y } from '@/constants'
import FleetShip from '@/components/assets/fleet-ship.svg'

// Pixels between neighboring stars at zoom 1. The grid is regular, as in the color study (no squash).
const SPACING = 64
const FLAT = 1
const ROOT3 = Math.sqrt(3)
// A cell's hex: pointy-topped, its corners 1/√3 of a cell from its center, so neighbors share edges.
const HEX_R = 1 / ROOT3
/** A pointy-topped hex of radius r centered on (cx, cy), in screen pixels. */
const hexPath = (cx, cy, r) =>
  [0, 1, 2, 3, 4, 5]
    .map((i) => {
      const a = (Math.PI / 3) * i + Math.PI / 6
      return `${i ? 'L' : 'M'}${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`
    })
    .join('') + 'Z'
// The opening: the heliopause shrinks into the star and the neighbors fly in, over ENTER_MS, from
// FLY_IN times farther out (the old neighbor view's entrance).
const ENTER_MS = 1300
const FLY_IN = 3.5
// The ship's orbit around your star: a lap every ORBIT_SECONDS, RACING_SECONDS while a jump waits.
const ORBIT_SECONDS = 7
const RACING_SECONDS = 0.9
const ORBIT_GAP = 16
// The background's stars shift this share of the map's own movement (its parallax, as in the system).
const BACKGROUND_SHARE = 0.22
const BACKGROUND_PARALLAX = 20 // background-canvas.vue PARALLAX
const MAX_ZOOM = 3
const MIN_ZOOM = 0.15
const easeOut = (t) => 1 - Math.pow(1 - t, 3)
/** Up to four dots in an arc over a star of radius r: one for each of your planets there. */
const ownedDots = (count, r) => {
  const n = Math.min(4, count)
  return Array.from({ length: n }, (_, i) => {
    const a = -Math.PI / 2 + (i - (n - 1) / 2) * 0.42
    return { x: Math.cos(a) * (r + 11.5), y: Math.sin(a) * (r + 11.5) }
  })
}

export default {
  name: 'GalaxyMap',
  components: { FleetShip },
  data() {
    return {
      player: usePlayerStore(),
      width: window.innerWidth,
      height: window.innerHeight,
      camera: { x: 0, y: 0, zoom: 1.5 },
      /** one pointer's drag: where it started and the camera then; two pointers' pinch: the zoom and the world point between them */
      drag: null,
      pinch: null,
      chosen: null,
      preview: null,
      waiting: false,
      failed: false,
      now: Date.now(),
      /** the star under the pointer, and where the pointer is (for the tooltip) */
      hover: null,
      /** no hover: a touch screen (the hint says to tap) */
      touch: window.matchMedia?.('(hover: none)').matches ?? false,
      pointer: { x: 0, y: 0 },
      YELLOW_LIGHT,
      /** the opening, 0 to 1: the heliopause shrinking, the neighbors flying in */
      opening: 0,
      MAP
    }
  },
  computed: {
    client() {
      return game.state
    },
    scale() {
      return SPACING * this.camera.zoom
    },
    shipCell() {
      return this.player.ship?.cell ?? 0
    },
    range() {
      const ship = this.player.ship
      return ship ? Math.max(1, ship.range - ship.rangeLost) : 1
    },
    /** A hex the size of one cell, around (0, 0): a star's pointer area. */
    hexShape() {
      return hexPath(0, 0, HEX_R * this.scale)
    },
    /** Every decided cell on screen (star, black hole or empty) as one path of hexes. */
    gridPath() {
      void this.player.cellsVersion
      if (this.scale < 12) return null
      const r = HEX_R * this.scale
      let d = ''
      for (const c of this.client.cells.values()) {
        if (c.state === STATE.UNDECIDED || c.state === undefined) continue
        const [x, y] = this.project(c.cell)
        if (x < -r || y < -r || x > this.width + r || y > this.height + r) continue
        d += hexPath(x, y, r)
      }
      return d || null
    },
    /** Your stars' hexes: the ones you own, or discovered while nobody owns them. */
    yoursPath() {
      void this.player.cellsVersion
      if (this.scale < 12) return null
      const me = this.player.account
      const r = HEX_R * this.scale
      let d = ''
      for (const c of this.client.cells.values()) {
        if (c.state !== STATE.STAR) continue
        if (!(c.keeper === me || (!c.keeper && c.discoverer === me))) continue
        const [x, y] = this.project(c.cell)
        if (x < -r || y < -r || x > this.width + r || y > this.height + r) continue
        d += hexPath(x, y, r)
      }
      return d || null
    },
    /** The grid fades in as the cells grow big enough to read, and with the opening. */
    gridOpacity() {
      return Math.min(1, (this.scale - 12) / 24) * (0.35 + 0.65 * this.opening)
    },
    /** Your jump range's cells as one path (at most a few dozen). */
    rangePath() {
      if (this.opening < 1) return null
      const cells = []
      const here = this.shipCell
      const near = new Set([here])
      let frontier = [here]
      for (let step = 0; step < this.range; step++) {
        const next = []
        for (const cell of frontier) for (const n of neighbors(cell)) if (!near.has(n)) (near.add(n), next.push(n))
        frontier = next
      }
      for (const cell of near) if (cell !== here) cells.push(cell)
      return cells
        .map((cell) => {
          const [x, y] = this.project(cell)
          return hexPath(x, y, HEX_R * this.scale)
        })
        .join('')
    },
    /** The heliopause's radius on screen: as big as the system showed it, shrinking to the star. */
    heliopauseRadius() {
      const star = this.points.get(this.shipCell)
      const end = star ? star.r + 7 : 10
      return end + (this.heliopauseStart - end) * (1 - easeOut(this.opening))
    },
    drawn() {
      void this.player.cellsVersion
      const seed = this.client.universe?.seed
      if (!seed) return []
      const out = []
      for (const c of this.client.cells.values()) {
        if (c.state !== STATE.STAR && c.state !== STATE.BLACK_HOLE) continue
        const traits = game.traitsOf(c.cell)
        const [x, y] = this.project(c.cell)
        if (x < -40 || y < -40 || x > this.width + 40 || y > this.height + 40) continue
        const steps = distance(this.shipCell, c.cell)
        out.push({
          cell: c.cell,
          x,
          y,
          r: (2.5 + traits.size * 5) * Math.min(1.6, Math.max(0.6, this.camera.zoom)),
          color: traits.color,
          blackHole: c.state === STATE.BLACK_HOLE,
          visited: c.visited,
          pending: c.visited && !c.scanned,
          here: c.cell === this.shipCell,
          reachable: steps > 0 && steps <= this.range,
          besieged: this.player.besiegedCells.has(c.cell),
          owned: ownedDots(this.client.ownedAt?.get(c.cell) ?? 0, (2.5 + traits.size * 5) * Math.min(1.6, Math.max(0.6, this.camera.zoom))),
          name: this.nameOf(c.cell),
          // a long name shrunk or cut, so it doesn't run into its neighbors' (libs/fit-text.js)
          label: fitText(this.nameOf(c.cell), 11, Math.min(96, this.scale * 0.95))
        })
      }
      return out
    },
    /** Screen points of the drawn stars, by cell. */
    points() {
      return new Map(this.drawn.map((star) => [star.cell, star]))
    },
    /** The ship's star on screen (drawn or not), at its cell's center. */
    herePoint() {
      if (!this.client.universe) return null
      const [x, y] = this.project(this.shipCell)
      return { x, y }
    },
    /** As in the prototype: hovering your star fans out to every star in range; hovering (or choosing) one in range draws its line. */
    routeLines() {
      const from = this.herePoint
      if (!from) return []
      const reachable = this.drawn.filter((star) => star.reachable)
      let targets = []
      if (this.hover === this.shipCell) targets = reachable
      else {
        const one = reachable.find((star) => star.cell === this.hover) ?? reachable.find((star) => star.cell === this.chosen)
        if (one) targets = [one]
      }
      return targets.map((star) => ({ cell: star.cell, x1: from.x, y1: from.y, x2: star.x, y2: star.y }))
    },
    /** Black holes on screen joined to their partners (the partner may be off screen: the line runs off the edge). */
    partnerLinks() {
      const seed = this.client.universe?.seed
      if (!seed) return []
      const links = []
      for (const star of this.drawn) {
        if (!star.blackHole) continue
        const partner = this.client.cells.get(star.cell)?.partner
        if (!partner || (this.points.has(partner) && partner < star.cell)) continue // each pair once
        const [x2, y2] = this.project(partner)
        links.push({ key: star.cell, a: star.cell, b: partner, mine: star.cell === this.shipCell || partner === this.shipCell, x1: star.x, y1: star.y, x2, y2 })
      }
      return links
    },

    partnerHere() {
      return this.client.cells.get(this.shipCell)?.partner ?? null
    },
    /** The hovered star's name and where it stands. */
    tip() {
      // A mouse thing: on touch the tapped star's card names it, and there's no pointer to sit beside.
      if (this.touch || this.hover === null || this.drag?.moved) return null
      const c = this.client.cells.get(this.hover)
      if (!c) return null
      const steps = distance(this.shipCell, this.hover)
      const inRange = steps > 0 && steps <= this.range
      let note
      if (this.hover === this.shipCell) note = 'you are here'
      else if (c.state === STATE.BLACK_HOLE)
        note = this.isPartnerOf(this.hover) ? 'the far side of this black hole' : inRange ? 'black hole · in range' : 'black hole'
      else if (c.visited) note = inRange ? 'visited · in range' : 'visited'
      else note = inRange ? 'unsurveyed · in range' : 'unsurveyed'
      const me = this.player.account
      if (c.state === STATE.STAR && (c.keeper === me || (!c.keeper && c.discoverer === me))) note += c.keeper === me ? ' · your star' : ' · yours to name'
      const mine = this.client.ownedAt?.get(this.hover) ?? 0
      if (mine) note += ` · ${mine} of your planets`.replace('1 of your planets', 'your planet')
      // Beside the pointer, flipped near the edges.
      const x = this.pointer.x + 16 + 200 > this.width ? this.pointer.x - 216 : this.pointer.x + 16
      const y = this.pointer.y + 16 + 60 > this.height ? this.pointer.y - 76 : this.pointer.y + 16
      return { name: this.nameOf(this.hover), note, x, y }
    },
    /** The chosen star is the black hole the ship is at, or its partner: offer to go through. */
    isPartnerHere() {
      if (this.chosen === null) return false
      const here = this.client.cells.get(this.shipCell)
      return here?.state === STATE.BLACK_HOLE && (this.chosen === here.partner || this.chosen === this.shipCell)
    },

    hereName() {
      return this.nameOf(this.shipCell)
    },
    chosenCell() {
      void this.player.cellsVersion
      return this.chosen === null ? null : (this.client.cells.get(this.chosen) ?? null)
    },
    chosenName() {
      return this.nameOf(this.chosen)
    },
    chosenKind() {
      if (this.chosenCell?.state === STATE.BLACK_HOLE) return 'Black hole'
      return this.chosen === 0 ? 'Home star' : 'Star'
    },
    /** The chosen star's card colors, as CSS variables (see .card). */
    chosenTheme() {
      if (this.chosen === null) return null
      const theme = this.chosenCell?.state === STATE.BLACK_HOLE ? CARD_THEMES.blackHole : CARD_THEMES['star-' + game.traitsOf(this.chosen).spectral]
      if (!theme) return null
      return { '--card-mid': theme.mid, '--card-deep': theme.deep, '--card-stroke': theme.stroke }
    },
    distanceAway() {
      return distance(this.shipCell, this.chosen)
    },
    canJump() {
      return this.distanceAway > 0 && this.distanceAway <= this.range
    },
    /** The pilot's scan in progress: "Scanning Lulin-851… 23 s", or null. */
    scanningNow() {
      const scan = this.player.scan
      if (!scan) return null
      const where = this.nameOf(scan.cell)
      if (scan.status === 'due') return `Recording the scan of ${where}…`
      const seconds = Math.max(0, Math.ceil((scan.readyAt - this.now) / 1000))
      return seconds > 0 ? `Scanning ${where}… ${seconds} s` : `Scanning ${where}…`
    },
    besieged() {
      return this.player.besiegedCells.has(this.chosen)
    },
    discovererName() {
      const who = this.chosenCell.discoverer
      if (who === this.player.account) return 'you'
      return game.callsignOf(who) ?? who.slice(0, 6) + '…' + who.slice(-4)
    },
    scanWords() {
      const c = this.chosenCell
      if (!c || !c.visited || c.scanned) return null
      if (!this.preview) return 'Long-range scan in progress…'
      if (!this.preview.stars && !this.preview.holes)
        return "Long-range scan: nothing new nearby. It's recorded with your next move."
      const holes = this.preview.holes ? ` and ${this.preview.holes} black hole${this.preview.holes === 1 ? '' : 's'}` : ''
      return `Long-range scan: ${this.preview.stars} new ${this.preview.stars === 1 ? 'star' : 'stars'}${holes} found. It's recorded with your next move.`
    }
  },
  created() {
    // Pointers down on the map (id → position). Not reactive.
    this.pointers = new Map()
  },
  mounted() {
    this.onResize = () => {
      this.width = window.innerWidth
      this.height = window.innerHeight
    }
    window.addEventListener('resize', this.onResize)
    this.seconds = setInterval(() => (this.now = Date.now()), 1000)
    this.centerOnShip()
    game.loadAround(this.shipCell)
    // The opening carries on the system view's zoom: the heliopause starts as big as the system drew
    // it, where it drew it (the world sits a little above the screen's center), and shrinks into the
    // star while the camera pulls out from FLY_IN times closer to the zoom that frames your range.
    const ui = useUIStore()
    this.heliopauseStart = (HELIOPAUSE_RADIUS * ui.groupPixels) / ui.viewport.scale
    this.startShift = WORLD_OFFSET_Y * ui.groupPixels
    this.zoomEnd = this.framingZoom()
    this.camera.zoom = Math.min(MAX_ZOOM * 2, this.zoomEnd * FLY_IN)
    this.zoomStart = this.camera.zoom
    this.openedAt = performance.now()
    this.orbit = { angle: -Math.PI / 2 - 0.3, speed: (2 * Math.PI) / ORBIT_SECONDS }
    this.stopFrames = onFrame(this.onFrame, FRAME_ORDER.render)
  },
  unmounted() {
    window.removeEventListener('resize', this.onResize)
    clearTimeout(this.timer)
    clearInterval(this.seconds)
    this.stopFrames?.()
    useUIStore().galaxyPan = { x: 0, y: 0 }
  },
  methods: {
    ...mapActions(useUIStore, ['exitNeighborView', 'zoomInToStar']),
    ...mapActions(useGameStateStore, ['moveToSystem', 'traverseBlackHole']),
    nameOf(cell) {
      if (cell === null) return ''
      void this.player.cellsVersion
      return game.starName(cell)
    },
    project(cell) {
      const [x, y] = position(cell)
      // (During the opening, the view drifts from where the system showed its star to the center.)
      const shift = (this.startShift ?? 0) * (1 - easeOut(this.opening))
      return [this.width / 2 + (x - this.camera.x) * this.scale, this.height / 2 + shift + (y - this.camera.y) * this.scale * FLAT]
    },
    /** The zoom at which your jump range, and a ring beyond it, fills a good part of the screen. */
    framingZoom() {
      const rings = this.range + 1.5
      // (a phone's narrow screen gets more of its width)
      const across = this.width < 600 ? 0.47 : 0.36
      const fit = Math.min((0.36 * this.height) / (rings * SPACING * (ROOT3 / 2)), (across * this.width) / (rings * SPACING))
      return Math.min(MAX_ZOOM, Math.max(0.6, fit))
    },
    /**
     * Each frame: the opening's progress and zoom, the ship's place on its orbit, and the background's
     * parallax. The ship is placed by writing its transform, so Vue doesn't re-render for it.
     */
    onFrame(now) {
      if (this.opening < 1) {
        this.opening = Math.min(1, (now - this.openedAt) / ENTER_MS)
        const t = easeOut(this.opening)
        this.camera.zoom = this.zoomStart * Math.pow(this.zoomEnd / this.zoomStart, t)
      }
      const seconds = this.lastFrame ? Math.min(0.1, (now - this.lastFrame) / 1000) : 0
      this.lastFrame = now
      const target = (2 * Math.PI) / (this.waiting ? RACING_SECONDS : ORBIT_SECONDS)
      this.orbit.speed += (target - this.orbit.speed) * Math.min(1, seconds * 2.5)
      this.orbit.angle += this.orbit.speed * seconds
      const center = this.herePoint
      const star = this.points.get(this.shipCell)
      if (center && star) {
        const reveal = easeOut(this.opening)
        const radius = (star.r + ORBIT_GAP) * reveal
        const x = center.x + radius * Math.cos(this.orbit.angle)
        const y = center.y + radius * Math.sin(this.orbit.angle)
        // Nose along the orbit (the art points up; angles grow clockwise on screen).
        const heading = (this.orbit.angle * 180) / Math.PI + 180
        writeAttribute(this.$refs.ship, 'display', reveal > 0.05 ? 'inline' : 'none')
        writeAttribute(this.$refs.ship, 'transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${heading.toFixed(1)}) scale(${reveal.toFixed(3)})`)
      }
      // The starfield pans with the map, a share of its movement, as it does under the system.
      const [hx, hy] = position(this.shipCell)
      const unit = useUIStore().screenSize.height / useUIStore().viewport.resolution || 1
      const k = (BACKGROUND_SHARE * BACKGROUND_PARALLAX * this.scale) / unit
      const pan = useUIStore().galaxyPan
      // (The system's camera is the world's offset; this camera is a position: hence the sign.)
      const px = Math.round((hx - this.camera.x) * k)
      const py = Math.round((hy - this.camera.y) * k)
      if (pan.x !== px || pan.y !== py) useUIStore().galaxyPan = { x: px, y: py }
    },
    centerOnShip() {
      const [x, y] = position(this.shipCell)
      this.camera.x = x
      this.camera.y = y
    },
    choose(cell) {
      if (this.waiting) return
      this.o8audio.playEffect('click')
      this.chosen = cell
      this.failed = false
      this.preview = null
      this.loadPreview()
    },
    /** A pending scan's outcome once its drand round is out (polling until then). */
    async loadPreview() {
      clearTimeout(this.timer)
      const c = this.chosenCell
      if (!c || !c.visited || c.scanned) return
      const wait = timeOf(c.scanRound) * 1000 - Date.now()
      if (wait > 0) {
        this.timer = setTimeout(() => this.loadPreview(), wait + 1500)
        return
      }
      const outcome = await game.previewScan(c.cell)?.catch(() => null)
      if (!outcome) {
        this.timer = setTimeout(() => this.loadPreview(), 3000)
        return
      }
      // Only what this scan charts for the first time.
      const fresh = neighbors(c.cell)
        .map((n, i) => [this.client.cells.get(n)?.state ?? STATE.UNDECIDED, outcome.states[i]])
        .filter(([before]) => before === STATE.UNDECIDED)
        .map(([, after]) => after)
      this.preview = {
        stars: fresh.filter((s) => s === STATE.STAR).length,
        holes: fresh.filter((s) => s === STATE.BLACK_HOLE).length
      }
    },
    /** Clicking a black hole's link: choose its far end (from here, the far side) and fly the view there. */
    followLink(link) {
      const target = link.a === this.shipCell ? link.b : link.b === this.shipCell ? link.a : link.b
      const [x, y] = position(target)
      this.camera.x = x
      this.camera.y = y
      game.loadAround(target)
      this.choose(target)
    },
    isPartnerOf(cell) {
      const here = this.client.cells.get(this.shipCell)
      return here?.state === STATE.BLACK_HOLE && here.partner === cell
    },
    /** Through the black hole to its partner, with the ship stretching into it (black-hole-entry.vue). */
    async enterBlackHole() {
      this.o8audio.playEffect('click')
      this.waiting = true
      const through = await this.traverseBlackHole()
      this.waiting = false
      if (through) this.exitNeighborView()
      else this.failed = true
    },
    /** Waits for the wallet (or the session key); the jump animation starts once the move is sent. */
    async jump() {
      this.o8audio.playEffect('click')
      this.waiting = true
      const jumped = await this.moveToSystem(this.chosen)
      this.waiting = false
      if (jumped) this.exitNeighborView()
      else this.failed = true
    },
    back() {
      this.o8audio.playEffect('click')
      this.zoomInToStar()
    },
    /** The galaxy's point (in cells) under a screen point, for the camera as it is. */
    worldAt(sx, sy) {
      return { x: this.camera.x + (sx - this.width / 2) / this.scale, y: this.camera.y + (sy - this.height / 2) / (this.scale * FLAT) }
    },
    /** Zooms to `zoom` keeping the galaxy point `world` under the screen point (sx, sy). */
    zoomTo(zoom, world, sx, sy) {
      this.opening = 1
      this.camera.zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom))
      this.camera.x = world.x - (sx - this.width / 2) / this.scale
      this.camera.y = world.y - (sy - this.height / 2) / (this.scale * FLAT)
    },
    onDown(event) {
      if (event.target.closest('.card, .controls, .title')) return
      this.opening = 1
      this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
      this.startGesture()
      // Two fingers are never a tap: hold both pointers, so the pinch carries on past the stars.
      if (this.pinch) for (const id of this.pointers.keys()) this.$el.setPointerCapture?.(id)
    },
    /** One pointer drags; two pinch, the point between the fingers staying between them. */
    startGesture() {
      const points = [...this.pointers.values()]
      this.drag = this.pinch = null
      if (points.length === 1) {
        this.drag = { x: points[0].x, y: points[0].y, cx: this.camera.x, cy: this.camera.y, moved: false }
      } else if (points.length === 2) {
        const mid = { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 }
        this.pinch = {
          distance: Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y) || 1,
          zoom: this.camera.zoom,
          world: this.worldAt(mid.x, mid.y)
        }
      }
    },
    onMove(event) {
      this.pointer = { x: event.clientX, y: event.clientY }
      if (!this.pointers.has(event.pointerId)) return
      this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
      if (this.pinch) {
        const [a, b] = [...this.pointers.values()]
        const distance = Math.hypot(a.x - b.x, a.y - b.y) || 1
        this.zoomTo((this.pinch.zoom * distance) / this.pinch.distance, this.pinch.world, (a.x + b.x) / 2, (a.y + b.y) / 2)
        return
      }
      if (!this.drag) return
      const dx = event.clientX - this.drag.x
      const dy = event.clientY - this.drag.y
      if (!this.drag.moved && Math.hypot(dx, dy) > 4) {
        this.drag.moved = true
        // A drag, not a tap: hold the pointer so the drag carries on outside the map.
        this.$el.setPointerCapture?.(event.pointerId)
      }
      this.camera.x = this.drag.cx - dx / this.scale
      this.camera.y = this.drag.cy - dy / (this.scale * FLAT)
    },
    onUp(event) {
      if (!this.pointers.delete(event.pointerId)) return
      const moved = this.drag?.moved || Boolean(this.pinch)
      if (this.pointers.size) {
        // A finger lifted mid-pinch: the other carries on as a drag.
        this.startGesture()
        if (this.drag) this.drag.moved = true
      } else {
        this.drag = this.pinch = null
      }
      if (moved && !this.pointers.size) game.loadAround(cellAt(this.camera.x, this.camera.y))
    },
    onWheel(event) {
      if (event.target.closest('.card')) return
      event.preventDefault()
      event.stopPropagation()
      const factor = event.deltaY > 0 ? 1 / 1.15 : 1.15
      // Zooming in past the closest view, at your star: back into the system (the way you came out).
      if (factor > 1 && this.camera.zoom >= MAX_ZOOM * 0.999 && distance(cellAt(this.camera.x, this.camera.y), this.shipCell) <= 1) {
        this.back()
        return
      }
      // Like a map: the spot under the cursor stays put.
      this.zoomTo(this.camera.zoom * factor, this.worldAt(event.clientX, event.clientY), event.clientX, event.clientY)
      game.loadAround(cellAt(this.camera.x, this.camera.y))
    }
  }
}
</script>

<style scoped>
.galaxy-map {
  position: fixed;
  inset: 0;
  z-index: 50;
  overflow: hidden;
  /* no background of its own: the system view's starfield (background-canvas.vue) is the map's too */
  color: #e6dcf5;
  font-family: Ubuntu, sans-serif;
  touch-action: none;
  user-select: none;
}
.map {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.star {
  cursor: pointer;
}
.name {
  fill: #e6dcf5aa;
  font-size: 11px;
  text-anchor: middle;
  pointer-events: none;
}
/* A long star name doesn't stretch the button off a phone */
.card-pill.back {
  max-width: 15em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.selected .name {
  fill: #ffffff;
}
.selected .reach,
.selected .scanning {
  stroke: #ffffff;
}
.scanning {
  fill: none;
  stroke: var(--o8-yellow-light);
  stroke-width: 1.5;
  stroke-dasharray: 4 4;
}
.besieged {
  fill: none;
  stroke: var(--o8-pink-light);
  stroke-width: 2;
  stroke-dasharray: 3 3;
}
.link {
  cursor: pointer;
}
.hole-ring {
  fill: none;
  stroke: #ffe28a; /* a black hole's accretion glow (libs/palette.js STAR_CLASSES.G.mid) */
  stroke-width: 1.5;
}
.ship {
  pointer-events: none;
}
.title {
  position: absolute;
  top: 24px;
  left: 0;
  right: 0;
  text-align: center;
  pointer-events: none;
}
.title h2 {
  margin: 0;
  font-weight: 400;
  font-size: 1.5em;
  color: #ffffff88;
}
.title p {
  margin: 0.3em 0 0;
  font-size: 0.85em;
  color: #c3b3da;
}
.title .scanning-now {
  color: var(--o8-yellow-light);
}
/* In the chosen star's card colors (libs/card-theme.js), as the game's cards: its spectral class,
   or a black hole's amber; purple until set. */
.card {
  position: absolute;
  left: 50%;
  bottom: 96px;
  transform: translateX(-50%);
  width: min(92vw, 24em);
  box-sizing: border-box;
  padding: 3px;
  border-radius: 40px / 9px;
  background: linear-gradient(
    135deg,
    var(--card-mid, #5c1aae) 0%,
    var(--card-deep, #280b4b) 10%,
    var(--card-mid, #5c1aae) 50%,
    var(--card-deep, #280b4b) 90%,
    var(--card-mid, #5c1aae) 100%
  );
  box-shadow: 0 1.2em 3em #0009;
  text-align: left;
}
.card .card-pill:not(.accent) {
  border-color: var(--card-stroke, #5b1aaa);
  background: linear-gradient(135deg, var(--card-mid, #5c1aae) 0%, var(--card-deep, #280b4b) 50%, var(--card-mid, #5c1aae) 100%);
}
.card .inside {
  padding: 0.5em 1.2em 1em;
  border: 1px solid var(--card-stroke, #5b1aaa);
  border-radius: 38px / 8px;
  background: #1d1926e6;
}
.card .pill {
  margin: 0 -0.6em 0.3em;
  padding: 0.25em 1em;
  border: 1px solid var(--card-stroke, #5b1aaa);
  border-radius: 40px / 12px;
  background: linear-gradient(
    135deg,
    var(--card-mid, #5c1aae) 0%,
    var(--card-deep, #280b4b) 10%,
    var(--card-mid, #5c1aae) 50%,
    var(--card-deep, #280b4b) 90%,
    var(--card-mid, #5c1aae) 100%
  );
  color: #ffffff;
  font-size: 1.05em;
  font-weight: normal;
  text-align: center;
  text-shadow: 0 1px 3px #000a;
}
.card p {
  margin: 0.3em 0;
}
.sub {
  color: #c3b3da;
  font-size: 0.85em;
}
.scan {
  color: var(--o8-yellow-light);
  font-size: 0.9em;
}
.alert {
  color: var(--o8-pink-light);
  font-size: 0.9em;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5em;
  align-items: center;
  margin-top: 0.4em;
}
.controls {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 24px;
  display: flex;
  justify-content: center;
  gap: 0.6em;
}
.controls .card-pill,
.actions .card-pill {
  font-size: 0.95em;
}
.tip {
  position: absolute;
  pointer-events: none;
  display: grid;
  gap: 0.15em;
  padding: 0.45em 0.7em;
  min-width: 9em;
  background: #12052af0;
  border: 1px solid #c3b3da44;
  border-radius: 8px;
  font-size: 13px;
}
.tip b {
  font-weight: 500;
  color: #ffffff;
}
.tip i {
  font-style: normal;
  color: #c3b3daaa;
  font-size: 0.9em;
}
</style>
