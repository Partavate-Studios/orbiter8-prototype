<template>
  <g transform="translate(-70 -70)">
    <text
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
      fill="#ffffff"
      x="70"
      y="10"
      :font-size="fitSize(systemObjects[objectId].name, 8, 122, 700)"
      text-anchor="middle"
      transform="translate(0 5)"
      font-style="bold"
    >
      {{ systemObjects[objectId].name }}
    </text>

    <g fill="#ffffffaa" transform="translate(5 115)" font-size="0.40em">
      <text x="10" y="0" text-anchor="start" fill="#ffffff" font-size="0.9em"> {{ typeName }}</text>
      <text x="120" y="0" text-anchor="end" fill="#ffffff" font-size="0.5em"> #{{ systemObjects[objectId].id }}</text>

      <g v-if="systemObjects[objectId].isMine">
        <text x="65" y="0" text-anchor="middle" font-size="0.8em" :fill="YELLOW"> Mine </text>
      </g>
      <rect x="5" y="4" width="120" height="2" fill="#ffffff" opacity="0.1" />

      <g v-if="systemObjects[objectId].type == 'ship'">
        <text x="65" y="88" text-anchor="middle" :font-size="orbitingFit.size">{{ orbitingFit.text }}</text>

        <g v-if="Boolean(systemObjects[objectId].isMine)">
          <text x="65" y="15" text-anchor="middle" :font-size="captainFit.size"> {{ captainFit.text }}</text>

          <g font-size="0.9em" transform="translate(22 25)" dominant-baseline="hanging">
            <text x="16" y="0" text-anchor="middle" font-weight="bold" font-size="1.1em"> Cargo</text>

            <text x="16" y="10" text-anchor="middle" font-weight="bold"> {{ avatar.ship.holds }} Holds</text>

            <text x="16" y="18" text-anchor="middle"> {{ emptyHolds }} Empty</text>

            <!-- Every good aboard (nine rows at most, with colonists): closer rows past six -->
            <g
              v-for="(line, index) in cargoRows"
              :key="line.name"
              :transform="'translate(0 ' + (2 + index * cargoRowGap) + ')'"
              :font-size="cargoRows.length > 6 ? '0.85em' : '1em'"
            >
              <text x="52" y="0" text-anchor="start"> {{ shortGoodName(line.name, true) }}</text>
              <text x="50" y="0" text-anchor="end"> {{ line.units }}</text>
            </g>
          </g>
        </g>
        <g v-else>
          <text x="25" y="15" text-anchor="end" font-size="0.9em"> Pilot:</text>
          <text x="28" y="15" text-anchor="start" font-weight="bold" :font-size="fitSize(ownerName, 6.4, 96, 700)"> {{ ownerName }}</text>
        </g>
      </g>

      <g v-else-if="systemObjects[objectId].type == 'planet'">
        <text x="25" y="15" text-anchor="end" font-size="0.9em"> Owner:</text>
        <text x="28" y="15" text-anchor="start" font-weight="bold" :font-size="fitSize(ownerName, 6.4, 96, 700)"> {{ ownerName }}</text>
        <text x="35" y="25" text-anchor="end" font-size="0.9em"> Class:</text>
        <text x="38" y="25" text-anchor="start" font-weight="bold">
          {{ planetTypeName(systemObjects[objectId].class) }}</text
        >
        <text x="35" y="35" text-anchor="end" font-size="0.9em"> Size:</text>
        <text x="38" y="35" text-anchor="start" font-weight="bold"> {{ systemObjects[objectId].size }}</text>
        <text x="75" y="35" text-anchor="end" font-size="0.9em"> Rings:</text>
        <text x="35" y="45" text-anchor="end" font-size="0.9em"> Orbital Ring:</text>
        <text x="38" y="45" text-anchor="start" font-weight="bold"> {{ systemObjects[objectId].orbitalPosition }}</text>
        <text x="78" y="35" text-anchor="start" font-weight="bold">
          {{ systemObjects[objectId].rings }}
        </text>
      </g>

      <g v-else-if="systemObjects[objectId].type == 'moon'">
        <text x="25" y="15" text-anchor="end" font-size="0.9em"> Owner: </text>
        <text x="28" y="15" text-anchor="start" font-weight="bold" :font-size="fitSize(ownerName, 6.4, 96, 700)"> {{ ownerName }}</text>
        <text x="35" y="25" text-anchor="end" font-size="0.9em"> Class:</text>
        <text x="38" y="25" text-anchor="start" font-weight="bold"> {{ systemObjects[objectId].class }}</text>
        <text x="35" y="35" text-anchor="end" font-size="0.9em"> Size:</text>
        <text x="38" y="35" text-anchor="start" font-weight="bold"> {{ systemObjects[objectId].size }}</text>
      </g>

      <g v-else-if="systemObjects[objectId].type == 'star'">
        <text x="55" y="15" text-anchor="end" font-size="0.9em"> Discovered by: </text>
        <text x="10" y="25" text-anchor="start" :font-size="fitSize(discoveredBy, 5.76, 114)">
          {{ discoveredBy }}
        </text>
        <text x="55" y="38" text-anchor="end" font-size="0.9em"> Owner:</text>
        <text x="58" y="38" text-anchor="start" font-weight="bold" :font-size="fitSize(systemObjects[objectId].keeperName || 'none yet', 6.4, 66, 700)">
          {{ systemObjects[objectId].keeperName || 'none yet' }}
        </text>
        <text x="55" y="50" text-anchor="end" font-size="0.9em"> Size:</text>
        <text x="58" y="50" text-anchor="start" font-weight="bold">
          {{ systemObjects[objectId].size }}
        </text>
      </g>

      <g v-else-if="systemObjects[objectId].type == 'station'">
        <!-- What the port sells and buys (tighter when there are more than three) -->
        <g
          v-for="(good, index) in stationGoods"
          :key="good.id"
          :font-size="stationGoods.length > 3 ? '0.75em' : '0.9em'"
          :transform="'translate(0 ' + stationRowY(index) + ')'"
        >
          <text x="40" y="0" text-anchor="end">{{ shortGoodName(good.name, true) }}:</text>
          <g v-if="good.mode === 'buys'">
            <text x="90" y="0" text-anchor="end">Buying</text>
            <text x="64" y="0" text-anchor="start">&#8593;</text>
          </g>
          <g v-else>
            <text x="90" y="0" text-anchor="end"> Selling</text>
            <text x="64" y="0" text-anchor="start"> &#8595;</text>
          </g>
          <text x="62" y="0" text-anchor="end" font-weight="bold">{{ good.stock }}</text>
        </g>
      </g>
    </g>
  </g>
