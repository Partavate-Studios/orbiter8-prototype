<template>
  <g v-if="objectId != null">
    <menu-container>
      <g v-if="pending">
        <g>
          <ship-cargo :cargo-holds="0" :predicted-load="0" :existing-load="0" />
        </g>
        <g transform="translate(0 220)">
          <text v-if="pending" text-anchor="middle" fill="#ffffff" font-size="4em">Transacting... </text>
        </g>
      </g>
      <g v-else>
        <g :transform="'translate(0 -400) scale(' + slotScale + ')'">
          <text x="0" y="5" text-anchor="middle" fill="#ffffff88" font-size="1.5em">{{
            systemObjects[objectId].name
          }}</text>

          <g transform="translate(0 35)">
            <g transform="translate(0 95)">
              <ship-cargo
                :cargo-holds="avatar.ship.holds"
                :predicted-load="predictedHolds"
                :existing-load="fullHolds"
              />
            </g>
            <g dominant-baseline="middle" font-size="0.7em">
              <template v-for="(good, index) in pageGoods" :key="'transfer' + good.id">
                <g v-if="amountOf(good) != 0" :transform="'translate(-45 ' + (30 + index * rowGap) + ')'">
                  <transfer-tab :quantity="amountOf(good)" :price="good.price" :total="lineTotal(good)" />
                </g>
              </template>

              <rect
                x="-175"
                y="0"
                width="130"
                :height="portPanelHeight"
                rx="3"
                ry="3"
                fill="#2e0d56"
                stroke="#ffffff44"
                stroke-width="1.5"
              />

              <text x="-110" y="15" text-anchor="middle" fill="#ffffff88" font-size="1em">Port of Trade</text>

              <line x1="-170" x2="-50" y1="23" y2="23" stroke="#ffffff88" stroke-width="0.5" />

              <inventory-item
                v-for="(good, index) in pageGoods"
                :key="'port' + good.id"
                :transform="'translate(-110 ' + (35 + index * rowGap) + ')'"
                :goodstype="shortGoodName(good.name, true)"
                :inventory="signedStock(good)"
                :price="good.price"
              />
            </g>

            <g
              v-for="(good, index) in pageGoods"
              :key="'cargo' + good.id"
              :transform="'translate(135 ' + (30 + index * tabGap) + ')'"
            >
              <cargo-tab :before="carried(good)" :after="carried(good) + amountOf(good)" :label="shortGoodName(good.name)" />
            </g>
            <g :transform="'translate(135 ' + (30 + pageGoods.length * tabGap) + ')'">
              <cargo-tab :before="avatar.ship.holds - avatar.ship.usedHolds" :after="predictedEmptyHolds" label="Empty" />
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

            <g v-if="avatar.credits != 0" transform="translate(-120 180)" dominant-baseline="middle">
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
              <text v-if="currentBalance < 0" x="0" y="0" text-anchor="middle" fill="#ffffff" font-size="0.7em"
                >Pay: &#8595; {{ Math.abs(currentBalance) }}&cent;</text
              >
              <text v-else-if="currentBalance > 0" x="0" y="0" text-anchor="middle" fill="#ffffff" font-size="0.7em"
                >Gain: &#8593; {{ currentBalance }}&cent;</text
              >
            </g>

            <g
              v-if="currentBalance != 0 && avatar.credits + currentBalance > 0"
              transform="translate(120 180)"
              dominant-baseline="middle"
            >
              <rect
                v-if="currentBalance > 0"
                x="-55"
                y="-10"
                width="110"
                height="20"
                rx="3"
                ry="3"
                fill="#5D1EB0"
                stroke="#ffffff44"
                stroke-width="1.5"
              />
              <rect
                v-else
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
              <text x="2" y="0" text-anchor="middle" fill="#ffffff" font-size="0.7em"
                >Fin: {{ avatar.credits + currentBalance }}&cent;</text
              >
            </g>
            <g v-if="avatar.credits + currentBalance < 0" transform="translate(120 180)" dominant-baseline="middle">
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
            <g v-if="!nothingToTrade && currentBalance == 0" transform="translate(120 180)" dominant-baseline="middle">
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
          <g
            v-for="(good, index) in pageGoods"
            :key="'dial' + good.id"
            :transform="'translate(0 ' + (10 + index * dialGap) + ')'"
          >
            <inventory-dial
              :label="good.name"
              :port-inventory="signedStock(good)"
              :inventory-to-trade="Math.abs(amountOf(good))"
              :max-allowed="allowed(good)"
              :max-holds="avatar.ship.holds"
              @update:inventory-to-trade="updateAmount(good, $event)"
            />
          </g>
        </g>

        <!-- What the port sells (Buy) and what it buys (Sell), a page each -->
        <g :transform="'translate(0 ' + tabsY + ')'" font-size="0.8em">
          <g
            v-for="(tab, index) in pages"
            :key="tab.key"
            :transform="'translate(' + (index ? 45 : -45) + ' 0)'"
            class="can-click"
            @click="page = tab.key"
          >
            <rect
              x="-40"
              y="-14"
              width="80"
              height="28"
              rx="4"
              ry="4"
              :fill="page === tab.key ? '#5D1EB0' : '#2e0d56'"
              stroke="#ffffff44"
              stroke-width="1.5"
            />
            <text x="0" y="0" dominant-baseline="middle" text-anchor="middle" fill="#ffffff"
              >{{ tab.label }} ({{ tab.goods.length }})</text
            >
          </g>
        </g>

        <g :transform="'translate(0 320) scale(' + slotScale + ')'">
          <menu-button :enabled="isValidTrade" text="Make Trade" @buttonclick="doTrade()" />
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
  lineValue,
  maxTradable,
  shortGoodName,
  tradeBalance
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
  components: {
    MenuButton,
    MenuContainer,
    InventoryDial,
    TransferTab,
    CargoTab,
    InventoryItem,
    ShipCargo
  },
  props: {
    /** The selected object's key (see sdk/system.js objectKey). */
    objectId: { type: String, default: null }
  },
  data() {
    return {
      /** What the player is trading: units by good id (negative sells). */
      amounts: {},
      /** The page: 'buy' (what the port sells) or 'sell' (what it buys). */
      page: 'buy',
      pending: false
    }
  },
  computed: {
    ...mapState(useStarMapStore, ['systemObjects']),
    ...mapState(useGameStateStore, ['avatar']),
    ...mapState(useUIStore, ['viewport']),
    /** The station's goods (sdk/game/trade.js StationGood). */
    stationGoods() {
      return this.systemObjects[this.objectId].goods
    },
    /** What the port sells (Buy), and what it buys (Sell): a page each. */
    pages() {
      const traded = this.stationGoods.filter((good) => good.mode !== 'none')
      return [
        { key: 'buy', label: 'Buy', goods: traded.filter((good) => good.mode === 'sells') },
        { key: 'sell', label: 'Sell', goods: traded.filter((good) => good.mode === 'buys') }
      ]
    },
    pageGoods() {
      return (this.pages.find((tab) => tab.key === this.page) ?? this.pages[0]).goods
    },
    /** The page tabs sit halfway between the balance row and the first dial, at any scale. */
    tabsY() {
      const s = this.slotScale
      // The balance boxes' bottom edge, and the top of the first dial's label.
      const balanceBottom = -400 + 215 * s + 10 * s
      const labelTop = 250 - 400 / s + 10 * (1 + s / 4) - 12 * (1 + s / 4)
      return (balanceBottom + labelTop) / 2
    },
    /** Rows a little closer when a page has four goods. */
    rowGap() {
      return this.pageGoods.length > 3 ? 27 : 30
    },
    tabGap() {
      return 25
    },
    /** The Port of Trade panel grows to fit a fourth row. */
    portPanelHeight() {
      return 120 + Math.max(0, this.pageGoods.length - 3) * 18
    },
    dialGap() {
      return this.pageGoods.length > 3 ? 55 : 70
    },
    /** Credits gained by the trade (negative = paid). */
    currentBalance() {
      return tradeBalance(this.amounts, this.stationGoods)
    },
    fullHolds() {
      return this.avatar.ship.usedHolds
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
        goods: this.stationGoods
      })
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
    },
    /** The cargo aboard, for noticing a trade went through. */
    cargoNow() {
      return (this.avatar.ship.cargo ?? []).join(',')
    }
  },
  watch: {
    cargoNow(now, before) {
      if (now !== before) this.closeMenu()
    }
  },
  methods: {
    ...mapActions(useGameStateStore, ['tradeAtPort']),
    ...mapActions(useUIStore, ['closeMenu']),
    shortGoodName,
    amountOf(good) {
      return this.amounts[good.id] ?? 0
    },
    carried(good) {
      return this.avatar.ship.cargo?.[good.id] ?? 0
    },
    /** The widgets' sign convention: positive the port sells, negative it buys. */
    signedStock(good) {
      return good.mode === 'buys' ? -good.stock : good.mode === 'sells' ? good.stock : 0
    },
    /** Credits this good's line moves, signed as the tab shows them (negative paid). */
    lineTotal(good) {
      const units = this.amountOf(good)
      return units > 0 ? -lineValue(good, units) : lineValue(good, units)
    },
    allowed(good) {
      if (good.mode === 'none') return 0
      return maxTradable(good, this.carried(good), this.predictedEmptyHolds + this.amountOf(good))
    },
    updateAmount(good, value) {
      const next = clampTradeAmount(value, this.amountOf(good), this.predictedEmptyHolds)
      this.amounts = { ...this.amounts, [good.id]: next }
    },
    async doTrade() {
      this.o8audio.playEffect('click')
      this.pending = true
      let planet = this.systemObjects[this.objectId].orbiting
      let planetId = this.systemObjects[planet].id
      const traded = await this.tradeAtPort({ planetId, amounts: this.amounts })
      // Done: start the next trade from the new cargo. Failed or declined: the same amounts, to try again
      // (the transaction tray says why).
      if (traded) this.amounts = {}
      this.pending = false
    }
  }
}
</script>

