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
        <a cursor="pointer" @mouseover="pointerOn(true)" @mouseleave="pointerOn(false)" @click.prevent="spriteAction()">
          <circle v-if="hitRadius > sprite.selectorSize" cx="0" cy="0" :r="hitRadius" fill="#ffffff00" />
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
      <!-- Zoomed out, my ship wears a ring that stays the same size on screen, so it's easy to find.
           Not during camera flights, when it would flicker as it resizes.
           Yellow, as everything of mine is (libs/palette.js). -->
      <circle
        v-if="isMyShip && isTiny && !cameraFlying"
        cx="0"
        cy="0"
        :r="MARKER_RADIUS_PX / drawnPixelsPerUnit"
        fill="none"
        :stroke="YELLOW"
        :stroke-width="1.25 / drawnPixelsPerUnit"
        opacity="0.85"
      />
      <g>
        <text
          v-if="showLabel && labelPlacement !== 'hidden'"
          x="0"
          :y="labelPlacement === 'above' ? -(visualRadius + labelSize * 0.6) : visualRadius + labelSize * 0.9"
          :font-size="labelSize"
          :fill="sprite.object.isMine ? MY_LABEL_FILL : '#ffffff66'"
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
import { ART, spriteScaleOf } from '@/libs/sprite-types'
import { offerLabel, withdrawLabel } from '@/libs/label-layout'
import { onFrame, FRAME_ORDER } from '@/libs/frame-loop'
import { writeAttribute } from '@/libs/dom-writes'
import { YELLOW, YELLOW_LIGHT } from '@/libs/palette'
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
// Planets and the star can be clicked this many pixels from their center, however small they're drawn.
// (Not the moons, stations and ships around a planet: drawn after it, they'd take its clicks.)
const MIN_HIT_RADIUS_PX = 14
// Zoomed out, planets and the star are never drawn smaller than this (their body's radius, pixels), so
// the system stays readable (as in strategy games' map views); zoomed in, they're their true size.
const MIN_RADIUS_PX = { planet: 4, star: 7 }
// Planets and the star show their names by themselves until they're this big on screen (radius, pixels).
const NAMED_BELOW_PX = { planet: 40, star: 60 }
// What orbits a planet is hidden while it would sit inside the planet as drawn, plus this margin
// (pixels): zoomed out, a planet stands for everything around it.
const FOLD_MARGIN_PX = 3
// Names scale with the world, but stay between these sizes on screen (pixels). The size in the world
// is what labels always had: 0.1em of the 16px default.
const LABEL_PX = { min: 12, max: 20, world: 1.6 }
const MARKER_RADIUS_PX = 8
// The names of my ship and of what I own.
const MY_LABEL_FILL = YELLOW_LIGHT + 'aa'

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
      hover: false,
      MARKER_RADIUS_PX,
      MY_LABEL_FILL,
      YELLOW
    }
  },
  computed: {
    ...mapState(useStarMapStore, ['sprites', 'systemObjects']),
    ...mapState(useUIStore, [
      'selected',
      'showLabels',
      'isMenuOn',
      'drawnPixelsPerUnit',
      'isOnScreen',
      'showScope',
      'labelPlacements',
      'neighborView',
      'cameraFlying'
    ]),
    ...mapState(useConfigStore, ['graphicsQuality']),
    /** The sprite's group scale (world units per sprite unit): its true size, or bigger when zoomed out (MIN_RADIUS_PX). */
    spriteScale() {
      return this.trueScale * this.zoomedOutBoost
    },
    trueScale() {
      return spriteScaleOf(this.sprite.object, this.systemObjects)
    },
    /** How much bigger than its true size a planet or the star is drawn, to stay MIN_RADIUS_PX across. */
    zoomedOutBoost() {
      const minimum = MIN_RADIUS_PX[this.type]
      if (!minimum) return 1
      return Math.max(1, minimum / this.trueRadiusPx)
    },
    /** The body's true radius on screen, in pixels. */
    trueRadiusPx() {
      return (ART[this.type] ?? this.sprite.selectorSize) * this.trueScale * this.drawnPixelsPerUnit
    },
    isMyShip() {
      return this.type === 'ship' && this.sprite.object.isMine
    },
    /**
     * Hidden inside its planet: a moon, station or ship whose orbit is inside the planet as drawn.
     * (Never the selection or my ship.)
     */
    folded() {
      if (this.frameOf !== 'parent' || this.isSelected || this.isMyShip) return false
      const planet = this.sprites[this.sprite.orbiting]
      if (!planet) return false
      const pixels = this.drawnPixelsPerUnit
      const trueRadius = ART.planet * spriteScaleOf(planet.object, this.systemObjects) * pixels
      const drawnRadius = Math.max(trueRadius, MIN_RADIUS_PX.planet)
      return this.sprite.object.orbit.radius * pixels < drawnRadius + FOLD_MARGIN_PX
    },
    showLabel() {
      // The neighbor view covers the system: its names would show through.
      if (this.neighborView) return false
      if ((this.isSelected && !this.showScope) || this.showLabels || (this.hover && !this.isSelected)) return true
      // Zoomed out: the planets', the star's and my ship's names show by themselves, once the camera has
      // settled (during a flight they'd flicker in and out as the zoom sweeps past their sizes).
      if (this.cameraFlying) return false
      return this.trueRadiusPx < (NAMED_BELOW_PX[this.type] ?? 0) || (this.isMyShip && this.isTiny)
    },
    labelPlacement() {
      return this.labelPlacements[this.objectIndex] ?? 'below'
    },
    /** Whose name wins when names would overlap (libs/label-layout.js). */
    labelPriority() {
      if (this.isSelected || this.hover) return 100
      if (this.type === 'star') return 90
      if (this.isMyShip) return 80
      if (this.type === 'planet') return 50 + Number(this.sprite.object.size) / 10
      return 10
    },
    /** The label's font size, in world units. */
    labelSize() {
      const pixels = this.drawnPixelsPerUnit
      return Math.min(LABEL_PX.max, Math.max(LABEL_PX.min, LABEL_PX.world * pixels)) / pixels
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
    /** How far from its center the sprite takes a click, in sprite units. */
    hitRadius() {
      if (!DETAILED_WHEN_TINY.includes(this.type)) return this.sprite.selectorSize
      return Math.max(this.sprite.selectorSize, MIN_HIT_RADIUS_PX / (this.drawnPixelsPerUnit * this.spriteScale))
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
    withdrawLabel(this.objectIndex)
    this.hoverSprite(null, this.objectIndex)
  },
  methods: {
    /** Offers this frame's name to the label layout (libs/label-layout.js), or withdraws it. */
    offerName(visible, x, y) {
      if (!visible || !this.showLabel) return withdrawLabel(this.objectIndex)
      const pixels = this.drawnPixelsPerUnit
      const fontPixels = this.labelSize * pixels
      offerLabel(this.objectIndex, {
        x: x * pixels,
        y: y * pixels,
        radius: this.visualRadius * pixels,
        width: String(this.sprite.object.name).length * fontPixels * 0.55 + 4,
        height: fontPixels * 1.3,
        priority: this.labelPriority
      })
    },
    ...mapActions(useUIStore, ['toggleScope', 'selectSprite', 'hoverSprite']),
    /** Moves, turns, and shows or hides the sprite for this frame. */
    writeFrame() {
      const placed = this.$refs.placed
      const { x, y } = this.sprite.position
      // Off screen or folded into its planet: hidden, so it costs nothing to draw. (The label hangs below the sprite.)
      const visible = placed && !this.folded && (this.isSelected || this.isOnScreen(x, y, this.visualRadius + 10))
      this.offerName(visible, x, y)
      if (!placed) return
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
    /** The pointer moved onto or off the sprite: its name and selector ring show, and its orbit brightens. */
    pointerOn(over) {
      this.hover = over
      this.hoverSprite(over ? this.objectIndex : null, this.objectIndex)
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
