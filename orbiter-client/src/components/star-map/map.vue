<template>
  <!-- Back to front: background, world (the star system) and HUD are separate elements,
       so changes in one layer never make the browser repaint the others. -->
  <div ref="gamelayerContainer" class="layer star-map">
    <background-canvas />
    <guides-canvas />

    <!-- The world is drawn for the camera in drawnView and slightly larger than the screen;
         between redraws a CSS transform (composited, no repaint) follows the live camera. -->
    <div ref="world" class="world-layer" :style="worldBox">
      <svg
        id="gamelayer"
        ref="gamelayer"
        class="map-layer"
        :viewBox="worldViewBox"
        :class="{ 'is-dragging': mouseHold }"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g font-family="Ubuntu, sans-serif" :transform="'scale(' + baseScale + ')'">
          <g v-if="mapDataLoaded && !jumpAnimationState" transform="translate(0 -100)">
            <rect
              x="-2000"
              y="-1000"
              width="4000"
              height="2000"
              fill="#ffffff00"
              @pointerdown="pointerDown"
              @pointermove="pointerMove"
              @pointerup="pointerUp"
              @pointercancel="pointerUp"
            />
            <g :transform="worldTransform">
              <solar-system />
            </g>
          </g>
        </g>
      </svg>
      <planet-layers
        v-if="mapDataLoaded && !jumpAnimationState"
        :drawn-view="drawnView"
        :unit="worldUnit"
        :origin-x="screenSize.width / 2 + worldMargin"
        :origin-y="screenSize.height / 2 + worldMargin + worldUnit * worldOffsetY"
      />
    </div>

    <svg class="map-layer hud-layer" :viewBox="layerViewBox" xmlns="http://www.w3.org/2000/svg">
      <g font-family="Ubuntu, sans-serif" :transform="'scale(' + baseScale + ')'">
        <g v-if="mapDataLoaded">
          <g v-if="jumpAnimationState">
            <jumpAnimation></jumpAnimation>
          </g>
          <!-- Demo 4 draws its galaxy map over the game instead (components/star-map/galaxy-map.vue) -->
          <g v-else-if="neighborView">
            <neighbor-view v-if="!demo4Active" />
          </g>
          <g v-else>
            <hud></hud>
          </g>
        </g>
        <g v-else>
          <loading-bar />
        </g>
        <connection-status />
      </g>
    </svg>
  </div>
</template>

<script>
import { useDemo4Store } from '@/stores/demo4'
import { CAMERA, WORLD_OFFSET_Y } from '@/constants'
import { STAR_KEY } from '@/sdk/system'

import { useStarMapStore } from '@/stores/starmap'
import { useUIStore } from '@/stores/ui'
import { mapActions, mapState } from 'pinia'
import Hud from './hud/hud.svg'
import JumpAnimation from './hud/jump-animation.svg'
import NeighborView from './hud/neighbor-view.svg'
import BackgroundCanvas from './background-canvas.vue'
import GuidesCanvas from './guides-canvas.vue'
import SolarSystem from './_solarsystem.svg'
import PlanetLayers from './planet-layers.vue'
import ConnectionStatus from './hud/connection-status.svg'
import LoadingBar from './hud/loading-bar.svg'
import { onFrame, FRAME_ORDER } from '@/libs/frame-loop'
import { CompositedLayer } from '@/libs/composited-layer'
import { placeOfferedLabels } from '@/libs/label-layout'

// Pixels of world drawn beyond each screen edge, so the camera can pan a little before a redraw.
const WORLD_MARGIN = 256
// How often the names on the map are laid out again (libs/label-layout.js), in ms.
const LABEL_LAYOUT_MS = 150

