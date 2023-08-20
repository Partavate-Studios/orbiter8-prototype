<template>
  <g>
    <circle v-if="amISelected" :cx="originOffset.x" :cy="originOffset.y" :r="sprite.distance" stroke="#c3b3da" stroke-dasharray="0.5 1" stroke-width="0.05" fill="none" />
    <circle v-else-if="showOrbit" :cx="originOffset.x" :cy="originOffset.y" :r="sprite.distance" stroke="#c3b3da" stroke-dasharray="0.5 1" stroke-width="0.01" fill="none" />
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

import { mapMutations, mapGetters } from 'vuex'
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
      telemetry: {
        translatex: 0,
        translatey: 0,
        rotation: 0
      },
      hover: false,
      originOffset: {
        x: 0,
        y: 0
      },
      range: 0
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
    ...mapGetters('StarMap', [
      'systemObjects',
      'gameTime',
    ]),
    ...mapGetters('UI', [
      'selected',
      'showLabels',
      'isMenuOn',
      'viewport'
    ]),
    ...mapGetters('Config', [
      'showScope', // todo: this should be in UI
      'graphicsQuality'
    ]),
    showOrbit () {
      if (this.sprite.type != 'star') {
        return true
      }
      /*
      if (this.sprite.type != 'ship' && this.sprite.type != 'star') {
        return true
      }
      */
      return false
    },
    getOrbitalTransform () {
      return 'translate(' +
        parseFloat(this.telemetry.translatex + this.originOffset.x) +
        ',' +
        parseFloat(this.telemetry.translatey + this.originOffset.y) +
        ')'
    },
    getRotationalTransform () {
      return 'rotate(' + this.telemetry.rotation + ')'
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
    isMyChildSelected () {
      if (typeof this.systemObjects[this.selected] === 'undefined') return false
      let parentOfSelected = this.systemObjects[this.selected].orbiting
      if (parentOfSelected === this.objectIndex) {
        return true
      }
      return false
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
      if (this.range > 1500) {
        return false
      }
      return true
    }
  },
  methods: {
    ...mapMutations('UI', [
      'setSelectedTelemetry',
      'selectSprite',
      'scaleAnimateTo'
    ]),
    ...mapMutations('Config', [
      'toggleScope'
    ]),
    spriteAction: function () {
      if (this.amISelected) {
        this.toggleScope()
      } else {
        this.selectSprite(this.objectIndex)
      }
    },
    // todo: this may not be the best place to fire this off
    updateSpriteTelemetry: function () {
      this.telemetry = this.sprite.telemetry
      if ((this.sprite.orbiting) && (this.systemObjects[this.sprite.orbiting] != 'undefined')) {
        let parentTelemetry = this.systemObjects[this.sprite.orbiting].telemetry
        this.originOffset.x = parseFloat(parentTelemetry.translatex)
        this.originOffset.y = parseFloat(parentTelemetry.translatey)
      } else {
        this.originOffset.x = 0
        this.originOffset.y = 0
      }
      let absoluteX = this.originOffset.x + this.telemetry.translatex
      let absoluteY = this.originOffset.y + this.telemetry.translatey
      if (this.amISelected) {
        this.range = 0
      } else {
        //get the scaled distance from the viewbox on either the x or y plane, whichever is greater
        if (absoluteX+this.viewport.x > absoluteY+this.viewport.y) {
          this.range = (absoluteX+this.viewport.x)  / this.viewport.scale
        } else {
          this.range = (absoluteY+this.viewport.y) / this.viewport.scale
        }
      }
    },

    // todo: this may not be the best place to fire this off
    updateViewportTelemetry: function () {
      let absoluteX = this.originOffset.x + this.telemetry.translatex
      let absoluteY = this.originOffset.y + this.telemetry.translatey
      if (this.amISelected) {
        if (!this.sprite.menu.showing) {
          this.sprite.openMenu()
        }
        let cameraTelemetry = {
          translatex: absoluteX,
          translatey: absoluteY,
          scale: this.sprite.targetScale
        }
        this.setSelectedTelemetry(cameraTelemetry)
      } else {
        if (this.sprite.menu.showing) {
          this.sprite.closeMenu()
        }
      }




    }
  },
  watch: {
    gameTime: {
      handler () {
        this.updateViewportTelemetry()
      }
    },
    sprite: {
      handler () {
        this.updateSpriteTelemetry()
      },
      deep: true
    }

  }
}
</script>
