<template>
  <!-- The ship (docs/demo4-plan.md, milestone 4): what's fitted to its mounts and bays (D59), what's
       out of action, and the armories and yards at this star. -->
  <aside class="ship-panel">
    <header>
      <h3>{{ ship.name }}</h3>
      <button class="close" aria-label="Close" @click="$emit('close')">×</button>
    </header>

    <!-- The same drawing as the ship's NFT (ShipArt.sol); only numbers and fixed strings go in. -->
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div class="art" v-html="art" />

    <p v-if="condition?.retreated" class="alert">Retreated: repair at a shipyard before attacking again.</p>
    <p v-else-if="docked" class="sub">In the yard after repairs: ready {{ docked }}.</p>
    <p class="sub">
      Mounts {{ mounts }} of 6 · bays {{ ship.bays - galaxy.freeBays }} of {{ ship.bays }} used · range
      {{ Math.max(1, ship.range - ship.rangeLost)
      }}<template v-if="ship.rangeLost"> ({{ ship.rangeLost }} lost to damage)</template>
    </p>

    <table>
      <tbody>
        <tr v-for="row in fitted" :key="row.part">
          <td>{{ row.name }}</td>
          <td class="num">
            {{ row.count }}<span v-if="row.off" class="alert"> ({{ row.off }} out of action)</span>
          </td>
          <td class="sub">{{ row.space }}</td>
        </tr>
        <tr v-if="!fitted.length">
          <td class="sub">Nothing fitted: no weapons, armor or shields.</td>
        </tr>
        <tr v-if="ship.baysLost">
          <td class="alert">Damaged bays</td>
          <td class="num">{{ ship.baysLost }}</td>
          <td />
        </tr>
      </tbody>
    </table>

    <section v-for="shop in armories" :key="shop.port" class="shop">
      <h4>{{ shop.name }} · armory</h4>
      <p class="row">
        <select v-model.number="part" aria-label="Part">
          <option v-for="p in shipParts" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
        <input v-model.number="count" type="number" min="1" aria-label="How many" />
        <button
          class="o8-button small"
          :disabled="!count || galaxy.partPrice(shop.port, part, count) > galaxy.credits || Boolean(galaxy.busy)"
          @click="galaxy.buyParts(shop.port, part, count)"
        >
          Buy and fit · {{ galaxy.partPrice(shop.port, part, count || 0).toLocaleString() }}
        </button>
      </p>
    </section>

    <section v-for="yard in yards" :key="yard.port" class="shop">
      <h4>{{ yard.name }} · shipyard</h4>
      <button
        class="o8-button small"
        :disabled="galaxy.credits < 3000 || Boolean(galaxy.busy)"
        @click="galaxy.repair(yard.port)"
      >
        Repair everything · 3,000 (then 3 hours in the yard)
      </button>
    </section>
  </aside>
</template>

<script>
import { useGalaxyStore } from '@/stores/galaxy'
import { portNames } from '@/sdk/v4/market'
import { shipSvg } from '@/sdk/v4/ship-art'

// Parts that go aboard (Factory ids 0–6), their loadout field and the room each takes (D59).
const SHIP_PARTS = [
  { id: 3, field: 'railguns', off: 1, space: '2 mounts each' },
  { id: 4, field: 'missiles', off: 2, space: '2 mounts each' },
  { id: 2, field: 'pointDefense', off: 0, space: '1 mount each' },
  { id: 0, field: 'drones', off: 3, space: '2 bays each' },
  { id: 1, field: 'repairBots', off: 4, space: '5 bays each' },
  { id: 5, field: 'armor', space: '10 bays a level, up to 5' },
  { id: 6, field: 'shields', space: '20 bays a level, up to 3' }
]

export default {
  name: 'ShipPanel',
  emits: ['close'],
  data() {
    return { galaxy: useGalaxyStore(), part: 3, count: 1, now: Date.now() }
  },
  computed: {
    ship() {
      return this.galaxy.pilot.ship
    },
    condition() {
      return this.galaxy.condition
    },
    art() {
      const off = this.condition?.off ?? []
      return shipSvg(this.ship, Boolean(this.condition?.armorLost || off.some((n) => n > 0)))
    },
    docked() {
      const left = (this.condition?.dockedUntil ?? 0) - this.now / 1000
      return left > 0 ? `in ${Math.ceil(left / 60)} min` : null
    },
    mounts() {
      const l = this.ship.loadout
      return l.pointDefense + 2 * l.railguns + 2 * l.missiles
    },
    shipParts() {
      return SHIP_PARTS.map((p) => ({ ...p, name: this.galaxy.rules.parts[p.id].name }))
    },
    fitted() {
      const l = this.ship.loadout
      const off = this.condition?.off ?? []
      return this.shipParts
        .filter((p) => l[p.field] > 0)
        .map((p) => ({
          part: p.id,
          name: p.name,
          count: l[p.field],
          off: p.off === undefined ? 0 : off[p.off],
          space: p.space
        }))
    },
    /** Sol's I.S.S., and players' planets with an Armory, at this star. */
    armories() {
      const list = []
      if (this.galaxy.shipCell === 0) list.push({ port: 2, name: 'I.S.S.' })
      for (const p of this.galaxy.planets) {
        if (p.level >= 6 && p.owner) list.push({ port: p.id, name: portNames(p.id).station })
      }
      return list
    },
    yards() {
      return this.galaxy.ports.filter((p) => p.yard).map((p) => ({ port: p.port, name: portNames(p.port).station }))
    }
  },
  mounted() {
    this.clock = setInterval(() => (this.now = Date.now()), 30_000)
  },
  unmounted() {
    clearInterval(this.clock)
  }
}
</script>

<style scoped>
.ship-panel {
  position: absolute;
  left: 16px;
  top: 56px;
  max-height: calc(100% - 120px);
  width: min(92vw, 26em);
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
}
.sub {
  color: #c3b3da;
  font-size: 0.85em;
}
.alert {
  color: var(--o8-pink-light);
}
.art {
  width: 9em;
  margin: 0.3em auto;
}
.art :deep(svg) {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 8px;
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
.row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4em;
  align-items: center;
}
input,
select {
  font: inherit;
  color: #fff;
  background: #00000055;
  border: 1px solid #ffffff55;
  border-radius: 0.5em;
  padding: 0.2em 0.4em;
}
input {
  width: 3.5em;
}
.shop {
  border-top: 1px solid #c3b3da33;
  margin-top: 0.5em;
}
@media (max-width: 600px) and (orientation: portrait) {
  .ship-panel {
    left: 8px;
    right: 8px;
    width: auto;
    top: auto;
    max-height: 70vh;
    bottom: 64px;
  }
}
</style>
