<template>
  <g>
    <!-- Position, rotation and (when off screen) display are written every frame by writeFrame,
         not by Vue, so a moving sprite never re-renders. -->
    <g v-if="!hiddenByMenu" ref="placed">
      <g>
        <slot />
      </g>
      <g ref="turned">
        <!-- Only a few pixels across: a plain dot looks the same and costs far less to draw. -->
        <circle v-if="isTiny" cx="0" cy="0" :r="dotRadius" fill="#e5cfff" />
        <template v-else>
          <planet v-if="type === 'planet'" :sprite="sprite" />
          <moon v-if="type === 'moon'" />
          <station v-if="type === 'station'" />
          <g transform="rotate(180)"><ship v-if="type === 'ship'" :should-show-engines="true" /></g>
          <star v-if="type === 'star'" />
        </template>
        <a cursor="pointer" @mouseover="hover = true" @mouseleave="hover = false" @click.prevent="spriteAction()">
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
          >{{ sprite.object.name }}</text
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
import { spriteScaleOf } from '@/libs/sprite-types'
import { onFrame, FRAME_ORDER } from '@/libs/frame-loop'
import { writeAttribute } from '@/libs/dom-writes'
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
  name: 'SpriteTransform',
  components: {
    Ship,
    Station,
    Moon,
    Planet,
    Star
  },
  props: {
    /** How the object is drawn (libs/sprite.js); its game data is sprite.object. */
    sprite: { type: Object, required: true },
    /** The object's key (see sdk/system.js objectKey). */
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
  data() {
    return {
      hover: false
    }
  },
  computed: {
    ...mapState(useStarMapStore, ['sprites', 'systemObjects']),
    ...mapState(useUIStore, ['selected', 'showLabels', 'isMenuOn', 'drawnPixelsPerUnit', 'isOnScreen', 'showScope']),
    ...mapState(useConfigStore, ['graphicsQuality']),
    /** The sprite's group scale (world units per sprite unit). */
    spriteScale() {
      return spriteScaleOf(this.sprite.object, this.systemObjects)
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
    /** On the low graphics tier, the world is hidden behind open menus. */
    hiddenByMenu() {
      return this.isMenuOn && this.graphicsQuality < 2
    }
  },
  watch: {
    // The world was just redrawn at a new zoom (inside this frame, after writeFrame ran):
    // re-place the sprite for it before the browser paints.
    drawnPixelsPerUnit() {
      this.writeFrame()
    }
  },
  mounted() {
    this.stopFrames = onFrame(this.writeFrame, FRAME_ORDER.render)
    this.writeFrame()
  },
  updated() {
    // A re-render may have created new elements (e.g. the menu closed): place them before paint.
    this.writeFrame()
  },
  unmounted() {
    this.stopFrames()
  },
  methods: {
    ...mapActions(useUIStore, ['toggleScope', 'selectSprite']),
    /** Moves, turns, and shows or hides the sprite for this frame. */
    writeFrame() {
      const placed = this.$refs.placed
      if (!placed) return
      const { x, y } = this.sprite.position
      // Off screen: hidden, so it costs nothing to draw. (The label hangs below the sprite.)
      const visible = this.isSelected || this.isOnScreen(x, y, this.visualRadius + 10)
      writeAttribute(placed, 'display', visible ? 'inline' : 'none')
      if (!visible) return
      writeAttribute(placed, 'transform', this.placement(x, y))
      const rotation = Math.round(this.sprite.telemetry.rotation / ROTATION_STEP) * ROTATION_STEP
      writeAttribute(this.$refs.turned, 'transform', 'scale(' + this.spriteScale + ') rotate(' + rotation + ')')
    },
    /** The translate that puts the sprite at (x, y), snapped to the device-pixel grid of the drawn world. */
    placement(x, y) {
      if (this.frameOf === 'self') return 'translate(0,0)'
      const step = 1 / (this.drawnPixelsPerUnit * (window.devicePixelRatio || 1))
      const snap = (value) => Math.round(value / step) * step
      if (this.frameOf === 'parent') {
        // Inside its planet's layer, which is itself snapped: round the absolute position and
        // subtract the planet's rounded position, so the sprite lands on the rounding of where it
        // really is. Rounding its offset from the planet instead adds a second rounding error, and
        // a followed ship or moon visibly shifts a pixel back and forth.
        const parent = this.sprites[this.sprite.orbiting].position
        return 'translate(' + (snap(x) - snap(parent.x)) + ',' + (snap(y) - snap(parent.y)) + ')'
      }
      return 'translate(' + snap(x) + ',' + snap(y) + ')'
    },
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
