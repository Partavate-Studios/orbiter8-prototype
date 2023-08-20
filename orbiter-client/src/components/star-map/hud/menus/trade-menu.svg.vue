<template>
  <g v-if="objectId != null">
    <menu-container>

      <g v-if="pending">
            <g transform="translate(0 0)">
              <ship-cargo :cargoHolds="0" :predictedLoad="0" :existingLoad="0" />
            </g>
          <g  transform="translate(0 220)">
              <text v-if="pending"  text-anchor="middle" fill="#ffffff" font-size="4em">Transacting... </text>
          </g>
      </g>
      <g v-else>

        <g :transform="'translate(0 -400) scale(' + slotScale + ')'">

          <text x="0" y="5" text-anchor="middle" fill="#ffffff88"
              font-size="1.5em">{{ systemObjects[this.objectId].name }}</text>


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

              <rect x="-175" y="0" width="130" height="120" rx="3" ry="3" fill="#2e0d56" stroke="#ffffff44" stroke-width="1.5" />

              <text x="-110" y="15" text-anchor="middle" fill="#ffffff88" font-size="1em">Port of Trade</text>

              <line x1="-170" x2="-50" y1="23" y2="23" stroke="#ffffff88" stroke-width="0.5" />

              <inventory-item  transform="translate(-110 35)" goodstype="Equipment"
                :inventory="portInventory.equipment" :price="portPrices.equipment" />

              <inventory-item  transform="translate(-110 65)" goodstype="Fuel"
                :inventory="portInventory.fuel"  :price="portPrices.fuel" />

              <inventory-item  transform="translate(-110 95)" goodstype="Organics"
                :inventory="portInventory.organics"  :price="portPrices.organics" />
            </g>


            <g transform="translate(135 30)">
              <cargo-tab :before="avatar.ship.equipment" :after="avatar.ship.equipment + equipmentToTrade" label="Equipment" />
            </g>
            <g transform="translate(135 55)">
              <cargo-tab :before="avatar.ship.fuel" :after="avatar.ship.fuel + fuelToTrade" label="Fuel" />
            </g>
            <g transform="translate(135 80)">
              <cargo-tab :before="avatar.ship.organics" :after="avatar.ship.organics + organicsToTrade" label="Organics" />
            </g>
            <g transform="translate(135 105)">
              <cargo-tab :quantity="predictedEmptyHolds" label="Empty" />
            </g>

            <g transform="translate(105 10)" dominant-baseline="middle">
              <rect x="-70" y="-10" width="140" height="20" rx="3" ry="3" fill="#3E1475" stroke="#ffffff44" stroke-width="1.5" />
              <text x="0" y="0" text-anchor="middle" fill="#ffffff"
                font-size="0.7em">Cargo Load : {{ predictedHolds }} / {{ avatar.ship.holds }}</text>
            </g>



            <g transform="translate(-120 180)" v-if="avatar.credits != 0" dominant-baseline="middle">
              <rect x="-55" y="-10" width="110" height="20" rx="3" ry="3" fill="#2e0d56" stroke="#ffffff44" stroke-width="1.5" />
              <text x="0" y="0" text-anchor="middle" fill="#ffffff"
                font-size="0.7em">Bal: {{ avatar.credits }}&cent;</text>

            </g>

            <g v-if="currentBalance != 0" transform="translate(0 180)" dominant-baseline="middle">
              <rect x="-55" y="-10" width="110" height="20" rx="3" ry="3" fill="#3d1273" stroke="#ffffff44" stroke-width="1.5" />
              <text x="0" y="0" text-anchor="middle" fill="#ffffff" v-if="currentBalance < 0"
                font-size="0.7em">Pay: &#8595; {{ Math.abs(currentBalance) }}&cent;</text>
              <text x="0" y="0" text-anchor="middle" fill="#ffffff" v-else-if="currentBalance > 0"
                font-size="0.7em">Gain: &#8593; {{ currentBalance }}&cent;</text>
            </g>

            <g transform="translate(120 180)" dominant-baseline="middle" v-if="(currentBalance != 0) && ((avatar.credits + currentBalance)  > 0)">
              <rect x="-55" y="-10" width="110" height="20" rx="3" ry="3" fill="#5D1EB0" stroke="#ffffff44" stroke-width="1.5" v-if="currentBalance > 0" />
              <rect x="-55" y="-10" width="110" height="20" rx="3" ry="3" fill="#280b4b" stroke="#ffffff44" stroke-width="1.5" v-else />
              <text x="2" y="0" text-anchor="middle" fill="#ffffff"
                font-size="0.7em">Fin: {{ avatar.credits + currentBalance }}&cent;</text>
            </g>
            <g transform="translate(120 180)" dominant-baseline="middle" v-if="(avatar.credits + currentBalance)  < 0">
              <rect x="-55" y="-10" width="110" height="20" rx="3" ry="3" fill="#280b4b" stroke="#ffffff44" stroke-width="1.5" />
              <text x="-2" y="0" text-anchor="middle" fill="#ffffff"
                font-size="0.7em">Insufficient Funds</text>
            </g>
            <g transform="translate(120 180)" dominant-baseline="middle" v-if="!nothingToTrade && (currentBalance  == 0)">
              <rect x="-55" y="-10" width="110" height="20" rx="3" ry="3" fill="#280b4b" stroke="#ffffff44" stroke-width="1.5" />
              <text x="-2" y="0" text-anchor="middle" fill="#ffffff"
                font-size="0.7em">Even Trade</text>
            </g>


          </g>


        </g>



        <g fill="#ffffff" font-size=""  :transform="'translate(0 ' + (250 - (400 / slotScale)) + ') scale(' + (1 + (slotScale / 4)) + ')'">

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
            <menu-button
                v-on:buttonclick="doTrade()"
                :enabled="isValidTrade"
                text="Make Trade" />
        </g>

      </g>

    </menu-container>
  </g>
