<template>
  <!-- The bottom layers of the star map, drawn on canvas: the nebula backdrop, the starfield,
       and (during a jump) the streaking stars. Backdrop and stars are drawn only when the zoom
       settles or the window resizes; in between, a CSS transform follows the camera. -->
  <div class="background">
    <canvas ref="backdrop" class="background-canvas" :style="oversizedBox" />
    <canvas v-show="showStars" ref="stars" class="background-canvas" :style="oversizedBox" />
    <canvas v-show="jumpAnimationState" ref="jump" class="jump-canvas" />
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { useUIStore } from '@/stores/ui'
import { useStarMapStore } from '@/stores/starmap'
import { useConfigStore } from '@/stores/config'
import { onFrame, FRAME_ORDER } from '@/libs/frame-loop'
import { CompositedLayer } from '@/libs/composited-layer'
import { backdropShapes, BACKDROP_SIZE } from './assets/backdrop-art'

// Pixels drawn beyond each screen edge, so the layers can pan or shrink a little before a redraw.
const MARGIN = 256
// The backdrop art (1280 units square) is drawn 2.5x, centered on the origin.
const BACKDROP_SCALE = 2.5
const STAR_COLOR = '#af6fff'
const STAR_GLARE_COLOR = '#af6fff22'
// Background colour behind the jump animation (it covers the backdrop and stars).
const JUMP_BACKGROUND = '#280b4b'
const JUMP_STREAK_COUNT = 50
const JUMP_STAR_SPEED = 25

// How far the camera's zoom (viewport.scale) changes the size of each background layer.
// These are the original formulas from map.vue.
const backdropScaleFor = (scale) => (Math.sqrt(10 / scale) + 10) / 4
const starfieldScaleFor = (scale) => (Math.sqrt(12 / scale) + 10) / 4
// The starfield drifts at 1/20 of the camera's movement (parallax).
const PARALLAX = 20

// Parsed once; the art never changes.
const backdropPaths = backdropShapes.map((shape) => (shape.type === 'path' ? new Path2D(shape.d) : null))

function randomStars(count) {
  const stars = []
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * 1500 - 750,
      y: Math.random() * 1500 - 750,
      size: Math.random() * Math.random() * 1.5 + 0.1
    })
  }
  return stars
}

