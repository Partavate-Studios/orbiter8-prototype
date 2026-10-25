<template>
  <g>
    <g :transform="'translate(' + (1 - slotWidth / 2) + ' 0)'" @mouseover="hover = true" @mouseleave="hover = false">
      <defs>
        <clipPath :id="clipId">
          <rect x="5" y="5" :width="slotWidth - 10" rx="10" ry="10" height="60" />
        </clipPath>
      </defs>

      <rect
        x="5"
        y="5"
        :width="slotWidth - 10"
        rx="10"
        ry="10"
        height="60"
        :fill="slotBackground"
        stroke-width="1"
        :stroke="slotBorder"
      />

      <g :clip-path="'url(#' + clipId + ')'">
        <slot />
      </g>
    </g>
  </g>
</template>

<script>
import { mapState } from 'pinia'
import uniqueId from 'lodash/uniqueId'

import { useUIStore } from '@/stores/ui'
export default {
  name: 'MenuSlotContainer',
  data() {
    return {
      hover: false,
      // Unique per instance: the clip's shape depends on this component's size.
      clipId: uniqueId('menu-slot-clip-')
    }
  },
  props: {
    highlight: {
      default: false
    }
  },
  computed: {
    ...mapState(useUIStore, ['viewport']),
    slotBackground() {
      if (this.hover) {
        return '#00000066'
      }
      return '#00000044'
    },
    slotBorder() {
      if (this.highlight) {
        return '#ffffff88'
      } else if (this.hover) {
        return '#ffffff66'
      }
      return '#ffffff22'
    },
    slotWidth() {
      return Math.min(this.viewport.width - 100, 700)
    }
  }
}
</script>
