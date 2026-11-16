<template>
  <!-- The trade menu (Koda, round 2, item 5): one row per good holding everything about it (its code
       and icon in its color, what the port does with it and at what price, the two-way slider, what
       you carry before and after, and what the line costs or pays), under the drawing of the port and
       your ship with every hold. Port on the left, ship on the right, in the drawing and on every
       slider. The port's letters (S sells, B buys), goods colors, the readouts' rules and Make Trade as
       the one strong button are kept (docs/color-guide.md, row C1). Mockup: mockups/round2/trade.svg. -->
  <div v-if="station" class="trade-panel" :class="{ narrow }">
    <header>
      <h2 :style="{ fontSize: titleSize + 'px' }">{{ station.name }}</h2>
      <p class="code">
        Port of Trade ·
        <span class="letters" :aria-label="'Trade code ' + code.map((c) => c.letter).join('')">
          <b v-for="c in code" :key="c.id" :class="{ wanted: c.wanted, none: c.letter === '-' }" :title="goodsNames[c.id]">{{ c.letter }}</b>
        </span>
        <small v-if="!narrow">· S sells, B buys<template v-if="code.some((c) => c.wanted)">, <em>B</em> buys what you carry</template></small>
      </p>
    </header>

    <!-- the port, what's changing hands, and your ship with every hold -->
    <trade-scene :station-key="objectId" :flows="flows" :holds="avatar.ship.holds" :segments="holdSegments" :narrow="narrow" />
    <p class="load">
      Cargo
      <template v-if="predictedHolds !== fullHolds">{{ fullHolds }} → </template><b>{{ predictedHolds }}</b> of {{ avatar.ship.holds }}
      {{ avatar.ship.holds === 1 ? 'hold' : 'holds' }}
    </p>

    <div class="table" role="table" aria-label="Goods">
      <div v-if="!narrow" class="row head" role="row">
        <span role="columnheader">Good</span>
        <span role="columnheader">Port</span>
        <span role="columnheader" class="flow">◂ sell to the port · buy for your ship ▸</span>
        <span role="columnheader" class="num">Aboard</span>
        <span role="columnheader" class="num">Credits</span>
      </div>
      <div v-for="row in rows" :key="row.id" class="row" :class="{ active: row.units !== 0, idle: !row.traded }" role="row">
        <span class="good" role="cell">
          <img v-if="row.icon" :src="row.icon" alt="" />
          <b class="tick" :style="{ color: row.color }">{{ row.code }}</b>
          <span class="name">{{ row.name }}</span>
        </span>
        <span class="port" role="cell">
          <template v-if="row.traded">
            <span :class="{ wanted: row.wanted }">{{ row.side === 'buy' ? 'Sells' : 'Buys' }} {{ row.stock.toLocaleString('en-US') }}</span>
            <small>{{ row.price.toLocaleString('en-US') }}&cent; each</small>
          </template>
          <small v-else>Not traded here</small>
        </span>
        <span class="flow" role="cell">
          <trade-slider
            v-if="row.traded"
            :value="row.units"
            :side="row.side"
            :max="row.max"
            :span="avatar.ship.holds"
            :label="(row.side === 'buy' ? 'Buy ' : 'Sell ') + row.name"
            @update:value="updateAmount(row.good, $event)"
          />
        </span>
        <span class="num aboard" role="cell">
          <template v-if="row.units">{{ row.aboard }} → <b>{{ row.aboard + row.units }}</b></template>
          <template v-else>{{ row.aboard }}</template>
        </span>
        <!-- costs are plain, gains yours, in yellow -->
        <span class="num credits" role="cell" :class="{ gain: row.credits > 0 }">
          <template v-if="row.credits">{{ row.credits > 0 ? '+' : '−' }}{{ Math.abs(row.credits).toLocaleString('en-US') }}&cent;</template>
        </span>
      </div>
      <p v-if="!rows.length" class="empty">This port isn't trading yet.</p>
    </div>

    <!-- readouts: plain text, no boxes, so Make Trade stands out (row C1) -->
    <div class="readouts" aria-live="polite">
      <span>Balance <b>{{ avatar.credits.toLocaleString('en-US') }}&cent;</b></span>
      <span v-if="currentBalance < 0">Pay <b>{{ Math.abs(currentBalance).toLocaleString('en-US') }}&cent;</b></span>
      <span v-else-if="currentBalance > 0" class="gain">Gain ↑ {{ currentBalance.toLocaleString('en-US') }}&cent;</span>
      <span v-else-if="!nothingToTrade">Even trade</span>
      <!-- can't afford: it needs you, so pink (light pink text, outlined; row A1) -->
      <span v-if="avatar.credits + currentBalance < 0" class="short">Insufficient funds</span>
      <span v-else-if="currentBalance !== 0">After <b>{{ (avatar.credits + currentBalance).toLocaleString('en-US') }}&cent;</b></span>
    </div>
    <div class="go">
      <button type="button" class="make" :disabled="!isValidTrade || pending" @click="doTrade">
        {{ pending ? 'Trading…' : 'Make Trade' }}
      </button>
      <button v-if="!nothingToTrade && !pending" type="button" class="clear" @click="amounts = {}">Clear</button>
    </div>
  </div>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import { clampTradeAmount, emptyHoldsAfterTrade, isEmptyTrade, isValidTrade, lineValue, maxTradable, tradeBalance } from '@orbiter8/sdk/game/trade'
