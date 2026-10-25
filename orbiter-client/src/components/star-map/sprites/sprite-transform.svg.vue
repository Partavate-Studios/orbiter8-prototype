<template>
  <g>
    <orbit-ring v-if="frameOf !== 'self' && (amISelected || showOrbit)"
      :cx="placement.ringX" :cy="placement.ringY" :r="sprite.distance" :selected="amISelected" />
    <g :transform="getOrbitalTransform" v-if="shouldDisplay">
      <g>
        <slot />
      </g>
      <g :transform="getScaleTransform + ' ' + getRotationalTransform">
        <!-- Only a few pixels across: a plain dot looks the same and costs far less to draw. -->
        <circle v-if="isTiny" cx="0" cy="0" :r="dotRadius" fill="#e5cfff" />
        <template v-else>
          <planet v-if="type === 'planet'" :planet="sprite" />
          <moon v-if="type === 'moon'" />
          <station v-if="type === 'station'" />
          <g transform="rotate(180)"><ship v-if="type === 'ship'" :ship="sprite" :show-engines="true" /></g>
          <star v-if="type === 'star'" />
        </template>
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
 import OrbitRing from './orbit-ring.svg.vue'

// Rotations change in steps this size (degrees), and positions in whole device pixels, so a slowly
// moving sprite only touches the DOM (and makes the browser repaint) when it visibly moves.
const ROTATION_STEP = 0.25
// Ships, moons and stations smaller than this many pixels across are drawn as a dot.
const TINY_DIAMETER = 6
const DETAILED_WHEN_TINY = ['planet', 'star']

export default {
  name: 'sprite-transform',
  components: {
    Ship,
    Station,
    Moon,
    Planet,
    Star,
    OrbitRing
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
    /** The sprite's key in systemObjects (see libs/sprite.js spriteKey). */
    objectIndex: {
      type: String,
      required: true
    },
    type: {
      type: String,
      default () {
        return ''
      }
    },
    /**
     * Which coordinate system this sprite is drawn in:
     * 'world'  - the star system (orbit ring around the parent's position),
     * 'parent' - a layer centered on the parent planet (orbit ring around the layer's origin),
     * 'self'   - a layer centered on this sprite (no orbit ring; the world draws it).
     */
    frameOf: {
      type: String,
      default: 'world'
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
      'drawnPixelsPerUnit',
      'isOnScreen'
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
    /** Where the orbit ring's center and the sprite go, in this sprite's coordinate system. */
    placement () {
      if (this.frameOf === 'self') {
        return { ringX: 0, ringY: 0, x: 0, y: 0 }
      }
      if (this.frameOf === 'parent') {
        return { ringX: 0, ringY: 0, x: this.frame.x - this.frame.parentX, y: this.frame.y - this.frame.parentY }
      }
      return { ringX: this.frame.parentX, ringY: this.frame.parentY, x: this.frame.x, y: this.frame.y }
    },
    getOrbitalTransform () {
      // Snap to the device-pixel grid of the drawn world.
      const step = 1 / (this.drawnPixelsPerUnit * (window.devicePixelRatio || 1))
      const x = Math.round(this.placement.x / step) * step
      const y = Math.round(this.placement.y / step) * step
      return 'translate(' + x + ',' + y + ')'
    },
    getRotationalTransform () {
      return 'rotate(' + Math.round(this.frame.rotation / ROTATION_STEP) * ROTATION_STEP + ')'
    },
    /** The sprite's group scale (world units per sprite unit). */
    spriteScale () {
      return this.sprite.size * 0.02 + 0.1
    },
    /** Roughly how far the sprite reaches from its center, in world units. */
    visualRadius () {
      return this.sprite.selectorSize * this.spriteScale
    },
    isTiny () {
      if (DETAILED_WHEN_TINY.includes(this.type)) return false
      // Drawn scale, not live: between redraws the layer's CSS transform handles the zoom.
      return 2 * this.visualRadius * this.drawnPixelsPerUnit < TINY_DIAMETER
    },
    /** Half the sprite's size, but never under one pixel (in sprite units). */
    dotRadius () {
      const onePixel = 1 / (this.drawnPixelsPerUnit * this.spriteScale)
      return Math.max(this.sprite.selectorSize / 2, onePixel)
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
    shouldDisplay () {
      if (this.isMenuOn && (this.graphicsQuality < 2)){
        return false
      }
      // Off screen: don't draw it, so it costs nothing per frame. (The label hangs below the sprite.)
      return this.amISelected || this.isOnScreen(this.frame.x, this.frame.y, this.visualRadius + 10)
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
