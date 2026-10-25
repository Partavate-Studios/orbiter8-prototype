<template>
  <g>
    <g :transform="'scale(' + scopeButtonScale() + ')'">
      <a cursor="pointer" @click.prevent="toggleScope()" @mouseout="setSpriteToDisplay(null)">
        <g v-if="showScope">
          <text x="0" y="12" font-size="2.5em" fill="#ffffff" text-anchor="middle" alignment-baseline="central">-</text>
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

export default {
  name: 'ScopeToggle',
  data() {
    return {
      scale: 1.25
    }
  },
  computed: {
    ...mapState(useUIStore, ['showScope'])
  },
  methods: {
    ...mapActions(useUIStore, ['toggleScope', 'setSpriteToDisplay']),
    scopeButtonScale() {
      if (this.showScope) {
        return 0.75 * this.scale
      }
      return this.scale
    }
  }
}
</script>
