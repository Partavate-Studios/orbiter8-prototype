<template>
  <!-- Gradients, clips, masks and filters shared by every SVG in the game. Mounted once:
       ids are document-wide, so defining them inside components that render many times
       produced duplicate ids (invalid, and browsers silently used whichever came first). -->
  <svg class="svg-defs" aria-hidden="true" focusable="false">
    <defs>
      <filter id="blur">
        <feGaussianBlur in="SourceGraphic" stdDeviation="0.2" />
      </filter>
      <filter id="soft">
        <feGaussianBlur in="SourceGraphic" stdDeviation="0.01" />
      </filter>
      <linearGradient id="scopeFill" x1="0%" y1="0%" x2="100%" y2="100%" gradientTransform="rotate(45)">
        <stop offset="0%" stop-color="#280b4b" stop-opacity="0" />
        <stop offset="20%" stop-color="#280b4b" stop-opacity="0.1" />
        <stop offset="25%" stop-color="#280b4b" stop-opacity="0.90" />
        <stop offset="45%" stop-color="#280b4b" stop-opacity="0.90" />
        <stop offset="50%" stop-color="#280b4b" stop-opacity="0.1" />
        <stop offset="100%" stop-color="#280b4b" stop-opacity="0" />
      </linearGradient>

      <linearGradient id="starStreak" x1="0%" y1="0%" x2="100%" y2="0" gradientTransform="">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="1" />
        <stop offset="10%" stop-color="#ffffff" stop-opacity="0.1" />
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
      </linearGradient>

      <radialGradient id="starGradient">
        <stop offset="20%" stop-color="#c3b3da" />
        <stop offset="75%" stop-color="#d4c4eb" />
        <stop offset="100%" stop-color="#ffffff" />
      </radialGradient>
      <radialGradient id="glowingGradient">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.2" />
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0.0" />
      </radialGradient>
      <radialGradient id="lightGlowingGradient">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.02" />
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0.0" />
      </radialGradient>

      <!-- Planet surface and rings (depend on graphics quality) -->
      <radialGradient v-if="graphicsQuality > 1" id="planetGradient" cx="10%" cy="50%" r="180%" fx="0%" fy="50%">
        <stop offset="0%" style="stop-color: #e5cfff; stop-opacity: 1" />
        <stop offset="10%" style="stop-color: #e5cfff; stop-opacity: 1" />
        <stop offset="20%" style="stop-color: #c3b3da; stop-opacity: 1" />
        <stop offset="30%" style="stop-color: rgb(140, 120, 180); stop-opacity: 1" />
        <stop offset="40%" style="stop-color: rgb(60, 40, 90); stop-opacity: 1" />
        <stop offset="100%" style="stop-color: rgb(60, 40, 90); stop-opacity: 1" />
      </radialGradient>
      <linearGradient v-else id="planetGradient">
        <stop offset="0%" style="stop-color: #e5cfff; stop-opacity: 1" />
        <stop offset="100%" style="stop-color: #230b41; stop-opacity: 1" />
      </linearGradient>

      <linearGradient
        v-if="graphicsQuality > 2"
        id="ringGradient"
        x1="100%"
        y1="100%"
        x2="-100%"
        y2="-100%"
        gradientTransform="rotate(135)"
      >
        <stop offset="0%" stop-color="#ffffff" stop-opacity="1" />
        <stop offset="10%" stop-color="#ffffff" stop-opacity="1" />
        <stop offset="20%" stop-color="#ffffff" stop-opacity="0.5" />
        <stop offset="70%" stop-color="#ffffff" stop-opacity="0.1" />
        <stop offset="90%" stop-color="#000000" stop-opacity="0.1" />
      </linearGradient>
      <linearGradient
        v-else
        id="ringGradient"
        x1="100%"
        y1="100%"
        x2="-100%"
        y2="-100%"
        gradientTransform="rotate(135)"
      >
        <stop offset="0%" stop-color="#ffffff" stop-opacity="1" />
        <stop offset="50%" stop-color="#ffffff" stop-opacity="1" />
        <stop offset="70%" stop-color="#6735a3" stop-opacity="1" />
        <stop offset="90%" stop-color="#230b41" stop-opacity="1" />
      </linearGradient>

      <!-- Stars by spectral class (libs/palette.js STAR_CLASSES): the body, and its glow (normal and high
           graphics; the glow is a gradient, never a filter, so it costs what the old white glow did). -->
      <radialGradient v-for="(c, k) in STAR_CLASSES" :id="'star-' + k" :key="'star-' + k">
        <stop offset="0%" :stop-color="c.core" />
        <stop offset="55%" :stop-color="c.core" />
        <stop offset="85%" :stop-color="c.mid" />
        <stop offset="100%" :stop-color="c.glow" />
      </radialGradient>
      <radialGradient v-for="(c, k) in STAR_CLASSES" :id="'starGlow-' + k" :key="'starGlow-' + k">
        <stop offset="0%" :stop-color="c.glow" :stop-opacity="graphicsQuality > 2 ? 0.55 : 0.45" />
        <stop offset="45%" :stop-color="c.glow" stop-opacity="0.16" />
        <stop offset="100%" :stop-color="c.glow" stop-opacity="0" />
      </radialGradient>

      <!-- Planets by class (libs/palette.js PLANET_COLORS): a lit sphere on normal and high graphics,
           a plain two-color fill on low. Rings in the class's colors. -->
      <template v-for="(c, i) in PLANET_COLORS" :key="'planet-' + i">
        <radialGradient v-if="graphicsQuality > 1" :id="'planet-' + i" cx="30%" cy="50%" r="80%" fx="15%" fy="50%">
          <stop offset="0%" :stop-color="c.light" />
          <stop offset="55%" :stop-color="c.mid" />
          <stop offset="100%" :stop-color="c.dark" />
        </radialGradient>
        <linearGradient v-else :id="'planet-' + i" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" :stop-color="c.light" />
          <stop offset="100%" :stop-color="c.dark" />
        </linearGradient>
        <linearGradient :id="'ring-' + i" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" :stop-color="c.light" stop-opacity="0.1" />
          <stop offset="50%" :stop-color="c.light" stop-opacity="0.95" />
          <stop offset="100%" :stop-color="c.mid" stop-opacity="0.1" />
        </linearGradient>
      </template>
      <!-- High graphics: light and shadow over a planet's surface marks -->
      <radialGradient id="planetShade" cx="25%" cy="50%" r="85%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.35" />
        <stop offset="35%" stop-color="#ffffff" stop-opacity="0" />
        <stop offset="80%" stop-color="#160631" stop-opacity="0.35" />
        <stop offset="100%" stop-color="#160631" stop-opacity="0.7" />
      </radialGradient>

      <!-- Black holes: Koda's portal art (star-map/sprites/portal.svg.vue) -->
      <radialGradient id="portalGradient">
        <stop offset="0%" stop-color="#c3b3da" stop-opacity="1" />
        <stop offset="40%" stop-color="#280b4b" stop-opacity="0.5" />
        <stop offset="100%" stop-color="#000000" stop-opacity="1" />
      </radialGradient>
      <radialGradient id="portalDarkening">
        <stop offset="0%" stop-color="#c3b3da" stop-opacity="0" />
        <stop offset="80%" stop-color="#000000" stop-opacity="0.2" />
        <stop offset="100%" stop-color="#280b4b" stop-opacity="0" />
      </radialGradient>
      <linearGradient id="portalDarkline">
        <stop offset="0%" stop-color="#000000" stop-opacity="0" />
        <stop offset="50%" stop-color="#280b4b" stop-opacity="0.4" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0.2" />
      </linearGradient>

      <!-- Planet surface details rotate under this clip -->
      <clipPath id="just-the-planet">
        <circle cx="0" cy="0" r="10" />
      </clipPath>

      <!-- Ship engine plumes -->
      <linearGradient id="engineGradient" gradientTransform="rotate(90)" x1="0%" y1="0%" x2="100%" y2="0">
        <stop offset="0%" stop-color="#ffaaff" stop-opacity="0.8" />
        <stop offset="3%" stop-color="#ff88ff" stop-opacity="0.1" />
        <stop offset="100%" stop-color="#ff00ff" stop-opacity="0" />
      </linearGradient>
      <!-- A stronger plume, for ships drawn small that still need to read as under thrust -->
      <linearGradient id="engineTrailGradient" gradientTransform="rotate(90)" x1="0%" y1="0%" x2="100%" y2="0">
        <stop offset="0%" stop-color="#ffe0ff" stop-opacity="1" />
        <stop offset="12%" stop-color="#ff99ff" stop-opacity="0.6" />
        <stop offset="100%" stop-color="#ff00ff" stop-opacity="0" />
      </linearGradient>

      <!-- HUD icon buttons -->
      <clipPath id="icon-clip">
        <circle cx="0" cy="0" r="30" stroke-width="1" />
      </clipPath>

      <!-- Info cards -->
      <linearGradient id="cardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#5c1aae" stop-opacity="1" />
        <stop offset="10%" stop-color="#280b4b" stop-opacity="1" />
        <stop offset="50%" stop-color="#5c1aae" stop-opacity="1" />
        <stop offset="90%" stop-color="#280b4b" stop-opacity="1" />
        <stop offset="100%" stop-color="#5c1aae" stop-opacity="1" />
      </linearGradient>

      <!-- A hovered card button (this one was referenced but missing, so hovering emptied the button) -->
      <linearGradient id="cardGradient45" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#7c39cd" />
        <stop offset="50%" stop-color="#9a5ae6" />
        <stop offset="100%" stop-color="#7c39cd" />
      </linearGradient>
      <!-- Selection cards in the selected thing's colors (libs/card-theme.js): the frame and buttons,
           and hovered buttons -->
      <template v-for="(t, key) in CARD_THEMES" :key="'card-' + key">
        <linearGradient :id="'card-' + key" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" :stop-color="t.mid" />
          <stop offset="10%" :stop-color="t.deep" />
          <stop offset="50%" :stop-color="t.mid" />
          <stop offset="90%" :stop-color="t.deep" />
          <stop offset="100%" :stop-color="t.mid" />
        </linearGradient>
        <linearGradient :id="'cardHover-' + key" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" :stop-color="t.hoverMid" />
          <stop offset="50%" :stop-color="t.hoverDeep" />
          <stop offset="100%" :stop-color="t.hoverMid" />
        </linearGradient>
      </template>

      <!-- Cargo hold blocks -->
      <linearGradient id="emptyBlockGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#c3b3da00" stop-opacity="1" />
        <stop offset="100%" stop-color="#ffffff00" stop-opacity="1" />
      </linearGradient>
      <linearGradient id="fullBlockGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#c3b3da" stop-opacity="1" />
        <stop offset="100%" stop-color="#ffffff" stop-opacity="1" />
      </linearGradient>
      <linearGradient id="soldBlockGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#c3b3da" stop-opacity="1" />
        <stop offset="100%" stop-color="#5c1aae" stop-opacity="1" />
      </linearGradient>

      <!-- Trade menu tabs -->
      <linearGradient id="tabGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#290C4C" stop-opacity="1" />
        <stop offset="40%" stop-color="#310F5Ddd" stop-opacity="1" />
        <stop offset="100%" stop-color="#5D1EB0" stop-opacity="1" />
      </linearGradient>

      <linearGradient id="cargoTabGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#5D1EB0" stop-opacity="1" />
        <stop offset="60%" stop-color="#310F5Ddd" stop-opacity="1" />
        <stop offset="100%" stop-color="#290C4C" stop-opacity="1" />
      </linearGradient>

      <!-- Ship silhouette behind the trade menu's cargo and upgrade panels -->
      <mask id="tradeTabMask">
        <rect x="-40" y="-20" width="80" height="40" fill="#ffffff" />
      </mask>
    </defs>
  </svg>
</template>

<script>
import { mapState } from 'pinia'
import { useConfigStore } from '@/stores/config'
import { STAR_CLASSES, PLANET_COLORS } from '@/libs/palette'
import { CARD_THEMES } from '@/libs/card-theme'

export default {
  name: 'SvgDefs',
  data() {
    return { STAR_CLASSES, PLANET_COLORS, CARD_THEMES }
  },
  computed: {
    ...mapState(useConfigStore, ['graphicsQuality'])
  }
}
</script>

<style scoped>
.svg-defs {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
}
</style>