export default {
  name: 'StarMap',
  components: {
    Hud,
    JumpAnimation,
    NeighborView,
    BackgroundCanvas,
    GuidesCanvas,
    SolarSystem,
    PlanetLayers,
    ConnectionStatus,
    LoadingBar
  },
  data() {
    return {
      //these should be in UI store
      mouseHold: false,
      worldMargin: WORLD_MARGIN,
      worldOffsetY: WORLD_OFFSET_Y
    }
  },
  computed: {
    ...mapState(useDemo4Store, { demo4Active: 'active' }),
    ...mapState(useUIStore, [
      'neighborView',
      'viewport',
      'screenSize',
      'baseScale',
      'drawnView',
      'groupPixels',
      'menuState',
      'isMenuOn',
      'jumpAnimationState'
    ]),
    ...mapState(useStarMapStore, ['currentStarSystemId', 'mapDataLoaded', 'myShipId']),
    /**
     * Every layer maps 1200 units to the screen's height, centered on the origin (this is
     * what the original single SVG did at any aspect ratio), so the layers line up exactly.
     */
    /** Pixels per world-group unit (before the camera's zoom). */
    worldUnit() {
      return this.groupPixels
    },
    worldTransform() {
      return 'scale(' + 1 / this.drawnView.scale + ') translate(' + this.drawnView.x + ' ' + this.drawnView.y + ')'
    },
    /** The world layer covers the screen plus WORLD_MARGIN on every side, at the same scale as the other layers. */
    worldBox() {
      return {
        left: -WORLD_MARGIN + 'px',
        top: -WORLD_MARGIN + 'px',
        width: this.screenSize.width + 2 * WORLD_MARGIN + 'px',
        height: this.screenSize.height + 2 * WORLD_MARGIN + 'px'
      }
    },
    worldViewBox() {
      const unitsPerPixel = this.viewport.resolution / this.screenSize.height
      const width = (this.screenSize.width + 2 * WORLD_MARGIN) * unitsPerPixel
      const height = (this.screenSize.height + 2 * WORLD_MARGIN) * unitsPerPixel
      return -width / 2 + ' ' + -height / 2 + ' ' + width + ' ' + height
    },
    layerViewBox() {
      const width = (this.viewport.resolution * this.screenSize.width) / this.screenSize.height
      const height = this.viewport.resolution
      return -width / 2 + ' ' + -height / 2 + ' ' + width + ' ' + height
    }
  },
  watch: {
    currentStarSystemId: function (val, oldVal) {
      if (val != oldVal) {
        if (this.myShipId !== STAR_KEY) {
          this.selectSprite(this.myShipId)
          this.scaleAnimateTo({ scale: CAMERA.ARRIVAL_SHIP_SCALE, time: CAMERA.ARRIVAL_TWEEN_MS })
        } else {
          this.scaleAnimateTo({ scale: CAMERA.ARRIVAL_SYSTEM_SCALE, time: CAMERA.ARRIVAL_TWEEN_MS })
        }
      }
    }
  },
  created() {
    this.selectSprite(this.myShipId)
    // Pointers down on the map (id → last position), and the drag or pinch they make. Not reactive.
    this.pointers = new Map()
    this.gesture = null
  },
  mounted() {
    this.drawWorld()
    // While zooming out, the shrinking world may briefly show nothing near the screen edges until
    // it redraws (the background and the guides stay put); that beats redrawing at every wheel step.
    this.worldLayer = new CompositedLayer(this.$refs.world, { margin: WORLD_MARGIN })
    this.stopFrames = onFrame(this.followCamera, FRAME_ORDER.render)
    this.$nextTick(function () {
      this.resizeHandler() //set initial ratio
      window.addEventListener('resize', this.resizeHandler)
    })
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.resizeHandler)
    this.stopFrames()
  },
  methods: {
    ...mapActions(useUIStore, [
      'setMouse',
      'panBy',
      'pinchTo',
      'worldAt',
      'enterNeighborView',
      'selectNone',
      'selectSprite',
      'scaleAnimateTo',
      'calculateViewableArea',
      'drawWorldAt',
      'closeMenu',
      'setLabelPlacements'
    ]),
    resizeHandler() {
      this.calculateViewableArea({ x: window.innerWidth, y: window.innerHeight })
      this.drawWorld()
    },
    /** Redraw the world for the live camera (sharp at the current zoom). */
    drawWorld() {
      this.drawWorldAt(this.viewport)
    },
    /** Each frame: show the drawn world at the live camera's position and zoom, redrawing when needed. */
    followCamera(now) {
      if (!this.worldLayer) return
      if (!(now - this.labelsLaidOutAt < LABEL_LAYOUT_MS)) {
        this.labelsLaidOutAt = now
        this.setLabelPlacements(placeOfferedLabels())
      }
      const drawn = this.drawnView
      const live = this.viewport
      // Where the group origin sits in the (oversized) world element.
      const unit = this.worldUnit
      const delta = {
        scale: drawn.scale / live.scale,
        x: (unit * (live.x - drawn.x)) / live.scale,
        y: (unit * (live.y - drawn.y)) / live.scale,
        originX: this.screenSize.width / 2 + WORLD_MARGIN,
        originY: this.screenSize.height / 2 + WORLD_MARGIN + unit * WORLD_OFFSET_Y
      }
      if (this.worldLayer.update(delta)) this.drawWorld()
    },
    /** Pixels from the screen's center. */
    fromCenter(point) {
      return { screenX: point.x - this.screenSize.width / 2, screenY: point.y - this.screenSize.height / 2 }
    },
    pointerDown(event) {
      if (event.pointerType === 'mouse' && event.button !== 0) return
      this.selectNone()
      if (this.isMenuOn) {
        this.closeMenu()
        return
      }
      event.currentTarget.setPointerCapture(event.pointerId)
      this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
      this.mouseHold = true
      this.startGesture()
    },
    /**
     * One pointer drags once it has moved past CAMERA.DRAG_THRESHOLD_PX (a smaller move is a click).
     * Two pinch: the world point between the fingers stays between them as they spread or close.
     */
    startGesture() {
      const points = [...this.pointers.values()]
      if (points.length === 1) {
        this.gesture = { type: 'drag', start: points[0], dragging: false }
      } else if (points.length === 2) {
        const middle = { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 }
        const center = this.fromCenter(middle)
        this.gesture = {
          type: 'pinch',
          distance: Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y) || 1,
          scale: this.viewport.scale,
          world: this.worldAt(center.screenX, center.screenY)
        }
      }
    },
    pointerMove(event) {
      this.setMouse({ x: event.clientX, y: event.clientY })
      const previous = this.pointers.get(event.pointerId)
      if (!previous || !this.gesture) return
      const point = { x: event.clientX, y: event.clientY }
      this.pointers.set(event.pointerId, point)

      if (this.gesture.type === 'drag') {
        const { start } = this.gesture
        if (!this.gesture.dragging) {
          if (Math.max(Math.abs(point.x - start.x), Math.abs(point.y - start.y)) <= CAMERA.DRAG_THRESHOLD_PX) return
          this.gesture.dragging = true
          this.closeMenu()
          // Catch up on the move below the threshold, so the map stays exactly under the pointer.
          this.panBy(point.x - start.x, point.y - start.y)
          return
        }
        this.panBy(point.x - previous.x, point.y - previous.y)
        return
      }

      const [a, b] = [...this.pointers.values()]
      const distance = Math.hypot(a.x - b.x, a.y - b.y) || 1
      const scale = (this.gesture.scale * this.gesture.distance) / distance
      // Pinching out past the edge of the system opens the neighbor view, as the wheel does.
      if (scale > CAMERA.MAX_SCALE * 1.25) {
        this.pointers.clear()
        this.gesture = null
        this.mouseHold = false
        this.enterNeighborView()
        return
      }
      this.pinchTo({ scale, ...this.fromCenter({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }), ...this.gesture.world })
    },
    pointerUp(event) {
      if (!this.pointers.delete(event.pointerId)) return
      if (this.pointers.size === 0) {
        this.gesture = null
        this.mouseHold = false
      } else {
        // A finger lifted mid-pinch: the other one carries on as a drag.
        this.startGesture()
        if (this.gesture) this.gesture.dragging = true
      }
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.star-map {
  display: block;
  /* The map handles its own drags and pinches; the page never scrolls or zooms under them. */
  touch-action: none;
}
.map-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: block;
  shape-rendering: geometricPrecision;
  text-rendering: geometricPrecision;
}
// The HUD covers the whole screen, but only its painted parts take the mouse; the rest
// passes through to the world layer underneath (panning, clicking sprites).
.hud-layer {
  pointer-events: none;
  > g {
    pointer-events: auto;
  }
}
.world-layer {
  position: absolute;
}
.is-dragging {
  cursor: grabbing;
}
</style>
