<template>
  <g transform="scale(0.025)">
    <g  transform="translate(-290,-301)" stroke-width="8" fill="none" stroke="#ffffff"  style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd">
      <path fill="none" class="fil0" d="M291 0l61 35 15 -25 139 80 -15 25 61 36 0 71 28 0 0 160 -28 0 0 70 -63 36 14 24 -139 80 -14 -24 -59 34 -63 -37 -15 26 -139 -80 15 -26 -59 -33 0 -73 -30 0 0 -160 30 0 0 -68 62 -36 -15 -26 139 -81 15 27 60 -35zm83 196c47,36 64,100 42,155l-98 -57 56 -98zm22 188c-36,47 -99,63 -154,42l56 -99 98 57zm-188 22c-46,-36 -63,-100 -41,-154l98 56 -57 98zm-22 -188c37,-46 100,-63 155,-41l-57 98 -98 -57z"/>
    </g>
  </g>
</template>

<script>

export default {
  name: 'SpaceStationOutline',
  props: {
    port: {
      type: Object,
      default () {
        return {
          name: '...',
          attributes: {
            speed: 0,
            size: 0,
            distance: 0,
            rotation: 0
          }
        }
      }
    },
  }
}
</script>
