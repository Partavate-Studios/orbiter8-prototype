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
      if (router.currentRoute.value.path != '/') {
        router.push('/')
      }
    })
  }
}
</script>

<style lang="scss">
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
</style>
