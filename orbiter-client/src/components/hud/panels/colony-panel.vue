<template>
  <!-- A planet of yours (docs/demo4-plan.md, milestone 3): its people, its storage, the building line,
       its Autofactory and its defenses. Rebuilt to the screen standard: pages as tabs with icons; each
       page's limit in its heading; amounts chosen on sliders, with the button beside them; a good or a
       part opens in place; and anything that can't be done says what it needs. -->
  <div v-if="object && planet" class="k-panel colony-panel" :class="{ narrow }">
    <header class="k-head">
      <span class="k-title"><small-icon name="colony" /><span><b>{{ object.name }}</b><small>{{ planetTypeName(planet.class) }} · size {{ planet.size }} · {{ levelName }}</small></span></span>
    </header>
    <p v-if="siege" class="state k-needs">Under siege: production has stopped.</p>
    <p v-else-if="planet.building" class="state">{{ BUILDING_NAMES[planet.building] }} under way: ready {{ readyWords(planet.readyAt) }}.</p>

    <div class="k-tabs pages" role="tablist">
      <button v-for="tab in pages" :key="tab.key" type="button" role="tab" class="k-tab" :class="{ on: page === tab.key }" :aria-selected="page === tab.key ? 'true' : 'false'" :title="tab.label" @click="go(tab.key)">
        <small-icon :name="tab.icon" /><span v-if="!narrow || page === tab.key">{{ tab.label }}</span>
      </button>
    </div>

    <!-- People: landing colonists from the ship, taking people aboard -->
    <section v-if="page === 'people'">
      <h3><span>People</span><span class="k-meter">{{ n(planet.population) }} of {{ n(planet.cap) }}</span></h3>
      <span class="bar"><b :style="{ width: Math.min(100, (planet.population / Math.max(1, planet.cap)) * 100) + '%' }" /></span>
      <p class="k-none">{{ aboard ? n(aboard) + ' colonists aboard your ship, a hundred to a hold.' : planet.population ? 'No colonists aboard your ship.' : 'Recruit colonists at Earth\'s hiring hall, in Sol.' }}</p>
      <div class="k-move">
        <span>Land</span>
        <input v-model.number="land" type="range" class="k-range" min="0" :max="aboard" :disabled="!aboard" aria-label="Colonists to land" />
        <output>{{ n(land) }}</output>
        <button type="button" class="k-main" :disabled="land < 1" @click="doLand">Land</button>
      </div>
      <div class="k-move">
        <span>Take aboard</span>
        <input v-model.number="board" type="range" class="k-range" min="0" :max="maxBoard" :disabled="!maxBoard" aria-label="People to take aboard" />
        <output>{{ n(board) }}</output>
        <button type="button" class="k-quiet" :disabled="board < 1" @click="doBoard">Take</button>
      </div>
    </section>

    <!-- Storage: what the planet makes and holds, and moving goods between it and the ship -->
    <section v-if="page === 'storage'">
      <h3><span>Storage</span><span class="k-meter">Up to {{ n(player.rules.storageCap) }} of each · {{ player.freeBays }} free holds aboard</span></h3>
      <div class="goods">
        <div v-for="row in storage" :key="row.good" class="good" :class="{ on: good === row.good }">
          <button type="button" class="k-row" :aria-expanded="good === row.good ? 'true' : 'false'" @click="chooseGood(row.good)">
            <img :src="row.icon" alt="" />
            <span class="k-text"><b :style="{ color: row.color }">{{ row.name }}</b><small>{{ n(row.stored) }} stored<template v-if="row.aboard"> · {{ row.aboard }} aboard</template></small></span>
          </button>
          <!-- chosen: move it, right where you pressed -->
          <template v-if="good === row.good">
            <div class="k-move">
              <span>Deliver</span>
              <input v-model.number="deliver" type="range" class="k-range" min="0" :max="maxDeliver" :disabled="!maxDeliver" aria-label="Units to deliver" />
              <output>{{ deliver }}</output>
              <button type="button" class="k-quiet" :disabled="deliver < 1" @click="doDeliver">Deliver</button>
            </div>
            <div class="k-move">
              <span>Collect</span>
              <input v-model.number="collect" type="range" class="k-range" min="0" :max="maxCollect" :disabled="!maxCollect" aria-label="Units to collect" />
              <output>{{ collect }}</output>
              <button type="button" class="k-quiet" :disabled="collect < 1" @click="doCollect">Collect</button>
            </div>
            <small v-if="!maxDeliver && !maxCollect" class="why">{{ moveWhy(row) }}</small>
          </template>
        </div>
      </div>
    </section>

    <!-- Build: the line, and what the next step needs -->
    <section v-if="page === 'build'">
      <h3><span>The line</span><span class="k-meter">{{ planet.building ? 'One building at a time' : nextBuildings.length ? 'Ready for the next' : 'Every building is up' }}</span></h3>
      <div class="line">
        <span v-for="stage in line" :key="stage.building" class="stage" :class="{ done: stage.done, next: stage.next, building: stage.building === planet.building }">
          <i><img :src="stage.art" alt="" /></i>{{ stage.name }}
        </span>
      </div>
      <div v-for="b in nextBuildings" :key="b.building" class="next">
        <img :src="BUILDING_ART[b.building]" alt="" />
        <div>
          <b>{{ BUILDING_NAMES[b.building] }}</b>
          <small>{{ costWords(b.cost) }}</small>
          <small v-for="need in b.missing" :key="need" class="k-needs">Needs {{ need }}</small>
        </div>
        <button type="button" class="k-main" :disabled="b.missing.length > 0" @click="doBuild(b.building)">Build</button>
      </div>
      <button type="button" class="k-quiet tree" @click="openTechTree"><small-icon name="help" />How planets grow</button>
    </section>

    <!-- Factory: the Autofactory's orders, its finished parts, and ordering more -->
    <section v-if="page === 'factory'">
      <h3><span>Orders</span><span class="k-meter">{{ factory.queue.length }} of 5</span></h3>
      <p v-if="!factory.queue.length" class="k-none">Nothing on order.</p>
      <p v-for="(o, i) in factory.queue" :key="'order' + i" class="line-row"><span><b>{{ o.count }}</b> × {{ player.rules.parts[o.part].name }}</span><span>ready {{ readyWords(o.readyAt) }}</span></p>

      <h3 class="gap"><span>Finished</span></h3>
      <p v-if="!finished.length" class="k-none">None yet.</p>
      <p v-for="row in finished" :key="row.part" class="line-row">
        <span><b>{{ row.count }}</b> × {{ row.name }}</span>
        <span class="split">
          <button v-if="row.part !== MINING_DRONE" type="button" class="k-quiet" @click="doFitPlanet(row)">Install</button>
          <!-- Weapons can go on the moons instead: free mounts, outside the shield (D61) -->
          <button v-if="moons && MOON_WEAPONS[row.part]" type="button" class="k-quiet" :disabled="moonFit(row) < 1" :title="moonFit(row) < 1 ? 'No free mounts on the moons' : ''" @click="doFitMoons(row)">To moons</button>
          <button v-if="fitsShip(row.part)" type="button" class="k-quiet" @click="doFitShip(row)">To ship</button>
        </span>
      </p>

      <h3 class="gap"><span>Order</span><span class="k-meter">{{ factory.queue.length >= 5 ? 'Five orders is the most' : 'Takes goods from storage' }}</span></h3>
      <div v-for="row in orderable" :key="row.id" class="good" :class="{ on: part === row.id }">
        <button type="button" class="k-row" :aria-expanded="part === row.id ? 'true' : 'false'" @click="choosePart(row.id)">
          <span class="k-text"><b>{{ row.name }}</b><small>{{ row.needs }}</small></span>
          <span class="price"><b>{{ row.price }}¢</b><small>{{ row.time }}</small></span>
        </button>
        <template v-if="part === row.id">
          <div class="k-move">
            <span>How many</span>
            <input v-model.number="count" type="range" class="k-range" min="1" max="20" aria-label="How many to order" />
            <output>{{ count }}</output>
            <button type="button" class="k-main" :disabled="Boolean(orderProblem)" @click="placeOrder">Order</button>
          </div>
          <small class="why" :class="{ 'k-needs': orderProblem }">{{ orderProblem || orderTotal }}</small>
        </template>
      </div>
    </section>

    <!-- Defenses: what's installed -->
    <section v-if="page === 'defenses'">
      <h3><span>Defenses</span><span v-if="moons" class="k-meter">{{ moonMountsUsed }} of {{ moons * MOON_MOUNTS }} moon mounts</span></h3>
      <p v-if="!defenseRows.length" class="k-none">None installed. The Autofactory makes them; an Armory sells them.</p>
      <p v-for="row in defenseRows" :key="row.name" class="line-row"><span>{{ row.name }}</span><b>{{ row.count }}</b></p>
      <small v-if="moons" class="why">Weapons on the {{ moons === 1 ? 'moon' : 'moons' }} sit outside the shield, and no siege can take them.</small>
    </section>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { planetTypeName } from '@orbiter8/sdk/game/planet-types'
