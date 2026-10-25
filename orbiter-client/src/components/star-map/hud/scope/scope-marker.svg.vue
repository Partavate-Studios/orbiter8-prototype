<template>
  <a
    v-on:click.prevent="o8audio.playEffect('click'); selectSprite(spriteKey)"
    v-on:mouseover="setSpriteToDisplay(spriteKey)"
    v-on:mouseout="setSpriteToDisplay(null)"
    cursor="pointer"><slot></slot></a>
</template>

<script>
import { useUIStore } from '@/stores/ui'
import { mapActions } from 'pinia'

// A clickable scope marker: clicking selects its sprite, hovering labels it in the scope.
export default {
  name: 'ScopeMarker',
  props: ['spriteKey'],
  methods: {
    ...mapActions(useUIStore, [
      'selectSprite',
      'setSpriteToDisplay'
    ])
  }
}
</script>
