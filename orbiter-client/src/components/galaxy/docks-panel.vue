<template>
  <!-- The ports at the ship's star (docs/demo4-plan.md, milestone 2): what each sells and buys, at what
       price, and the yard's bays and range. Prices move with every unit, so the button shows the total. -->
  <aside class="docks">
    <header>
      <h3>Docks · {{ starName }}</h3>
      <button class="close" aria-label="Close" @click="$emit('close')">×</button>
    </header>

    <ul class="ports">
      <li v-for="p in galaxy.ports" :key="p.port">
        <button :class="{ chosen: p.port === chosen?.port }" @click="choose(p)">
          <span class="station">{{ names(p.port).station }}</span>
          <span class="planet">{{ names(p.port).planet }} · {{ className(p.class) }}</span>
          <span class="tags">
            <span v-if="buysWhatYouCarry(p)" class="wants" title="Buys something you carry">B</span>
            <span v-if="p.yard" class="yard" title="Shipyard">Yard</span>
          </span>
        </button>
      </li>
    </ul>

    <section v-if="chosen" class="port">
      <table>
        <tbody>
          <tr v-for="row in rows" :key="row.good">
            <td class="good">
              {{ row.name }}
              <span class="carry">{{ row.carry ? `${row.carry} aboard` : '' }}</span>
            </td>
            <td class="price">
              {{ row.price.toLocaleString() }}
              <span class="unit">{{ row.selling ? 'to buy' : 'paid' }}</span>
            </td>
            <td class="stock" :title="`${row.room} units ${row.selling ? 'in stock' : 'wanted'}`">
              <span class="bar"><span :style="{ width: row.fill + '%' }" /></span>
            </td>
            <td class="act">
              <input
                v-model.number="amounts[row.good]"
                type="number"
                min="0"
                :max="row.max"
                inputmode="numeric"
                :aria-label="`Units of ${row.name}`"
              />
              <button
                class="o8-button small"
                :class="{ profit: !row.selling }"
                :disabled="!row.amount || row.amount > row.max || Boolean(galaxy.busy)"
                @click="tradeOne(row)"
              >
                {{ row.selling ? 'Buy' : 'Sell' }}
                <template v-if="row.amount && row.amount <= row.max"> · {{ row.total.toLocaleString() }}</template>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <button v-if="sellAll.length" class="o8-button profit" :disabled="Boolean(galaxy.busy)" @click="sellEverything">
        Sell everything this port buys · {{ sellAllTotal.toLocaleString() }}
      </button>

      <div v-if="chosen.yard" class="yard-shop">
        <h4>Shipyard</h4>
        <p>
          Bays {{ galaxy.pilot.ship.bays }} of 250
          <template v-if="galaxy.pilot.ship.bays < 250">
            · add
            <input
              v-model.number="bays"
              type="number"
              min="1"
              :max="250 - galaxy.pilot.ship.bays"
              aria-label="Bays to add"
            />
            <button
              class="o8-button small"
              :disabled="
                !bays || bays + galaxy.pilot.ship.bays > 250 || baysCost > galaxy.credits || Boolean(galaxy.busy)
              "
              @click="galaxy.buyBays(chosen, bays)"
            >
              Fit · {{ baysCost.toLocaleString() }}
            </button>
          </template>
        </p>
        <p>
          Range {{ galaxy.pilot.ship.range }}
          <template v-if="rangeCost !== null">
            <button
              class="o8-button small"
              :disabled="rangeCost > galaxy.credits || Boolean(galaxy.busy)"
              @click="galaxy.buyRange(chosen)"
            >
              Upgrade to {{ galaxy.pilot.ship.range + 1 }} · {{ rangeCost.toLocaleString() }}
            </button>
          </template>
          <template v-else> · fully upgraded</template>
        </p>
      </div>
    </section>
  </aside>
</template>

<script>
import { useGalaxyStore } from '@/stores/galaxy'
import { MODE, portNames } from '@/sdk/v4/market'
import { planetTypeName } from '@/sdk/game/planet-types'
import { starTraits } from '@/sdk/v4/traits'

