<template>
  <!-- A count to choose, on the trade menu's slider: "Land colonists   12 / 40". -->
  <g font-size="0.8em">
    <text x="-100" y="0" text-anchor="start">{{ label }}</text>
    <text x="100" y="0" text-anchor="end">{{ value.toLocaleString('en-US') }} / {{ max.toLocaleString('en-US') }}</text>
    <g transform="translate(0 20) scale(1.25)">
      <slider
        :lowest-value="0"
        :highest-value="Math.max(1, max)"
        :highlight-value="max"
        :current-value="value"
        @update:percentage="set(Math.round($event * max))"
        @update:increment="set(value + step)"
        @update:decrement="set(value - step)"
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
    /** What the arrows add or take away. */
    step: { type: Number, default: 1 }
  },
  emits: ['update:value'],
  methods: {
    set(n) {
      this.$emit('update:value', Math.max(0, Math.min(this.max, n)))
    }
  }
}
</script>
