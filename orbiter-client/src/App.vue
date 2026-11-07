<template>
  <svg-defs />
  <gamepad-overlay />
  <div id="app">
    <router-view />
  </div>
</template>

<script>
import SvgDefs from '@/components/svg-defs.vue'
import GamepadOverlay from '@/components/gamepad-overlay.vue'
import router from '@/router/router'

export default {
  name: 'Orbiter8Game',
  components: {
    SvgDefs,
    GamepadOverlay
  },
  created: function () {
    // Always start at the title screen, which connects the wallet and loads the game. Vue Router 4
    // resolves the URL asynchronously, so wait for it; checking right away always saw '/'.
    router.isReady().then(() => {
      // Demo 4's galaxy (/galaxy) connects by itself (docs/demo4-plan.md, milestone 1).
      const path = router.currentRoute.value.path
      if (path != '/' && path != '/galaxy') {
        router.push('/')
      }
    })
  }
}
</script>

<style lang="scss">
/* The accents, as in libs/palette.js. */
:root {
  --o8-pink: #e1177c;
  --o8-pink-light: #ff6fb0;
  --o8-yellow: #ccff00;
  --o8-yellow-light: #ebff99;
}
#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
}
body {
  font-family: 'Ubuntu', sans-serif;
  margin: 0;
  padding: 0;
  color: #c3b3da;
  background-size: cover;
  background: #310e5c;
}
a {
  color: #aaa;
}
/* A full-screen layer that never scrolls: the star map's container (components/star-map/map.vue). */
.layer {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  overflow: hidden;
}
</style>