import { BUILDING_NAMES } from '@orbiter8/sdk/client'
import { MINING_DRONE, fitsShip } from '@orbiter8/sdk/parts'
import { useStarMapStore } from '@/stores/starmap'
import { useGameStateStore } from '@/stores/gamestate'
import { useUIStore } from '@/stores/ui'
import { usePlayerStore } from '@/stores/player'
import { goodColor } from '@/libs/palette'
import { goodIcon } from '@/libs/goods'
import autofactoryArt from '@/assets/art/autofactory.svg'
import armoryArt from '@/assets/art/armory.svg'
import citadelArt from '@/assets/art/citadel.svg'
import colonyArt from '@/assets/art/colony.svg'
import platformArt from '@/assets/art/orbital-platform.svg'
import portArt from '@/assets/art/port.svg'
import yardsArt from '@/assets/art/yards.svg'
import SmallIcon from '../small-icon.vue'

/** Each building's picture (BUILDING_NAMES order: Citadel, Colony, Station, Port, Yards, Armory, Autofactory). */
const BUILDING_ART = [null, citadelArt, colonyArt, platformArt, portArt, yardsArt, armoryArt, autofactoryArt]
const DEFENSES = [
  ['pointDefense', 'Point defense'],
  ['railguns', 'Railguns'],
  ['missiles', 'Missile racks'],
  ['drones', 'Drones'],
  ['repairBots', 'Repair bots'],
  ['armor', 'Armor plates'],
  ['shields', 'Shield levels'],
  ['platforms', 'Orbital platforms'],
  ['bfg', 'BFG'],
  ['moonPointDefense', 'Point defense on moons'],
  ['moonRailguns', 'Railguns on moons'],
  ['moonMissiles', 'Missile racks on moons']
]
/** Moons (D61): six mounts each, for weapons only; the parts' ids (Factory) and their mounts. */
const MOON_MOUNTS = 6
const MOON_WEAPONS = { 2: 1, 3: 2, 4: 2 }

