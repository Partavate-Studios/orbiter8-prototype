<template>
  <!-- Waking: out of the white, Earth and your ship already in orbit (white like every ship, marked yellow
       as yours), then Minerva's first message sliding up like every menu: what's expected of you. -->
  <section class="intro-wake" aria-labelledby="wake-say">
    <div class="space" aria-hidden="true">
      <svg class="earth" viewBox="-260 -260 520 520">
        <defs>
          <radialGradient id="wake-light" cx="35%" cy="30%" r="75%">
            <stop offset="0%" stop-color="#a8e6ff" />
            <stop offset="50%" stop-color="#2f7fd9" />
            <stop offset="100%" stop-color="#1a2a6e" />
          </radialGradient>
          <radialGradient id="wake-shade" cx="70%" cy="70%" r="80%">
            <stop offset="40%" stop-color="#000" stop-opacity="0" />
            <stop offset="100%" stop-color="#000" stop-opacity="0.65" />
          </radialGradient>
          <clipPath id="wake-disc"><circle r="180" /></clipPath>
        </defs>
        <circle r="236" fill="none" stroke="#7fd4ff" stroke-width="44" opacity="0.06" />
        <circle r="180" fill="url(#wake-light)" stroke="#a8e6ff" stroke-width="2" stroke-opacity="0.7" />
        <g clip-path="url(#wake-disc)">
          <g fill="#5fd27e" fill-opacity="0.42" transform="scale(18)">
            <rect x="-2" y="-8" width="12" height="2" rx="1" />
            <rect x="0" y="-6" width="14" height="2" rx="1" />
            <rect x="-9" y="-7" width="6" height="2" rx="1" />
            <rect x="-10" y="-4" width="10" height="2" rx="1" />
            <rect x="-1" y="-2" width="12" height="2" rx="1" />
            <rect x="-12" y="1" width="12" height="2" rx="1" />
            <rect x="-10" y="3" width="14" height="2" rx="1" />
            <rect x="-4" y="4" width="14" height="2" rx="1" />
            <rect x="0" y="6" width="6" height="2" rx="1" />
            <rect x="-10" y="9" width="12" height="2" rx="1" />
          </g>
        </g>
        <circle r="180" fill="url(#wake-shade)" />
      </svg>
      <div class="ship">
        <svg viewBox="-12 -12 24 24">
          <g transform="rotate(70)"><ship /></g>
        </svg>
        <span class="ship-name">{{ shipName }}</span>
      </div>
    </div>
    <div class="message">
      <minerva-face class="face" state="talking" :size="faceSize" />
      <div class="words">
        <p id="wake-say">{{ text }}</p>
        <button ref="ok" type="button" class="o8-button primary" @click="$emit('done')">Understood</button>
      </div>
    </div>
  </section>
</template>

<script>
import MinervaFace from '@/components/minerva/minerva-face.vue'
import Ship from '@/components/star-map/sprites/ship.svg.vue'
import { SAY } from '@/libs/intro'

export default {
  name: 'IntroWake',
  components: { MinervaFace, Ship },
  props: {
    shipName: { type: String, default: '' },
    corp: { type: Object, default: null },
    debt: { type: Number, default: 45 }
  },
  emits: ['done'],
  data() {
    return { faceSize: window.innerWidth < 760 ? 130 : 220 }
  },
  computed: {
    text() {
      return SAY.wake(this.shipName || 'your ship', this.debt)
    }
  },
  mounted() {
    setTimeout(() => this.$refs.ok?.focus({ preventScroll: true }), 1600)
  }
}
</script>

<style scoped>
.intro-wake {
  position: absolute;
  inset: 0;
  z-index: 10;
  background:
    radial-gradient(1px 1px at 12% 20%, #e6dcf5aa, #0000), radial-gradient(1px 1px at 72% 12%, #e6dcf5aa, #0000),
    radial-gradient(1.5px 1.5px at 40% 70%, #e6dcf5aa, #0000), radial-gradient(1px 1px at 88% 60%, #e6dcf5aa, #0000),
    radial-gradient(1px 1px at 55% 35%, #e6dcf588, #0000), radial-gradient(1px 1px at 25% 85%, #e6dcf588, #0000),
    #130e24;
  overflow: hidden;
}
.earth {
  position: absolute;
  left: -14vmin;
  bottom: -30vmin;
  width: 95vmin;
  height: 95vmin;
  animation: drift 60s linear infinite alternate;
}
@keyframes drift {
  to {
    transform: translate(2vmin, -1vmin) rotate(4deg);
  }
}
.ship {
  position: absolute;
  left: 58%;
  top: 22%;
  display: grid;
  justify-items: center;
  gap: 0.5em;
  animation: fade 1.5s ease-out both;
}
.ship svg {
  width: 6em;
  height: 6em;
  border: 2px solid #ccff00;
  border-radius: 50%;
  padding: 0.6em;
  overflow: visible;
}
.ship-name {
  color: #ebff99;
  font-weight: 600;
}
.message {
  position: absolute;
  right: 4%;
  bottom: 5%;
  width: min(52em, 92%);
  box-sizing: border-box;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1.4em;
  align-items: center;
  padding: 1.4em 1.6em;
  background: #120f1cf2;
  border: 1.5px solid #3f3566;
  border-radius: 18px;
  animation: rise 0.5s 1.4s cubic-bezier(0.3, 0, 0.2, 1) both;
}
.words p {
  margin: 0 0 1.1em;
  font-size: 1.15em;
  line-height: 1.45;
}
.words .o8-button {
  font-size: 1.2em;
  padding: 0.5em 1.6em;
}
@keyframes fade {
  from {
    opacity: 0;
  }
}
@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(3em);
  }
}
@media (max-width: 760px) {
  .ship {
    left: 62%;
    top: 14%;
  }
  .message {
    right: 0;
    bottom: 0;
    width: 100%;
    grid-template-columns: 1fr;
    justify-items: center;
    border-radius: 18px 18px 0 0;
  }
  .words p {
    font-size: 1em;
  }
  .words .o8-button {
    width: 100%;
  }
}
@media (prefers-reduced-motion: reduce) {
  .earth {
    animation: none;
  }
}
</style>
