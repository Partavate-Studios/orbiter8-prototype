<template>
  <!-- The inspector: the selected object's details and actions, docked at the left on wide screens
       (phones keep the card that pops up from the bottom, hud/card-ui). Naming things happens in a
       small form here rather than in the browser's prompt boxes. -->
  <aside v-if="object" class="inspector" data-own-scroll :aria-label="object.name">
    <header>
      <div class="kind">
        {{ typeName }} <span class="number">#{{ object.id }}</span>
      </div>
      <h2>{{ object.name }}</h2>
      <button
        type="button"
        class="close"
        aria-label="Hide"
        title="Hide (click the selection to show it again)"
        @click="toggleScope"
      >
        ×
      </button>
    </header>

    <dl class="facts">
      <template v-for="fact in facts" :key="fact.label">
        <dt>{{ fact.label }}</dt>
        <dd>{{ fact.value }}</dd>
      </template>
    </dl>

    <div v-if="nearby.length" class="nearby">
      <span class="label">Nearby</span>
      <button
        v-for="place in nearby"
        :key="place.key"
        type="button"
        class="chip"
        :class="place.type"
        @mouseenter="highlight(place.key)"
        @mouseleave="highlight(null)"
        @click="go(place.key)"
      >
        {{ place.name }}
      </button>
    </div>

    <form v-if="asking" class="ask" @submit.prevent="submitAnswer">
      <label :for="'inspector-answer'">{{ asking.label }}</label>
      <input
        id="inspector-answer"
        ref="answer"
        v-model="answer"
        type="text"
        maxlength="40"
        autocomplete="off"
        @keydown.esc.prevent="asking = null"
      />
      <p v-if="asking.note" class="note">{{ asking.note }}</p>
      <div class="buttons">
        <button type="submit" class="action primary" :disabled="!answer.trim() || asking.blocked">
          {{ asking.confirm }}
        </button>
        <button type="button" class="action" @click="asking = null">Cancel</button>
      </div>
    </form>

    <div v-else-if="actions.length" class="actions">
      <button v-for="action in actions" :key="action.text" type="button" class="action" @click="run(action)">
        {{ action.text }}
      </button>
    </div>

    <p v-if="comingLater.length" class="later">Coming in a later demo: {{ comingLater.join(', ') }}.</p>
  </aside>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import { useUIStore } from '@/stores/ui'
import { useStarMapStore } from '@/stores/starmap'
import { useGameStateStore } from '@/stores/gamestate'
import { useChainStore } from '@/stores/chain'
import { cardMenu } from '@/components/star-map/hud/card-ui/menus/card-menu'
import { planetTypeName } from '@/sdk/game/planet-types'
import { marketTokenUrl, networkFor } from '@/sdk/chain/networks'

const TYPE_NAMES = { star: 'Warpstar', ship: 'Starship', moon: 'Moon', planet: 'Planet', station: 'Space Station' }
// Card actions that only move the camera: here they're the "Nearby" chips instead.
const VISITS = ['visitPlanet', 'visitStation', 'visitMoon']
const STATION_COST = 10000

