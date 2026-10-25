<template>
  <g v-if="objectId != null">
    <menu-container>
      <g v-if="pending">
        <g>
          <ship-cargo :cargoHolds="0" :predictedLoad="0" :existingLoad="0" />
        </g>
        <g transform="translate(0 220)">
          <text v-if="pending" text-anchor="middle" fill="#ffffff" font-size="4em">Transacting... </text>
        </g>
      </g>
      <g v-else>
        <g :transform="'translate(0 -400) scale(' + slotScale + ')'">
          <text x="0" y="5" text-anchor="middle" fill="#ffffff88" font-size="1.5em">{{
            systemObjects[this.objectId].name
          }}</text>

          <g transform="translate(0 35)">
            <g transform="translate(0 95)">
              <ship-cargo :cargoHolds="avatar.ship.holds" :predictedLoad="predictedHolds" :existingLoad="fullHolds" />
            </g>
            <g dominant-baseline="middle" font-size="0.7em">
              <g v-if="equipmentToTrade != 0" transform="translate(-45 30)">
                <transfer-tab :quantity="equipmentToTrade" :price="portPrices.equipment" />
              </g>
              <g v-if="fuelToTrade != 0" transform="translate(-45 60)">
                <transfer-tab :quantity="fuelToTrade" :price="portPrices.fuel" />
              </g>
              <g v-if="organicsToTrade != 0" transform="translate(-45 90)">
                <transfer-tab :quantity="organicsToTrade" :price="portPrices.organics" />
              </g>

              <rect
                x="-175"
                y="0"
                width="130"
                height="120"
                rx="3"
                ry="3"
                fill="#2e0d56"
                stroke="#ffffff44"
                stroke-width="1.5"
              />

              <text x="-110" y="15" text-anchor="middle" fill="#ffffff88" font-size="1em">Port of Trade</text>

              <line x1="-170" x2="-50" y1="23" y2="23" stroke="#ffffff88" stroke-width="0.5" />

              <inventory-item
                transform="translate(-110 35)"
                goodstype="Equipment"
                :inventory="portInventory.equipment"
                :price="portPrices.equipment"
              />

              <inventory-item
                transform="translate(-110 65)"
                goodstype="Fuel"
                :inventory="portInventory.fuel"
                :price="portPrices.fuel"
              />

              <inventory-item
                transform="translate(-110 95)"
                goodstype="Organics"
                :inventory="portInventory.organics"
                :price="portPrices.organics"
              />
            </g>

            <g transform="translate(135 30)">
              <cargo-tab
                :before="avatar.ship.equipment"
                :after="avatar.ship.equipment + equipmentToTrade"
                label="Equipment"
              />
            </g>
            <g transform="translate(135 55)">
              <cargo-tab :before="avatar.ship.fuel" :after="avatar.ship.fuel + fuelToTrade" label="Fuel" />
            </g>
            <g transform="translate(135 80)">
              <cargo-tab
                :before="avatar.ship.organics"
                :after="avatar.ship.organics + organicsToTrade"
                label="Organics"
              />
            </g>
            <g transform="translate(135 105)">
              <cargo-tab :quantity="predictedEmptyHolds" label="Empty" />
            </g>

            <g transform="translate(105 10)" dominant-baseline="middle">
              <rect
                x="-70"
                y="-10"
                width="140"
                height="20"
                rx="3"
                ry="3"
                fill="#3E1475"
                stroke="#ffffff44"
                stroke-width="1.5"
              />
              <text x="0" y="0" text-anchor="middle" fill="#ffffff" font-size="0.7em"
                >Cargo Load : {{ predictedHolds }} / {{ avatar.ship.holds }}</text
              >
            </g>

            <g transform="translate(-120 180)" v-if="avatar.credits != 0" dominant-baseline="middle">
              <rect
                x="-55"
                y="-10"
                width="110"
                height="20"
                rx="3"
                ry="3"
                fill="#2e0d56"
                stroke="#ffffff44"
                stroke-width="1.5"
              />
              <text x="0" y="0" text-anchor="middle" fill="#ffffff" font-size="0.7em"
                >Bal: {{ avatar.credits }}&cent;</text
              >
            </g>

            <g v-if="currentBalance != 0" transform="translate(0 180)" dominant-baseline="middle">
              <rect
                x="-55"
                y="-10"
                width="110"
                height="20"
                rx="3"
                ry="3"
                fill="#3d1273"
                stroke="#ffffff44"
                stroke-width="1.5"
              />
              <text x="0" y="0" text-anchor="middle" fill="#ffffff" v-if="currentBalance < 0" font-size="0.7em"
                >Pay: &#8595; {{ Math.abs(currentBalance) }}&cent;</text
              >
              <text x="0" y="0" text-anchor="middle" fill="#ffffff" v-else-if="currentBalance > 0" font-size="0.7em"
                >Gain: &#8593; {{ currentBalance }}&cent;</text
              >
            </g>

            <g
              transform="translate(120 180)"
              dominant-baseline="middle"
              v-if="currentBalance != 0 && avatar.credits + currentBalance > 0"
            >
              <rect
                x="-55"
                y="-10"
                width="110"
                height="20"
                rx="3"
                ry="3"
                fill="#5D1EB0"
                stroke="#ffffff44"
                stroke-width="1.5"
                v-if="currentBalance > 0"
              />
              <rect
                x="-55"
                y="-10"
                width="110"
                height="20"
                rx="3"
                ry="3"
                fill="#280b4b"
                stroke="#ffffff44"
                stroke-width="1.5"
                v-else
              />
              <text x="2" y="0" text-anchor="middle" fill="#ffffff" font-size="0.7em"
                >Fin: {{ avatar.credits + currentBalance }}&cent;</text
              >
            </g>
            <g transform="translate(120 180)" dominant-baseline="middle" v-if="avatar.credits + currentBalance < 0">
              <rect
                x="-55"
                y="-10"
                width="110"
                height="20"
                rx="3"
                ry="3"
                fill="#280b4b"
                stroke="#ffffff44"
                stroke-width="1.5"
              />
              <text x="-2" y="0" text-anchor="middle" fill="#ffffff" font-size="0.7em">Insufficient Funds</text>
            </g>
            <g transform="translate(120 180)" dominant-baseline="middle" v-if="!nothingToTrade && currentBalance == 0">
              <rect
                x="-55"
                y="-10"
                width="110"
                height="20"
                rx="3"
                ry="3"
                fill="#280b4b"
                stroke="#ffffff44"
                stroke-width="1.5"
              />
              <text x="-2" y="0" text-anchor="middle" fill="#ffffff" font-size="0.7em">Even Trade</text>
            </g>
          </g>
        </g>

        <g
          fill="#ffffff"
          font-size=""
          :transform="'translate(0 ' + (250 - 400 / slotScale) + ') scale(' + (1 + slotScale / 4) + ')'"
        >
          <g transform="translate(0 10)">
            <inventory-dial
              label="Equipment"
              :portInventory="parseInt(portInventory.equipment)"
              v-on:update:inventoryToTrade="updateEquipmentToTrade($event)"
              :inventoryToTrade="Math.abs(equipmentToTrade)"
              :maxAllowed="equipmentAllowed"
              :maxHolds="this.avatar.ship.holds"
            />
          </g>

          <g transform="translate(0 80)">
            <inventory-dial
              label="Fuel Ore"
              :portInventory="parseInt(portInventory.fuel)"
              v-on:update:inventoryToTrade="updateFuelToTrade($event)"
              :inventoryToTrade="Math.abs(fuelToTrade)"
              :maxAllowed="fuelAllowed"
              :maxHolds="this.avatar.ship.holds"
            />
          </g>

          <g transform="translate(0 150)">
            <inventory-dial
              label="Organics"
              :portInventory="parseInt(portInventory.organics)"
              v-on:update:inventoryToTrade="updateOrganicsToTrade($event)"
              :inventoryToTrade="Math.abs(organicsToTrade)"
              :maxAllowed="organicsAllowed"
              :maxHolds="this.avatar.ship.holds"
            />
          </g>
        </g>

        <g :transform="'translate(0 320) scale(' + slotScale + ')'">
          <menu-button v-on:buttonclick="doTrade()" :enabled="isValidTrade" text="Make Trade" />
        </g>
      </g>
    </menu-container>
  </g>