export default {
  name: 'ColonyPanel',
  components: { SmallIcon },
  props: {
    /** The selected planet's key (sdk/system.js objectKey). */
    objectId: { type: String, default: null },
    narrow: { type: Boolean, default: false }
  },
  data() {
    return {
      player: usePlayerStore(),
      MINING_DRONE,
      page: 'people',
      land: 0,
      board: 0,
      good: null,
      deliver: 0,
      collect: 0,
      /** the part being ordered, and how many */
      part: null,
      count: 1,
      BUILDING_NAMES,
      BUILDING_ART,
      MOON_MOUNTS,
      MOON_WEAPONS
    }
  },
  computed: {
    ...mapState(useStarMapStore, ['systemObjects']),
    ...mapState(useGameStateStore, ['avatar', 'goods']),
    object() {
      return this.systemObjects[this.objectId]
    },
    /** The planet as the contracts have it now (sdk/contracts.js toPlanet). */
    planet() {
      return this.player.planetById(this.object?.id) ?? this.object?.info ?? null
    },
    pages() {
      const list = [
        { key: 'people', label: 'People', icon: 'recruit' },
        { key: 'storage', label: 'Storage', icon: 'port' },
        { key: 'build', label: 'Build', icon: 'build' }
      ]
      if (this.planet.autofactory) list.push({ key: 'factory', label: 'Factory', icon: 'autofactory' })
      if (this.defenseRows.length || this.planet.level >= 6) list.push({ key: 'defenses', label: 'Defenses', icon: 'armory' })
      return list
    },
    levelName() {
      if (!this.planet.level) return 'claimed, unsettled'
      return BUILDING_NAMES[this.planet.level] + (this.planet.autofactory ? ' with an Autofactory' : '')
    },
    siege() {
      return this.player.siegeAt(this.planet.id)
    },
    aboard() {
      return this.player.ship?.colonists ?? 0
    },
    maxBoard() {
      return Math.min(this.planet.population, this.player.freeBays * 100)
    },
    storage() {
      return this.goods.map((name, good) => ({
        good,
        name,
        icon: goodIcon(good),
        color: goodColor(good),
        stored: this.planet.stock[good] ?? 0,
        aboard: this.avatar.ship.cargo?.[good] ?? 0
      }))
    },
    maxDeliver() {
      if (this.good == null) return 0
      const room = this.player.rules.storageCap - (this.planet.stock[this.good] ?? 0)
      return Math.max(0, Math.min(this.avatar.ship.cargo?.[this.good] ?? 0, room))
    },
    maxCollect() {
      if (this.good == null) return 0
      return Math.min(this.planet.stock[this.good] ?? 0, this.player.freeBays)
    },
    /** The whole line, for the row of pictures: what's up, what's next, what's later. */
    line() {
      const p = this.planet
      const next = this.nextBuildings.map((b) => b.building)
      return [1, 2, 3, 4, 5, 6, 7].map((building) => ({
        building,
        name: BUILDING_NAMES[building],
        art: BUILDING_ART[building],
        done: building === 7 ? Boolean(p.autofactory) : p.level >= building,
        next: next.includes(building)
      }))
    },
    nextBuildings() {
      const p = this.planet
      if (p.building) return []
      const list = p.level < 6 ? [p.level + 1] : []
      if (p.level >= 2 && !p.autofactory) list.push(7)
      return list.map((building) => ({ building, cost: this.player.rules.buildings[building], missing: this.player.missingFor(p, building) }))
    },
    factory() {
      return this.player.factories[this.planet.id] ?? { queue: [], stored: [] }
    },
    finished() {
      return (this.factory.stored ?? []).map((count, part) => ({ part, count, name: this.player.rules.parts[part].name })).filter((row) => row.count > 0)
    },
    defenseRows() {
      const d = this.player.defenses[this.planet.id]
      if (!d) return []
      return DEFENSES.filter(([key]) => d[key] > 0).map(([key, name]) => ({ name, count: d[key] }))
    },
    /** The planet's moons: each gives six weapon mounts that can't be destroyed. */
    moons() {
      return useStarMapStore().moonsForPlanet(this.objectId).length
    },
    moonMountsUsed() {
      const d = this.player.defenses[this.planet.id]
      if (!d) return 0
      return (d.moonPointDefense ?? 0) + 2 * (d.moonRailguns ?? 0) + 2 * (d.moonMissiles ?? 0)
    },
    /** The Autofactory's parts: what each takes from storage and in credits, and how long it builds. */
    orderable() {
      return this.player.rules.parts.map((p, id) => ({
        id,
        name: p.name,
        price: p.credits.toLocaleString('en-US'),
        time: p.time >= 3600 ? `${+(p.time / 3600).toFixed(1)} h` : `${Math.round(p.time / 60)} min`,
        needs: p.goods.length ? p.goods.map(([good, amount]) => `${amount} ${this.goods[good].toLowerCase()}`).join(' and ') + ' each' : 'Takes no goods'
      }))
    },
    orderTotal() {
      const p = this.player.rules.parts[this.part]
      const goods = p.goods.map(([good, amount]) => `${amount * this.count} ${this.goods[good].toLowerCase()}`)
      return [`Total ${(p.credits * this.count).toLocaleString('en-US')}¢`, ...goods].join(' · ')
    },
    /** Why the order can't be placed yet, or null. */
    orderProblem() {
      if (this.part == null || this.count < 1) return 'Choose how many'
      if (this.factory.queue.length >= 5) return 'The Autofactory already has five orders'
      const p = this.player.rules.parts[this.part]
      if (p.credits * this.count > this.player.credits) return `${(p.credits * this.count - this.player.credits).toLocaleString('en-US')}¢ short`
      for (const [good, amount] of p.goods) {
        if ((this.planet.stock[good] ?? 0) < amount * this.count) return `Needs ${amount * this.count} ${this.goods[good].toLowerCase()} in storage`
      }
      return null
    }
  },
  watch: {
    // (an amount never stays above what can be moved)
    aboard(max) {
      this.land = Math.min(this.land, max)
    },
    maxBoard(max) {
      this.board = Math.min(this.board, max)
    },
    maxDeliver(max) {
      this.deliver = Math.min(this.deliver, max)
    },
    maxCollect(max) {
      this.collect = Math.min(this.collect, max)
    }
  },
  methods: {
    fitsShip,
    planetTypeName,
    n(count) {
      return Number(count).toLocaleString('en-US')
    },
    go(page) {
      this.o8audio?.playEffect('click')
      this.page = page
    },
    goodName(good) {
      return this.goods[good]
    },
    /** Opens a good in place (pressed again, closes it). */
    chooseGood(good) {
      this.o8audio?.playEffect('click')
      this.good = this.good === good ? null : good
      this.deliver = this.collect = 0
    },
    /** Why a good can't be moved either way. */
    moveWhy(row) {
      if (!row.aboard && !row.stored) return 'None in storage and none aboard.'
      if (!row.aboard && !this.player.freeBays) return 'No free holds aboard to collect into.'
      return 'Storage is full of this.'
    },
    readyWords(at) {
      const minutes = Math.ceil((at * 1000 - this.player.now) / 60_000)
      if (minutes <= 0) return 'now'
      return minutes < 60 ? `in ${minutes} min` : `in ${(minutes / 60).toFixed(1)} h`
    },
    costWords(cost) {
      const parts = [`${cost.credits.toLocaleString('en-US')}¢`]
      for (const [good, amount] of cost.goods) parts.push(`${amount} ${this.goods[good].toLowerCase()}`)
      if (cost.people) parts.push(`${cost.people}${cost === this.player.rules.buildings[2] ? '% full' : ' people'}`)
      const hours = cost.time / 3600
      parts.push(hours < 1 ? `${Math.round(cost.time / 60)} min` : `${hours} h`)
      return parts.join(' · ')
    },
    async doLand() {
      this.o8audio?.playEffect('click')
      if (await this.player.land(this.planet.id, this.land, this.object.name)) this.land = 0
    },
    async doBoard() {
      this.o8audio?.playEffect('click')
      if (await this.player.board(this.planet.id, this.board)) this.board = 0
    },
    async doDeliver() {
      this.o8audio?.playEffect('click')
      if (await this.player.deliver(this.planet.id, this.good, this.deliver, this.goodName(this.good))) this.deliver = 0
    },
    async doCollect() {
      this.o8audio?.playEffect('click')
      if (await this.player.collect(this.planet.id, this.good, this.collect, this.goodName(this.good))) this.collect = 0
    },
    doBuild(building) {
      this.o8audio?.playEffect('click')
      this.player.build(this.planet.id, building, this.object.name)
    },
    doFitPlanet(row) {
      this.o8audio?.playEffect('click')
      this.player.fitPlanet(this.planet.id, row.part, row.count)
    },
    /** How many of a finished weapon fit on the moons' free mounts. */
    moonFit(row) {
      const each = MOON_WEAPONS[row.part]
      if (!each) return 0
      return Math.min(row.count, Math.floor((this.moons * MOON_MOUNTS - this.moonMountsUsed) / each))
    },
    doFitMoons(row) {
      this.o8audio?.playEffect('click')
      this.player.fitMoons(this.planet.id, row.part, this.moonFit(row))
    },
    doFitShip(row) {
      this.o8audio?.playEffect('click')
      this.player.fitShip(this.planet.id, row.part, 1)
    },
    /** Opens a part to order in place (pressed again, closes it). */
    choosePart(part) {
      this.o8audio?.playEffect('click')
      this.part = this.part === part ? null : part
      this.count = 1
    },
    async placeOrder() {
      this.o8audio?.playEffect('click')
      if (await this.player.order(this.planet.id, this.part, this.count)) {
        this.part = null
        this.count = 1
      }
    },
    openTechTree() {
      this.o8audio?.playEffect('click')
      useUIStore().techTreeOpen = true
    }
  }
}
</script>

