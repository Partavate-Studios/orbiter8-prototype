<template>
  <g v-if="objectId != null">
    <card-background />
    <g>
      <g v-for="(option, key) in this.systemObjects[this.objectId].moons" :key="'moon-' + key">
        <g :transform="'translate(-65 ' + (-65 + (17 * key)) + ')'">
          <card-button
            :text="option.moonName"
            v-on:buttonclick="o8audio.playEffect('click');selectSprite(option.moonId)" />
        </g>
      </g>
    </g>
  </g>
</template>

<script>

import { mapGetters, mapActions } from 'vuex'
import { mapActions as mapPiniaActions } from 'pinia'
import { useUIStore } from '@/stores/ui'
import CardBackground from './card-background.svg'
import CardButton from './card-button.svg'

export default {
  name: 'MoonsMenu',
  components: {
      CardBackground,
      CardButton
  },
  props: {
    objectId: null
  },
  methods: {
    ...mapActions('GameState', [
      'renameAsset'
    ]),
    ...mapPiniaActions(useUIStore, [
      'selectSprite'
    ])
  },
  computed: {
    ...mapGetters('StarMap', [
      'systemObjects'
    ]),
  }
}
</script>

<style lang="scss">
</style>
