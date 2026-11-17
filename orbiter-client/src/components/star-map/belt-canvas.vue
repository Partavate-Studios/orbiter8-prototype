<template>
  <!-- The asteroid belt close in (D81): a field of small rocks in two layers turning at different
       speeds, for depth (D71). Far out the band (guides-canvas.vue) and the asteroids' sprites are
       enough, so this draws nothing until the band is wide on screen. Only the rocks on screen are
       drawn, and the graphics setting caps how many there are (none on low). -->
  <canvas v-show="mapDataLoaded && !systemHidden" ref="canvas" class="belt-canvas" :style="box" />
</template>

<script>
import { mapState } from 'pinia'
import { useUIStore } from '@/stores/ui'
import { useStarMapStore } from '@/stores/starmap'
import { useConfigStore } from '@/stores/config'
import { onFrame, FRAME_ORDER } from '@/libs/frame-loop'
import { WORLD_OFFSET_Y, BELT_WIDTH } from '@/constants'
import { BELT } from '@/libs/palette'
import { BELT_SPEED, ORBIT_SPEED_SCALE } from '@orbiter8/sdk/game/orbits'

// Rocks in each slice of the belt (SLICE world units along it), by graphics setting (low, normal, high).
const ROCKS_PER_SLICE = [0, 0, 7, 15]
const SLICE = 6
// How far each corner of a rock reaches (of its size), cycled so rocks differ.
const ROCK_SHAPE = [1, 0.55, 0.9, 0.7, 1, 0.6, 0.85]
// The band's width on screen (pixels) where the rocks start to show, and where they're fully shown.
const SHOW_FROM_PX = 60
const SHOWN_AT_PX = 140
// The back layer turns this much slower than the belt, for parallax.
const BACK_LAYER_SPEED = 0.72

/** A small deterministic random sequence, so a star's rocks are the same every visit. */
function random(seed) {
  let s = seed >>> 0 || 1
  return () => {
    s ^= s << 13
    s ^= s >>> 17
    s ^= s << 5
    return (s >>> 0) / 4294967296
  }
}

