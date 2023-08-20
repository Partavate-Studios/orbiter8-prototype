<template>
  <g>
    <linearGradient id="menuGradient"
      x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#5c1aae" stop-opacity="0.9"/>
        <stop offset="10%" stop-color="#280b4b" stop-opacity="1"/>
        <stop offset="50%" stop-color="#5c1aae" stop-opacity="1"/>
        <stop offset="90%" stop-color="#280b4b" stop-opacity="1"/>
        <stop offset="100%" stop-color="#5c1aae" stop-opacity="0.9"/>
      </linearGradient>


    <rect
      :x="menuLeft"
      :y="menuTop"
      :width="menuWidth"
      :height="menuHeight"
      fill="url(#menuGradient)"
      stroke-width="4"
      stroke="#00000022"
      rx="10" ry="10" />

    <rect
      :x="menuLeft + padding / 2"
      :y="menuTop + padding / 2"
      :width="menuWidth - padding"
      :height="menuHeight - padding"
      fill="#280b4baa"
      stroke="#ffffff22"
      stroke-width="4"
      rx="5" ry="5" />
  </g>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'MenuBackground',
  data () {
    return {
      padding: 25,
      maxWidth: 800
    }
  },
  computed: {
    ...mapGetters('UI', [
      'leftMostX',
      'rightMostX',
      'topMostY',
      'bottomMostY',
      'viewport'
    ]),
    menuLeft () {
      let shift = 0
      if (this.viewport.width > this.maxWidth) {
        shift = (this.viewport.width - this.maxWidth) / 2
      }
      return this.leftMostX + this.padding / 2 + shift
    },
    menuTop () {
      return this.topMostY + this.padding
    },
    menuWidth () {
      return Math.min(this.maxWidth, this.viewport.width) - (this.padding)
    },
    menuHeight () {
      return this.viewport.height
    }
  }
}
</script>
