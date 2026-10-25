<template>
  <!-- Each planet, with everything orbiting it (moons, its space station, ships) and their orbit
       rings, is a small SVG in its own composited layer. The whole layer follows the planet with a
       CSS translate, so the rings never repaint as the planet moves; only the small moving bodies
       inside a layer do. Positioned at the world's origin; sizes are for the camera in drawnView. -->
  <div class="planet-layers" :style="{ left: originX + 'px', top: originY + 'px' }">
    <div
      v-for="planetIndex in spriteIds.planets"
      :key="'planet-layer-' + planetIndex"
      :ref="(element) => setLayerElement(planetIndex, element)"
      class="planet-layer"
    >
      <svg
        :width="layerSize(planetIndex)"
        :height="layerSize(planetIndex)"
        :viewBox="layerViewBox(planetIndex)"
        :style="layerOffset(planetIndex)"
        font-family="Ubuntu, sans-serif"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g>
          <!-- Rings first, so a ring never crosses a body. Ships at a planet all share one orbit. -->
          <orbit-ring
            v-for="childIndex in childrenOf(planetIndex)"
            :key="'ring-' + childIndex"
            :r="systemObjects[childIndex].orbit.radius"
            :selected="childIndex === selected"
          />
          <sprite-transform :sprite="sprites[planetIndex]" :object-index="planetIndex" type="planet" frame-of="self" />
          <sprite-transform
            v-for="childIndex in childrenOf(planetIndex)"
            :key="'sprite-' + childIndex"
            :sprite="sprites[childIndex]"
            :object-index="childIndex"
            :type="systemObjects[childIndex].type"
            frame-of="parent"
          />
        </g>
      </svg>
    </div>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { useStarMapStore } from '@/stores/starmap'
import SpriteTransform from './sprites/sprite-transform.svg'
import OrbitRing from './sprites/orbit-ring.svg.vue'
import { useUIStore } from '@/stores/ui'
import { onFrame, FRAME_ORDER } from '@/libs/frame-loop'
import { writeStyle } from '@/libs/dom-writes'

// Room around a planet's outermost orbit for the orbiting bodies and their labels, in world units.
const LAYER_PADDING = 30

export default {
  name: 'PlanetLayers',
  components: {
    SpriteTransform,
    OrbitRing
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
    ...mapState(useStarMapStore, ['systemObjects', 'sprites', 'spriteIds']),
    ...mapState(useUIStore, ['selected']),
    /** Pixels per world unit at the drawn zoom. */
    pixelsPerUnit() {
      return this.unit / this.drawnView.scale
    },
    childIndexes() {
      const children = {}
      for (const [key, object] of Object.entries(this.systemObjects)) {
        if (object.type !== 'planet' && this.systemObjects[object.orbiting]?.type === 'planet') {
          ;(children[object.orbiting] ??= []).push(key)
        }
      }
      return children
    },
    /** Half the width of each planet's layer, in world units. */
    layerRadius() {
      const radius = {}
      for (const planetIndex of this.spriteIds.planets) {
        const children = this.childIndexes[planetIndex] ?? []
        const outermost = Math.max(0, ...children.map((index) => this.systemObjects[index].orbit.radius))
        radius[planetIndex] = outermost + LAYER_PADDING
      }
      return radius
    }
  },
  watch: {
    // Redrawn for a new camera (inside this frame, after writeFrame ran): re-place the layers before paint.
    drawnView() {
      this.writeFrame()
    }
  },
  created() {
    // Planet key → its layer element; not reactive, only writeFrame reads it.
    this.layerElements = {}
  },
  mounted() {
    this.stopFrames = onFrame(this.writeFrame, FRAME_ORDER.render)
    this.writeFrame()
  },
  updated() {
    this.writeFrame()
  },
  unmounted() {
    this.stopFrames()
  },
  methods: {
    childrenOf(planetIndex) {
      return this.childIndexes[planetIndex] ?? []
    },
    layerSize(planetIndex) {
      return 2 * this.layerRadius[planetIndex] * this.pixelsPerUnit
    },
    layerViewBox(planetIndex) {
      const r = this.layerRadius[planetIndex]
      return -r + ' ' + -r + ' ' + 2 * r + ' ' + 2 * r
    },
    layerOffset(planetIndex) {
      const half = -this.layerSize(planetIndex) / 2 + 'px'
      return { left: half, top: half }
    },
    setLayerElement(planetIndex, element) {
      if (element) this.layerElements[planetIndex] = element
      else delete this.layerElements[planetIndex]
    },
    /** Moves each planet's layer to where the planet is this frame (in whole device pixels). */
    writeFrame() {
      const dpr = window.devicePixelRatio || 1
      for (const [planetIndex, element] of Object.entries(this.layerElements)) {
        const planet = this.sprites[planetIndex]
        if (!planet) continue
        const x = Math.round((planet.position.x + this.drawnView.x) * this.pixelsPerUnit * dpr) / dpr
        const y = Math.round((planet.position.y + this.drawnView.y) * this.pixelsPerUnit * dpr) / dpr
        writeStyle(element, 'transform', `translate(${x}px, ${y}px)`)
      }
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
