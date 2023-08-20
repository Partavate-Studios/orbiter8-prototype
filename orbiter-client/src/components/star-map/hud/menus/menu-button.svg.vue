<template>
  <g dominant-baseline="middle" transform="">
    <rect
      x="-125"
      y="-16"
      ry="5"
      rx="5"
      width="250"
      height="32"
      :stroke="getButtonStroke"
      :fill="getButtonFill"
      stroke-width="1" />
      <text
          fill="#00000044"
          stroke="#00000044"
          stroke-width="6"
          x="0"
          y="1"
          font-size="1.1em"
          font-weight="bold"
          text-anchor="middle">
          {{ text }}
      </text>
      <text
          :fill="getTextColor"
          stroke="#ffffff"
          stroke-width="0"
          x="0"
          y="0"
          font-size="1.1em"
          font-weight="bold"
          text-anchor="middle">
          {{ text }}
      </text>
      <a
        v-if="enabled"
        v-on:click.prevent="doClick()"
        v-on:mouseover="hover = true"
        v-on:mouseout="hover = false"
        cursor="pointer">
        <rect
          x="-125"
          y="-16"
          width="250"
          height="32"
          stroke="#5b1aaa00"
          fill="#3d127300"
          stroke-width="2" /></a>
  </g>
</template>

<script>


export default {
  name: 'MenuButton',
  components: {
  },
  props: {
    text: {
      type: String,
      default: 'default'
    },
    enabled: {
      type: Boolean,
      default: true
    }
  },
  data () {
    return {
      hover: false
    }
  },
  methods: {
    doClick() {
      console.log('clickage')
      this.o8audio.playEffect['click']
      this.$emit('buttonclick')
    }
  },
  computed: {
    getButtonFill () {
      if (this.hover) {
        return ('#310e5b')
      }
      return ('#5D1EB044')
    },
    getButtonStroke () {
      if (this.hover) {
        return ('#5b1aaaff')
      }
      return ('#5D1EB0')
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
