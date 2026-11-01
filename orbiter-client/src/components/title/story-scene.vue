<template>
  <!-- The story, from the title's Story button: Minerva tells the first three panels of the Multiverse
       Portals storyboard, in the words of the website's backstory (docs/backstory.md). Each panel's
       scene is a few layers moved by CSS animations, like the title scene; positions are in scene
       units (--u): 640 x 640 of them fit any screen, centered. -->
  <div
    ref="dialog"
    class="story"
    role="dialog"
    aria-modal="true"
    aria-label="The story of Orbiter 8"
    tabindex="-1"
    @keydown="onKey"
  >
    <svg class="stars" aria-hidden="true">
      <circle
        v-for="star in stars"
        :key="star.id"
        :cx="star.x + '%'"
        :cy="star.y + '%'"
        :r="star.r"
        :opacity="star.o"
      />
    </svg>

    <div :key="panel" class="scene" :class="'panel-' + panel" aria-hidden="true">
      <!-- The solar system: the sun, and planets on their rings. -->
      <div class="anchor system">
        <svg viewBox="-320 -320 640 640">
          <circle v-for="planet in planets" :key="'ring' + planet.r" :r="planet.r" class="ring" />
          <circle r="60" fill="url(#glowingGradient)" />
          <circle r="22" fill="url(#starGradient)" stroke="#ffffff" stroke-width="0.6" />
          <g
            v-for="planet in planets"
            :key="'planet' + planet.r"
            class="planet"
            :style="{ animationDuration: planet.lap + 's', animationDelay: -planet.lap * planet.at + 's' }"
          >
            <circle :cx="planet.r" cy="0" :r="planet.size" fill="url(#planetGradient)" />
          </g>
        </svg>
      </div>

      <!-- The heliopause, the edge of the sun's reach. -->
      <div v-if="panel > 0" class="anchor edge">
        <svg viewBox="-320 -320 640 640">
          <circle r="290" class="heliopause" />
        </svg>
      </div>

      <!-- Panel 2: a ship circling just inside the edge. -->
      <div v-if="panel === 1" class="anchor edge circling">
        <svg viewBox="-320 -320 640 640">
          <g transform="rotate(200) translate(262 0) rotate(180) scale(2.2)">
            <fleet-ship type="orbiter8" engines flame="engineTrailGradient" />
          </g>
        </svg>
      </div>

      <!-- Panel 3: a starship breaks out, past the edge, for the stars. -->
      <div v-if="panel === 2" class="anchor breakout">
        <svg viewBox="-30 -30 60 60">
          <g transform="rotate(55) scale(2.4)">
            <fleet-ship type="orbiter8" engines flame="engineTrailGradient" />
          </g>
        </svg>
      </div>
    </div>

    <section class="narration" aria-live="polite">
      <svg class="emblem" viewBox="-110 -70 220 130" aria-hidden="true"><minerva-emblem color="#ffffffcc" /></svg>
      <p :key="panel" class="words">
        <span
          v-for="(line, index) in panels[panel].lines"
          :key="index"
          :style="{ animationDelay: 0.3 + index * 0.9 + 's' }"
          >{{ line }}</span
        >
        <span v-if="panels[panel].signOff" class="sign-off" :style="{ animationDelay: '4.5s' }">{{
          panels[panel].signOff
        }}</span>
      </p>
    </section>

    <nav class="controls">
      <button type="button" class="o8-button quiet" :disabled="panel === 0" @click="go(-1)">Back</button>
      <ol class="dots" aria-label="Panels">
        <li v-for="(item, index) in panels" :key="index" :class="{ current: index === panel }">
          <span class="dot"></span>
        </li>
      </ol>
      <button ref="next" type="button" class="o8-button primary" @click="go(1)">
        {{ panel === panels.length - 1 ? 'Done' : 'Next' }}
      </button>
    </nav>
    <button type="button" class="close o8-button quiet small" aria-label="Close the story" @click="close">×</button>
  </div>
</template>

<script>
import FleetShip from '@/components/assets/fleet-ship.svg'
import MinervaEmblem from '@/components/assets/minerva-emblem.svg'

// The words are the website's backstory (docs/backstory.md) and the storyboard's own lines.
const PANELS = [
  { lines: ['It is the year 2140.', 'Civilization has spread to encompass', 'the whole of the solar system.'] },
  { lines: ['Still bound to our sun,', "we've continued our longing", 'for the stars.'] },
  { lines: ['That was until today!', 'The first starships', 'have arrived.'], signOff: 'Liberta Galactica!' }
]
// Eight planets: ring radius, size, seconds per lap, and where on its ring it starts (0 to 1).
const PLANETS = [
  [52, 3, 9, 0.1],
  [74, 4.5, 14, 0.55],
  [98, 5, 20, 0.3],
  [124, 4, 27, 0.8],
  [162, 11, 40, 0.15],
  [204, 9, 55, 0.62],
  [240, 7, 70, 0.4],
  [272, 6.5, 90, 0.9]
].map(([r, size, lap, at]) => ({ r, size, lap, at }))
const STAR_COUNT = 140

