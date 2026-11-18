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
      :stroke="theme === CARD_THEMES.ship ? theme.stroke : theme.base"
      :fill="theme === CARD_THEMES.ship ? titleFill : theme.base"
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
    <!-- what's built on it, arced under its picture -->
    <card-works :object-id="objectId" />
    <!-- yours: a yellow badge on the card's corner (Koda, 2026-11-14, row F2); never the frame, so a
         planet can be yours and under siege at once -->
    <g v-if="mine" transform="translate(66 -70)">
      <circle r="8" :fill="YELLOW" stroke="#1b1531" stroke-width="1.5" />
      <path d="M0 -4.6L1.35 -1.4L4.4 -1.4L1.9 0.6L2.85 3.9L0 2L-2.85 3.9L-1.9 0.6L-4.4 -1.4L-1.35 -1.4Z" fill="#1b1531" />
      <title>Yours</title>
    </g>
  </g>
</template>

<script>
import { mapState } from 'pinia'

import CardBackground from './card-background.svg'
import CardText from './card-text.svg'
import Sprite from './sprite.svg'
import CardWorks from './card-works.svg'

import { useStarMapStore } from '@/stores/starmap'
import { usePlayerStore } from '@/stores/player'
import { CARD_GRAY, PINK_LIGHT, YELLOW } from '@/libs/palette'
import { CARD_THEMES } from '@/libs/card-theme'

export default {
  name: 'CardInfo',
  components: {
    Sprite,
    CardWorks,
    CardBackground,
    CardText
  },
  inject: { cardTheme: { default: null } },
  props: {
    /** The selected object's key (see sdk/system.js objectKey). */
    objectId: { type: String, default: null }
  },
  data() {
    return { CARD_GRAY, PINK_LIGHT, YELLOW, CARD_THEMES }
  },
  computed: {
    /** The card's colors (libs/card-theme.js, from card-ui), purple outside a card. */
    theme() {
      const t = this.cardTheme
      return (typeof t === 'string' || !t ? null : (t.base ? t : t.value)) ?? CARD_THEMES.ship
    },
    titleFill() {
      const key = Object.keys(CARD_THEMES).find((k) => CARD_THEMES[k] === this.theme)
      return key === 'ship' ? 'url(#cardGradient)' : `url(#card-${key})`
    },
    /** Something the pilot owns (sdk/system.js isMine): a planet, their ship. */
    mine() {
      return Boolean(this.systemObjects[this.objectId]?.isMine)
    },
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