export default {
  name: 'Inspector',
  data() {
    return {
      // The question being asked in the form ({ label, confirm, note?, blocked?, send(name) }), or null.
      asking: null,
      answer: ''
    }
  },
  computed: {
    ...mapState(useUIStore, ['selected', 'showScope', 'viewRatio', 'isMenuOn', 'neighborView', 'jumpAnimationState']),
    ...mapState(useStarMapStore, ['systemObjects', 'mapDataLoaded']),
    ...mapState(useGameStateStore, ['avatar']),
    ...mapState(useChainStore, ['chainId', 'shipTokenAddress', 'planetTokenAddress']),
    /** The selected object, while the inspector is showing (wide screens, nothing in the way). */
    object() {
      const docked = this.viewRatio > 1
      const clear = !this.isMenuOn && !this.neighborView && !this.jumpAnimationState && this.mapDataLoaded
      if (!docked || !clear || !this.showScope || this.selected == null) return null
      return this.systemObjects[this.selected] ?? null
    },
    typeName() {
      return TYPE_NAMES[this.object.type]
    },
    facts() {
      const object = this.object
      const owner = { label: object.type === 'star' ? 'Discovered by' : 'Owner', value: this.ownerName(object) }
      const at = this.systemObjects[object.orbiting]
      switch (object.type) {
        case 'ship': {
          const where = { label: 'Orbiting', value: at?.name ?? 'the star' }
          if (!object.isMine) return [{ label: 'Captain', value: this.ownerName(object) }, where]
          const ship = this.avatar.ship
          const empty = ship.holds - (ship.equipment + ship.fuel + ship.organics)
          return [
            { label: 'Captain', value: this.avatar.name },
            where,
            { label: 'Cargo holds', value: ship.holds + ' (' + empty + ' empty)' },
            { label: 'Equipment', value: ship.equipment },
            { label: 'Fuel', value: ship.fuel },
            { label: 'Organics', value: ship.organics }
          ]
        }
        case 'planet':
          return [
            owner,
            { label: 'Class', value: planetTypeName(object.class) },
            { label: 'Size', value: object.size },
            { label: 'Rings', value: object.rings },
            { label: 'Orbital ring', value: object.orbitalPosition }
          ]
        case 'moon':
          return [owner, { label: 'Class', value: object.class }, { label: 'Size', value: object.size }]
        case 'star':
          return [owner, { label: 'Size', value: object.size }]
        case 'station': {
          // Inventory below zero: the port is buying; above, selling.
          const market = ['equipment', 'fuel', 'organics']
            .filter((good) => Number(object.inventory[good]) !== 0)
            .map((good) => {
              const amount = Number(object.inventory[good])
              return {
                label: good.charAt(0).toUpperCase() + good.slice(1),
                value: (amount < 0 ? 'Buying ' : 'Selling ') + Math.abs(amount)
              }
            })
          return [owner, ...market]
        }
      }
      return [owner]
    },
    /** What's around the selection: the planet it orbits, a planet's station and moons. */
    nearby() {
      const object = this.object
      const places = []
      const at = this.systemObjects[object.orbiting]
      if (at?.type === 'planet') places.push({ key: at.key, type: 'planet', name: at.name })
      if (object.type === 'planet') {
        if (object.hasStation) {
          const station = this.systemObjects[object.stationKey]
          if (station) places.push({ key: station.key, type: 'station', name: station.name })
        }
        for (const moon of object.moons) places.push({ key: moon.moonId, type: 'moon', name: moon.moonName })
      }
      return places
    },
    menu() {
      return cardMenu(this.object, { marketName: networkFor(this.chainId)?.nftMarket?.name })
    },
    actions() {
      return this.menu.filter((item) => item.enabled && !VISITS.includes(item.command))
    },
    /** Placeholders for features later demos add (attacking, building on moons). */
    comingLater() {
      return this.menu.filter((item) => !item.enabled).map((item) => item.text)
    }
  },
  watch: {
    // A new selection drops a half-asked question.
    selected() {
      this.asking = null
    }
  },
  methods: {
    ...mapActions(useUIStore, ['toggleScope', 'selectSprite', 'highlight', 'openMenu', 'zoomOutToNeighbors']),
    ...mapActions(useGameStateStore, ['claimPlanet', 'buildStation', 'renameAsset']),
    ownerName(object) {
      if (object.isMine) return 'You'
      const address = String(object.owner)
      if (parseInt(address) === 0) return 'Unclaimed'
      return (object.ownerName || 'Unknown') + ' (' + address.slice(0, 6) + '…' + address.slice(-4) + ')'
    },
    go(key) {
      this.highlight(null)
      this.selectSprite(key)
    },
    ask(question) {
      this.answer = ''
      this.asking = question
      this.$nextTick(() => this.$refs.answer?.focus())
    },
    submitAnswer() {
      const name = this.answer.trim()
      if (!name || this.asking.blocked) return
      this.asking.send(name)
      this.asking = null
    },
    run(action) {
      this.o8audio.playEffect('click')
      const object = this.object
      switch (action.command) {
        case 'trade':
          return this.openMenu('trade')
        case 'shipyards':
          return this.openMenu('shipyard')
        case 'jump':
          return this.zoomOutToNeighbors()
        case 'market': {
          const contract = object.type === 'ship' ? this.shipTokenAddress : this.planetTokenAddress
          const url = marketTokenUrl(this.chainId, contract, object.id)
          if (url) window.open(url, '_blank', 'noopener')
          return
        }
        case 'claim':
          return this.ask({
            label: 'Name your new planet',
            confirm: 'Claim ' + object.name,
            send: (name) => this.claimPlanet({ planetId: action.value, name })
          })
        case 'buildStation': {
          const credits = Number(this.avatar.credits)
          const short = credits <= STATION_COST
          return this.ask({
            label: 'Name your space station',
            confirm: 'Build it',
            blocked: short,
            note: short
              ? 'A station costs ' +
                STATION_COST.toLocaleString('en-US') +
                ' credits. You have ' +
                credits.toLocaleString('en-US') +
                ': trade at more ports first.'
              : 'It costs ' +
                STATION_COST.toLocaleString('en-US') +
                ' credits, leaving you ' +
                (credits - STATION_COST).toLocaleString('en-US') +
                '.',
            send: (name) => this.buildStation({ planetId: action.value, name })
          })
        }
        case 'rename':
          return this.ask({
            label: 'New name for ' + object.name,
            confirm: 'Rename',
            send: (name) =>
              this.renameAsset({
                name,
                type: object.type,
                objectId: object.objectId,
                parentId: object.type === 'moon' || object.type === 'station' ? object.planet : undefined
              })
          })
      }
    }
  }
}
</script>

