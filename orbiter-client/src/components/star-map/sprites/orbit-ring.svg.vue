<template>
  <!-- The dotted path a sprite orbits on; thicker for the selected sprite. -->
  <circle
    :cx="cx"
    :cy="cy"
    :r="r"
    stroke="#c3b3da"
    stroke-dasharray="0.5 1"
    :stroke-width="selected ? 0.05 : 0.01"
    fill="none" />
</template>

<script>
export default {
  name: 'OrbitRing',
  props: {
    cx: { type: Number, default: 0 },
    cy: { type: Number, default: 0 },
    r: { type: Number, required: true },
    selected: { type: Boolean, default: false }
  }
}
</script>
