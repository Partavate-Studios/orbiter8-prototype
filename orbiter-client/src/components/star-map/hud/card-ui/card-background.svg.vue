<template>
  <g>
    <g @mousedown.stop="handleMouseDown">
      <g transform="translate(-70 -70)">
        <g>
          <rect
            x="-2"
            y="-2"
            ry="5"
            rx="25"
            width="144"
            height="214"
            fill="url(#cardGradient)"
            opacity="1"
            stroke-width="0"
          />
          <!-- The inside: a quiet purple-gray (libs/palette.js CARD_GRAY), so the purple edge, the title
               and the buttons stand out against it -->
          <rect
            x="0"
            y="0"
            ry="5"
            rx="25"
            width="140"
            height="210"
            :fill="CARD_GRAY"
            opacity="0.72"
            stroke="#5b1aaa"
            stroke-width="0.25"
          />
        </g>
      </g>
    </g>
  </g>
</template>

<script>
import { CARD_GRAY } from '@/libs/palette'

export default {
  name: 'CardBackground',
  data() {
    return { CARD_GRAY }
  },
  methods: {
    handleMouseDown() {}
  }
}
</script>