</template>

<script>
import {
  clampTradeAmount,
  emptyHoldsAfterTrade,
  isEmptyTrade,
  isValidTrade,
  maxTradable,
  tradeBalance,
  usedHolds
} from '@/sdk/game/trade'

import { useGameStateStore } from '@/stores/gamestate'
import { useStarMapStore } from '@/stores/starmap'
import { mapActions, mapState } from 'pinia'
import { useUIStore } from '@/stores/ui'
import MenuButton from './menu-button.svg'
import MenuContainer from './menu-container/_menu-container.svg'
import InventoryDial from './_trade-menu/inventory-dial.svg'
import TransferTab from './_trade-menu/transfer-tab.svg'
import CargoTab from './_trade-menu/cargo-tab.svg'
import InventoryItem from './_trade-menu/inventory-item.svg'
import ShipCargo from './_trade-menu/ship-cargo.svg'

export default {
  name: 'TradeMenu',
  data() {
    return {
      equipmentToTrade: 0,
      fuelToTrade: 0,
      organicsToTrade: 0,
      pending: false
    }
  },
  props: {
    objectId: null
  },
  components: {
    MenuButton,
    MenuContainer,
    InventoryDial,
    TransferTab,
    CargoTab,
    InventoryItem,
    ShipCargo
  },
  methods: {
    ...mapActions(useGameStateStore, ['tradeAtPort']),
    ...mapActions(useUIStore, ['closeMenu']),
    doTrade() {
      this.o8audio.playEffect('click')
      this.pending = true
      let planet = this.systemObjects[this.objectId].orbiting
      let planetId = this.systemObjects[planet].id
      this.tradeAtPort({
        planetId: planetId,
        equipment: this.equipmentToTrade,
        fuel: this.fuelToTrade,
        organics: this.organicsToTrade
      })
    },
    updateEquipmentToTrade(value) {
      this.equipmentToTrade = clampTradeAmount(value, this.equipmentToTrade, this.predictedEmptyHolds)
    },
    updateFuelToTrade(value) {
      this.fuelToTrade = clampTradeAmount(value, this.fuelToTrade, this.predictedEmptyHolds)
    },
    updateOrganicsToTrade(value) {
      this.organicsToTrade = clampTradeAmount(value, this.organicsToTrade, this.predictedEmptyHolds)
    }
  },
  computed: {
    ...mapState(useStarMapStore, ['systemObjects']),
    ...mapState(useGameStateStore, ['avatar']),
    ...mapState(useUIStore, ['viewport']),
    portInventory() {
      return this.systemObjects[this.objectId].inventory
    },
    portPrices() {
      return this.systemObjects[this.objectId].prices
    },
    /** What the player is trading, per good (negative sells). */
    amounts() {
      return { equipment: this.equipmentToTrade, fuel: this.fuelToTrade, organics: this.organicsToTrade }
    },
    /** Credits gained by the trade (negative = paid). */
    currentBalance() {
      return tradeBalance(this.amounts, this.portPrices)
    },
    fullHolds() {
      return usedHolds(this.avatar.ship)
    },
    predictedEmptyHolds() {
      return emptyHoldsAfterTrade(this.avatar.ship, this.amounts)
    },
    predictedHolds() {
      return this.avatar.ship.holds - this.predictedEmptyHolds
    },
    isValidTrade() {
      return isValidTrade({
        credits: this.avatar.credits,
        ship: this.avatar.ship,
        amounts: this.amounts,
        prices: this.portPrices
      })
    },
    equipmentAllowed() {
      return maxTradable(
        this.portInventory.equipment,
        this.avatar.ship.equipment,
        this.predictedEmptyHolds + this.equipmentToTrade
      )
    },
    fuelAllowed() {
      return maxTradable(this.portInventory.fuel, this.avatar.ship.fuel, this.predictedEmptyHolds + this.fuelToTrade)
    },
    organicsAllowed() {
      return maxTradable(
        this.portInventory.organics,
        this.avatar.ship.organics,
        this.predictedEmptyHolds + this.organicsToTrade
      )
    },
    slotScale() {
      if (this.slotWidth > 450) {
        return 1.5
      }
      return 1
    },
    slotWidth() {
      return Math.min(this.viewport.width - 100, 700)
    },
    nothingToTrade() {
      return isEmptyTrade(this.amounts)
    }
  },
  watch: {
    avatar: {
      handler: function (val, oldVal) {
        if (
          val.ship.equipment != oldVal.ship.equipment ||
          val.ship.fuel != oldVal.ship.fuel ||
          val.ship.organics != oldVal.ship.organics
        ) {
          this.closeMenu()
        }
      },
      deep: true
    }
  }
}
</script>
