<template>
  <!-- An asteroid's works (D88, D90): its line (Platform, Mine, Port, Armory) and what the next step
       needs, its people, its drones (mining and defending), and what its store holds. Rebuilt to the
       screen standard: each group has its limit in its heading; the next step lists what it needs and
       which of those you're short of, so a Build that can't be pressed says why. -->
  <div v-if="asteroid && info" class="k-panel asteroid-panel" :class="{ narrow }">
    <header class="k-head">
      <span class="k-title"><small-icon name="asteroid" /><span><b>{{ asteroid.name }}</b><small>{{ asteroid.compositionName }} · size {{ asteroid.size }} · yields {{ yieldsText }}</small></span></span>
    </header>

    <section>
      <h3><span>The works</span><span class="k-meter">{{ info.building ? 'Building: ready ' + readyWords(info.readyAt) : next ? 'Next: the ' + next.name : 'Fully built' }}</span></h3>
      <div class="line">
        <span v-for="step in line" :key="step.n" class="stage" :class="{ done: step.done, next: next && step.n === next.n, building: info.building === step.n }">
          <i><small-icon :name="step.icon" /></i>{{ step.name }}
        </span>
      </div>
      <template v-if="next && !info.building">
        <p class="needs">
          <span v-for="need in needs" :key="need.what" :class="{ short: !need.ok }">{{ need.what }}<small v-if="!need.ok">{{ need.short }}</small></span>
        </p>
        <button type="button" class="k-main" :disabled="!canBuild" @click="build">Build the {{ next.name }}</button>
      </template>
    </section>

    <section>
      <h3><span>People</span><span class="k-meter">{{ info.population }} of {{ info.cap }}</span></h3>
      <p class="line-row">
        <span>{{ shipPeople ? shipPeople + ' aboard your ship' : 'Colonists come from Earth, a hundred to a hold.' }}</span>
        <button v-if="shipPeople" type="button" class="k-quiet" @click="landPeople">Land {{ shipPeople }}</button>
      </p>
    </section>

    <section>
      <h3><span>Drones</span><span class="k-meter">{{ pool.total }} of {{ pool.room }}</span></h3>
      <p class="line-row">
        <span><b>{{ pool.total - pool.defense }}</b> mining · <b>{{ pool.defense }}</b> defending</span>
        <span class="split">
          <button type="button" class="step" :disabled="pool.defense <= 0" aria-label="One fewer defending" @click="setDefense(pool.defense - 1)">−</button>
          <button type="button" class="step" :disabled="pool.defense >= pool.total" aria-label="One more defending" @click="setDefense(pool.defense + 1)">+</button>
        </span>
      </p>
      <p class="line-row">
        <span>{{ info.level < 2 ? 'Drones mine once the Mine stands.' : shipMiners ? shipMiners + ' mining drones aboard your ship' : '' }}</span>
        <span class="split">
          <button v-if="landable" type="button" class="k-quiet" @click="landDrones">Land {{ landable }}</button>
          <button v-if="pool.total > 0" type="button" class="k-quiet" @click="boardDrones">Board all</button>
        </span>
      </p>
    </section>

    <section>
      <h3><span>The store</span><span class="k-meter">{{ player.freeBays }} free {{ player.freeBays === 1 ? 'hold' : 'holds' }} aboard</span></h3>
      <p v-if="!stored.length" class="k-none">The store is empty.</p>
      <p v-for="row in stored" :key="row.good" class="line-row">
        <span><b>{{ row.units }}</b> {{ row.name }}</span>
        <button v-if="player.freeBays > 0" type="button" class="k-quiet" @click="collect(row)">Load {{ Math.min(row.units, player.freeBays) }}</button>
      </p>
      <p v-if="aboard.length" class="aboard">
        <span>From your ship:</span>
        <button v-for="row in aboard" :key="row.good" type="button" class="k-quiet" @click="deliver(row)">Unload {{ row.units }} {{ row.short }}</button>
      </p>
    </section>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { yields } from '@orbiter8/sdk/belt-gen'
import { ASTEROID_STEPS, ASTEROID_BUILDING_NAMES } from '@orbiter8/sdk/contracts'
import { shortGoodName } from '@orbiter8/sdk/game/trade'
import { useUIStore } from '@/stores/ui'
import { useStarMapStore } from '@/stores/starmap'
import { usePlayerStore } from '@/stores/player'
import SmallIcon from '../small-icon.vue'

/** Each step's small icon, in the line's order (Platform, Mine, Port, Armory). */
const STEP_ICONS = ['platform', 'asteroidMine', 'port', 'armoryBuilt']

