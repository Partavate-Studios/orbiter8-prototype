<template>
  <!-- A station's armory: parts for your ship, bought and fitted in one move. A Sol station sells at
       twice a part's cost, a pilot's Armory at one and a half (paid to its owner).
       Second pass (Koda, 2026-11-22: "look at what you build, evaluate it... then build the best menu
       you can"). What the first pass got wrong, and what this does about it (docs/ui-plan.md):
       - eight flat rows, most of them dimmed: now three groups by what a part uses up (mounts, drone
         bays, holds), each with its own meter, so a limit is seen where it applies;
       - "no room" was a dead end: the group says where room comes from (the Yards, one press away);
       - the stepper and the button sat at the far end of the sheet from the row you pressed: the
         chosen row now opens in place, with its stepper, its cost and its button;
       - nothing said what a part is for: each has a line;
       - armor and shields have a limit of their own: drawn as pips on their rows.
       The limits are the contract's (Pilots.setLoadout), through sdk/parts.js partRoom. -->
  <div v-if="station" class="armory-panel" :class="{ narrow }">
    <header>
      <span class="title">
        <small-icon name="armory" />
        <span><b>Armory</b><small>{{ station.name }}<template v-if="!sol"> · sells what its Autofactory has made</template></small></span>
      </span>
      <span class="balance"><small>You have</small><b>{{ credits(avatar.credits) }}¢</b></span>
    </header>

    <!-- your ship as it will be: as it flies, and opened up -->
    <div class="ship">
      <figure><svg ref="outside" class="art" :viewBox="SHIP_ART_VIEWBOX" aria-hidden="true" /><figcaption>As it flies</figcaption></figure>
      <figure><svg ref="inside" class="art" :viewBox="SHIP_ART_VIEWBOX" aria-hidden="true" /><figcaption>Opened up</figcaption></figure>
    </div>

    <section v-for="group in groups" :key="group.key">
      <h3>
        <span>{{ group.title }}</span>
        <!-- the group's limit, where it applies -->
        <span class="meter">
          <span v-if="group.pips" class="pips" aria-hidden="true"><i v-for="n in group.pips.of" :key="n" :class="{ on: n <= group.pips.used, adding: n > group.pips.used && n <= group.pips.after }" /></span>
          {{ group.meter }}
        </span>
      </h3>
      <div v-for="row in group.rows" :key="row.id" class="part" :class="{ on: row.id === part, off: !row.can }">
        <button type="button" class="summary" :disabled="!row.can" :aria-expanded="row.id === part ? 'true' : 'false'" @click="choose(row)">
          <!-- (the pictures are this file's own fixed strings) -->
          <!-- eslint-disable-next-line vue/no-v-html -->
          <svg class="pic" viewBox="-12 -12 24 24" aria-hidden="true" v-html="PICTURES[row.field]" />
          <span class="text">
            <b>{{ row.name }}</b>
            <small>{{ row.does }}</small>
          </span>
          <!-- how many you have; armor and shields as levels of their limit -->
          <span v-if="row.max" class="have levels" :aria-label="row.have + ' of ' + row.max + ' levels'"><i v-for="n in row.max" :key="n" :class="{ on: n <= row.have, adding: row.id === part && n > row.have && n <= row.have + count }" /></span>
          <span v-else-if="row.have" class="have">×{{ row.have }}</span>
          <span class="price">
            <b>{{ credits(row.price) }}¢</b>
            <small :class="{ needs: row.short }">{{ row.why || row.takes }}</small>
          </span>
        </button>
        <!-- chosen: how many, what it costs, and the button, right where you pressed -->
        <div v-if="row.id === part" class="buy">
          <div class="stepper">
            <button type="button" class="step" :disabled="count <= 1" aria-label="One fewer" @click="step(-1)">−</button>
            <output aria-live="polite">{{ count }}</output>
            <button type="button" class="step" :disabled="count >= row.most" aria-label="One more" @click="step(1)">+</button>
          </div>
          <p class="sums">
            <span><b>{{ credits(total) }}¢</b> · {{ credits(avatar.credits - total) }}¢ left</span>
            <small>{{ row.most === 1 ? 'One is all that fits and you can pay for' : `Up to ${row.most}` }}</small>
          </p>
          <button type="button" class="main" :disabled="pending" @click="buy">{{ pending ? 'Fitting…' : `Fit ${count}` }}</button>
        </div>
      </div>
      <!-- out of room: where room comes from, one press away -->
      <p v-if="group.more" class="more">
        {{ group.more }}
        <button v-if="station.yard" type="button" class="link" @click="toYards"><small-icon name="yards" />Yards</button>
      </p>
    </section>
  </div>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import { SHIP_PARTS, SHIP_MOUNTS, mountsUsed, partRoom } from '@orbiter8/sdk/parts'
import { isSolStation } from '@orbiter8/sdk/market'
import { shipArtParts, shipInsideParts, SHIP_ART_VIEWBOX } from '@orbiter8/sdk/ship-art'
import { useStarMapStore } from '@/stores/starmap'
import { useGameStateStore } from '@/stores/gamestate'
import { useUIStore } from '@/stores/ui'
import { usePlayerStore } from '@/stores/player'
import SmallIcon from '../small-icon.vue'

// Each part as it's drawn on the ship (sdk/ship-art.js), small: in a 24-unit box around 0,0.
const PICTURES = {
  railguns: '<g fill="#e6dcf5"><rect x="-5" y="-10" width="3" height="20"/><rect x="2" y="-10" width="3" height="20"/><rect x="-6.5" y="2" width="13" height="7" rx="2"/></g>',
  missiles: [-6, 0, 6].flatMap((x) => [-3.5, 3.5].map((y) => `<circle cx="${x}" cy="${y}" r="2.3" fill="#b9a6d6"/>`)).join(''),
  pointDefense: '<path d="M-10 6A12 12 0 0 1 10 6" fill="none" stroke="#8f7fb0" stroke-width="1.6"/><circle cx="0" cy="-3.6" r="4" fill="#e6dcf5"/>',
  drones: '<path d="M0 -9l6 17l-6 -4.4l-6 4.4z" fill="#e6dcf5"/>',
  miningDrones: '<circle r="6" fill="none" stroke="#e6dcf5" stroke-width="3"/>',
  repairBots: '<path d="M-7 -5v10M7 -5v10" stroke="#b9a6d6" stroke-width="2" stroke-linecap="round"/><rect x="-4.5" y="-8" width="9" height="16" rx="4" fill="#b9a6d6"/>',
  armor: '<path d="M-8 9V0A8 8 0 0 1 8 0V9Z" fill="none" stroke="#8f7fb0" stroke-width="1.4"/><path d="M-8 1V0A8 8 0 0 1 8 0V1Z" fill="#b9a6d6"/>',
  shields: '<path d="M-7 9V0A7 7 0 0 1 7 0V9" fill="none" stroke="#7fd4ff" stroke-width="4" stroke-linecap="round"/>'
}
// What each part is for, in a line (the battle's counters: docs/demo4-tuning.md; no numbers, they're tuned on chain).
const DOES = {
  railguns: 'Strong against armor',
  missiles: 'Strong against shields',
  pointDefense: 'Stops missiles',
  drones: 'Strong against weapons',
  miningDrones: 'Mines the belt. Never lost',
  repairBots: 'Mends your armor each round',
  armor: 'Takes the hits your shield lets through',
  shields: 'Takes hits first, and recharges'
}
// Parts by what they use up: the group's meter is that limit.
const GROUPS = [
  { key: 'mounts', title: 'Weapons', fields: ['railguns', 'missiles', 'pointDefense'] },
  { key: 'drones', title: 'Drones', fields: ['drones', 'miningDrones'] },
  { key: 'holds', title: 'Inside the hull', fields: ['repairBots', 'armor', 'shields'] }
]
/** What a part takes, short. */
const TAKES = { railguns: '2 mounts', missiles: '2 mounts', pointDefense: '1 mount', drones: '1 drone bay', miningDrones: '1 drone bay', repairBots: '5 holds', armor: '10 holds a level', shields: '20 holds a level' }

export default {
  name: 'ArmoryPanel',
  components: { SmallIcon },
  props: {
    /** The selected station's key: its planet is the port. */
    objectId: { type: String, default: null },
    /** A phone. */
    narrow: { type: Boolean, default: false }
  },
  data() {
    return { player: usePlayerStore(), part: null, count: 1, pending: false, PICTURES, SHIP_ART_VIEWBOX }
  },
  computed: {
    ...mapState(useStarMapStore, ['systemObjects']),
    ...mapState(useGameStateStore, ['avatar']),
    station() {
      const object = this.systemObjects[this.objectId]
      return object?.type === 'station' && object.armory ? object : null
    },
    port() {
      return this.station.objectId
    },
    ship() {
      return this.player.ship
    },
    /** One of Sol's stations: it sells any number. A pilot's Armory sells only what its Autofactory has finished (Armory.buy). */
    sol() {
      return isSolStation(this.port)
    },
    dronesPerBay() {
      return this.player.economy?.dronesPerBay ?? 1
    },
    /** Every part: what it's for, what it takes, how many are fitted, its price, and whether you can have one (and if not, why). */
    rows() {
      const credits = this.avatar.credits
      return SHIP_PARTS.map((p) => {
        const price = this.player.partPrice(this.port, p.id, 1)
        const room = partRoom(p, this.ship, { freeBays: this.player.freeBays, dronesPerBay: this.dronesPerBay })
        const stock = this.sol ? Infinity : (this.player.factories[this.port]?.stored?.[p.id] ?? 0)
        // the most that fit, are in stock and can be paid for
        let most = Math.min(room.fits, stock, 20)
        while (most > 0 && this.player.partPrice(this.port, p.id, most) > credits) most--
        const short = room.fits > 0 && stock > 0 && most === 0
        return {
          id: p.id,
          field: p.field,
          name: this.player.rules.parts[p.id].name,
          does: DOES[p.field],
          takes: TAKES[p.field] + (this.sol || !stock ? '' : ` · ${stock} in stock`),
          max: p.max ?? 0,
          have: this.ship.loadout[p.field] ?? 0,
          price,
          most,
          can: most > 0,
          short,
          noRoom: room.fits === 0,
          why: (stock === 0 ? 'None in stock' : room.why) || (short ? `${this.credits(price - credits)}¢ short` : '')
        }
      })
    },
    chosen() {
      return this.rows.find((row) => row.id === this.part && row.can) ?? null
    },
    total() {
      return this.chosen ? this.player.partPrice(this.port, this.part, this.count) : 0
    },
    /** The ship with what's chosen already fitted: the pictures and the meters show it. */
    preview() {
      const loadout = { ...this.ship.loadout }
      if (this.chosen) loadout[this.chosen.field] = (loadout[this.chosen.field] ?? 0) + this.count
      return { ...this.ship, loadout }
    },
    /** The three groups, each with its limit as a meter, and where more room comes from when it's out. */
    groups() {
      const l = this.ship.loadout
      const after = this.preview.loadout
      const droneRoom = (this.ship.droneBays ?? 0) * this.dronesPerBay
      const dronesNow = l.drones + (l.miningDrones ?? 0)
      const free = this.player.freeBays
      const meters = {
        mounts: {
          pips: { of: SHIP_MOUNTS, used: mountsUsed(l), after: mountsUsed(after) },
          meter: `${mountsUsed(l)} of ${SHIP_MOUNTS} mounts`,
          more: ''
        },
        drones: {
          meter: droneRoom ? `${dronesNow} of ${droneRoom} drone room` : 'No drone bays',
          more: dronesNow >= droneRoom ? 'Drones live in drone bays.' : ''
        },
        holds: {
          meter: `${free} free ${free === 1 ? 'hold' : 'holds'}`,
          more: free < 5 ? 'These take free cargo holds: sell cargo, or fit more holds.' : ''
        }
      }
      return GROUPS.map((group) => ({ ...group, ...meters[group.key], rows: group.fields.map((field) => this.rows.find((row) => row.field === field)) }))
    }
  },
  watch: {
    preview: { deep: true, handler: 'draw' },
    // (what fits changes as parts go on: never more chosen than fit; a part that no longer fits closes)
    rows() {
      const row = this.rows.find((r) => r.id === this.part)
      if (!row?.can) this.part = null
      else this.count = Math.max(1, Math.min(this.count, row.most))
    }
  },
  mounted() {
    this.draw()
  },
  methods: {
    ...mapActions(useUIStore, ['openMenu']),
    credits(n) {
      return Math.round(n).toLocaleString('en-US')
    },
    /** The drawings are our own strings (sdk/ship-art.js), set as the inline <svg>s' content. */
    draw() {
      if (this.$refs.outside) this.$refs.outside.innerHTML = shipArtParts(this.preview, false, 'armory-')
      if (this.$refs.inside) this.$refs.inside.innerHTML = shipInsideParts(this.preview)
    },
    /** Opens the part in place (pressed again, closes it). */
    choose(row) {
      this.o8audio?.playEffect('click')
      this.part = this.part === row.id ? null : row.id
      this.count = 1
    },
    step(by) {
      this.count = Math.max(1, Math.min(this.chosen.most, this.count + by))
    },
    async buy() {
      this.o8audio?.playEffect('click')
      this.pending = true
      if (await this.player.buyParts(this.port, this.part, this.count)) this.count = 1
      this.pending = false
    },
    toYards() {
      this.o8audio?.playEffect('click')
      this.openMenu('shipyard')
    }
  }
}
</script>

<style scoped>
.armory-panel {
  width: min(600px, calc(100vw - 60px));
  box-sizing: border-box;
  padding: 18px 22px 20px;
  color: #e6dcf5;
  text-align: left;
}
.armory-panel.narrow {
  width: calc(100vw - 34px);
  padding: 14px 12px 16px;
}
header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
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
/* the ship, twice */
.ship {
  display: flex;
  justify-content: center;
  gap: 14px;
  margin-top: 12px;
}
figure {
  margin: 0;
  text-align: center;
}
.art {
  display: block;
  width: 128px;
  height: 128px;
  border-radius: 12px;
  background: #150f28;
}
.narrow .art {
  width: 112px;
  height: 112px;
}
figcaption {
  margin-top: 4px;
  color: #9088aa;
  font-size: 11.5px;
}
section {
  margin-top: 14px;
}
h3 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin: 0 0 4px;
  padding-bottom: 5px;
  border-bottom: 1px solid #ffffff1f;
  color: var(--accent);
  font-size: 11px;
  letter-spacing: 1.3px;
  text-transform: uppercase;
}
.meter {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #e6dcf5;
  font-size: 12.5px;
  font-weight: normal;
  letter-spacing: 0;
  text-transform: none;
}
.pips,
.levels {
  display: flex;
  gap: 4px;
}
.pips i,
.levels i {
  width: 11px;
  height: 11px;
  box-sizing: border-box;
  border: 1.5px solid color-mix(in srgb, var(--base) 75%, transparent);
  border-radius: 50%;
}
.levels i {
  width: 8px;
  height: 14px;
  border-radius: 3px;
}
.pips i.on,
.levels i.on {
  border-color: var(--accent);
  background: var(--accent);
}
/* about to be taken: yours, once you fit it */
.pips i.adding,
.levels i.adding {
  border-color: var(--o8-yellow-light);
  background: var(--o8-yellow-light);
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
/* a part: its picture, its name and what it's for, how many you have, its price */
.part {
  border: 1.5px solid transparent;
  border-radius: 12px;
}
.part.on {
  border-color: var(--accent);
  background: #ffffff14;
}
.summary {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 48px;
  box-sizing: border-box;
  padding: 4px 12px 4px 8px;
  border: 0;
  border-radius: 11px;
  background: none;
  color: inherit;
  text-align: left;
}
.summary:hover:not(:disabled) {
  background: #ffffff10;
}
.pic {
  flex: none;
  width: 36px;
  height: 36px;
  padding: 4px;
  box-sizing: border-box;
  border-radius: 9px;
  background: #150f28;
}
.text {
  flex: 1;
  min-width: 0;
}
.text b {
  display: block;
  color: #ffffff;
  font-size: 15px;
  font-weight: 500;
}
.have {
  flex: none;
  color: #e6dcf5;
  font-size: 14px;
}
.price {
  flex: none;
  min-width: 96px;
  text-align: right;
}
.price b {
  color: #ffffff;
  font-size: 15px;
  font-weight: normal;
}
.price small {
  font-size: 11.5px;
}
/* can't have one now: quieter, and the line under its price says why */
.part.off .pic,
.part.off .text b,
.part.off .price b {
  opacity: 0.55;
}
/* short of credits: light pink, said in words (pink needs you) */
small.needs {
  color: var(--o8-pink-light);
}
/* the chosen part, opened: how many, the cost, the button */
.buy {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 4px 12px 10px 56px;
}
.narrow .buy {
  flex-wrap: wrap;
  padding-left: 12px;
}
.stepper {
  flex: none;
  display: flex;
  align-items: center;
  gap: 2px;
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
  min-width: 40px;
  color: #ffffff;
  font-size: 26px;
  text-align: center;
}
.sums {
  flex: 1;
  min-width: 120px;
  margin: 0;
  color: #bdb5d4;
  font-size: 13.5px;
}
.sums b {
  color: #ffffff;
  font-size: 15px;
}
.sums small {
  font-size: 11.5px;
}
/* the main action: the menu's own color, dark words on it, as its heading has */
.main {
  flex: none;
  height: 44px;
  min-width: 104px;
  padding: 0 22px;
  border: 2px solid var(--accent);
  border-radius: 22px;
  background: var(--base);
  color: #1b1531;
  font-size: 16px;
  font-weight: bold;
  white-space: nowrap;
}
.main:hover:not(:disabled) {
  background: var(--accent);
}
.main:disabled {
  opacity: 0.6;
}
.more {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin: 4px 0 0;
  padding: 0 12px 0 8px;
  color: #9088aa;
  font-size: 12.5px;
}
.link {
  flex: none;
  display: flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 14px 0 10px;
  border: 1.2px solid color-mix(in srgb, var(--accent) 60%, transparent);
  border-radius: 16px;
  background: #ffffff10;
  color: #ffffff;
  font-size: 13px;
}
.link:hover {
  border-color: var(--accent);
  background: #ffffff22;
}
.link .small-icon {
  width: 18px;
  height: 18px;
}
</style>
