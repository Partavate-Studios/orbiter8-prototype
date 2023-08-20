<template>
  <g>
    <g :transform="'translate(0 0) scale(' + scopeButtonScale() + ')'">
      <a
        v-on:click.prevent="toggleScope()"
        v-on:mouseout="setSpriteToDisplay(null)"
        cursor="pointer">
        <g v-if="showScope">
            <text
                  x="0" y="12"
                  font-size="2.5em"
                  fill="#ffffff"
                  text-anchor="middle"
                  alignment-baseline="central">-</text>
        </g>
        <g v-else>
          <g v-if="(spriteToDisplay != null) && (spriteToDisplay != selectedSpriteId)">
            <text
                  x="0" y="10"
                  font-size="1.75em"
                  fill="#ffffff"
                  text-anchor="middle"
                  alignment-baseline="central">?</text>
            <text
                  x="0" y="50"
                  font-size="1em"
                  fill="#ffffff"
                  text-anchor="middle"
                  alignment-baseline="central">{{ sprites[spriteToDisplay].name }}</text>
          </g>
          <g v-else-if="(selectedSpriteId != null)">
            <text
                  x="0" y="10"
                  font-size="1.75em"
                  fill="#ffffff"
                  text-anchor="middle"
                  alignment-baseline="central">!</text>
            <g>
              <text
                    x="0" y="50"
                    font-size="1em"
                    fill="#ffffff"
                    text-anchor="middle"
                    alignment-baseline="central">{{ sprites[selectedSpriteId].name }}</text>
            </g>
          </g>
          <g v-else>
          </g>
        </g>
        <circle cx="0" cy="0" r="18" stroke-width="2" fill="#00000000" stroke="#ffffffaa" />
        <circle cx="0" cy="0" r="18" stroke-width="1" fill="none" stroke="#ffffff" stroke-dasharray="3 3" />
          <g
            v-if="(sprites.length > 0) && getOpacityFromSprite(sprites[0])"
            :transform="'translate(0 0) rotate(' + getDegreesFromSprite(sprites[0]) + ') scale(0.2) '"
            stroke-width="10"
            stroke="#ffffff"
            :stroke-opacity="getOpacityFromSprite(sprites[0])">
              <compass-arrow></compass-arrow>
          </g>
      </a>
    </g>
  </g>
</template>

<script>

import { mapGetters, mapMutations } from 'vuex'
import CompassArrow from '../scope/compass-arrow.svg'

export default {
  name: 'ScopeToggle',
  data () {
    return {
      scale: 1.25,
      sprites: [],
      selectedSpriteId: null
    }
  },
  components: {
    CompassArrow,
  },
  computed: {
    ...mapGetters('Config', [
      'showScope'
    ]),
    ...mapGetters('UI', [
      'spriteToDisplay'
    ]),
  },
  methods: {
    ...mapMutations('Config', [
      'toggleScope'
    ]),
    ...mapMutations('UI', [
      'setSpriteToDisplay'
    ]),
    scopeButtonScale () {
      if (this.showScope) {
        return 0.75 * this.scale
      }
      return this.scale
    }
  }
}
</script>
