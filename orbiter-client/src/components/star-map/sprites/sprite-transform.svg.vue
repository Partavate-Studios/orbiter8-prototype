<template>
  <g>
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
          <g transform="rotate(180)"><ship v-if="type === 'ship'" :ship="sprite" :should-show-engines="true" /></g>
          <star v-if="type === 'star'" />
        </template>
        <a @mouseover="hover = true" @mouseleave="hover = false" v-on:click.prevent="spriteAction()" cursor="pointer">
          <circle
            cx="0"
            cy="0"
            :r="sprite.selectorSize"
            stroke-dasharray="2 1"
            stroke-width="0.2"
            :stroke="selectionStroke"
            fill="#ffffff00"
          />
        </a>
      </g>
      <g>
        <text
          v-if="(isSelected && !showScope) || showLabels || (hover && !isSelected)"
          x="0"
          :y="sprite.size / 4 + 4"
          font-size="0.1em"
          fill="#ffffff66"
          stroke="#00000000"
          stroke-width="4"
          text-anchor="middle"
          alignment-baseline="central"
          >{{ sprite.name }}</text
        >
      </g>
    </g>
  </g>
</template>

<script>
import { useStarMapStore } from '@/stores/starmap'
import { useUIStore } from '@/stores/ui'
import { mapActions, mapState } from 'pinia'
import { useConfigStore } from '@/stores/config'
import { spriteScale } from '@/libs/sprite-types'
import Star from './star.svg'
import Ship from './ship.svg'
import Station from './station.svg'
import Moon from './moon.svg'
import Planet from './planet.svg'

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
    Star
  },
  data() {
    return {
      hover: false
    }
  },
  props: {
    sprite: {
      type: Object,
      default() {
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
      default() {
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
    ...mapState(useStarMapStore, ['systemObjects', 'gameTime']),
    ...mapState(useUIStore, ['selected', 'showLabels', 'isMenuOn', 'drawnPixelsPerUnit', 'isOnScreen', 'showScope']),
    ...mapState(useConfigStore, ['graphicsQuality']),
    /**
     * This frame's position data. Sprites are raw (non-reactive) objects that the frame loop
     * updates in place, so reading gameTime here is what makes this re-evaluate every frame.
     */
    frame() {
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
    getOrbitalTransform() {
      // Snap to the device-pixel grid of the drawn world.
      const step = 1 / (this.drawnPixelsPerUnit * (window.devicePixelRatio || 1))
      const snap = (value) => Math.round(value / step) * step
      if (this.frameOf === 'parent') {
        // Inside its planet's layer, which is itself snapped: round the absolute position and
        // subtract the planet's rounded position, so the sprite lands on the rounding of where it
        // really is. Rounding its offset from the planet instead adds a second rounding error, and
        // a followed ship or moon visibly shifts a pixel back and forth.
        const x = snap(this.frame.x) - snap(this.frame.parentX)
        const y = snap(this.frame.y) - snap(this.frame.parentY)
        return 'translate(' + x + ',' + y + ')'
      }
      if (this.frameOf === 'self') return 'translate(0,0)'
      return 'translate(' + snap(this.frame.x) + ',' + snap(this.frame.y) + ')'
    },
    getRotationalTransform() {
      return 'rotate(' + Math.round(this.frame.rotation / ROTATION_STEP) * ROTATION_STEP + ')'
    },
    /** The sprite's group scale (world units per sprite unit). */
    spriteScale() {
      return spriteScale(this.sprite.size)
    },
    /** Roughly how far the sprite reaches from its center, in world units. */
    visualRadius() {
      return this.sprite.selectorSize * this.spriteScale
    },
    isTiny() {
      if (DETAILED_WHEN_TINY.includes(this.type)) return false
      // Drawn scale, not live: between redraws the layer's CSS transform handles the zoom.
      return 2 * this.visualRadius * this.drawnPixelsPerUnit < TINY_DIAMETER
    },
    /** Half the sprite's size, but never under one pixel (in sprite units). */
    dotRadius() {
      const onePixel = 1 / (this.drawnPixelsPerUnit * this.spriteScale)
      return Math.max(this.sprite.selectorSize / 2, onePixel)
    },
    getScaleTransform() {
      return 'scale(' + this.spriteScale + ')'
    },
    isSelected() {
      if (this.objectIndex === this.selected) {
        return true
      }
      return false
    },
    selectionStroke: function () {
      if ((!this.isSelected && this.hover) || (this.isSelected && !this.showScope)) {
        return '#ffffffff'
      }
      return 'none'
    },
    shouldDisplay() {
      if (this.isMenuOn && this.graphicsQuality < 2) {
        return false
      }
      // Off screen: don't draw it, so it costs nothing per frame. (The label hangs below the sprite.)
      return this.isSelected || this.isOnScreen(this.frame.x, this.frame.y, this.visualRadius + 10)
    }
  },
  methods: {
    ...mapActions(useUIStore, ['toggleScope', 'selectSprite']),
    spriteAction: function () {
      if (this.isSelected) {
        this.toggleScope()
      } else {
        this.selectSprite(this.objectIndex)
      }
    }
  }
}
</script>
