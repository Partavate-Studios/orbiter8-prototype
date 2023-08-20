<template>
  <g>
    <g :transform="'translate(' + (1 - slotWidth / 2) + ' 0)'" @mouseover="hover = true" @mouseleave="hover = false" >
      <defs>
        <clipPath id="menu-slot-clip">
          <rect x="5" y="5" :width="slotWidth -10" rx="10" ry="10" height="60" />
        </clipPath>
      </defs>

      <rect x="5" y="5" :width="slotWidth - 10" rx="10" ry="10" height="60" :fill="slotBackground" stroke-width="1" :stroke="slotBorder" />

      <g  clip-path="url(#menu-slot-clip)">
        <slot />
      </g>
    </g>
  </g>
</template>

<script>

import { mapGetters } from 'vuex'
export default {
  name: 'MenuSlotContainer',
  data () {
    return {
      hover: false
    }
  },
  props: {
    highlight: {
      default: false
    }
  },
  computed: {
    ...mapGetters('UI', [
      'viewport'
    ]),
    slotBackground() {
      if (this.hover) {
        return '#00000066'
      }
      return '#00000044'
    },
    slotBorder() {
      if (this.highlight) {
        return '#ffffff88'
      }
      else if (this.hover) {
        return '#ffffff66'
      }
      return '#ffffff22'
    },
    slotWidth() {
      return Math.min(this.viewport.width - 100, 700);
    }
  }
}
</script>
