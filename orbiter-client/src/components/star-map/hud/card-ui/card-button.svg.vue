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
      stroke-width="1"
    />
    <text
      fill="#000000"
      stroke="#00000033"
      stroke-width="4"
      x="65"
      y="10"
      :font-size="fitSize(text, 8, 122, 700)"
      font-weight="bold"
      text-anchor="middle"
    >
      {{ text }}
    </text>
    <text
      :fill="getTextColor"
      stroke="#ffffff"
      stroke-width="0"
      x="65"
      y="10"
      :font-size="fitSize(text, 8, 122, 700)"
      font-weight="bold"
      text-anchor="middle"
    >
      {{ text }}
    </text>
    <a cursor="pointer" @click.prevent="click" @mouseover="hover = true" @mouseout="hover = false">
      <rect x="5" y="5" width="130" height="14" stroke="#5b1aaa00" fill="#3d127300" stroke-width="2"
    /></a>
  </g>
</template>

<script>
import { fitSize } from '@/libs/fit-text'
export default {
  name: 'CardButton',
  props: {
    text: {
      type: String,
      default: 'default'
    },
    /** A move that can't be made now: dimmed text (the menu still explains why when chosen). */
    enabled: { type: Boolean, default: true }
  },
  emits: ['buttonclick'],
  data() {
    return {
      hover: false
    }
  },
  computed: {
    // The menu's buttons are the same purple on every card (Koda: consistent buttons); only the
    // card's border and title take the selection's color.
    getButtonFill() {
      return this.hover ? 'url(#cardGradient45)' : 'url(#cardGradient)'
    },
    getButtonStroke() {
      return this.hover ? '#5b1aaaff' : '#5b1aaa88'
    },
    getTextColor() {
      if (this.enabled) {
        return '#ffffff'
      }
      return '#ffffff66'
    }
  },
  methods: {
    fitSize,
    click() {
      this.o8audio.playEffect('click')
      this.$emit('buttonclick')
    }
  }
}
</script>

<style lang="scss"></style>
