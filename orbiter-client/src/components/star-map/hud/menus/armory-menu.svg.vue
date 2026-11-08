<template>
  <!-- An armory: Sol's I.S.S. at twice a part's cost, a pilot's Armory at one and a half (paid
       to its owner). Parts are bought and fitted to the ship in one move. -->
  <g v-if="object">
    <menu-container>
      <g :transform="'translate(0 -400) scale(' + scale + ')'" fill="#ffffff" dominant-baseline="middle">
        <text x="0" y="5" text-anchor="middle" fill="#ffffff88" :font-size="fitSize(object.name + ' Armory', 24, 340)">{{ object.name }} Armory</text>
        <text x="0" y="32" text-anchor="middle" font-size="0.8em" fill="#ffffffaa">
          Credits {{ avatar.credits.toLocaleString('en-US') }}&cent; · mounts {{ mounts }} of 6 · free holds
          {{ player.freeBays }}
        </text>

        <g transform="translate(0 70)" font-size="0.8em">
          <g
            v-for="(row, index) in parts"
            :key="row.id"
            :transform="'translate(0 ' + index * 30 + ')'"
            class="can-click"
            @click="choose(row.id)"
          >
            <rect
              x="-175"
              y="-13"
              width="350"
              height="26"
              rx="4"
              :fill="part === row.id ? '#5D1EB0' : '#2e0d56'"
              stroke="#ffffff44"
              stroke-width="0.75"
            />
            <text x="-165" y="0">{{ row.name }}</text>
            <text x="-20" y="0" fill="#ffffff88" font-size="0.85em">{{ row.space }}</text>
            <text x="165" y="0" text-anchor="end">{{ row.price.toLocaleString('en-US') }}&cent;</text>
          </g>
        </g>

        <g v-if="part != null" transform="translate(0 300)">
          <amount-dial v-model:value="count" :label="'How many ' + partPlural(partName)" :max="20" />
          <text x="0" y="62" text-anchor="middle" font-size="0.85em" :fill="affordable ? '#ffffff' : '#ffffff88'">
            {{ affordable ? 'Total' : 'Insufficient funds' }}: {{ total.toLocaleString('en-US') }}&cent;
          </text>
          <g transform="translate(0 100)">
            <menu-button :enabled="count > 0 && affordable" :text="'Buy and Fit ' + count" @buttonclick="buy" />
          </g>
        </g>
      </g>
    </menu-container>
  </g>
</template>

<script>
import { fitSize } from '@/libs/fit-text'
import { mapActions, mapState } from 'pinia'
import { useStarMapStore } from '@/stores/starmap'
import { useGameStateStore } from '@/stores/gamestate'
import { useUIStore } from '@/stores/ui'
import { usePlayerStore } from '@/stores/player'
import MenuContainer from './menu-container/_menu-container.svg'
import MenuButton from './menu-button.svg'
import AmountDial from './widgets/amount-dial.svg'
import { SHIP_PARTS, mountsUsed, partPlural } from '@/sdk/parts'

export default {
  name: 'ArmoryMenu',
  components: { MenuContainer, MenuButton, AmountDial },
  props: {
    /** The selected station's key: its planet is the port. */
    objectId: { type: String, default: null }
  },
  data() {
    return { player: usePlayerStore(), part: null, count: 1 }
  },
  computed: {
    ...mapState(useStarMapStore, ['systemObjects']),
    ...mapState(useGameStateStore, ['avatar']),
    ...mapState(useUIStore, ['viewport']),
    object() {
      const object = this.systemObjects[this.objectId]
      return object?.type === 'station' && object.armory ? object : null
    },
    /** The loadout, for noticing a purchase went through. */
    loadoutNow() {
      return JSON.stringify(this.player.ship?.loadout)
    },
    port() {
      return this.object.objectId
    },
    scale() {
      const width = Math.min(this.viewport.width - 100, 700)
      return Math.min(width > 450 ? 1.5 : 1, (this.viewport.height - 160) / 440)
    },
    mounts() {
      return mountsUsed(this.player.ship.loadout)
    },
    parts() {
      return SHIP_PARTS.map((p) => ({
        id: p.id,
        name: this.player.rules.parts[p.id].name,
        space: p.space,
        price: this.player.partPrice(this.port, p.id, 1)
      }))
    },
    partName() {
      return this.player.rules.parts[this.part].name
    },
    total() {
      return this.player.partPrice(this.port, this.part, this.count)
    },
    affordable() {
      return this.total <= this.avatar.credits
    }
  },
  watch: {
    // Done: the menu closes, as the trade and shipyard menus do once their purchase lands.
    loadoutNow(now, before) {
      if (now !== before) this.closeMenu()
    }
  },
  methods: {
    fitSize,
    ...mapActions(useUIStore, ['closeMenu']),
    partPlural,
    choose(part) {
      this.o8audio.playEffect('click')
      this.part = part
      this.count = 1
    },
    async buy() {
      this.o8audio.playEffect('click')
      if (await this.player.buyParts(this.port, this.part, this.count)) this.count = 1
    }
  }
}
</script>
