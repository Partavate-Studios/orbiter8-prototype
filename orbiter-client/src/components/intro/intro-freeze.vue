<template>
  <!-- Body storage, between signing and waking (Koda, 2026-11-20): out of the white, the pod in the middle of a
       cold room with wires running to it, you under its window from the chest up. The vents puff, the glass
       frosts from blue to white, the readout falls to −196 °C; then it's done and the screen goes black.
       The room is libs/intro-pod.js; the glass, the readouts and the smoke are live here. A click hurries it. -->
  <section class="intro-freeze" :class="{ reduced }" aria-label="Body storage" @click="hurry">
    <svg class="room" :viewBox="POD_VIEWBOX.join(' ')" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <radialGradient id="freeze-puff">
          <stop offset="0" stop-color="#eef6ff" stop-opacity="0.9" />
          <stop offset="0.5" stop-color="#d8e8ff" stop-opacity="0.45" />
          <stop offset="1" stop-color="#d8e8ff" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="freeze-rime" cx="50%" cy="50%" r="70%">
          <stop offset="0.35" stop-color="#f4f8ff" stop-opacity="0" />
          <stop offset="1" stop-color="#f4f8ff" stop-opacity="0.95" />
        </radialGradient>
        <pattern id="freeze-crystals" width="0.34" height="0.3" patternUnits="userSpaceOnUse">
          <path
            d="M0.05 0.05 l0.1 0.1 M0.15 0.05 l-0.1 0.1 M0.1 0.02 v0.16 M0.22 0.16 l0.07 0.07 M0.29 0.16 l-0.07 0.07"
            stroke="#ffffff"
            stroke-width="0.012"
          />
        </pattern>
      </defs>
      <!-- eslint-disable-next-line vue/no-v-html (our own drawing, libs/intro-pod.js) -->
      <g v-html="room"></g>

      <!-- the glass over you: mid-dark blue, frosting from its edges, then white -->
      <g :transform="lidMatrix">
        <g :transform="`translate(${W.u} ${W.v})`">
          <rect :width="W.w" :height="W.h" :rx="W.r" fill="#1f3f8f" opacity="0.78" />
          <path
            :d="`M${W.w * 0.15} ${W.h} L${W.w * 0.45} 0 L${W.w * 0.55} 0 L${W.w * 0.25} ${W.h} Z`"
            fill="#ffffff"
            opacity="0.12"
          />
          <rect class="rime" :width="W.w" :height="W.h" :rx="W.r" fill="url(#freeze-rime)" />
          <rect class="frost" :width="W.w" :height="W.h" :rx="W.r" fill="#eef4ff" />
          <rect class="frost crystals" :width="W.w" :height="W.h" :rx="W.r" fill="url(#freeze-crystals)" />
          <rect :width="W.w" :height="W.h" :rx="W.r" fill="none" stroke="#f4f2fa" stroke-width="0.03" />
        </g>
      </g>

      <!-- the vitals on the back wall -->
      <g :transform="vitalsMatrix" font-family="ui-monospace, monospace">
        <g :transform="`translate(${V.u} ${V.v})`">
          <text x="0.18" y="0.3" font-size="0.15" fill="#8fb8e8">CRYO-STORAGE · BAY 14</text>
          <text :x="V.w - 0.18" y="0.3" font-size="0.15" text-anchor="end" :fill="stored ? '#ffffff' : '#9fd4ff'">
            {{ status }}
          </text>
          <text x="0.18" y="0.56" font-size="0.13" fill="#5f7fb0">SUBJECT · {{ subject }}</text>
          <text x="0.18" y="1.12" font-size="0.46" font-weight="700" fill="#e6f2ff">{{ tempText }}</text>
          <path
            class="ecg"
            :class="{ flat: stored }"
            :style="{ animationDuration: beat + 's' }"
            :d="stored ? `M0.18 1.5 H${V.w - 0.18}` : ECG"
            pathLength="100"
            fill="none"
            stroke="#5fb8ff"
            stroke-width="0.035"
            stroke-linejoin="round"
          />
          <rect x="0.18" y="1.7" :width="(V.w - 0.36) * progress" height="0.06" rx="0.03" fill="#9fd4ff" />
          <rect
            x="0.18"
            y="1.7"
            :width="V.w - 0.36"
            height="0.06"
            rx="0.03"
            fill="none"
            stroke="#2c3566"
            stroke-width="0.015"
          />
        </g>
      </g>

      <!-- the cart's monitor -->
      <g :transform="cartMatrix">
        <g :transform="`translate(${CS.u} ${CS.v})`">
          <path
            class="ecg"
            :class="{ flat: stored }"
            :style="{ animationDuration: beat + 's' }"
            :d="stored ? `M0.04 0.3 H${CS.w - 0.04}` : CART_ECG"
            pathLength="100"
            fill="none"
            stroke="#5fd2a0"
            stroke-width="0.025"
          />
        </g>
      </g>

      <!-- the cold settling round the plinth as it freezes, and the vents' smoke -->
      <ellipse
        :cx="FOG[0]"
        :cy="FOG[1]"
        rx="330"
        ry="150"
        fill="url(#freeze-puff)"
        :opacity="Math.min(0.85, progress * 1.1) * (stored ? 0.8 : 1)"
      />
      <circle
        v-for="puff in puffs"
        :key="puff.id"
        class="puff"
        :cx="puff.x"
        :cy="puff.y"
        :r="puff.r"
        fill="url(#freeze-puff)"
        :style="{ '--dx': puff.dx + 'px' }"
      />
    </svg>
    <p class="sr-only" aria-live="polite">Body storage, bay 14: {{ status.toLowerCase() }}.</p>
  </section>
