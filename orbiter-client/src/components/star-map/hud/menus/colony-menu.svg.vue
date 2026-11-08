<template>
  <!-- A planet of the player's (docs/demo4-plan.md, milestone 3): its people, its storage, the
       building line and its Autofactory and defenses, in the trade menu's style. -->
  <g v-if="object && planet">
    <menu-container>
      <g :transform="'translate(0 -400) scale(' + scale + ')'" fill="#ffffff" dominant-baseline="middle">
        <text x="0" y="5" text-anchor="middle" fill="#ffffff88" font-size="1.5em">{{ object.name }}</text>
        <text x="0" y="32" text-anchor="middle" font-size="0.8em" fill="#ffffffaa">
          {{ planetTypeName(planet.class) }} · size {{ planet.size }} · {{ levelName }}
        </text>
        <text v-if="planet.building" x="0" y="48" text-anchor="middle" font-size="0.75em" :fill="YELLOW">
          {{ BUILDING_NAMES[planet.building] }} under way: ready {{ readyWords(planet.readyAt) }}
        </text>
        <text v-if="siege" x="0" y="48" text-anchor="middle" font-size="0.75em" :fill="PINK">
          Under siege: production has stopped
        </text>

        <!-- pages -->
        <g transform="translate(0 72)" font-size="0.75em">
          <g
            v-for="(tab, index) in pages"
            :key="tab.key"
            :transform="'translate(' + (index - (pages.length - 1) / 2) * 72 + ' 0)'"
            class="can-click"
            @click="page = tab.key"
          >
            <rect
              x="-34"
              y="-14"
              width="68"
              height="28"
              rx="4"
              ry="4"
              :fill="page === tab.key ? '#5D1EB0' : '#2e0d56'"
              stroke="#ffffff44"
              stroke-width="1.5"
            />
            <text x="0" y="0" text-anchor="middle">{{ tab.label }}</text>
          </g>
        </g>

        <!-- People: landing colonists from the ship, taking people aboard -->
        <g v-if="page === 'people'" transform="translate(0 115)">
          <text x="0" y="0" text-anchor="middle" font-size="0.9em">
            {{ planet.population.toLocaleString('en-US') }} people of {{ planet.cap.toLocaleString('en-US') }}
          </text>
          <text x="0" y="20" text-anchor="middle" font-size="0.75em" fill="#ffffff88">
            {{ aboard.toLocaleString('en-US') }} colonists aboard · 100 to a hold
          </text>
          <text v-if="!aboard && !planet.population" x="0" y="36" text-anchor="middle" font-size="0.7em" fill="#ffffff88">
            Recruit colonists at Earth's hiring hall, in Sol.
          </text>
          <g transform="translate(0 60)">
            <amount-dial v-model:value="land" label="Land colonists" :max="aboard" :step="10" />
          </g>
          <g transform="translate(0 125)">
            <menu-button :enabled="land > 0" :text="'Land ' + land.toLocaleString('en-US')" @buttonclick="doLand" />
          </g>
          <g transform="translate(0 185)">
            <amount-dial v-model:value="board" label="Take people aboard" :max="maxBoard" :step="10" />
          </g>
          <g transform="translate(0 250)">
            <menu-button
              :enabled="board > 0"
              :text="'Take ' + board.toLocaleString('en-US') + ' Aboard'"
              @buttonclick="doBoard"
            />
          </g>
        </g>

        <!-- Storage: what the planet makes and holds, and moving goods between it and the ship -->
        <g v-if="page === 'storage'" transform="translate(0 105)">
          <g
            v-for="(row, index) in storage"
            :key="row.good"
            :transform="'translate(' + (index % 2 ? 5 : -175) + ' ' + Math.floor(index / 2) * 28 + ')'"
            class="can-click"
            font-size="0.75em"
            @click="chooseGood(row.good)"
          >
            <rect
              x="0"
              y="-12"
              width="170"
              height="24"
              rx="3"
              :fill="good === row.good ? '#5D1EB0' : '#2e0d56'"
              stroke="#ffffff44"
              stroke-width="0.75"
            />
            <text x="6" y="0">{{ row.name }}</text>
            <text x="164" y="0" text-anchor="end" fill="#ffffffaa"
              >{{ row.stored.toLocaleString('en-US') }} · {{ row.aboard }} aboard</text
            >
          </g>
          <text x="0" y="110" text-anchor="middle" font-size="0.7em" fill="#ffffff88">
            In storage · aboard your ship. Storage holds up to
            {{ player.rules.storageCap.toLocaleString('en-US') }} of each good; choose one to move it.
          </text>
          <g v-if="good != null" transform="translate(0 150)">
            <amount-dial v-model:value="deliver" :label="'Deliver ' + goodName(good)" :max="maxDeliver" />
            <g transform="translate(0 62)">
              <menu-button :enabled="deliver > 0" :text="'Deliver ' + deliver" @buttonclick="doDeliver" />
            </g>
            <g transform="translate(0 115)">
              <amount-dial v-model:value="collect" :label="'Collect ' + goodName(good)" :max="maxCollect" />
            </g>
            <g transform="translate(0 177)">
              <menu-button :enabled="collect > 0" :text="'Collect ' + collect" @buttonclick="doCollect" />
            </g>
          </g>
        </g>

        <!-- Build: the next building in the line, and the Autofactory -->
        <g v-if="page === 'build'" transform="translate(0 110)">
          <text v-if="planet.building" x="0" y="0" text-anchor="middle" font-size="0.85em">
            One building at a time: the {{ BUILDING_NAMES[planet.building] }} is ready {{ readyWords(planet.readyAt) }}.
          </text>
          <text v-else-if="!nextBuildings.length" x="0" y="0" text-anchor="middle" font-size="0.85em">
            Every building is up.
          </text>
          <g v-for="(b, index) in nextBuildings" :key="b.building" :transform="'translate(0 ' + index * 170 + ')'">
            <text x="0" y="0" text-anchor="middle" font-size="1.1em">{{ BUILDING_NAMES[b.building] }}</text>
            <text x="0" y="22" text-anchor="middle" font-size="0.75em" fill="#ffffffaa">{{ costWords(b.cost) }}</text>
            <text
              v-for="(line, i) in b.missing"
              :key="line"
              x="0"
              :y="44 + i * 16"
              text-anchor="middle"
              font-size="0.7em"
              :fill="PINK"
            >
              Needs {{ line }}
            </text>
            <g :transform="'translate(0 ' + (66 + b.missing.length * 16) + ')'">
              <menu-button
                :enabled="!b.missing.length"
                :text="'Build ' + BUILDING_NAMES[b.building]"
                @buttonclick="doBuild(b.building)"
              />
            </g>
          </g>
          <g transform="translate(0 360)">
            <menu-button :enabled="true" text="Tech Tree" @buttonclick="openTechTree" />
          </g>
        </g>

        <!-- Factory: the Autofactory's orders and finished parts -->
        <g v-if="page === 'factory'" transform="translate(0 110)" font-size="0.8em">
          <text x="0" y="0" text-anchor="middle">Orders ({{ factory.queue.length }} of 5)</text>
          <text
            v-for="(o, i) in factory.queue"
            :key="'order' + i"
            x="0"
            :y="18 + i * 14"
            text-anchor="middle"
            fill="#ffffffaa"
            font-size="0.9em"
          >
            {{ o.count }} × {{ player.rules.parts[o.part].name }} · ready {{ readyWords(o.readyAt) }}
          </text>
          <g :transform="'translate(0 ' + (40 + factory.queue.length * 14) + ')'">
            <text x="0" y="0" text-anchor="middle">Finished parts</text>
            <text v-if="!finished.length" x="0" y="18" text-anchor="middle" fill="#ffffff88" font-size="0.9em">None yet</text>
            <g v-for="(row, i) in finished" :key="row.part" :transform="'translate(0 ' + (22 + i * 30) + ')'">
              <text x="-170" y="0" font-size="0.9em">{{ row.count }} × {{ row.name }}</text>
              <g class="can-click" transform="translate(20 0)" @click="doFitPlanet(row)">
                <rect x="-32" y="-13" width="64" height="26" rx="4" fill="#3d1273" stroke="#ffffff44" />
                <text x="0" y="0" text-anchor="middle" font-size="0.85em">Install</text>
              </g>
              <!-- Weapons can go on the moons instead: free mounts, outside the shield (D61) -->
              <g
                v-if="moons && MOON_WEAPONS[row.part]"
                :class="{ 'can-click': moonFit(row) > 0 }"
                :opacity="moonFit(row) > 0 ? 1 : 0.4"
                transform="translate(90 0)"
                @click="moonFit(row) > 0 && doFitMoons(row)"
              >
                <rect x="-32" y="-13" width="64" height="26" rx="4" fill="#3d1273" stroke="#ffffff44" />
                <text x="0" y="0" text-anchor="middle" font-size="0.85em">To moons</text>
              </g>
              <g v-if="row.part < 7" class="can-click" transform="translate(160 0)" @click="doFitShip(row)">
                <rect x="-32" y="-13" width="64" height="26" rx="4" fill="#3d1273" stroke="#ffffff44" />
                <text x="0" y="0" text-anchor="middle" font-size="0.85em">To ship</text>
              </g>
            </g>
          </g>
          <g transform="translate(0 330)">
            <menu-button :enabled="factory.queue.length < 5" text="Order Parts" @buttonclick="openOrders" />
          </g>
        </g>

        <!-- Ordering: the Autofactory's parts, what each takes, and how many to queue -->
        <g v-if="page === 'order'" transform="translate(0 105)" font-size="0.8em">
          <g
            v-for="(row, index) in orderable"
            :key="row.id"
            :transform="'translate(0 ' + index * 26 + ')'"
            class="can-click"
            @click="choosePart(row.id)"
          >
            <rect
              x="-175"
              y="-12"
              width="350"
              height="24"
              rx="4"
              :fill="part === row.id ? '#5D1EB0' : '#2e0d56'"
              stroke="#ffffff44"
              stroke-width="0.75"
            />
            <text x="-165" y="0">{{ row.name }}</text>
            <text x="165" y="0" text-anchor="end">{{ row.price }}¢ · {{ row.time }}</text>
          </g>
          <g v-if="part != null" transform="translate(0 250)">
            <amount-dial v-model:value="count" :label="'How many ' + partPlural(partName)" :max="20" />
            <text x="0" y="50" text-anchor="middle" font-size="0.8em" fill="#ffffffaa">{{ orderNeeds }}</text>
            <text x="0" y="68" text-anchor="middle" font-size="0.85em" :fill="orderProblem ? PINK : '#ffffff'">
              {{ orderProblem || orderTotal }}
            </text>
            <g transform="translate(0 100)">
              <menu-button :enabled="!orderProblem" :text="'Order ' + count" @buttonclick="placeOrder" />
            </g>
          </g>
          <g transform="translate(0 390)">
            <menu-button text="Back" @buttonclick="page = 'factory'" />
          </g>
        </g>

        <!-- Defenses: what's installed -->
        <g v-if="page === 'defenses'" transform="translate(0 110)" font-size="0.85em">
          <text v-if="!defenseRows.length" x="0" y="0" text-anchor="middle" fill="#ffffff88">
            No defenses installed. The Autofactory makes them; an Armory sells them.
          </text>
          <g v-for="(row, i) in defenseRows" :key="row.name" :transform="'translate(0 ' + i * 20 + ')'">
            <text x="-10" y="0" text-anchor="end">{{ row.name }}</text>
            <text x="10" y="0">{{ row.count }}</text>
          </g>
          <text
            v-if="moons"
            x="0"
            :y="defenseRows.length * 20 + 16"
            text-anchor="middle"
            font-size="0.85em"
            fill="#ffffffaa"
          >
            {{ moons }} {{ moons === 1 ? 'moon' : 'moons' }}: {{ moonMountsUsed }} of {{ moons * MOON_MOUNTS }} mounts used, outside the shield
          </text>
        </g>
      </g>
    </menu-container>
  </g>
