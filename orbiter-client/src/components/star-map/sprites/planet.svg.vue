<template>
  <g>
    <circle cx="0" cy="0" r="12" stroke="none" fill="#ffffff00" />

    <!-- Rings, tilted (libs/palette.js PLANET_COLORS): the far half behind the planet, the near half in
         front. They keep their tilt on screen as the planet turns to face its star (writeSurface). -->
    <g v-if="planet.rings > 0" ref="ringsBack">
      <g transform="rotate(-18)" fill="none" :stroke="'url(#ring-' + planet.class + ')'">
        <path :d="ringArc(ringRx, ringRy, true)" :stroke-width="ringWidth" opacity="0.75" />
        <template v-if="graphicsQuality > 2">
          <path v-for="n in ringLines" :key="n" :d="ringArc(ringRx + n.offset, ringRy + n.offset * 0.3, true)" stroke-width="0.12" opacity="0.5" />
        </template>
      </g>
    </g>

    <!-- The sphere in its class's colors, lit on the side facing the star (the sprite turns it) -->
    <circle cx="0" cy="0" r="10" :stroke="colors.light" stroke-width="0.25" :fill="'url(#planet-' + planet.class + ')'" />

    <!-- The surface turns against the sprite's rotation, so it appears to spin under the clip.
         Its rotation is written every frame by writeSurface, not by Vue. -->
    <g
      v-if="graphicsQuality > 1"
      ref="surface"
      clip-path="url(#just-the-planet)"
      :fill="colors.mark"
      :fill-opacity="colors.markOpacity"
      :stroke="colors.mark"
      :stroke-opacity="colors.markOpacity * 0.5"
      stroke-width="0.4"
    >
      <g v-if="planet.class == 0">
        <!-- Earth Like -->
        <rect x="-2" y="-8" width="12" height="2" rx="1" ry="1" />
        <rect x="0" y="-6" width="14" height="2" rx="1" ry="1" />
        <rect x="-2" y="-5" width="7" height="2" rx="1" ry="1" />
        <rect x="-9" y="-7" width="6" height="2" rx="1" ry="1" />
        <rect x="-10" y="-4" width="10" height="2" rx="1" ry="1" />
        <rect x="-1" y="-2" width="12" height="2" rx="1" ry="1" />
        <rect x="-12" y="1" width="12" height="2" rx="1" ry="1" />
        <rect x="-10" y="3" width="14" height="2" rx="1" ry="1" />
        <rect x="-4" y="4" width="14" height="2" rx="1" ry="1" />
        <rect x="0" y="6" width="6" height="2" rx="1" ry="1" />
        <rect x="-6" y="8" width="4" height="2" rx="1" ry="1" />
        <rect x="-10" y="9" width="12" height="2" rx="1" ry="1" />
      </g>
      <g v-if="planet.class == 1">
        <circle cx="-5" cy="-5" r="1" />
        <circle cx="-4" cy="8" r="0.75" />
        <circle cx="-8" cy="-5" r="1.5" />
        <circle cx="3" cy="-7" r="0.5" />
        <circle cx="-7" cy="-6" r="1" />
        <circle cx="-3" cy="3" r="1.5" />
        <circle cx="-5" cy="-5" r="0.75" />
        <circle cx="2" cy="-1" r="0.5" />

        <circle cx="2" cy="6" r="1" />
        <circle cx="5" cy="8" r="0.75" />
        <circle cx="9" cy="-2" r="1.5" />
        <circle cx="-1" cy="-7" r="0.5" />
        <circle cx="6" cy="-6" r="1" />
        <circle cx="4" cy="3" r="1.5" />
        <circle cx="5" cy="-5" r="0.75" />
        <circle cx="-2" cy="-1" r="0.5" />
      </g>
      <g v-if="planet.class == 2"> </g>
      <g v-if="planet.class == 3"> </g>
      <g v-if="planet.class == 4">
        <!-- Thin Atmo -->
        <rect x="-2" y="-8" width="12" height="1" rx="1" ry="1" />
        <rect x="-9" y="-7" width="6" height="1" rx="1" ry="1" />
        <rect x="-10" y="-4" width="10" height="1" rx="1" ry="1" />
        <rect x="-10" y="3" width="14" height="1" rx="1" ry="1" />
        <rect x="0" y="6" width="6" height="1" rx="1" ry="1" />
        <rect x="-6" y="8" width="4" height="1" rx="1" ry="1" />
      </g>
      <!-- gassy rocky -->
      <g v-if="planet.class == 5">
        <rect x="-10" y="-9" width="17" height="4" rx="2" ry="2" />
        <rect x="4" y="-7" width="10" height="4" rx="2" ry="2" />
        <rect x="-9" y="-6" width="12" height="4" rx="2" ry="2" />
        <rect x="-2" y="-5" width="12" height="4" rx="2" ry="2" />
        <rect x="-10" y="-3" width="6" height="4" rx="2" ry="2" />
        <rect x="-1" y="-2" width="12" height="4" rx="2" ry="2" />
        <rect x="-10" y="0" width="18" height="4" rx="2" ry="2" />
        <rect x="-6" y="1" width="18" height="4" rx="2" ry="2" />
        <rect x="-12" y="3" width="12" height="4" rx="2" ry="2" />
        <rect x="0" y="5" width="12" height="4" rx="2" ry="2" />
        <rect x="-6" y="6" width="10" height="4" rx="2" ry="2" />
        <rect x="-10" y="8" width="12" height="4" rx="2" ry="2" />
      </g>
      <!-- gas giant -->
      <g v-if="planet.class == 6">
        <rect x="-10" y="-9" width="17" height="4" rx="2" ry="2" />
        <rect x="4" y="-7" width="10" height="4" rx="2" ry="2" />
        <rect x="-9" y="-6" width="12" height="4" rx="2" ry="2" />
        <rect x="-2" y="-5" width="12" height="4" rx="2" ry="2" />
        <rect x="-10" y="-3" width="6" height="4" rx="2" ry="2" />
        <rect x="-1" y="-2" width="12" height="4" rx="2" ry="2" />
        <rect x="-10" y="0" width="18" height="4" rx="2" ry="2" />
        <rect x="-6" y="1" width="18" height="4" rx="2" ry="2" />
        <rect x="-12" y="3" width="12" height="4" rx="2" ry="2" />
        <rect x="0" y="5" width="12" height="4" rx="2" ry="2" />
        <rect x="-6" y="6" width="10" height="4" rx="2" ry="2" />
        <rect x="-10" y="8" width="12" height="4" rx="2" ry="2" />
      </g>
      <!-- ferrous -->
      <g v-if="planet.class == 7">
        <circle cx="-2.5" cy="2" r="1.5" />
        <circle cx="2" cy="-2.5" r="0.75" />
        <circle cx="3" cy="2" r="1" />
        <circle cx="-2.5" cy="-3.5" r="0.5" />
        <circle cx="-6" cy="-2" r="1" />
        <circle cx="6" cy="-1" r="1" />
        <circle cx="-2" cy="-6" r="0.75" />
        <circle cx="-0.5" cy="6" r="0.5" />
        <circle cx="7" cy="3" r="3" />
        <circle cx="10" cy="-4" r="1" />
        <circle cx="-5" cy="-6" r="2" />
        <circle cx="-5" cy="6" r="1" />
      </g>
      <!-- Lava -->
      <g v-if="planet.class == 8">
        <circle cx="0" cy="0" r="9" />
      </g>
      <!-- Oceanic: swells -->
      <g v-if="planet.class == 2" fill="none" stroke-width="0.6" :stroke-opacity="colors.markOpacity">
        <path d="M-10 -4q2.5 -2 5 0t5 0t5 0t5 0" />
        <path d="M-11 1q2.5 -2 5 0t5 0t5 0t5 0" />
        <path d="M-10 6q2.5 -2 5 0t5 0t5 0t5 0" />
      </g>
      <!-- Desert: dunes -->
      <g v-if="planet.class == 3" stroke="none">
        <path d="M-11 -2q6 -5 12 0t12 0v3q-6 -4 -12 0t-12 0z" />
        <path d="M-9 4q5 -4 10 0t10 0v2.5q-5 -3.5 -10 0t-10 0z" />
        <path d="M-6 -7q4 -3 8 0t8 0v2q-4 -3 -8 0t-8 0z" />
      </g>
      <!-- Lava: cracks over the glow -->
      <g v-if="planet.class == 8" fill="none" stroke-width="0.5" :stroke-opacity="colors.markOpacity">
        <path d="M-8 -3L-2 -1L3 -5L8 -2M-6 4L0 2L6 6M-3 -8L1 -4" />
      </g>
      <!-- Swamp -->
      <g v-if="planet.class == 9" stroke="none">
        <ellipse cx="-4" cy="-3" rx="4" ry="2.5" />
        <ellipse cx="4" cy="2" rx="5" ry="2" />
        <ellipse cx="-3" cy="6" rx="3" ry="1.6" />
        <ellipse cx="5" cy="-6" rx="2.5" ry="1.4" />
      </g>
    </g>
    <!-- High graphics: light and shadow over the surface, turning with the light -->
    <circle v-if="graphicsQuality > 2" cx="0" cy="0" r="10" fill="url(#planetShade)" />

    <g v-if="planet.rings > 0" ref="ringsFront">
      <g transform="rotate(-18)" fill="none" :stroke="'url(#ring-' + planet.class + ')'">
        <path :d="ringArc(ringRx, ringRy, false)" :stroke-width="ringWidth" opacity="0.75" />
        <template v-if="graphicsQuality > 2">
          <path v-for="n in ringLines" :key="n" :d="ringArc(ringRx + n.offset, ringRy + n.offset * 0.3, false)" stroke-width="0.12" opacity="0.5" />
        </template>
      </g>
    </g>
  </g>
