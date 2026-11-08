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
      font-size="0.5em"
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
      font-size="0.5em"
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
import { CARD_THEMES } from '@/libs/card-theme'

export default {
  name: 'CardButton',
  inject: { cardTheme: { default: null } },
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
    /** The card's colors (libs/card-theme.js, from card-ui), purple outside a card. */
    theme() {
      const t = this.cardTheme
      return (typeof t === 'string' || !t ? null : (t.base ? t : t.value)) ?? CARD_THEMES.ship
    },
    themeKey() {
      return Object.keys(CARD_THEMES).find((key) => CARD_THEMES[key] === this.theme)
    },
    getButtonFill() {
      if (this.themeKey === 'ship') return this.hover ? 'url(#cardGradient45)' : 'url(#cardGradient)'
      return this.hover ? `url(#cardHover-${this.themeKey})` : `url(#card-${this.themeKey})`
    },
    getButtonStroke() {
      return this.theme.stroke + (this.hover ? 'ff' : '88')
    },
    getTextColor() {
      if (this.enabled) {
        return '#ffffff'
      }
      return '#ffffff66'
    }
  },
  methods: {
    click() {
      this.o8audio.playEffect('click')
      this.$emit('buttonclick')
    }
  }
}
</script>

<style lang="scss"></style>
