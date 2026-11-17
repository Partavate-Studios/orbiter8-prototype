<template>
  <!-- An empty belt section's six mining slots (D78, D82): small hexagons round it, where ships park to
       mine. Mine in yellow, others' in lavender, free ones as faint outlines; a full ship's slot shows
       free (it no longer holds it). -->
  <g>
    <g v-for="(slot, i) in shown" :key="i" :transform="`translate(${slot.x} ${slot.y})`">
      <polygon :points="HEX" :fill="slot.fill" :stroke="slot.stroke" stroke-width="0.35" />
    </g>
  </g>
</template>

<script>
import { YELLOW, TEXT_2 } from '@/libs/palette'

const RING = 6.5
const SIZE = 2.4
const HEX = Array.from({ length: 6 }, (_, i) => {
  const a = (i / 6) * Math.PI * 2 + Math.PI / 6
  return `${(SIZE * Math.cos(a)).toFixed(2)},${(SIZE * Math.sin(a)).toFixed(2)}`
}).join(' ')

export default {
  name: 'MiningSlots',
  props: {
    /** Six entries: { pilot, full } or null (sdk contracts.miningSlots). */
    slots: { type: Array, default: () => [] },
    me: { type: String, default: '' }
  },
  data() {
    return { HEX }
  },
  computed: {
    shown() {
      return Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2
        const holder = this.slots[i]
        const held = holder && !holder.full
        const mine = held && holder.pilot === this.me
        return {
          x: RING * Math.cos(a),
          y: RING * Math.sin(a),
          fill: mine ? YELLOW + '55' : held ? TEXT_2 + '44' : '#ffffff08',
          stroke: mine ? YELLOW : held ? TEXT_2 : '#ffffff55'
        }
      })
    }
  }
}
</script>
