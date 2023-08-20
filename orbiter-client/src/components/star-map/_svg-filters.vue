<template>
  <g>
    <filter id="blur">
      <feGaussianBlur in="SourceGraphic" stdDeviation="0.2" />
    </filter>
    <filter id="soft">
      <feGaussianBlur in="SourceGraphic" stdDeviation="0.01" />
    </filter>
    <linearGradient id="scopeFill"
      x1="0%" y1="0%" x2="100%" y2="100%" gradientTransform="rotate(45)">
        <stop offset="0%" stop-color="#280b4b" stop-opacity="0"/>
        <stop offset="20%" stop-color="#280b4b" stop-opacity="0.1"/>
        <stop offset="25%" stop-color="#280b4b" stop-opacity="0.90"/>
        <stop offset="45%" stop-color="#280b4b" stop-opacity="0.90"/>
        <stop offset="50%" stop-color="#280b4b" stop-opacity="0.1"/>
        <stop offset="100%" stop-color="#280b4b" stop-opacity="0"/>
      </linearGradient>

    <linearGradient id="starStreak"
      x1="0%" y1="0%" x2="100%" y2="0" gradientTransform="">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="1"/>
        <stop offset="10%" stop-color="#ffffff" stop-opacity="0.1"/>
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
      </linearGradient>

    <radialGradient id="starGradient">
      <stop offset="20%" stop-color="#c3b3da"/>
      <stop offset="75%" stop-color="#d4c4eb"/>
      <stop offset="100%" stop-color="#ffffff"/>
    </radialGradient>
    <radialGradient id="glowingGradient">
      <stop offset="0%" stop-color="#ffffff"  stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#ffffff"  stop-opacity="0.0"/>
    </radialGradient>
    <radialGradient id="lightGlowingGradient">
      <stop offset="0%" stop-color="#ffffff"  stop-opacity="0.02"/>
      <stop offset="100%" stop-color="#ffffff"  stop-opacity="0.0"/>
    </radialGradient>
  </g>
</template>

<script>
export default {
  name: 'svgfilters'
}
</script>

<style scoped lang="scss">
</style>
