<template>
  <g dominant-baseline="middle">
    <g>
      <!-- a readout tile: the color system's second surface (row B1) -->
      <rect x="-4" y="-4" width="48" height="25" rx="4" ry="4" fill="#251d40" stroke="#5a4c8c" stroke-width="0.5" />
      <g>
        <text v-if="before != after" font-size="0.4em" x="00" y="5" text-anchor="start" fill="#ffffff"
          >{{ before }} &gt;</text
        >
        <text font-size="0.7em" x="40" y="5" text-anchor="end" fill="#ffffff">{{ after }}</text>
        <text font-size="0.5em" x="20" y="14" text-anchor="middle" :fill="color" :font-weight="color === '#bdb5d4' ? 'normal' : 'bold'">{{ label }}</text>
      </g>
    </g>
  </g>
</template>

<script>
export default {
  name: 'TransferTab',
  props: {
    before: {
      type: Number,
      default: 0
    },
    after: {
      type: Number,
      default: 0
    },
    label: {
      type: String,
      default: ''
    },
    /** The good's color (libs/palette.js GOODS_COLORS); quiet lavender for the empty holds. */
    color: {
      type: String,
      default: '#bdb5d4'
    }
  }
}
</script>
