<template>
  <!-- A station's shipyards (Koda, 2026-11-21: the first menu rebuilt to the screen standard,
       docs/ui-guide.md section 11): more cargo holds or drone bays for your ship, and longer-range
       engines. Each thing you can buy shows its price, whether you can afford it and what you'd have
       left. Buttons take the menu's own color (the station's), not the brand purple, which clashed
       with this background. -->
  <div v-if="station" class="yards-panel" :class="{ narrow }">
    <header>
      <span class="title">
        <small-icon name="yards" />
        <span><b>Shipyards</b><small>{{ station.name }}</small></span>
      </span>
      <span class="balance"><small>You have</small><b>{{ credits(avatar.credits) }}¢</b></span>
    </header>

    <!-- the ship in the yard, every hold drawn; the ones you're adding in yellow -->
    <svg class="scene" viewBox="-150 -92 300 172" font-family="Ubuntu, sans-serif" aria-hidden="true">
      <ship-upgrade :cargo-holds="ship.holds + cargoToBuy" :predicted-load="ship.holds" :existing-load="ship.holds" :segments="holdSegments" />
    </svg>

    <section>
      <h3>Room aboard</h3>
      <div class="kinds" role="tablist" aria-label="What to fit">
        <button v-for="kind in KINDS" :key="kind.key" type="button" role="tab" class="kind" :class="{ on: kind.key === bayKind }" :aria-selected="kind.key === bayKind ? 'true' : 'false'" @click="chooseKind(kind.key)">
          <small-icon :name="kind.icon" />
          <span><b>{{ kind.label }}</b><small>{{ kind.key === 'drone' ? droneBays : ship.holds }} fitted</small></span>
        </button>
      </div>

      <p v-if="shipMax <= 0" class="line">Your ship has all the room it can take.</p>
      <template v-else>
        <div class="buy">
          <div class="stepper">
            <button type="button" class="step" :disabled="count <= 0" :aria-label="'One fewer'" @click="step(-1)">−</button>
            <output aria-live="polite">{{ count }}</output>
            <button type="button" class="step" :disabled="count >= maxAffordable" :aria-label="'One more'" @click="step(1)">+</button>
          </div>
          <div class="sums">
            <p>
              <span>{{ count ? 'Cost' : 'Next one' }}</span>
              <b>{{ credits(count ? totalCost : costOf(1)) }}¢</b>
            </p>
            <p v-if="count">
              <span>Left after</span>
              <b>{{ credits(avatar.credits - totalCost) }}¢</b>
            </p>
            <p v-else-if="maxAffordable > 0" class="quiet">
              <span>You can afford</span>
              <b>{{ maxAffordable }}</b>
            </p>
            <p v-else class="needs">
              <span>Can't afford one</span>
              <b>{{ credits(costOf(1) - avatar.credits) }}¢ short</b>
            </p>
          </div>
        </div>
        <p class="hint">Each one costs more than the last.</p>
      </template>
    </section>

    <section>
      <h3>Engines</h3>
      <div class="engines">
        <img :src="engineArt" alt="" />
        <div class="range">
          <span class="pips" :aria-label="'Jump range ' + range + ' of ' + MAX_RANGE">
            <i v-for="n in MAX_RANGE" :key="n" :class="{ on: n <= range, next: rangePrice != null && n === range + 1 }" />
          </span>
          <b>Jump range {{ range }} of {{ MAX_RANGE }}</b>
          <small v-if="rangePrice == null">As far as engines go.</small>
          <small v-else-if="canRange">Range {{ range + 1 }} for {{ credits(rangePrice) }}¢</small>
          <small v-else class="needs">Range {{ range + 1 }} is {{ credits(rangePrice) }}¢: {{ credits(rangePrice - avatar.credits) }}¢ short</small>
        </div>
        <button v-if="rangePrice != null" type="button" class="quiet-button" :disabled="!canRange || pending" @click="upgradeRange">
          <small-icon name="jump" />Upgrade
        </button>
      </div>
    </section>

    <!-- the screen's one main action -->
    <footer>
      <button type="button" class="main" :disabled="!count || pending" @click="fit">
        <span class="main-well"><small-icon :name="bayKind === 'drone' ? 'drones' : 'port'" /></span>
        {{ pending ? 'Fitting…' : count ? `Fit ${count} ${noun(count)}` : 'Fit ' + noun(2) }}
      </button>
      <span v-if="count" class="total">{{ credits(totalCost) }}¢</span>
    </footer>
  </div>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import { MAX_CARGO_HOLDS } from '@orbiter8/sdk/game/trade'
import { goodColor, TEXT_2, TEXT_3, YELLOW_LIGHT } from '@/libs/palette'
import { shipHolds } from '@/libs/goods'
import { useGameStateStore } from '@/stores/gamestate'
import { useStarMapStore } from '@/stores/starmap'
import { usePlayerStore } from '@/stores/player'
import ShipUpgrade from '@/components/star-map/hud/menus/_trade-menu/ship-upgrade.svg'
import engineArt from '@/assets/art/engine-range.svg'
import SmallIcon from '../small-icon.vue'

