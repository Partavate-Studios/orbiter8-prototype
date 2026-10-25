<template>
  <g>
    <g>
      <text
            x="0" y="-10"
            font-size="20"
            fill="#00000000"
            stroke="#00000088"
            stroke-width="4"
            text-anchor="start"
            alignment-baseline="central">{{ avatar.name }}</text>
      <text
            x="0" y="-10"
            font-size="20"
            fill="#ffffffaa"
            text-anchor="start"
            stroke="#ffffff99"
            stroke-width="0.25"
            alignment-baseline="central">{{ avatar.name }}</text>
    </g>
  </g>
</template>

<script>
import { mapState } from 'pinia'

import { useGameStateStore } from '@/stores/gamestate'

export default {
  name: 'CurrentPlayer',
  data () {
    return {
    }
  },
  components: {
  },
  computed: {
    ...mapState(useGameStateStore, [
      'avatar'
    ]),
  }
}
</script>
