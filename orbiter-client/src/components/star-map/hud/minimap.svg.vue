<template>
  <!-- The minimap: the system out a little past its outermost orbit, with the star, the planets' orbits and
       positions, the ships, and the camera's view as a box. Clicking it moves the camera there.
       Dots and the box are written directly each frame (and only when they move), not by Vue. -->
  <g class="minimap">
    <defs>
      <clipPath id="minimap-clip">
        <rect :x="-HALF" :y="-HALF" :width="HALF * 2" :height="HALF * 2" rx="8" ry="8" />
      </clipPath>
    </defs>
    <rect
      :x="-HALF"
      :y="-HALF"
      :width="HALF * 2"
      :height="HALF * 2"
      rx="8"
      ry="8"
      fill="#12052acc"
      stroke="#ffffff33"
      stroke-width="1"
    />
    <g clip-path="url(#minimap-clip)">
      <circle
        v-if="heliopauseR < HALF * 1.5"
        :r="heliopauseR"
        fill="none"
        stroke="#c3b3da"
        stroke-opacity="0.35"
        stroke-width="0.8"
        stroke-dasharray="2 2"
      />
      <circle
        v-for="ring in rings"
        :key="ring.key"
        :r="ring.r"
        fill="none"
        stroke="#c3b3da"
        stroke-opacity="0.18"
        stroke-width="0.5"
      />
      <circle r="2.6" fill="#fff4d8" />
      <circle v-for="dot in dots" :key="dot.key" :ref="'dot-' + dot.key" :r="dot.r" :fill="dot.fill" cx="0" cy="0" />
      <rect
        ref="view"
        x="0"
        y="0"
        width="0"
        height="0"
        fill="#ffffff14"
        stroke="#ffffff"
        stroke-opacity="0.8"
        stroke-width="0.8"
      />
    </g>
    <!-- On top, so the whole box takes clicks. -->
    <rect
      :x="-HALF"
      :y="-HALF"
      :width="HALF * 2"
      :height="HALF * 2"
      fill="#00000000"
      cursor="pointer"
      @click="moveCamera"
    >
      <title>Minimap: click to look there</title>
    </rect>
  </g>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import { useStarMapStore } from '@/stores/starmap'
import { useUIStore } from '@/stores/ui'
import { onFrame, FRAME_ORDER } from '@/libs/frame-loop'
import { writeAttribute } from '@/libs/dom-writes'
import { WORLD_OFFSET_Y } from '@/constants'
import { YELLOW } from '@/libs/palette'

// The box is 2 * HALF HUD units across. The outermost orbit, plus a margin, fills a radius of FIT.
const HALF = 55
const FIT = 50
const MARGIN = 1.25
// Systems with only close-in orbits still show at least this far out (world units).
const MIN_EXTENT = 400
const HELIOPAUSE = 5000
// Below this change (minimap units) a dot or the box isn't rewritten.
const EPSILON = 0.25
const CAMERA_MOVE_MS = 600

const DOT_STYLE = {
  planet: { r: 1.8, fill: '#c3b3da' },
  station: { r: 1.1, fill: '#e6dcf5' },
  ship: { r: 1.2, fill: '#8fd3ff' }
}

export default {
  name: 'Minimap',
  data() {
    return { HALF }
  },
  computed: {
    ...mapState(useStarMapStore, ['sprites', 'systemObjects']),
    ...mapState(useUIStore, ['viewport', 'screenSize', 'livePixelsPerUnit', 'groupPixels']),
    /** Orbits around the star (planets, and ships orbiting the star itself), in world units. */
    orbits() {
      return Object.values(this.systemObjects ?? {}).filter(
        (object) => object.orbiting === 'star' && object.orbit?.radius
      )
    },
    /** Minimap units per world unit: the outermost orbit (plus a margin) fills the map. */
    scale() {
      const outermost = Math.max(MIN_EXTENT, ...this.orbits.map((object) => object.orbit.radius * MARGIN))
      return FIT / outermost
    },
    rings() {
      return this.orbits.map((object) => ({ key: object.key, r: object.orbit.radius * this.scale }))
    },
    heliopauseR() {
      return HELIOPAUSE * this.scale
    },
    /** What gets a dot: planets, stations and ships (moons are too close to their planets to show). */
    dots() {
      return Object.values(this.sprites ?? {})
        .filter((sprite) => DOT_STYLE[sprite.type])
        .map((sprite) => {
          const mine = sprite.type === 'ship' && sprite.object.isMine
          const style = DOT_STYLE[sprite.type]
          return { key: sprite.key, r: mine ? 2.4 : style.r, fill: mine ? YELLOW : style.fill }
        })
    }
  },
  mounted() {
    this.written = new Map()
    this.stopFrames = onFrame(this.writeFrame, FRAME_ORDER.render)
  },
  unmounted() {
    this.stopFrames()
  },
  methods: {
    ...mapActions(useUIStore, ['selectNone', 'viewAnimateMoveTo']),
    /** The world rectangle on screen right now (see the ui store's isOnScreen for the same mapping). */
    visibleWorld() {
      const pixels = this.livePixelsPerUnit
      const offsetY = WORLD_OFFSET_Y * this.groupPixels
      const halfWidth = this.screenSize.width / 2 / pixels
      return {
        left: -this.viewport.x - halfWidth,
        top: (-this.screenSize.height / 2 - offsetY) / pixels - this.viewport.y,
        width: halfWidth * 2,
        height: this.screenSize.height / pixels
      }
    },
    /** Writes an attribute set only if a value moved by more than EPSILON since last written. */
    writeIfMoved(key, element, values) {
      const last = this.written.get(key)
      if (last && Object.keys(values).every((name) => Math.abs(last[name] - values[name]) < EPSILON)) return
      this.written.set(key, values)
      for (const [name, value] of Object.entries(values)) writeAttribute(element, name, value.toFixed(2))
    },
    writeFrame() {
      for (const sprite of Object.values(this.sprites ?? {})) {
        if (!DOT_STYLE[sprite.type]) continue
        const element = this.$refs['dot-' + sprite.key]?.[0]
        if (element) {
          this.writeIfMoved(sprite.key, element, {
            cx: sprite.position.x * this.scale,
            cy: sprite.position.y * this.scale
          })
        }
      }
      const view = this.visibleWorld()
      // At least a few units across, so the box stays visible when zoomed far in.
      const width = Math.max(3, view.width * this.scale)
      const height = Math.max(3, view.height * this.scale)
      const centerX = (view.left + view.width / 2) * this.scale
      const centerY = (view.top + view.height / 2) * this.scale
      this.writeIfMoved('view', this.$refs.view, {
        x: centerX - width / 2,
        y: centerY - height / 2,
        width,
        height
      })
    },
    /** Centers the camera on the clicked spot (and stops following whatever was selected). */
    moveCamera(event) {
      const box = event.currentTarget.getBoundingClientRect()
      const x = ((event.clientX - box.left) / box.width - 0.5) * HALF * 2
      const y = ((event.clientY - box.top) / box.height - 0.5) * HALF * 2
      this.o8audio.playEffect('click')
      this.selectNone()
      // The camera's focus sits WORLD_OFFSET_Y above the screen center; aim so the spot lands in the middle.
      const offset = (WORLD_OFFSET_Y * this.groupPixels) / this.livePixelsPerUnit
      this.viewAnimateMoveTo({ x: -x / this.scale, y: -offset - y / this.scale, time: CAMERA_MOVE_MS })
    }
  }
}
</script>
