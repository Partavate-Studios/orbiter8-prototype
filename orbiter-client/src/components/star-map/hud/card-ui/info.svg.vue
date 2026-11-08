<template>
  <g>
    <!-- A planet under siege: a pink frame around its card (pink needs you) -->
    <rect
      v-if="besieged"
      x="-78"
      y="-78"
      width="156"
      height="226"
      rx="29"
      ry="9"
      fill="none"
      :stroke="PINK_LIGHT"
      stroke-width="2"
      stroke-dasharray="6 4"
    />
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
      stroke-width="0.5"
    />

    <rect
      x="-65"
      y="35"
      ry="5"
      rx="25"
      width="130"
      height="100"
      stroke="#000000"
      :fill="CARD_GRAY"
      opacity="0.6"
      stroke-width="0.5"
    />

    <card-text v-if="objectId != null" :object-id="objectId" />
    <g :transform="'rotate(' + spriteRotation + ')'">
      <sprite :object-id="objectId" />
    </g>
  </g>
</template>

<script>
import { mapState } from 'pinia'

import CardBackground from './card-background.svg'
import CardText from './card-text.svg'
import Sprite from './sprite.svg'

import { useStarMapStore } from '@/stores/starmap'
import { usePlayerStore } from '@/stores/player'
import { CARD_GRAY, PINK_LIGHT } from '@/libs/palette'

export default {
  name: 'CardInfo',
  components: {
    Sprite,
    CardBackground,
    CardText
  },
  props: {
    /** The selected object's key (see sdk/system.js objectKey). */
    objectId: { type: String, default: null }
  },
  data() {
    return { CARD_GRAY, PINK_LIGHT }
  },
  computed: {
    /** A planet with a siege running against it. */
    besieged() {
      const object = this.systemObjects[this.objectId]
      return object?.type === 'planet' && Boolean(usePlayerStore().siegeAt(object.id))
    },
    ...mapState(useStarMapStore, ['gameTime', 'systemObjects', 'sprites']),
    spriteRotation() {
      // Sprites are raw objects updated in place each frame; reading gameTime makes this re-evaluate per frame.
      void this.gameTime
      // 0.25° steps: only touch the DOM when the rotation visibly changes.
      return Math.round(this.sprites[this.objectId].telemetry.rotation / 0.25) * 0.25
    }
  }
}
</script>

<style lang="scss"></style>
