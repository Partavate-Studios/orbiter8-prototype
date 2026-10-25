<template>
  <!-- Back to front: background, world (the star system) and HUD are separate elements,
       so changes in one layer never make the browser repaint the others. -->
  <div class="layer star-map" ref="gamelayerContainer">
    <svg
      class="map-layer"
      :viewBox="layerViewBox"
      xmlns="http://www.w3.org/2000/svg">
      <backdrop
        id="backdrop"
        :transform="backdropTransform"></backdrop>

      <g :transform="getFractionalTranslate" v-if="graphicsQuality > 1">
        <starfield
          id="stars"
        :transform="starfieldTransform"></starfield>
      </g>
    </svg>

    <svg
      class="map-layer"
      :viewBox="layerViewBox"
      :class="{ 'is-dragging': mouseHold }"
      id="gamelayer"
      ref="gamelayer"
      xmlns="http://www.w3.org/2000/svg">
      <g font-family="Ubuntu, sans-serif" :transform="'scale(' + baseScale + ')'">
        <g v-if="mapDataLoaded && !jumpAnimationState" transform="translate(0 -100)">
          <g :transform="getTransform()">
            <grid></grid>
          </g>
          <rect x="-2000" y="-1000" width="4000" height="2000" fill="#ffffff00"
          @mousedown="handleMouseDown"
          @mouseup="handleMouseUp"
          @mousemove="handleMouseMove"
          @mouseleave="handleMouseLeave"/>
          <g :transform="getTransform()">
            <solar-system />
          </g>
        </g>
      </g>
    </svg>

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
import backdrop from './assets/backdrop.svg'
import starfield from './assets/starfield.svg'
import SolarSystem from './_solarsystem.svg'
import ConnectionStatus from './hud/connection-status.svg'
import LoadingBar from './hud/loading-bar.svg'

export default {
  components: {
    Hud,
    JumpMenu,
    JumpAnimation,
    Grid,
    backdrop,
    starfield,
    SolarSystem,
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
      //todo: do I need basescale???
      baseScale: 1.25
      //todo: viewbox should be ratio aware
    }
  },
  mounted () {
    this.$nextTick(function() {
      this.resizeHandler() //set initial ratio
      window.addEventListener('resize', this.resizeHandler)
    })
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.resizeHandler);
  },
  computed: {
    ...mapState(useGameStateStore, [
      'starMap',
    ]),
    ...mapState(useUIStore, [
      'viewport',
      'container',
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
    layerViewBox () {
      const width = this.viewport.resolution * this.container.width / this.container.height
      const height = this.viewport.resolution
      return (-width / 2) + ' ' + (-height / 2) + ' ' + width + ' ' + height
    },
    backdropTransform () {
      return 'scale(' + ((Math.sqrt(10 / parseFloat(this.viewport.scale)) + 10) / 4) + ')'
    },
    starfieldTransform () {
      return 'scale(' + ((Math.sqrt(12 / parseFloat(this.viewport.scale)) + 10) / 4) + ')'
    },
    getFractionalTranslate () {
      const div = 20
      return 'translate(' +
        (this.viewport.x / div) + ' ' +
        (this.viewport.y / div) + ')' //rubber should be in store
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
      'closeMenu'
    ]),
    resizeHandler () {
      this.calculateViewableArea({x: window.innerWidth, y: window.innerHeight})
      console.log('new size: ' + window.innerWidth + ' x ' + window.innerHeight )
    },
    getTransform () {
      return 'scale(' +
        (1 / parseFloat(this.viewport.scale)) +
        ') translate(' +
        (this.viewport.x) + ' ' +
        (this.viewport.y) + ')' //rubber should be in store
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
  .is-dragging {
    cursor: grabbing;
  }
</style>
