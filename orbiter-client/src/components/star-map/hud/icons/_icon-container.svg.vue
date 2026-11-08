<template>
  <g @mouseover="hover = true" @mouseleave="hover = false">
    <g clip-path="url(#icon-clip)">
      <circle cx="0" cy="0" r="30" :stroke="strokeColor" :stroke-width="tint ? 1.5 : 1" :fill="fillColor" />
      <g :transform="'scale(' + scaleSize + ')'">
        <slot />
      </g>
    </g>
  </g>
</template>

<script>
import { mapState } from 'pinia'
import { useConfigStore } from '@/stores/config'
import { mixHex } from '@/libs/card-theme'


export default {
  name: 'IconContainer',
  // A tint from an enclosing <tinted> (the HUD's buttons), or none.
  inject: { iconTint: { default: null } },
  props: {
    selected: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      hover: false
    }
  },
  computed: {
    ...mapState(useConfigStore, ['graphicsQuality']),
    tint() {
      // (Vue unwraps an injected computed; older versions hand over the ref itself.)
      const tint = this.iconTint
      return typeof tint === 'string' ? tint : (tint?.value ?? null)
    },
    strokeColor() {
      return this.tint ? this.tint + (this.hover || this.selected ? 'ff' : 'aa') : '#ffffff22'
    },
    fillColor: function () {
      // Tinted: the tint over the button's purple, solid (no blending on low graphics).
      if (this.tint) return mixHex('#230b41', this.tint, this.hover || this.selected ? 0.32 : 0.18)
      if (this.hover || this.selected) {
        return '#140828'
      } else {
        if (this.graphicsQuality > 2) {
          return '#00000044'
        } else {
          return '#230b41'
        }
      }
    },
    scaleSize: function () {
      if (this.hover || this.selected) {
        return 1.2
      } else {
        return 1
      }
    }
  }
}
</script>
