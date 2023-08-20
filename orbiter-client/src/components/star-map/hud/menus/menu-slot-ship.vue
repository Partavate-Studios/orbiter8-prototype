<template>
  <g>
    <menu-slot-container>
      <g :transform="'translate(' + slotWidth * 0.1 + ' 35) rotate(45) scale(' + (ship.size / 5 + 1.75) +  ')' ">
        <ship :ship="systemObjects[shipId]" />
      </g>
      <g v-if="slotWidth > 450">
        <text :x="slotWidth * 0.425 + 3" y="33" font-size="1.25em" text-anchor="middle" font-style="bold" fill="#00000088" stroke-width="2" stroke="#00000044">
            {{ ship.name }}
        </text>
        <text :x="slotWidth * 0.425" y="30" font-size="1.25em" text-anchor="middle" font-style="bold" fill="#ffffffaa">
            {{ ship.name }}
        </text>
        <text :x="slotWidth * 0.425" y="50" font-size="0.8em" text-anchor="middle" font-style="bold" fill="#ffffffaa">
            {{ ownerName }}
        </text>
        <text :x="slotWidth * 0.725" y="40" font-size="0.8em" text-anchor="start" font-style="bold" fill="#ffffffaa">
            Orbiting {{ systemObjects[ship.orbiting].name }}
        </text>
      </g>
      <g v-else-if="slotWidth > 300">
        <text :x="slotWidth * 0.575 + 3" y="33" font-size="1.25em" text-anchor="end" font-style="bold" fill="#00000088" stroke-width="2" stroke="#00000044">
            {{ ship.name }}
        </text>
        <text :x="slotWidth * 0.575" y="30" font-size="1.25em" text-anchor="end" font-style="bold" fill="#ffffffaa">
            {{ ship.name }}
        </text>
        <text :x="slotWidth * 0.575" y="50" font-size="0.8em" text-anchor="end" font-style="bold" fill="#ffffffaa">
            {{ ownerName }}
        </text>
      </g>
      <g v-else>
        <text :x="slotWidth * 0.35 + 3" y="33" font-size="1.25em" text-anchor="start" font-style="bold" fill="#00000088" stroke-width="2" stroke="#00000044">
            {{ ship.name }}
        </text>
        <text :x="slotWidth * 0.35" y="30" font-size="1.25em" text-anchor="start" font-style="bold" fill="#ffffff">
            {{ ship.name }}
        </text>
        <text :x="slotWidth * 0.35" y="50" font-size="0.8em" text-anchor="start" font-style="bold" fill="#ffffffaa">
            {{ ownerName }}
        </text>
      </g>
    </menu-slot-container>
  </g>
</template>

<script>

import { mapGetters } from 'vuex'
import MenuSlotContainer from './menu-container/menu-slot-container.svg'
import Ship from '@/components/star-map/sprites/ship.svg'

export default {
  name: 'ShipsMenu',
  data () {
    return {
    }
  },
  props: {
    shipId: {
      type: Number,
      default: null
    },
  },
  components: {
    MenuSlotContainer,
    Ship
  },
  methods: {
  },
  computed: {
    ...mapGetters('UI', [
      'viewport'
    ]),
    ...mapGetters('StarMap', [
      'systemObjects',
      'players'
    ]),
    slotWidth() {
      return Math.min(this.viewport.width - 100, 700);
    },
    ship() {
      return this.systemObjects[this.shipId];
    },
    ownerName() {
      let address = this.ship.owner;
      if (parseInt(address) === 0) return 'unclaimed';
      let name = '[' + address.replace(address.substring(5,40), "...") + ']'
      if (typeof this.players[address] !== 'undefined') {
        name = this.players[address] + ' ' + name
      }
      return name
    }
  }
}
</script>
