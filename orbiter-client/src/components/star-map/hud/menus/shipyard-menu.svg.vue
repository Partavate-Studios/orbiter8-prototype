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
            <text x="0" y="5" fill="#ffffff88" font-size="1.5em">{{ systemObjects[objectId].name }}</text>
          </g>

          <g transform="translate(0 200)">
            <ship-upgrade
              :cargo-holds="avatar.ship.holds + holdsToBuy"
              :predicted-load="avatar.ship.holds"
              :existing-load="avatar.ship.holds"
            />
          </g>

          <text transform="translate(0 300)" fill="#ffffff88" font-size="0.9em"
            >Credit Balance: {{ avatar.credits.toLocaleString('en-US') }}&cent;</text
          >
          <text transform="translate(0 320)" fill="#ffffff88" font-size="0.9em"
            >Current Cargo Holds: {{ avatar.ship.holds }}</text
          >

          <g transform="translate(0 400)" fill="#ffffff">
            <text v-if="shipMax > 0 && risingPrices" font-size="0.9em"
              >Install cargo holds from {{ costOf(1) }}&cent; each (each one dearer).</text
            >
            <text v-else-if="shipMax > 0" font-size="0.9em">Install cargo holds for {{ holdPrice }}&cent; each.</text>
            <text v-else font-size="0.9em">You are at max capcity.</text>

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

          <!-- Demo 4: engines, for the range of a jump -->
          <g v-if="demo4.active" transform="translate(0 700)" fill="#ffffff">
            <text v-if="rangePrice != null" font-size="0.9em"
              >Engines: jump range {{ demo4.ship.range }} → {{ demo4.ship.range + 1 }} for
              {{ rangePrice.toLocaleString('en-US') }}&cent;</text
            >
            <text v-else font-size="0.9em" fill="#ffffff88">Engines at full range ({{ demo4.ship.range }}).</text>
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
import { canAfford, maxHoldsToBuy, MAX_CARGO_HOLDS } from '@/sdk/game/trade'

import { useGameStateStore } from '@/stores/gamestate'
import { useStarMapStore } from '@/stores/starmap'
import { mapActions, mapState } from 'pinia'
import { useUIStore } from '@/stores/ui'
import { useDemo4Store } from '@/stores/demo4'
import MenuContainer from './menu-container/_menu-container.svg'
import MenuButton from './menu-button.svg'
import Arrow from './widgets/arrow.svg'
import ShipUpgrade from './_trade-menu/ship-upgrade.svg'

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
      pending: false,
      demo4: useDemo4Store()
    }
  },
  computed: {
    ...mapState(useStarMapStore, ['systemObjects']),
    ...mapState(useGameStateStore, ['avatar']),
    /** Demo 4's holds cost more the more a ship has (Market.sol baysCost); Demo 3's are flat. */
    risingPrices() {
      return this.demo4.active
    },
    totalCost() {
      return this.costOf(this.holdsToBuy)
    },
    maxHoldsAvailable() {
      if (!this.risingPrices) return maxHoldsToBuy(this.avatar.credits, this.avatar.ship.holds, this.holdPrice)
      let n = this.shipMax
      while (n > 0 && this.costOf(n) > this.avatar.credits) n--
      return n
    },
    rangePrice() {
      return this.demo4.active ? this.demo4.rangeQuote() : null
    },
    /** Holds this ship can still add before reaching the contract's maximum. */
    shipMax() {
      return MAX_CARGO_HOLDS - this.avatar.ship.holds
    },
    holdPrice() {
      return this.systemObjects[this.objectId].holdPrice
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
    }
  },
  methods: {
    ...mapActions(useGameStateStore, ['addHoldsToShip']),
    ...mapActions(useUIStore, ['closeMenu']),
    async applyUpgrades() {
      this.o8audio.playEffect('click')
      if (this.holdsToBuy > 0) {
        this.pending = true
        const bought = await this.addHoldsToShip({
          planetId: this.systemObjects[this.objectId].id,
          amount: this.holdsToBuy
        })
        if (bought) this.holdsToBuy = 0
        this.pending = false
      }
    },
    costOf(count) {
      if (count <= 0) return 0
      return this.risingPrices ? this.demo4.baysQuote(count) : count * this.holdPrice
    },
    async upgradeRange() {
      this.o8audio.playEffect('click')
      this.pending = true
      const upgraded = await this.demo4.buyRange(this.systemObjects[this.objectId].id)
      if (upgraded) this.o8audio.speak('upgraded')
      this.pending = false
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
