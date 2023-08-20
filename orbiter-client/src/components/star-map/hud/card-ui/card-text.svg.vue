<template>
  <g transform="translate(-70 -70) scale(1)">

    <text fill="#000000" x="70" y="10" font-size="0.5em" text-anchor="middle" transform="translate(0 5)" font-style="bold" stroke="#000000" stroke-width="2" opacity="0.3">
      {{ systemObjects[objectId].name }}
    </text>
    <text fill="#ffffff" x="70" y="10" font-size="0.5em" text-anchor="middle" transform="translate(0 5)" font-style="bold">
      {{ systemObjects[objectId].name }}
    </text>


    <g fill="#ffffffaa" transform="translate(5 115)" font-size="0.40em">

      <text x="10" y="0" text-anchor="start" fill="#ffffff" font-size="0.9em">
        {{ typeName }}</text>
      <text x="120" y="0" text-anchor="end" fill="#ffffff" font-size="0.5em">
        #{{ systemObjects[objectId].id }}</text>

      <g v-if="systemObjects[objectId].isMine">
        <text
          x="65" y="0" text-anchor="middle" font-size="0.8em">
          Mine </text>
      </g>
      <rect x="5" y="4" width="120" height="2" fill="#ffffff" opacity="0.1" />


      <g v-if="systemObjects[objectId].type == 'ship'">

        <text x="65" y="85" text-anchor="middle" font-size="0.9em">
          Orbiting: {{ systemObjects[systemObjects[objectId].orbiting].name }}</text>

        <g v-if="Boolean(systemObjects[objectId].isMine)">
        <text x="65" y="15" text-anchor="middle" font-size="0.9em">
          Captain: {{ avatar.name }}</text>


          <g  font-size="0.9em" transform="translate(22 25)" dominant-baseline="hanging" >


          <text x="16" y="0" text-anchor="middle" font-weight="bold" font-size="1.1em">
            Cargo</text>

          <text x="16" y="10" text-anchor="middle" font-weight="bold">
            {{ avatar.ship.holds }} Holds</text>

          <text x="16" y="18" text-anchor="middle">
            {{ emptyHolds }} Empty</text>


          <text x="52" y="2" text-anchor="start">
            Equipment</text>
          <text x="50" y="2" text-anchor="end">
            {{ avatar.ship.equipment }}</text>

          <text x="52" y="10" text-anchor="start">
            Fuel Ore</text>
          <text x="50" y="10" text-anchor="end">
            {{ avatar.ship.fuel }}</text>

          <text x="52" y="18" text-anchor="start">
            Organics</text>
          <text x="50" y="18" text-anchor="end">
            {{ avatar.ship.organics }}</text>


          </g>
        </g>
        <g v-else>
        <text x="25" y="15" text-anchor="end" font-size="0.9em">
          Pilot:</text>
        <text x="28" y="15" text-anchor="start" font-weight="bold">
          {{ ownerName }}</text>
        </g>

      </g>


      <g v-else-if="systemObjects[objectId].type == 'planet'">
        <text x="25" y="15" text-anchor="end" font-size="0.9em">
          Owner:</text>
        <text x="28" y="15" text-anchor="start" font-weight="bold">
          {{ ownerName }}</text>
        <text x="35" y="25" text-anchor="end" font-size="0.9em">
          Class:</text>
        <text x="38" y="25" text-anchor="start" font-weight="bold">
          {{ planetType.getName(systemObjects[objectId].class) }}</text>
        <text x="35" y="35" text-anchor="end" font-size="0.9em">
          Size:</text>
        <text x="38" y="35" text-anchor="start" font-weight="bold">
          {{ systemObjects[objectId].size }}</text>
        <text x="75" y="35" text-anchor="end" font-size="0.9em">
          Rings:</text>
        <text x="35" y="45" text-anchor="end" font-size="0.9em">
          Orbital Ring:</text>
        <text x="38" y="45" text-anchor="start" font-weight="bold">
          {{ systemObjects[objectId].orbitalPosition }}</text>
        <text x="78" y="35" text-anchor="start" font-weight="bold">
          {{ systemObjects[objectId].rings }}
        </text>


      </g>

      <g v-else-if="systemObjects[objectId].type == 'moon'">
        <text x="25" y="15" text-anchor="end" font-size="0.9em">
            Owner:
        </text>
        <text x="28" y="15" text-anchor="start" font-weight="bold">
            {{ ownerName }}</text>
        <text x="35" y="25" text-anchor="end" font-size="0.9em">
            Class:</text>
        <text x="38" y="25" text-anchor="start" font-weight="bold">
            {{ systemObjects[objectId].class }}</text>
        <text x="35" y="35" text-anchor="end" font-size="0.9em">
            Size:</text>
        <text x="38" y="35" text-anchor="start" font-weight="bold">
            {{ systemObjects[objectId].size }}</text>
      </g>

      <g v-else-if="systemObjects[objectId].type == 'star'">
        <text x="55" y="15" text-anchor="end" font-size="0.9em">
            Discovered by:
        </text>
        <text x="10" y="25" text-anchor="start" font-size="0.9em">
            {{ ownerName }}
        </text>
        <text x="55" y="45" text-anchor="end" font-size="0.9em">
            Size:</text>
        <text x="58" y="45" text-anchor="start" font-weight="bold">
            {{ systemObjects[objectId].size }}
        </text>
      </g>

      <g v-else-if="systemObjects[objectId].type == 'station'">
        <g v-if="systemObjects[objectId].inventory.equipment != 0" font-size="0.9em">
          <text x="40" y="25" text-anchor="end">Equipment:</text>

          <g v-if="systemObjects[objectId].inventory.equipment < 0">
            <text x="90" y="25" text-anchor="end">Buying</text>
            <text x="64" y="25" text-anchor="start">&#8593;</text>
          </g>
          <g v-else>
            <text x="90" y="25" text-anchor="end"> Selling</text>
            <text x="64" y="25" text-anchor="start"> &#8595;</text>
          </g>
          <text x="62" y="25" text-anchor="end" font-weight="bold">
              {{ Math.abs(systemObjects[objectId].inventory.equipment) }}
          </text>

        </g>
        <g v-if="systemObjects[objectId].inventory.fuel != 0" font-size="0.9em">
          <text x="40" y="35" text-anchor="end">Fuel:</text>
          <g v-if="systemObjects[objectId].inventory.fuel < 0">
            <text x="90" y="35" text-anchor="end">Buying</text>
            <text x="64" y="35" text-anchor="start">&#8593;</text>
          </g>
          <g v-else>
            <text x="90" y="35" text-anchor="end"> Selling</text>
            <text x="64" y="35" text-anchor="start"> &#8595;</text>
          </g>
          <text x="62" y="35" text-anchor="end" font-weight="bold">
              {{ Math.abs(systemObjects[objectId].inventory.fuel) }}
          </text>

        </g>
        <g v-if="systemObjects[objectId].inventory.organics != 0" font-size="0.9em">
          <text x="40" y="45" text-anchor="end">Organics:</text>
          <g v-if="systemObjects[objectId].inventory.organics < 0">
            <text x="90" y="45" text-anchor="end">Buying</text>
            <text x="64" y="45" text-anchor="start">&#8593;</text>
          </g>
          <g v-else>
            <text x="90" y="45" text-anchor="end"> Selling</text>
            <text x="64" y="45" text-anchor="start"> &#8595;</text>
          </g>
          <text x="62" y="45" text-anchor="end" font-weight="bold">
              {{ Math.abs(systemObjects[objectId].inventory.organics) }}
          </text>

        </g>
      </g>




    </g>
  </g>