</template>

<script>
import { iso, ws } from '@/libs/intro-world'
import { CART_SCREEN, POD, POD_ROOM, POD_VIEWBOX, POD_WINDOW, VENTS, VITALS, podSvg } from '@/libs/intro-pod'

const START = 36.6
const END = -196
/** The scene's beats (ms from its start). */
const COLD_AT = 1700
const STORED_AT = 8600
const DONE_AT = 10200

/** A heartbeat line across the vitals screen, in its units. */
function ecg(x0, x1, y, amp) {
  let d = `M${x0} ${y}`
  const step = (x1 - x0) / 5
  for (let i = 0; i < 5; i++) {
    const x = x0 + i * step
    d += ` H${(x + step * 0.4).toFixed(3)} l${(step * 0.05).toFixed(3)} ${(-amp * 0.3).toFixed(3)} l${(step * 0.05).toFixed(3)} ${(amp * 1.3).toFixed(3)} l${(step * 0.06).toFixed(3)} ${(-amp * 2).toFixed(3)} l${(step * 0.05).toFixed(3)} ${amp.toFixed(3)} H${(x + step).toFixed(3)}`
  }
  return d
}
let room = null

export default {
  name: 'IntroFreeze',
  props: {
    pilotName: { type: String, default: '' }
  },
  emits: ['done'],
  data() {
    return {
      POD_VIEWBOX,
      W: POD_WINDOW,
      V: VITALS,
      CS: CART_SCREEN,
      FOG: ws(5, 4.6, 0.3),
      ECG: ecg(0.18, VITALS.w - 0.18, 1.5, 0.14),
      CART_ECG: ecg(0.04, CART_SCREEN.w - 0.04, 0.32, 0.08),
      room: (room ??= podSvg()),
      lidMatrix: iso.matrix.z(POD.lid.x, POD.lid.y, POD.lid.z),
      vitalsMatrix: iso.matrix.y(0, 0, POD_ROOM.H),
      cartMatrix: iso.matrix.y(CART_SCREEN.x0, CART_SCREEN.y1, CART_SCREEN.zTop),
      reduced: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
      elapsed: 0,
      puffs: []
    }
  },
  computed: {
    /** 0 → 1 over the cold, eased: slow, then falling, then settling. */
    progress() {
      const t = Math.min(1, Math.max(0, (this.elapsed - COLD_AT) / (STORED_AT - COLD_AT)))
      return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2
    },
    tempText() {
      const t = START + (END - START) * this.progress
      return `${t.toFixed(1).replace('-', '−')} °C`
    },
    stored() {
      return this.elapsed >= STORED_AT
    },
    status() {
      if (this.stored) return 'STORED'
      return this.elapsed >= COLD_AT ? 'FREEZING' : 'SEALED'
    },
    /** The heart slows as the cold comes. */
    beat() {
      return 1 + this.progress * 2.4
    },
    subject() {
      return (this.pilotName || 'PILOT').toUpperCase()
    }
  },
  mounted() {
    const start = performance.now()
    const tick = (now) => {
      this.elapsed = now - start
      if (this.elapsed >= DONE_AT) return this.finish()
      this.raf = requestAnimationFrame(tick)
    }
    this.raf = requestAnimationFrame(tick)
    // the vents: puffs while it freezes, faster in the middle
    let id = 0
    const puff = () => {
      if (this.elapsed > STORED_AT - 400) return
      const [x, y, z] = VENTS[Math.floor(Math.random() * VENTS.length)]
      const [sx, sy] = ws(x, y, z)
      this.puffs = [
        ...this.puffs.slice(-24),
        { id: ++id, x: sx, y: sy, r: 60 + Math.random() * 40, dx: (Math.random() - 0.5) * 60 }
      ]
      this.puffTimer = setTimeout(puff, this.reduced ? 1400 : 160 + Math.random() * 240)
    }
    this.coldTimer = setTimeout(puff, COLD_AT + 200)
  },
  beforeUnmount() {
    cancelAnimationFrame(this.raf)
    clearTimeout(this.coldTimer)
    clearTimeout(this.puffTimer)
  },
  methods: {
    finish() {
      if (this.finished) return
      this.finished = true
      cancelAnimationFrame(this.raf)
      this.$emit('done')
    },
    /** A click skips ahead: to stored if it's still freezing, then out. */
    hurry() {
      if (this.elapsed < 1500) return
      this.finish()
    }
  }
}
</script>

