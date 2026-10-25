<template>
  <g>
    <g :transform="'translate(' + (1 - slotWidth / 2) + ' 0)'" @mouseover="hover = true" @mouseleave="hover = false">
      <defs>
        <clipPath :id="clipId">
          <rect x="5" y="5" :width="slotWidth - 10" rx="10" ry="10" height="35" />
        </clipPath>
      </defs>

      <rect
        x="5"
        y="5"
        :width="slotWidth - 10"
        rx="10"
        ry="10"
        height="35"
        :fill="slotBackground"
        stroke-width="1"
        :stroke="slotBorder"
      />

      <g :clip-path="'url(#' + clipId + ')'">
        <text :x="slotWidth - 15" y="20" fill="#ffffff88" text-anchor="end" font-size="0.75em">-{{ name }} </text>
        <text :x="slotWidth - 25" y="33" fill="#ffffff88" text-anchor="end" font-size="0.55em"
          >{{ blockId }} blocks old</text
        >
        <text :x="15" y="23" fill="#ffffff" text-anchor="start" font-size="0.8em">"{{ message }}"</text>
      </g>
    </g>
  </g>
</template>

<script>
import { mapState } from 'pinia'
import uniqueId from 'lodash/uniqueId'

import { useUIStore } from '@/stores/ui'
export default {
  name: 'ChatSlotContainer',
  props: {
    name: { type: String, default: '' },
    /** How many blocks ago the message was sent. */
    blockId: { type: Number, default: 0 },
    message: { type: String, default: '' }
  },
  data() {
    return {
      hover: false,
      // Unique per instance: the clip's shape depends on this component's size.
      clipId: uniqueId('menu-slot-clip-')
    }
  },
  computed: {
    ...mapState(useUIStore, ['viewport']),
    slotBackground() {
      return '#00000044'
    },
    slotBorder() {
      return '#ffffff22'
    },
    slotWidth() {
      return Math.min(this.viewport.width - 100, 700)
    }
  }
}
</script>
