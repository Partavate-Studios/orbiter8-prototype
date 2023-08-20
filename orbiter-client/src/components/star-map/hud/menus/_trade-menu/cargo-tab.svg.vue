<template>
  <g dominant-baseline="middle">
      <defs>
      <linearGradient id="cargoTabGradient"
        x1="0%" y1="0%" x2="100%" y2="0%" gradientTransform="rotate(0)">
          <stop offset="0%" stop-color="#5D1EB0" stop-opacity="1"/>
          <stop offset="60%" stop-color="#310F5Ddd" stop-opacity="1"/>
          <stop offset="100%" stop-color="#290C4C" stop-opacity="1"/>
        </linearGradient>
      </defs>
    <g>
      <rect x="-4" y="-4" width="48" height="25" rx="4" ry="4" fill="#310F5Ddd" stroke="#ffffff88" stroke-width="0.5" />
      <g>
        <text v-if="before != after" font-size="0.4em" x="00" y="5" text-anchor="start" fill="#ffffff">{{ before }} &gt;</text>
        <text font-size="0.7em" x="40" y="5" text-anchor="end" fill="#ffffff">{{ after }}</text>
        <text font-size="0.5em" x="20" y="14" text-anchor="middle" fill="#ffffff88">{{ label }}</text>
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
    }
  },
  methods: {
  },
  computed: {
  }
}
</script>
