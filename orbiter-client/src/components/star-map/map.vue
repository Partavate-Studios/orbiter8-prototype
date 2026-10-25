<template>
  <!-- Back to front: background, world (the star system) and HUD are separate elements,
       so changes in one layer never make the browser repaint the others. -->
  <div class="layer star-map" ref="gamelayerContainer">
    <background-canvas />

    <!-- The world is drawn for the camera in drawnView and slightly larger than the screen;
         between redraws a CSS transform (composited, no repaint) follows the live camera. -->
    <div class="world-layer" :style="worldBox" ref="world">
      <svg
        class="map-layer"
        :viewBox="worldViewBox"
        :class="{ 'is-dragging': mouseHold }"
        id="gamelayer"
        ref="gamelayer"
        xmlns="http://www.w3.org/2000/svg">
        <g font-family="Ubuntu, sans-serif" :transform="'scale(' + baseScale + ')'">
          <g v-if="mapDataLoaded && !jumpAnimationState" transform="translate(0 -100)">
            <g :transform="worldTransform">
              <grid :scale="drawnView.scale"></grid>
            </g>
            <rect x="-2000" y="-1000" width="4000" height="2000" fill="#ffffff00"
            @mousedown="handleMouseDown"
            @mouseup="handleMouseUp"
            @mousemove="handleMouseMove"
            @mouseleave="handleMouseLeave"/>
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
        :origin-x="container.width / 2 + worldMargin"
        :origin-y="container.height / 2 + worldMargin + worldUnit * worldOffsetY" />
    </div>

    <svg
      class="map-layer hud-layer"
      :viewBox="layerViewBox"
      xmlns="http://www.w3.org/2000/svg">
      <g font-family="Ubuntu, sans-serif" :transform="'scale(' + baseScale + ')'">
        <g v-if="mapDataLoaded">
          <g v-if="jumpAnimationState">
            <jumpAnimation></jumpAnimation>
          </g>
          <g v-else-if="menuState.jumpMenu" transform="translate(0 -100)">
            <jumpMenu></jumpMenu>
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

import { useGameStateStore } from '@/stores/gamestate'
import { useStarMapStore } from '@/stores/starmap'
import { useUIStore } from '@/stores/ui'
import { mapActions, mapState } from 'pinia'
import { useConfigStore } from '@/stores/config'
import _ from 'lodash'
import Grid from './_grid.svg'
import Hud from './hud/hud.svg'
import JumpMenu from './hud/jump-menu.svg'
import JumpAnimation from './hud/jump-animation.svg'
import BackgroundCanvas from './background-canvas.vue'
import SolarSystem from './_solarsystem.svg'
import PlanetLayers from './planet-layers.vue'
import ConnectionStatus from './hud/connection-status.svg'
import LoadingBar from './hud/loading-bar.svg'
import { onFrame, FRAME_ORDER } from '@/libs/frame-loop'
import { CompositedLayer } from '@/libs/composited-layer'

// Pixels of world drawn beyond each screen edge, so the camera can pan a little before a redraw.
const WORLD_MARGIN = 256
// The world sits 100 units above center inside the HUD's scaled group (see the template).
const WORLD_OFFSET_Y = -100

