<template>
  <!-- Tints the round HUD button inside it (icons/_icon-container.svg.vue) by what it does
       (libs/palette.js HUD_TINT): a colored rim and a faint fill; the icon itself stays white. A
       button with a hover tint (HUD_HOVER) brightens to it under the pointer. -->
  <g @pointerenter="hover = true" @pointerleave="hover = false"><slot /></g>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'Tinted',
  provide() {
    return { iconTint: computed(() => (this.hover && this.hoverTint ? this.hoverTint : this.tint)) }
  },
  props: {
    /** A color (#rrggbb). */
    tint: { type: String, required: true },
    /** The color under the pointer, if it brightens (#rrggbb). */
    hoverTint: { type: String, default: null }
  },
  data() {
    return { hover: false }
  }
}
</script>
