<template>
  <g v-if="sprite?.position" :transform="'translate(' + cardUiTranslate + ')'">
    <g :transform="'scale(' + cardUiScale + ')'">
      <slot />
    </g>
  </g>
</template>

<script>
import { useStarMapStore } from '@/stores/starmap'
import { mapState } from 'pinia'
import { useUIStore } from '@/stores/ui'

export default {
  name: 'CardScaling',
  props: {
    sprite: {
      type: Object,
      default() {
        return {}
      }
    }
  },
  computed: {
    ...mapState(useUIStore, ['viewport', 'cameraMotionRemaining']),
    ...mapState(useStarMapStore, ['gameTime']),
    cardUiTranslate() {
      // Sprites are raw objects updated in place each frame; reading gameTime makes this re-evaluate per frame.
      void this.gameTime
      // position is the sprite's absolute place in the system (orbit + its parent's orbit).
      let x = this.sprite.position.x + this.viewport.x
      let y = this.sprite.position.y + this.viewport.y
      x = Math.round((x / this.viewport.scale) * 1000) / 1000
      y = Math.round((y / this.viewport.scale) * 1000) / 1000
      return x + ' ' + y
    },
    cardUiScale() {
      let cap = Math.min(1, Math.max(0, 1.5 - this.viewport.scale))
      let scale = 1 - ((this.cameraMotionRemaining - 5) * this.viewport.scale) / 15
      return Math.max(Math.min(scale, cap), 0)
    }
  }
}
</script>