export default {
  name: 'BeltCanvas',
  computed: {
    ...mapState(useUIStore, ['viewport', 'screenSize', 'groupPixels', 'systemHidden']),
    ...mapState(useStarMapStore, ['systemObjects', 'mapDataLoaded', 'currentStarSystemId', 'gameTime']),
    ...mapState(useConfigStore, ['graphicsQuality']),
    box() {
      return { left: 0, top: 0, width: this.screenSize.width + 'px', height: this.screenSize.height + 'px' }
    },
    /** The belt's radius and its sections' compositions (by section, 0-7), or null with no belt. */
    belt() {
      const parts = Object.values(this.systemObjects).filter((o) => o.type === 'asteroid' || o.type === 'section')
      if (!parts.length) return null
      const kinds = new Array(8).fill(0)
      for (const o of parts) kinds[o.section] = o.type === 'asteroid' ? o.composition : o.dust
      return { radius: parts[0].orbit.radius, kinds }
    },
    perSlice() {
      return ROCKS_PER_SLICE[this.graphicsQuality] ?? 0
    }
  },
  mounted() {
    this.cleared = true
    this.stopFrames = onFrame(this.drawFrame, FRAME_ORDER.render)
  },
  unmounted() {
    this.stopFrames()
  },
  methods: {
    drawFrame() {
      const canvas = this.$refs.canvas
      if (!canvas) return
      const pixels = this.groupPixels / this.viewport.scale // per world unit
      const bandPx = BELT_WIDTH * pixels
      const show = this.mapDataLoaded && !this.systemHidden && this.belt && this.perSlice && bandPx > SHOW_FROM_PX
      const ctx = canvas.getContext('2d')
      if (!show) {
        if (!this.cleared) ctx.clearRect(0, 0, canvas.width, canvas.height)
        this.cleared = true
        return
      }
      // The belt turns a pixel or two a second up close, and the camera following a selection drifts as
      // slowly: redraw only for a zoom, a real move, or every quarter second (measured: drawing every
      // frame cost a third of the main thread at 4x CPU throttling).
      const now = performance.now()
      const last = this.last
      if (
        last &&
        !this.cleared &&
        last.scale === this.viewport.scale &&
        Math.abs(last.x - this.viewport.x) * pixels < 1.5 &&
        Math.abs(last.y - this.viewport.y) * pixels < 1.5 &&
        now - last.time < 250
      ) {
        return
      }
      this.last = { x: this.viewport.x, y: this.viewport.y, scale: this.viewport.scale, time: now }
      const dpr = window.devicePixelRatio || 1
      const width = Math.round(this.screenSize.width * dpr)
      const height = Math.round(this.screenSize.height * dpr)
      if (canvas.width !== width || canvas.height !== height) Object.assign(canvas, { width, height })
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, width, height)
      this.cleared = false
      // World coordinates on screen, as the guides canvas places them.
      const originX = this.screenSize.width / 2 + this.viewport.x * pixels
      const originY = this.screenSize.height / 2 + WORLD_OFFSET_Y * this.groupPixels + this.viewport.y * pixels
      ctx.setTransform(dpr * pixels, 0, 0, dpr * pixels, dpr * originX, dpr * originY)
      // What's on screen, in world units, with a rock's width to spare.
      const left = -originX / pixels - 2
      const right = (this.screenSize.width - originX) / pixels + 2
      const top = -originY / pixels - 2
      const bottom = (this.screenSize.height - originY) / pixels + 2
      const turn = (this.gameTime * BELT_SPEED * ORBIT_SPEED_SCALE) % (Math.PI * 2)
      const fade = Math.min(1, (bandPx - SHOW_FROM_PX) / (SHOWN_AT_PX - SHOW_FROM_PX))
      const { radius, kinds } = this.belt
      const slices = Math.round((2 * Math.PI * radius) / SLICE)
      const sliceAngle = (2 * Math.PI) / slices
      // The angles the screen covers: from its corners (the belt is far bigger than the screen here).
      const corners = [[left, top], [right, top], [left, bottom], [right, bottom]].map(([x, y]) => Math.atan2(y, x))
      const cell = Number(this.currentStarSystemId) * 7919
      for (const back of [true, false]) {
        ctx.globalAlpha = fade * (back ? 0.45 : 0.9)
        const layerTurn = back ? turn * BACK_LAYER_SPEED : turn
        // the screen's angles in the layer's own (unturned) frame, unwrapped round the first corner
        const base = corners[0] - layerTurn
        let lo = 0
        let hi = 0
        for (const c of corners) {
          const d = ((((c - layerTurn - base) % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI)) - Math.PI
          lo = Math.min(lo, d)
          hi = Math.max(hi, d)
        }
        const first = Math.floor((base + lo) / sliceAngle) - 1
        const last = Math.ceil((base + hi) / sliceAngle) + 1
        for (let i = first; i <= last && i - first < slices; i++) {
          const slice = ((i % slices) + slices) % slices
          const next = random(cell + slice * 2 + (back ? 1 : 0) + 1)
          // tinted by the section it's in (sections turn with the front layer)
          const kind = kinds[Math.floor((slice * 8) / slices)] ?? 0
          ctx.fillStyle = back ? BELT.rock[kind] : BELT.rockLight[kind]
          ctx.beginPath()
          for (let k = 0; k < this.perSlice; k++) {
            const angle = (slice + next()) * sliceAngle + layerTurn
            const across = (next() + next() + next() - 1.5) / 1.5 // bunched toward the middle
            const r = radius + (across * BELT_WIDTH) / 2
            const x = r * Math.cos(angle)
            const y = r * Math.sin(angle)
            const size = (0.08 + next() * next() * 0.5) * (back ? 0.7 : 1)
            const spin = next() * Math.PI
            if (x < left || x > right || y < top || y > bottom) continue
            // a small irregular rock: five corners at uneven distances
            for (let c = 0; c < 5; c++) {
              const a = spin + (c * Math.PI * 2) / 5
              const d = size * (0.7 + 0.3 * ROCK_SHAPE[(c + k) % ROCK_SHAPE.length])
              if (c === 0) ctx.moveTo(x + d * Math.cos(a), y + d * Math.sin(a))
              else ctx.lineTo(x + d * Math.cos(a), y + d * Math.sin(a))
            }
            ctx.closePath()
          }
          ctx.fill()
        }
      }
      ctx.globalAlpha = 1
    }
  }
}
</script>

<style scoped>
.belt-canvas {
  position: absolute;
  pointer-events: none;
}
</style>
