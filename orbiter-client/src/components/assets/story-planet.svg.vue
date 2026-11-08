<template>
  <!-- A planet as the star map draws it (the same disc, lighting and surface art as sprites/planet.svg.vue),
       at any radius, for the story's panels. Lit from the left; the surface turns under the disc's clip
       when `spin` is set. Rings are seen edge-on, like the tech tree's pictures. -->
  <g :transform="'scale(' + radius / 10 + ')'">
    <g v-if="rings" :transform="'rotate(' + ringTilt + ')'">
      <ellipse rx="19" ry="5" fill="none" :stroke="'url(#ring-' + planetClass + ')'" :stroke-width="ringWidth" opacity="0.7" />
    </g>
    <circle r="10" :stroke="colors.light" stroke-width="0.25" :fill="'url(#planet-' + planetClass + ')'" />
    <g clip-path="url(#just-the-planet)" class="story-surface" :style="{ '--mark': colors.mark, '--mark-opacity': colors.markOpacity }">
      <!-- eslint-disable-next-line vue/no-v-html, vue/no-v-text-v-html-on-component -- the surfaces are the game's own SVG, not user content -->
      <g class="surface" :style="spin ? { animation: 'story-planet-turn ' + spin + 's linear infinite' } : null" v-html="surface" />
    </g>
    <circle r="10" fill="url(#planetShade)" />
    <g v-if="rings" :transform="'rotate(' + ringTilt + ')'">
      <path d="M-18 5.9A19 5 0 0 0 18 -5.9" fill="none" :stroke="'url(#ring-' + planetClass + ')'" :stroke-width="ringWidth" opacity="0.7" />
    </g>
  </g>
</template>

<script>
import { PLANET_SURFACES } from './planet-surfaces'
import { PLANET_COLORS } from '@/libs/palette'

export default {
  name: 'StoryPlanet',
  props: {
    /** The planet's class, 0–9 (sdk/game/planet-types.js). */
    planetClass: { type: Number, default: 0 },
    /** The disc's radius, in the parent's units. */
    radius: { type: Number, default: 10 },
    /** Ring thickness, as the game's planets carry it (0 for none; Saturn's is 10). */
    rings: { type: Number, default: 0 },
    /** Seconds per turn of the surface; 0 keeps it still. */
    spin: { type: Number, default: 0 },
    ringTilt: { type: Number, default: -18 }
  },
  computed: {
    /** The class's colors, as the star map draws it (libs/palette.js). */
    colors() {
      return PLANET_COLORS[this.planetClass] ?? PLANET_COLORS[1]
    },
    surface() {
      return PLANET_SURFACES[this.planetClass] ?? ''
    },
    ringWidth() {
      return 0.8 + Math.min(this.rings, 10) * 0.12
    }
  }
}
</script>

<style>
/* The surface marks in the class's color, as on the star map (marks drawn as lines keep no fill). */
.story-surface g:not([fill='none']) {
  fill: var(--mark);
  fill-opacity: var(--mark-opacity);
  stroke: none;
}
.story-surface g[fill='none'] {
  stroke: var(--mark);
  stroke-opacity: var(--mark-opacity);
}
/* Global, so the surface keeps turning inside v-html markup (scoped attributes don't reach it). */
@keyframes story-planet-turn {
  to {
    transform: rotate(360deg);
  }
}
</style>
