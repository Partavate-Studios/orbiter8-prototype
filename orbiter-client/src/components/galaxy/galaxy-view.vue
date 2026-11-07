<template>
  <!-- Demo 4's galaxy (docs/demo4-plan.md, milestone 1): the hex grid's charted stars, drawn slightly
       off the grid so it reads as a star field; your ship; what's in range. Regions load as you pan. -->
  <div class="galaxy-view" @pointerdown="onDown" @pointermove="onMove" @pointerup="onUp" @wheel="onWheel">
    <svg ref="svg" class="map" :viewBox="`0 0 ${width} ${height}`">
      <g
        v-for="star in drawn"
        :key="star.cell"
        :transform="`translate(${star.x} ${star.y})`"
        class="star"
        :class="{ selected: star.cell === galaxy.selected }"
        @click.stop="galaxy.select(star.cell)"
      >
        <circle v-if="star.reachable" :r="star.r + 7" class="reach" />
        <circle v-if="star.pending" :r="star.r + 4" class="scanning" />
        <template v-if="star.blackHole">
          <circle :r="star.r + 2" class="hole-ring" />
          <circle :r="star.r" fill="#05010d" />
        </template>
        <circle v-else :r="star.r" :fill="star.color" :opacity="star.visited ? 1 : 0.6" />
        <circle :r="Math.max(star.r + 6, 12)" fill="transparent" />
        <text v-if="showNames || star.cell === galaxy.selected" :y="star.r + 13" class="name">{{ star.name }}</text>
      </g>
      <g v-if="shipPoint" :transform="`translate(${shipPoint.x} ${shipPoint.y - 16}) scale(2.2)`" class="ship">
        <fleet-ship type="orbiter8" />
      </g>
    </svg>

    <header class="hud">
      <span class="title">Orbiter 8 · Demo 4</span>
      <span v-if="galaxy.pilot">
        <b>{{ galaxy.pilot.callsign }}</b> aboard <b>{{ galaxy.pilot.ship.name }}</b> · range
        {{ galaxy.pilot.ship.range }} · bays {{ galaxy.pilot.ship.cargo }}/{{ galaxy.pilot.ship.bays }} ·
        <b class="credits">{{ galaxy.credits.toLocaleString() }} cr</b>
      </span>
      <span v-if="galaxy.pilot" class="session">
        <template v-if="galaxy.sessionLive">
          Session · {{ sessionLeft }}
          <button class="o8-button small" :disabled="Boolean(galaxy.busy)" @click="galaxy.endSession()">End</button>
        </template>
        <button
          v-else
          class="o8-button small"
          :disabled="Boolean(galaxy.busy)"
          title="One wallet approval lets this browser make your moves for the next few hours"
          @click="galaxy.startSession()"
        >
          Start session
        </button>
      </span>
      <span v-if="galaxy.busy" class="busy">{{ busyWords }}</span>
      <span v-if="galaxy.error" class="problem">{{ galaxy.error }}</span>
    </header>

    <section v-if="galaxy.status !== 'ready'" class="panel center">
      <p v-if="galaxy.status === 'no-deployment'">
        No Demo 4 contracts found. Start them with <code>npm run local4</code>.
      </p>
      <p v-else-if="galaxy.status === 'error'" class="problem">{{ galaxy.error }}</p>
      <p v-else>Connecting…</p>
    </section>

    <form v-else-if="galaxy.pilot === false" class="panel center" @submit.prevent="register">
      <h2>Register with Minerva</h2>
      <label>Call sign <input v-model="callsign" maxlength="24" required /></label>
      <label>Ship name <input v-model="shipName" maxlength="24" required /></label>
      <button class="o8-button primary" :disabled="Boolean(galaxy.busy)">Launch from Sol</button>
    </form>

    <star-card v-if="galaxy.selected !== null && galaxy.status === 'ready'" :cell="galaxy.selected" />
    <docks-panel v-if="docksOpen && galaxy.ports.length && galaxy.pilot" @close="docksOpen = false" />

    <footer class="controls">
      <button class="o8-button small" @click="centerOnShip">My ship</button>
      <button v-if="galaxy.pilot && galaxy.ports.length" class="o8-button small" @click="toggleDocks">
        Docks ({{ galaxy.ports.length }})
      </button>
      <button class="o8-button small" @click="showNames = !showNames">{{ showNames ? 'Hide' : 'Show' }} names</button>
    </footer>
  </div>
</template>

<script>
import { useGalaxyStore, STATE } from '@/stores/galaxy'
import { position, cellAt, distance } from '@/sdk/v4/hex'
import { starTraits, anomalyName } from '@/sdk/v4/traits'
import FleetShip from '@/components/assets/fleet-ship.svg'
import StarCard from './star-card.vue'
import DocksPanel from './docks-panel.vue'

// Pixels between neighboring stars at zoom 1, and the isometric squash (the prototype's look).
const SPACING = 64
const FLAT = 0.7