</template>

<script>
import { onFrame, FRAME_ORDER } from '@/libs/frame-loop'
import { writeAttribute } from '@/libs/dom-writes'
import { mapState } from 'pinia'
import { useConfigStore } from '@/stores/config'
import { PLANET_COLORS } from '@/libs/palette'

export default {
  name: 'Planet',
  props: {
    /** The planet's sprite (libs/sprite.js): its game data, and its rotation this frame. */
    sprite: { type: Object, required: true }
  },
  computed: {
    planet() {
      return this.sprite.object
    },
    colors() {
      return PLANET_COLORS[this.planet.class] ?? PLANET_COLORS[1]
    },
    // The ring band: wider with more rings; its fine lines on high graphics.
    ringRx() {
      return 20
    },
    ringRy() {
      return 6
    },
    ringWidth() {
      return Math.max(0.6, this.planet.rings * 0.55)
    },
    ringLines() {
      const n = Number(this.planet.rings)
      return Array.from({ length: n }, (_, i) => ({ offset: (i - (n - 1) / 2) * 0.55 }))
    },
    ...mapState(useConfigStore, ['graphicsQuality'])
  },
  mounted() {
    this.stopFrames = onFrame(this.writeSurface, FRAME_ORDER.render)
    this.writeSurface()
  },
  updated() {
    this.writeSurface()
  },
  unmounted() {
    this.stopFrames()
  },
  methods: {
    /** Half of an ellipse: the far half (over the top) or the near half (under the bottom). */
    ringArc(rx, ry, far) {
      return far ? `M${-rx} 0A${rx} ${ry} 0 0 1 ${rx} 0` : `M${rx} 0A${rx} ${ry} 0 0 1 ${-rx} 0`
    },
    writeSurface() {
      // Same 0.25° steps as the sprite's own rotation (sprite-transform), so they cancel exactly.
      const rotation = 0 - Math.round(this.sprite.telemetry.rotation / 0.25) * 0.25
      writeAttribute(this.$refs.surface, 'transform', 'rotate(' + rotation + ')')
      writeAttribute(this.$refs.ringsBack, 'transform', 'rotate(' + rotation + ')')
      writeAttribute(this.$refs.ringsFront, 'transform', 'rotate(' + rotation + ')')
    }
  }
}
</script>
