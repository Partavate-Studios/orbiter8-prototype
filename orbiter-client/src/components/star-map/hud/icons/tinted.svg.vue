<template>
  <!-- Tints the round HUD button inside it (icons/_icon-container.svg.vue) by what it does
       (libs/palette.js HUD_TINT): a colored rim and a faint fill; the icon itself stays white. -->
  <g><slot /></g>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'Tinted',
  provide() {
    return { iconTint: computed(() => this.tint) }
  },
  props: {
    /** A color (#rrggbb). */
    tint: { type: String, required: true }
  }
}
</script>
