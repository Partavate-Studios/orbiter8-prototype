<template>
  <!-- A count to choose, on the trade menu's slider: "Land colonists   12 / 40". -->
  <g font-size="0.8em">
    <text x="-100" y="0" text-anchor="start">{{ label }}</text>
    <text x="100" y="0" text-anchor="end">{{ shown.toLocaleString('en-US') }} / {{ max.toLocaleString('en-US') }}</text>
    <g transform="translate(0 20) scale(1.25)">
      <slider
        :lowest-value="0"
        :highest-value="Math.max(1, max)"
        :highlight-value="max"
        :current-value="shown"
        @update:percentage="set(Math.round($event * max))"
        @update:increment="set(shown + step)"
        @update:decrement="set(shown - step)"
      />
    </g>
  </g>
</template>

<script>
import Slider from '../_trade-menu/slider.svg'

export default {
  name: 'AmountDial',
  components: { Slider },
  props: {
    label: { type: String, required: true },
    value: { type: Number, default: 0 },
    max: { type: Number, default: 0 },
    /** What the arrows add or take away (one: Koda expects one; dragging covers big amounts). */
    step: { type: Number, default: 1 }
  },
  emits: ['update:value'],
  computed: {
    /** The value, never past the max. */
    shown() {
      return Math.max(0, Math.min(this.max, this.value))
    }
  },
  watch: {
    // What's there changed under the chosen amount (a delivery landed, the holds filled): bring the
    // amount down with it, so the dial and its button never offer more than there is.
    max() {
      if (this.value > this.max) this.$emit('update:value', Math.max(0, this.max))
    }
  },
  methods: {
    set(n) {
      this.$emit('update:value', Math.max(0, Math.min(this.max, n)))
    }
  }
}
</script>
