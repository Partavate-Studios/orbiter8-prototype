<template>
  <!-- Each planet, with everything orbiting it (moons, its space station, ships) and their orbit
       rings, is a small SVG in its own composited layer. The whole layer follows the planet with a
       CSS translate, so the rings never repaint as the planet moves; only the small moving bodies
       inside a layer do. Positioned at the world's origin; sizes are for the camera in drawnView. -->
  <div class="planet-layers" :style="{ left: originX + 'px', top: originY + 'px' }">
    <div
      v-for="planetIndex in spriteIds.planets"
      :key="'planet-layer-' + planetIndex"
      class="planet-layer"
      :style="{ transform: layerTranslate(planetIndex) }">
      <svg
        :width="layerSize(planetIndex)"
        :height="layerSize(planetIndex)"
        :viewBox="layerViewBox(planetIndex)"
        :style="layerOffset(planetIndex)"
        font-family="Ubuntu, sans-serif"
        xmlns="http://www.w3.org/2000/svg">
        <g>
          <sprite-transform
            :sprite="systemObjects[planetIndex]"
            :objectIndex="planetIndex"
            type="planet"
            frame-of="self" />
          <sprite-transform
            v-for="childIndex in childrenOf(planetIndex)"
            :key="'sprite-' + childIndex"
            :sprite="systemObjects[childIndex]"
            :objectIndex="childIndex"
            :type="systemObjects[childIndex].type"
            frame-of="parent" />
        </g>
      </svg>
    </div>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { useStarMapStore } from '@/stores/starmap'
import SpriteTransform from './sprites/sprite-transform.svg'

// Room around a planet's outermost orbit for the orbiting bodies and their labels, in world units.
const LAYER_PADDING = 30

export default {
  name: 'PlanetLayers',
  components: {
    SpriteTransform
  },
  props: {
    /** The camera the world is drawn for ({ x, y, scale }). */
    drawnView: { type: Object, required: true },
    /** Pixels per world-group unit at scale 1. */
    unit: { type: Number, required: true },
    /** The world origin's position in the world layer, in pixels. */
    originX: { type: Number, required: true },
    originY: { type: Number, required: true }
  },
  computed: {
    ...mapState(useStarMapStore, [
      'systemObjects',
      'spriteIds',
      'gameTime'
    ]),
    /** Pixels per world unit at the drawn zoom. */
    pixelsPerUnit () {
      return this.unit / this.drawnView.scale
    },
    childIndexes () {
      const children = {}
      this.systemObjects.forEach((sprite, index) => {
        if (sprite.type !== 'planet' && sprite.orbiting && this.systemObjects[sprite.orbiting]?.type === 'planet') {
          (children[sprite.orbiting] ??= []).push(index)
        }
      })
      return children
    },
    /** Half the width of each planet's layer, in world units. */
    layerRadius () {
      const radius = {}
      for (const planetIndex of this.spriteIds.planets) {
        const children = this.childIndexes[planetIndex] ?? []
        const outermost = Math.max(0, ...children.map(index => this.systemObjects[index].distance))
        radius[planetIndex] = outermost + LAYER_PADDING
      }
      return radius
    }
  },
  methods: {
    childrenOf (planetIndex) {
      return this.childIndexes[planetIndex] ?? []
    },
    layerSize (planetIndex) {
      return 2 * this.layerRadius[planetIndex] * this.pixelsPerUnit
    },
    layerViewBox (planetIndex) {
      const r = this.layerRadius[planetIndex]
      return -r + ' ' + -r + ' ' + 2 * r + ' ' + 2 * r
    },
    layerOffset (planetIndex) {
      const half = -this.layerSize(planetIndex) / 2 + 'px'
      return { left: half, top: half }
    },
    /** Where the planet is this frame, relative to the world origin, in whole device pixels. */
    layerTranslate (planetIndex) {
      // Sprites are raw objects updated in place each frame; reading gameTime makes this re-evaluate per frame.
      void this.gameTime
      const planet = this.systemObjects[planetIndex]
      const dpr = window.devicePixelRatio || 1
      const x = Math.round((planet.position.x + this.drawnView.x) * this.pixelsPerUnit * dpr) / dpr
      const y = Math.round((planet.position.y + this.drawnView.y) * this.pixelsPerUnit * dpr) / dpr
      return `translate(${x}px, ${y}px)`
    }
  }
}
</script>

<style scoped>
  .planet-layers {
    position: absolute;
    width: 0;
    height: 0;
    pointer-events: none;
  }
  .planet-layer {
    position: absolute;
    left: 0;
    top: 0;
    /* These layers only ever translate, so keeping them promoted can't leave a blurry scaled bitmap. */
    will-change: transform;
  }
  .planet-layer svg {
    position: absolute;
    overflow: visible;
    shape-rendering: geometricPrecision;
    text-rendering: geometricPrecision;
  }
  /* Only painted parts of the sprites take the mouse; the rest reaches the world layer below. */
  .planet-layer svg > g {
    pointer-events: auto;
  }
</style>