<style scoped>
.intro-freeze {
  position: absolute;
  inset: 0;
  z-index: 15;
  overflow: hidden;
  background: #05061a;
  cursor: default;
}
.room {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  transform-origin: 50% 58%;
  animation: push 11s cubic-bezier(0.3, 0, 0.4, 1) forwards;
}
.reduced .room {
  animation: none;
}
@keyframes push {
  from {
    transform: scale(1);
  }
  to {
    transform: scale(1.12);
  }
}
/* the glass frosts: the rime creeps in from the edges, then it whitens over */
.rime {
  opacity: 0;
  animation: fade-in 3.2s ease-in 2.2s forwards;
}
.frost {
  opacity: 0;
  animation: fade-in 3.6s ease-in-out 4.4s forwards;
}
.crystals {
  animation-duration: 2.4s;
  animation-delay: 6.2s;
}
@keyframes fade-in {
  to {
    opacity: 1;
  }
}
.ecg {
  stroke-dasharray: 55 45;
  animation: sweep 1s linear infinite;
}
.ecg.flat {
  stroke-dasharray: none;
  animation: none;
  opacity: 0.6;
}
@keyframes sweep {
  from {
    stroke-dashoffset: 100;
  }
  to {
    stroke-dashoffset: 0;
  }
}
.puff {
  transform-box: fill-box;
  transform-origin: center;
  opacity: 0;
  animation: puff 2.6s ease-out forwards;
}
@keyframes puff {
  0% {
    opacity: 0;
    transform: translate(0, 0) scale(0.3);
  }
  15% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate(var(--dx), -190px) scale(2.8);
  }
}
.reduced .puff {
  animation-duration: 3s;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
</style>

<style>
/* (the drawing comes in through v-html, out of the scoped styles' reach) */
.intro-freeze .pod-blink {
  animation: pod-blink 1.6s steps(2, jump-none) infinite;
}
.intro-freeze .pod-blink.b1 {
  animation-delay: 0.4s;
}
.intro-freeze .pod-blink.b2 {
  animation-delay: 0.8s;
  animation-duration: 2.2s;
}
.intro-freeze .pod-blink.b3 {
  animation-delay: 1.2s;
  animation-duration: 1.1s;
}
@keyframes pod-blink {
  50% {
    opacity: 0.15;
  }
}
@media (prefers-reduced-motion: reduce) {
  .intro-freeze .pod-blink {
    animation: none;
  }
}
</style>
