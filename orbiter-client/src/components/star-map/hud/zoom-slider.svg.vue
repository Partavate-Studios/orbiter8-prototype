<template>
  <g>
    <g>
      <line stroke="#c3b3da66" stroke-width="1.2" x1="-64" y1="0" x2="64" y2="0" stroke-dasharray="4 2"></line>
      <line stroke="#00000044" stroke-width="1.2" x1="-64" y1="0" x2="64" y2="0" stroke-dasharray="4 2"></line>
      <line
        stroke-linecap="round"
        stroke="#000000aa"
        :x1="zoomMarkerX"
        y1="-4"
        :x2="zoomMarkerX"
        stroke-width="5"
        y2="4"
      ></line>
      <line
        stroke-linecap="round"
        stroke="#c3b3daaa"
        :x1="zoomMarkerX"
        y1="-4"
        :x2="zoomMarkerX"
        stroke-width="4"
        y2="4"
      ></line>
      <circle cx="-64" cy="0" r="8" stroke="#00000088" fill="#c3b3daee"></circle>
      <text x="-64" y="4.5" font-size="1em" fill="#000000" text-anchor="middle">-</text>
      <circle cx="64" cy="0" r="8" stroke="#00000088" fill="#c3b3daee"></circle>
      <text x="64" y="4.5" font-size="1em" fill="#000000" text-anchor="middle">+</text>

      <a cursor="pointer" @click.prevent="zoomBy(2)">
        <title>Zoom out (or scroll)</title>
        <circle cx="-64" cy="0" r="10" stroke="#ffffff00" fill="#c3b3da00"></circle
      ></a>
      <a cursor="pointer" @click.prevent="zoomBy(0.5)">
        <title>Zoom in (or scroll)</title>
        <circle cx="64" cy="0" r="10" stroke="#ffffff00" fill="#c3b3da00"></circle
      ></a>
    </g>
  </g>
</template>

<script>
import { mapActions, mapState } from 'pinia'

import { useUIStore } from '@/stores/ui'

export default {
  name: 'ZoomSlider',
  computed: {
    ...mapState(useUIStore, ['viewport']),
    zoomMarkerX() {
      return Math.min(64, Math.max(-64, 64 - (Math.log(this.viewport.scale * 100 + 0.75) * 12).toFixed(2)))
    }
  },
  methods: {
    ...mapActions(useUIStore, ['scaleAnimateBy']),
    zoomBy(scaler) {
      this.o8audio.playEffect('click')
      this.scaleAnimateBy({ scaler, time: 200 })
    }
  }
}
</script>
