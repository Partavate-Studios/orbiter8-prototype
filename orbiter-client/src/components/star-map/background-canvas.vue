<template>
  <!-- The bottom layers of the star map, drawn on canvas: the nebula backdrop (with the farthest
       stars, which don't pan), the starfield, a nearer sparse starfield (Luxurious graphics), and
       (during a jump) the streaking stars. Backdrop and stars are drawn only when the zoom settles or
       the window resizes; in between, a CSS transform follows the camera. Each starfield pans at its
       own fraction of the camera's movement, for depth. -->
  <div class="background">
    <canvas ref="backdrop" class="background-canvas" :style="oversizedBox" />
    <canvas v-show="showStars" ref="stars" class="background-canvas" :style="oversizedBox" />
    <canvas v-show="showNearStars" ref="near" class="background-canvas" :style="oversizedBox" />
    <canvas v-show="jumpAnimationState" ref="jump" class="jump-canvas" />
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { useUIStore } from '@/stores/ui'
import { useConfigStore } from '@/stores/config'
import { onFrame, FRAME_ORDER } from '@/libs/frame-loop'
import { CompositedLayer } from '@/libs/composited-layer'
import { paintBackdrop, BACKDROP_SIZE } from './assets/backdrop-art'
import { jumpSlide, slidesWanted, JUMP_ARRIVE_MS } from '@/libs/jump-slide'
import { holeSurge, holeThroat } from '@/libs/hole-passage'
import { MAP } from '@/libs/palette'

// Pixels drawn beyond each screen edge, so the layers can pan or shrink a little before a redraw.
const MARGIN = 256
// The backdrop art (1280 units square) is drawn 2.5x, centered on the origin.
const BACKDROP_SCALE = 2.5
const STAR_COLOR = '#af6fff'
const STAR_GLARE_COLOR = '#af6fff22'
const JUMP_STREAK_COUNT = 50
const JUMP_STAR_SPEED = 25
// A stalled jump's streaks coast to a stop over this long (the ship falls behind faster: jump-animation.svg.vue).
const JUMP_STALL_STOP_MS = 3000
// Through a black hole (libs/hole-passage.js): the dark over the backdrop, the rings that pour out of
// the throat, and the smeared stars between them.
const HOLE_DARK = '#05010df4'
const HOLE_RINGS = 11
const HOLE_SMEARS = 80
const HOLE_SMEAR_COLOR = '#e6dcf5'

// How far the camera's zoom (viewport.scale) changes the size of each background layer.
// These are the original formulas from map.vue.
const backdropScaleFor = (scale) => (Math.sqrt(10 / scale) + 10) / 4
const starfieldScaleFor = (scale) => (Math.sqrt(12 / scale) + 10) / 4
// The starfield drifts at 1/20 of the camera's movement (parallax); the near starfield at 1/7.
const PARALLAX = 20
const NEAR_PARALLAX = 7
// The near stars grow a little faster than the starfield as the camera zooms in.
const nearScaleFor = (scale) => starfieldScaleFor(scale) * 1.35
const NEAR_STAR_COLOR = '#e2d4ff'
const NEAR_STAR_GLARE_COLOR = '#e2d4ff26'
// The farthest stars, painted into the backdrop in its own art units (1280 across), so they zoom with
// it and never pan.
const DEEP_STAR_COLOR = '#9b78d6'

function randomStars(count, { spread = 1500, center = 0, sizeScale = 1 } = {}) {
  const stars = []
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * spread - spread / 2 + center,
      y: Math.random() * spread - spread / 2 + center,
      size: (Math.random() * Math.random() * 1.5 + 0.1) * sizeScale
    })
  }
  return stars
}

/** Fills the stars as dots: bright cores first, then the soft glare over them. */
function paintStars(ctx, stars, layers) {
  for (const [color, radius] of layers) {
    ctx.fillStyle = color
    ctx.beginPath()
    for (const star of stars) {
      ctx.moveTo(star.x + star.size * radius, star.y)
      ctx.arc(star.x, star.y, star.size * radius, 0, Math.PI * 2)
    }
    ctx.fill()
  }
}

