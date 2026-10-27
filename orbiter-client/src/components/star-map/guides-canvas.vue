<template>
  <!-- Everything centered on the star that's far bigger than the screen: the glow, the heliopause
       circle, the grid, and the orbit rings of whatever circles the star. Drawn on canvas, slightly
       larger than the screen: a camera move just shifts it (a whole-pixel CSS translate, which costs
       nothing to composite), and anything else (zoom, selection) redraws it for the live camera.
       It's never stretched, so unlike the world layer it never shows an edge. -->
  <canvas v-show="mapDataLoaded && !jumpAnimationState" ref="canvas" class="guides-canvas" :style="oversizedBox" />
</template>

<script>
import { mapState } from 'pinia'
import { useUIStore } from '@/stores/ui'
import { useStarMapStore } from '@/stores/starmap'
import { useConfigStore } from '@/stores/config'
import { onFrame, FRAME_ORDER } from '@/libs/frame-loop'
import { WORLD_OFFSET_Y } from '@/constants'
import { writeStyle } from '@/libs/dom-writes'
import { ringOpacity, ringWidth } from '@/libs/sprite-types'

const GUIDE_COLOR = '#c3b3da'
// A dim glow around the star (normal and high graphics).
const GLOW_RADIUS = 2500
const GLOW_INNER = 'rgba(49, 14, 92, 0.25)' // #310e5c
const GLOW_OUTER = 'rgba(76, 39, 119, 0)' // #4c2777
// The heliopause: the system's outer edge.
const HELIOPAUSE_RADIUS = 5000
const HELIOPAUSE_WIDTH = 10
// Orbit rings are dotted: 0.5 on, 1 off (world units). Below this many pixels per dot period the
// dots blur together anyway, so the ring is drawn solid at the same average brightness.
const DOT_ON = 0.5
const DOT_OFF = 1
const MIN_DOT_PERIOD_PX = 3
// Pixels drawn beyond each screen edge, so the camera can move this far before a redraw.
const MARGIN = 128

