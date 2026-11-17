<template>
  <!-- An asteroid's works (D88, D90): its line (Platform, Mine, Port, Armory) and the next step's cost,
       its people, its drones (mining and defending), and what its store holds. In the loadout's row style. -->
  <g v-if="asteroid && info">
    <menu-container>
      <g :transform="'translate(0 -400) scale(' + scale + ')'" fill="#ffffff" dominant-baseline="middle" font-size="0.85em">
        <text x="0" y="5" text-anchor="middle" fill="#ffffff88" :font-size="fitSize(asteroid.name, 24, 340)">{{ asteroid.name }}</text>
        <text x="0" y="32" text-anchor="middle" fill="#ffffffaa" font-size="0.9em">
          {{ asteroid.compositionName }} asteroid, size {{ asteroid.size }} · yields {{ yieldsText }}
        </text>

        <!-- The line: each step, done ones ticked -->
        <g transform="translate(0 70)">
          <g v-for="(step, i) in line" :key="step.n" :transform="`translate(${-150 + i * 100} 0)`">
            <circle cx="0" cy="0" r="16" :fill="step.done ? '#3d1273' : 'none'" :stroke="step.done ? YELLOW : '#ffffff55'" />
            <text x="0" y="1" text-anchor="middle" :fill="step.done ? YELLOW : '#ffffff88'">{{ step.done ? '✓' : i + 1 }}</text>
            <text x="0" y="30" text-anchor="middle" :fill="step.done ? '#ffffff' : '#ffffff88'" font-size="0.9em">{{ step.name }}</text>
          </g>
        </g>
        <g transform="translate(0 135)">
          <text v-if="info.building" x="0" y="0" text-anchor="middle">Building the {{ stepName(info.building) }}: ready {{ readyWords(info.readyAt) }}</text>
          <template v-else-if="next">
            <text x="0" y="0" text-anchor="middle">Next: the {{ next.name }}, {{ costWords(next.cost) }}</text>
            <g transform="translate(0 32)">
              <menu-button :enabled="canBuild" :text="'Build the ' + next.name" @buttonclick="build" />
            </g>
          </template>
          <text v-else x="0" y="0" text-anchor="middle" fill="#ffffffaa">Fully built.</text>
        </g>

        <!-- People and drones -->
        <g transform="translate(0 215)">
          <text x="-170" y="0">People {{ info.population }} of {{ info.cap }}</text>
          <g v-if="player.ship?.colonists > 0" class="can-click" transform="translate(120 0)" @click="landPeople">
            <rect x="-50" y="-13" width="100" height="26" rx="4" fill="#3d1273" stroke="#ffffff44" />
            <text x="0" y="0" text-anchor="middle" font-size="0.9em">Land {{ player.ship.colonists }}</text>
          </g>
        </g>
        <g transform="translate(0 255)">
          <text x="-170" y="0">Drones {{ pool.total }} of {{ pool.room }}: {{ pool.total - pool.defense }} mining</text>
          <g v-if="shipMiners > 0" class="can-click" transform="translate(120 0)" @click="landDrones">
            <rect x="-50" y="-13" width="100" height="26" rx="4" fill="#3d1273" stroke="#ffffff44" />
            <text x="0" y="0" text-anchor="middle" font-size="0.9em">Land {{ landable }}</text>
          </g>
        </g>
        <g transform="translate(0 290)">
          <text x="-170" y="0">Defending: {{ pool.defense }}</text>
          <g class="can-click" transform="translate(60 0)" @click="setDefense(pool.defense - 1)">
            <rect x="-13" y="-13" width="26" height="26" rx="4" fill="#3d1273" stroke="#ffffff44" />
            <text x="0" y="0" text-anchor="middle">−</text>
          </g>
          <g class="can-click" transform="translate(100 0)" @click="setDefense(pool.defense + 1)">
            <rect x="-13" y="-13" width="26" height="26" rx="4" fill="#3d1273" stroke="#ffffff44" />
            <text x="0" y="0" text-anchor="middle">+</text>
          </g>
          <g v-if="pool.total > 0" class="can-click" transform="translate(170 0)" @click="boardDrones">
            <rect x="-40" y="-13" width="80" height="26" rx="4" fill="#3d1273" stroke="#ffffff44" />
            <text x="0" y="0" text-anchor="middle" font-size="0.9em">Board all</text>
          </g>
        </g>
        <text v-if="info.level < 2" x="0" y="318" text-anchor="middle" fill="#ffffff88" font-size="0.85em">
          Drones mine once the Mine stands.
        </text>

        <!-- The store -->
        <g transform="translate(0 350)">
          <text v-if="!stored.length" x="0" y="0" text-anchor="middle" fill="#ffffff88">The store is empty.</text>
          <g v-for="(row, i) in stored" :key="row.good" :transform="`translate(0 ${i * 30})`">
            <text x="-170" y="0">{{ row.units }} × {{ row.name }}</text>
            <g v-if="player.freeBays > 0" class="can-click" transform="translate(120 0)" @click="collect(row)">
              <rect x="-50" y="-13" width="100" height="26" rx="4" fill="#3d1273" stroke="#ffffff44" />
              <text x="0" y="0" text-anchor="middle" font-size="0.9em">Load {{ Math.min(row.units, player.freeBays) }}</text>
            </g>
          </g>
        </g>
      </g>
    </menu-container>
  </g>
