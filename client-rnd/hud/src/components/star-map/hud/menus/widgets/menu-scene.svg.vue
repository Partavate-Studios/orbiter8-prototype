<template>
  <!-- A menu's little picture of what's happening (Koda, round 2, item 7: "little pictures to help show
       what's happening the way the port trade does"): two things, the game's art or a body's own sprite,
       and what passes between them as an arrow with words, in the trade menu's frame. In the menus'
       units, centered on x = 0 from y = 0 down to `height`. -->
  <g class="menu-scene">
    <rect :x="-width / 2" y="0" :width="width" :height="height" rx="4" fill="#00000022" stroke="#c3b3da33" stroke-width="0.75" />
    <g v-for="side in sides" :key="side.key" :transform="`translate(${side.x} ${height / 2})`">
      <image v-if="side.art" :href="side.art" :x="-side.size / 2" :y="-side.size / 2" :width="side.size" :height="side.size" />
      <g v-else-if="side.sprite" :transform="`scale(${side.spriteScale})`"><sprite :object-id="side.sprite" /></g>
      <text v-if="side.label" :y="height / 2 - 7" text-anchor="middle" font-size="9" fill="#bdb5d4">{{ side.label }}</text>
    </g>
    <g v-if="arrow" :transform="`translate(0 ${height / 2})`" font-size="11">
      <line :x1="-gap" :x2="gap" y1="0" y2="0" :stroke="arrow.color || '#c3b3da'" stroke-width="2" stroke-dasharray="6 4" stroke-linecap="round" />
      <path v-if="arrow.direction !== 'left'" :d="`M${gap - 2} -5L${gap + 7} 0L${gap - 2} 5Z`" :fill="arrow.color || '#c3b3da'" />
      <path v-if="arrow.direction !== 'right'" :d="`M${-gap + 2} -5L${-gap - 7} 0L${-gap + 2} 5Z`" :fill="arrow.color || '#c3b3da'" />
      <text v-if="arrow.label" y="-9" text-anchor="middle" fill="#f1eefa">{{ arrow.label }}</text>
      <text v-if="arrow.note" y="17" text-anchor="middle" font-size="9" fill="#bdb5d4">{{ arrow.note }}</text>
    </g>
    <slot />
  </g>
</template>

<script>
import Sprite from '@/components/star-map/hud/card-ui/sprite.svg'

export default {
  name: 'MenuScene',
  components: { Sprite },
  props: {
    /** What's on the left and right: { art: url } (assets/art/*.svg), or { sprite: objectKey }; and a label. */
    left: { type: Object, default: null },
    right: { type: Object, default: null },
    /** What passes between: { label, note, direction: 'right' | 'left' | 'both', color }. */
    arrow: { type: Object, default: null },
    width: { type: Number, default: 350 },
    height: { type: Number, default: 92 }
  },
  computed: {
    sides() {
      const size = this.height - 14
      return [
        { key: 'left', x: -this.width / 2 + 62, ...this.left },
        { key: 'right', x: this.width / 2 - 62, ...this.right }
      ]
        .filter((side) => side.art || side.sprite)
        .map((side) => ({ ...side, size: side.size ?? size, spriteScale: side.spriteScale ?? (size / 70) }))
    },
    /** Half the arrow's length. */
    gap() {
      return this.width / 2 - 130
    }
  }
}
</script>