</template>

<script>
import { fitSize, fitText } from '@/libs/fit-text'
import { useGameStateStore } from '@/stores/gamestate'
import { mapState } from 'pinia'
import { useStarMapStore } from '@/stores/starmap'

import { planetTypeName } from '@/sdk/game/planet-types'
import { cargoLines, emptyHolds, shortGoodName } from '@/sdk/game/trade'
import { YELLOW } from '@/libs/palette'

export default {
  name: 'SpriteInfo',
  props: {
    /** The selected object's key (see sdk/system.js objectKey). */
    objectId: { type: String, default: null }
  },
  data() {
    return { YELLOW }
  },
  computed: {
    ...mapState(useStarMapStore, ['systemObjects', 'players']),
    ...mapState(useGameStateStore, ['avatar', 'goods']),
    typeName() {
      switch (this.systemObjects[this.objectId].type) {
        case 'star':
          return this.systemObjects[this.objectId].blackHole ? 'Black Hole' : 'Warpstar'
        case 'ship':
          return 'Starship'
        case 'moon':
          return 'Moon'
        case 'planet':
          return 'Planet'
        case 'station':
          return 'Space Station'
      }
      return null
    },
    emptyHolds() {
      return emptyHolds(this.avatar.ship)
    },
    /** The cargo rows: every good aboard, and the colonists. */
    cargoRows() {
      return cargoLines(this.avatar.ship, this.goods)
    },
    /** Rows 8 apart up to six; nine rows (all eight goods and colonists) still end above the Orbiting line. */
    cargoRowGap() {
      return this.cargoRows.length > 6 ? 6.5 : 8
    },
    stationGoods() {
      return (this.systemObjects[this.objectId].goods ?? []).filter((good) => good.mode !== 'none')
    },
    orbitingFit() {
      const around = this.systemObjects[this.systemObjects[this.objectId].orbiting]
      return fitText('Orbiting: ' + (around?.name ?? ''), 5.76, 116)
    },
    captainFit() {
      return fitText('Captain: ' + this.avatar.name, 5.76, 116)
    },
    discoveredBy() {
      const o = this.systemObjects[this.objectId]
      return o.keeper === 'federation' && this.objectId === 'star' && !o.owner ? 'The Federation' : this.ownerName
    },
    ownerName() {
      let address = this.systemObjects[this.objectId].owner

      if (this.systemObjects[this.objectId]?.federation) return 'The Federation'
      if (!address) return 'unclaimed'

      let name = '[' + address.replace(address.substring(5, 40), '...') + ']'

      // A pilot's call sign, with the short address after it while there's room (a long call sign
      // stands alone rather than shrinking the line).
      const callsign = this.players[address]
      if (typeof callsign !== 'undefined') {
        name = callsign.length > 12 ? callsign : callsign + ' ' + name
      }
      return name
    }
  },
  methods: {
    fitSize,
    planetTypeName,
    shortGoodName,
    /** Rows from y 25, 10 apart for three; more goods start higher and sit closer. */
    stationRowY(index) {
      return this.stationGoods.length > 3 ? 13 + index * 8 : 25 + index * 10
    }
  }
}
</script>
