<template>
  <g>
    <circle v-if="amISelected" :cx="frame.parentX" :cy="frame.parentY" :r="sprite.distance" stroke="#c3b3da" stroke-dasharray="0.5 1" stroke-width="0.05" fill="none" />
    <circle v-else-if="showOrbit" :cx="frame.parentX" :cy="frame.parentY" :r="sprite.distance" stroke="#c3b3da" stroke-dasharray="0.5 1" stroke-width="0.01" fill="none" />
    <g :transform="getOrbitalTransform" v-if="shouldDisplay">
      <g>
        <slot />
      </g>
      <g :transform="getScaleTransform + ' ' + getRotationalTransform">
        <planet v-if="type === 'planet'" :planet="sprite" />
        <moon v-if="type === 'moon'" :moon="sprite" />
        <station v-if="type === 'station'" :port="sprite" />
        <g transform="rotate(180)"><ship v-if="type === 'ship'" :ship="sprite" :show-engines="true" /></g>
        <star v-if="type === 'star'" :star="sprite" />
        <a
          @mouseover="hover = true"
          @mouseleave="hover = false"
          v-on:click.prevent="spriteAction()"
          cursor="pointer">
          <circle
            cx="0" cy="0" :r="sprite.selectorSize"
            stroke-dasharray="2 1"
            stroke-width="0.2"
            :stroke="selectionStroke"
            fill="#ffffff00" />
          </a>
      </g>
      <g>
        <text v-if="(amISelected && !showScope) || showLabels || (hover && !amISelected)"
          x="0" :y="(sprite.size / 4) + 4"
          font-size="0.1em"
          fill="#ffffff66"
          stroke="#00000000"
          stroke-width="4"
          text-anchor="middle"
          alignment-baseline="central">{{ sprite.name }}</text>
      </g>

    </g>
  </g>
</template>

<script>

import { useStarMapStore } from '@/stores/starmap'
import { useUIStore } from '@/stores/ui'
import { mapActions, mapState } from 'pinia'
import { useConfigStore } from '@/stores/config'
 import Star from './star.svg'
 import Ship from './ship.svg'
 import Station from './station.svg'
 import Moon from './moon.svg'
 import Planet from './planet.svg'

export default {
  name: 'sprite-transform',
  components: {
    Ship,
    Station,
    Moon,
    Planet,
    Star
  },
  data () {
    return {
      hover: false
    }
  },
  props: {
    sprite: {
      type: Object,
      default () {
        return {
          name: '...',
          speed: 0,
          size: 0,
          distance: 0,
          rotation: 0
        }
      }
    },
    objectIndex: {
      type: Number,
      default () {
        return 0
      }
    },
    type: {
      type: String,
      default () {
        return ''
      }
    }
  },
  computed: {
    ...mapState(useStarMapStore, [
      'systemObjects',
      'gameTime',
    ]),
    ...mapState(useUIStore, [
      'selected',
      'showLabels',
      'isMenuOn',
      'viewport'
    ]),
    ...mapState(useConfigStore, [
      'showScope', // todo: this should be in UI
      'graphicsQuality'
    ]),
    /**
     * This frame's position data. Sprites are raw (non-reactive) objects that the frame loop
     * updates in place, so reading gameTime here is what makes this re-evaluate every frame.
     */
    frame () {
      void this.gameTime
      const parent = this.sprite.orbiting ? this.systemObjects[this.sprite.orbiting] : null
      return {
        x: this.sprite.position.x,
        y: this.sprite.position.y,
        rotation: this.sprite.telemetry.rotation,
        parentX: parent ? parent.telemetry.translatex : 0,
        parentY: parent ? parent.telemetry.translatey : 0
      }
    },
    showOrbit () {
      if (this.sprite.type != 'star') {
        return true
      }
      return false
    },
    getOrbitalTransform () {
      return 'translate(' + this.frame.x + ',' + this.frame.y + ')'
    },
    getRotationalTransform () {
      return 'rotate(' + this.frame.rotation + ')'
    },
    // todo: this should probably come from sprite.js
    getScaleTransform () {
      return 'scale(' + (this.sprite.size * 0.02 + 0.1) + ')'
    },
    amISelected () {
      if (this.objectIndex === this.selected) {
        return true;
      }
      return false;
    },
    selectionStroke: function () {
      if ((!this.amISelected && this.hover) ||
         (this.amISelected && !this.showScope)) {
        return '#ffffffff'
      }
      return 'none'
    },
    /** Distance from the view, in screen-ish units: sprites far off screen are not drawn. */
    range () {
      if (this.amISelected) {
        return 0
      }
      // The larger of the x or y offset from the camera (kept exactly as before, signed).
      const x = this.frame.x + this.viewport.x
      const y = this.frame.y + this.viewport.y
      return (x > y ? x : y) / this.viewport.scale
    },
    shouldDisplay () {
      if (this.isMenuOn && (this.graphicsQuality < 2)){
        return false
      }
      if (this.range > 1500) {
        return false
      }
      return true
    }
  },
  methods: {
    ...mapActions(useUIStore, [
      'selectSprite'
    ]),
    ...mapActions(useConfigStore, [
      'toggleScope'
    ]),
    spriteAction: function () {
      if (this.amISelected) {
        this.toggleScope()
      } else {
        this.selectSprite(this.objectIndex)
      }
    }
  }
}
</script>