<style scoped>
.inspector {
  position: fixed;
  top: 124px;
  left: 96px;
  width: 300px;
  max-height: calc(100vh - 140px);
  overflow-y: auto;
  overscroll-behavior: contain;
  z-index: 1050;
  padding: 14px 16px 16px;
  border: 1px solid #c3b3da44;
  border-radius: 14px;
  background: #12052ae6;
  color: #e6dcf5;
  font-family: Ubuntu, sans-serif;
  font-size: 14px;
  text-align: left;
}
header {
  position: relative;
  padding-right: 28px;
}
.kind {
  color: #c3b3da;
  font-size: 12px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.number {
  color: #c3b3da88;
}
h2 {
  margin: 2px 0 10px;
  color: #ffffff;
  font-size: 20px;
  font-weight: 500;
  overflow-wrap: anywhere;
}
.close {
  position: absolute;
  top: -4px;
  right: -6px;
  border: 0;
  background: none;
  color: #c3b3da;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
}
.close:hover {
  color: #ffffff;
}
.facts {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 4px 14px;
  margin: 0 0 12px;
}
dt {
  color: #c3b3da;
}
dd {
  margin: 0;
  color: #ffffff;
  overflow-wrap: anywhere;
}
.nearby {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  margin-bottom: 12px;
}
.label {
  margin-right: 4px;
  color: #c3b3da;
  font-size: 12px;
}
.chip {
  padding: 2px 9px;
  border: 1px solid #c3b3da33;
  border-radius: 999px;
  background: #2a0f4f;
  color: #c3b3da;
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}
.chip.station,
.chip.planet {
  border-color: #c3b3da77;
  color: #e6dcf5;
}
.chip:hover,
.chip:focus-visible {
  background: #5a2f96;
  color: #ffffff;
  outline: none;
}
.actions,
.buttons {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.action {
  padding: 8px 12px;
  border: 1px solid #c3b3da55;
  border-radius: 999px;
  background: #3a1a66cc;
  color: #ffffff;
  font: inherit;
  cursor: pointer;
  transition: background 0.15s;
}
.action:hover:not(:disabled),
.action:focus-visible {
  background: #5a2f96;
  outline: none;
}
.action.primary {
  border-color: #e6dcf5aa;
}
.action:disabled {
  opacity: 0.45;
  cursor: default;
}
.ask label {
  display: block;
  margin-bottom: 6px;
  color: #c3b3da;
}
.ask input {
  box-sizing: border-box;
  width: 100%;
  margin-bottom: 8px;
  padding: 8px 10px;
  border: 1px solid #c3b3da66;
  border-radius: 8px;
  background: #0b0220;
  color: #ffffff;
  font: inherit;
}
.ask input:focus {
  border-color: #e6dcf5;
  outline: none;
}
.note {
  margin: 0 0 10px;
  color: #c3b3da;
  font-size: 12px;
}
.later {
  margin: 12px 0 0;
  color: #c3b3da88;
  font-size: 12px;
}
</style>