export default {
  name: 'AsteroidPanel',
  components: { SmallIcon },
  props: {
    objectId: { type: String, default: null },
    narrow: { type: Boolean, default: false }
  },
  data() {
    return { player: usePlayerStore() }
  },
  computed: {
    ...mapState(useUIStore, ['selected']),
    ...mapState(useStarMapStore, ['systemObjects']),
    asteroid() {
      const o = this.systemObjects[this.selected]
      if (o?.type === 'asteroid') return o
      if (o?.type === 'station' && o.onAsteroid) return this.systemObjects[o.orbiting]
      return null
    },
    info() {
      return this.asteroid?.info ?? null
    },
    pool() {
      return this.info?.pool ?? { total: 0, defense: 0, room: 0 }
    },
    goodNames() {
      return this.player.economy?.goods?.map((g) => g.name) ?? []
    },
    yieldsText() {
      return yields(this.asteroid.composition)
        .map((g) => shortGoodName(this.goodNames[g] ?? '', true))
        .join(' and ')
    },
    line() {
      return ASTEROID_STEPS.map((n, i) => ({ n, name: ASTEROID_BUILDING_NAMES[n], icon: STEP_ICONS[i] ?? 'build', done: this.info.level >= n }))
    },
    next() {
      const n = ASTEROID_STEPS.find((step) => step > this.info.level)
      if (n === undefined) return null
      return { n, name: ASTEROID_BUILDING_NAMES[n], cost: this.player.rules?.asteroidBuildings?.[n] }
    },
    /** What the next step needs, each with whether you have it, and how short you are if not. */
    needs() {
      const c = this.next?.cost
      if (!c) return []
      const list = [{ what: `${c.credits.toLocaleString('en-US')}¢`, ok: this.player.credits >= c.credits, short: `${(c.credits - this.player.credits).toLocaleString('en-US')}¢ short` }]
      if (c.people) list.push({ what: `${c.people} people`, ok: this.info.population >= c.people, short: `${c.people - this.info.population} more` })
      for (const [g, units] of c.goods) {
        const have = this.info.stock?.[g] ?? 0
        list.push({ what: `${units} ${shortGoodName(this.goodNames[g] ?? '', true)}`, ok: have >= units, short: `${units - have} more in the store` })
      }
      return list
    },
    canBuild() {
      return this.needs.length > 0 && this.needs.every((need) => need.ok)
    },
    shipPeople() {
      return this.player.ship?.colonists ?? 0
    },
    shipMiners() {
      return this.player.ship?.loadout?.miningDrones ?? 0
    },
    landable() {
      return Math.min(this.shipMiners, Math.max(0, this.pool.room - this.pool.total))
    },
    /** The ship's cargo, to unload into the store (building takes goods from it). */
    aboard() {
      return (this.player.cargo ?? [])
        .map((units, good) => ({ good, units, name: this.goodNames[good] ?? 'Good ' + good, short: shortGoodName(this.goodNames[good] ?? '', true) }))
        .filter((row) => row.units > 0)
    },
    stored() {
      return (this.info.stock ?? []).map((units, good) => ({ good, units, name: this.goodNames[good] ?? 'Good ' + good })).filter((row) => row.units > 0)
    }
  },
  methods: {
    readyWords(at) {
      const left = at - this.player.now / 1000
      return left > 60 ? `in ${Math.ceil(left / 60)} min` : 'any moment'
    },
    click() {
      this.o8audio?.playEffect('click')
    },
    build() {
      this.click()
      this.player.build(this.asteroid.objectId, this.next.n, this.asteroid.name)
    },
    landPeople() {
      this.click()
      this.player.land(this.asteroid.objectId, this.player.ship.colonists, this.asteroid.name)
    },
    landDrones() {
      if (!this.landable) return
      this.click()
      this.player.landDrones(this.asteroid.objectId, this.landable)
    },
    boardDrones() {
      this.click()
      this.player.boardDrones(this.asteroid.objectId, this.pool.total)
    },
    setDefense(n) {
      if (n < 0 || n > this.pool.total || n === this.pool.defense) return
      this.click()
      this.player.setDefenseDrones(this.asteroid.objectId, n)
    },
    deliver(row) {
      this.click()
      this.player.deliver(this.asteroid.objectId, row.good, row.units, row.name)
    },
    collect(row) {
      this.click()
      this.player.collect(this.asteroid.objectId, row.good, Math.min(row.units, this.player.freeBays), row.name)
    }
  }
}
</script>

<style src="../kit.css"></style>
<style scoped>
/* the line: what's built (lit), what's next (outlined), what's later (dashed: not there yet) */
.line {
  display: flex;
  gap: 8px;
}
.stage {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: #9088aa;
  font-size: 12px;
}
.stage i {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 1.5px dashed #5a4c8c;
  border-radius: 50%;
  color: #9088aa;
}
.stage.done {
  color: #ffffff;
}
.stage.done i {
  border: 0;
  background: var(--base);
  color: #1b1531;
}
.stage.next {
  color: #e6dcf5;
}
.stage.next i {
  border: 2px solid var(--accent);
  color: var(--accent);
}
.stage.building i {
  border: 2px dashed var(--accent);
  color: var(--accent);
}
/* what the next step needs: plain when you have it, light pink with how short when you don't */
.needs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 12px 0;
}
.needs span {
  padding: 5px 12px;
  border-radius: 14px;
  background: #ffffff12;
  color: #ffffff;
  font-size: 13px;
}
.needs span.short {
  border: 1.2px solid var(--o8-pink-light);
  background: none;
  color: var(--o8-pink-light);
}
.needs small {
  display: inline;
  margin-left: 6px;
  color: var(--o8-pink-light);
  font-size: 11.5px;
}
.line-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 40px;
  margin: 2px 0;
  color: #bdb5d4;
  font-size: 14px;
}
.line-row b {
  color: #ffffff;
}
.split {
  flex: none;
  display: flex;
  gap: 6px;
}
.step {
  width: 40px;
  height: 40px;
  padding: 0;
  border: 1.5px solid color-mix(in srgb, var(--base) 60%, transparent);
  border-radius: 50%;
  background: #ffffff10;
  color: #ffffff;
  font-size: 22px;
  line-height: 1;
}
.step:disabled {
  opacity: 0.35;
}
.aboard {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin: 8px 0 0;
  color: #9088aa;
  font-size: 13px;
}
</style>
