<template>
  <g>
    <menu-slot-container :highlight="avatar.ship.orbit == systemObjects[planetId].id">
      <g :transform="'translate(' + slotWidth * 0.1 + ' 35) rotate(' + planet.telemetry.rotation + ') scale(' + (planet.size / 15 + 0.15) +  ')' ">
        <planet :planet="systemObjects[planetId]" />
      </g>
      <g v-if="avatar.ship.orbit == systemObjects[planetId].id" :transform="'translate(' + 20 + ' 20) rotate(15) scale(1.5)' ">
        <ship :show-engines="true" />
      </g>
      <g v-if="slotWidth > 450">
        <text :x="slotWidth * 0.325 + 3" y="33" font-size="1.25em" text-anchor="end" font-style="bold" fill="#00000088" stroke-width="2" stroke="#00000044">
            {{ planet.name }}
        </text>
        <text :x="slotWidth * 0.325" y="30" font-size="1.25em" text-anchor="end" font-style="bold" fill="#ffffffaa">
            {{ planet.name }}
        </text>
        <text :x="slotWidth * 0.325" y="50" font-size="0.75em" text-anchor="end" fill="#ffffff">
            {{ types.getName(planet.class) }}
        </text>
        <g v-if="portForPlanet(planetId) > 0" :transform="'translate(' + slotWidth * 0.37 + ' 22)'">
          <g transform="scale(0.9)"><station /></g>
          <text x="12" y="4" fill="#ffffff" font-size="0.8em" text-anchor="start">
            [{{ getPortType }}] {{ systemObjects[portForPlanet(planetId)].name }}
          </text>
        </g>
        <g :transform="'translate(' + slotWidth * 0.95 + ' 20)'">
          <text x="12" y="0" fill="#ffffff" font-size="0.5em" text-anchor="end">
            owner: {{ ownerName }}
          </text>
        </g>
        <g v-if="getMoonCount(planetId) > 0" :transform="'translate(' + (slotWidth * 0.39) + ' 40)'">
            <g v-for="(moon, index) in this.moonsForPlanet(planetId)" v-bind:key="'moon' + moon">
              <g :transform="'translate(' + index * slotWidth / 10 + ' 0)'">
                <g :transform="'scale(' + (systemObjects[moon].size / 10 + 1) + ')'">
                  <moon />
                </g>
                <text x="0" y="15" font-size="0.6em" text-anchor="middle" fill="#ffffff">
                    {{ systemObjects[moon].name }}
                </text>
              </g>
            </g>
        </g>
      </g>
      <g v-else-if="slotWidth > 300">
        <text :x="slotWidth * 0.475 + 3" y="33" font-size="1.25em" text-anchor="end" font-style="bold" fill="#00000088" stroke-width="2" stroke="#00000044">
            {{ planet.name }}
        </text>
        <text :x="slotWidth * 0.475" y="30" font-size="1.25em" text-anchor="end" font-style="bold" fill="#ffffffaa">
            {{ planet.name }}
        </text>
        <text :x="slotWidth * 0.475" y="50" font-size="0.75em" text-anchor="end" fill="#ffffff">
            {{ types.getName(planet.class) }}
        </text>
        <text :x="slotWidth * 0.5" y="30" font-size="0.75em" text-anchor="left" fill="#ffffff">
            Moons: {{ getMoonCount(planetId) }}
        </text>

        <g v-if="portForPlanet(planetId) > 0" :transform="'translate(' + slotWidth * 0.54 + ' 46)'">
          <g transform="scale(0.9)"><station /></g>
          <text x="12" y="4" fill="#ffffff" font-size="0.8em" text-anchor="left">
            [{{ getPortType }}]{{ systemObjects[portForPlanet(planetId)].name }}
          </text>
        </g>

      </g>
      <g v-else>
        <text :x="slotWidth * 0.35 + 3" y="33" font-size="1.25em" text-anchor="start" font-style="bold" fill="#00000088" stroke-width="2" stroke="#00000044">
            {{ planet.name }}
        </text>
        <text :x="slotWidth * 0.35" y="30" font-size="1.25em" text-anchor="start" font-style="bold" fill="#ffffff">
            {{ planet.name }}
        </text>
        <g v-if="portForPlanet(planetId) > 0" :transform="'translate(' + slotWidth * 0.38 + ' 46)'">
          <g transform="scale(0.9)"><station /></g>
          <text x="12" y="4" fill="#ffffff" font-size="0.8em" text-anchor="left">
            [{{ getPortType }}]{{ systemObjects[portForPlanet(planetId)].name }}
          </text>
        </g>
      </g>
    </menu-slot-container>
  </g>
</template>

<script>

import { mapGetters } from 'vuex'
import MenuSlotContainer from './menu-container/menu-slot-container.svg'
import Planet from '@/components/star-map/sprites/planet.svg'
import Ship from '@/components/star-map/sprites/ship.svg'
import Station from '@/components/star-map/sprites/station.svg'
import Moon from '@/components/star-map/sprites/moon.svg'
import PlanetTypes from '@/libs/planet-types.js'

export default {
  name: 'PlanetsMenu',
  data () {
    return {
      types: new PlanetTypes()
    }
  },
  props: {
    planetId: {
      type: Number,
      default: null
    },
  },
  components: {
    MenuSlotContainer,
    Planet,
    Station,
    Moon,
    Ship
  },
  methods: {
    getMoonNames(planetId) {
      let moonNames = ''
      let moons = this.moonsForPlanet(planetId)
      for(var i = 0; i < moons.length; i++) {
        //moonNames += moons[i] + ' '
        moonNames += this.systemObjects[moons[i]].name + ' '
      }
      return moonNames
    },
    getMoonCount(planetId) {
      let moons = this.moonsForPlanet(planetId)
      return moons.length;
    }
  },
  computed: {
    ...mapGetters('UI', [
      'viewport'
    ]),
    ...mapGetters('StarMap', [
      'systemObjects',
      'portForPlanet',
      'moonsForPlanet',
      'players'
    ]),
    ...mapGetters('GameState', [
      'avatar'
    ]),
    slotWidth() {
      return Math.min(this.viewport.width - 100, 700);
    },
    getPortType () {
      let type = ''
      if (this.systemObjects[this.portForPlanet(this.planetId)].inventory.equipment > 0) {
        type += 'S'
      } else if (this.systemObjects[this.portForPlanet(this.planetId)].inventory.equipment < 0) {
        type += 'B'
      } else {
        type += '-'
      }

      if (this.systemObjects[this.portForPlanet(this.planetId)].inventory.fuel > 0) {
        type += 'S'
      } else if (this.systemObjects[this.portForPlanet(this.planetId)].inventory.fuel < 0) {
        type += 'B'
      } else {
        type += '-'
      }

      if (this.systemObjects[this.portForPlanet(this.planetId)].inventory.organics > 0) {
        type += 'S'
      } else if (this.systemObjects[this.portForPlanet(this.planetId)].inventory.organics < 0) {
        type += 'B'
      } else {
        type += '-'
      }
      return type
    },
    planet() {
      return this.systemObjects[this.planetId];
    },
    ownerName() {
      let address = this.planet.owner;
      if (parseInt(address) === 0) return 'unclaimed';
      let name = '[' + address.replace(address.substring(5,40), "...") + ']'
      if (typeof this.players[address] != 'undefined') {
        name = this.players[address] + ' ' + name
      }
      return name
    }
  }
}
</script>
