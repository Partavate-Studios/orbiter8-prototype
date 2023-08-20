<template>
    <g>
      <g>
        <line
          stroke="#c3b3da66"
          stroke-width="1.2"
          x1="-64"
          y1="0"
          x2="64"
          y2="0"
          stroke-dasharray="4 2" ></line>
        <line
          stroke="#00000044"
          stroke-width="1.2"
          x1="-64"
          y1="0"
          x2="64"
          y2="0"
          stroke-dasharray="4 2" ></line>
        <line
          stroke-linecap="round"
          stroke="#000000aa"
          :x1="zoomLine1()"
          y1="-4"
          :x2="zoomLine1()"
          stroke-width="5"
          y2="4" ></line>
        <line
          stroke-linecap="round"
          stroke="#c3b3daaa"
          :x1="zoomLine1()"
          y1="-4"
          :x2="zoomLine1()"
          stroke-width="4"
          y2="4" ></line>
        <circle cx="-64" cy="0" r="8" stroke="#00000088" fill="#c3b3daee"></circle>
          <text
            x="-64" y="4.5"
            font-size="1em"
            fill="#000000"
            text-anchor="middle">-</text>
        <circle cx="64" cy="0" r="8" stroke="#00000088" fill="#c3b3daee"></circle>
          <text
            x="64" y="4.5"
            font-size="1em"
            fill="#000000"
            text-anchor="middle">+</text>

      <a
        v-on:click.prevent="o8audio.playEffect('click'); scaleAnimateBy({scaler: 2, time: 200})"
        cursor="pointer">
        <circle cx="-64" cy="0" r="10" stroke="#ffffff00" fill="#c3b3da00"></circle></a>
      <a
        v-on:click.prevent="o8audio.playEffect('click'); scaleAnimateBy({scaler: 0.5, time: 200})"
        cursor="pointer">
        <circle cx="64" cy="0" r="10" stroke="#ffffff00" fill="#c3b3da00"></circle></a>
      </g>
    </g>
</template>

<script>

import { mapGetters, mapMutations } from 'vuex'

export default {
  name: 'ZoomSlider',
  data () {
    return {
    }
  },
  computed: {
    ...mapGetters('UI', [
      'viewport'
    ])
  },
  methods: {
    ...mapMutations('UI', [
      'scaleAnimateBy'
    ]),
    zoomLine1 () {
      return Math.min(64, Math.max(-64, 64 - (Math.log(this.viewport.scale * 100 + 0.75) * 12).toFixed(2)))
    }
  }
}
</script>
