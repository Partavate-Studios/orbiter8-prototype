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
            :fill="frameFill"
            opacity="1"
            stroke-width="0"
          />
          <!-- The inside: the same quiet purple-gray on every card (libs/palette.js CARD_GRAY), nearly
               opaque so the frame's color stays on the border (Koda: consistent backgrounds) -->
          <rect
            x="0"
            y="0"
            ry="5"
            rx="25"
            width="140"
            height="210"
            :fill="CARD_GRAY"
            opacity="0.96"
            :stroke="theme.stroke"
            stroke-width="0.25"
          />
        </g>
      </g>
    </g>
  </g>
</template>

<script>
import { CARD_GRAY } from '@/libs/palette'
import { CARD_THEMES } from '@/libs/card-theme'

export default {
  name: 'CardBackground',
  inject: { cardTheme: { default: null } },
  data() {
    return { CARD_GRAY }
  },
  computed: {
    /** The card's colors (libs/card-theme.js, from card-ui), purple outside a card. */
    theme() {
      const t = this.cardTheme
      return (typeof t === 'string' || !t ? null : (t.base ? t : t.value)) ?? CARD_THEMES.ship
    },
    frameFill() {
      return this.theme === CARD_THEMES.ship ? 'url(#cardGradient)' : `url(#card-${this.themeKey})`
    },
    themeKey() {
      return Object.keys(CARD_THEMES).find((key) => CARD_THEMES[key] === this.theme)
    }
  },
  methods: {
    handleMouseDown() {}
  }
}
</script>