</template>

<script>

import { mapGetters } from 'vuex'

import PlanetTypes from '@/libs/planet-types.js'

export default {
  name: 'SpriteInfo',
  components: {
  },
  props: {
    objectId: null,
    size: {
      type: Number,
      default: 1.3
    }
  },
  data () {
    return {
      planetType: new PlanetTypes()
    }
  },
  computed: {
    ...mapGetters('StarMap', [
      'systemObjects',
      'players'
    ]),
    ...mapGetters('GameState', [
      'avatar'
    ]),
    typeName () {
      switch (this.systemObjects[this.objectId].type) {
        case 'star':
          return 'Warpstar'
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
    emptyHolds () {
      let load = (this.avatar.ship.equipment + this.avatar.ship.fuel + this.avatar.ship.organics)
      console.log('load ', load)
      return (this.avatar.ship.holds - load)
    },
    ownerName() {
      let address = this.systemObjects[this.objectId].owner;

      if (parseInt(address) === 0) return 'unclaimed';

      let name = '[' + address.replace(address.substring(5,40), "...") + ']'

      if (typeof this.players[address] !== 'undefined') {
        name = this.players[address] + ' ' + name
      }
      return name
    }
  },
  watch: {
    avatar: {
      handler: function () {
        console.log('I know the avatar was updated ' + this.avatar.ship.equipment)
      },
      deep: true
    }
  }
}
</script>
