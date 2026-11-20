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
      // Except the dev builds' Minerva lab, which needs no game loaded.
      if (path != '/' && !(import.meta.env.DEV && path == '/minerva-lab')) {
        router.push('/')
      }
    })
  }
}
</script>

<style lang="scss">
/* The accents and the color system's tokens, as in libs/palette.js (docs/color-guide.md). */
:root {
  --o8-pink: #e1177c;
  --o8-pink-light: #ff6fb0;
  --o8-yellow: #ccff00;
  --o8-yellow-light: #ebff99;
  --o8-space: #130e24;
  --o8-space-deep: #0b0916;
  --o8-surface-1: #1b1531;
  --o8-surface-2: #251d40;
  --o8-surface-3: #302651;
  --o8-border: #3f3566;
  --o8-text: #f1eefa;
  --o8-text-2: #bdb5d4;
  --o8-brand-500: #7b4fe6;
  --o8-brand-400: #8b5cf6;
  --o8-brand-300: #b9a0ff;
}
/* Minerva's buttons (her console, the ID scanner, her notices) are the card drawer's (hud/selection-panel.vue
   .action; Koda, 2026-11-20: the buttons he likes best): a pill in plum with a thin violet edge, its picture
   in a round well (.o8-well), bold pale text; hover lights the edge lavender. .on is the tab you're on (the
   hover look); .main is the one main action (the lit edge, bigger with .big). No lavender fills. */
.o8-pill {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.6em;
  min-height: 2.6em;
  box-sizing: border-box;
  padding: 0 1.2em;
  border: 1.5px solid #4a3d7a;
  border-radius: 999px;
  background: linear-gradient(180deg, #2e2354 0%, #211839 100%);
  color: #efe7ff;
  font: inherit;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.o8-pill:hover:not(:disabled),
.o8-pill.on {
  border-color: #b9a0ff;
  background: linear-gradient(180deg, #3a2c69 0%, #2a1f4c 100%);
}
.o8-pill:focus-visible {
  outline: 2.5px solid var(--o8-brand-300, #b9a0ff);
  outline-offset: 3px;
}
.o8-pill:disabled {
  color: #efe7ff66;
  cursor: default;
}
.o8-pill:disabled .o8-well {
  opacity: 0.4;
}
.o8-pill.main {
  border-color: #b9a0ff;
  background: linear-gradient(180deg, #46337f 0%, #30235a 100%);
}
.o8-pill.main:hover:not(:disabled) {
  background: linear-gradient(180deg, #54409a 0%, #3a2b6c 100%);
}
.o8-pill.quiet {
  background: none;
}
.o8-pill.small {
  min-height: 2.1em;
  padding: 0 0.95em;
  font-size: 0.9em;
}
.o8-pill.big {
  min-height: 2.9em;
  padding: 0 1.6em;
  font-size: 1.25em;
}
.o8-pill.wide {
  width: 100%;
}
.o8-well {
  flex: none;
  display: grid;
  place-items: center;
  width: 2.1em;
  height: 2.1em;
  border: 1px solid #5a4c8c;
  border-radius: 50%;
  background: radial-gradient(circle at 50% 40%, #3d2a6e 0%, #1a1331 80%);
}
.o8-well svg {
  width: 1.25em;
  height: 1.25em;
}
.o8-well path {
  fill: none;
  stroke: #d9ccf5;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}
/* Keyboard and gamepad focus: a lavender ring, set off from what it surrounds (row G2). */
:focus-visible {
  outline: 2.5px solid var(--o8-brand-300);
  outline-offset: 3px;
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
  background: var(--o8-space);
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
  outline: 2.5px solid var(--o8-brand-300);
  outline-offset: 3px;
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
