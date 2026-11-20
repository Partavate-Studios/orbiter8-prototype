<template>
  <!-- Dev builds only (router.js): Minerva's face at three sizes, and a console to switch her states,
       fire her one-offs and type at her. Reached from the title screen's "Minerva lab" button or
       #/minerva-lab. -->
  <div class="minerva-lab">
    <header class="top">
      <router-link to="/" class="o8-button small quiet">← Title</router-link>
      <h1>Minerva lab</h1>
      <span class="dev">dev only</span>
    </header>

    <section class="faces" aria-label="Minerva at three sizes">
      <div class="large">
        <minerva-face
          :ref="(el) => (faces[0] = el)"
          :state="state"
          size="min(320px, 82vw)"
          :speed="speed"
          :motion="motion"
          @done="lastDone = $event"
        />
      </div>
      <div class="smaller">
        <figure>
          <minerva-face :ref="(el) => (faces[1] = el)" :state="state" :size="120" :speed="speed" :motion="motion" />
          <figcaption>120 px</figcaption>
        </figure>
        <figure>
          <minerva-face :ref="(el) => (faces[2] = el)" :state="state" :size="48" :speed="speed" :motion="motion" />
          <figcaption>48 px, a HUD corner</figcaption>
        </figure>
      </div>
      <p class="now">
        <strong>{{ states[state].label }}</strong> · {{ states[state].about }}
      </p>
    </section>

    <aside class="console side-panel">
      <div class="group">
        <h2>States</h2>
        <div class="buttons">
          <button
            v-for="(def, name) in states"
            :key="name"
            type="button"
            class="o8-button small"
            :class="{ primary: name === state }"
            :aria-pressed="name === state"
            :title="def.about"
            @click="state = name"
          >
            {{ def.label }}
          </button>
        </div>
      </div>

      <div class="group">
        <h2>One-offs</h2>
        <div class="buttons">
          <button
            v-for="(def, name) in oneOffs"
            :key="name"
            type="button"
            class="o8-button small"
            :title="def.about"
            @click="play(name)"
          >
            {{ def.label }}
          </button>
        </div>
        <p class="hint">{{ note }}</p>
      </div>

      <label class="group">
        <h2>Type to her</h2>
        <input
          v-model="typed"
          class="type-box"
          type="text"
          placeholder="Every key flashes her eyes"
          autocomplete="off"
          @keydown="play('flash', true)"
          @focus="startTyping"
          @blur="stopTyping"
        />
      </label>
      <label class="check">
        <input v-model="listenOnFocus" type="checkbox" />
        Listening while the box has focus
      </label>

      <div class="group">
        <h2>Speed: {{ speed.toFixed(2) }}×</h2>
        <input v-model.number="speed" type="range" min="0.1" max="2" step="0.05" aria-label="Speed" />
      </div>

      <div class="group">
        <h2>Motion</h2>
        <div class="buttons">
          <button
            v-for="choice in motions"
            :key="choice.value"
            type="button"
            class="o8-button small"
            :class="{ primary: motion === choice.value }"
            :aria-pressed="motion === choice.value"
            @click="motion = choice.value"
          >
            {{ choice.label }}
          </button>
        </div>
      </div>
    </aside>
  </div>
</template>

<script>
import MinervaFace from './minerva-face.vue'
import { ONE_OFFS, STATES } from './minerva-poses'

export default {
  name: 'MinervaLab',
  components: { MinervaFace },
  data() {
    return {
      states: STATES,
      oneOffs: ONE_OFFS,
      faces: [],
      state: 'idle',
      speed: 1,
      motion: 'auto',
      motions: [
        { value: 'auto', label: 'Follow system' },
        { value: 'full', label: 'Full' },
        { value: 'reduced', label: 'Reduced' }
      ],
      typed: '',
      listenOnFocus: true,
      stateBeforeTyping: null,
      lastDone: null,
      skipped: null
    }
  },
  computed: {
    note() {
      if (this.skipped) return `${this.oneOffs[this.skipped].label} doesn't play with reduced motion.`
      return this.lastDone ? `Last finished: ${this.oneOffs[this.lastDone]?.label ?? this.lastDone}.` : 'Each plays once over the state.'
    }
  },
  methods: {
    /** With the box on: she listens while it has focus, then goes back to what she was doing. */
    startTyping() {
      if (!this.listenOnFocus) return
      this.stateBeforeTyping = this.state
      this.state = 'listening'
    },
    stopTyping() {
      if (this.stateBeforeTyping && this.state === 'listening') this.state = this.stateBeforeTyping
      this.stateBeforeTyping = null
    },
    play(name, quietly = false) {
      const played = this.faces.map((face) => face?.play(name)).some(Boolean)
      if (!quietly) this.skipped = played ? null : name
    }
  }
}
</script>

<style scoped>
.minerva-lab {
  position: fixed;
  inset: 0;
  overflow-y: auto;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(18em, 26em);
  grid-template-rows: auto 1fr;
  gap: 1em 2em;
  padding: 1em 1.5em 2em;
  box-sizing: border-box;
  background: radial-gradient(ellipse at 35% 45%, #2a1a4a 0%, #130e24 55%, #0b0916 100%);
  color: #f1eefa;
  font-family: 'Ubuntu', system-ui, sans-serif;
  text-align: left;
}
.top {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 1em;
}
.top h1 {
  margin: 0;
  font-weight: 400;
  font-size: 1.4em;
  color: #e6dcf5;
}
.dev {
  font-size: 0.8em;
  color: #9088aa;
}
.faces {
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 2em;
  min-width: 0;
}
.large {
  padding: 1.5em 0;
}
.smaller {
  display: flex;
  align-items: flex-end;
  gap: 2.5em;
}
figure {
  margin: 0;
  display: grid;
  justify-items: center;
  gap: 0.6em;
}
figcaption,
.hint {
  font-size: 0.8em;
  color: #9088aa;
}
.now {
  margin: 0;
  max-width: 30em;
  text-align: center;
  color: #bdb5d4;
  min-height: 2.8em;
}
.now strong {
  color: #f1eefa;
  font-weight: 500;
}
.console {
  align-self: start;
  gap: 1.2em;
}
.group {
  display: grid;
  gap: 0.6em;
}
.console h2 {
  font-size: 0.85em;
  color: #bdb5d4;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45em;
}
.buttons .o8-button {
  font-size: 0.9em;
}
.hint {
  margin: 0;
  min-height: 1.2em;
}
.type-box {
  font: inherit;
  color: #f1eefa;
  background: #251d40;
  border: 1px solid #3f3566;
  border-radius: 0.5em;
  padding: 0.5em 0.7em;
}
.check {
  display: flex;
  gap: 0.5em;
  align-items: center;
  font-size: 0.9em;
  color: #bdb5d4;
  margin-top: -0.6em;
}
input[type='range'] {
  width: 100%;
  accent-color: #b9a0ff;
}

/* Phones: the faces on top, the console under them; the page scrolls. */
@media (max-width: 760px) {
  .minerva-lab {
    grid-template-columns: minmax(0, 1fr);
    padding: 0.8em 1em 2em;
    gap: 1em;
  }
  .large {
    padding: 0.5em 0;
  }
  .faces {
    gap: 1.2em;
  }
}
</style>
