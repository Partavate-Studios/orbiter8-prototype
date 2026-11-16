<template>
  <!-- In the map's HUD layer: a dashed ring on the selection and, on wide screens, a dashed leader
       from it to its card at the bottom left (the old cards' ring and leaders, with the cards moved
       out of the middle). It shrinks away while the camera flies, as the cards did. -->
  <g v-if="at" pointer-events="none" :stroke="color" stroke-width="2" stroke-dasharray="3 3" fill="none" :opacity="at.s">
    <circle :cx="at.x" :cy="at.y" :r="RADIUS * at.s" />
    <path v-if="leader" :d="leader" />
  </g>
</template>

<script>
import { mapState } from 'pinia'
import { useStarMapStore } from '@/stores/starmap'
import { useUIStore } from '@/stores/ui'
import { WORLD_OFFSET_Y } from '@/constants'
import { CARD_THEMES, cardThemeKey } from '@/libs/card-theme'
import { openMenuName } from '@/components/star-map/hud/menus/menu-container/_menu-container.svg.vue'
import { EDGE, CARD_WIDTH, CARD_HEIGHT } from './layout'

const RADIUS = 95

export default {
  name: 'SelectionRing',
  data() {
    return { RADIUS }
  },
  computed: {
    ...mapState(useUIStore, ['selected', 'showScope', 'viewport', 'cameraMotionRemaining', 'screenSize', 'groupPixels', 'hudScale', 'viewRatio']),
    ...mapState(useStarMapStore, ['gameTime', 'systemObjects', 'sprites']),
    /** A menu is open over the middle: the ring would only show through its edges. */
    menuOpen() {
      return openMenuName(useUIStore()) !== null
    },
    color() {
      return CARD_THEMES[cardThemeKey(this.systemObjects[this.selected])].accent + '88'
    },
    /** Where the selection is on screen (map units from the center), and how big the ring is. */
    at() {
      // Sprites are raw objects updated in place each frame; reading gameTime re-evaluates this per frame.
      void this.gameTime
      const sprite = this.selected != null ? this.sprites[this.selected] : null
      if (!sprite?.position || !this.showScope || this.menuOpen) return null
      const cap = Math.min(1, Math.max(0, 1.5 - this.viewport.scale))
      const s = Math.max(Math.min(1 - ((this.cameraMotionRemaining - 5) * this.viewport.scale) / 15, cap), 0)
      if (s <= 0.02) return null
      const round = (n) => Math.round(n * 100) / 100
      return {
        x: round((sprite.position.x + this.viewport.x) / this.viewport.scale),
        y: round((sprite.position.y + this.viewport.y) / this.viewport.scale + WORLD_OFFSET_Y),
        s: round(s)
      }
    },
    /** From the ring's lower left to the card's top right corner, with the old leaders' elbow. */
    leader() {
      if (this.viewRatio <= 1 || !this.at) return null
      const units = (px) => px / this.groupPixels
      const cardX = units((EDGE + CARD_WIDTH) * this.hudScale - this.screenSize.width / 2) + 6
      const cardY = units(this.screenSize.height / 2 - (EDGE + CARD_HEIGHT * 0.86) * this.hudScale)
      const r = RADIUS * this.at.s * Math.SQRT1_2
      const from = { x: this.at.x - r, y: this.at.y + r }
      const drop = cardY - from.y
      if (drop < 10 || from.x - drop < cardX + 20) return null
      return `M${from.x} ${from.y}L${from.x - drop} ${cardY}H${cardX}`
    }
  }
}
</script>
