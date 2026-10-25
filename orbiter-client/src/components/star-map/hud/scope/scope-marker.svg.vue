<template>
  <a
    cursor="pointer"
    @click.prevent="select"
    @mouseover="setSpriteToDisplay(spriteKey)"
    @mouseout="setSpriteToDisplay(null)"
    ><slot></slot
  ></a>
</template>

<script>
import { useUIStore } from '@/stores/ui'
import { mapActions } from 'pinia'

// A clickable scope marker: clicking selects its sprite, hovering labels it in the scope.
export default {
  name: 'ScopeMarker',
  props: {
    spriteKey: { type: String, required: true }
  },
  methods: {
    ...mapActions(useUIStore, ['selectSprite', 'setSpriteToDisplay']),
    select() {
      this.o8audio.playEffect('click')
      this.selectSprite(this.spriteKey)
    }
  }
}
</script>