import { useGameStateStore } from '@/stores/gamestate'
import { useStarMapStore } from '@/stores/starmap'
import { useUIStore } from '@/stores/ui'
import { goodColor, TEXT_2, TEXT_3 } from '@/libs/palette'
import { goodCode, goodIcon, otherHolds, portCode } from '@/libs/goods'
import { fitSize } from '@/libs/fit-text'
import TradeSlider from './trade-slider.vue'
import TradeScene from './trade-scene.vue'

export default {
  name: 'TradePanel',
  components: { TradeSlider, TradeScene },
  props: {
    /** The selected station's key (sdk/system.js objectKey). */
    objectId: { type: String, default: null },
    /** A phone: each row on two lines. */
    narrow: { type: Boolean, default: false }
  },
  data() {
    return {
      /** What the player is trading: units by good id (negative sells). */
      amounts: {},
      pending: false
    }
  },
  computed: {
    ...mapState(useStarMapStore, ['systemObjects']),
    ...mapState(useGameStateStore, ['avatar', 'goods']),
    station() {
      const object = this.systemObjects[this.objectId]
      return object?.type === 'station' ? object : null
    },
    titleSize() {
      return fitSize(this.station.name, 26, this.narrow ? 300 : 520)
    },
    goodsNames() {
      return this.goods ?? []
    },
    /** The station's goods (sdk/game/trade.js StationGood). */
    stationGoods() {
      return this.station.goods
    },
    cargo() {
      return this.avatar.ship.cargo ?? []
    },
    code() {
      return portCode(this.stationGoods, this.goodsNames.length, this.cargo)
    },
    /** Every good the port trades, then any aboard it doesn't, in the Market's order: each in its place. */
    rows() {
      const traded = new Map(this.stationGoods.filter((good) => good.mode === 'sells' || good.mode === 'buys').map((good) => [good.id, good]))
      return this.goodsNames
        .map((name, id) => {
          const good = traded.get(id)
          const aboard = this.cargo[id] ?? 0
          if (!good && !aboard) return null
          const units = good ? this.amountOf(good) : 0
          return {
            id,
            good,
            name,
            code: goodCode(id, name),
            icon: goodIcon(id),
            color: goodColor(id),
            traded: Boolean(good),
            side: good?.mode === 'buys' ? 'sell' : 'buy',
            stock: good?.stock ?? 0,
            price: good?.price ?? 0,
            // a port buying what you carry: good for you (yellow, as the port code's B)
            wanted: good?.mode === 'buys' && aboard > 0,
            aboard,
            units,
            max: good ? this.allowed(good) : 0,
            credits: good && units ? (units > 0 ? -lineValue(good, units) : lineValue(good, units)) : 0
          }
        })
        .filter(Boolean)
        .sort((a, b) => Number(b.traded) - Number(a.traded))
    },
    /** What's changing hands, for the drawing: one arrow per good. */
    flows() {
      return this.rows
        .filter((row) => row.units)
        .map((row) => ({ id: row.id, code: row.code, color: row.color, units: row.units }))
    },
    /** The holds after the trade, in order: what stays, what comes aboard, what leaves, empty. */
    holdSegments() {
      const segments = []
      const names = this.goodsNames
      names.forEach((name, id) => {
        const before = this.cargo[id] ?? 0
        const units = this.amounts[id] ?? 0
        const stays = Math.max(0, before + Math.min(0, units))
        if (stays) segments.push({ count: stays, color: goodColor(id), kind: 'full' })
        if (units > 0) segments.push({ count: units, color: goodColor(id), kind: 'incoming' })
      })
      // colonists (100 to a hold, D57), fitted parts and lost holds stay as they are
      const { colonists, other } = otherHolds(this.avatar.ship)
      if (colonists) segments.push({ count: colonists, color: TEXT_2, kind: 'full' })
      if (other) segments.push({ count: other, color: TEXT_3, kind: 'full' })
      names.forEach((name, id) => {
        const units = this.amounts[id] ?? 0
        if (units < 0) segments.push({ count: -units, color: goodColor(id), kind: 'outgoing' })
      })
      return segments
    },
    /** Credits gained by the trade (negative = paid). */
    currentBalance() {
      return tradeBalance(this.amounts, this.stationGoods)
    },
    fullHolds() {
      return this.avatar.ship.usedHolds
    },
    predictedEmptyHolds() {
      return emptyHoldsAfterTrade(this.avatar.ship, this.amounts)
    },
    predictedHolds() {
      return this.avatar.ship.holds - this.predictedEmptyHolds
    },
    isValidTrade() {
      return isValidTrade({ credits: this.avatar.credits, ship: this.avatar.ship, amounts: this.amounts, goods: this.stationGoods })
    },
    nothingToTrade() {
      return isEmptyTrade(this.amounts)
    },
    /** The cargo aboard, for noticing a trade went through. */
    cargoNow() {
      return this.cargo.join(',')
    }
  },
  watch: {
    // Done: the menu closes, as it always has once the trade lands.
    cargoNow(now, before) {
      if (now !== before) this.closeMenu()
    }
  },
  methods: {
    ...mapActions(useGameStateStore, ['tradeAtPort']),
    ...mapActions(useUIStore, ['closeMenu']),
    amountOf(good) {
      return this.amounts[good.id] ?? 0
    },
    allowed(good) {
      return maxTradable(good, this.cargo[good.id] ?? 0, this.predictedEmptyHolds + this.amountOf(good))
    },
    updateAmount(good, value) {
      const next = clampTradeAmount(value, this.amountOf(good), this.predictedEmptyHolds)
      this.amounts = { ...this.amounts, [good.id]: next }
    },
    async doTrade() {
      this.o8audio.playEffect('click')
      this.pending = true
      const planetId = this.systemObjects[this.station.orbiting].id
      const traded = await this.tradeAtPort({ planetId, amounts: this.amounts })
      // Done: start the next trade from the new cargo. Failed or declined: the same amounts, to try
      // again (the transaction tray says why).
      if (traded) this.amounts = {}
      this.pending = false
    }
  }
}
</script>

