<template>
  <g>
    <card-background />

    <rect
        x="-65"
        y="-65"
        ry="5"
        rx="25"
        width="130"
        height="15"
        stroke="#5b1aaa"
        fill="url(#cardGradient)"
        stroke-width="0.5" />


    <rect
        x="-65"
        y="35"
        ry="5"
        rx="25"
        width="130"
        height="100"
        stroke="#000000"
        fill="#000000"
        opacity="0.25"
        stroke-width="0.5" />

    <card-text v-if="objectId != null" :objectId="objectId" />
    <!-- todo: should I use a sprite-transform here? -->
    <g :transform="'translate(0 0) rotate(' + spriteRotation + ')'">
        <sprite :objectId="objectId" />
    </g>

  </g>
</template>

<script>
import { mapState } from 'pinia'

import CardBackground from './card-background.svg'
import CardText from './card-text.svg'
import Sprite from './sprite.svg'

import { useStarMapStore } from '@/stores/starmap'

export default {
  name: 'CardInfo',
  components: {
    Sprite,
    CardBackground,
    CardText,
  },
  props: {
    objectId: null,
  },
  computed: {
    ...mapState(useStarMapStore, [
      'gameTime',
      'systemObjects'
    ]),
    spriteRotation () {
      // Sprites are raw objects updated in place each frame; reading gameTime makes this re-evaluate per frame.
      void this.gameTime
      // 0.25° steps: only touch the DOM when the rotation visibly changes.
      return Math.round(this.systemObjects[this.objectId].telemetry.rotation / 0.25) * 0.25
    }
  }
}
</script>

<style lang="scss">
</style>
