<template>
  <!-- The tech tree at a glance (docs/demo4-plan.md, D60): what each building and part takes and what
       it unlocks, read from the contracts, so nobody has to find out by trial and error. -->
  <div class="backdrop" @click.self="$emit('close')">
    <article class="tree" role="dialog" aria-label="Tech tree">
      <div class="inside">
      <header>
        <h3 class="title">Tech Tree</h3>
        <button class="close" aria-label="Close" @click="$emit('close')">×</button>
      </header>
      <p class="sub">
        Claim a planet ({{ rules.claimFee.toLocaleString() }}¢, with your ship at its star). Bring people from Earth
        ({{ rules.colonistPrice }}¢ each, 100 to a hold) and goods, then build up the line. Credits are spent when a
        building starts; goods come from the planet's storage.
      </p>

      <ol class="line">
        <li v-for="b in buildings" :key="b.building">
          <h4>{{ b.name }}</h4>
          <p class="cost">
            {{ b.cost.credits.toLocaleString() }}¢<template v-for="[good, amount] in b.cost.goods" :key="good">
              · {{ amount }} {{ goodName(good) }}</template
            >
            · {{ duration(b.cost.time) }}
          </p>
          <p v-if="b.needs" class="needs">Needs {{ b.needs }}</p>
          <p class="unlocks">{{ b.unlocks }}</p>
        </li>
      </ol>

      <h4>Autofactory parts</h4>
      <table>
        <tbody>
          <tr v-for="(p, i) in rules.parts" :key="i">
            <td>{{ p.name }}<span v-if="p.planetOnly" class="sub"> · planets only</span></td>
            <td class="num">{{ p.credits.toLocaleString() }}¢</td>
            <td class="sub">{{ p.goods.map(([g, a]) => `${a} ${goodName(g)}`).join(', ') }}</td>
            <td class="num sub">{{ duration(p.time) }}</td>
          </tr>
        </tbody>
      </table>
      <p class="sub">Finished parts wait in the Factory page: install them on the planet, or fit them to your ship.</p>
      <p class="sub">
        Each moon gives six free mounts for railguns, missile racks and point defense. Moons can't be destroyed, but
        the weapons on them sit outside the planet's shield and are hit first, after any platforms.
      </p>
      </div>
    </article>
  </div>
</template>

<script>
import { usePlayerStore } from '@/stores/player'
import { BUILDINGS } from '@/sdk/system-gen'

const UNLOCKS = {
  1: 'People start to grow toward the planet’s cap, and it produces the goods its class sells.',
  2: 'Opens the Station and the Autofactory.',
  3: 'Opens the Port.',
  4: 'A market port at the planet, trading by its class. You take the fee on every trade.',
  5: 'A shipyard at your port: pilots buy cargo holds and engine range there.',
  6: 'Weapons and armor for sale to visiting pilots.',
  7: 'Builds drones, weapons, defenses, platforms and repair bots from goods in storage, five orders at a time.'
}

export default {
  name: 'TechTree',
  emits: ['close'],
  data() {
    return { galaxy: usePlayerStore() }
  },
  computed: {
    rules() {
      return this.galaxy.rules
    },
    buildings() {
      return [1, 2, 3, 4, 5, 6, 7].map((building) => {
        const cost = this.rules.buildings[building]
        const needs = {
          1: `${cost.people} people landed`,
          2: `the planet at ${cost.people}% of its cap`,
          7: 'a Colony'
        }[building]
        const name = building === 7 ? 'Autofactory (after Colony)' : `${building}. ${BUILDINGS[building]}`
        return { building, name, cost, needs, unlocks: UNLOCKS[building] }
      })
    }
  },
  methods: {
    goodName(good) {
      return this.galaxy.economy.goods[good].name.toLowerCase()
    },
    duration(seconds) {
      return seconds >= 3600 ? `${+(seconds / 3600).toFixed(1)} h` : `${Math.round(seconds / 60)} min`
    }
  }
}
</script>

<style scoped>
.backdrop {
  position: absolute;
  inset: 0;
  background: #05010dcc;
  display: grid;
  place-items: center;
  z-index: 5;
}
/* The card's frame, as the in-game dialog draws it (game-dialog.vue): the striped purple edge, the
   wide rounded corners and the title pill. */
.tree {
  width: min(94vw, 40em);
  max-height: 88vh;
  padding: 3px;
  border-radius: 40px / 9px;
  background: linear-gradient(135deg, #5c1aae 0%, #280b4b 10%, #5c1aae 50%, #280b4b 90%, #5c1aae 100%);
  box-shadow: 0 1.2em 3em #0009;
  font-size: 14px;
  box-sizing: border-box;
  text-align: left;
  display: flex;
}
.inside {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0.6em 1.3em 1.2em;
  border: 1px solid #5b1aaa;
  border-radius: 38px / 8px;
  background: #12052ae6;
  color: #e6dcf5;
}
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.6em;
}
.title {
  flex: 1;
  margin: 0;
  padding: 0.3em 1em;
  border: 1px solid #5b1aaa88;
  border-radius: 40px / 12px;
  background: linear-gradient(135deg, #5c1aae 0%, #280b4b 10%, #5c1aae 50%, #280b4b 90%, #5c1aae 100%);
  color: #ffffff;
  font-size: 1.1em;
  font-weight: normal;
  text-align: center;
  text-shadow: 0 1px 3px #000a;
}
h4 {
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
.line {
  list-style: none;
  padding: 0;
  margin: 0.8em 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(11em, 1fr));
  gap: 0.6em;
}
.line li {
  background: #00000040;
  border: 1px solid #c3b3da33;
  border-radius: 8px;
  padding: 0.5em 0.6em;
}
.line p {
  margin: 0.3em 0 0;
  font-size: 0.85em;
}
.cost {
  color: #e6dcf5;
}
.needs {
  color: var(--o8-pink-light);
}
.unlocks {
  color: #c3b3da;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin: 0.4em 0;
}
td {
  padding: 0.25em 0.2em;
  border-top: 1px solid #c3b3da22;
}
.num {
  text-align: right;
  white-space: nowrap;
}
</style>
