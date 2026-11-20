<template>
  <!-- Minerva's emblem (from Enterprise Circuit): an owl's face, about 180 x 100 units, centered. Its
       eight parts are shared with her animated face (components/minerva/minerva-parts.js). -->
  <g :fill="color">
    <g :transform="`translate(${-origin} ${-origin})`">
      <path v-for="part in parts" :key="part.id" :d="part.d" />
    </g>
  </g>
</template>

<script>
import { ART_ORIGIN, PARTS } from '@/components/minerva/minerva-parts'

export default {
  name: 'MinervaEmblem',
  props: {
    color: {
      type: String,
      default: '#ffffff'
    }
  },
  data() {
    return { parts: PARTS, origin: ART_ORIGIN }
  }
}
</script>
