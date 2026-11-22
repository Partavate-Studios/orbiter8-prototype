<template>
  <!-- A station's armory (Koda, 2026-11-22: rebuilt to the screen standard as the yards were,
       docs/ui-guide.md section 11): parts for your ship, bought and fitted in one move. A Sol station
       sells at twice a part's cost, a pilot's Armory at one and a half (paid to its owner). Each part
       shows its picture (as it's drawn on the ship), what it takes, how many you have, its price, and
       when you can't have one, why: no room, or how short you are. The ship beside the list shows
       what you're about to fit. Buttons take the station's color, not the brand purple. -->
  <div v-if="station" class="armory-panel" :class="{ narrow }">
    <header>
      <span class="title">
        <small-icon name="armory" />
        <span><b>Armory</b><small>{{ station.name }}</small></span>
      </span>
      <span class="balance"><small>You have</small><b>{{ credits(avatar.credits) }}¢</b></span>
    </header>

    <!-- your ship as it will be: as it flies, and opened up; then the room it has left -->
    <div class="ship">
      <svg ref="outside" class="art" :viewBox="SHIP_ART_VIEWBOX" aria-hidden="true" />
      <svg ref="inside" class="art" :viewBox="SHIP_ART_VIEWBOX" aria-hidden="true" />
      <div class="room">
        <p>
          <span>Mounts</span>
          <span class="pips" :aria-label="mounts + ' of ' + SHIP_MOUNTS + ' mounts used'"><i v-for="n in SHIP_MOUNTS" :key="n" :class="{ on: n <= mounts, adding: n > mounts && n <= mountsAfter }" /></span>
        </p>
        <p><span>Free holds</span><b>{{ player.freeBays }}</b></p>
        <p><span>Drone room</span><b>{{ droneFree }}</b></p>
      </div>
    </div>

    <section>
      <h3>Parts</h3>
      <button v-for="row in rows" :key="row.id" type="button" class="part" :class="{ on: row.id === part, off: !row.can }" :aria-pressed="row.id === part ? 'true' : 'false'" @click="choose(row)">
        <!-- (the pictures are this file's own fixed strings) -->
        <!-- eslint-disable-next-line vue/no-v-html -->
        <svg class="pic" viewBox="-12 -12 24 24" aria-hidden="true" v-html="PICTURES[row.field]" />
        <span class="text">
          <b>{{ row.name }}</b>
          <small>{{ row.takes }}<template v-if="row.have"> · {{ row.have }} fitted</template></small>
        </span>
        <span class="price">
          <b>{{ credits(row.price) }}¢</b>
          <small v-if="row.why" :class="{ needs: row.short }">{{ row.why }}</small>
        </span>
      </button>
    </section>

    <!-- the screen's one main action, for the part chosen -->
    <footer v-if="chosen">
      <div class="stepper">
        <button type="button" class="step" :disabled="count <= 1" aria-label="One fewer" @click="step(-1)">−</button>
        <output aria-live="polite">{{ count }}</output>
        <button type="button" class="step" :disabled="count >= chosen.most" aria-label="One more" @click="step(1)">+</button>
      </div>
      <div class="sums">
        <p><span>Cost</span><b>{{ credits(total) }}¢</b></p>
        <p><span>Left after</span><b>{{ credits(avatar.credits - total) }}¢</b></p>
      </div>
      <button type="button" class="main" :disabled="!chosen.can || pending" @click="buy">
        {{ pending ? 'Fitting…' : `Fit ${count} ${count === 1 ? chosen.name.toLowerCase() : partPlural(chosen.name)}` }}
      </button>
    </footer>
    <p v-else class="hint">Choose a part. It's bought and fitted in one move.</p>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { SHIP_PARTS, SHIP_MOUNTS, mountsUsed, partPlural, partRoom } from '@orbiter8/sdk/parts'
import { shipArtParts, shipInsideParts, SHIP_ART_VIEWBOX } from '@orbiter8/sdk/ship-art'
import { useStarMapStore } from '@/stores/starmap'
import { useGameStateStore } from '@/stores/gamestate'
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
    return { player: usePlayerStore(), part: null, count: 1, pending: false, PICTURES, SHIP_ART_VIEWBOX, SHIP_MOUNTS }
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
    mounts() {
      return mountsUsed(this.ship.loadout)
    },
    mountsAfter() {
      return mountsUsed(this.preview.loadout)
    },
    droneFree() {
      const per = this.player.economy?.dronesPerBay ?? 1
      return Math.max(0, (this.ship.droneBays ?? 0) * per - this.ship.loadout.drones - (this.ship.loadout.miningDrones ?? 0))
    },
    /** Every part: what it takes, how many are fitted, its price, and whether you can have one (and if not, why). */
    rows() {
      const credits = this.avatar.credits
      return SHIP_PARTS.map((p) => {
        const price = this.player.partPrice(this.port, p.id, 1)
        const room = partRoom(p, this.ship, { freeBays: this.player.freeBays, dronesPerBay: this.player.economy?.dronesPerBay ?? 1 })
        // the most that both fit and can be paid for
        let most = Math.min(room.fits, 20)
        while (most > 0 && this.player.partPrice(this.port, p.id, most) > credits) most--
        const short = room.fits > 0 && most === 0
        return {
          id: p.id,
          field: p.field,
          name: this.player.rules.parts[p.id].name,
          takes: p.space,
          have: this.ship.loadout[p.field] ?? 0,
          price,
          most,
          can: most > 0,
          short,
          why: room.why || (short ? `${this.credits(price - credits)}¢ short` : '')
        }
      })
    },
    chosen() {
      return this.rows.find((row) => row.id === this.part) ?? null
    },
    total() {
      return this.chosen ? this.player.partPrice(this.port, this.part, this.count) : 0
    },
    /** The ship with what's chosen already fitted: the pictures show it. */
    preview() {
      const loadout = { ...this.ship.loadout }
      if (this.chosen?.can) loadout[this.chosen.field] = (loadout[this.chosen.field] ?? 0) + this.count
      return { ...this.ship, loadout }
    }
  },
  watch: {
    preview: { deep: true, handler: 'draw' },
    // (what fits changes as parts go on: never more chosen than fit)
    chosen(row) {
      if (row) this.count = Math.max(1, Math.min(this.count, row.most || 1))
    }
  },
  mounted() {
    this.draw()
  },
  methods: {
    partPlural,
    credits(n) {
      return Math.round(n).toLocaleString('en-US')
    },
    /** The drawings are our own strings (sdk/ship-art.js), set as the inline <svg>s' content. */
    draw() {
      if (this.$refs.outside) this.$refs.outside.innerHTML = shipArtParts(this.preview, false, 'armory-')
      if (this.$refs.inside) this.$refs.inside.innerHTML = shipInsideParts(this.preview)
    },
    choose(row) {
      this.o8audio?.playEffect('click')
      this.part = row.id
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
.ship {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
}
.art {
  flex: none;
  width: 116px;
  height: 116px;
  border-radius: 12px;
  background: #150f28;
}
.narrow .art {
  width: 88px;
  height: 88px;
}
.room {
  flex: 1;
  min-width: 0;
  padding-left: 8px;
}
.room p {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin: 0;
  font-size: 13.5px;
  line-height: 26px;
}
.room span {
  color: #bdb5d4;
}
.room b {
  color: #ffffff;
}
.pips {
  display: flex;
  gap: 4px;
}
.pips i {
  width: 14px;
  height: 14px;
  box-sizing: border-box;
  border: 1.5px solid color-mix(in srgb, var(--base) 70%, transparent);
  border-radius: 50%;
}
.pips i.on {
  border-color: var(--accent);
  background: var(--accent);
}
/* about to be taken: yours, once you fit it */
.pips i.adding {
  border-color: var(--o8-yellow-light);
  background: var(--o8-yellow-light);
}
section {
  margin-top: 14px;
}
h3 {
  margin: 0 0 6px;
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
/* a part: its picture, its name and what it takes, its price */
.part {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 46px;
  box-sizing: border-box;
  padding: 3px 12px 3px 8px;
  border: 1.5px solid transparent;
  border-radius: 12px;
  background: none;
  color: inherit;
  text-align: left;
}
.part:hover {
  border-color: color-mix(in srgb, var(--accent) 60%, transparent);
  background: #ffffff0c;
}
.part.on {
  border-color: var(--accent);
  background: #ffffff1c;
}
.pic {
  flex: none;
  width: 34px;
  height: 34px;
  padding: 3px;
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
.price {
  flex: none;
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
/* can't have one now: dimmed, and it says why */
.part.off .pic,
.part.off .text,
.part.off .price b {
  opacity: 0.45;
}
/* short of credits: light pink, said in words (pink needs you) */
small.needs {
  color: var(--o8-pink-light);
}
footer {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid #ffffff1f;
}
.narrow footer {
  flex-wrap: wrap;
}
.stepper {
  flex: none;
  display: flex;
  align-items: center;
  gap: 4px;
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
  min-width: 44px;
  color: #ffffff;
  font-size: 28px;
  text-align: center;
}
.sums {
  flex: 1;
  min-width: 120px;
}
.sums p {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin: 0;
  font-size: 14px;
  line-height: 23px;
}
.sums span {
  color: #bdb5d4;
}
.sums b {
  color: #ffffff;
}
/* the main action: the menu's own color, dark words on it, as its heading has */
.main {
  flex: none;
  height: 48px;
  min-width: 170px;
  padding: 0 22px;
  border: 2px solid var(--accent);
  border-radius: 24px;
  background: var(--base);
  color: #1b1531;
  font-size: 16px;
  font-weight: bold;
  white-space: nowrap;
}
.narrow .main {
  flex: 1 0 100%;
}
.main:hover:not(:disabled) {
  background: var(--accent);
}
.main:disabled {
  border-color: color-mix(in srgb, var(--base) 45%, transparent);
  background: color-mix(in srgb, var(--base) 22%, transparent);
  color: #ffffff77;
}
.hint {
  margin: 14px 0 0;
  color: #9088aa;
  font-size: 12.5px;
}
</style>
