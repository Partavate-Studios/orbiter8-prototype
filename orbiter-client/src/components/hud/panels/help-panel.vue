<template>
  <!-- Help (Koda, 2026-11-21: it led with "do these things" while the far more useful page, how planets
       grow, was buried). So: how planets grow comes first, as the screen's main way on; then a new
       pilot's first steps, ticked off as they're done (yellow: yours); then the keys. -->
  <div class="k-panel help-panel" :class="{ narrow }">
    <header class="k-head">
      <span class="k-title"><small-icon name="help" /><span><b>Help</b><small>How the galaxy works</small></span></span>
    </header>

    <button type="button" class="grow" @click="openTechTree">
      <img :src="colonyArt" alt="" />
      <span><b>How planets grow</b><small>What to build, in what order, and what each step needs</small></span>
      <small-icon name="go" />
    </button>

    <section>
      <h3><span>First steps</span><span class="k-meter">{{ left ? left + ' to go' : 'All done. Fly well, pilot.' }}</span></h3>
      <div v-for="(step, i) in steps" :key="i" class="k-row step" :class="{ done: step.done }">
        <span class="tick" :class="{ done: step.done }" aria-hidden="true">
          <svg v-if="step.done" viewBox="-8 -8 16 16"><path d="M-4.5 0L-1.2 3.6L5 -3.6" /></svg>
          <template v-else>{{ i + 1 }}</template>
        </span>
        <span class="k-text"><b>{{ step.title }}</b><small>{{ step.lines.join(' ') }}</small></span>
      </div>
    </section>

    <section v-if="!narrow">
      <h3><span>Keys</span></h3>
      <p class="keys">
        <span v-for="key in KEYS" :key="key[0]"><kbd>{{ key[0] }}</kbd>{{ key[1] }}</span>
      </p>
    </section>
  </div>
</template>

<script>
import { mapActions } from 'pinia'
import { useUIStore } from '@/stores/ui'
import { usePlayerStore } from '@/stores/player'
import { firstSteps } from '@/libs/first-steps'
import colonyArt from '@/assets/art/colony.svg'
import SmallIcon from '../small-icon.vue'

const KEYS = [
  ['1–9', 'the card’s actions'],
  ['O', 'everything here'],
  ['M', 'the galaxy map'],
  ['N', 'Minerva'],
  ['Space', 'your ship'],
  ['Tab', 'the next planet'],
  ['C', 'chat'],
  ['L', 'ranks'],
  ['F', 'sieges'],
  ['Esc', 'back']
]

export default {
  name: 'HelpPanel',
  components: { SmallIcon },
  props: {
    objectId: { type: String, default: null },
    narrow: { type: Boolean, default: false }
  },
  data() {
    return { player: usePlayerStore(), colonyArt, KEYS }
  },
  computed: {
    steps() {
      return this.player.pilot ? firstSteps(this.player) : []
    },
    left() {
      return this.steps.filter((s) => !s.done).length
    }
  },
  methods: {
    ...mapActions(useUIStore, ['closeMenu']),
    openTechTree() {
      this.o8audio?.playEffect('click')
      this.closeMenu()
      useUIStore().techTreeOpen = true
    }
  }
}
</script>

<style src="../kit.css"></style>
<style scoped>
/* the way to the tech tree: the screen's main way on, with its picture */
.grow {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  margin-top: 14px;
  padding: 10px 14px 10px 10px;
  border: 2px solid var(--accent);
  border-radius: 16px;
  background: color-mix(in srgb, var(--base) 26%, transparent);
  color: var(--accent);
  text-align: left;
}
.grow:hover {
  background: color-mix(in srgb, var(--base) 42%, transparent);
}
.grow img {
  flex: none;
  width: 64px;
  height: 64px;
}
.grow span {
  flex: 1;
  min-width: 0;
}
.grow b {
  display: block;
  color: #ffffff;
  font-size: 19px;
  font-weight: normal;
}
.grow .small-icon {
  flex: none;
  width: 22px;
  height: 22px;
}
.tick {
  flex: none;
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  box-sizing: border-box;
  border: 1.5px solid #ffffff88;
  border-radius: 50%;
  color: #ffffffcc;
  font-size: 12.5px;
}
/* done: yours */
.tick.done {
  border-color: var(--o8-yellow-light);
  background: var(--o8-yellow-light);
}
.tick svg {
  width: 16px;
  height: 16px;
}
.tick path {
  fill: none;
  stroke: #1b1531;
  stroke-width: 2.4;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.step.done b,
.step.done small {
  opacity: 0.55;
}
.step small {
  white-space: normal;
}
.keys {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
  margin: 0;
  color: #bdb5d4;
  font-size: 12.5px;
}
kbd {
  display: inline-block;
  min-width: 14px;
  margin-right: 6px;
  padding: 1px 6px;
  border: 1px solid #5a4c8c;
  border-radius: 6px;
  background: #150f28;
  color: #ffffff;
  font: inherit;
  font-size: 12px;
  text-align: center;
}
</style>
