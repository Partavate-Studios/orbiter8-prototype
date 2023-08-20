<template>
  <g>
    <menu-container>
      <g v-for="(id, index) in spriteIds.planets" v-bind:key="'planet' + id">
        <g :transform="'translate(0 ' + (-400 + (70 * index)) +  ')' " >
          <a v-on:click.prevent="selectAndClose(id)" cursor="pointer">
            <planet-slot :planetId="id" />
          </a>
        </g>
      </g>
    </menu-container>
  </g>
</template>

<script>

import { mapGetters, mapMutations } from 'vuex'
import MenuContainer from './menu-container/_menu-container.svg'
import PlanetSlot from './menu-slot-planet'

export default {
  name: 'PlanetsMenu',
  data () {
    return {
    }
  },
  components: {
    MenuContainer,
    PlanetSlot
  },
  methods: {
    ...mapMutations('UI', [
      'selectSprite',
      'closeMenu'
    ]),
    selectAndClose(spriteId) {
      this.o8audio.playEffect('click')
      this.selectSprite(spriteId)
      this.closeMenu()
    }
  },
  computed: {
    ...mapGetters('StarMap', [
      'systemObjects',
      'spriteIds'
    ])
  }
}
</script>
