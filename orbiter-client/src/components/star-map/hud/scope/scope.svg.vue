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
          :opacity = "getOpacityFromSprite(sprite)"
          :transform="'rotate(' + getDegreesFromSprite(sprite) + ')'">
          <a
            v-on:click.prevent="o8audio.playEffect('click'); selectSprite(key)"
            v-on:mouseover="setSpriteToDisplay(key)"
            v-on:mouseout="setSpriteToDisplay(null)"
            cursor="pointer">
            <compass-planet></compass-planet></a>
        </g>

        <g
          v-if="isMyShip(sprite)"
          :opacity = "getOpacityFromSprite(sprite)"
          :transform="'rotate(' + getDegreesFromSprite(sprite) + ')'">
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
        v-if="(systemObjects.length && getOpacityFromSprite(systemObjects[0]))"
        :transform="'rotate(' + getDegreesFromSprite(systemObjects[0]) + ')'"
        stroke-width="4"
        stroke-color="#ffffff"
        :stroke-opacity="getOpacityFromSprite(systemObjects[0])"
      >
        <compass-arrow></compass-arrow>
          <text
            x="0" y="10"
            font-size="1.25em"
            text-anchor="middle"
            alignment-baseline="central"></text>
        <a
          v-on:click.prevent="o8audio.playEffect('click'); selectSprite(0)"
          v-on:mouseover="setSpriteToDisplay(0)"
          v-on:mouseout="setSpriteToDisplay(null)"
          cursor="pointer"><compass-sun :opacity="getOpacityFromSprite(systemObjects[0])"></compass-sun></a>
      </g>

      <compass></compass>
    </g>
  </g>
</template>

<script>

import { mapGetters, mapMutations } from 'vuex'
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
    ...mapGetters('GameState', [
      'myShipId'
    ]),
    ...mapGetters('UI', [
      'viewport',
      'spriteToDisplay',
      'selected'
    ]),
    ...mapGetters('Config', [
      'showScope'
    ]),
    ...mapGetters('StarMap', [
      'systemObjects'
    ]),
  },
  methods: {
    selectSprite (spriteKey) {
      this.selectSprite(spriteKey)
    },
    ...mapMutations('UI', [
      'selectSprite',
      'setSpriteToDisplay'
    ]),
    getDegreesFromXY (x, y) {
      if (x === 0) {
        if (y > 0) {
          return 0
        } else {
          return 1
        }
      } else if (x > 0) {
        return 270 +
          Math.atan(
            y / x
          ) * 180 / Math.PI
      } else {
        return 90 +
          Math.atan(
            y / x
          ) * 180 / Math.PI
      }
    },
    getDegreesFromSprite (sprite) {
      let x = sprite.telemetry.translatex + this.viewport.x
      let y = sprite.telemetry.translatey + this.viewport.y

      return this.getDegreesFromXY(x, y)
    },
    getOpacityFromSprite (sprite) {
      let x = (sprite.telemetry.translatex + this.viewport.x)
      let y = (sprite.telemetry.translatey + this.viewport.y)
      let length = Math.sqrt(x * x + y * y) / this.viewport.scale
      if (sprite.type === 'star') {
        length = length / 2
      }
      let opacity = (length - 250) / 1000
      opacity = Math.max(Math.min(opacity + 0.1, 1), 0)
      return opacity
    },
    getMenuScaleFromSprite (sprite) {
      let x = (sprite.telemetry.translatex + this.viewport.x + this.viewport.rubberx)
      let y = (sprite.telemetry.translatey + this.viewport.y + this.viewport.rubbery)
      let opacity = (Math.sqrt(x * x + y * y) - 100 * this.viewport.scale) / 10
      return Math.max(Math.min((1 - opacity), 1), 0)
    },
    isMyShip (sprite) {
      return ((sprite.type === 'ship') && (sprite.isMine))
    }
  }
}
</script>
