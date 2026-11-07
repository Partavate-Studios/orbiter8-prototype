<template>
  <!-- The planets at the ship's star (docs/demo4-plan.md, milestone 3): claim one, bring people and
       goods, build up the line, and run its Autofactory. -->
  <aside class="planets">
    <header>
      <h3>Planets · {{ starName }}</h3>
      <span>
        <button class="o8-button small" @click="$emit('tech-tree')">Tech tree</button>
        <button class="close" aria-label="Close" @click="$emit('close')">×</button>
      </span>
    </header>

    <p v-if="galaxy.shipCell === 0" class="recruit">
      Earth's hiring hall · {{ rules.colonistPrice }} cr a colonist, 100 to a bay ·
      <input v-model.number="recruits" type="number" min="1" aria-label="Colonists to recruit" />
      <button
        class="o8-button small"
        :disabled="!recruits || recruits * rules.colonistPrice > galaxy.credits || Boolean(galaxy.busy)"
        @click="galaxy.recruit(recruits)"
      >
        Recruit · {{ (recruits * rules.colonistPrice).toLocaleString() }}
      </button>
    </p>

    <ul class="list">
      <li v-for="p in galaxy.planets" :key="p.id">
        <button :class="{ chosen: p.id === chosen?.id }" @click="chosenId = p.id">
          <span class="name">{{ nameOf(p) }}</span>
          <span class="sub">{{ className(p.class) }} · size {{ p.size }}</span>
          <span class="sub" :class="{ mine: p.owner === galaxy.account }">{{ ownerWords(p) }}</span>
        </button>
      </li>
    </ul>

    <section v-if="chosen" class="planet">
      <h4>{{ nameOf(chosen) }}</h4>
      <p class="sub">
        {{ className(chosen.class) }}, size {{ chosen.size }} · room for {{ chosen.cap.toLocaleString() }} people
      </p>

      <siege-box v-if="siege" :siege="siege" :owner="chosen.owner" />

      <template v-if="!chosen.owner">
        <p v-if="galaxy.shipCell === 0" class="sub">The Federation's: Sol's planets can't be claimed.</p>
        <button
          v-else
          class="o8-button primary"
          :disabled="galaxy.credits < rules.claimFee || Boolean(galaxy.busy)"
          @click="galaxy.claim(chosen.id)"
        >
          Claim · {{ rules.claimFee.toLocaleString() }} cr
        </button>
      </template>

      <template v-else-if="chosen.owner !== galaxy.account">
        <p class="sub">Owned by {{ chosen.owner.slice(0, 6) }}… · {{ levelName(chosen) }}</p>
        <button
          v-if="!siege && galaxy.shipCell !== 0"
          class="o8-button small"
          :disabled="!galaxy.armed || galaxy.condition?.retreated || Boolean(galaxy.busy)"
          :title="galaxy.armed ? 'Start a siege: public, worked out every 30 minutes' : 'Fit weapons first'"
          @click="galaxy.attack(chosen.id)"
        >
          Lay siege
        </button>
      </template>

      <template v-else-if="chosen.owner === galaxy.account">
        <p>
          <b>{{ levelName(chosen) }}</b>
          <span v-if="chosen.building" class="sub">
            · {{ buildingName(chosen.building) }} ready {{ readyWords(chosen.readyAt) }}
          </span>
        </p>
        <p>
          People {{ chosen.population.toLocaleString() }} of {{ chosen.cap.toLocaleString() }}
          <span class="sub">· {{ galaxy.pilot.ship.colonists }} aboard</span>
        </p>
        <p class="row">
          <input v-model.number="people" type="number" min="1" aria-label="People" />
          <button
            class="o8-button small"
            :disabled="!people || people > galaxy.pilot.ship.colonists || Boolean(galaxy.busy)"
            @click="galaxy.land(chosen.id, people)"
          >
            Land
          </button>
          <button
            class="o8-button small"
            :disabled="!people || people > chosen.population || Boolean(galaxy.busy)"
            @click="galaxy.board(chosen.id, people)"
          >
            Take aboard
          </button>
        </p>

        <table class="storage">
          <tbody>
            <tr v-for="row in storage" :key="row.good">
              <td>{{ row.name }}</td>
              <td class="num">{{ row.stored.toLocaleString() }} <span class="sub">stored</span></td>
              <td class="num">{{ row.aboard }} <span class="sub">aboard</span></td>
              <td class="act">
                <button
                  class="o8-button small"
                  :disabled="!row.aboard || Boolean(galaxy.busy)"
                  @click="galaxy.deliver(chosen.id, row.good, row.aboard)"
                >
                  Unload
                </button>
                <button
                  class="o8-button small"
                  :disabled="!row.stored || !galaxy.freeBays || Boolean(galaxy.busy)"
                  @click="galaxy.collect(chosen.id, row.good, Math.min(row.stored, galaxy.freeBays))"
                >
                  Load
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-for="b in nextBuildings" :key="b.building" class="build">
          <p>
            <b>{{ buildingName(b.building) }}</b>
            <span class="sub">
              · {{ b.cost.credits.toLocaleString() }} cr<template v-for="[good, amount] in b.cost.goods" :key="good"
                >, {{ amount }} {{ goodName(good) }}</template
              >
              · {{ duration(b.cost.time) }}
            </span>
          </p>
          <p v-if="b.missing.length" class="sub needs">Needs {{ b.missing.join(', ') }}</p>
          <button
            v-else
            class="o8-button small"
            :disabled="Boolean(galaxy.busy)"
            @click="galaxy.build(chosen.id, b.building)"
          >
            Build
          </button>
        </div>

        <p v-if="defenseWords" class="sub">Defenses: {{ defenseWords }}</p>

        <div v-if="factory" class="factory">
          <h4>Autofactory</h4>
          <p v-for="(o, i) in factory.queue" :key="i" class="sub">
            {{ o.count }} × {{ rules.parts[o.part].name }} · ready {{ readyWords(o.readyAt) }}
          </p>
          <div v-for="row in finishedParts" :key="row.part" class="row">
            <span>{{ row.count }} {{ row.name }}</span>
            <button
              class="o8-button small"
              :disabled="Boolean(galaxy.busy)"
              @click="galaxy.fitPlanet(chosen.id, row.part, row.count)"
            >
              Fit to planet
            </button>
            <button
              v-if="row.part < 7"
              class="o8-button small"
              :disabled="Boolean(galaxy.busy)"
              @click="galaxy.fitShip(chosen.id, row.part, 1)"
            >
              Fit one to ship
            </button>
          </div>
          <p class="row">
            <select v-model.number="part" aria-label="Part">
              <option v-for="(p, i) in rules.parts" :key="i" :value="i">{{ p.name }}</option>
            </select>
            <input v-model.number="parts" type="number" min="1" aria-label="How many" />
            <button
              class="o8-button small"
              :disabled="!parts || factory.queue.length >= 5 || Boolean(galaxy.busy)"
              @click="galaxy.order(chosen.id, part, parts)"
            >
              Order · {{ (rules.parts[part].credits * (parts || 0)).toLocaleString() }}
            </button>
          </p>
        </div>
      </template>
    </section>
  </aside>
