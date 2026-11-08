<template>
  <!-- The story, from the title's Story button: docs/backstory.md told in eight panels, laid out like
       a graphic novel. Each panel is a framed scene drawn with the game's own art (the planets, the sun,
       the station, the ships, Minerva's owl), with the narration in caption boxes on its corners.
       Back and Next turn the pages; Title (and Escape) goes back to the title screen. Each panel's
       scene is a component under ./story/; the words are PANELS below, so they're easy to edit. -->
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
      <circle v-for="star in stars" :key="star.id" :cx="star.x + '%'" :cy="star.y + '%'" :r="star.r" :opacity="star.o" />
    </svg>

    <header class="top">
      <button type="button" class="o8-button" @click="close">◀ Title</button>
      <h2 class="heading">The Story</h2>
      <span class="page-number" aria-live="polite">{{ page + 1 }} / {{ panels.length }}</span>
    </header>

    <div class="page">
      <transition :name="direction < 0 ? 'turn-back' : 'turn-next'" mode="out-in">
        <section
          :key="page"
          class="frame"
          :aria-label="'Panel ' + (page + 1)"
          @click="next"
          @pointerdown="swipeStart"
          @pointerup="swipeEnd"
          @pointercancel="swipeCancel"
        >
          <component :is="panel.scene" />
          <p class="caption lead">
            <template v-for="(line, index) in panel.lead" :key="index">
              <span :style="{ animationDelay: 0.4 + index * 0.7 + 's' }">{{ line }}</span>{{ ' ' }}
            </template>
          </p>
          <p class="caption close">
            <template v-for="(line, index) in panel.close" :key="index">
              <span :style="{ animationDelay: 2.4 + index * 0.7 + 's' }">{{ line }}</span>{{ ' ' }}
            </template>
            <strong v-if="panel.signOff" class="sign-off" :style="{ animationDelay: 2.4 + panel.close.length * 0.7 + 's' }">{{ panel.signOff }}</strong>
          </p>
        </section>
      </transition>
    </div>

    <nav class="controls" aria-label="Pages">
      <button type="button" class="o8-button" :disabled="page === 0" @click="go(-1)">◀ Back</button>
      <ol class="dots">
        <li v-for="(item, index) in panels" :key="index">
          <button type="button" class="dot" :class="{ current: index === page }" :aria-label="'Panel ' + (index + 1)" :aria-current="index === page" @click="goTo(index)"></button>
        </li>
      </ol>
      <button ref="next" type="button" class="o8-button primary" @click="go(1)">
        {{ page === panels.length - 1 ? 'Done ▶' : 'Next ▶' }}
      </button>
    </nav>
  </div>
</template>

<script>
import { markRaw } from 'vue'
import PanelSol from './story/panel-sol.svg'
import PanelMars from './story/panel-mars.svg'
import PanelJupiter from './story/panel-jupiter.svg'
import PanelPort from './story/panel-port.svg'
import PanelMinerva from './story/panel-minerva.svg'
import PanelOrbiters from './story/panel-orbiters.svg'
import PanelJump from './story/panel-jump.svg'
import PanelLandRush from './story/panel-landrush.svg'

