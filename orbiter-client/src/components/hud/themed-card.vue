<template>
  <!-- One body's card (card-ui/info.svg.vue) in its own colors, so two cards can be held at once
       (selection-panel.vue: a planet's card, and its port's or moon's dealt out beside it). -->
  <svg :viewBox="CARD_BOX" font-family="Ubuntu, sans-serif"><info :object-id="objectId" /></svg>
</template>

<script>
import { computed } from 'vue'
import { useStarMapStore } from '@/stores/starmap'
import { CARD_THEMES, cardThemeKey } from '@/libs/card-theme'
import Info from '@/components/star-map/hud/card-ui/info.svg'

/** The card with a margin for its siege frame and its "yours" badge. */
export const CARD_BOX = '-80 -80 160 230'

export default {
  name: 'ThemedCard',
  components: { Info },
  provide() {
    return { cardTheme: computed(() => CARD_THEMES[cardThemeKey(useStarMapStore().systemObjects[this.objectId])]) }
  },
  props: {
    objectId: { type: String, required: true }
  },
  data() {
    return { CARD_BOX }
  }
}
</script>
