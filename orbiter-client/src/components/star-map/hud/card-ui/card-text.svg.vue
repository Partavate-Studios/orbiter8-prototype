<template>
  <g transform="translate(-70 -70)">
    <!-- the name's shadow, on the ship's purple title only; others sit dark on their color (row I1) -->
    <text
      v-if="!darkTitle"
      fill="#000000"
      x="70"
      y="10"
      :font-size="fitSize(systemObjects[objectId].name, 8, 122, 700)"
      text-anchor="middle"
      transform="translate(0 5)"
      font-style="bold"
      stroke="#000000"
      stroke-width="2"
      opacity="0.3"
    >
      {{ systemObjects[objectId].name }}
    </text>
    <text
      :fill="darkTitle ? '#1b1531' : '#ffffff'"
      :font-weight="darkTitle ? 'bold' : 'normal'"
      x="70"
      y="10"
      :font-size="fitSize(systemObjects[objectId].name, 8, 122, 700)"
      text-anchor="middle"
      transform="translate(0 5)"
      font-style="bold"
    >
      {{ systemObjects[objectId].name }}
    </text>

    <!-- What it is, then its facts as label and value rows big enough to read (Koda, 2026-11-17),
         then, for a port its goods and for your ship its cargo, in a grid -->
    <text x="12" y="114" font-size="6.6" font-weight="bold" letter-spacing="0.8" :fill="accent">{{ typeLabel }}</text>
    <text v-if="tag" x="128" y="114" text-anchor="end" font-size="5.6" fill="#9088aa">{{ tag }}</text>
    <rect x="10" y="117" width="120" height="0.6" fill="#ffffff" opacity="0.14" />

    <g v-for="(row, i) in rows" :key="row.label" :transform="`translate(0 ${128 + i * ROW})`">
      <text x="12" y="0" font-size="6" fill="#a99fc6">{{ row.label }}</text>
      <text v-if="row.letters" x="128" y="0" text-anchor="end" font-size="7.4" font-weight="bold" font-family="monospace" letter-spacing="0.6">
        <tspan v-for="c in row.letters" :key="c.id" :fill="c.wanted ? YELLOW_LIGHT : c.letter === '-' ? '#6f6890' : '#f1eefa'">{{ c.letter }}</tspan>
      </text>
      <text v-else x="128" y="0" text-anchor="end" font-weight="bold" :font-size="fitSize(row.value, 7.6, row.width ?? 82, 700)" :fill="row.color ?? '#ffffff'">
        {{ row.value }}
      </text>
    </g>

    <!-- a port's goods (code, buying ↑ or selling ↓, next-unit price) or your cargo (code, units) -->
    <g v-if="grid.length" :transform="`translate(0 ${gridTop})`" font-size="6.4">
      <g v-for="(cell, i) in grid" :key="cell.key" :transform="`translate(${12 + (i % gridColumns) * (116 / gridColumns)} ${Math.floor(i / gridColumns) * 9.5})`">
        <text x="0" y="0" font-weight="bold" :fill="cell.color">{{ cell.code }}</text>
        <text :x="116 / gridColumns - 6" y="0" text-anchor="end" :fill="cell.wanted ? YELLOW_LIGHT : '#e6dcf5'">{{ cell.value }}</text>
      </g>
    </g>
    <text v-if="note" x="70" y="198" text-anchor="middle" font-size="5.6" fill="#a99fc6">{{ note }}</text>
  </g>
</template>

<script>
import { fitSize } from '@/libs/fit-text'
import { useGameStateStore } from '@/stores/gamestate'
import { usePlayerStore } from '@/stores/player'
import { mapState } from 'pinia'
import { useStarMapStore } from '@/stores/starmap'

import { planetTypeName } from '@orbiter8/sdk/game/planet-types'
import { shortGoodName } from '@orbiter8/sdk/game/trade'
import { BUILDING_NAMES } from '@orbiter8/sdk/client'
import { YELLOW_LIGHT, PINK_LIGHT, STAR_CLASSES, goodColor } from '@/libs/palette'
import { goodCode, portCode } from '@/libs/goods'
import { yields } from '@orbiter8/sdk/belt-gen'
import { ASTEROID_BUILDING_NAMES } from '@orbiter8/sdk/contracts'
import { FEDERATION } from '@orbiter8/sdk/system'
import { CARD_THEMES, mixHex, unwrapTheme } from '@/libs/card-theme'

/** The rows' spacing, in card units. */
const ROW = 12.5

