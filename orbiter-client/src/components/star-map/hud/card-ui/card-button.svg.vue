<template>
  <g>
    <rect
      x="0"
      y="0"
      ry="5"
      rx="25"
      width="130"
      height="14"
      :stroke="getButtonStroke"
      :fill="getButtonFill"
      stroke-width="1" />
      <text
          fill="#000000"
          stroke="#00000033"
          stroke-width="4"
          x="65"
          y="10"
          font-size="0.5em"
          font-weight="bold"
          text-anchor="middle">
          {{ text }}
      </text>
      <text
          :fill="getTextColor"
          stroke="#ffffff"
          stroke-width="0"
          x="65"
          y="10"
          font-size="0.5em"
          font-weight="bold"
          text-anchor="middle">
          {{ text }}
      </text>
      <a
        v-on:click.prevent="o8audio.playEffect('click');$emit('buttonclick')"
        v-on:mouseover="hover = true"
        v-on:mouseout="hover = false"
        cursor="pointer">
        <rect
          x="5"
          y="5"
          width="130"
          height="14"
          stroke="#5b1aaa00"
          fill="#3d127300"
          stroke-width="2" /></a>
  </g>
</template>

<script>


export default {
  name: 'Button',
  components: {
  },
  props: {
    text: {
      type: String,
      default: 'default'
    }
  },
  data () {
    return {
      hover: false,
      enabled: true
    }
  },
  methods: {
  },
  computed: {
    getButtonFill () {
      if (this.hover) {
        return ('url(#cardGradient45)')
      }
      return ('url(#cardGradient)')
    },
    getButtonStroke () {
      if (this.hover) {
        return ('#5b1aaaff')
      }
      return ('#5b1aaa88')
    },
    getTextColor () {
      if (this.enabled) {
        return ('#ffffff')
      }
      return ('#ffffff66')
    },
  }
}
</script>

<style lang="scss">
</style>
