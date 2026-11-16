<template>
  <!-- Tints the round HUD button inside it (icons/_icon-container.svg.vue) by what it does
       (libs/palette.js HUD_TINT): a colored rim and a faint fill; the icon itself stays white. Given a
       resting tint (HUD_REST), it rests softer and brightens to the full tint under the pointer. -->
  <g @pointerenter="hover = true" @pointerleave="hover = false"><slot /></g>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'Tinted',
  provide() {
    return { iconTint: computed(() => (this.rest && !this.hover ? this.rest : this.tint)) }
  },
  props: {
    /** A color (#rrggbb). */
    tint: { type: String, required: true },
    /** The color at rest, if it brightens under the pointer (#rrggbb). */
    rest: { type: String, default: null }
  },
  data() {
    return { hover: false }
  }
}
</script>
