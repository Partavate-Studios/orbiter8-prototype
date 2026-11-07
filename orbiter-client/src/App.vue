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
      const path = router.currentRoute.value.path
      if (path != '/') {
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
/* The card's pill button (card-button.svg.vue's look), for HTML over the game: the dialog, the galaxy map. */
/* card-button.svg.vue's pill; hovered, only its outline stays, as in the cards. */
.card-pill {
  font: inherit;
  font-weight: bold;
  min-width: 7.5em;
  padding: 0.45em 1.2em;
  border: 1px solid #5b1aaa88;
  border-radius: 40px / 12px;
  background: linear-gradient(135deg, #5c1aae 0%, #280b4b 10%, #5c1aae 50%, #280b4b 90%, #5c1aae 100%);
  color: #ffffff;
  text-shadow: 0 1px 2px #0008;
  cursor: pointer;
}
.card-pill:hover:not(:disabled) {
  background: transparent;
  border-color: #5b1aaa;
}
.card-pill:focus-visible {
  outline: 2px solid #c3b3da;
  outline-offset: 2px;
}
.card-pill:disabled {
  color: #ffffff66;
  cursor: default;
}
/* The dialog's action, lavender like the title's primary buttons (.o8-button.primary). */
.card-pill.accent:not(:disabled) {
  background: #c3b3da;
  border-color: #c3b3da;
  color: #1c0838;
  text-shadow: none;
}
.card-pill.accent:hover:not(:disabled) {
  background: #e6dcf5;
  border-color: #e6dcf5;
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