</template>

<script>
import { useGalaxyStore } from '@/stores/galaxy'
import { planetTypeName } from '@/sdk/game/planet-types'
import { starTraits } from '@/sdk/v4/traits'
import { planetName, BUILDINGS } from '@/sdk/v4/system'
import SiegeBox from './siege-box.vue'

export default {
  name: 'PlanetsPanel',
  components: { SiegeBox },
  emits: ['close', 'tech-tree'],
  data() {
    return { galaxy: useGalaxyStore(), chosenId: null, recruits: 100, people: 100, part: 0, parts: 1, now: Date.now() }
  },
  computed: {
    rules() {
      return this.galaxy.rules
    },
    starName() {
      const cell = this.galaxy.shipCell
      return this.galaxy.names[cell] ?? starTraits(this.galaxy.universe.seed, cell).name
    },
    chosen() {
      return this.galaxy.planets.find((p) => p.id === this.chosenId) ?? null
    },
    storage() {
      const p = this.chosen
      return this.galaxy.economy.goods
        .map((g, good) => ({ good, name: g.name, stored: p.stock[good] ?? 0, aboard: this.galaxy.cargo[good] ?? 0 }))
        .filter((r) => r.stored || r.aboard)
    },
    nextBuildings() {
      const p = this.chosen
      if (p.building) return [] // one building at a time; the header shows it
      const list = p.level < 6 ? [p.level + 1] : []
      if (p.level >= 2 && !p.autofactory && p.building !== 7) list.push(7)
      return list.map((building) => ({
        building,
        cost: this.rules.buildings[building],
        missing: this.galaxy.missingFor(p, building)
      }))
    },
    factory() {
      return this.chosen?.autofactory ? (this.galaxy.factories[this.chosen.id] ?? { queue: [], stored: [] }) : null
    },
    finishedParts() {
      return (this.factory?.stored ?? [])
        .map((count, part) => ({ part, count, name: this.rules.parts[part].name }))
        .filter((r) => r.count > 0)
    },
    siege() {
      return this.galaxy.sieges.find((s) => s.planet === this.chosen?.id) ?? null
    },
    defenseWords() {
      const d = this.galaxy.defenses[this.chosen?.id]
      if (!d) return ''
      const names = [
        'point defense',
        'railguns',
        'missile racks',
        'drones',
        'repair bots',
        'armor plates',
        'shield levels',
        'platforms',
        'BFG'
      ]
      const counts = [
        d.pointDefense,
        d.railguns,
        d.missiles,
        d.drones,
        d.repairBots,
        d.armor,
        d.shields,
        d.platforms,
        d.bfg
      ]
      return counts
        .map((n, i) => (n ? `${n} ${names[i]}` : null))
        .filter(Boolean)
        .join(', ')
    }
  },
  mounted() {
    this.clock = setInterval(() => (this.now = Date.now()), 15_000)
  },
  unmounted() {
    clearInterval(this.clock)
  },
  methods: {
    className: planetTypeName,
    buildingName: (b) => BUILDINGS[b],
    goodName(good) {
      return this.galaxy.economy.goods[good].name.toLowerCase()
    },
    nameOf(p) {
      return planetName(this.starName, this.galaxy.shipCell, p.body)
    },
    levelName(p) {
      return p.level ? BUILDINGS[p.level] + (p.autofactory ? ' with an Autofactory' : '') : 'Claimed, unsettled'
    },
    ownerWords(p) {
      if (!p.owner) return this.galaxy.shipCell === 0 ? 'Federation' : 'Unclaimed'
      const who = p.owner === this.galaxy.account ? 'Yours' : p.owner.slice(0, 6) + '…'
      return p.level ? `${who} · ${BUILDINGS[p.level]}` : who
    },
    duration(seconds) {
      return seconds >= 3600 ? `${+(seconds / 3600).toFixed(1)} h` : `${Math.round(seconds / 60)} min`
    },
    readyWords(at) {
      const left = at - this.now / 1000
      return left <= 0 ? 'now' : `in ${this.duration(left)}`
    }
  }
}
</script>

