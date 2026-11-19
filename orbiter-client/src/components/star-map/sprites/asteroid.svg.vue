<template>
  <!-- A belt's large asteroid (D69): its composition's art (assets/art/asteroid-*.svg), about 10 units in
       radius (libs/sprite-types.js ART.asteroid), turned a little by its section so they don't all match;
       and what's built on it (libs/station-art.js): the Platform's footing, the Mine's derrick and drones,
       and the bare station core until a Port brings the station itself (drawn by its own sprite). -->
  <g :transform="`rotate(${section * 47})`">
    <image :href="art" x="-11" y="-11" width="22" height="22" />
    <!-- eslint-disable-next-line vue/no-v-html, vue/no-v-text-v-html-on-component -->
    <g v-if="works" transform="scale(0.18333)" v-html="works" />
  </g>
</template>

<script>
import carbonaceous from '@/assets/art/asteroid-carbonaceous.svg'
import silicate from '@/assets/art/asteroid-silicate.svg'
import metallic from '@/assets/art/asteroid-metallic.svg'
import { asteroidWorks } from '@/libs/station-art'

const ART = [carbonaceous, silicate, metallic]
// The station's core in the rock's 120-unit frame (radius 14.5, as the station sprite draws it there).
const CORE =
  '<g transform="scale(0.05) translate(-290 -301)"><path fill="#ffffff" fill-rule="evenodd" d="M291 0l61 35 15 -25 139 80 -15 25 61 36 0 71 28 0 0 160 -28 0 0 70 -63 36 14 24 -139 80 -14 -24 -59 34 -63 -37 -15 26 -139 -80 15 -26 -59 -33 0 -73 -30 0 0 -160 30 0 0 -68 62 -36 -15 -26 139 -81 15 27 60 -35zm83 196c47,36 64,100 42,155l-98 -57 56 -98zm22 188c-36,47 -99,63 -154,42l56 -99 98 57zm-188 22c-46,-36 -63,-100 -41,-154l98 56 -57 98zm-22 -188c37,-46 100,-63 155,-41l-57 98 -98 -57z"/></g>'

export default {
  name: 'AsteroidSprite',
  props: {
    composition: { type: Number, default: 0 },
    /** Which section it's in. */
    section: { type: Number, default: 0 },
    /** The asteroid (sdk/system.js), for what's built on it. None: the bare rock. */
    asteroid: { type: Object, default: null }
  },
  computed: {
    art() {
      return ART[this.composition] ?? carbonaceous
    },
    works() {
      return this.asteroid ? asteroidWorks(this.asteroid, CORE) : ''
    }
  }
}
</script>