export default {
  components: {
    Hud,
    JumpMenu,
    JumpAnimation,
    Grid,
    BackgroundCanvas,
    SolarSystem,
    PlanetLayers,
    ConnectionStatus,
    LoadingBar
  },
  name: 'StarMap',
  props: {
  },
  data () {
    return {
      //these should be in UI store
      mouseHold: false,
      prevMouseX: 0,
      prevMouseY: 0,
      mouseXThreshold: 0,
      mouseYThreshold: 0,
      worldMargin: WORLD_MARGIN,
      worldOffsetY: WORLD_OFFSET_Y
    }
  },
  mounted () {
    this.drawWorld()
    this.worldLayer = new CompositedLayer(this.$refs.world, {
      margin: WORLD_MARGIN,
      // Shrinking the drawn world (zooming out) is fine until its edges would come on screen.
      minScale: () => Math.max(
        (this.container.width / 2) / (this.container.width / 2 + WORLD_MARGIN),
        (this.container.height / 2) / (this.container.height / 2 + WORLD_MARGIN)
      )
    })
    this.stopFrames = onFrame(this.followCamera, FRAME_ORDER.render)
    this.$nextTick(function() {
      this.resizeHandler() //set initial ratio
      window.addEventListener('resize', this.resizeHandler)
    })
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.resizeHandler);
    this.stopFrames()
  },
  computed: {
    ...mapState(useGameStateStore, [
      'starMap',
    ]),
    ...mapState(useUIStore, [
      'viewport',
      'container',
      'baseScale',
      'drawnView',
      'groupPixels',
      'menuState',
      'isMenuOn',
      'jumpAnimationState'
    ]),
    ...mapState(useConfigStore, [
      'graphicsQuality',
      'showScope'
    ]),
    ...mapState(useStarMapStore, [
      'currentStarSystemId',
      'currentStarSystemName',
      'mapDataLoaded',
      'myShipId'
    ]),
    /**
     * Every layer maps 1200 units to the container's height, centered on the origin (this is
     * what the original single SVG did at any aspect ratio), so the layers line up exactly.
     */
    /** Pixels per world-group unit (before the camera's zoom). */
    worldUnit () {
      return this.groupPixels
    },
    worldTransform () {
      return 'scale(' + (1 / this.drawnView.scale) + ') translate(' + this.drawnView.x + ' ' + this.drawnView.y + ')'
    },
    /** The world layer covers the screen plus WORLD_MARGIN on every side, at the same scale as the other layers. */
    worldBox () {
      return {
        left: -WORLD_MARGIN + 'px',
        top: -WORLD_MARGIN + 'px',
        width: this.container.width + 2 * WORLD_MARGIN + 'px',
        height: this.container.height + 2 * WORLD_MARGIN + 'px'
      }
    },
    worldViewBox () {
      const unitsPerPixel = this.viewport.resolution / this.container.height
      const width = (this.container.width + 2 * WORLD_MARGIN) * unitsPerPixel
      const height = (this.container.height + 2 * WORLD_MARGIN) * unitsPerPixel
      return (-width / 2) + ' ' + (-height / 2) + ' ' + width + ' ' + height
    },
    layerViewBox () {
      const width = this.viewport.resolution * this.container.width / this.container.height
      const height = this.viewport.resolution
      return (-width / 2) + ' ' + (-height / 2) + ' ' + width + ' ' + height
    },


  },
  created () {
    this.selectSprite(this.myShipId)
  },
  watch: {
    currentStarSystemId: function (val, oldVal) {
      if (val != oldVal) {
        if (this.myShipId != 0) {
          this.selectSprite(this.myShipId)
          this.scaleAnimateTo({scale: 0.05, time: 5000})
        } else {
          this.scaleAnimateTo({scale: 0.5, time: 5000})
        }
      }
    },
  },
  methods: {
    ...mapActions(useUIStore, [
      'setMouse',
      'viewTo',
      'selectNone',
      'selectSprite',
      'scaleAnimateTo',
      'jumpMenuOff',
      'calculateViewableArea',
      'drawWorldAt',
      'closeMenu'
    ]),
    resizeHandler () {
      this.calculateViewableArea({x: window.innerWidth, y: window.innerHeight})
      this.drawWorld()
    },
    /** Redraw the world for the live camera (sharp at the current zoom). */
    drawWorld () {
      this.drawWorldAt(this.viewport)
    },
    /** Each frame: show the drawn world at the live camera's position and zoom, redrawing when needed. */
    followCamera () {
      if (!this.worldLayer) return
      const drawn = this.drawnView
      const live = this.viewport
      // Where the group origin sits in the (oversized) world element.
      const unit = this.worldUnit
      const delta = {
        scale: drawn.scale / live.scale,
        x: unit * (live.x - drawn.x) / live.scale,
        y: unit * (live.y - drawn.y) / live.scale,
        originX: this.container.width / 2 + WORLD_MARGIN,
        originY: this.container.height / 2 + WORLD_MARGIN + unit * WORLD_OFFSET_Y
      }
      if (this.worldLayer.update(delta)) this.drawWorld()
    },
    handleMouseDown () {
      this.selectNone()
      if (this.isMenuOn) {
        this.jumpMenuOff()
        this.closeMenu()
      } else {
        this.mouseHold = true
        this.mouseXThreshold = this.prevMouseX
        this.mouseYThreshold = this.prevMouseY
      }
    },
    handleMouseUp () {
      this.mouseHold = false
    },
    handleMouseMove: _.throttle(function (event) {
      if (this.isMenuOn) {
        this.mouseHold = false
        return
      }
      let screenX = event.pageX
      let screenY = event.pageY
      this.setMouse({x: screenX, y: screenY})
      let x = this.viewport.x
      let y = this.viewport.y

      let minDistance = Math.max(
         Math.abs(screenX - this.mouseXThreshold),
         Math.abs(screenY - this.mouseYThreshold)
      )

      if (this.mouseHold && (minDistance > 20)) {
        this.selectNone()
        this.jumpMenuOff()
        this.closeMenu()
        let acceleration = this.viewport.scale > 1 ? this.viewport.scale * 0.5 : this.viewport.scale * 0.7

        if (screenX < this.prevMouseX) {
          x -= Math.abs(this.prevMouseX - screenX) * acceleration
        }
        if (screenX > this.prevMouseX) {
          x += (Math.abs(this.prevMouseX - screenX)) * acceleration
        }
        if (screenY < this.prevMouseY) {
          y -= (Math.abs(this.prevMouseY - screenY)) * acceleration
        }
        if (screenY > this.prevMouseY) {
          y += (Math.abs(this.prevMouseY - screenY)) * acceleration
        }
        this.viewTo({x, y})
      }

      this.prevMouseX = screenX
      this.prevMouseY = screenY
    }, 4),
    handleMouseLeave ({ clientX, clientY }) {
      if (
        clientX <= 0 ||
        clientY <= 0 ||
        clientX >= window.innerWidth ||
        clientY >= window.innerHeight
      ) {
        this.mouseHold = false
      }
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
  .star-map {
    display: block;
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
