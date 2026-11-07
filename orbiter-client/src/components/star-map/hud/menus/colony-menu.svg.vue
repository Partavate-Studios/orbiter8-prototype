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
              y="-11"
              width="68"
              height="22"
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
            :transform="'translate(' + (index % 2 ? 5 : -175) + ' ' + Math.floor(index / 2) * 22 + ')'"
            class="can-click"
            font-size="0.75em"
            @click="chooseGood(row.good)"
          >
            <rect
              x="0"
              y="-9"
              width="170"
              height="18"
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
          <text x="0" y="98" text-anchor="middle" font-size="0.7em" fill="#ffffff88">
            Holds up to {{ player.rules.storageCap.toLocaleString('en-US') }} of each good
          </text>
          <g v-if="good != null" transform="translate(0 135)">
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
            <g v-for="(row, i) in finished" :key="row.part" :transform="'translate(0 ' + (20 + i * 26) + ')'">
              <text x="-170" y="0" font-size="0.9em">{{ row.count }} × {{ row.name }}</text>
              <g class="can-click" transform="translate(60 0)" @click="doFitPlanet(row)">
                <rect x="-40" y="-10" width="80" height="20" rx="4" fill="#3d1273" stroke="#ffffff44" />
                <text x="0" y="0" text-anchor="middle" font-size="0.85em">Install</text>
              </g>
              <g v-if="row.part < 7" class="can-click" transform="translate(140 0)" @click="doFitShip(row)">
                <rect x="-36" y="-10" width="72" height="20" rx="4" fill="#3d1273" stroke="#ffffff44" />
                <text x="0" y="0" text-anchor="middle" font-size="0.85em">To ship</text>
              </g>
            </g>
          </g>
          <g transform="translate(0 330)">
            <menu-button :enabled="factory.queue.length < 5" text="Order Parts" @buttonclick="doOrder" />
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
import { useDialogStore } from '@/stores/dialog'
import { planetTypeName } from '@/sdk/game/planet-types'
import { BUILDING_NAMES } from '@/sdk/client'
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
  ['bfg', 'BFG']
]

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
      BUILDING_NAMES,
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
    }
  },
  methods: {
    planetTypeName,
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
    doFitShip(row) {
      this.o8audio.playEffect('click')
      this.player.fitShip(this.planet.id, row.part, 1)
    },
    async doOrder() {
      this.o8audio.playEffect('click')
      const dialog = useDialogStore()
      const parts = this.player.rules.parts
      const list = parts.map((p, i) => `${i + 1} ${p.name} (${p.credits.toLocaleString('en-US')}¢)`).join(', ')
      const which = await dialog.ask({
        title: 'Order Parts',
        message: `Which part? ${list}.`,
        input: { label: 'Part number', kind: 'number', min: 1, max: parts.length },
        confirm: 'Next'
      })
      if (!which) return
      const part = which - 1
      const count = await dialog.ask({
        title: 'Order ' + parts[part].name,
        message: `${parts[part].credits.toLocaleString('en-US')}¢ each, paid now; the Autofactory builds them in turn.`,
        input: { label: 'How many', kind: 'number', min: 1, max: 99, value: '1' },
        confirm: 'Order'
      })
      if (count) this.player.order(this.planet.id, part, count)
    },
    openTechTree() {
      this.o8audio.playEffect('click')
      useUIStore().techTreeOpen = true
    }
  }
}
</script>