</template>

<script>
import { fitSize } from '@/libs/fit-text'
import { mapState } from 'pinia'
import { useUIStore } from '@/stores/ui'
import { useStarMapStore } from '@/stores/starmap'
import { usePlayerStore } from '@/stores/player'
import { YELLOW } from '@/libs/palette'
import { yields } from '@orbiter8/sdk/belt-gen'
import { ASTEROID_STEPS, ASTEROID_BUILDING_NAMES } from '@orbiter8/sdk/contracts'
import { shortGoodName } from '@orbiter8/sdk/game/trade'
import MenuContainer from './menu-container/_menu-container.svg'
import MenuButton from './menu-button.svg'

export default {
  name: 'AsteroidMenu',
  components: { MenuContainer, MenuButton },
  data() {
    return { player: usePlayerStore(), YELLOW }
  },
  computed: {
    ...mapState(useUIStore, ['viewport', 'selected']),
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
    scale() {
      const width = Math.min(this.viewport.width - 100, 700)
      return Math.min(width > 450 ? 1.4 : 1, (this.viewport.height - 160) / 520)
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
      return ASTEROID_STEPS.map((n) => ({ n, name: ASTEROID_BUILDING_NAMES[n], done: this.info.level >= n }))
    },
    next() {
      const n = ASTEROID_STEPS.find((step) => step > this.info.level)
      if (n === undefined) return null
      return { n, name: ASTEROID_BUILDING_NAMES[n], cost: this.player.rules?.asteroidBuildings?.[n] }
    },
    canBuild() {
      const c = this.next?.cost
      if (!c) return false
      const goodsThere = c.goods.every(([g, units]) => (this.info.stock?.[g] ?? 0) >= units)
      return this.player.credits >= c.credits && this.info.population >= c.people && goodsThere
    },
    shipMiners() {
      return this.player.ship?.loadout?.miningDrones ?? 0
    },
    landable() {
      return Math.min(this.shipMiners, Math.max(0, this.pool.room - this.pool.total))
    },
    stored() {
      return (this.info.stock ?? [])
        .map((units, good) => ({ good, units, name: this.goodNames[good] ?? 'Good ' + good }))
        .filter((row) => row.units > 0)
    }
  },
  methods: {
    fitSize,
    stepName(n) {
      return ASTEROID_BUILDING_NAMES[n] ?? 'next step'
    },
    readyWords(at) {
      const left = at - this.player.now / 1000
      return left > 60 ? `in ${Math.ceil(left / 60)} min` : 'any moment'
    },
    costWords(c) {
      if (!c) return ''
      const parts = [`${c.credits.toLocaleString('en-US')}¢`]
      if (c.people) parts.push(`${c.people} people`)
      for (const [g, units] of c.goods) parts.push(`${units} ${shortGoodName(this.goodNames[g] ?? '', true)}`)
      return parts.join(', ')
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
    collect(row) {
      this.click()
      this.player.collect(this.asteroid.objectId, row.good, Math.min(row.units, this.player.freeBays), row.name)
    }
  }
}
</script>