export default {
  name: 'StoryScene',
  components: { FleetShip, MinervaEmblem },
  emits: ['close'],
  data() {
    return { panel: 0, panels: PANELS, planets: PLANETS }
  },
  computed: {
    /** Background stars, seeded so they're the same each time. */
    stars() {
      let seed = 11
      const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
      return Array.from({ length: STAR_COUNT }, (_, id) => ({
        id,
        x: random() * 100,
        y: random() * 100,
        r: random() < 0.1 ? 1.3 : 0.5 + random() * 0.6,
        o: 0.3 + random() * 0.6
      }))
    }
  },
  mounted() {
    this.$refs.next.focus()
  },
  methods: {
    go(step) {
      this.o8audio.playEffect('click')
      const next = this.panel + step
      if (next >= PANELS.length) return this.close()
      this.panel = Math.max(0, next)
    },
    close() {
      this.$emit('close')
    },
    onKey(event) {
      if (event.key === 'Escape') this.close()
      else if (event.key === 'ArrowRight') this.go(1)
      else if (event.key === 'ArrowLeft' && this.panel > 0) this.go(-1)
    }
  }
}
</script>

<style scoped>
.story {
  /* One scene unit: 640 x 640 units always fit the screen (the breakout leaves past the edges). */
  --u: min(100vw / 640, 100vh / 640);
  position: fixed;
  inset: 0;
  z-index: 50;
  overflow: hidden;
  background: radial-gradient(ellipse at center, #2b0c50 0%, #160631 70%);
  color: #e6dcf5;
  outline: none;
}
.stars {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  fill: #e6dcf5;
}
.scene {
  position: absolute;
  inset: 0;
}
.anchor {
  position: absolute;
  left: calc(50% + var(--u) * var(--x, 0));
  top: calc(50% + var(--u) * var(--y, 30));
  width: calc(var(--u) * var(--size));
  height: calc(var(--u) * var(--size));
  margin: calc(var(--u) * var(--size) / -2) 0 0 calc(var(--u) * var(--size) / -2);
}
.anchor svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}
.ring {
  fill: none;
  stroke: #c3b3da;
  stroke-opacity: 0.18;
  stroke-width: 0.8;
}
.planet {
  animation: turn linear infinite;
}

/* Panel 1: the solar system fades in as the view pulls back. */
.system {
  --size: 560;
}
.panel-0 .system {
  animation: arrive 3.5s ease-out both;
}
/* Panel 2: pulling back further, to the sun's edge. */
.panel-1 .system,
.panel-2 .system {
  transform: scale(0.32);
}
.panel-1 .system {
  animation: pull-back 3s ease-in-out both;
}
.edge {
  --size: 560;
}
.heliopause {
  fill: none;
  stroke: #e6dcf5;
  stroke-width: 1.2;
  stroke-dasharray: 3 7;
  stroke-opacity: 0.6;
}
.panel-1 .edge:not(.circling) {
  animation: fade-in 2s 1.5s ease-out both;
}
.circling {
  animation:
    turn 80s linear infinite,
    fade-in 1.5s 2.5s ease-out both;
}
/* Panel 3: the ship crosses the edge and goes, the edge flashing as it passes. */
.panel-2 .edge {
  animation: flash 1.2s 2.4s ease-out both;
}
.breakout {
  --size: 60;
  animation: breakout 5s cubic-bezier(0.5, 0, 0.9, 0.6) both;
}

.narration {
  position: absolute;
  top: max(16px, 4vh);
  left: 50%;
  transform: translateX(-50%);
  width: min(92vw, 40rem);
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.9rem 1.3rem;
  border: 1px solid #ffffff33;
  border-radius: 1.2rem;
  background: #00000040;
}
.emblem {
  flex: none;
  width: 4.5rem;
}
.words {
  margin: 0;
  display: grid;
  font-size: clamp(1.05rem, 2.4vw, 1.45rem);
  line-height: 1.35;
  text-align: left;
}
.words span {
  animation: fade-in 0.8s ease-out both;
}
.sign-off {
  margin-top: 0.4em;
  font-style: italic;
  color: #c3b3da;
}
.controls {
  position: absolute;
  bottom: max(20px, 5vh);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 1.2rem;
}
.controls .o8-button {
  min-width: 6.5em;
}
.dots {
  display: flex;
  gap: 0.6rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.dot {
  display: block;
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
  background: #c3b3da55;
}
.current .dot {
  background: #e6dcf5;
}
.close {
  position: absolute;
  top: max(12px, 2vh);
  right: 12px;
  font-size: 1.3rem;
  line-height: 1;
}

@keyframes turn {
  to {
    transform: rotate(360deg);
  }
}
@keyframes arrive {
  from {
    opacity: 0;
    transform: scale(2.4);
  }
}
@keyframes pull-back {
  from {
    transform: scale(1);
  }
}
@keyframes fade-in {
  from {
    opacity: 0;
  }
}
@keyframes flash {
  0% {
    filter: none;
  }
  25% {
    filter: drop-shadow(0 0 calc(var(--u) * 8) #ffffff) brightness(2.2);
  }
  100% {
    filter: none;
  }
}
/* From just inside the edge, lower left of the sun, out past the edge to the upper right. */
@keyframes breakout {
  from {
    transform: translate(calc(var(--u) * -120), calc(var(--u) * 140)) scale(0.7);
  }
  to {
    transform: translate(calc(var(--u) * 720), calc(var(--u) * -560)) scale(1.6);
  }
}
/* Phones: the lines flow as one paragraph, and the box clears the close button. */
@media (max-width: 640px) {
  .narration {
    top: 52px;
  }
  .words {
    display: block;
  }
  .words span::after {
    content: ' ';
  }
  .sign-off {
    display: block;
  }
}
@media (prefers-reduced-motion: reduce) {
  .story * {
    animation: none !important;
  }
}
</style>
