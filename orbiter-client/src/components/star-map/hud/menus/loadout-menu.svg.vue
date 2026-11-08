<template>
  <!-- The player's Orbiter 8 (D59): drawn from what it carries (the NFT's own picture), its
       mounts and bays, what's out of action, and unloading parts at the player's planet. -->
  <g v-if="ship">
    <menu-container>
      <g :transform="'translate(0 -400) scale(' + scale + ')'" fill="#ffffff" dominant-baseline="middle">
        <text x="0" y="5" text-anchor="middle" fill="#ffffff88" :font-size="fitSize(ship.name, 24, 340)">{{ ship.name }}</text>

        <!-- The NFT's own drawing (sdk/ship-art.js), inline so it stays sharp, without the NFT's background -->
        <svg ref="art" x="-75" y="25" width="150" height="150" :viewBox="SHIP_ART_VIEWBOX" />

        <text x="0" y="185" text-anchor="middle" font-size="0.8em" fill="#ffffffaa">
          Mounts {{ mounts }} of 6 · holds {{ ship.bays - player.freeBays }} of {{ ship.bays }} used · range
          {{ Math.max(1, ship.range - ship.rangeLost) }}
        </text>
        <text v-if="condition?.retreated" x="0" y="203" text-anchor="middle" font-size="0.8em" :fill="PINK">
          Retreated: repair at a shipyard before attacking again
        </text>
        <text v-else-if="docked" x="0" y="203" text-anchor="middle" font-size="0.8em" fill="#ffffffaa">
          In the yard after repairs: ready {{ docked }}
        </text>

        <g transform="translate(0 235)" font-size="0.85em">
          <text v-if="!fitted.length" x="0" y="0" text-anchor="middle" fill="#ffffff88">
            <tspan x="0" y="0">Nothing fitted: no weapons, armor or shields.</tspan>
            <tspan x="0" y="22">The I.S.S. armory sells them.</tspan>
          </text>
          <g v-for="(row, i) in fitted" :key="row.part" :transform="'translate(0 ' + i * 30 + ')'">
            <text x="-170" y="0">{{ row.count }} × {{ row.name }}</text>
            <text v-if="row.off" x="-20" y="0" :fill="PINK" font-size="0.85em">{{ row.off }} out of action</text>
            <text x="60" y="0" fill="#ffffff88" font-size="0.8em">{{ row.space }}</text>
            <g v-if="myPlanetHere" class="can-click" transform="translate(150 0)" @click="unload(row)">
              <rect x="-30" y="-13" width="60" height="26" rx="4" fill="#3d1273" stroke="#ffffff44" />
              <text x="0" y="0" text-anchor="middle" font-size="0.8em">Unload</text>
            </g>
          </g>
          <text
            v-if="ship.rangeLost || ship.baysLost"
            x="0"
            :y="fitted.length * 30 + 10"
            text-anchor="middle"
            font-size="0.85em"
            :fill="PINK"
          >
            Damage: {{ ship.rangeLost }} range, {{ ship.baysLost }} holds lost. A shipyard repairs everything.
          </text>
        </g>
      </g>
    </menu-container>
  </g>
</template>

<script>
import { fitSize } from '@/libs/fit-text'
import { mapState } from 'pinia'
import { useUIStore } from '@/stores/ui'
import { usePlayerStore } from '@/stores/player'
import { shipArtParts, SHIP_ART_VIEWBOX } from '@/sdk/ship-art'
import { PINK } from '@/libs/palette'
import MenuContainer from './menu-container/_menu-container.svg'
import { SHIP_PARTS, mountsUsed } from '@/sdk/parts'

export default {
  name: 'LoadoutMenu',
  components: { MenuContainer },
  data() {
    return { player: usePlayerStore(), PINK, SHIP_ART_VIEWBOX }
  },
  computed: {
    ...mapState(useUIStore, ['viewport']),
    ship() {
      return this.player.ship
    },
    condition() {
      return this.player.condition
    },
    scale() {
      const width = Math.min(this.viewport.width - 100, 700)
      return Math.min(width > 450 ? 1.5 : 1, (this.viewport.height - 160) / 460)
    },
    art() {
      const off = this.condition?.off ?? []
      const scarred = Boolean(this.condition?.armorLost || off.some((n) => n > 0))
      return shipArtParts(this.ship, scarred)
    },
    mounts() {
      return mountsUsed(this.ship.loadout)
    },
    docked() {
      const left = (this.condition?.dockedUntil ?? 0) - this.player.now / 1000
      return left > 0 ? `in ${Math.ceil(left / 60)} min` : null
    },
    fitted() {
      const l = this.ship.loadout
      const off = this.condition?.off ?? []
      return SHIP_PARTS.filter((p) => l[p.field] > 0).map((p) => ({
        part: p.id,
        name: this.player.rules.parts[p.id].name,
        count: l[p.field],
        off: p.off === undefined ? 0 : off[p.off],
        space: p.space
      }))
    },
    /** One of the player's planets at this star, to unload parts to. */
    myPlanetHere() {
      return this.player.planets.find((p) => p.owner === this.player.account) ?? null
    }
  },
  watch: {
    // The drawing is our own string (sdk/ship-art.js), set as the inline <svg>'s content.
    art() {
      this.drawArt()
    }
  },
  mounted() {
    this.drawArt()
  },
  methods: {
    fitSize,
    drawArt() {
      if (this.$refs.art) this.$refs.art.innerHTML = this.art
    },
    unload(row) {
      this.o8audio.playEffect('click')
      this.player.unloadShip(this.myPlanetHere.id, row.part, row.count)
    }
  }
}
</script>
