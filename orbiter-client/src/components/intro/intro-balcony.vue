<template>
  <!-- Through the glass: the view straight on, filling the screen (libs/intro-vista.js; the camera pushed
       through the glass door to get here, intro-screen.vue). On the balcony you stand at the rail, seen from
       behind, the vape in your hand and Minerva's terminal on the rail: click them, there's no menu. Through
       the window it's only the view. The glass's frame at the edges takes you back in, as do Esc and B. -->
  <section
    class="intro-balcony"
    :class="mode"
    :aria-label="mode === 'balcony' ? 'Balcony' : 'Window'"
    @click="mode === 'window' && $emit('inside')"
  >
    <img v-if="vistaUrl" class="view" :src="vistaUrl" alt="" draggable="false" />
    <div v-else class="view placeholder"></div>

    <template v-if="mode === 'balcony'">
      <!-- you, from behind, leaning on the rail -->
      <svg class="you" viewBox="-130 -330 320 330" aria-hidden="true">
        <path
          d="M-120 0 L-110 -150 Q-100 -210 -40 -224 L-26 -250 Q-30 -300 0 -312 Q30 -300 26 -250 L40 -224 Q100 -210 110 -150 L120 0z"
          class="body"
        />
        <circle cx="0" cy="-290" r="40" class="body" />
        <path d="M110 -150 L170 -205 L150 -232" fill="none" stroke="#030306" stroke-width="22" stroke-linecap="round" />
        <path
          d="M110 -150 L170 -205 L150 -232"
          fill="none"
          stroke="#ccff00"
          stroke-width="2"
          stroke-linecap="round"
          opacity="0.6"
        />
        <circle cx="150" cy="-236" r="5" fill="#e6dcf5" :class="{ lit: hitting }" />
      </svg>
      <span v-if="puffs" :key="puffs" class="vapor" aria-hidden="true"><i></i><i></i><i></i></span>
      <!-- the rail and its posts -->
      <div class="rail" aria-hidden="true"></div>
      <!-- the vape in your hand, and the terminal on the rail: things to click -->
      <button ref="vape" type="button" class="thing vape" aria-label="Vape" @click.stop="hit">
        <span class="tag">Vape</span>
      </button>
      <button type="button" class="thing terminal" aria-label="Terminal on the rail" @click.stop="$emit('terminal')">
        <span class="screen"><minerva-face :state="hitAgo ? 'skeptical' : 'idle'" size="70%" /></span>
        <span class="tag">Terminal</span>
      </button>
    </template>

    <!-- the glass's frame, just passed: back in -->
    <button type="button" class="frame left" aria-label="Back inside" @click.stop="$emit('inside')">
      <span aria-hidden="true">‹</span>
    </button>
    <div class="frame right" aria-hidden="true"></div>
    <p class="hint-line">
      {{
        mode === 'balcony'
          ? 'The vape, the terminal on the rail · the glass behind you, Esc or B to go back in'
          : 'Click anywhere, Esc or B to step back'
      }}
    </p>
  </section>
</template>

<script>
import MinervaFace from '@/components/minerva/minerva-face.vue'