<style src="../kit.css"></style>
<style scoped>
/* (room for its five tabs in one row) */
.colony-panel:not(.narrow) {
  width: min(640px, calc(100vw - 60px));
}
.state {
  margin: 10px 0 0;
  padding: 8px 14px;
  border-radius: 12px;
  background: #ffffff10;
  color: #e6dcf5;
  font-size: 14px;
}
.pages {
  flex-wrap: wrap;
  margin-top: 14px;
}
.bar {
  display: block;
  height: 8px;
  border-radius: 4px;
  background: #0f0a1e;
  overflow: hidden;
}
.bar b {
  display: block;
  height: 100%;
  border-radius: 4px;
  background: var(--accent);
}
.goods {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px 10px;
}
.narrow .goods {
  grid-template-columns: 1fr;
}
/* a good or a part: opens in place when chosen */
.good {
  border: 1.5px solid transparent;
  border-radius: 12px;
}
.good.on {
  grid-column: 1 / -1;
  padding: 0 12px 8px 0;
  border-color: var(--accent);
  background: #ffffff14;
}
.good .k-row {
  border: 0;
}
.good img {
  flex: none;
  width: 28px;
  height: 28px;
}
.good.on .k-move,
.good.on .why {
  margin-left: 12px;
}
.why {
  margin-top: 4px;
  color: #9088aa;
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
/* the line: what's up (lit), what's next (outlined), what's later (dashed: not there yet) */
.line {
  display: flex;
  gap: 4px;
}
.stage {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 0;
  color: #9088aa;
  font-size: 11px;
  text-align: center;
}
.stage i {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  box-sizing: border-box;
  border: 1.5px dashed #5a4c8c;
  border-radius: 50%;
}
.stage img {
  width: 34px;
  height: 34px;
  opacity: 0.35;
}
.stage.done {
  color: #ffffff;
}
.stage.done i {
  border: 1.5px solid var(--accent);
  background: #ffffff14;
}
.stage.done img,
.stage.next img,
.stage.building img {
  opacity: 1;
}
.stage.next {
  color: #e6dcf5;
}
.stage.next i {
  border: 2px solid var(--accent);
}
.stage.building i {
  border: 2px dashed var(--accent);
}
.narrow .stage i {
  width: 38px;
  height: 38px;
}
.narrow .stage img {
  width: 28px;
  height: 28px;
}
.next {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #ffffff10;
}
.next > img {
  flex: none;
  width: 52px;
  height: 52px;
}
.next > div {
  flex: 1;
  min-width: 0;
}
.next b {
  color: #ffffff;
  font-size: 17px;
  font-weight: normal;
}
.tree {
  margin-top: 14px;
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
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
}
h3.gap {
  margin-top: 16px;
}
</style>
