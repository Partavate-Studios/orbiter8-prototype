<template>
  <!-- Onboarding on the new contracts (docs/demo4-plan.md, milestone 5): a short list of first goals
       that ticks itself off from the pilot's own state, until it's done or dismissed. -->
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
import { useGalaxyStore } from '@/stores/galaxy'

const KEY = 'o8.v4.firstStepsDismissed'

export default {
  name: 'FirstSteps',
  data() {
    let dismissed = false
    try {
      dismissed = localStorage.getItem(KEY) === '1'
    } catch {
      // storage refused: show it
    }
    return { galaxy: useGalaxyStore(), dismissed }
  },
  computed: {
    steps() {
      const g = this.galaxy
      const ship = g.pilot.ship
      const visitedElsewhere = [...g.cells.values()].some((c) => c.cell !== 0 && c.discoverer === g.account)
      return [
        { text: 'Start a session: one approval, then no wallet popups for 4 hours.', done: g.sessionLive },
        {
          text: 'Open the Docks: buy where it’s cheap, sell where a yellow B shows.',
          done: g.credits > 1000 || ship.cargo > 0
        },
        { text: 'Fit more bays at the I.S.S. shipyard.', done: ship.bays > 5 },
        { text: 'Jump to a neighboring star and chart what’s around it.', done: visitedElsewhere },
        {
          text: 'Claim a planet (2,000 credits) and found a Citadel: see the Tech tree.',
          done: g.planets.some((p) => p.owner === g.account)
        }
      ]
    },
    show() {
      return !this.dismissed && this.galaxy.pilot && this.steps.some((s) => !s.done)
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
  position: absolute;
  right: 16px;
  bottom: 64px;
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
@media (max-width: 600px) and (orientation: portrait) {
  .first-steps {
    left: 8px;
    right: 8px;
    width: auto;
    top: 96px;
    bottom: auto;
  }
}
</style>
