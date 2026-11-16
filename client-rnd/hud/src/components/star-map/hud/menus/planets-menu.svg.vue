<template>
  <g>
    <menu-container>
      <g v-for="(id, index) in spriteIds.planets" :key="'planet' + id">
        <g :transform="'translate(0 ' + (-400 + 70 * index) + ')'">
          <a cursor="pointer" @click.prevent="selectAndClose(id)">
            <planet-slot :planet-id="id" />
          </a>
        </g>
      </g>
    </menu-container>
  </g>
</template>

<script>
import { useStarMapStore } from '@/stores/starmap'
import { mapActions, mapState } from 'pinia'
import { useUIStore } from '@/stores/ui'
import MenuContainer from './menu-container/_menu-container.svg'
import PlanetSlot from './menu-slot-planet'

export default {
  name: 'PlanetsMenu',
  components: {
    MenuContainer,
    PlanetSlot
  },
  computed: {
    ...mapState(useStarMapStore, ['spriteIds'])
  },
  methods: {
    ...mapActions(useUIStore, ['selectSprite', 'closeMenu']),
    selectAndClose(spriteId) {
      this.o8audio.playEffect('click')
      this.selectSprite(spriteId)
      this.closeMenu()
    }
  }
}
</script>
