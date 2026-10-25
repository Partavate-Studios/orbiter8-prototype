<template>
  <g @mouseover="hover = true" @mouseleave="hover = false">
      <g  clip-path="url(#icon-clip)">
        <circle
          cx="0"
          cy="0"
          r="30"
          stroke="#ffffff22"
          stroke-width="1"
          :fill="fillColor" />
        <g :transform="'scale(' + scaleSize + ')'">
          <slot />
        </g>
      </g>
  </g>
</template>

<script>
import { mapState } from 'pinia'
import { useConfigStore } from '@/stores/config'

export default {
  name: 'IconContainer',
  data () {
    return {
      hover: false
    }
  },
  props: {
    selected: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    ...mapState(useConfigStore, [
      'graphicsQuality'
    ]),
    fillColor: function() {
      if (this.hover || this.selected) {
        return "#140828"
      } else {
        if (this.graphicsQuality > 2) {
          return "#00000044"
        } else {
          return "#230b41"

        }
      }
    },
    scaleSize: function() {
      if (this.hover || this.selected) {
        return 1.2
      } else {
        return 1
      }
    }
  }
}
</script>