export default {
  name: 'DocksPanel',
  emits: ['close'],
  data() {
    return { galaxy: useGalaxyStore(), chosenPort: null, amounts: {}, bays: 10 }
  },
  computed: {
    starName() {
      const cell = this.galaxy.shipCell
      return this.galaxy.names[cell] ?? starTraits(this.galaxy.universe.seed, cell).name
    },
    chosen() {
      return this.galaxy.ports.find((p) => p.port === this.chosenPort) ?? this.galaxy.ports[0] ?? null
    },
    rows() {
      const port = this.chosen
      const { goods, capacity } = this.galaxy.economy
      return port.quotes
        .map((q, good) => ({ q, good }))
        .filter(({ q }) => q.mode !== MODE.NONE)
        .map(({ q, good }) => {
          const selling = q.mode === MODE.SELLS
          const max = selling ? this.galaxy.maxBuy(port, good) : this.galaxy.maxSell(port, good)
          const amount = this.amounts[good] ?? 0
          const room = capacity - q.shortfall
          return {
            good,
            name: goods[good].name,
            selling,
            price: q.price,
            room,
            fill: Math.round((100 * room) / capacity),
            carry: this.galaxy.cargo[good] ?? 0,
            max,
            amount,
            total: amount && amount <= max ? this.galaxy.lineValue(port, good, selling ? amount : -amount) : 0
          }
        })
        .sort((a, b) => Number(a.selling) - Number(b.selling))
    },
    sellAll() {
      return this.rows.filter((r) => !r.selling && Math.min(r.carry, r.room) > 0)
    },
    sellAllTotal() {
      return this.sellAll.reduce(
        (sum, r) => sum + this.galaxy.lineValue(this.chosen, r.good, -Math.min(r.carry, r.room)),
        0
      )
    },
    baysCost() {
      return this.bays > 0 ? this.galaxy.baysQuote(this.bays) : 0
    },
    rangeCost() {
      return this.galaxy.rangeQuote()
    }
  },
  watch: {
    // Fresh defaults whenever the port or the ship's state changes: as much as can be bought or sold.
    rows: {
      immediate: true,
      handler(rows, old) {
        const portChanged = !old || old.length !== rows.length || old[0]?.good !== rows[0]?.good
        for (const r of rows) {
          if (portChanged || !(r.good in this.amounts) || this.amounts[r.good] > r.max) this.amounts[r.good] = r.max
        }
      }
    }
  },
  methods: {
    names: portNames,
    className: planetTypeName,
    choose(p) {
      this.chosenPort = p.port
      this.amounts = {}
    },
    buysWhatYouCarry(p) {
      return p.quotes.some((q, good) => q.mode === MODE.BUYS && (this.galaxy.cargo[good] ?? 0) > 0)
    },
    async tradeOne(row) {
      const units = row.selling ? row.amount : -row.amount
      if (await this.galaxy.trade(this.chosen, [{ good: row.good, units }])) this.amounts = {}
    },
    async sellEverything() {
      const lines = this.sellAll.map((r) => ({ good: r.good, units: -Math.min(r.carry, r.room) }))
      if (await this.galaxy.trade(this.chosen, lines)) this.amounts = {}
    }
  }
}
</script>

<style scoped>
.docks {
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
.close {
  font: inherit;
  font-size: 1.5em;
  line-height: 1;
  color: #c3b3da;
  background: none;
  border: none;
  cursor: pointer;
}
.ports {
  list-style: none;
  margin: 0.6em 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(8.5em, 1fr));
  gap: 0.4em;
}
.ports button {
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
.ports button.chosen {
  border-color: #fff;
  background: #3a1a66cc;
}
.station {
  font-weight: 500;
}
.planet {
  font-size: 0.8em;
  color: #c3b3da;
}
.tags {
  display: flex;
  gap: 0.3em;
  min-height: 1.1em;
  font-size: 0.75em;
}
.wants {
  color: var(--o8-yellow-light);
  font-weight: 700;
}
.yard {
  color: #c3b3da;
  border: 1px solid #c3b3da66;
  border-radius: 4px;
  padding: 0 0.3em;
}
table {
  width: 100%;
  border-collapse: collapse;
}
td {
  padding: 0.3em 0.2em;
  border-top: 1px solid #c3b3da22;
  vertical-align: middle;
}
.good {
  color: #fff;
  text-align: left;
}
.carry,
.unit {
  display: block;
  font-size: 0.75em;
  color: #c3b3da;
}
.price {
  text-align: right;
  white-space: nowrap;
}
.stock {
  width: 3.5em;
}
.bar {
  display: block;
  height: 0.4em;
  background: #ffffff1a;
  border-radius: 1em;
  overflow: hidden;
}
.bar span {
  display: block;
  height: 100%;
  background: #c3b3da;
}
.act {
  display: flex;
  gap: 0.3em;
  justify-content: flex-end;
}
input {
  width: 3.6em;
  font: inherit;
  color: #fff;
  background: #00000055;
  border: 1px solid #ffffff55;
  border-radius: 0.5em;
  padding: 0.2em 0.4em;
}
.o8-button.profit:not(:disabled) {
  background: var(--o8-yellow-light);
  color: #1c0838;
  border-color: transparent;
}
.port > .o8-button {
  width: 100%;
  margin-top: 0.6em;
}
.yard-shop p {
  margin: 0.4em 0 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4em;
  align-items: center;
}
@media (max-width: 600px) and (orientation: portrait) {
  .docks {
    left: 8px;
    right: 8px;
    width: auto;
    top: auto;
    max-height: 70vh;
    bottom: 64px;
  }
}
</style>
