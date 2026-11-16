<template>
  <g v-if="objectId != null">
    <menu-container>
      <g v-if="pending">
        <g>
          <ship-upgrade :cargo-holds="avatar.ship.holds" :predicted-load="avatar.ship.holds" :existing-load="0" />
        </g>
        <g transform="translate(0 220)">
          <text v-if="pending" text-anchor="middle" fill="#ffffff" font-size="4em">Transacting... </text>
        </g>
      </g>
      <g v-else>
        <g transform="translate(0 -400)" dominant-baseline="middle" text-anchor="middle">
          <g>
            <text x="0" y="5" fill="#ffffff88" :font-size="fitSize(systemObjects[objectId].name, 24, 340)">{{ systemObjects[objectId].name }}</text>
          </g>

          <g transform="translate(0 200)">
            <ship-upgrade
              :cargo-holds="avatar.ship.holds + cargoToBuy"
              :predicted-load="avatar.ship.holds"
              :existing-load="avatar.ship.holds"
              :segments="holdSegments"
            />
          </g>

          <text transform="translate(0 300)" fill="#ffffff88" font-size="0.9em"
            >Credit Balance: {{ avatar.credits.toLocaleString('en-US') }}&cent;</text
          >
          <text transform="translate(0 320)" fill="#ffffff88" font-size="0.9em"
            >Cargo Holds: {{ avatar.ship.holds }} · Drone Bays: {{ droneBays }}</text
          >

          <!-- What to install: cargo holds, or drone bays (every drone lives in one, D91) -->
          <g transform="translate(0 355)" font-size="0.85em">
            <g v-for="(kind, i) in KINDS" :key="kind.key" :transform="`translate(${i === 0 ? -65 : 65} 0)`">
              <rect
                x="-60"
                y="-13"
                width="120"
                height="26"
                rx="3"
                ry="3"
                :stroke="kind.key === bayKind ? '#ffffffcc' : '#ffffff44'"
                stroke-width="0.5"
                :fill="kind.key === bayKind ? '#ffffff44' : '#ffffff22'"
                class="can-click"
                @click="chooseKind(kind.key)"
              />
              <text :fill="kind.key === bayKind ? '#ffffff' : '#ffffff88'" pointer-events="none">{{ kind.label }}</text>
            </g>
          </g>

          <g transform="translate(0 400)" fill="#ffffff">
            <text v-if="shipMax > 0" font-size="0.9em"
              >Install {{ bayKind === 'drone' ? 'drone bays' : 'cargo holds' }} from {{ costOf(1).toLocaleString('en-US') }}&cent; each (each one dearer).</text
            >
            <text v-else font-size="0.9em">You are at max capacity.</text>

            <g transform="translate(0 20)">
              <text transform="translate(0 30)" font-size="1.5em">{{ holdsToBuy }}</text>

              <g v-if="totalCost > 0" transform="translate(0 120)" font-size="1em" fill="#ffffff88">
                <g v-if="canAfford" fill="#ffffff">
                  <text>Total Cost: {{ totalCost.toLocaleString('en-US') }}&cent;</text>
                </g>
                <g v-else fill="#ffffff88">
                  <text>Insufficient Funds: {{ totalCost.toLocaleString('en-US') }}&cent;</text>
                </g>
              </g>

              <g transform="translate(-50 30)">
                <arrow transform="rotate(180)" />
              </g>
              <g transform="translate(50 30)">
                <arrow />
              </g>

              <rect
                ref="leftButton"
                x="-65"
                y="15"
                ry="3"
                rx="3"
                width="30"
                height="30"
                stroke="#ffffff44"
                stroke-width="0.5"
                fill="#ffffff22"
                class="can-click"
                @click="decrementHolds"
              />

              <rect
                ref="rightButton"
                x="35"
                y="15"
                ry="3"
                rx="3"
                width="30"
                height="30"
                stroke="#ffffff44"
                stroke-width="0.5"
                fill="#ffffff22"
                class="can-click"
                @click="incrementHolds"
              />
            </g>
          </g>

          <g :transform="'translate(0 620)'">
            <menu-button :enabled="canUpgrade" text="Upgrade" @buttonclick="applyUpgrades" />
          </g>

          <!-- Engines, for the range of a jump -->
          <g transform="translate(0 700)" fill="#ffffff">
            <!-- longer jumps: the engines' picture (round 2, item 7) -->
            <image :href="engineArt" x="-205" y="-26" width="52" height="52" />
            <text v-if="rangePrice != null" font-size="0.9em"
              >Engines: jump range {{ player.ship.range }} → {{ player.ship.range + 1 }} for
              {{ rangePrice.toLocaleString('en-US') }}&cent;</text
            >
            <text v-else font-size="0.9em" fill="#ffffff88">Engines at full range ({{ player.ship.range }}).</text>
            <g v-if="rangePrice != null" transform="translate(0 50)">
              <menu-button
                :enabled="avatar.credits >= rangePrice"
                text="Upgrade Engines"
                @buttonclick="upgradeRange"
              />
            </g>
          </g>
        </g>
      </g>
    </menu-container>
  </g>