/** The engines' longest range (Market.sol). */
const MAX_RANGE = 4

export default {
  name: 'YardsPanel',
  components: { ShipUpgrade, SmallIcon },
  props: {
    /** The selected station's key. */
    objectId: { type: String, default: null },
    /** A phone. */
    narrow: { type: Boolean, default: false }
  },
  data() {
    return {
      count: 0,
      bayKind: 'cargo',
      KINDS: [
        { key: 'cargo', label: 'Cargo holds', icon: 'port' },
        { key: 'drone', label: 'Drone bays', icon: 'drones' }
      ],
      pending: false,
      player: usePlayerStore(),
      engineArt,
      MAX_RANGE
    }
  },
  computed: {
    ...mapState(useStarMapStore, ['systemObjects']),
    ...mapState(useGameStateStore, ['avatar']),
    station() {
      return this.objectId != null ? this.systemObjects[this.objectId] : null
    },
    ship() {
      return this.avatar.ship
    },
    range() {
      return this.player.ship?.range ?? 1
    },
    droneBays() {
      return this.player.ship?.droneBays ?? 0
    },
    /** The ship's holds as they'd be: its cargo, its empty holds, then the holds being bought (yours, yellow). */
    holdSegments() {
      const ship = this.ship
      return [
        ...shipHolds(ship, goodColor, { text2: TEXT_2, text3: TEXT_3 }),
        { count: Math.max(0, ship.holds - ship.usedHolds), kind: 'empty' },
        { count: this.cargoToBuy, color: YELLOW_LIGHT, kind: 'added' }
      ]
    },
    /** Cargo holds being bought (drawn in the ship's picture); none while buying drone bays. */
    cargoToBuy() {
      return this.bayKind === 'cargo' ? this.count : 0
    },
    totalCost() {
      return this.costOf(this.count)
    },
    /** Bays this ship can still add before reaching the contract's maximum (cargo and drone together). */
    shipMax() {
      return MAX_CARGO_HOLDS - this.ship.holds - this.droneBays
    },
    /** How many more the pilot's credits cover. */
    maxAffordable() {
      let n = this.shipMax
      while (n > 0 && this.costOf(n) > this.avatar.credits) n--
      return n
    },
    rangePrice() {
      return this.player.rangeQuote()
    },
    canRange() {
      return this.rangePrice != null && this.avatar.credits >= this.rangePrice
    }
  },
  methods: {
    ...mapActions(useGameStateStore, ['addHoldsToShip']),
    credits(n) {
      return Math.round(n).toLocaleString('en-US')
    },
    noun(n) {
      return this.bayKind === 'drone' ? (n === 1 ? 'drone bay' : 'drone bays') : n === 1 ? 'hold' : 'holds'
    },
    /** Each one costs more the more a ship has (Market.sol baysCost). */
    costOf(count) {
      return count <= 0 ? 0 : this.player.baysQuote(count)
    },
    chooseKind(kind) {
      this.o8audio?.playEffect('click')
      this.bayKind = kind
      this.count = Math.min(this.count, this.maxAffordable)
    },
    step(by) {
      this.count = Math.max(0, Math.min(this.maxAffordable, this.count + by))
    },
    async fit() {
      if (!this.count) return
      this.o8audio?.playEffect('click')
      this.pending = true
      const port = this.station.id
      const bought = this.bayKind === 'drone' ? await this.player.buyDroneBays(port, this.count) : await this.addHoldsToShip({ planetId: port, amount: this.count })
      if (bought) this.count = 0
      this.pending = false
    },
    async upgradeRange() {
      this.o8audio?.playEffect('click')
      this.pending = true
      const upgraded = await this.player.buyRange(this.station.id)
      if (upgraded) this.o8audio?.speak('upgraded')
      this.pending = false
    }
  }
}
</script>

