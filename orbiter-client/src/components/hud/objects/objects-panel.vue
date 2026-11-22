<template>
  <!-- Everything in this system, in one list (Koda, 2026-11-21; docs/ui-plan.md 4.1): what's at the
       center first and always in view, then each planet in orbit order with its station and moons
       folded inside it, the belt with its places, then the ships. It took in the planets, ports and
       ships menus. Icon tabs along the top show one kind; stations can be narrowed to the ones that buy
       what you carry (the ports menu's rows, kept whole: ports/ports-panel.vue). Pressing a row selects
       it, so the card in your hand shows it while you browse; Go on the selected row closes the list. -->
  <div class="objects-panel" :class="{ narrow }">
    <div class="tabs" role="tablist" aria-label="Show">
      <button
        v-for="tab in KINDS"
        :key="tab.kind"
        type="button"
        role="tab"
        class="tab"
        :class="{ on: listKind === tab.kind, yours: tab.kind === 'yours' }"
        :title="tab.title"
        :aria-label="tab.title"
        :aria-selected="listKind === tab.kind ? 'true' : 'false'"
        @click="setKind(tab.kind)"
      >
        <small-icon :name="tab.icon" />
      </button>
      <span class="count">{{ countWords }}</span>
    </div>
    <div v-if="listKind === 'station'" class="tabs wants" role="tablist" aria-label="Which stations">
      <button v-for="want in WANTS" :key="want.want" type="button" role="tab" class="tab" :class="{ on: listWant === want.want }" :title="want.title" :aria-label="want.title" :aria-selected="listWant === want.want ? 'true' : 'false'" @click="setWant(want.want)">
        <small-icon :name="want.icon" />
      </button>
      <span class="count">{{ wantWords }}</span>
    </div>

    <!-- what's at the center: a star, a black hole (one day a pair). Always in view. -->
    <button v-if="center" type="button" class="row center" :class="{ on: center.key === selected }" @click="press(center)">
      <span class="pic"><span class="sphere" :style="center.style" /></span>
      <span class="text"><b>{{ center.name }}</b><small>{{ center.sub }}</small></span>
      <span v-if="center.key === selected" class="go" role="button" @click.stop="go">Go<small-icon name="go" /></span>
    </button>

    <ports-panel v-if="listKind === 'station'" embedded :narrow="narrow" :want="listWant" />
    <template v-else>
      <p v-if="!rows.length" class="none">{{ listKind === 'yours' ? 'Nothing here is yours yet.' : 'None here.' }}</p>
      <template v-for="row in rows" :key="row.id">
        <h3 v-if="row.heading">{{ row.heading }}</h3>
        <div v-else class="row" :class="{ on: row.key === selected, child: row.depth }">
          <button v-if="row.fold !== undefined" type="button" class="fold" :title="row.fold ? 'Fold' : 'Unfold'" :aria-label="(row.fold ? 'Fold ' : 'Unfold ') + row.name" :aria-expanded="row.fold ? 'true' : 'false'" @click="toggleFold(row.id)">
            <svg viewBox="-6 -6 12 12" aria-hidden="true"><path :d="row.fold ? 'M-4 -2L0 2L4 -2' : 'M-2 -4L2 0L-2 4'" /></svg>
          </button>
          <span v-else class="fold" aria-hidden="true" />
          <button type="button" class="body" :disabled="!row.key" @click="press(row)">
            <span class="pic">
              <img v-if="row.art" :src="row.art" alt="" />
              <span v-else-if="row.ring" class="belt-ring" />
              <small-icon v-else-if="row.icon" :name="row.icon" />
              <span v-else class="sphere" :style="row.style" />
              <i v-if="row.mine" class="mine" aria-hidden="true" />
              <i v-if="row.besieged" class="siege" aria-hidden="true" />
            </span>
            <span class="text"><b>{{ row.name }}</b><small :class="{ gain: row.gain }">{{ row.sub }}</small></span>
            <span v-if="row.code" class="letters" :aria-label="'Trade code ' + row.code.map((c) => c.letter).join('')">
              <b v-for="c in row.code" :key="c.id" :class="{ wanted: c.wanted, none: c.letter === '-' }">{{ c.letter }}</b>
            </span>
            <!-- folded: what's inside, as small marks -->
            <span v-else-if="row.marks?.length" class="marks">
              <span v-for="mark in row.marks" :key="mark.kind" class="mark" :title="mark.title">
                <img v-if="mark.art" :src="mark.art" alt="" /><span v-else class="sphere" :style="mark.style" /><em v-if="mark.count > 1">{{ mark.count }}</em>
              </span>
            </span>
          </button>
          <button v-if="row.key && row.key === selected" type="button" class="go" :title="'Go to ' + row.name" @click="go">Go<small-icon name="go" /></button>
        </div>
      </template>
    </template>
  </div>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import { STAR_KEY, FEDERATION } from '@orbiter8/sdk/system'
import { planetTypeName } from '@orbiter8/sdk/game/planet-types'
import { useStarMapStore } from '@/stores/starmap'
import { useUIStore } from '@/stores/ui'
import { useGameStateStore } from '@/stores/gamestate'
import { usePlayerStore } from '@/stores/player'
import { STAR_CLASSES } from '@/libs/palette'
import { portCode } from '@/libs/goods'
import { ASTEROID_ART, BELT_KEY, DUST_ART, PORT_ART, beltKeys, bodySphere, homeOf, sphere } from '@/libs/body-art'
import SmallIcon from '../small-icon.vue'
import PortsPanel from '../ports/ports-panel.vue'
import { portSigns } from '../ports/ports'

/** The kinds the tabs show. */
const KINDS = [
  { kind: 'all', icon: 'all', title: 'Everything here' },
  { kind: 'planet', icon: 'planet', title: 'Planets' },
  { kind: 'station', icon: 'station', title: 'Stations' },
  { kind: 'moon', icon: 'moon', title: 'Moons' },
  { kind: 'asteroid', icon: 'asteroid', title: 'Asteroids' },
  { kind: 'ship', icon: 'ship', title: 'Ships' },
  { kind: 'yours', icon: 'yours', title: 'Yours' }
]
/** Which stations. */
const WANTS = [
  { want: null, icon: 'station', title: 'Every station' },
  { want: 'buying', icon: 'trade', title: 'Buying what you carry, best first' },
  { want: 'yards', icon: 'yards', title: 'With shipyards' },
  { want: 'armory', icon: 'armory', title: 'With an armory' }
]

export default {
  name: 'ObjectsPanel',
  components: { SmallIcon, PortsPanel },
  props: {
    /** The selection (menu-sheet passes it to every menu). */
    objectId: { type: String, default: null },
    /** A phone. */
    narrow: { type: Boolean, default: false }
  },
  data() {
    return {
      KINDS,
      WANTS,
      /** Rows unfolded by hand (the selection's own planet is always unfolded). */
      unfolded: {}
    }
  },
  computed: {
    ...mapState(useStarMapStore, ['systemObjects', 'spriteIds']),
    ...mapState(useUIStore, ['selected', 'listKind', 'listWant']),
    ...mapState(useGameStateStore, ['avatar', 'goods']),
    cargo() {
      return this.avatar?.ship?.cargo ?? []
    },
    /** The selection's planet (or the belt): unfolded, so the selected row is always in the list. */
    selectedHome() {
      return homeOf(this.selected, this.systemObjects)
    },
    planets() {
      return (this.spriteIds.planets ?? []).map((key) => this.systemObjects[key]).filter(Boolean).sort((a, b) => (a.orbit?.radius ?? 0) - (b.orbit?.radius ?? 0))
    },
    belt() {
      return beltKeys(this.systemObjects).map((key) => this.systemObjects[key])
    },
    ships() {
      return (this.spriteIds.ships ?? []).map((key) => this.systemObjects[key]).filter(Boolean)
    },
    center() {
      const star = this.systemObjects[STAR_KEY]
      if (!star) return null
      const colors = STAR_CLASSES[star.spectral] ?? STAR_CLASSES.G
      return {
        key: star.key,
        name: star.name,
        sub: star.blackHole ? 'The center · a black hole' : `The center · class ${star.spectral ?? 'G'} star`,
        style: star.blackHole ? { ...sphere('#05010d', '#05010d', '#05010d', 24), boxShadow: '0 0 0 2px #af6fff' } : { ...sphere(colors.core, colors.mid, colors.glow, 24), boxShadow: `0 0 10px ${colors.glow}88` }
      }
    },
    /** "14 celestial bodies · 2 ships" */
    countWords() {
      const bodies = Object.values(this.systemObjects).filter((o) => o.type !== 'ship' && o.type !== 'section').length
      const ships = this.ships.length
      return `${bodies} celestial ${bodies === 1 ? 'body' : 'bodies'} · ${ships} ${ships === 1 ? 'ship' : 'ships'}`
    },
    wantWords() {
      return WANTS.find((w) => w.want === this.listWant)?.title ?? ''
    },
    /** The rows for the kind showing (stations are the ports panel's). */
    rows() {
      const objects = this.systemObjects
      const player = usePlayerStore()
      const besieged = (o) => Boolean(o.objectId != null && player.siegeAt?.(o.objectId))
      const owner = (o) => (o.isMine ? 'yours' : o.federation || o.ownerName === FEDERATION ? FEDERATION : o.owner ? o.ownerName || 'claimed' : 'unclaimed')
      const planetRow = (o, depth = 0) => ({ id: o.key, key: o.key, depth, name: o.name, sub: `${planetTypeName(o.class)} · ${owner(o)}`, style: bodySphere(o, 26), mine: o.isMine, besieged: besieged(o) })
      const stationRow = (o, depth = 0) => {
        const buys = portSigns(o, this.cargo).buys
        return { id: o.key, key: o.key, depth, name: o.name, sub: buys ? 'Buys what you carry' : `Station · ${owner(o)}`, gain: buys, art: PORT_ART, mine: o.isMine, code: portCode(o.goods ?? [], (this.goods ?? []).length, this.cargo) }
      }
      const moonRow = (planet, moon, depth = 0) => ({ id: moon.moonId, key: moon.moonId, depth, name: moon.moonName, sub: depth ? 'Moon' : 'Moon of ' + planet.name, style: bodySphere(objects[moon.moonId], 16), mine: planet.isMine })
      const asteroidRow = (o, depth = 0) => ({ id: o.key, key: o.key, depth, name: o.name, sub: `${o.compositionName} · ${owner(o)}`, art: ASTEROID_ART[o.composition] ?? ASTEROID_ART[0], mine: o.isMine, besieged: besieged(o) })
      const sectionRow = (o, depth = 0) => ({ id: o.key, key: o.key, depth, name: o.name, sub: 'Empty space to mine', art: DUST_ART })
      const shipRow = (o) => ({ id: o.key, key: o.key, name: o.name, sub: o.isMine ? 'Your ship' : o.ownerName || 'A pilot', icon: 'ship', mine: o.isMine })
      const stationOf = (o) => (o.hasStation ? objects[o.stationKey] : null)
      const all = [...this.planets, ...this.belt]

      switch (this.listKind) {
        case 'planet':
          return this.planets.map((o) => planetRow(o))
        case 'moon':
          return this.planets.flatMap((planet) => (planet.moons ?? []).map((moon) => moonRow(planet, moon)))
        case 'asteroid':
          return this.belt.filter((o) => o.type === 'asteroid').map((o) => asteroidRow(o))
        case 'ship':
          return this.ships.map(shipRow)
        case 'yours': {
          const mine = all.filter((o) => o.isMine)
          return [...mine.flatMap((o) => [o.type === 'planet' ? planetRow(o) : asteroidRow(o), ...(stationOf(o) ? [stationRow(stationOf(o), 1)] : [])]), ...this.ships.filter((o) => o.isMine).map(shipRow)]
        }
      }

      // everything: the tree
      const rows = []
      const beltAt = this.belt.length ? this.planets.findIndex((o) => (o.orbit?.radius ?? 0) > (this.belt[0].orbit?.radius ?? 0)) : -1
      const pushBelt = () => {
        if (!this.belt.length) return
        const open = this.unfolded[BELT_KEY] ?? this.selectedHome === BELT_KEY
        const asteroids = this.belt.filter((o) => o.type === 'asteroid').length
        rows.push({ id: BELT_KEY, key: null, name: 'The asteroid belt', sub: `${asteroids} ${asteroids === 1 ? 'asteroid' : 'asteroids'} · ${this.belt.length - asteroids} empty`, ring: true, fold: open })
        if (!open) return
        for (const o of this.belt) {
          rows.push(o.type === 'section' ? sectionRow(o, 1) : asteroidRow(o, 1))
          if (stationOf(o)) rows.push(stationRow(stationOf(o), 2))
        }
      }
      this.planets.forEach((planet, index) => {
        if (index === beltAt) pushBelt()
        const station = stationOf(planet)
        const moons = planet.moons ?? []
        const has = Boolean(station) || moons.length > 0
        const open = has && (this.unfolded[planet.key] ?? this.selectedHome === planet.key)
        const marks = []
        if (station) marks.push({ kind: 'station', art: PORT_ART, title: station.name })
        if (moons.length) marks.push({ kind: 'moons', style: bodySphere(objects[moons[0].moonId], 12), count: moons.length, title: moons.length === 1 ? moons[0].moonName : moons.length + ' moons' })
        rows.push({ ...planetRow(planet), fold: has ? open : undefined, marks: open ? [] : marks })
        if (!open) return
        if (station) rows.push(stationRow(station, 1))
        for (const moon of moons) rows.push(moonRow(planet, moon, 1))
      })
      if (beltAt === -1) pushBelt()
      if (this.ships.length) rows.push({ id: 'ships', heading: 'Ships here' }, ...this.ships.map(shipRow))
      return rows
    }
  },
  methods: {
    ...mapActions(useUIStore, ['selectSprite', 'closeMenu', 'setList']),
    setKind(kind) {
      this.o8audio?.playEffect('click')
      this.setList(kind, kind === 'station' ? this.listWant : null)
    },
    setWant(want) {
      this.o8audio?.playEffect('click')
      this.setList('station', want)
    },
    toggleFold(id) {
      this.o8audio?.playEffect('click')
      const open = this.unfolded[id] ?? this.selectedHome === id
      this.unfolded = { ...this.unfolded, [id]: !open }
    },
    /** Selects the row: the card shows it while the list stays open. The belt's own row only folds. */
    press(row) {
      if (!row.key) return this.toggleFold(row.id)
      this.o8audio?.playEffect('click')
      this.selectSprite(row.key)
    },
    /** Closes the list on the selected row: the camera is already on it. */
    go() {
      this.o8audio?.playEffect('click')
      this.closeMenu()
    }
  }
}
</script>

<style scoped>
.objects-panel {
  width: min(620px, calc(100vw - 60px));
  box-sizing: border-box;
  padding: 16px 62px 18px 18px;
  color: #e6dcf5;
  text-align: left;
}
.objects-panel.narrow {
  width: calc(100vw - 34px);
  padding: 14px 12px 16px;
}
/* tabs: square, a way to somewhere (docs/ui-guide.md section 11) */
.tabs {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.tab {
  flex: none;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 1.2px solid #4a3d7a;
  border-radius: 12px;
  background: #1a1331;
  color: #ffffff;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.tab:hover {
  border-color: #b9a0ff;
}
.tab.on {
  border: 2.2px solid #b9a0ff;
  background: #302651;
}
.tab.yours {
  color: var(--o8-yellow-light);
}
.wants .tab {
  width: 38px;
  height: 38px;
  border-radius: 10px;
}
.narrow .tab {
  width: 40px;
  height: 40px;
}
.narrow .tabs {
  gap: 5px;
  flex-wrap: wrap;
}
.count {
  margin-left: 6px;
  color: #bdb5d4;
  font-size: 12.5px;
}
button:focus-visible {
  outline: 2.5px solid var(--o8-brand-300);
  outline-offset: 2px;
}
/* a row: its mark, its name, one line under it, one thing at the right */
.row {
  display: flex;
  align-items: center;
  gap: 4px;
  min-height: 48px;
  box-sizing: border-box;
  border: 1.5px solid transparent;
  border-radius: 12px;
}
.row.on {
  border-color: #b9a0ff;
  background: #302651;
}
.row.child {
  margin-left: 30px;
}
.row.child + .row.child {
  margin-top: 0;
}
.center {
  width: 100%;
  gap: 12px;
  margin-bottom: 8px;
  padding: 6px 10px 6px 14px;
  border-color: #3f3566;
  background: #150f28;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.center:hover,
.body:hover:not(:disabled) b {
  border-color: #b9a0ff;
}
.fold {
  flex: none;
  display: grid;
  place-items: center;
  width: 28px;
  height: 44px;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
}
span.fold {
  cursor: default;
}
.fold svg {
  width: 12px;
  height: 12px;
}
.fold path {
  fill: none;
  stroke: #d9ccf5;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.body {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  min-height: 44px;
  padding: 0 8px 0 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.pic {
  position: relative;
  flex: none;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
}
.pic img {
  width: 32px;
  height: 32px;
}
.sphere {
  display: block;
  border-radius: 50%;
}
.belt-ring {
  width: 20px;
  height: 20px;
  border: 3px dotted #cdbb9c;
  border-radius: 50%;
}
.mine {
  position: absolute;
  right: 1px;
  bottom: 1px;
  width: 8px;
  height: 8px;
  border: 1.5px solid #1b1531;
  border-radius: 50%;
  background: var(--o8-yellow);
}
.siege {
  position: absolute;
  inset: 0;
  border: 1.8px dashed var(--o8-pink-light);
  border-radius: 50%;
}
.text {
  flex: 1;
  min-width: 0;
}
.text b {
  display: block;
  overflow: hidden;
  color: #ffffff;
  font-size: 15px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.text small {
  display: block;
  overflow: hidden;
  color: #9088aa;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.text small.gain {
  color: var(--o8-yellow-light);
}
.letters {
  flex: none;
  font-family: monospace;
  font-size: 14px;
  letter-spacing: 1.5px;
}
.letters b {
  color: #f1eefa;
}
.letters b.wanted {
  color: var(--o8-yellow-light);
}
.letters b.none {
  color: #6f6890;
}
.marks {
  flex: none;
  display: flex;
  align-items: center;
  gap: 10px;
}
.mark {
  display: flex;
  align-items: center;
  gap: 3px;
}
.mark img {
  width: 20px;
  height: 20px;
}
.mark em {
  color: #9088aa;
  font-size: 11px;
  font-style: normal;
}
/* Go: the selected row's, the list's one main action */
.go {
  flex: none;
  display: flex;
  align-items: center;
  gap: 4px;
  height: 36px;
  margin-right: 6px;
  padding: 0 10px 0 16px;
  border: 1.8px solid #b9a0ff;
  border-radius: 18px;
  background: linear-gradient(180deg, #8f6cf0 0%, #7b4fe6 100%);
  color: #ffffff;
  font: inherit;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
}
.go .small-icon {
  width: 16px;
  height: 16px;
}
h3 {
  margin: 12px 4px 4px;
  padding-bottom: 5px;
  border-bottom: 1px solid #ffffff1f;
  color: #c9b6ff;
  font-size: 11px;
  letter-spacing: 1.3px;
  text-transform: uppercase;
}
.none {
  margin: 14px;
  color: #bdb5d4;
  text-align: center;
}
</style>
