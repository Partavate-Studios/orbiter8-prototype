<template>
  <g v-if="objectId != null">
    <menu-container>
      <g v-if="pending">
        <g>
          <ship-upgrade :cargoHolds="avatar.ship.holds" :predictedLoad="avatar.ship.holds" :existingLoad="0" />
        </g>
        <g transform="translate(0 220)">
          <text v-if="pending" text-anchor="middle" fill="#ffffff" font-size="4em">Transacting... </text>
        </g>
      </g>
      <g v-else>
        <g transform="translate(0 -400)" dominant-baseline="middle" text-anchor="middle">
          <g>
            <text x="0" y="5" fill="#ffffff88" font-size="1.5em">{{ systemObjects[this.objectId].name }}</text>
          </g>

          <g transform="translate(0 200)">
            <ship-upgrade
              :cargoHolds="avatar.ship.holds + holdsToBuy"
              :predictedLoad="avatar.ship.holds"
              :existingLoad="avatar.ship.holds"
            />
          </g>

          <text transform="translate(0 300)" fill="#ffffff88" font-size="0.9em"
            >Credit Balance: {{ this.avatar.credits.toLocaleString('en-US') }}&cent;</text
          >
          <text transform="translate(0 320)" fill="#ffffff88" font-size="0.9em"
            >Current Cargo Holds: {{ this.avatar.ship.holds }}</text
          >

          <g transform="translate(0 400)" fill="#ffffff">
            <text v-if="shipMax > 0" font-size="0.9em">Install cargo holds for {{ holdPrice }}&cent; each.</text>
            <text v-else font-size="0.9em">You are at max capcity.</text>

            <g transform="translate(0 20)">
              <text transform="translate(0 30)" font-size="1.5em">{{ holdsToBuy }}</text>

              <g v-if="holdsToBuy * holdPrice > 0" transform="translate(0 120)" font-size="1em" fill="#ffffff88">
                <g v-if="canAfford" fill="#ffffff">
                  <text>Total Cost: {{ holdsToBuy * holdPrice }}&cent;</text>
                </g>
                <g v-else fill="#ffffff88">
                  <text>Insufficient Funds: {{ holdsToBuy * holdPrice }}&cent;</text>
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
                v-on:click="decrementHolds"
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
                v-on:click="incrementHolds"
              />
            </g>
          </g>

          <g :transform="'translate(0 620)'">
            <menu-button v-on:buttonclick="applyUpgrades" :enabled="canUpgrade" text="Upgrade" />
          </g>
        </g>
      </g>
    </menu-container>
  </g>
</template>

<script>
import { canAfford, maxHoldsToBuy, MAX_CARGO_HOLDS } from '@/game/trade'

import { useGameStateStore } from '@/stores/gamestate'
import { useStarMapStore } from '@/stores/starmap'
import { mapActions, mapState } from 'pinia'
import { useUIStore } from '@/stores/ui'
import MenuContainer from './menu-container/_menu-container.svg'
import MenuButton from './menu-button.svg'
import Arrow from './widgets/arrow.svg'
import ShipUpgrade from './_trade-menu/ship-upgrade.svg'

export default {
  name: 'TradeMenu',
  data() {
    return {
      holdsToBuy: 0,
      pending: false
    }
  },
  props: {
    objectId: null
  },
  components: {
    MenuContainer,
    MenuButton,
    Arrow,
    ShipUpgrade
  },
  methods: {
    ...mapActions(useGameStateStore, ['addHoldsToShip']),
    ...mapActions(useUIStore, ['closeMenu']),
    applyUpgrades() {
      this.o8audio.playEffect('click')
      if (this.holdsToBuy > 0) {
        this.addHoldsToShip({ planetId: this.systemObjects[this.objectId].id, amount: this.holdsToBuy })
        this.pending = true
      }
    },
    decrementHolds() {
      this.holdsToBuy = Math.max(0, this.holdsToBuy - 1)
    },
    incrementHolds() {
      this.holdsToBuy = Math.min(this.maxHoldsAvailable, this.holdsToBuy + 1)
    }
  },
  computed: {
    ...mapState(useStarMapStore, ['systemObjects']),
    ...mapState(useGameStateStore, ['avatar']),
    maxHoldsAvailable() {
      return maxHoldsToBuy(this.avatar.credits, this.avatar.ship.holds, this.holdPrice)
    },
    /** Holds this ship can still add before reaching the contract's maximum. */
    shipMax() {
      return MAX_CARGO_HOLDS - this.avatar.ship.holds
    },
    holdPrice() {
      return this.systemObjects[this.objectId].prices.holds
    },
    canAfford() {
      return canAfford(this.avatar.credits, this.holdPrice * this.holdsToBuy)
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
  }
}
</script>
