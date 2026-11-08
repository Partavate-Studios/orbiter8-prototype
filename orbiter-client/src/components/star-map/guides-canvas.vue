<template>
  <!-- Everything centered on the star that's far bigger than the screen: the glow, the heliopause
       circle, and the orbit rings of whatever circles the star. Drawn on canvas, slightly
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
import { RING_COLOR, RING_FAINT, ringOpacity, ringWidth } from '@/libs/sprite-types'
import { STAR_CLASSES, PLANET_COLORS } from '@/libs/palette'

// A dim glow around the star (normal and high graphics): deep space's purple, warmed or cooled toward
// the star's own color so its light reaches the whole system a little.
const GLOW_RADIUS = 2500
const GLOW_PURPLE = [49, 14, 92] // #310e5c
// On high graphics, the star's own light close in.
const LIGHT_RADIUS = 700

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
const rgba = ([r, g, b], a) => `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t)
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
      'hovered',
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
        drawn.hovered === this.hovered &&
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
        hovered: this.hovered,
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
      if (this.graphicsQuality > 1) this.drawGlow(ctx)
      if (this.graphicsQuality > 2) this.drawStarLight(ctx)
      // In the neighbor view, the heliopause becomes that view's star (neighbor-view.svg.vue).
      if (!this.neighborView) this.drawHeliopause(ctx)
      this.drawStarOrbits(ctx, pixels)
    },
    /** The star's class colors (libs/palette.js), or none for a black hole. */
    starColors() {
      const spectral = this.systemObjects.star?.spectral
      return spectral ? STAR_CLASSES[spectral] : null
    },
    drawGlow(ctx) {
      const star = this.starColors()
      const inner = star ? mix(GLOW_PURPLE, rgb(star.glow), 0.22) : GLOW_PURPLE
      const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, GLOW_RADIUS)
      glow.addColorStop(0, rgba(inner, 0.25))
      glow.addColorStop(0.3, rgba(GLOW_PURPLE, 0.12))
      glow.addColorStop(1, rgba(GLOW_PURPLE, 0))
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(0, 0, GLOW_RADIUS, 0, Math.PI * 2)
      ctx.fill()
    },
    drawStarLight(ctx) {
      const star = this.starColors()
      if (!star) return
      const light = ctx.createRadialGradient(0, 0, 0, 0, 0, LIGHT_RADIUS)
      light.addColorStop(0, rgba(rgb(star.glow), 0.07))
      light.addColorStop(1, rgba(rgb(star.glow), 0))
      ctx.fillStyle = light
      ctx.beginPath()
      ctx.arc(0, 0, LIGHT_RADIUS, 0, Math.PI * 2)
      ctx.fill()
    },
    drawHeliopause(ctx) {
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = HELIOPAUSE_WIDTH
      ctx.beginPath()
      ctx.arc(0, 0, HELIOPAUSE_RADIUS, 0, Math.PI * 2)
      ctx.stroke()
    },
    /**
     * Orbit rings centered on the star: the planets' (solid, in the planet's class color, libs/palette.js),
     * and those of ships orbiting the star itself.
     */
    drawStarOrbits(ctx, pixels) {
      for (const [key, object] of Object.entries(this.systemObjects)) {
        if (object.orbiting !== 'star') continue
        const radius = object.orbit.radius
        const emphasized = key === this.selected || key === this.hovered
        const opacity = ringOpacity(radius * pixels) * (emphasized ? 1 : RING_FAINT)
        if (opacity === 0) continue
        ctx.lineWidth = ringWidth(emphasized, pixels)
        if (object.type === 'planet') {
          const colors = PLANET_COLORS[object.class] ?? PLANET_COLORS[1]
          ctx.strokeStyle = colors.light
          ctx.globalAlpha = emphasized ? 0.6 : opacity * 0.55
          ctx.setLineDash([])
        } else {
          ctx.strokeStyle = emphasized ? RING_COLOR.bright : RING_COLOR.faint
          if ((DOT_ON + DOT_OFF) * pixels >= MIN_DOT_PERIOD_PX) {
            ctx.globalAlpha = opacity
            ctx.setLineDash([DOT_ON, DOT_OFF])
          } else {
            ctx.globalAlpha = (opacity * DOT_ON) / (DOT_ON + DOT_OFF)
            ctx.setLineDash([])
          }
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
