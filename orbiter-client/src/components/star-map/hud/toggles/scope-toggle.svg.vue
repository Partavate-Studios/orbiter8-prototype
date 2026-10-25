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
        <circle cx="0" cy="0" r="18" stroke-width="2" fill="#00000000" stroke="#ffffffaa" />
        <circle cx="0" cy="0" r="18" stroke-width="1" fill="none" stroke="#ffffff" stroke-dasharray="3 3" />
      </a>
    </g>
  </g>
</template>

<script>

import { useUIStore } from '@/stores/ui'
import { mapActions, mapState } from 'pinia'
import { useConfigStore } from '@/stores/config'

export default {
  name: 'ScopeToggle',
  data () {
    return {
      scale: 1.25
    }
  },
  computed: {
    ...mapState(useConfigStore, [
      'showScope'
    ]),
  },
  methods: {
    ...mapActions(useConfigStore, [
      'toggleScope'
    ]),
    ...mapActions(useUIStore, [
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
