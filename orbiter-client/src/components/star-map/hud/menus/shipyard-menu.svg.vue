<template>
  <g v-if="objectId != null">
    <menu-container>
      <g v-if="pending">
            <g transform="translate(0 0)">
              <ship-upgrade :cargoHolds="avatar.ship.holds" :predictedLoad="avatar.ship.holds" :existingLoad="0" />
            </g>
          <g  transform="translate(0 220)">
              <text v-if="pending"  text-anchor="middle" fill="#ffffff" font-size="4em">Transacting... </text>
          </g>
      </g>
      <g v-else>
        <g transform="translate(0 -400)" dominant-baseline="middle" text-anchor="middle" >

          <g transform="">
            <text x="0" y="5" fill="#ffffff88"
                font-size="1.5em">{{ systemObjects[this.objectId].name }}</text>
          </g>

          <g transform="translate(0 200)">
            <ship-upgrade :cargoHolds="avatar.ship.holds + holdsToBuy" :predictedLoad="avatar.ship.holds" :existingLoad="avatar.ship.holds" />
          </g>


          <text transform="translate(0 300)" fill="#ffffff88" font-size="0.9em">Credit Balance:  {{ this.avatar.credits.toLocaleString("en-US") }}&cent;</text>
          <text transform="translate(0 320)" fill="#ffffff88" font-size="0.9em">Current Cargo Holds:  {{ this.avatar.ship.holds }}</text>

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
                  <text>Insufficient Funds:  {{ holdsToBuy * holdPrice }}&cent;</text>
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
                ry=3
                rx=3
                width="30"
                height="30"
                stroke="#ffffff44"
                stroke-width="0.5"
                fill="#ffffff22"
                class="can-click"
                v-on:click="decrementHolds" />

              <rect
                ref="rightButton"
                x="35"
                y="15"
                ry=3
                rx=3
                width="30"
                height="30"
                stroke="#ffffff44"
                stroke-width="0.5"
                fill="#ffffff22"
                class="can-click"
                v-on:click="incrementHolds" />
            </g>

          </g>

          <g :transform="'translate(0 620)'">
              <menu-button
                  v-on:buttonclick="applyUpgrades"
                  :enabled="canUpgrade"
                  text="Upgrade" />
          </g>
        </g>
      </g>
    </menu-container>
  </g>
</template>

<script>

import {  mapGetters, mapMutations, mapActions } from 'vuex'
import MenuContainer from './menu-container/_menu-container.svg'
import MenuButton from './menu-button.svg'
import Arrow from './widgets/arrow.svg'
import ShipUpgrade from './_trade-menu/ship-upgrade.svg'

export default {
  name: 'TradeMenu',
  data () {
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
    ...mapActions('GameState', [
      'addHoldsToShip',
    ]),
    ...mapMutations('UI', [
      'closeMenu'
    ]),
    applyUpgrades() {
      this.o8audio.playEffect('click')
      if (this.holdsToBuy > 0) {
        this.addHoldsToShip({planetId: this.systemObjects[this.objectId].id, amount: this.holdsToBuy})
        this.pending = true
      }
    },
    decrementHolds () {
      this.holdsToBuy = Math.max(0, this.holdsToBuy - 1)
    },
    incrementHolds () {
      this.holdsToBuy = Math.min(this.maxHoldsAvailable, this.holdsToBuy + 1)
    },
  },
  computed: {
    ...mapGetters('StarMap', [
      'systemObjects'
    ]),
    ...mapGetters('GameState', [
      'avatar'
    ]),
    fullHolds () {
      return this.avatar.ship.equipment + this.avatar.ship.fuel + this.avatar.ship.organics
    },
    emptyHolds () {
      return (this.avatar.ship.holds - this.fullHolds)
    },
    maxHoldsAvailable () {
      return Math.min(this.shipMax, parseInt(this.avatar.credits / this.holdPrice))
    },
    shipMax () {
      //250 is a magic number, it's hard coded into contract, should be read from contract
      return 250 - this.avatar.ship.holds
    },
    holdPrice () {
      return this.systemObjects[this.objectId].prices.holds
    },
    canAfford () {
      return this.avatar.credits > (this.holdPrice * this.holdsToBuy)
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
