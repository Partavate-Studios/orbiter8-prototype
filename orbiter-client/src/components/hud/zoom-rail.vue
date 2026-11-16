<template>
  <!-- The zoom (Koda, round 2, item 2): a rail beside the minimap, as tall as it. + at the top, − at
       the bottom, and a thumb where the zoom stands between your ship up close and the whole system.
       Drag the thumb (the minimap's box grows and shrinks with it), click the rail or a mark to go
       there, or scroll over it. Down past "system" is the galaxy map. A slider for the keyboard: arrows,
       Page Up/Down, Home/End. -->
  <div class="zoom-rail" :class="{ compact }" :style="{ height: height + 'px' }" @wheel.prevent.stop="onWheel">
    <button type="button" class="step" title="Zoom in (+, or scroll)" aria-label="Zoom in" @click="stepBy(0.5)">
      <svg viewBox="-8 -8 16 16" aria-hidden="true"><path d="M-5 0H5M0 -5V5" /></svg>
    </button>
    <div
      ref="track"
      class="track"
      role="slider"
      tabindex="0"
      aria-label="Zoom"
      aria-orientation="vertical"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-valuenow="Math.round((1 - position) * 100)"
      :aria-valuetext="valueText"
      @pointerdown="onDown"
      @pointermove="onMove"
      @pointerup="onUp"
      @pointercancel="onUp"
      @keydown="onKey"
      @keyup.stop
    >
      <span class="line" aria-hidden="true" />
      <span
        v-for="mark in marks"
        :key="mark.name"
        class="mark"
        :style="{ top: mark.at * 100 + '%' }"
        :title="mark.title"
        @pointerdown.stop="goTo(mark)"
      >
        <i />
        <small v-if="!compact && mark.word">{{ mark.name }}</small>
      </span>
      <span class="thumb" aria-hidden="true" :style="{ top: position * 100 + '%' }" />
    </div>
    <button type="button" class="step" title="Zoom out (−, or scroll)" aria-label="Zoom out" @click="stepBy(2)">
      <svg viewBox="-8 -8 16 16" aria-hidden="true"><path d="M-5 0H5" /></svg>
    </button>
  </div>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import { useUIStore } from '@/stores/ui'
import { useStarMapStore } from '@/stores/starmap'
import { CAMERA } from '@/constants'

/** The rail's top: as close in as the rail goes (the camera can go a little closer with the wheel). */
const CLOSEST = 0.008
/** Your ship up close, as on arriving in a system. */
const SHIP = CAMERA.ARRIVAL_SHIP_SCALE
const STEP_MS = 220
const MARK_MS = 700

export default {
  name: 'ZoomRail',
  props: {
    /** Its height: the minimap's. */
    height: { type: Number, default: 132 },
    /** A phone: no words beside the marks. */
    compact: { type: Boolean, default: false }
  },
  data() {
    return { dragging: false }
  },
  computed: {
    ...mapState(useUIStore, ['viewport', 'neighborSwitchScale', 'groupPixels', 'screenSize']),
    ...mapState(useStarMapStore, ['systemObjects']),
    /** The far end: where the system hands over to the galaxy map. */
    farthest() {
      return Math.max(CLOSEST * 10, this.neighborSwitchScale)
    },
    /** The whole system on screen: its outermost orbit fits the shorter side. */
    systemScale() {
      const orbits = Object.values(this.systemObjects ?? {})
        .filter((object) => object.orbiting === 'star' && object.orbit?.radius)
        .map((object) => object.orbit.radius)
      const outermost = Math.max(400, ...orbits)
      const short = Math.min(this.screenSize.width, this.screenSize.height) || 900
      return Math.min(this.farthest * 0.8, (outermost * 1.15 * this.groupPixels) / (short / 2))
    },
    marks() {
      return [
        { name: 'ship', title: 'Your ship, up close', scale: SHIP },
        { name: 'system', title: 'The whole system', scale: this.systemScale },
        { name: 'galaxy', title: 'The galaxy map', scale: this.farthest, galaxy: true }
      ]
        .map((mark) => ({ ...mark, at: this.at(mark.scale) }))
        // a word only where there's room for it (a big system's "system" sits close to "galaxy")
        .map((mark, i, all) => ({ ...mark, word: !all.slice(0, i).some((other) => Math.abs(other.at - mark.at) < 0.22) }))
    },
    /** Where the zoom stands: 0 at the top (close in) to 1 at the bottom (the system's edge). */
    position() {
      return this.at(this.viewport.scale)
    },
    valueText() {
      const s = this.viewport.scale
      if (s <= SHIP * 1.5) return 'close in'
      if (s < this.systemScale * 0.7) return 'between'
      return 'the whole system'
    }
  },
  methods: {
    ...mapActions(useUIStore, ['zoomTo', 'zoomOutToNeighbors']),
    /** A zoom's place on the rail, on a logarithmic scale. */
    at(scale) {
      const t = Math.log(scale / CLOSEST) / Math.log(this.farthest / CLOSEST)
      return Math.min(1, Math.max(0, t))
    },
    scaleAt(t) {
      return CLOSEST * Math.pow(this.farthest / CLOSEST, Math.min(1, Math.max(0, t)))
    },
    stepBy(factor) {
      this.o8audio.playEffect('click')
      const target = (this.viewport.scaleTween?.target ?? this.viewport.scale) * factor
      if (factor > 1 && this.viewport.scale >= this.farthest * 0.98) return this.zoomOutToNeighbors()
      this.zoomTo(Math.min(target, this.farthest), STEP_MS)
    },
    goTo(mark) {
      this.o8audio.playEffect('click')
      if (mark.galaxy) return this.zoomOutToNeighbors()
      this.zoomTo(mark.scale, MARK_MS)
    },
    /** The rail's place (0 to 1) under the pointer. */
    placeOf(event) {
      const box = this.$refs.track.getBoundingClientRect()
      return (event.clientY - box.top) / box.height
    },
    onDown(event) {
      if (event.pointerType === 'mouse' && event.button !== 0) return
      event.currentTarget.setPointerCapture?.(event.pointerId)
      this.dragging = true
      this.zoomTo(this.scaleAt(this.placeOf(event)))
    },
    onMove(event) {
      if (this.dragging) this.zoomTo(this.scaleAt(this.placeOf(event)))
    },
    onUp(event) {
      if (!this.dragging) return
      this.dragging = false
      event.currentTarget.releasePointerCapture?.(event.pointerId)
      // Let go at the bottom: on out to the galaxy map.
      if (this.placeOf(event) >= 0.995) this.zoomOutToNeighbors()
    },
    onWheel(event) {
      const factor = event.deltaY > 0 ? CAMERA.WHEEL_ZOOM_OUT : CAMERA.WHEEL_ZOOM_IN
      if (factor > 1 && this.viewport.scale >= this.farthest * 0.98) return this.zoomOutToNeighbors()
      this.zoomTo(Math.min(this.farthest, (this.viewport.scaleTween?.target ?? this.viewport.scale) * factor), CAMERA.WHEEL_TWEEN_MS)
    },
    onKey(event) {
      const moves = { ArrowUp: -0.05, ArrowDown: 0.05, PageUp: -0.2, PageDown: 0.2, Home: -1, End: 1 }
      if (!(event.key in moves)) return
      event.preventDefault()
      event.stopPropagation()
      this.zoomTo(this.scaleAt(this.position + moves[event.key]), STEP_MS)
    }
  }
}
</script>

<style scoped>
.zoom-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 34px;
  box-sizing: border-box;
  padding: 3px 0;
  border: 1px solid #ffffff33;
  border-radius: 17px;
  background: #12052acc;
  user-select: none;
}
.step {
  flex: none;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.step:hover {
  background: #302651;
}
.step:focus-visible,
.track:focus-visible {
  outline: 2.5px solid var(--o8-brand-300);
  outline-offset: 2px;
}
.step svg {
  display: block;
  width: 16px;
  height: 16px;
  margin: auto;
}
.step path {
  fill: none;
  stroke: #ffffff;
  stroke-width: 2;
  stroke-linecap: round;
}
.track {
  position: relative;
  flex: 1;
  width: 100%;
  margin: 6px 0;
  border-radius: 6px;
  cursor: ns-resize;
  touch-action: none;
}
.line {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 2px;
  margin-left: -1px;
  border-radius: 1px;
  background: #c3b3da55;
}
.mark {
  position: absolute;
  left: 0;
  right: 0;
  height: 12px;
  margin-top: -6px;
  cursor: pointer;
}
.mark i {
  position: absolute;
  top: 5px;
  left: 50%;
  width: 12px;
  height: 1.5px;
  margin-left: -6px;
  background: #c3b3da;
}
.mark small {
  position: absolute;
  right: calc(100% + 6px);
  top: -1px;
  color: #c3b3da;
  font-size: 10px;
  line-height: 12px;
  white-space: nowrap;
  text-shadow:
    0 0 3px #000,
    0 1px 2px #000;
}
.mark:hover small {
  color: #ffffff;
}
.thumb {
  position: absolute;
  left: 50%;
  width: 20px;
  height: 10px;
  margin: -5px 0 0 -10px;
  border: 1px solid #000a;
  border-radius: 5px;
  background: #e6dcf5;
  box-shadow: 0 0 6px #0008;
  pointer-events: none;
}
.compact {
  width: 30px;
  border-radius: 15px;
}
.compact .step {
  width: 26px;
  height: 26px;
}
.compact .track {
  margin: 3px 0;
}
</style>
