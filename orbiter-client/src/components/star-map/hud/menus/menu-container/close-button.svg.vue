<template>
  <g>
    <g @mouseover="hover = true" @mouseleave="hover = false">
      <rect
        x="-100"
        y="-25"
        width="200"
        height="50"
        rx="4"
        ry="4"
        stroke-width="4"
        :stroke="theme.mid"
        :fill="fillColor"
      />
      <rect x="-30" y="-4" width="32" height="6" rx="3" ry="3" fill="#ffffff" transform=" translate(0 10) rotate(45)" />
      <rect x="-2" y="-4" width="32" height="6" rx="3" ry="3" fill="#ffffff" transform=" translate(0 10) rotate(-45)" />
    </g>
  </g>
</template>

<script>
import { unwrapTheme } from '@/libs/card-theme'

export default {
  name: 'MenuCloseButton',
  inject: { menuTheme: { default: null } },
  data() {
    return {
      hover: false
    }
  },
  computed: {
    theme() {
      return unwrapTheme(this.menuTheme)
    },
    fillColor() {
      return this.hover ? this.theme.mid : this.theme.deep
    }
  }
}
</script>