export default {
  name: 'GalaxyView',
  components: { FleetShip, StarCard, DocksPanel },
  data() {
    return {
      galaxy: useGalaxyStore(),
      width: window.innerWidth,
      height: window.innerHeight,
      camera: { x: 0, y: 0, zoom: 1.5 },
      drag: null,
      showNames: true,
      callsign: '',
      shipName: '',
      docksOpen: false,
      now: Date.now()
    }
  },
  computed: {
    scale() {
      return SPACING * this.camera.zoom
    },
    /** Every loaded star, projected to the screen. */
    drawn() {
      void this.galaxy.cellsVersion
      const seed = this.galaxy.universe?.seed
      if (!seed) return []
      const out = []
      for (const c of this.galaxy.cells.values()) {
        if (c.state !== STATE.STAR && c.state !== STATE.BLACK_HOLE) continue
        const traits = starTraits(seed, c.cell)
        const [x, y] = this.project(c.cell, traits.jitter)
        if (x < -40 || y < -40 || x > this.width + 40 || y > this.height + 40) continue
        const blackHole = c.state === STATE.BLACK_HOLE
        out.push({
          cell: c.cell,
          x,
          y,
          r: (2.5 + traits.size * 5) * Math.min(1.6, Math.max(0.6, this.camera.zoom)),
          color: traits.color,
          blackHole,
          visited: c.visited,
          pending: c.visited && !c.scanned,
          reachable: this.galaxy.canJumpTo(c.cell),
          name: this.galaxy.names[c.cell] || (blackHole ? anomalyName(c.cell) : traits.name)
        })
      }
      return out
    },
    shipPoint() {
      const cell = this.galaxy.shipCell
      if (cell === null || !this.galaxy.universe) return null
      const [x, y] = this.project(cell, starTraits(this.galaxy.universe.seed, cell).jitter)
      return { x, y }
    },
    busyWords() {
      return {
        register: 'Registering…',
        jump: 'Jumping…',
        traverse: 'Going through…',
        rename: 'Renaming…',
        resolve: 'Recording scans…',
        trade: 'Trading…',
        yard: 'At the yard…',
        session: 'Waiting for the wallet…'
      }[this.galaxy.busy]
    },
    sessionLeft() {
      const seconds = Math.max(0, this.galaxy.session.expiry - this.now / 1000)
      const h = Math.floor(seconds / 3600)
      const m = Math.floor((seconds % 3600) / 60)
      return h ? `${h}h ${m}m` : `${m}m`
    }
  },
  watch: {
    'galaxy.status'(status) {
      if (status === 'ready') this.centerOnShip()
    }
  },
  mounted() {
    this.onResize = () => {
      this.width = window.innerWidth
      this.height = window.innerHeight
    }
    window.addEventListener('resize', this.onResize)
    this.clock = setInterval(() => (this.now = Date.now()), 30_000)
    if (this.galaxy.status === 'idle') this.galaxy.connect()
    else if (this.galaxy.status === 'ready') this.centerOnShip()
  },
  unmounted() {
    window.removeEventListener('resize', this.onResize)
    clearInterval(this.clock)
  },
  methods: {
    project(cell, jitter = [0, 0]) {
      const [x, y] = position(cell)
      return [
        this.width / 2 + (x + jitter[0] - this.camera.x) * this.scale,
        this.height / 2 + (y + jitter[1] - this.camera.y) * this.scale * FLAT
      ]
    },
    centerOnShip() {
      const cell = this.galaxy.shipCell ?? 0
      const [x, y] = position(cell)
      this.camera.x = x
      this.camera.y = y
    },
    toggleDocks() {
      this.docksOpen = !this.docksOpen
      // On a phone held upright the docks take the bottom of the screen, where the star card sits.
      if (this.docksOpen && this.width <= 600) this.galaxy.select(null)
    },
    async register() {
      await this.galaxy.register(this.callsign.trim(), this.shipName.trim())
    },
    onDown(event) {
      if (event.target.closest('.panel, .controls, .star-card, .docks, .hud')) return
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
      if (moved) this.loadHere()
      else this.galaxy.select(null)
    },
    onWheel(event) {
      if (event.target.closest('.docks, .star-card')) return // let panels scroll
      event.preventDefault()
      const factor = event.deltaY > 0 ? 1 / 1.15 : 1.15
      this.camera.zoom = Math.min(3, Math.max(0.15, this.camera.zoom * factor))
      this.loadHere()
    },
    /** Reads the region under the middle of the screen if it isn't loaded yet. */
    loadHere() {
      if (this.galaxy.status !== 'ready') return
      const cell = cellAt(this.camera.x, this.camera.y)
      if (distance(cell, 0) < 1e7) this.galaxy.loadAround(cell)
    }
  }
}
</script>

<style scoped>
.galaxy-view {
  position: fixed;
  inset: 0;
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
  stroke: #c3b3da55;
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
  animation: scan 2s linear infinite;
}
.hole-ring {
  fill: none;
  stroke: #c3b3da;
  stroke-width: 1.5;
}
.ship {
  pointer-events: none;
}
.hud {
  position: absolute;
  top: 12px;
  left: 16px;
  right: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 1em;
  align-items: center;
  font-size: 14px;
}
.hud .title {
  font-weight: 500;
  color: #c3b3da;
}
.busy {
  color: var(--o8-yellow-light);
}
.credits {
  color: var(--o8-yellow-light);
}
.session {
  display: flex;
  gap: 0.4em;
  align-items: center;
  color: #c3b3da;
}
.problem {
  color: var(--o8-pink-light);
}
.panel {
  position: absolute;
  background: #12052ae6;
  border: 1px solid #c3b3da44;
  border-radius: 12px;
  padding: 1em 1.4em;
  display: grid;
  gap: 0.7em;
}
.center {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  min-width: min(90vw, 20em);
}
.panel h2 {
  margin: 0;
  font-weight: 400;
}
.panel label {
  display: grid;
  gap: 0.3em;
  font-size: 0.9em;
  color: #c3b3da;
}
.panel input {
  font: inherit;
  color: #fff;
  background: #00000055;
  border: 1px solid #ffffff55;
  border-radius: 0.5em;
  padding: 0.4em 0.6em;
}
.controls {
  position: absolute;
  bottom: 16px;
  left: 16px;
  display: flex;
  gap: 0.6em;
}
@keyframes scan {
  to {
    stroke-dashoffset: -16;
  }
}
</style>
