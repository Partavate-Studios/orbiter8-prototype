<template>
  <!-- Onboarding on the new contracts (docs/demo4-plan.md, milestone 5): a short list of first goals
       that ticks itself off from the pilot's own state, until it's done or dismissed. Over the game. -->
  <aside v-if="show" class="first-steps">
    <header>
      <h4>First steps</h4>
      <button class="close" aria-label="Dismiss" @click="dismiss">×</button>
    </header>
    <ol>
      <li v-for="step in steps" :key="step.text" :class="{ done: step.done }">{{ step.text }}</li>
    </ol>
  </aside>
</template>

<script>
import { game } from '@/sdk/client'
import { usePlayerStore } from '@/stores/player'

const KEY = 'o8.info.firstStepsDismissed'

export default {
  name: 'FirstSteps',
  data() {
    let dismissed = false
    try {
      dismissed = localStorage.getItem(KEY) === '1'
    } catch {
      // storage refused: show it
    }
    return { player: usePlayerStore(), dismissed }
  },
  computed: {
    steps() {
      const d = this.player
      const ship = d.pilot.ship
      void d.cellsVersion
      const visitedElsewhere = [...game.state.cells.values()].some(
        (c) => c.cell !== 0 && c.discoverer === d.account
      )
      return [
        { text: 'Start a session (your ship’s menu): one approval, then no wallet popups for 4 hours.', done: d.sessionLive },
        {
          text: 'Trade at a port: buy where it’s cheap, sell where the port code shows a yellow B.',
          done: d.credits > 1000 || ship.cargo > 0
        },
        { text: 'Fit more holds at the I.S.S. shipyard, orbiting Earth.', done: ship.bays > 5 },
        { text: 'Jump to a neighboring star and chart what’s around it.', done: visitedElsewhere },
        {
          text: 'Claim a planet (2,000 credits) and found a Citadel from its Colony menu.',
          done: d.ownsPlanets
        }
      ]
    },
    show() {
      return !this.dismissed && this.player.pilot && this.steps.some((s) => !s.done)
    }
  },
  methods: {
    dismiss() {
      this.dismissed = true
      try {
        localStorage.setItem(KEY, '1')
      } catch {
        // fine: it stays dismissed for this visit
      }
    }
  }
}
</script>

<style scoped>
.first-steps {
  position: fixed;
  z-index: 20;
  right: 16px;
  top: 220px;
  width: min(86vw, 18em);
  background: #12052ae6;
  border: 1px solid var(--o8-yellow-light);
  border-radius: 12px;
  padding: 0.6em 0.9em;
  font-size: 13px;
  text-align: left;
}
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
h4 {
  margin: 0;
  font-weight: 500;
  color: var(--o8-yellow-light);
}
.close {
  font: inherit;
  font-size: 1.4em;
  line-height: 1;
  color: #c3b3da;
  background: none;
  border: none;
  cursor: pointer;
}
ol {
  margin: 0.4em 0 0;
  padding-left: 1.3em;
  display: grid;
  gap: 0.3em;
  color: #e6dcf5;
}
.done {
  color: #c3b3da88;
  text-decoration: line-through;
}
/* A portrait phone: under the profile card, over the map, clear of the HUD's buttons below. */
@media (max-width: 600px) and (orientation: portrait) {
  .first-steps {
    left: 8px;
    right: 8px;
    width: auto;
    top: 200px;
  }
}
</style>
