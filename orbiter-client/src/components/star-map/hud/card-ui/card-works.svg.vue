<template>
  <!-- What's built on a planet or asteroid, as icons arced under its picture on the card (Koda,
       2026-11-17: make infrastructure clear at a glance). Each in a dark well with a lavender ring; the
       one being built has a dashed ring and shows faintly. Nothing built, nothing shown. -->
  <g v-if="works.length" class="card-works">
    <g v-for="(w, i) in works" :key="w.name" :transform="`translate(${place(i).x} ${place(i).y})`" :opacity="w.building ? 0.6 : 1">
      <circle r="8.5" fill="#1a1331" :stroke="w.building ? '#b9a0ff' : '#8f7fd0'" stroke-width="1" :stroke-dasharray="w.building ? '2 1.5' : undefined" />
      <image :href="w.art" x="-7" y="-7" width="14" height="14" />
      <title>{{ w.building ? w.name + ' (being built)' : w.name }}</title>
    </g>
  </g>
</template>

<script>
import { mapState } from 'pinia'
import { useStarMapStore } from '@/stores/starmap'
import citadel from '@/assets/art/citadel.svg'
import colony from '@/assets/art/colony.svg'
import station from '@/assets/art/port.svg'
import exchange from '@/assets/art/exchange.svg'
import yards from '@/assets/art/yards.svg'
import armory from '@/assets/art/armory.svg'
import autofactory from '@/assets/art/autofactory.svg'
import platform from '@/assets/art/asteroid-station.svg'
import drones from '@/assets/art/drone-swarm.svg'

/** A planet's line (Planets.build, D57): levels 1–6, then the Autofactory (7). */
const PLANET_LINE = [
  null,
  { name: 'Citadel', art: citadel },
  { name: 'Colony', art: colony },
  { name: 'Station', art: station },
  { name: 'Port', art: exchange },
  { name: 'Yards', art: yards },
  { name: 'Armory', art: armory },
  { name: 'Autofactory', art: autofactory }
]
/** An asteroid's line (D88): Platform 1, Mine 2, Port 4, Armory 6. */
const ASTEROID_LINE = { 1: { name: 'Platform', art: platform }, 2: { name: 'Mine', art: drones }, 4: { name: 'Port', art: exchange }, 6: { name: 'Armory', art: armory } }

export default {
  name: 'CardWorks',
  props: {
    objectId: { type: String, default: null }
  },
  computed: {
    ...mapState(useStarMapStore, ['systemObjects']),
    works() {
      const o = this.systemObjects[this.objectId]
      const info = o?.info
      if (!o || (o.type !== 'planet' && o.type !== 'asteroid')) return []
      if (!info && !o.hasStation) return []
      const level = Number(info?.level ?? 0)
      const building = Number(info?.building ?? 0)
      if (o.type === 'asteroid') {
        // Sol's are the Federation's, fully built: the whole line, and a yard beside its port
        if (o.federation && o.hasStation) {
          const [platformW, mine, port, armoryW] = Object.values(ASTEROID_LINE)
          return [platformW, mine, port, PLANET_LINE[5], armoryW].map((w) => ({ ...w, building: false }))
        }
        return Object.entries(ASTEROID_LINE)
          .filter(([n]) => Number(n) <= level || Number(n) === building)
          .map(([n, w]) => ({ ...w, building: Number(n) > level }))
      }
      // Its port shows what it has too: Sol's ports, yards and armories are the Federation's, not built
      // along a line (their planets' level stays 0).
      const station = o.hasStation ? this.systemObjects[o.stationKey] : null
      const has = (n) => n <= level || (station && ((n === 3 || n === 4) || (n === 5 && station.yard) || (n === 6 && station.armory)))
      const out = []
      for (let n = 1; n <= 6; n++) if (has(n) || n === building) out.push({ ...PLANET_LINE[n], building: !has(n) })
      if (info?.autofactory || building === 7) out.push({ ...PLANET_LINE[7], building: !info?.autofactory })
      return out
    }
  },
  methods: {
    /** Along an arc under the picture, centered, each well a little clear of the next. */
    place(i) {
      const n = this.works.length
      const radius = 46
      const step = 19 / radius // the wells are 17 across
      const angle = Math.PI / 2 - (i - (n - 1) / 2) * step
      return { x: Math.cos(angle) * radius, y: -16 + Math.sin(angle) * radius }
    }
  }
}
</script>