export default {
  name: 'GuidesCanvas',
  computed: {
    screenDimensions() {
      return this.screenSize.width + 'x' + this.screenSize.height
    },
    ...mapState(useUIStore, [
      'viewport',
      'screenSize',
      'groupPixels',
      'selected',
      'jumpAnimationState',
      'neighborView'
    ]),
    ...mapState(useStarMapStore, ['systemObjects', 'mapDataLoaded']),
    ...mapState(useConfigStore, ['graphicsQuality']),
    oversizedBox() {
      return {
        left: -MARGIN + 'px',
        top: -MARGIN + 'px',
        width: this.screenSize.width + 2 * MARGIN + 'px',
        height: this.screenSize.height + 2 * MARGIN + 'px'
      }
    }
  },
  watch: {
    // Only the window's size: screenSize also holds the mouse position, and a deep watch redrew
    // (and cleared) this canvas on every mouse move.
    screenDimensions() {
      this.$nextTick(this.resize)
    }
  },
  mounted() {
    this.drawn = null
    this.resize()
    this.stopFrames = onFrame(this.followCamera, FRAME_ORDER.render)
  },
  unmounted() {
    this.stopFrames()
  },
  methods: {
    resize() {
      const dpr = window.devicePixelRatio || 1
      const canvas = this.$refs.canvas
      canvas.width = Math.round((this.screenSize.width + 2 * MARGIN) * dpr)
      canvas.height = Math.round((this.screenSize.height + 2 * MARGIN) * dpr)
      this.drawn = null
    },
    /** Each frame: shift the drawn canvas to the live camera, or redraw it if a shift won't do. */
    followCamera() {
      if (!this.mapDataLoaded || this.jumpAnimationState) return
      const { x, y, scale } = this.viewport
      const drawn = this.drawn
      // What the picture depends on besides the camera's position. systemObjects is replaced on
      // every load, so its identity covers new or changed rings.
      const sameScene =
        drawn &&
        drawn.scale === scale &&
        drawn.selected === this.selected &&
        drawn.quality === this.graphicsQuality &&
        drawn.objects === this.systemObjects &&
        drawn.neighborView === this.neighborView
      if (sameScene) {
        const dpr = window.devicePixelRatio || 1
        const pixels = this.groupPixels / scale
        const shiftX = Math.round((x - drawn.x) * pixels * dpr) / dpr
        const shiftY = Math.round((y - drawn.y) * pixels * dpr) / dpr
        if (Math.abs(shiftX) < MARGIN * 0.8 && Math.abs(shiftY) < MARGIN * 0.8) {
          writeStyle(this.$refs.canvas, 'transform', `translate(${shiftX}px, ${shiftY}px)`)
          return
        }
      }
      this.draw()
      writeStyle(this.$refs.canvas, 'transform', 'translate(0px, 0px)')
    },
    /**
     * Draws everything for the live camera, rounded onto the device-pixel grid as the world layer
     * is (ui store drawWorldAt), so the guides and the sprites round the same way.
     */
    draw() {
      const { scale } = this.viewport
      const dpr = window.devicePixelRatio || 1
      const pixels = this.groupPixels / scale // per world unit
      const x = Math.round(this.viewport.x * pixels * dpr) / (pixels * dpr)
      const y = Math.round(this.viewport.y * pixels * dpr) / (pixels * dpr)
      this.drawn = {
        x,
        y,
        scale,
        selected: this.selected,
        quality: this.graphicsQuality,
        objects: this.systemObjects,
        neighborView: this.neighborView
      }
      const ctx = this.$refs.canvas.getContext('2d')
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
      // World coordinates, centered on the star as the camera sees it (the canvas starts MARGIN
      // pixels beyond the screen's top left).
      const originX = MARGIN + this.screenSize.width / 2 + x * pixels
      const originY = MARGIN + this.screenSize.height / 2 + WORLD_OFFSET_Y * this.groupPixels + y * pixels
      ctx.setTransform(dpr * pixels, 0, 0, dpr * pixels, dpr * originX, dpr * originY)
      // The world rectangle the canvas covers, for skipping lines that can't be seen.
      const view = {
        left: -originX / pixels,
        right: (this.screenSize.width + 2 * MARGIN - originX) / pixels,
        top: -originY / pixels,
        bottom: (this.screenSize.height + 2 * MARGIN - originY) / pixels
      }

      if (this.graphicsQuality > 1) this.drawGlow(ctx)
      this.drawGrid(ctx, scale, view)
      // In the neighbor view, the heliopause becomes that view's star (neighbor-view.svg.vue).
      if (!this.neighborView) this.drawHeliopause(ctx)
      this.drawStarOrbits(ctx, pixels)
    },
    drawGlow(ctx) {
      const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, GLOW_RADIUS)
      glow.addColorStop(0, GLOW_INNER)
      glow.addColorStop(1, GLOW_OUTER)
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(0, 0, GLOW_RADIUS, 0, Math.PI * 2)
      ctx.fill()
    },
    drawHeliopause(ctx) {
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = HELIOPAUSE_WIDTH
      ctx.beginPath()
      ctx.arc(0, 0, HELIOPAUSE_RADIUS, 0, Math.PI * 2)
      ctx.stroke()
    },
    /** The star chart: spokes through the star, then finer squares the further in you zoom. */
    drawGrid(ctx, scale, view) {
      ctx.strokeStyle = GUIDE_COLOR
      const lines = (width, segments) => {
        ctx.lineWidth = width
        ctx.beginPath()
        for (const [x1, y1, x2, y2] of segments) {
          ctx.moveTo(x1, y1)
          ctx.lineTo(x2, y2)
        }
        ctx.stroke()
      }
      lines(0.01 + 0.03 * scale, [
        [-2000, 0, 2000, 0],
        [0, -2000, 0, 2000],
        [-1050, -1050, 1050, 1050],
        [-1050, 1050, 1050, -1050],
        [-1050, -500, 1050, 500],
        [-1050, 500, 1050, -500],
        [-500, -1050, 500, 1050],
        [-500, 1050, 500, -1050]
      ])
      if (this.graphicsQuality < 2 || scale >= 0.5) return

      // Tick marks every 100 along the axes.
      const ticks = []
      for (let n = -5; n <= 5; n++) {
        if (n === 0) continue
        ticks.push([-50, n * 100, 50, n * 100], [n * 100, -50, n * 100, 50])
      }
      lines(0.05, ticks)
      lines(0.02, this.gridLines(100, 100, 10500, view))
      if (scale < 0.2) lines(0.005, this.gridLines(10, 1000, 10500, view))
    },
    /** Horizontal and vertical lines every `spacing` units (±count of them, skipping 0), on screen only. */
    gridLines(spacing, count, length, view) {
      const segments = []
      const first = (low) => Math.max(-count, Math.ceil(low / spacing))
      const last = (high) => Math.min(count, Math.floor(high / spacing))
      for (let n = first(view.top); n <= last(view.bottom); n++) {
        if (n !== 0) segments.push([-length, n * spacing, length, n * spacing])
      }
      for (let n = first(view.left); n <= last(view.right); n++) {
        if (n !== 0) segments.push([n * spacing, -length, n * spacing, length])
      }
      return segments
    },
    /** Orbit rings centered on the star: the planets', and those of ships orbiting the star itself. */
    drawStarOrbits(ctx, pixels) {
      ctx.strokeStyle = GUIDE_COLOR
      for (const [key, object] of Object.entries(this.systemObjects)) {
        if (object.orbiting !== 'star') continue
        const radius = object.orbit.radius
        const opacity = ringOpacity(radius * pixels)
        if (opacity === 0) continue
        const isSelected = key === this.selected
        ctx.lineWidth = ringWidth(isSelected, pixels)
        if ((DOT_ON + DOT_OFF) * pixels >= MIN_DOT_PERIOD_PX) {
          ctx.globalAlpha = opacity
          ctx.setLineDash([DOT_ON, DOT_OFF])
        } else {
          ctx.globalAlpha = (opacity * DOT_ON) / (DOT_ON + DOT_OFF)
          ctx.setLineDash([])
        }
        ctx.beginPath()
        ctx.arc(0, 0, radius, 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.globalAlpha = 1
      ctx.setLineDash([])
    }
  }
}
</script>

<style scoped>
.guides-canvas {
  position: absolute;
  pointer-events: none;
}
</style>
