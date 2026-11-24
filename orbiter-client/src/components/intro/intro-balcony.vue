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
      <!-- the rail and its posts, beyond you: you stand on the balcony, on this side of it (Koda) -->
      <div class="rail" aria-hidden="true"></div>
      <!-- you, from behind, an elbow on the rail and the vape up in that hand: click it for a hit, and the hand
           goes to your mouth (behind your head, from here). The arm is drawn first, so the body covers its top. -->
      <div class="you-wrap">
        <svg class="you" viewBox="-130 -330 320 330" overflow="visible" aria-hidden="true">
          <g class="arm" :class="{ up: hitting }" transform="translate(95 -195)">
            <g class="upper">
              <line class="limb-edge" x2="71" />
              <line class="limb" x2="71" />
              <g class="fore">
                <line class="limb-edge" x2="80" />
                <line class="limb" x2="80" />
                <rect x="72" y="-5" width="36" height="10" rx="5" class="vape-pen" />
                <circle cx="76" r="3.5" class="vape-led" />
                <circle cx="80" r="13" class="body" />
              </g>
            </g>
          </g>
          <path
            d="M-120 0 L-110 -150 Q-100 -210 -40 -224 L-26 -250 Q-30 -300 0 -312 Q30 -300 26 -250 L40 -224 Q100 -210 110 -150 L120 0z"
            class="body"
          />
          <circle cx="0" cy="-290" r="40" class="body" />
        </svg>
        <span v-if="puffs" :key="puffs" class="vapor" aria-hidden="true"><i></i><i></i><i></i></span>
        <button ref="vape" type="button" class="thing vape" aria-label="Vape" @click.stop="hit">
          <span class="tag">Vape</span>
        </button>
      </div>
      <!-- the vape in your hand, and the terminal on the rail: things to click -->
      <button type="button" class="thing terminal" aria-label="Terminal on the rail" @click.stop="$emit('terminal')">
        <span class="screen"><minerva-face :state="hitAgo ? 'skeptical' : 'idle'" size="70%" /></span>
        <span class="tag">Terminal</span>
      </button>
    </template>

    <!-- the glass's frame, just passed (it takes you back in too) -->
    <div class="frame left" aria-hidden="true" @click.stop="$emit('inside')"><span>‹</span></div>
    <div class="frame right" aria-hidden="true"></div>
    <!-- back in: a pill like the card drawer's, at the bottom left of center, where you look for it (Koda) -->
    <button type="button" class="o8-pill back" @click.stop="$emit('inside')">
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path
          d="M14.5 5.5 L8 12 L14.5 18.5"
          fill="none"
          stroke="currentColor"
          stroke-width="2.6"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      {{ mode === 'balcony' ? 'Inside' : 'Step back' }}
    </button>
    <p class="hint-line">
      {{
        mode === 'balcony'
          ? 'The vape, the terminal on the rail · Inside, Esc or B to go back in'
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

/* you, at the rail: the figure, its vape and its vapor share one box, placed in the figure's units */
.you-wrap {
  position: absolute;
  left: 50%;
  bottom: 0;
  height: min(46vh, 70vw);
  aspect-ratio: 320 / 330;
  transform: translateX(-62%);
}
.you {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.arm .limb-edge {
  stroke: #ccff00;
  stroke-width: 35;
  stroke-linecap: round;
}
.arm .limb {
  stroke: #030306;
  stroke-width: 30;
  stroke-linecap: round;
}
.arm .upper,
.arm .fore {
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.arm .upper {
  transform: rotate(39deg);
}
.arm .fore {
  transform: translate(71px, 0) rotate(-114deg);
}
.arm.up .upper {
  transform: rotate(-39deg);
}
.arm.up .fore {
  transform: translate(71px, 0) rotate(-127deg);
}
.vape-pen {
  fill: #2a2440;
  stroke: #b9a0ff;
  stroke-width: 2;
}
.vape-led {
  fill: #e6dcf5;
  transition: fill 0.3s;
}
.arm.up .vape-led {
  fill: #ffffff;
}
.body {
  fill: #030306;
  stroke: #ccff00;
  stroke-width: 2.5;
  stroke-linejoin: round;
}
/* at your mouth: your head's front, from behind */
.vapor {
  position: absolute;
  left: 44%;
  top: 14%;
}
.vapor i {
  position: absolute;
  width: 90px;
  height: 64px;
  margin: -32px 0 0 -45px;
  border-radius: 50%;
  background: radial-gradient(closest-side, #d8d4e488, #d8d4e400);
  opacity: 0;
  animation: puff 2.6s ease-out 0.9s forwards;
}
/* (the exhale, once the hand is down from your mouth) */
.vapor i:nth-child(2) {
  animation-delay: 1.2s;
}
.vapor i:nth-child(3) {
  animation-delay: 1.5s;
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
/* the hand's place at rest, in the figure's box */
.vape {
  left: 94%;
  top: 31%;
  width: max(64px, 8vw);
  height: max(64px, 8vw);
  transform: translate(-50%, -50%);
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
/* narrow screens: your vape hand is at the right edge, so the terminal sits on the rail to your left */
@media (max-aspect-ratio: 4/5) {
  .terminal {
    right: auto;
    left: 9%;
  }
}
.terminal .screen {
  position: absolute;
  inset: 8px;
  display: grid;
  place-items: center;
  border-radius: 6px;
  background: #0c0a14;
  overflow: hidden;
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
.frame.left:hover {
  color: #f1eefa;
  box-shadow: inset -3px 0 0 #b9a0ff;
}
.frame span {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
/* back inside: at the bottom, left of center, over the rail */
.back {
  position: absolute;
  left: max(16px, calc(50% - min(46vh, 70vw) * 0.35 - 120px));
  bottom: calc(2.6em + 14px);
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding-left: 12px;
}
.window .back {
  bottom: calc(clamp(18px, 5vw, 60px) + 2.6em);
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