</template>

<script>
import { fitSize } from '@/libs/fit-text'
import { canAfford, MAX_CARGO_HOLDS } from '@orbiter8/sdk/game/trade'
import { goodColor, TEXT_2, TEXT_3, YELLOW_LIGHT } from '@/libs/palette'
import { shipHolds } from '@/libs/goods'

import { useGameStateStore } from '@/stores/gamestate'
import { useStarMapStore } from '@/stores/starmap'
import { mapActions, mapState } from 'pinia'
import { useUIStore } from '@/stores/ui'
import { usePlayerStore } from '@/stores/player'
import MenuContainer from './menu-container/_menu-container.svg'
import MenuButton from './menu-button.svg'
import Arrow from './widgets/arrow.svg'
import ShipUpgrade from './_trade-menu/ship-upgrade.svg'
import engineArt from '@/assets/art/engine-range.svg'

export default {
  name: 'ShipyardMenu',
  components: {
    MenuContainer,
    MenuButton,
    Arrow,
    ShipUpgrade
  },
  props: {
    /** The selected object's key (see sdk/system.js objectKey). */
    objectId: { type: String, default: null }
  },
  data() {
    return {
      holdsToBuy: 0,
      bayKind: 'cargo',
      KINDS: [
        { key: 'cargo', label: 'Cargo Holds' },
        { key: 'drone', label: 'Drone Bays' }
      ],
      pending: false,
      player: usePlayerStore(),
      engineArt
    }
  },
  computed: {
    ...mapState(useStarMapStore, ['systemObjects']),
    ...mapState(useGameStateStore, ['avatar']),
    /** The ship's holds as they'd be: its cargo, its empty holds, then the holds being bought (yours, yellow). */
    holdSegments() {
      const ship = this.avatar.ship
      return [
        ...shipHolds(ship, goodColor, { text2: TEXT_2, text3: TEXT_3 }),
        { count: Math.max(0, ship.holds - ship.usedHolds), kind: 'empty' },
        { count: this.cargoToBuy, color: YELLOW_LIGHT, kind: 'added' }
      ]
    },
    /** Cargo holds being bought (drawn in the ship's picture); none while buying drone bays. */
    cargoToBuy() {
      return this.bayKind === 'cargo' ? this.holdsToBuy : 0
    },
    droneBays() {
      return this.player.ship?.droneBays ?? 0
    },
    totalCost() {
      return this.costOf(this.holdsToBuy)
    },
    maxHoldsAvailable() {
      let n = this.shipMax
      while (n > 0 && this.costOf(n) > this.avatar.credits) n--
      return n
    },
    rangePrice() {
      return this.player.rangeQuote()
    },
    /** Bays this ship can still add before reaching the contract's maximum (cargo and drone together). */
    shipMax() {
      return MAX_CARGO_HOLDS - this.avatar.ship.holds - this.droneBays
    },
    canAfford() {
      return canAfford(this.avatar.credits, this.totalCost)
    },
    canUpgrade() {
      if (this.canAfford && this.holdsToBuy > 0) {
        return true
      }
      return false
    }
  },
  watch: {
    avatar: {
      handler: function (val, oldVal) {
        if (val.ship.holds != oldVal.ship.holds) {
          this.closeMenu()
        }
      },
      deep: true
    },
    droneBays(now, before) {
      if (now != before) this.closeMenu()
    }
  },
  methods: {
    fitSize,
    ...mapActions(useGameStateStore, ['addHoldsToShip']),
    ...mapActions(useUIStore, ['closeMenu']),
    async applyUpgrades() {
      this.o8audio.playEffect('click')
      if (this.holdsToBuy > 0) {
        this.pending = true
        const planetId = this.systemObjects[this.objectId].id
        const bought =
          this.bayKind === 'drone'
            ? await this.player.buyDroneBays(planetId, this.holdsToBuy)
            : await this.addHoldsToShip({ planetId, amount: this.holdsToBuy })
        if (bought) this.holdsToBuy = 0
        this.pending = false
      }
    },
    costOf(count) {
      if (count <= 0) return 0
      // Each hold costs more the more a ship has (Market.sol baysCost).
      return this.player.baysQuote(count)
    },
    async upgradeRange() {
      this.o8audio.playEffect('click')
      this.pending = true
      const upgraded = await this.player.buyRange(this.systemObjects[this.objectId].id)
      if (upgraded) this.o8audio.speak('upgraded')
      this.pending = false
    },
    chooseKind(kind) {
      this.o8audio.playEffect('click')
      this.bayKind = kind
      this.holdsToBuy = Math.min(this.holdsToBuy, this.maxHoldsAvailable)
    },
    decrementHolds() {
      this.holdsToBuy = Math.max(0, this.holdsToBuy - 1)
    },
    incrementHolds() {
      this.holdsToBuy = Math.min(this.maxHoldsAvailable, this.holdsToBuy + 1)
    }
  }
}
</script>
