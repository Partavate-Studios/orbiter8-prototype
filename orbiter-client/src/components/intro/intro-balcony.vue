<template>
  <!-- The balcony: the city nearer, the railing in front with a Minerva terminal on it, the vape in your
       hand. Each hit costs a health point, and Minerva notices. -->
  <section class="intro-balcony" aria-label="Balcony">
    <!-- eslint-disable vue/no-v-html -- the game's own SVG art (libs/intro-art.js), not user content -->
    <svg
      class="view"
      viewBox="0 0 1600 1000"
      :preserveAspectRatio="portrait ? 'xMaxYMax slice' : 'xMidYMax slice'"
      aria-hidden="true"
      v-html="art"
    ></svg>
    <!-- eslint-enable vue/no-v-html -->
    <div class="terminal-face" :style="screenStyle">
      <minerva-face :state="hitAgo ? 'skeptical' : 'idle'" size="70%" />
      <span v-if="hitAgo" class="health">HEALTH −1</span>
    </div>
    <div class="hand" :class="{ hit: hitting }" aria-hidden="true">
      <!-- eslint-disable-next-line vue/no-v-html -- the game's own SVG art (libs/intro-art.js), not user content -->
      <svg width="1" height="1" overflow="visible" v-html="handSvg"></svg>
      <span class="vapor v1"></span><span class="vapor v2"></span><span class="vapor v3"></span>
    </div>
    <div class="controls">
      <button ref="hit" type="button" class="o8-button" @click="hit">Take a hit</button>
      <button type="button" class="o8-button" @click="$emit('terminal')">Terminal</button>
      <button type="button" class="o8-button quiet" @click="$emit('inside')">Inside ›</button>
    </div>
  </section>
</template>

<script>
import MinervaFace from '@/components/minerva/minerva-face.vue'
import { BALCONY_SCREEN, VAPE_ART, artDefs, balconyArt, handArt } from '@/libs/intro-art'

export default {
  name: 'IntroBalcony',
  components: { MinervaFace },
  props: {
    health: { type: Number, required: true },
    hits: { type: Number, required: true }
  },
  emits: ['hit', 'terminal', 'inside'],
  data() {
    return {
      art: artDefs('bal-') + balconyArt('bal-'),
      handSvg: `<g transform="scale(1.1)">${handArt('hold', VAPE_ART)}</g>`,
      hitting: false,
      hitAgo: false,
      vw: window.innerWidth,
      vh: window.innerHeight
    }
  },
  computed: {
    /** The terminal's screen, placed over the art (which covers the screen, anchored to the bottom). */
    /** Phones see the right of the view, where the terminal stands on the railing. */
    portrait() {
      return this.vw / this.vh < 0.9
    },
    screenStyle() {
      const k = Math.max(this.vw / 1600, this.vh / 1000)
      const x0 = this.portrait ? this.vw - 1600 * k : (this.vw - 1600 * k) / 2
      const y0 = this.vh - 1000 * k
      const s = BALCONY_SCREEN
      return { left: `${x0 + s.x * k}px`, top: `${y0 + s.y * k}px`, width: `${s.w * k}px`, height: `${s.h * k}px` }
    }
  },
  mounted() {
    this.onResize = () => {
      this.vw = window.innerWidth
      this.vh = window.innerHeight
    }
    window.addEventListener('resize', this.onResize)
    setTimeout(() => this.$refs.hit?.focus({ preventScroll: true }), 500)
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.onResize)
    clearTimeout(this.hitTimer)
    clearTimeout(this.agoTimer)
  },
  methods: {
    hit() {
      if (this.hitting) return
      this.hitting = true
      this.$emit('hit')
      this.hitTimer = setTimeout(() => (this.hitting = false), 2200)
      clearTimeout(this.agoTimer)
      this.hitAgo = true
      this.agoTimer = setTimeout(() => (this.hitAgo = false), 9000)
    }
  }
}
</script>

<style scoped>
.intro-balcony {
  position: absolute;
  inset: 0;
  overflow: hidden;
  opacity: 0;
  transform: scale(0.82);
  transform-origin: 50% 70%;
  transition:
    opacity 0.8s,
    transform 0.8s cubic-bezier(0.5, 0, 0.2, 1);
}
.intro-balcony.near {
  opacity: 1;
  transform: none;
}
.view {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.terminal-face {
  position: absolute;
  display: grid;
  place-items: center;
}
.health {
  position: absolute;
  bottom: 6%;
  font:
    700 0.75em 'Ubuntu Mono',
    monospace;
  color: #ff6fb0;
}
.hand {
  position: absolute;
  left: 50%;
  bottom: 28%;
  transition: transform 0.6s ease-in-out;
}
.hand.hit {
  transform: translate(-30px, -60px);
}
.vapor {
  position: absolute;
  left: 40px;
  top: -80px;
  width: 140px;
  height: 80px;
  border-radius: 50%;
  background: radial-gradient(closest-side, #d8d4e466, #d8d4e400);
  opacity: 0;
  pointer-events: none;
}
.hand.hit .vapor {
  animation: vapor 2.2s ease-out forwards;
}
.hand.hit .v2 {
  animation-delay: 0.3s;
}
.hand.hit .v3 {
  animation-delay: 0.6s;
}
@keyframes vapor {
  0% {
    opacity: 0;
    transform: translate(0, 0) scale(0.4);
  }
  25% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate(120px, -160px) scale(1.8);
  }
}
.controls {
  position: absolute;
  left: 1.5em;
  right: 1.5em;
  bottom: 1.5em;
  display: flex;
  gap: 1em;
  flex-wrap: wrap;
}
.controls .o8-button {
  font-size: 1.15em;
  min-width: 8em;
  padding: 0.6em 1em;
}
@media (max-width: 760px) {
  .hand {
    left: 62%;
    bottom: 26%;
  }
  .hand svg {
    transform: scale(0.65);
  }
  .controls .o8-button {
    flex: 1 1 40%;
    min-width: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .intro-balcony {
    transform: none;
  }
}
</style>
