<template>
  <g>

    <g v-if="showScope"
        :transform="'scale(' + (scale) + ')'">

      <g
        v-for="(sprite, key) in systemObjects"
        v-bind:sprite="sprite"
        :key="'svg-mini-sprite-' + key">

        <g
          v-if="sprite.type === 'planet'"
          :opacity = "markerOpacity(sprite)"
          :transform="'rotate(' + bearingToSprite(sprite) + ')'">
          <a
            v-on:click.prevent="o8audio.playEffect('click'); selectSprite(key)"
            v-on:mouseover="setSpriteToDisplay(key)"
            v-on:mouseout="setSpriteToDisplay(null)"
            cursor="pointer">
            <compass-planet></compass-planet></a>
        </g>

        <g
          v-if="isMyShip(sprite)"
          :opacity = "markerOpacity(sprite)"
          :transform="'rotate(' + bearingToSprite(sprite) + ')'">
          <g transform="translate(0 140) rotate(180)">
            <a
              v-on:click.prevent="o8audio.playEffect('click'); selectSprite(key)"
              v-on:mouseover="setSpriteToDisplay(key)"
              v-on:mouseout="setSpriteToDisplay(null)"
              cursor="pointer"><ship></ship></a>
          </g>
        </g>
      </g>

      <g v-if="((spriteToDisplay != null) &&  (spriteToDisplay != selected))" pointer-events="none">
        <circle cx="0" cy="0" r="99" stroke-width="0" fill="url(#scopeFill)" ></circle>

        <g stroke-width="0.25" font-weight="bold" stroke="#280b4bee" fill="#ffffff">
          <text
            v-if="(isMyShip(systemObjects[spriteToDisplay]))"
            x="0" y="-10"
            font-size="0.85em"
            text-anchor="middle"
            alignment-baseline="central"> (My Ship)</text>
          <text
            v-else
            x="0" y="-10"
            font-size="0.85em"
            text-anchor="middle"
            alignment-baseline="central"> ({{ systemObjects[spriteToDisplay].type }} #{{ systemObjects[spriteToDisplay].objectId }}) </text>
          <text
            x="0" y="10"
            font-size="1.25em"
            text-anchor="middle"
            alignment-baseline="central">{{ systemObjects[spriteToDisplay].name }}</text>
        </g>
      </g>
      <g
        v-if="(systemObjects.star && markerOpacity(systemObjects.star))"
        :transform="'rotate(' + bearingToSprite(systemObjects.star) + ')'"
        stroke-width="4"
        stroke-color="#ffffff"
        :stroke-opacity="markerOpacity(systemObjects.star)"
      >
        <compass-arrow></compass-arrow>
          <text
            x="0" y="10"
            font-size="1.25em"
            text-anchor="middle"
            alignment-baseline="central"></text>
        <a
          v-on:click.prevent="o8audio.playEffect('click'); selectSprite('star')"
          v-on:mouseover="setSpriteToDisplay(0)"
          v-on:mouseout="setSpriteToDisplay(null)"
          cursor="pointer"><compass-sun :opacity="markerOpacity(systemObjects.star)"></compass-sun></a>
      </g>

      <compass></compass>
    </g>
  </g>
</template>

<script>
import { bearingDegrees, scopeOpacity } from '@/game/bearing'

import { useStarMapStore } from '@/stores/starmap'
import { useUIStore } from '@/stores/ui'
import { mapActions, mapState } from 'pinia'
import { useConfigStore } from '@/stores/config'
import Compass from './compass.svg'
import CompassArrow from './compass-arrow.svg'
import CompassPlanet from './compass-planet.svg'
import CompassSun from './compass-sun.svg'
import Ship from '../../sprites/ship.svg'

export default {
  name: 'Hud',
  data () {
    return {
      scale: 1.25
    }
  },
  components: {
    Compass,
    CompassArrow,
    CompassSun,
    CompassPlanet,
    Ship
  },
  computed: {
    ...mapState(useUIStore, [
      'viewport',
      'spriteToDisplay',
      'selected'
    ]),
    ...mapState(useConfigStore, [
      'showScope'
    ]),
    ...mapState(useStarMapStore, [
      'gameTime',
      'systemObjects'
    ])
  },
  methods: {
    ...mapActions(useUIStore, [
      'selectSprite',
      'setSpriteToDisplay'
    ]),
    /** Where the sprite is relative to the view center, in world units. */
    offsetFromView (sprite) {
      // Sprites are raw objects updated in place each frame; reading gameTime makes this re-evaluate per frame.
      void this.gameTime
      return {
        x: sprite.telemetry.translatex + this.viewport.x,
        y: sprite.telemetry.translatey + this.viewport.y
      }
    },
    bearingToSprite (sprite) {
      const { x, y } = this.offsetFromView(sprite)
      // 0.25° steps: the arrows only touch the DOM when they visibly turn.
      return Math.round(bearingDegrees(x, y) / 0.25) * 0.25
    },
    markerOpacity (sprite) {
      const { x, y } = this.offsetFromView(sprite)
      // Steps of 0.02: only touch the DOM when the fade visibly changes.
      return Math.round(scopeOpacity(x, y, this.viewport.scale, sprite.type === 'star') * 50) / 50
    },
    isMyShip (sprite) {
      return ((sprite.type === 'ship') && (sprite.isMine))
    }
  }
}
</script>
