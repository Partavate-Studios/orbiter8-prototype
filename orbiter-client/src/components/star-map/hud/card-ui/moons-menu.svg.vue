<template>
  <g v-if="objectId != null">
    <card-background />
    <g>
      <g v-for="(option, key) in systemObjects[objectId].moons" :key="'moon-' + key">
        <g :transform="'translate(-65 ' + (-65 + 17 * key) + ')'">
          <card-button :text="option.moonName" v-on:buttonclick="selectMoon(option.moonId)" />
        </g>
      </g>
    </g>
  </g>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import { useUIStore } from '@/stores/ui'
import CardBackground from './card-background.svg'
import CardButton from './card-button.svg'
import { useStarMapStore } from '@/stores/starmap'

export default {
  name: 'MoonsMenu',
  components: {
    CardBackground,
    CardButton
  },
  props: {
    objectId: null
  },
  computed: {
    ...mapState(useStarMapStore, ['systemObjects'])
  },
  methods: {
    ...mapActions(useUIStore, ['selectSprite']),
    selectMoon(moonId) {
      this.o8audio.playEffect('click')
      this.selectSprite(moonId)
    }
  }
}
</script>

<style lang="scss"></style>
