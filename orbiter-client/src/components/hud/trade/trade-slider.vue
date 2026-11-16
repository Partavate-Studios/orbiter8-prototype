<template>
  <!-- The trade menu's two-way slider (Koda, round 2, item 5: "they let you see effectively two
       transactions in one"). Its middle is "no trade"; the port is to the left and your ship to the
       right, as in the drawing above. A good the port sells is bought by sliding it right, toward the
       ship; a good it buys is sold by sliding left, toward the port. The half you can use is lit as far
       as you can go (what fits, what you carry, what the port has); the track's half is your ship's
       holds. ◂ ▸ step by one; with focus, the arrow keys do (Shift: ten), Home and End go to the ends. -->
  <div class="trade-slider" :class="[side, { disabled: max <= 0 }]">
    <button
      type="button"
      class="arrow"
      :disabled="!canLeft"
      :aria-label="side === 'buy' ? 'Buy one fewer' : 'Sell one more'"
      tabindex="-1"
      @click="nudge(-1)"
    >
      <svg viewBox="-6 -8 12 16" aria-hidden="true"><path d="M3 -6L-3 0L3 6" /></svg>
    </button>
    <div
      ref="track"
      class="track"
      role="slider"
      :tabindex="max > 0 ? 0 : -1"
      :aria-label="label"
      :aria-valuemin="0"
      :aria-valuemax="max"
      :aria-valuenow="Math.abs(value)"
      :aria-valuetext="valueText"
      @pointerdown="onDown"
      @pointermove="onMove"
      @pointerup="onUp"
      @pointercancel="onUp"
      @keydown="onKey"
      @keyup.stop
    >
      <span class="half left" />
      <span class="half right" />
      <span class="reach" :style="reachStyle" />
      <span v-if="value" class="fill" :style="fillStyle" />
      <span class="zero" />
      <span class="thumb" :style="{ left: thumbAt + '%' }">
        <svg viewBox="-8 -10 16 20" aria-hidden="true"><path :d="side === 'buy' ? 'M-5 -8L6 0L-5 8Z' : 'M5 -8L-6 0L5 8Z'" /></svg>
      </span>
    </div>
    <button
      type="button"
      class="arrow"
      :disabled="!canRight"
      :aria-label="side === 'buy' ? 'Buy one more' : 'Sell one fewer'"
      tabindex="-1"
      @click="nudge(1)"
    >
      <svg viewBox="-6 -8 12 16" aria-hidden="true"><path d="M-3 -6L3 0L-3 6" /></svg>
    </button>
  </div>
</template>