// The words are docs/backstory.md, shortened to captions: `lead` on the panel's top left, `close` on
// its bottom right, each a few sentences that arrive one at a time. The scenes are plain components,
// not reactive data.
const PANELS = [
  {
    scene: PanelSol,
    lead: ['It is the year 2140.'],
    close: [
      'A little more than a century after the first off-world colonies,',
      'civilization has spread to encompass the whole of the solar system.'
    ]
  },
  {
    scene: PanelMars,
    lead: ['Expansion began with a brutal space race, and the first colony on Mars had it rough.', 'Gravity and radiation crumbled their bones.'],
    close: ['The first generation suffered.', 'The second and third adapted faster than the most optimistic 21st-century elder could have predicted.']
  },
  {
    scene: PanelJupiter,
    lead: ['We spread to Luna, to the moons of Jupiter, to Venus and the larger asteroids,', 'and engineered bodies made for space.'],
    close: ['Humanity was thriving, and so were our numbers.', 'Water became our most precious resource: ice was everywhere, but turning it to water took fuel.']
  },
  {
    scene: PanelPort,
    lead: ['Then the surge faded into decades of vicious trade wars.', 'Progress slowed, then stalled. We call it the Great Regrettion.'],
    close: ['The governments failed one by one, and nothing collapsed: the corporations already ran everything.', 'Today you are a citizen of a corporation.']
  },
  {
    scene: PanelMinerva,
    lead: ['Only one place is shared by every corporation: the Minerva Galactic Network.', 'A ledger, a registry, a court, and an AI that belongs to no one.'],
    close: ['Every pilot, every claim, every name and every siege is filed with her and kept forever.', 'She destroys her fees, so no one can buy her.']
  },
  {
    scene: PanelOrbiters,
    lead: ['In the 2090s a new line of gravity-assist ships, the Orbiters, slung from planet to planet', 'and pushed the frontier to the edge of the solar system.'],
    close: ['That was as far as we could go.', 'Leaving our planet had been the tiniest of steps compared with leaving our sun.']
  },
  {
    scene: PanelJump,
    lead: ['The answer was the sun itself.', 'The Orbiter 8 dives into a close orbit, drinks a star’s light into its capacitor bank, and spends it all in one jump, faster than light, to a neighboring star.'],
    close: ['It arrives with its banks empty, so every jump ends at a sun.', 'The Orbiter 6 jumped and was never heard from again. The Orbiter 8 came home in 36 hours: the first return trip in history.']
  },
  {
    scene: PanelLandRush,
    lead: ['Now the interstellar Orbiters are for sale, and pilots are pouring out of Sol. Every new star charts the next.', 'Claim planets, build them up, arm their moons, and hold what you take.'],
    close: ['Not everyone signs on: out past the patrols, the pirates call themselves free.', 'The whole galaxy awaits our arrival, one star at a time.'],
    signOff: 'Liberta Galactica!'
  }
].map((panel) => ({ ...panel, scene: markRaw(panel.scene) }))
const STAR_COUNT = 140
// A sideways drag at least this long (px) turns the page.
const SWIPE_PX = 50

export default {
  name: 'StoryScene',
  emits: ['close'],
  data() {
    return { page: 0, direction: 1, panels: PANELS, swipeFrom: null }
  },
  computed: {
    panel() {
      return this.panels[this.page]
    },
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
      const next = this.page + step
      if (next >= PANELS.length) return this.close()
      this.direction = step
      this.page = Math.max(0, next)
    },
    goTo(index) {
      if (index === this.page) return
      this.go(index - this.page)
    },
    /** A tap on the panel itself reads on (a swipe is handled on its own). */
    next() {
      if (this.swiped) {
        this.swiped = false
        return
      }
      this.go(1)
    },
    close() {
      this.$emit('close')
    },
    swipeStart(event) {
      this.swipeFrom = event.clientX
    },
    swipeEnd(event) {
      if (this.swipeFrom === null) return
      const dx = event.clientX - this.swipeFrom
      this.swipeFrom = null
      if (Math.abs(dx) < SWIPE_PX) return
      this.swiped = true
      if (dx < 0) this.go(1)
      else if (this.page > 0) this.go(-1)
    },
    swipeCancel() {
      this.swipeFrom = null
    },
    onKey(event) {
      if (event.key === 'Escape') this.close()
      else if (event.key === 'ArrowRight' || event.key === ' ') this.go(1)
      else if (event.key === 'ArrowLeft' && this.page > 0) this.go(-1)
      else return
      event.preventDefault()
    }
  }
}
</script>