<style scoped>
.trade-panel {
  --gap: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-sizing: border-box;
  width: min(760px, calc(100vw - 40px));
  padding: 18px 22px 20px;
  color: #f1eefa;
  font-size: 14px;
  text-align: left;
}
header {
  /* room for the sheet's close button at the top right */
  padding: 0 44px;
  text-align: center;
}
h2 {
  margin: 0;
  color: #ffffffaa;
  font-weight: normal;
  white-space: nowrap;
}
.code {
  margin: 4px 0 0;
  color: #c3b3da;
  font-size: 13px;
}
.letters {
  font-family: 'Ubuntu Mono', ui-monospace, monospace;
  letter-spacing: 2px;
}
.letters b {
  color: #f1eefa;
}
.letters b.none {
  color: #9088aa;
}
/* a port buying what you carry: yours, good for you */
.letters b.wanted,
.code em,
.wanted {
  color: var(--o8-yellow-light);
  font-style: normal;
}
.load {
  margin: -4px 0 4px;
  color: #bdb5d4;
  font-size: 12px;
  text-align: center;
}
.load b {
  color: #f1eefa;
  font-weight: normal;
}
.table {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.row {
  display: grid;
  grid-template-columns: 172px 104px minmax(0, 1fr) 64px 76px;
  align-items: center;
  gap: var(--gap);
  min-height: 44px;
  padding: 0 8px;
  border-radius: 8px;
}
.row.head {
  min-height: 0;
  padding-bottom: 6px;
  border-bottom: 1px solid #5a4c8c;
  border-radius: 0;
  color: #c3b3da;
  font-size: 12px;
}
.row.head .flow {
  text-align: center;
}
.row.active {
  background: #302651;
}
.row.idle {
  opacity: 0.75;
}
.good {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}
.good img {
  flex: none;
  width: 22px;
  height: 22px;
}
.tick {
  flex: none;
  width: 34px;
  font-family: 'Ubuntu Mono', ui-monospace, monospace;
  font-size: 14px;
}
.name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.port {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
}
.port small {
  color: #bdb5d4;
  font-size: 12px;
}
.num {
  text-align: right;
  white-space: nowrap;
}
.aboard b {
  font-weight: bold;
}
.credits {
  color: #f1eefa;
}
.credits.gain {
  color: var(--o8-yellow-light);
  font-weight: bold;
}
.empty {
  margin: 12px 0;
  color: #bdb5d4;
  text-align: center;
}
.readouts {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px 26px;
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid #5a4c8c;
  color: #bdb5d4;
}
.readouts b {
  color: #f1eefa;
  font-weight: normal;
}
.readouts .gain {
  color: var(--o8-yellow-light);
  font-weight: bold;
}
.readouts .short {
  padding: 0 8px;
  border: 1.2px solid var(--o8-pink-light);
  border-radius: 4px;
  color: var(--o8-pink-light);
}
.go {
  position: relative;
  display: flex;
  justify-content: center;
  margin-top: 6px;
}
/* the menu's main action: the strongest purple (BRAND_500, BRAND_300 border; row C1) */
.make {
  min-width: 260px;
  height: 44px;
  border: 1px solid #b9a0ff;
  border-radius: 8px;
  background: #7b4fe6;
  color: #ffffff;
  font: inherit;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
}
.make:hover:not(:disabled) {
  background: #8b5cf6;
}
.make:disabled {
  border-color: #b9a0ff55;
  background: #7b4fe655;
  color: #ffffff66;
  cursor: default;
}
.make:focus-visible,
.clear:focus-visible {
  outline: 2.5px solid var(--o8-brand-300);
  outline-offset: 3px;
}
.clear {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  padding: 6px 12px;
  border: 1px solid #5a4c8c;
  border-radius: 8px;
  background: none;
  color: #c3b3da;
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}
.clear:hover {
  background: #302651;
  color: #ffffff;
}

/* a phone: each row on two lines, the slider under its good */
.narrow {
  width: 100%;
  padding: 12px 10px 14px;
}
.narrow header {
  padding: 0 8px;
}
.narrow .row {
  grid-template-columns: minmax(0, 1fr) auto auto;
  grid-template-areas:
    'good port aboard'
    'flow flow credits';
  gap: 0 10px;
  padding: 6px 6px 2px;
}
.narrow .good {
  grid-area: good;
}
.narrow .port {
  grid-area: port;
  flex-direction: row;
  gap: 6px;
  align-items: baseline;
  font-size: 13px;
}
.narrow .flow {
  grid-area: flow;
}
.narrow .aboard {
  grid-area: aboard;
  font-size: 13px;
}
.narrow .credits {
  grid-area: credits;
  min-width: 56px;
  font-size: 13px;
}
.narrow .row.idle {
  padding-bottom: 6px;
}
.narrow .make {
  min-width: 200px;
}
.narrow .readouts {
  gap: 4px 14px;
  font-size: 13px;
}
.narrow .go {
  justify-content: flex-start;
  padding-left: 8px;
}
</style>