export default {
  name: 'SpriteInfo',
  inject: { cardTheme: { default: null } },
  props: {
    /** The selected object's key (see sdk/system.js objectKey). */
    objectId: { type: String, default: null }
  },
  data() {
    return { YELLOW_LIGHT, ROW }
  },
  computed: {
    ...mapState(useStarMapStore, ['systemObjects', 'players', 'spriteIds']),
    ...mapState(useGameStateStore, ['avatar', 'goods']),
    o() {
      return this.systemObjects[this.objectId]
    },
    /** Every card but the ship's has its title pill in its color, with the name dark on it (row I1). */
    darkTitle() {
      const t = this.cardTheme
      return typeof t !== 'string' && unwrapTheme(t) !== CARD_THEMES.ship
    },
    /** The card's own color, lightened to read on the dark panel. */
    accent() {
      const t = unwrapTheme(this.cardTheme)
      return t === CARD_THEMES.ship ? '#c9b6ff' : mixHex(t.base, '#ffffff', 0.25)
    },
    typeName() {
      switch (this.o.type) {
        case 'star':
          return this.o.blackHole ? 'Black Hole' : 'Warpstar'
        case 'ship':
          return 'Starship'
        case 'moon':
          return 'Moon'
        case 'planet':
          return 'Planet'
        case 'station':
          return this.o.onAsteroid ? 'Asteroid Port' : 'Space Station'
        case 'asteroid':
          return 'Asteroid'
        case 'section':
          return 'Empty Space'
      }
      return null
    },
    typeLabel() {
      return (this.typeName ?? '').toUpperCase()
    },
    /** A small note at the header's right: a planet's orbit, a star's class, a ship's number. */
    tag() {
      const o = this.o
      if (o.type === 'planet') return 'Orbit ' + o.orbitalPosition
      if (o.type === 'star' && o.spectral && !o.blackHole) return 'Class ' + o.spectral
      if (o.type === 'ship') return '#' + o.id
      return ''
    },
    cargo() {
      return this.avatar?.ship?.cargo ?? []
    },
    goodNames() {
      return this.goods ?? []
    },
    /** The owner, in words: You (yellow), the Federation, a pilot, or unclaimed. */
    owner() {
      const o = this.o
      if (o.isMine) return { label: 'Owner', value: 'You', color: YELLOW_LIGHT }
      if (o.federation || o.ownerName === FEDERATION) return { label: 'Owner', value: 'The Federation', color: '#c9b6ff' }
      if (!o.owner) return { label: 'Owner', value: 'Unclaimed', color: '#a99fc6' }
      return { label: 'Owner', value: this.ownerName }
    },
    rows() {
      const o = this.o
      const info = o.info
      switch (o.type) {
        case 'planet': {
          const rows = [this.owner, { label: 'World', value: `${planetTypeName(o.class)} · size ${o.size}${o.rings ? ' · rings' : ''}` }]
          const station = o.hasStation ? this.systemObjects[o.stationKey] : null
          if (station) rows.push({ label: 'Port', letters: portCode(station.goods ?? [], this.goodNames.length, this.cargo) })
          else rows.push({ label: 'Port', value: 'none', color: '#a99fc6' })
          rows.push({ label: 'Moons', value: o.moons?.length ? String(o.moons.length) : 'none', color: o.moons?.length ? undefined : '#a99fc6' })
          if (info && (info.level > 0 || info.population > 0)) {
            rows.push({ label: 'People', value: `${info.population.toLocaleString('en-US')} of ${info.cap.toLocaleString('en-US')}` })
          }
          if (info?.building > 0) rows.push({ label: 'Building', value: `${BUILDING_NAMES[info.building] ?? 'Next'} · ${this.readyIn(info.readyAt)}`, color: '#b9a0ff' })
          return rows
        }
        case 'station': {
          const rows = [this.owner, { label: 'Trades', letters: portCode(o.goods ?? [], this.goodNames.length, this.cargo) }]
          const services = [o.yard && 'Yards', o.armory && 'Armory'].filter(Boolean)
          rows.push({ label: 'Also', value: services.length ? services.join(' · ') : 'trade only', color: services.length ? undefined : '#a99fc6' })
          return rows
        }
        case 'ship': {
          const around = this.systemObjects[o.orbiting]
          if (!o.isMine) return [{ label: 'Pilot', value: this.ownerName }, { label: 'At', value: around?.name ?? '' }]
          const ship = this.avatar.ship
          return [
            { label: 'Captain', value: this.avatar.name },
            { label: 'Holds', value: `${ship.usedHolds ?? 0} of ${ship.holds} used` },
            { label: 'At', value: around?.name ?? '' }
          ]
        }
        case 'star': {
          const star = STAR_CLASSES[o.spectral]
          const planets = this.spriteIds.planets?.length ?? 0
          return [
            { label: 'Kind', value: o.blackHole ? 'Black hole' : star ? `${star.name.charAt(0).toUpperCase()}${star.name.slice(1)} star` : 'Star' },
            { label: 'Found by', value: this.discoveredBy },
            { label: 'Owner', value: o.keeperName || 'none yet', color: o.keeperName ? undefined : '#a99fc6' },
            { label: 'Planets', value: String(planets) }
          ]
        }
        case 'moon':
          return [this.owner, { label: 'Size', value: String(o.size) }, { label: 'Orbits', value: this.systemObjects[o.orbiting]?.name ?? '' }]
        case 'asteroid': {
          const rows = [this.owner, { label: 'Kind', value: `${o.compositionName} · size ${o.size}` }, { label: 'Yields', value: this.yieldsText }]
          if (this.asteroidInfo) {
            const pool = this.asteroidInfo.pool
            rows.push({ label: 'Built', value: this.asteroidStep })
            rows.push({ label: 'Drones', value: `${pool.total - pool.defense} mining · ${pool.defense} guard` })
          }
          return rows
        }
        case 'section':
          return [
            { label: 'Dust', value: o.dustName },
            { label: 'Yields', value: this.yieldsText },
            { label: 'Slots', value: `${this.freeSlots} of 6 free`, color: this.freeSlots ? undefined : PINK_LIGHT }
          ]
      }
      return []
    },
    /** A port's goods, or your ship's cargo. */
    grid() {
      const o = this.o
      if (o.type === 'station') {
        return (o.goods ?? [])
          .filter((g) => g.mode === 'buys' || g.mode === 'sells')
          .map((g) => ({
            key: g.id,
            code: goodCode(g.id, this.goodNames[g.id]),
            color: goodColor(g.id),
            value: `${g.mode === 'buys' ? '↑' : '↓'}${g.price}¢`,
            wanted: g.mode === 'buys' && (this.cargo[g.id] ?? 0) > 0
          }))
      }
      if (o.type === 'ship' && o.isMine) {
        const cells = this.cargo
          .map((units, id) => ({ key: id, code: goodCode(id, this.goodNames[id]), color: goodColor(id), value: String(units) }))
          .filter((c) => Number(c.value) > 0)
        if (this.avatar.ship.colonists > 0) cells.push({ key: 'col', code: 'COL', color: '#c3b3da', value: String(this.avatar.ship.colonists) })
        return cells
      }
      return []
    },
    gridColumns() {
      return this.o.type === 'ship' ? 3 : 2
    },
    gridTop() {
      return 128 + this.rows.length * ROW + 1
    },
    note() {
      if (this.o.type === 'section') return 'Ships mine here with their drones.'
      if (this.o.type === 'ship' && this.o.isMine && !this.grid.length) return 'The holds are empty.'
      return ''
    },
    /** What an asteroid or an empty section's dust yields, by good name. */
    yieldsText() {
      const kind = this.o.type === 'asteroid' ? this.o.composition : this.o.dust
      return yields(kind ?? 0)
        .map((g) => shortGoodName(this.goodNames[g] ?? '', true))
        .join(', ')
    },
    asteroidInfo() {
      const info = this.o.info
      return info?.pool ? info : null
    },
    /** The step of its line an asteroid has reached (D88). */
    asteroidStep() {
      return ASTEROID_BUILDING_NAMES[this.asteroidInfo?.level] ?? 'nothing yet'
    },
    freeSlots() {
      const slots = this.o.slots ?? []
      return slots.filter((s) => !s || s.full).length + Math.max(0, 6 - slots.length)
    },
    discoveredBy() {
      const o = this.o
      return o.keeper === 'federation' && this.objectId === 'star' && !o.owner ? 'The Federation' : this.ownerName
    },
    ownerName() {
      const address = this.o.owner
      if (this.o.federation) return 'The Federation'
      if (!address) return 'unclaimed'
      const short = address.slice(0, 6) + '…' + address.slice(-4)
      return this.players[address] ?? short
    }
  },
  methods: {
    fitSize,
    readyIn(at) {
      const left = at - usePlayerStore().now / 1000
      return left > 60 ? `${Math.ceil(left / 60)} min` : 'any moment'
    }
  }
}
</script>
