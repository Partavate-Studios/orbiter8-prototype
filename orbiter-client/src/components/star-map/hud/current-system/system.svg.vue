<template>
  <g>
    <g>
      <text
            x="0" y="-10"
            font-size="0.75em"
            fill="#00000000"
            stroke="#00000088"
            stroke-width="4"
            text-anchor="end"
            alignment-baseline="central">Star System {{ currentStarSystemId }}</text>
      <text
            x="0" y="-10"
            font-size="0.75em"
            fill="#ffffffaa"
            text-anchor="end"
            stroke="#ffffff99"
            stroke-width="0.25"
            alignment-baseline="central">Star System {{ currentStarSystemId}}</text>
      <text
            x="0" y="20"
            font-size="1.75em"
            fill="#00000000"
            stroke="#00000088"
            stroke-width="4"
            text-anchor="end"
            alignment-baseline="central">{{ currentStarSystemName }}</text>
      <text
            x="0" y="20"
            font-size="1.75em"
            fill="#ffffffaa"
            stroke="#ffffff88"
            stroke-width="1"
            text-anchor="end"
            alignment-baseline="central">{{ currentStarSystemName }}</text>
    </g>
  </g>
</template>

<script>

import { mapGetters } from 'vuex'

export default {
  name: 'CurrentSystem',
  data () {
    return {
    }
  },
  components: {
  },
  computed: {
    ...mapGetters('StarMap', [
      'currentStarSystemId',
      'currentStarSystemName',
    ]),
  }
}
</script>