<style scoped>
.story {
  position: fixed;
  inset: 0;
  z-index: 50;
  overflow: hidden;
  display: grid;
  grid-template-rows: auto 1fr auto;
  background: radial-gradient(ellipse at center, #2b0c50 0%, #160631 70%);
  color: #e6dcf5;
  font-family: 'Ubuntu', system-ui, sans-serif;
  outline: none;
}
.stars {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  fill: #e6dcf5;
  pointer-events: none;
}
.top,
.controls {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.8rem 1rem;
}
.heading {
  margin: 0;
  font-weight: 400;
  font-size: 1.1rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: #c3b3da;
}
.page-number {
  min-width: 4em;
  text-align: right;
  font-family: 'Ubuntu Mono', ui-monospace, monospace;
  color: #c3b3da;
}

/* The page: one panel, framed like a comic's, as large as the screen allows at a landscape shape. */
.page {
  position: relative;
  display: grid;
  place-items: center;
  padding: 0 1rem;
  min-height: 0;
}
.frame {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: min(100%, (100vw - 2rem) * 9 / 16);
  aspect-ratio: 16 / 9;
  background: #0b0218;
  border: 3px solid #e6dcf5;
  box-shadow:
    0 0 0 1px #12052a,
    0 1.2rem 3rem #000a;
  overflow: hidden;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  touch-action: pan-y;
}
.frame :deep(.art) {
  display: block;
  width: 100%;
  height: 100%;
}

/* Captions: the narrator's boxes, on the frame's top-left and bottom-right corners. */
.caption {
  position: absolute;
  margin: 0;
  max-width: 46%;
  padding: 0.55em 0.8em;
  background: #e6dcf5;
  color: #1c0838;
  border: 2px solid #1c0838;
  box-shadow: 0 0 0 2px #e6dcf5;
  font-size: clamp(0.9rem, 1.6vw, 1.15rem);
  line-height: 1.35;
  pointer-events: none;
}
.caption.lead {
  top: 0;
  left: 0;
  border-top: 0;
  border-left: 0;
}
.caption.close {
  right: 0;
  bottom: 0;
  border-right: 0;
  border-bottom: 0;
  text-align: right;
}
.caption span,
.sign-off {
  animation: fade-in 0.7s ease-out both;
}
.sign-off {
  display: block;
  margin-top: 0.3em;
  font-style: italic;
  font-weight: 500;
}

.controls .o8-button {
  min-width: 6.5em;
  font-size: 1.1em;
}
.dots {
  display: flex;
  gap: 0.35rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.dot {
  display: block;
  width: 0.65rem;
  height: 0.65rem;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: #c3b3da55;
  cursor: pointer;
}
.dot.current {
  background: #e6dcf5;
}
.dot:focus-visible {
  outline: 2px solid #c3b3da;
  outline-offset: 2px;
}

/* Turning the page: the panel slides in from the side it comes from. */
.turn-next-enter-active,
.turn-back-enter-active,
.turn-next-leave-active,
.turn-back-leave-active {
  transition:
    transform 0.3s ease-out,
    opacity 0.3s ease-out;
}
.turn-next-enter-from,
.turn-back-leave-to {
  transform: translateX(6%);
  opacity: 0;
}
.turn-next-leave-to,
.turn-back-enter-from {
  transform: translateX(-6%);
  opacity: 0;
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
}

/* Phones and portrait screens: a tall panel, the captions across its full width, the heading gone.
   Scenes that are wide compositions (the Orbiters' route, the jump, the galaxy) are shown whole,
   as a square in the middle of the frame, instead of cropped to a column. */
@media (max-width: 640px), (max-aspect-ratio: 1 / 1) {
  .heading {
    display: none;
  }
  .frame {
    height: min(100%, (100vw - 2rem) * 16 / 9);
    aspect-ratio: 9 / 16;
  }
  .frame :deep(.art.wide) {
    height: auto;
    aspect-ratio: 1 / 1;
  }
  .caption {
    max-width: 88%;
  }
  .controls .o8-button {
    min-width: 5.5em;
    font-size: 1em;
  }
}
@media (prefers-reduced-motion: reduce) {
  .story *,
  .frame :deep(*) {
    animation: none !important;
    transition: none !important;
  }
}
</style>
