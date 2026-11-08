<template>
  <g dominant-baseline="middle">
    <rect
      x="-125"
      y="-16"
      ry="5"
      rx="5"
      width="250"
      height="32"
      :stroke="getButtonStroke"
      :fill="getButtonFill"
      stroke-width="1"
    />
    <text
      fill="#00000044"
      stroke="#00000044"
      stroke-width="6"
      x="0"
      y="1"
      font-size="1.1em"
      font-weight="bold"
      text-anchor="middle"
    >
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
      text-anchor="middle"
    >
      {{ text }}
    </text>
    <a v-if="enabled" cursor="pointer" @click.prevent="doClick()" @mouseover="hover = true" @mouseout="hover = false">
      <rect x="-125" y="-16" width="250" height="32" stroke="#5b1aaa00" fill="#3d127300" stroke-width="2"
    /></a>
  </g>
</template>

<script>
import { unwrapTheme } from '@/libs/card-theme'

export default {
  name: 'MenuButton',
  inject: { menuTheme: { default: null } },
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
  emits: ['buttonclick'],
  data() {
    return {
      hover: false
    }
  },
  computed: {
    /** The menu's colors (menu-container); Koda's purple outside one. */
    theme() {
      return unwrapTheme(this.menuTheme)
    },
    getButtonFill() {
      return this.hover ? this.theme.deep : this.theme.mid + '44'
    },
    getButtonStroke() {
      return this.hover ? this.theme.stroke : this.theme.mid
    },
    getTextColor() {
      if (this.enabled) {
        return '#ffffff'
      }
      return '#ffffff66'
    }
  },
  methods: {
    doClick() {
      this.o8audio.playEffect('click')
      this.$emit('buttonclick')
    }
  }
}
</script>

<style lang="scss"></style>