</template>

<script>
import { mapState } from 'pinia'
import { useStarMapStore } from '@/stores/starmap'
import { useGameStateStore } from '@/stores/gamestate'
import { useUIStore } from '@/stores/ui'
import { usePlayerStore } from '@/stores/player'
import { planetTypeName } from '@/sdk/game/planet-types'
import { BUILDING_NAMES } from '@/sdk/client'
import { partPlural } from '@/sdk/parts'
import { YELLOW, PINK } from '@/libs/palette'
import MenuContainer from './menu-container/_menu-container.svg'
import MenuButton from './menu-button.svg'
import AmountDial from './widgets/amount-dial.svg'

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
  name: 'ColonyMenu',
  components: { MenuContainer, MenuButton, AmountDial },
  props: {
    /** The selected planet's key (sdk/system.js objectKey). */
    objectId: { type: String, default: null }
  },
  data() {
    return {
      player: usePlayerStore(),
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
      MOON_MOUNTS,
      MOON_WEAPONS,
      YELLOW,
      PINK
    }
  },
  computed: {
    ...mapState(useStarMapStore, ['systemObjects']),
    ...mapState(useGameStateStore, ['avatar', 'goods']),
    ...mapState(useUIStore, ['viewport']),
    object() {
      return this.systemObjects[this.objectId]
    },
    /** The planet as the contracts have it now (sdk/contracts.js toPlanet). */
    planet() {
      return this.player.planetById(this.object?.id) ?? this.object?.info ?? null
    },
    scale() {
      const width = Math.min(this.viewport.width - 100, 700)
      return Math.min(width > 450 ? 1.5 : 1, (this.viewport.height - 160) / 520)
    },
    pages() {
      const list = [
        { key: 'people', label: 'People' },
        { key: 'storage', label: 'Storage' },
        { key: 'build', label: 'Build' }
      ]
      if (this.planet.autofactory) list.push({ key: 'factory', label: 'Factory' })
      if (this.defenseRows.length || this.planet.level >= 6) list.push({ key: 'defenses', label: 'Defenses' })
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
    nextBuildings() {
      const p = this.planet
      if (p.building) return []
      const list = p.level < 6 ? [p.level + 1] : []
      if (p.level >= 2 && !p.autofactory) list.push(7)
      return list.map((building) => ({
        building,
        cost: this.player.rules.buildings[building],
        missing: this.player.missingFor(p, building)
      }))
    },
    factory() {
      return this.player.factories[this.planet.id] ?? { queue: [], stored: [] }
    },
    finished() {
      return (this.factory.stored ?? [])
        .map((count, part) => ({ part, count, name: this.player.rules.parts[part].name }))
        .filter((row) => row.count > 0)
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
        time: p.time >= 3600 ? `${+(p.time / 3600).toFixed(1)} h` : `${Math.round(p.time / 60)} min`
      }))
    },
    partName() {
      return this.part == null ? '' : this.player.rules.parts[this.part].name
    },
    /** What each one takes from the planet's storage. */
    orderNeeds() {
      const p = this.player.rules.parts[this.part]
      const goods = p.goods.map(([good, amount]) => `${amount} ${this.goods[good].toLowerCase()}`)
      return goods.length ? `Each takes ${goods.join(' and ')} from storage` : 'Takes no goods'
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
      if (p.credits * this.count > this.player.credits) return `Not enough credits: ${(p.credits * this.count).toLocaleString('en-US')}¢`
      for (const [good, amount] of p.goods) {
        if ((this.planet.stock[good] ?? 0) < amount * this.count)
          return `Needs ${amount * this.count} ${this.goods[good].toLowerCase()} in storage`
      }
      return null
    }
  },
  methods: {
    planetTypeName,
    partPlural,
    goodName(good) {
      return this.goods[good]
    },
    chooseGood(good) {
      this.good = good
      this.deliver = this.collect = 0
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
      this.o8audio.playEffect('click')
      if (await this.player.land(this.planet.id, this.land, this.object.name)) this.land = 0
    },
    async doBoard() {
      this.o8audio.playEffect('click')
      if (await this.player.board(this.planet.id, this.board)) this.board = 0
    },
    async doDeliver() {
      this.o8audio.playEffect('click')
      if (await this.player.deliver(this.planet.id, this.good, this.deliver, this.goodName(this.good))) this.deliver = 0
    },
    async doCollect() {
      this.o8audio.playEffect('click')
      if (await this.player.collect(this.planet.id, this.good, this.collect, this.goodName(this.good))) this.collect = 0
    },
    doBuild(building) {
      this.o8audio.playEffect('click')
      this.player.build(this.planet.id, building, this.object.name)
    },
    doFitPlanet(row) {
      this.o8audio.playEffect('click')
      this.player.fitPlanet(this.planet.id, row.part, row.count)
    },
    /** How many of a finished weapon fit on the moons' free mounts. */
    moonFit(row) {
      const each = MOON_WEAPONS[row.part]
      if (!each) return 0
      return Math.min(row.count, Math.floor((this.moons * MOON_MOUNTS - this.moonMountsUsed) / each))
    },
    doFitMoons(row) {
      this.o8audio.playEffect('click')
      this.player.fitMoons(this.planet.id, row.part, this.moonFit(row))
    },
    doFitShip(row) {
      this.o8audio.playEffect('click')
      this.player.fitShip(this.planet.id, row.part, 1)
    },
    openOrders() {
      this.o8audio.playEffect('click')
      this.page = 'order'
    },
    choosePart(part) {
      this.o8audio.playEffect('click')
      this.part = part
      this.count = 1
    },
    async placeOrder() {
      this.o8audio.playEffect('click')
      if (await this.player.order(this.planet.id, this.part, this.count)) {
        this.part = null
        this.count = 1
        this.page = 'factory'
      }
    },
    openTechTree() {
      this.o8audio.playEffect('click')
      useUIStore().techTreeOpen = true
    }
  }
}
</script>
