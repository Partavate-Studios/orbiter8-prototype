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
            :fill="isShip ? frameFill : BORDER_STRONG"
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
          <!-- Anything but the ship (Koda, 2026-11-14, row I1): a thin quiet frame, and thick brackets in
               the selection's color around each corner. The ship's card keeps Koda's purple frame. -->
          <path v-if="!isShip" :d="BRACKETS" fill="none" :stroke="theme.base" stroke-width="4" stroke-linecap="round" />
        </g>
      </g>
    </g>
  </g>
</template>

<script>
import { CARD_GRAY, BORDER_STRONG } from '@/libs/palette'
import { CARD_THEMES } from '@/libs/card-theme'

// The corner brackets, on the frame's centerline (the card is 140 by 210 inside a 2-unit frame; its
// corners are 25 wide and 5 tall): each runs 34 along the top or bottom and 30 down the side.
const [L, T, R, B, RX, RY, H, V] = [-1, -1, 141, 211, 24, 4, 34, 30]
const BRACKETS = [
  `M${L} ${T + V}V${T + RY}Q${L} ${T} ${L + RX} ${T}H${L + H}`,
  `M${R} ${T + V}V${T + RY}Q${R} ${T} ${R - RX} ${T}H${R - H}`,
  `M${L} ${B - V}V${B - RY}Q${L} ${B} ${L + RX} ${B}H${L + H}`,
  `M${R} ${B - V}V${B - RY}Q${R} ${B} ${R - RX} ${B}H${R - H}`
].join('')

export default {
  name: 'CardBackground',
  inject: { cardTheme: { default: null } },
  data() {
    return { CARD_GRAY, BORDER_STRONG, BRACKETS }
  },
  computed: {
    /** The card's colors (libs/card-theme.js, from card-ui), purple outside a card. */
    theme() {
      const t = this.cardTheme
      return (typeof t === 'string' || !t ? null : (t.base ? t : t.value)) ?? CARD_THEMES.ship
    },
    isShip() {
      return this.theme === CARD_THEMES.ship
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