// Non-reactive per-instance drawing state lives on `this` without being declared in data().
export default {
  name: 'BackgroundCanvas',
  computed: {
    // The window's size and pixel ratio: either one means resizing the canvas.
    screenDimensions() {
      return this.screenSize.width + 'x' + this.screenSize.height + '@' + this.screenSize.dpr
    },
    ...mapState(useUIStore, ['viewport', 'screenSize', 'jumpAnimationState', 'jumpStall', 'galaxyPan', 'jumpPhase', 'jumpPhaseAt', 'jumpShipGone', 'jumpThroughHole']),
    ...mapState(useConfigStore, ['graphicsQuality']),
    showStars() {
      return this.graphicsQuality > 1
    },
    showNearStars() {
      return this.graphicsQuality > 2
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
    // Only the window's size: screenSize also holds the mouse position, and a deep watch redrew
    // (and cleared) this canvas on every mouse move.
    screenDimensions() {
      this.$nextTick(this.resize)
    },
    graphicsQuality() {
      this.generateStars()
      this.drawBackdrop()
      this.drawStars()
      this.drawNearStars()
    }
  },
  mounted() {
    this.generateStars()
    this.jumpStreaks = Array.from({ length: JUMP_STREAK_COUNT }, () => ({
      x: Math.random() * 5000,
      y: Math.random() * 3000 - 1500
    }))
    this.holeSmears = Array.from({ length: HOLE_SMEARS }, () => ({
      angle: Math.random() * Math.PI * 2,
      phase: Math.random(),
      rate: 0.6 + Math.random() * 0.9,
      length: 0.04 + Math.random() * 0.1
    }))
    // The backdrop is opaque and the stars thin out at the edges, so neither may show its edge:
    // they redraw whenever shrinking them would uncover part of the screen.
    const screen = () => this.screenSize
    this.backdropLayer = new CompositedLayer(this.$refs.backdrop, { margin: MARGIN, mustCover: screen })
    this.starsLayer = new CompositedLayer(this.$refs.stars, { margin: MARGIN, mustCover: screen })
    this.nearLayer = new CompositedLayer(this.$refs.near, { margin: MARGIN, mustCover: screen })
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
      // Deep stars sit in the backdrop's art space. The backdrop never pans and is drawn several
      // screens wide, so only its middle (about 520 of its 1280 units, zoomed all the way out) is ever
      // on screen: that's where they go.
      this.deepStars = Object.freeze(
        randomStars(this.graphicsQuality > 2 ? 2400 : 1200, { spread: 520, center: 640, sizeScale: 0.5 })
      )
      // Near stars pan at 1/7 of the camera, so they spread wide enough to cover its whole range.
      this.nearStars = Object.freeze(randomStars(this.graphicsQuality > 2 ? 1000 : 0, { spread: 2000, sizeScale: 1.7 }))
    },
    /** Where the stars' parallax looks from: the system camera, plus the galaxy map's pan while it's open. */
    camX() {
      return this.viewport.x + this.galaxyPan.x
    },
    camY() {
      return this.viewport.y + this.galaxyPan.y
    },
    /** Pixels per map unit: the map fits 1200 units (viewport.resolution) into the screenSize height. */
    unit() {
      return this.screenSize.height / this.viewport.resolution
    },
    resize() {
      const dpr = window.devicePixelRatio || 1
      for (const ref of ['backdrop', 'stars', 'near']) {
        const canvas = this.$refs[ref]
        canvas.width = Math.round((this.screenSize.width + 2 * MARGIN) * dpr)
        canvas.height = Math.round((this.screenSize.height + 2 * MARGIN) * dpr)
      }
      this.$refs.jump.width = Math.round(this.screenSize.width * dpr)
      this.$refs.jump.height = Math.round(this.screenSize.height * dpr)
      this.drawBackdrop()
      this.drawStars()
      this.drawNearStars()
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
      paintBackdrop(ctx)
      if (this.showStars) paintStars(ctx, this.deepStars, [[DEEP_STAR_COLOR, 0.35]])
    },
    drawStars() {
      if (!this.showStars) return
      const scale = starfieldScaleFor(this.viewport.scale)
      const x = this.camX() / PARALLAX
      const y = this.camY() / PARALLAX
      this.drawnStars = { scale, x, y }
      const ctx = this.centeredContext(this.$refs.stars, MARGIN)
      const unit = this.unit()
      ctx.translate(unit * x, unit * y)
      ctx.scale(unit * scale, unit * scale)
      // Bright cores first, then the soft glare over them, as the SVG version drew them.
      paintStars(ctx, this.stars, [
        [STAR_COLOR, 0.15],
        [STAR_GLARE_COLOR, 0.75]
      ])
    },
    drawNearStars() {
      if (!this.showNearStars) return
      const scale = nearScaleFor(this.viewport.scale)
      const x = this.camX() / NEAR_PARALLAX
      const y = this.camY() / NEAR_PARALLAX
      this.drawnNear = { scale, x, y }
      const ctx = this.centeredContext(this.$refs.near, MARGIN)
      const unit = this.unit()
      ctx.translate(unit * x, unit * y)
      ctx.scale(unit * scale, unit * scale)
      paintStars(ctx, this.nearStars, [
        [NEAR_STAR_COLOR, 0.28],
        [NEAR_STAR_GLARE_COLOR, 0.9]
      ])
    },
    onFrame(now) {
      // A new pixel ratio (another screen): every canvas resizes (screenDimensions). Checked here each
      // frame as well as by the ui store's media query, which some browsers report late.
      const dpr = window.devicePixelRatio || 1
      if (dpr !== this.screenSize.dpr) useUIStore().screenSize.dpr = dpr
      if (this.jumpAnimationState) {
        // The streaks travel at jump speed, or coast to a stop if the jump stalled (eased: slowing fast, then coasting).
        const seconds = this.lastJumpFrame ? Math.min(0.1, (now - this.lastJumpFrame) / 1000) : 0
        this.lastJumpFrame = now
        const stalled = this.jumpStall ? Math.min(1, (Date.now() - this.jumpStall.at) / JUMP_STALL_STOP_MS) : 0
        const speed = (1 - stalled) * (1 - stalled)
        this.jumpDistance = ((this.jumpDistance ?? 0) + speed * JUMP_STAR_SPEED * 100 * seconds) % 10000
        // (the black hole's passage falls in surges: libs/hole-passage.js)
        this.holeDepth = (this.holeDepth ?? 0) + speed * seconds * holeSurge(now / 1000)
        this.holeNow = now / 1000
        this.drawJump()
        // The backdrop stays put while the system slides away and the ship cruises (Koda, round 2);
        // arriving, it follows the camera again as the new system slides in.
        if (this.jumpPhase !== 'arrive') return
      } else this.lastJumpFrame = null
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
        x: unit * (this.camX() / PARALLAX - drawn.x),
        y: unit * (this.camY() / PARALLAX - drawn.y),
        originX: centerX + unit * drawn.x,
        originY: centerY + unit * drawn.y
      }
      if (this.starsLayer.update(starsDelta)) this.drawStars()

      if (!this.showNearStars) return
      const near = this.drawnNear
      const nearDelta = {
        scale: nearScaleFor(this.viewport.scale) / near.scale,
        x: unit * (this.camX() / NEAR_PARALLAX - near.x),
        y: unit * (this.camY() / NEAR_PARALLAX - near.y),
        originX: centerX + unit * near.x,
        originY: centerY + unit * near.y
      }
      if (this.nearLayer.update(nearDelta)) this.drawNearStars()
    },
    /**
     * The jump animation's star streaks, redrawn every frame while jumping, over the backdrop (no wash
     * of purple: the backdrop shows through). The streaks stream in from the right once the ship is in
     * place, and out to the left as the new system slides in (libs/jump-slide.js).
     */
    drawJump() {
      const canvas = this.$refs.jump
      const ctx = this.centeredContext(canvas, 0)
      if (this.jumpThroughHole) return this.drawHole(ctx)
      const { from, to } = jumpSlide(this.jumpPhase, Date.now() - this.jumpPhaseAt, { shipGone: this.jumpShipGone }).streaks
      if (to - from <= 0) return

      // Map units inside the HUD's 1.25x group, as the SVG version used.
      const unit = this.unit() * 1.25
      ctx.scale(unit, unit)
      const leftSlide = this.jumpDistance % 10000
      const rightSlide = (this.jumpDistance + 5000) % 10000
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
      this.hideStreaksOutside(ctx, canvas, from, to)
    },
    /**
     * The passage through a black hole, in place of the streaks (libs/hole-passage.js): dark, with a
     * throat of light ahead that wanders, and rings and smeared stars pouring out of it past you,
     * stretched wide and twisting. It thins away as the far side's system slides in.
     */
    drawHole(ctx) {
      const { width, height } = this.screenSize
      const fade = this.jumpPhase === 'arrive' ? 1 - Math.min(1, (Date.now() - this.jumpPhaseAt) / (JUMP_ARRIVE_MS * 0.55)) : 1
      if (fade <= 0) return
      const throat = holeThroat(this.holeNow, slidesWanted() ? 1 : 0)
      const depth = this.holeDepth
      const reach = Math.hypot(width, height) * 0.75
      const wide = throat.stretch
      const tall = 0.85 / Math.sqrt(throat.stretch)

      ctx.globalAlpha = fade
      ctx.fillStyle = HOLE_DARK
      ctx.fillRect(-width / 2, -height / 2, width, height)
      ctx.rotate(throat.tilt)
      const cx = throat.x * width
      const cy = throat.y * height
      // What's far away sits on the throat; what's near is still where the throat was a moment ago,
      // so the passage bends as the throat wanders.
      const bend = (d) => 1 - d * 1.35

      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, reach * 0.55)
      glow.addColorStop(0, MAP.partnerLink + '38')
      glow.addColorStop(0.35, MAP.partnerLink + '10')
      glow.addColorStop(1, MAP.partnerLink + '00')
      ctx.fillStyle = glow
      ctx.fillRect(-reach * 1.5, -reach * 1.5, reach * 3, reach * 3)

      ctx.strokeStyle = MAP.partnerLink
      for (let i = 0; i < HOLE_RINGS; i++) {
        const d = (i / HOLE_RINGS + depth * 0.16) % 1
        const r = reach * d ** 2.6
        ctx.globalAlpha = fade * Math.sin(Math.PI * d) * 0.5
        ctx.lineWidth = 1 + d * d * 12
        ctx.beginPath()
        // each ring leans its own way, and the lean rolls along the passage
        ctx.ellipse(cx * bend(d), cy * bend(d), r * wide, r * tall, throat.swirl * 0.4 * Math.sin(this.holeNow * 0.5 + d * 3), 0, Math.PI * 2)
        ctx.stroke()
      }

      ctx.strokeStyle = HOLE_SMEAR_COLOR
      ctx.lineCap = 'round'
      for (const smear of this.holeSmears) {
        const d = (smear.phase + depth * 0.3 * smear.rate) % 1
        const end = Math.min(1.15, d + smear.length * (0.4 + d * 2))
        ctx.globalAlpha = fade * Math.min(1, d * 1.6) * 0.75
        ctx.lineWidth = 0.6 + d * 2.6
        ctx.beginPath()
        // twisted hardest near the throat, so each smear curls as it comes
        for (const [at, move] of [
          [d, 'moveTo'],
          [end, 'lineTo']
        ]) {
          const angle = smear.angle + throat.swirl * (1 - at) * 2.5
          const r = reach * at ** 2.2
          ctx[move](cx * bend(at) + Math.cos(angle) * r * wide, cy * bend(at) + Math.sin(angle) * r * tall)
        }
        ctx.stroke()
      }

      // the throat itself: the dark you're falling toward and never reach
      ctx.globalAlpha = fade
      ctx.fillStyle = MAP.hole
      ctx.beginPath()
      ctx.ellipse(cx, cy, reach * 0.03 * wide, reach * 0.03 * tall, 0, 0, Math.PI * 2)
      ctx.fill()
    },
    /**
     * Wipes the streaks outside the stretch they show in (`from` to `to`, in screen widths), with a soft
     * edge: the stars stream in from the right and out to the left (libs/jump-slide.js).
     */
    hideStreaksOutside(ctx, canvas, from, to) {
      if (from <= 0 && to >= 1) return
      const width = canvas.width
      const soft = width * 0.08
      ctx.save()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.globalCompositeOperation = 'destination-out'
      // Erases fully on the hidden side of `edge`, fading to nothing over the soft band toward `inside`.
      const wipe = (edge, inside) => {
        const fade = ctx.createLinearGradient(edge, 0, inside, 0)
        fade.addColorStop(0, '#000000ff')
        fade.addColorStop(1, '#00000000')
        ctx.fillStyle = fade
        if (inside > edge) ctx.fillRect(0, 0, inside, canvas.height)
        else ctx.fillRect(inside, 0, width - inside, canvas.height)
      }
      // left of the stretch (the streaks not yet in), right of it (the last ones gone out to the left)
      if (from > 0) wipe(from * width, from * width + soft)
      if (to < 1) wipe(to * width, to * width - soft)
      ctx.restore()
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
