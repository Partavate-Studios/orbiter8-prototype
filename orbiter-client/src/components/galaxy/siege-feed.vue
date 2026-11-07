<template>
  <!-- The public siege feed (docs/demo4-plan.md, D44): every siege started, joined, worn down,
       claimed and ended, newest first, from the Battle contract's events. -->
  <aside class="feed">
    <header>
      <h3>Siege feed</h3>
      <button class="close" aria-label="Close" @click="$emit('close')">×</button>
    </header>
    <p v-if="!galaxy.feed.length" class="sub">Quiet across the galaxy. No sieges yet.</p>
    <ul>
      <li v-for="(e, i) in galaxy.feed" :key="i" :class="{ ended: e.event === 'SiegeEnded' }">
        <span class="what">{{ words(e) }}</span>
        <button class="o8-button small" @click="galaxy.select(cellOf(e.planet))">Show</button>
      </li>
    </ul>
  </aside>
</template>

<script>
import { useGalaxyStore } from '@/stores/galaxy'
import { starTraits } from '@/sdk/v4/traits'
import { planetName } from '@/sdk/v4/system'

export default {
  name: 'SiegeFeed',
  emits: ['close'],
  data() {
    return { galaxy: useGalaxyStore() }
  },
  mounted() {
    this.galaxy.loadFeed()
  },
  methods: {
    cellOf: (planet) => Math.floor(planet / 256),
    place(planet) {
      const cell = this.cellOf(planet)
      const star = this.galaxy.names[cell] ?? starTraits(this.galaxy.universe.seed, cell).name
      return planetName(star, cell, planet % 256)
    },
    who(address) {
      if (!address) return 'someone'
      return address === this.galaxy.account ? 'You' : address.slice(0, 6) + '…'
    },
    words(e) {
      const where = this.place(e.planet)
      switch (e.event) {
        case 'SiegeStarted':
          return `${this.who(e.who)} laid siege to ${where}`
        case 'DefenderJoined':
          return `${this.who(e.who)} joined the defense of ${where}`
        case 'WornDown':
          return `${where} was worn down`
        case 'ClaimFiled':
          return `${this.who(e.who)} filed a claim on ${where}`
        case 'ClaimFailed':
          return `The claim on ${where} failed`
        default:
          return e.args[2] ? `${where} fell to ${this.who(e.who)}` : `The siege of ${where} ended`
      }
    }
  }
}
</script>

<style scoped>
.feed {
  position: absolute;
  left: 16px;
  top: 56px;
  max-height: calc(100% - 120px);
  width: min(92vw, 24em);
  overflow-y: auto;
  background: #12052af0;
  border: 1px solid #c3b3da44;
  border-radius: 12px;
  padding: 0.8em 1em;
  font-size: 14px;
  box-sizing: border-box;
  text-align: left;
}
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
h3 {
  margin: 0;
  font-weight: 500;
  color: #fff;
}
.close {
  font: inherit;
  font-size: 1.5em;
  line-height: 1;
  color: #c3b3da;
  background: none;
  border: none;
  cursor: pointer;
}
.sub {
  color: #c3b3da;
  font-size: 0.85em;
}
ul {
  list-style: none;
  padding: 0;
  margin: 0.5em 0 0;
}
li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5em;
  padding: 0.3em 0;
  border-top: 1px solid #c3b3da22;
  color: var(--o8-pink-light);
}
li.ended {
  color: #c3b3da;
}
@media (max-width: 600px) and (orientation: portrait) {
  .feed {
    left: 8px;
    right: 8px;
    width: auto;
    top: auto;
    max-height: 70vh;
    bottom: 64px;
  }
}
</style>