</template>

<script>

import { mapGetters, mapMutations, mapActions } from 'vuex'
import MenuButton from './menu-button.svg'
import MenuContainer from './menu-container/_menu-container.svg'
import InventoryDial from './_trade-menu/inventory-dial.svg'
import TransferTab from './_trade-menu/transfer-tab.svg'
import CargoTab from './_trade-menu/cargo-tab.svg'
import InventoryItem from './_trade-menu/inventory-item.svg'
import ShipCargo from './_trade-menu/ship-cargo.svg'

export default {
  name: 'TradeMenu',
  data () {
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
    ...mapActions('GameState', [
      'tradeAtPort',
    ]),
    ...mapMutations('UI', [
      'closeMenu'
    ]),
    doTrade() {
      this.o8audio.playEffect('click')
      console.log('doing trade', this.systemObjects[this.objectId].orbiting)
      this.pending = true
      let planet = this.systemObjects[this.objectId].orbiting
      let planetId = this.systemObjects[planet].id
      this.tradeAtPort({
          planetId: planetId,
          equipment: this.equipmentToTrade,
          fuel: this.fuelToTrade,
          organics: this.organicsToTrade
        }
      )
    },
    updateEquipmentToTrade(value) {
      this.equipmentToTrade = this.updateGoodsToTrade(value, this.equipmentToTrade)
    },
    updateFuelToTrade(value) {
      this.fuelToTrade = this.updateGoodsToTrade(value, this.fuelToTrade)
    },
    updateOrganicsToTrade(value) {
      this.organicsToTrade = this.updateGoodsToTrade(value, this.organicsToTrade)
    },
    //prevents overflowing or underflowing cargo capacity
    updateGoodsToTrade(value, goodsToTrade) {
      //selling goods to port
      if (value <= 0) {
        if (value > goodsToTrade) { //reduction in # to sell
          let diff = Math.abs(value - goodsToTrade)
          let max = Math.min(this.predictedEmptyHolds, diff)
          return Math.min(goodsToTrade + max, this.avatar.ship.organics)
        } else { //increse in # to sell, can only sell what you have
          return Math.min(value, this.avatar.ship.organics)
        }
      //buying goods from port
      } else if (value > 0) {
        let diff = value - goodsToTrade
        let max = Math.min(this.predictedEmptyHolds, diff)
        return goodsToTrade + max
      }
    },
    goodsAllowed (portGoods, shipGoods, currentlyTrading) {
      if (portGoods < 0) {
        //can sell what you have
        return Math.min(Math.abs(shipGoods), Math.abs(portGoods))
      }
      //can buy what fits
      return Math.min(this.predictedEmptyHolds + currentlyTrading, portGoods)
    },
    buyingOrSelling (value) {
      if (value > 0) {
        return 'Selling'
      } else if (value < 0) {
        return 'Buying'
      }
      return ''
    },
    buyingOrSellingArrow (value) {
      if (value > 0) {
        return "&#8594;"
      } else if (value < 0) {
        return '&#8596;'
      }
      return ''

    }
  },
  computed: {
    ...mapGetters('StarMap', [
      'systemObjects'
    ]),
    ...mapGetters('GameState', [
      'avatar'
    ]),
    ...mapGetters('UI', [
      'viewport'
    ]),
    portInventory () {
      return this.systemObjects[this.objectId].inventory
    },
    portPrices () {
      return this.systemObjects[this.objectId].prices
    },
    currentBalance () {
      return ((this.equipmentToTrade * this.portPrices.equipment) +
              (this.fuelToTrade * this.portPrices.fuel) +
              (this.organicsToTrade * this.portPrices.organics)) * -1
    },
    shipDate () {
      return this.avatar.ship
    },
    fullHolds () {
      return this.avatar.ship.equipment + this.avatar.ship.fuel + this.avatar.ship.organics
    },
    predictedEmptyHolds () {
      return this.emptyHolds -
        this.equipmentToTrade -
        this.fuelToTrade -
        this.organicsToTrade
    },
    predictedHolds () {
      return this.avatar.ship.holds - this.predictedEmptyHolds
    },
    emptyHolds () {
      return (this.avatar.ship.holds - this.fullHolds)
    },
    isValidTrade () {
      if ((this.avatar.credits + this.currentBalance) < 0) {
        return false
      }
      if (this.equipmentToTrade == 0 && this.fuelToTrade == 0 && this.organicsToTrade == 0) {
        return false
      }
      if (this.predictedEmptyHolds < 0) {
        return false
      }
      return true
    },
    equipmentAllowed () {
      return(this.goodsAllowed(this.portInventory.equipment, this.avatar.ship.equipment, this.equipmentToTrade));
    },
    fuelAllowed () {
      return(this.goodsAllowed(this.portInventory.fuel, this.avatar.ship.fuel, this.fuelToTrade));
    },
    organicsAllowed() {
      return(this.goodsAllowed(this.portInventory.organics, this.avatar.ship.organics, this.organicsToTrade));
    },
    slotScale() {
      if (this.slotWidth > 450) {
        return 1.5
      }
      return 1
    },
    slotWidth() {
      return Math.min(this.viewport.width - 100, 700);
    },
    nothingToTrade() {
      if ((this.equipmentToTrade == 0) && (this.fuelToTrade == 0) && (this.organicsToTrade == 0)) {
        return true
      }
      return false
    }
  },
  watch: {
    avatar: {
      handler: function (val, oldVal) {
        if ((val.ship.equipment != oldVal.ship.equipment) ||
            (val.ship.fuel != oldVal.ship.fuel) ||
            (val.ship.organics != oldVal.ship.organics)
        ) {
          this.closeMenu()
        }
        console.log('I know the avatar was updated ' + this.avatar.ship.equipment)
      },
      deep: true
    }
  }
}
</script>