<style scoped>
.yards-panel {
  width: min(560px, calc(100vw - 60px));
  box-sizing: border-box;
  padding: 18px 22px 20px;
  color: #e6dcf5;
  text-align: left;
}
.yards-panel.narrow {
  width: calc(100vw - 34px);
  padding: 14px 14px 16px;
}
header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  /* (clear of the sheet's close button on wide screens) */
  padding-right: 52px;
}
.narrow header {
  padding-right: 0;
}
.title {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  color: var(--accent);
}
.title .small-icon {
  flex: none;
  width: 34px;
  height: 34px;
}
.title b {
  display: block;
  color: #ffffff;
  font-size: 24px;
  font-weight: normal;
  line-height: 1.1;
}
small {
  display: block;
  color: #bdb5d4;
  font-size: 12.5px;
}
.balance {
  flex: none;
  text-align: right;
}
.balance b {
  color: #ffffff;
  font-size: 19px;
  font-weight: normal;
}
.scene {
  display: block;
  width: 100%;
  max-height: 190px;
  margin: 10px 0 2px;
}
section {
  margin-top: 14px;
}
h3 {
  margin: 0 0 10px;
  padding-bottom: 5px;
  border-bottom: 1px solid #ffffff1f;
  color: var(--accent);
  font-size: 11px;
  letter-spacing: 1.3px;
  text-transform: uppercase;
}
button {
  font: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
button:disabled {
  cursor: default;
}
button:focus-visible {
  outline: 2.5px solid var(--o8-brand-300);
  outline-offset: 2px;
}
/* what to fit: two tabs (squares: a way, not an action) */
.kinds {
  display: flex;
  gap: 10px;
}
.kind {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  height: 52px;
  padding: 0 12px;
  border: 1.2px solid color-mix(in srgb, var(--base) 45%, transparent);
  border-radius: 12px;
  background: #ffffff0a;
  color: #e6dcf5;
  text-align: left;
}
.kind:hover {
  border-color: var(--accent);
}
.kind.on {
  border: 2.2px solid var(--accent);
  background: #ffffff1c;
  color: #ffffff;
}
.kind b {
  display: block;
  font-size: 15px;
  font-weight: 500;
}
.buy {
  display: flex;
  align-items: center;
  gap: 22px;
  margin-top: 14px;
}
.stepper {
  flex: none;
  display: flex;
  align-items: center;
  gap: 6px;
}
.step {
  width: 44px;
  height: 44px;
  padding: 0;
  border: 1.5px solid color-mix(in srgb, var(--base) 60%, transparent);
  border-radius: 50%;
  background: #ffffff10;
  color: #ffffff;
  font-size: 24px;
  line-height: 1;
}
.step:hover:not(:disabled) {
  border-color: var(--accent);
  background: #ffffff22;
}
.step:disabled {
  opacity: 0.35;
}
output {
  min-width: 56px;
  color: #ffffff;
  font-size: 30px;
  text-align: center;
}
.sums {
  flex: 1;
  min-width: 0;
}
.sums p {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin: 0;
  font-size: 14px;
  line-height: 24px;
}
.sums span {
  color: #bdb5d4;
}
.sums b {
  color: #ffffff;
}
.quiet b {
  color: #e6dcf5;
  font-weight: normal;
}
/* can't afford: light pink, said in words (pink needs you) */
.needs,
.needs span,
.needs b,
small.needs {
  color: var(--o8-pink-light);
}
.hint,
.line {
  margin: 8px 0 0;
  color: #9088aa;
  font-size: 12.5px;
}
.engines {
  display: flex;
  align-items: center;
  gap: 14px;
}
.engines img {
  flex: none;
  width: 52px;
  height: 52px;
}
.range {
  flex: 1;
  min-width: 0;
}
.range b {
  display: block;
  color: #ffffff;
  font-size: 15px;
  font-weight: 500;
}
.pips {
  display: flex;
  gap: 5px;
  margin-bottom: 5px;
}
.pips i {
  width: 26px;
  height: 7px;
  border: 1px solid color-mix(in srgb, var(--base) 70%, transparent);
  border-radius: 4px;
}
.pips i.on {
  border-color: var(--accent);
  background: var(--accent);
}
/* the next step: not there yet */
.pips i.next {
  border-style: dashed;
  border-color: var(--accent);
}
/* a second action: outlined in the menu's color */
.quiet-button {
  flex: none;
  display: flex;
  align-items: center;
  gap: 6px;
  height: 44px;
  padding: 0 18px 0 12px;
  border: 1.5px solid var(--accent);
  border-radius: 22px;
  background: #ffffff10;
  color: #ffffff;
  font-size: 15px;
  font-weight: bold;
}
.quiet-button:hover:not(:disabled) {
  background: #ffffff26;
}
.quiet-button:disabled {
  border-color: color-mix(in srgb, var(--base) 45%, transparent);
  color: #ffffff66;
}
.quiet-button .small-icon {
  width: 20px;
  height: 20px;
}
footer {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 20px;
}
/* the main action: the menu's own color, dark words on it, as its heading has */
.main {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 48px;
  min-width: 190px;
  padding: 0 24px 0 6px;
  border: 2px solid var(--accent);
  border-radius: 24px;
  background: var(--base);
  color: #1b1531;
  font-size: 17px;
  font-weight: bold;
}
.main:hover:not(:disabled) {
  background: var(--accent);
}
.main:disabled {
  border-color: color-mix(in srgb, var(--base) 45%, transparent);
  background: color-mix(in srgb, var(--base) 22%, transparent);
  color: #ffffff77;
}
.main-well {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #1b153133;
}
.total {
  color: #ffffff;
  font-size: 19px;
}
.narrow .buy {
  gap: 14px;
}
.narrow .main {
  flex: 1;
}
</style>