<style scoped>
.planets {
  position: absolute;
  left: 16px;
  top: 56px;
  max-height: calc(100% - 120px);
  width: min(92vw, 30em);
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
h3,
h4 {
  margin: 0;
  font-weight: 500;
  color: #fff;
}
h4 {
  margin-top: 0.6em;
}
p {
  margin: 0.35em 0;
}
.close {
  font: inherit;
  font-size: 1.5em;
  line-height: 1;
  color: #c3b3da;
  background: none;
  border: none;
  cursor: pointer;
  vertical-align: middle;
}
.sub {
  color: #c3b3da;
  font-size: 0.85em;
}
.mine {
  color: var(--o8-yellow-light);
}
.needs {
  color: var(--o8-pink-light);
}
.list {
  list-style: none;
  margin: 0.6em 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(8.5em, 1fr));
  gap: 0.4em;
}
.list button {
  width: 100%;
  font: inherit;
  text-align: left;
  color: #e6dcf5;
  background: #00000040;
  border: 1px solid #c3b3da33;
  border-radius: 8px;
  padding: 0.35em 0.5em;
  cursor: pointer;
  display: grid;
}
.list button.chosen {
  border-color: #fff;
  background: #3a1a66cc;
}
.name {
  font-weight: 500;
}
.row,
.recruit {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4em;
  align-items: center;
}
input,
select {
  width: 4.5em;
  font: inherit;
  color: #fff;
  background: #00000055;
  border: 1px solid #ffffff55;
  border-radius: 0.5em;
  padding: 0.2em 0.4em;
}
select {
  width: auto;
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
.act {
  display: flex;
  gap: 0.3em;
  justify-content: flex-end;
}
.build,
.factory {
  border-top: 1px solid #c3b3da33;
  margin-top: 0.5em;
  padding-top: 0.3em;
}
@media (max-width: 600px) and (orientation: portrait) {
  .planets {
    left: 8px;
    right: 8px;
    width: auto;
    top: auto;
    max-height: 70vh;
    bottom: 64px;
  }
}
</style>