export default {
  name: 'IntroBalcony',
  components: { MinervaFace },
  props: {
    mode: { type: String, default: 'balcony' },
    vistaUrl: { type: String, default: '' },
    health: { type: Number, required: true },
    hits: { type: Number, required: true }
  },
  emits: ['hit', 'terminal', 'inside'],
  data() {
    return { hitting: false, hitAgo: false, puffs: 0 }
  },
  mounted() {
    if (this.mode === 'balcony') setTimeout(() => this.$refs.vape?.focus({ preventScroll: true }), 500)
  },
  beforeUnmount() {
    clearTimeout(this.hitTimer)
    clearTimeout(this.agoTimer)
  },
  methods: {
    hit() {
      if (this.hitting) return
      this.o8audio?.playEffect('click')
      this.hitting = true
      this.puffs++
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
  background: #05041a;
  z-index: 3;
}
.intro-balcony.window {
  cursor: pointer;
}
.view {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 50% 60%;
  transform: scale(1.06);
  animation: settle 1.2s cubic-bezier(0.2, 0, 0.2, 1) forwards;
}
.placeholder {
  background: linear-gradient(#05041a, #2c2290);
}
@keyframes settle {
  to {
    transform: none;
  }
}
/* the window: its frame around the view */
.window::after {
  content: '';
  position: absolute;
  inset: 0;
  border: clamp(18px, 5vw, 60px) solid #141120;
  box-shadow: inset 0 0 0 3px #2a2540;
  pointer-events: none;
}

/* you, at the rail */
.you {
  position: absolute;
  left: 50%;
  bottom: 0;
  height: min(46vh, 70vw);
  transform: translateX(-62%);
}
.body {
  fill: #030306;
  stroke: #ccff00;
  stroke-width: 2.5;
  stroke-linejoin: round;
}
.you .lit {
  fill: #ffffff;
}
.vapor {
  position: absolute;
  left: 50%;
  bottom: min(30vh, 46vw);
}
.vapor i {
  position: absolute;
  width: 90px;
  height: 64px;
  margin: -32px 0 0 -45px;
  border-radius: 50%;
  background: radial-gradient(closest-side, #d8d4e488, #d8d4e400);
  opacity: 0;
  animation: puff 2.6s ease-out forwards;
}
.vapor i:nth-child(2) {
  animation-delay: 0.3s;
}
.vapor i:nth-child(3) {
  animation-delay: 0.6s;
}
@keyframes puff {
  0% {
    opacity: 0.9;
    transform: translate(0, 0) scale(0.5);
  }
  100% {
    opacity: 0;
    transform: translate(-30px, -220px) scale(2.8);
  }
}
.rail {
  position: absolute;
  inset: auto 0 0;
  height: 21%;
  border-top: 14px solid #030306;
  box-shadow: 0 -2px 0 #6a6188;
  background: repeating-linear-gradient(90deg, #030306 0 8px, #0000 8px 44px);
  pointer-events: none;
}

/* the things you can click */
.thing {
  position: absolute;
  padding: 0;
  border: 2px solid transparent;
  border-radius: 14px;
  background: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.thing:hover,
.thing:focus-visible {
  border-color: #b9a0ff;
  outline: none;
}
.thing .tag {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 8px);
  transform: translateX(-50%);
  padding: 3px 13px;
  border-radius: 999px;
  background: #c3b3da;
  color: #1c0838;
  font:
    500 15px 'Ubuntu',
    system-ui,
    sans-serif;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
}
.thing:hover .tag,
.thing:focus-visible .tag {
  opacity: 1;
}
.vape {
  left: calc(50% - 30px);
  bottom: calc(min(46vh, 70vw) * 0.55);
  width: max(60px, 9vw);
  height: max(60px, 9vw);
}
.terminal {
  right: 14%;
  bottom: 21%;
  width: clamp(110px, 12vw, 170px);
  aspect-ratio: 1.6;
  background: #0c0a14;
  border: 2px solid #6a6188;
  border-radius: 10px;
}
.terminal .screen {
  position: absolute;
  inset: 8px;
  display: grid;
  place-items: center;
  border-radius: 6px;
  background: #0c0a14;
}

/* the glass's frame, at the edges */
.frame {
  position: absolute;
  top: 0;
  bottom: 0;
  width: clamp(28px, 4vw, 56px);
  background: #141120;
  border: 0;
  padding: 0;
  color: #9088aa;
  font-size: 28px;
}
.frame.left {
  left: 0;
  cursor: pointer;
  box-shadow: inset -3px 0 0 #2a2540;
}
.frame.left:hover,
.frame.left:focus-visible {
  color: #f1eefa;
  box-shadow: inset -3px 0 0 #b9a0ff;
  outline: none;
}
.frame.right {
  right: 0;
  box-shadow: inset 3px 0 0 #2a2540;
}
.window .frame {
  display: none;
}
.hint-line {
  position: absolute;
  inset: auto 0 0;
  margin: 0;
  padding: 0.6em 1em 0.75em;
  text-align: center;
  background: linear-gradient(#03030600, #030306cc);
  color: #bdb5d4;
  font-size: 14px;
  pointer-events: none;
}
</style>
