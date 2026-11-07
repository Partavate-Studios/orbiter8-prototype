<template>
  <!-- Demo 4's galaxy map, in the neighbor view's place (docs/demo4-plan.md section 8: "the galaxy map
       replaces the neighbor view"): the hex grid's charted stars, your ship, what's in range, scans and
       sieges. Choose a star in range to jump; the jump plays the jump animation. Regions load as you pan. -->
  <div class="galaxy-map" @pointerdown="onDown" @pointermove="onMove" @pointerup="onUp" @wheel="onWheel">
    <svg class="map" :viewBox="`0 0 ${width} ${height}`">
      <g
        v-for="star in drawn"
        :key="star.cell"
        :transform="`translate(${star.x} ${star.y})`"
        class="star"
        :class="{ selected: star.cell === chosen }"
        @click.stop="choose(star.cell)"
      >
        <circle v-if="star.reachable" :r="star.r + 7" class="reach" />
        <circle v-if="star.pending" :r="star.r + 4" class="scanning" />
        <circle v-if="star.besieged" :r="star.r + 10" class="besieged" />
        <template v-if="star.blackHole">
          <circle :r="star.r + 2" class="hole-ring" />
          <circle :r="star.r" fill="#05010d" />
        </template>
        <circle v-else :r="star.r" :fill="star.color" :opacity="star.visited ? 1 : 0.6" />
        <circle :r="Math.max(star.r + 6, 12)" fill="transparent" />
        <text :y="star.r + 13" class="name">{{ star.name }}</text>
      </g>
      <g v-if="shipPoint" :transform="`translate(${shipPoint.x} ${shipPoint.y - 16}) scale(2.2)`" class="ship">
        <fleet-ship type="orbiter8" />
      </g>
    </svg>

    <header class="title">
      <h2>Galaxy Map</h2>
      <p>Stars within {{ range }} {{ range === 1 ? 'jump' : 'jumps' }} are ringed. Drag to look around.</p>
      <p v-if="scanningNow" class="scanning-now">{{ scanningNow }}</p>
    </header>

    <aside v-if="chosen !== null" class="card">
      <h3>{{ chosenName }}</h3>
      <p class="sub">{{ chosenKind }} · {{ distanceAway }} {{ distanceAway === 1 ? 'step' : 'steps' }} away</p>
      <p v-if="chosenCell?.discoverer" class="sub">Discovered by {{ discovererName }}</p>
      <p v-if="scanWords" class="scan">{{ scanWords }}</p>
      <p v-if="besieged" class="alert">A siege is under way here.</p>
      <p v-if="failed" class="alert">The jump didn't go through: the transaction tray says why.</p>
      <div class="actions">
        <button v-if="canJump" class="o8-button primary" :disabled="waiting" @click="jump">
          {{ waiting ? 'Waiting for the jump…' : 'Jump to ' + chosenName }}
        </button>
        <p v-else-if="distanceAway > range" class="sub">Out of range: upgrade the engines at a shipyard.</p>
        <button class="o8-button small" :disabled="waiting" @click="choose(null)">Cancel</button>
      </div>
    </aside>

    <footer class="controls">
      <button class="o8-button" :disabled="waiting" @click="back">Back to {{ hereName }}</button>
      <button class="o8-button small" @click="centerOnShip">My ship</button>
    </footer>
  </div>
</template>

<script>
import { mapActions } from 'pinia'
import { game } from '@/sdk/client'
import { STATE } from '@/sdk/client'
import { position, cellAt, distance, neighbors } from '@/sdk/hex'
import { starTraits } from '@/sdk/traits'
import { timeOf } from '@/sdk/drand'
import { usePlayerStore } from '@/stores/player'
import { useGameStateStore } from '@/stores/gamestate'
import { useUIStore } from '@/stores/ui'
import FleetShip from '@/components/assets/fleet-ship.svg'

// Pixels between neighboring stars at zoom 1, and the isometric squash (the prototype's look).
const SPACING = 64
const FLAT = 0.7

export default {
  name: 'GalaxyMap',
  components: { FleetShip },
  data() {
    return {
      player: usePlayerStore(),
      width: window.innerWidth,
      height: window.innerHeight,
      camera: { x: 0, y: 0, zoom: 1.5 },
      drag: null,
      chosen: null,
      preview: null,
      waiting: false,
      failed: false,
      now: Date.now()
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
    drawn() {
      void this.player.cellsVersion
      const seed = this.client.universe?.seed
      if (!seed) return []
      const out = []
      for (const c of this.client.cells.values()) {
        if (c.state !== STATE.STAR && c.state !== STATE.BLACK_HOLE) continue
        const traits = starTraits(seed, c.cell)
        const [x, y] = this.project(c.cell, traits.jitter)
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
          reachable: steps > 0 && steps <= this.range,
          besieged: this.player.besiegedCells.has(c.cell),
          name: this.nameOf(c.cell)
        })
      }
      return out
    },
    shipPoint() {
      if (!this.client.universe) return null
      const [x, y] = this.project(this.shipCell, starTraits(this.client.universe.seed, this.shipCell).jitter)
      return { x, y }
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
      return who === this.player.account ? 'you' : who.slice(0, 6) + '…' + who.slice(-4)
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
  mounted() {
    this.onResize = () => {
      this.width = window.innerWidth
      this.height = window.innerHeight
    }
    window.addEventListener('resize', this.onResize)
    this.seconds = setInterval(() => (this.now = Date.now()), 1000)
    this.centerOnShip()
    game.loadAround(this.shipCell)
  },
  unmounted() {
    window.removeEventListener('resize', this.onResize)
    clearTimeout(this.timer)
    clearInterval(this.seconds)
  },
  methods: {
    ...mapActions(useUIStore, ['exitNeighborView', 'zoomInToStar']),
    ...mapActions(useGameStateStore, ['moveToSystem']),
    nameOf(cell) {
      if (cell === null) return ''
      void this.player.cellsVersion
      return game.starName(cell)
    },
    project(cell, jitter = [0, 0]) {
      const [x, y] = position(cell)
      return [
        this.width / 2 + (x + jitter[0] - this.camera.x) * this.scale,
        this.height / 2 + (y + jitter[1] - this.camera.y) * this.scale * FLAT
      ]
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
    onDown(event) {
      if (event.target.closest('.card, .controls, .title')) return
      this.drag = { x: event.clientX, y: event.clientY, cx: this.camera.x, cy: this.camera.y, moved: false }
    },
    onMove(event) {
      if (!this.drag) return
      const dx = event.clientX - this.drag.x
      const dy = event.clientY - this.drag.y
      if (Math.hypot(dx, dy) > 4) this.drag.moved = true
      this.camera.x = this.drag.cx - dx / this.scale
      this.camera.y = this.drag.cy - dy / (this.scale * FLAT)
    },
    onUp() {
      if (!this.drag) return
      const moved = this.drag.moved
      this.drag = null
      if (moved) game.loadAround(cellAt(this.camera.x, this.camera.y))
    },
    onWheel(event) {
      if (event.target.closest('.card')) return
      event.preventDefault()
      event.stopPropagation()
      const factor = event.deltaY > 0 ? 1 / 1.15 : 1.15
      this.camera.zoom = Math.min(3, Math.max(0.15, this.camera.zoom * factor))
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
  background: radial-gradient(ellipse at center, #2b0c50 0%, #160631 75%);
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
.selected .name {
  fill: #ffffff;
}
.reach {
  fill: none;
  stroke: #c3b3da88;
  stroke-width: 1;
  stroke-dasharray: 2 3;
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
.hole-ring {
  fill: none;
  stroke: #c3b3da;
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
}
.title p {
  margin: 0.3em 0 0;
  font-size: 0.85em;
  color: #c3b3da;
}
.title .scanning-now {
  color: var(--o8-yellow-light);
}
.card {
  position: absolute;
  left: 50%;
  bottom: 96px;
  transform: translateX(-50%);
  width: min(92vw, 24em);
  box-sizing: border-box;
  background: #12052af0;
  border: 1px solid #c3b3da44;
  border-radius: 12px;
  padding: 0.8em 1em;
  text-align: left;
}
.card h3 {
  margin: 0;
  font-weight: 500;
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
</style>
