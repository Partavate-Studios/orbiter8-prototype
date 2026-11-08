<template>
  <g>
    <linearGradient id="menuGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" :stop-color="theme.mid" stop-opacity="0.9" />
      <stop offset="10%" :stop-color="theme.deep" stop-opacity="1" />
      <stop offset="50%" :stop-color="theme.mid" stop-opacity="1" />
      <stop offset="90%" :stop-color="theme.deep" stop-opacity="1" />
      <stop offset="100%" :stop-color="theme.mid" stop-opacity="0.9" />
    </linearGradient>

    <rect
      :x="menuLeft"
      :y="menuTop"
      :width="menuWidth"
      :height="menuHeight"
      fill="url(#menuGradient)"
      stroke-width="4"
      stroke="#00000022"
      rx="10"
      ry="10"
    />

    <rect
      :x="menuLeft + padding / 2"
      :y="menuTop + padding / 2"
      :width="menuWidth - padding"
      :height="menuHeight - padding"
      :fill="inside"
      stroke="#ffffff22"
      stroke-width="4"
      rx="5"
      ry="5"
    />
  </g>
</template>

<script>
import { mapState } from 'pinia'
import { useUIStore } from '@/stores/ui'
import { CARD_GRAY } from '@/libs/palette'
import { mixHex, unwrapTheme } from '@/libs/card-theme'

export default {
  name: 'MenuBackground',
  inject: { menuTheme: { default: null } },
  data() {
    return {
      padding: 25,
      maxWidth: 800
    }
  },
  computed: {
    ...mapState(useUIStore, ['leftMostX', 'topMostY', 'viewport']),
    /** The menu's colors (menu-container); the inside a dark, quiet blend of them. */
    theme() {
      return unwrapTheme(this.menuTheme)
    },
    inside() {
      return mixHex(this.theme.deep, CARD_GRAY, 0.6) + 'd9'
    },
    menuLeft() {
      let shift = 0
      if (this.viewport.width > this.maxWidth) {
        shift = (this.viewport.width - this.maxWidth) / 2
      }
      return this.leftMostX + this.padding / 2 + shift
    },
    menuTop() {
      return this.topMostY + this.padding
    },
    menuWidth() {
      return Math.min(this.maxWidth, this.viewport.width) - this.padding
    },
    menuHeight() {
      return this.viewport.height
    }
  }
}
</script>
