<template>
  <g>
    <defs>
      <radialGradient  v-if="graphicsQuality > 1" id="planetGradient" cx="10%" cy="50%" r="180%" fx="0%" fy="50%">
        <stop offset="0%" style="stop-color:#e5cfff;stop-opacity:1" />
        <stop offset="10%" style="stop-color:#e5cfff;stop-opacity:1" />
        <stop offset="20%" style="stop-color:#c3b3da;stop-opacity:1" />
        <stop offset="30%" style="stop-color:rgb(140,120,180);stop-opacity:1" />
        <stop offset="40%" style="stop-color:rgb(60,40,90);stop-opacity:1" />
        <stop offset="100%" style="stop-color:rgb(60,40,90);stop-opacity:1" />
      </radialGradient>
      <linearGradient  v-else id="planetGradient">
        <stop offset="0%" style="stop-color:#e5cfff;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#230b41;stop-opacity:1" />
      </linearGradient>

      <linearGradient v-if="graphicsQuality > 2" id="ringGradient"
        x1="100%" y1="100%" x2="-100%" y2="-100%" gradientTransform="rotate(135)">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="1"/>
          <stop offset="10%" stop-color="#ffffff" stop-opacity="1"/>
          <stop offset="20%" stop-color="#ffffff" stop-opacity="0.5"/>
          <stop offset="70%" stop-color="#ffffff" stop-opacity="0.1"/>
          <stop offset="90%" stop-color="#000000" stop-opacity="0.1"/>
        </linearGradient>
      <linearGradient v-else id="ringGradient"
        x1="100%" y1="100%" x2="-100%" y2="-100%" gradientTransform="rotate(135)">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="1"/>
        <stop offset="50%" stop-color="#ffffff" stop-opacity="1"/>
        <stop offset="70%" stop-color="#6735a3" stop-opacity="1"/>
        <stop offset="90%" stop-color="#230b41" stop-opacity="1"/>
      </linearGradient>

    </defs>
    <defs>
      <clipPath id="just-the-planet">
        <circle cx="0" cy="0" r="10" />
      </clipPath>
    </defs>

    <circle cx="0" cy="0" r="12" stroke="none" fill="#ffffff00" />

    <circle cx="0" cy="0" r="10" stroke="#c3b3da" stroke-width="0.25" fill="url(#planetGradient)" />

    <g v-if="graphicsQuality > 2" clip-path="url(#just-the-planet)" :transform="'rotate(' + (0 - planet.telemetry.rotation) + ')'">
      <g v-if="planet.class == 0"  stroke-width="0.5" stroke="#ffffff11" fill="#ffffff22" >
      <!-- Earth Like -->
        <rect x="-2" y="-8" width="12" height="2" rx="1" ry="1" />
        <rect x="0" y="-6" width="14" height="2" rx="1" ry="1" />
        <rect x="-2" y="-5" width="7" height="2" rx="1" ry="1" />
        <rect x="-9" y="-7" width="6" height="2" rx="1" ry="1"  />
        <rect x="-10" y="-4" width="10" height="2" rx="1" ry="1"  />
        <rect x="-1" y="-2" width="12" height="2" rx="1" ry="1"  />
        <rect x="-12"  y="1" width="12" height="2" rx="1" ry="1"  />
        <rect x="-10"  y="3" width="14" height="2" rx="1" ry="1"  />
        <rect x="-4"  y="4" width="14" height="2" rx="1" ry="1"  />
        <rect x="0"  y="6" width="6" height="2" rx="1" ry="1"  />
        <rect x="-6"  y="8" width="4" height="2" rx="1" ry="1"  />
        <rect x="-10"  y="9" width="12" height="2" rx="1" ry="1"  />
      </g>
      <g v-if="planet.class == 1" stroke-width="0.5" stroke="#00000011" fill="#340f6122">
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
      <g v-if="planet.class == 2">
      </g>
      <g v-if="planet.class == 3">
      </g>
      <g v-if="planet.class == 4"  stroke-width="0" stroke="#ffffff11" fill="#ffffff22" >
      <!-- Thin Atmo -->
        <rect x="-2" y="-8" width="12" height="1" rx="1" ry="1" />
        <rect x="-9" y="-7" width="6" height="1" rx="1" ry="1"  />
        <rect x="-10" y="-4" width="10" height="1" rx="1" ry="1"  />
        <rect x="-10"  y="3" width="14" height="1" rx="1" ry="1"  />
        <rect x="0"  y="6" width="6" height="1" rx="1" ry="1"  />
        <rect x="-6"  y="8" width="4" height="1" rx="1" ry="1"  />
      </g>
    <!-- gassy rocky -->
      <g v-if="planet.class == 5" stroke-width="0.5" stroke="#ffffff11" fill="#00000022">
        <rect x="-10" y="-9" width="17" height="4" rx="2" ry="2" />
        <rect x="4" y="-7" width="10" height="4" rx="2" ry="2" />
        <rect x="-9" y="-6" width="12" height="4" rx="2" ry="2"  />
        <rect x="-2" y="-5" width="12" height="4" rx="2" ry="2" />
        <rect x="-10" y="-3" width="6" height="4" rx="2" ry="2"  />
        <rect x="-1" y="-2" width="12" height="4" rx="2" ry="2"  />
        <rect x="-10"  y="0" width="18" height="4" rx="2" ry="2"  />
        <rect x="-6"  y="1" width="18" height="4" rx="2" ry="2"  />
        <rect x="-12"  y="3" width="12" height="4" rx="2" ry="2"  />
        <rect x="0"  y="5" width="12" height="4" rx="2" ry="2"  />
        <rect x="-6"  y="6" width="10" height="4" rx="2" ry="2"  />
        <rect x="-10"  y="8" width="12" height="4" rx="2" ry="2"  />
      </g>
    <!-- gas giant -->
      <g v-if="planet.class == 6" stroke-width="0.5" stroke="#5c1aae22" fill="#ffffff22">
        <rect x="-10" y="-9" width="17" height="4" rx="2" ry="2" />
        <rect x="4" y="-7" width="10" height="4" rx="2" ry="2" />
        <rect x="-9" y="-6" width="12" height="4" rx="2" ry="2"  />
        <rect x="-2" y="-5" width="12" height="4" rx="2" ry="2" />
        <rect x="-10" y="-3" width="6" height="4" rx="2" ry="2"  />
        <rect x="-1" y="-2" width="12" height="4" rx="2" ry="2"  />
        <rect x="-10"  y="0" width="18" height="4" rx="2" ry="2"  />
        <rect x="-6"  y="1" width="18" height="4" rx="2" ry="2"  />
        <rect x="-12"  y="3" width="12" height="4" rx="2" ry="2"  />
        <rect x="0"  y="5" width="12" height="4" rx="2" ry="2"  />
        <rect x="-6"  y="6" width="10" height="4" rx="2" ry="2"  />
        <rect x="-10"  y="8" width="12" height="4" rx="2" ry="2"  />
      </g>
    <!-- ferrous -->
      <g v-if="planet.class == 7" stroke="#c3b3da44" stroke-width="0.15" fill="#340f6122">
        <circle cx="-2.5" cy="2" r="1.5" />
        <circle cx="2" cy="-2.5" r="0.75"  />
        <circle cx="3" cy="2" r="1"  />
        <circle cx="-2.5" cy="-3.5" r="0.5"  />
        <circle cx="-6" cy="-2" r="1"  />
        <circle cx="6" cy="-1" r="1"  />
        <circle cx="-2" cy="-6" r="0.75"  />
        <circle cx="-0.5" cy="6" r="0.5"  />
        <circle cx="7" cy="3" r="3"  />
        <circle cx="10" cy="-4" r="1"  />
        <circle cx="-5" cy="-6" r="2"  />
        <circle cx="-5" cy="6" r="1"  />
      </g>
    <!-- Lava -->
      <g v-if="planet.class == 8" stroke-width="0" stroke="none" fill="#ffffff44">
        <circle cx="0" cy="0" r="9" />
      </g>
    <!-- Swamp -->
      <g v-if="planet.class == 9">
      </g>
    </g>

    <circle
      v-if="planet.rings"
      cy="0"
      :r="20"
      stroke="url(#ringGradient)"
      opacity="0.5"
      :stroke-width="planet.rings"
      fill="none" />
    <g v-if="graphicsQuality > 1">
      <circle
        v-for="n in parseInt(planet.rings)"
        :key="n"
        cx="0"
        cy="0"
        :r="20 + (n - (planet.rings/2))"
        stroke="url(#ringGradient)"
        opacity="0.2"
        :stroke-width="0.1 + ((planet.rings/2) - Math.abs(n - (planet.rings/2)))/100"
        fill="none" />
    </g>


  </g>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'planet',
  props: {
    planet: {
      type: Object,
      default () {
        return {
          rings: 0
        }
      }
    }
  },
  computed: {
    ...mapGetters('Config', [
      'graphicsQuality'
    ]),
  }
}
</script>