<script>
export default {
  name: 'TradeSlider',
  props: {
    /** Units in the trade: positive buys, negative sells. */
    value: { type: Number, default: 0 },
    /** 'buy' (the port sells it) or 'sell' (the port buys it). */
    side: { type: String, default: 'buy' },
    /** The most that can be traded now. */
    max: { type: Number, default: 0 },
    /** Units the track's half stands for: the ship's holds. */
    span: { type: Number, default: 1 },
    label: { type: String, default: '' }
  },
  emits: ['update:value'],
  data() {
    return { dragging: false }
  },
  computed: {
    sign() {
      return this.side === 'buy' ? 1 : -1
    },
    units() {
      return Math.abs(this.value)
    },
    /** Percent of a half per unit. */
    per() {
      return 50 / Math.max(1, this.span, this.max)
    },
    thumbAt() {
      return 50 + this.sign * this.units * this.per
    },
    reachStyle() {
      const width = this.max * this.per
      return this.side === 'buy' ? { left: '50%', width: width + '%' } : { left: 50 - width + '%', width: width + '%' }
    },
    fillStyle() {
      const width = this.units * this.per
      return this.side === 'buy' ? { left: '50%', width: width + '%' } : { left: 50 - width + '%', width: width + '%' }
    },
    canLeft() {
      return this.side === 'buy' ? this.units > 0 : this.units < this.max
    },
    canRight() {
      return this.side === 'buy' ? this.units < this.max : this.units > 0
    },
    valueText() {
      if (!this.units) return 'none'
      return (this.side === 'buy' ? 'buy ' : 'sell ') + this.units
    }
  },
  methods: {
    set(units) {
      const clamped = Math.max(0, Math.min(this.max, Math.round(units)))
      if (clamped !== this.units) this.$emit('update:value', clamped * this.sign)
    },
    /** One step left (-1) or right (+1) on the track. */
    nudge(direction, by = 1) {
      this.o8audio?.playEffect('click')
      this.set(this.units + direction * this.sign * by)
    },
    unitsAt(event) {
      const box = this.$refs.track.getBoundingClientRect()
      const fromMiddle = (event.clientX - box.left) / box.width - 0.5
      return (fromMiddle * this.sign * 100) / this.per
    },
    onDown(event) {
      if (this.max <= 0 || (event.pointerType === 'mouse' && event.button !== 0)) return
      event.currentTarget.setPointerCapture?.(event.pointerId)
      this.dragging = true
      this.set(this.unitsAt(event))
    },
    onMove(event) {
      if (this.dragging) this.set(this.unitsAt(event))
    },
    onUp(event) {
      if (!this.dragging) return
      this.dragging = false
      event.currentTarget.releasePointerCapture?.(event.pointerId)
    },
    onKey(event) {
      const by = event.shiftKey ? 10 : 1
      const moves = { ArrowLeft: -by, ArrowRight: by, ArrowDown: -by, ArrowUp: by }
      if (event.key in moves) this.nudge(Math.sign(moves[event.key]), by)
      else if (event.key === 'Home') this.set(0)
      else if (event.key === 'End') this.set(this.max)
      else return
      event.preventDefault()
      event.stopPropagation()
    }
  }
}
</script>

<style scoped>
.trade-slider {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}
.arrow {
  flex: none;
  width: 26px;
  height: 30px;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.arrow:hover:not(:disabled) {
  background: #ffffff14;
}
.arrow:disabled {
  opacity: 0.25;
  cursor: default;
}
.arrow svg {
  display: block;
  width: 10px;
  height: 14px;
  margin: auto;
}
.arrow path {
  fill: none;
  stroke: #e6dcf5;
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.track {
  position: relative;
  flex: 1;
  min-width: 0;
  height: 30px;
  border-radius: 6px;
  cursor: ew-resize;
  touch-action: none;
}
.disabled .track {
  cursor: default;
}
.track:focus-visible {
  outline: 2.5px solid var(--o8-brand-300);
  outline-offset: 2px;
}
.half {
  position: absolute;
  top: 11px;
  height: 8px;
  box-sizing: border-box;
  border: 1.5px solid #5c1aae88;
  background: #00000055;
}
.half.left {
  left: 0;
  right: 50%;
  border-right: 0;
  border-radius: 4px 0 0 4px;
}
.half.right {
  left: 50%;
  right: 0;
  border-left: 0;
  border-radius: 0 4px 4px 0;
}
/* how far you can go: the menu purple (row C1), faint */
.reach {
  position: absolute;
  top: 12.5px;
  height: 5px;
  background: #7b4fe666;
}
/* this trade */
.fill {
  position: absolute;
  top: 12.5px;
  height: 5px;
  background: #b9a0ff;
}
.zero {
  position: absolute;
  left: 50%;
  top: 4px;
  bottom: 4px;
  width: 2px;
  margin-left: -1px;
  border-radius: 1px;
  background: #e6dcf5;
}
.thumb {
  position: absolute;
  top: 5px;
  width: 16px;
  height: 20px;
  margin-left: -8px;
  pointer-events: none;
  transition: left 0.05s;
}
.thumb svg {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}
.thumb path {
  fill: #ffffff;
  stroke: #1e083a;
  stroke-width: 2;
  stroke-linejoin: round;
  paint-order: stroke;
}
.disabled .thumb,
.disabled .zero {
  opacity: 0.4;
}
</style>