// Non-reactive per-instance drawing state lives on `this` without being declared in data().
export default {
  name: 'BackgroundCanvas',
  computed: {
    ...mapState(useUIStore, ['viewport', 'screenSize', 'jumpAnimationState']),
    ...mapState(useConfigStore, ['graphicsQuality']),
    ...mapState(useStarMapStore, ['gameTime']),
    showStars() {
      return this.graphicsQuality > 1
    },
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
    screenSize: {
      handler() {
        this.$nextTick(this.resize)
      },
      deep: true
    },
    graphicsQuality() {
      this.generateStars()
      this.drawStars()
    }
  },
  mounted() {
    this.generateStars()
    this.jumpStreaks = Array.from({ length: JUMP_STREAK_COUNT }, () => ({
      x: Math.random() * 5000,
      y: Math.random() * 3000 - 1500
    }))
    // The backdrop is opaque and the stars thin out at the edges, so neither may show its edge:
    // they redraw whenever shrinking them would uncover part of the screen.
    const screen = () => this.screenSize
    this.backdropLayer = new CompositedLayer(this.$refs.backdrop, { margin: MARGIN, mustCover: screen })
    this.starsLayer = new CompositedLayer(this.$refs.stars, { margin: MARGIN, mustCover: screen })
    this.resize()
    this.stopFrames = onFrame(this.onFrame, FRAME_ORDER.render)
  },
  unmounted() {
    this.stopFrames()
  },
  methods: {
    generateStars() {
      // Frozen: positions never change, so Vue doesn't need to track them.
      this.stars = Object.freeze(randomStars(this.graphicsQuality > 2 ? 3200 : 800))
    },
    /** Pixels per map unit: the map fits 1200 units (viewport.resolution) into the screenSize height. */
    unit() {
      return this.screenSize.height / this.viewport.resolution
    },
    resize() {
      const dpr = window.devicePixelRatio || 1
      for (const ref of ['backdrop', 'stars']) {
        const canvas = this.$refs[ref]
        canvas.width = Math.round((this.screenSize.width + 2 * MARGIN) * dpr)
        canvas.height = Math.round((this.screenSize.height + 2 * MARGIN) * dpr)
      }
      this.$refs.jump.width = Math.round(this.screenSize.width * dpr)
      this.$refs.jump.height = Math.round(this.screenSize.height * dpr)
      this.drawBackdrop()
      this.drawStars()
    },
    /** A 2D context with its origin at the screen center, in CSS pixels. */
    centeredContext(canvas, margin) {
      const dpr = window.devicePixelRatio || 1
      const ctx = canvas.getContext('2d')
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        dpr * (this.screenSize.width / 2 + margin),
        dpr * (this.screenSize.height / 2 + margin)
      )
      return ctx
    },
    drawBackdrop() {
      const scale = backdropScaleFor(this.viewport.scale)
      this.drawnBackdrop = { scale }
      const ctx = this.centeredContext(this.$refs.backdrop, MARGIN)
      const s = this.unit() * scale * BACKDROP_SCALE
      ctx.scale(s, s)
      ctx.translate(-BACKDROP_SIZE / 2, -BACKDROP_SIZE / 2)
      backdropShapes.forEach((shape, index) => {
        ctx.fillStyle = shape.fill
        if (shape.type === 'path') {
          ctx.fill(backdropPaths[index])
        } else if (shape.type === 'rect') {
          ctx.fillRect(0, 0, shape.width, shape.height)
        } else {
          ctx.beginPath()
          if (shape.type === 'circle') ctx.arc(shape.cx, shape.cy, shape.r, 0, Math.PI * 2)
          else ctx.ellipse(shape.cx, shape.cy, shape.rx, shape.ry, 0, 0, Math.PI * 2)
          ctx.fill()
        }
      })
    },
    drawStars() {
      if (!this.showStars) return
      const scale = starfieldScaleFor(this.viewport.scale)
      const x = this.viewport.x / PARALLAX
      const y = this.viewport.y / PARALLAX
      this.drawnStars = { scale, x, y }
      const ctx = this.centeredContext(this.$refs.stars, MARGIN)
      const unit = this.unit()
      ctx.translate(unit * x, unit * y)
      ctx.scale(unit * scale, unit * scale)
      // Bright cores first, then the soft glare over them, as the SVG version drew them.
      for (const [color, radius] of [
        [STAR_COLOR, 0.15],
        [STAR_GLARE_COLOR, 0.75]
      ]) {
        ctx.fillStyle = color
        ctx.beginPath()
        for (const star of this.stars) {
          ctx.moveTo(star.x + star.size * radius, star.y)
          ctx.arc(star.x, star.y, star.size * radius, 0, Math.PI * 2)
        }
        ctx.fill()
      }
    },
    onFrame() {
      if (this.jumpAnimationState) {
        this.drawJump()
        return
      }
      const unit = this.unit()
      const centerX = this.screenSize.width / 2 + MARGIN
      const centerY = this.screenSize.height / 2 + MARGIN

      const backdropDelta = {
        scale: backdropScaleFor(this.viewport.scale) / this.drawnBackdrop.scale,
        x: 0,
        y: 0,
        originX: centerX,
        originY: centerY
      }
      if (this.backdropLayer.update(backdropDelta)) this.drawBackdrop()

      if (!this.showStars) return
      const drawn = this.drawnStars
      const starsDelta = {
        scale: starfieldScaleFor(this.viewport.scale) / drawn.scale,
        x: unit * (this.viewport.x / PARALLAX - drawn.x),
        y: unit * (this.viewport.y / PARALLAX - drawn.y),
        originX: centerX + unit * drawn.x,
        originY: centerY + unit * drawn.y
      }
      if (this.starsLayer.update(starsDelta)) this.drawStars()
    },
    /** The jump animation's star streaks, redrawn every frame while jumping. */
    drawJump() {
      const canvas = this.$refs.jump
      const ctx = this.centeredContext(canvas, 0)
      ctx.fillStyle = JUMP_BACKGROUND
      ctx.fillRect(
        -this.screenSize.width / 2,
        -this.screenSize.height / 2,
        this.screenSize.width,
        this.screenSize.height
      )

      // Map units inside the HUD's 1.25x group, as the SVG version used.
      const unit = this.unit() * 1.25
      ctx.scale(unit, unit)
      const leftSlide = ((JUMP_STAR_SPEED * this.gameTime) / 10) % 10000
      const rightSlide = ((JUMP_STAR_SPEED * this.gameTime) / 10 + 5000) % 10000
      const streak = this.streakSprite(unit)
      for (const [groupScale, mirror] of [
        [1, false],
        [0.65, true]
      ]) {
        for (const slide of [leftSlide, rightSlide]) {
          ctx.save()
          ctx.scale(groupScale, groupScale)
          ctx.translate(2500 - slide, 0)
          for (const star of this.jumpStreaks) {
            ctx.drawImage(streak, mirror ? 5000 - star.x : star.x, star.y, 500, 8)
          }
          ctx.restore()
        }
      }
    },
    /** One star streak (500 x 8 units, fading out to the right), pre-rendered for the current size. */
    streakSprite(unit) {
      const dpr = window.devicePixelRatio || 1
      const key = unit * dpr
      if (this.streak?.key === key) return this.streak.canvas
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.ceil(500 * key))
      canvas.height = Math.max(1, Math.ceil(8 * key))
      const ctx = canvas.getContext('2d')
      ctx.scale(canvas.width / 500, canvas.height / 8)
      const gradient = ctx.createLinearGradient(0, 0, 500, 0)
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
      gradient.addColorStop(0.1, 'rgba(255, 255, 255, 0.1)')
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
      ctx.fillStyle = gradient
      ctx.beginPath()
      // SVG clamps the rect's rx="8" ry="8" to the 8-unit height, giving 8 x 4 elliptical ends.
      ctx.roundRect(0, 0, 500, 8, [{ x: 8, y: 4 }])
      ctx.fill()
      this.streak = { key, canvas }
      return canvas
    }
  }
}
</script>

<style scoped>
.background-canvas {
  position: absolute;
}
.jump-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
</style>
