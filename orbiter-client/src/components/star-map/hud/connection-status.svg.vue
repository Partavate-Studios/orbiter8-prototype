<template>
  <g>
    <g :transform="'translate(0 ' + (bottomMostY - 20)  + ')'" stroke="#888888" stroke-width="0.5">
      <rect :x="-12" :y="-6" rx="5" ry="5" width="24" height="12" stroke="#000000" fill="#00000088" />
      <g v-if="isLoading">
        <circle cx="-5" cy="0" r="3"  fill="#ffffff" />
      </g>
      <g v-else>
        <circle cx="-5" cy="0" r="3"  fill="none" />
      </g>

      <g v-if="gameDataLoading">
        <circle cx="5" cy="0" r="3"  fill="#ffffff" />
      </g>
      <g v-else>
        <circle cx="5" cy="0" r="3"  fill="none" />
      </g>


      <text x="0" y="12" font-size="0.5em" text-anchor="middle"  dominant-baseline="central" fill="#888888">
        {{ blockId }}
      </text>
    </g>
  </g>
</template>

<script>

import { mapGetters } from 'vuex'

export default {
  name: 'ConnectionStatus',
  computed: {
    ...mapGetters([
      'blockId'
    ]),
    ...mapGetters('StarMap', [
      'isLoading',
      'currentStarSystemId',
    ]),
    ...mapGetters('GameState', [
      'gameDataLoading'
    ]),
    ...mapGetters('UI', [
      'leftMostX',
      'rightMostX',
      'topMostY',
      'bottomMostY',
      'jumpAnimationState'
    ])
  }
}
</script>
