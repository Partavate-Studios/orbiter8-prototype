<template>
  <g>
    <g>
      <text
        x="0"
        y="-10"
        font-size="0.75em"
        fill="#00000000"
        stroke="#00000088"
        stroke-width="4"
        text-anchor="end"
        alignment-baseline="central"
        >Star System {{ currentStarSystemId }}</text
      >
      <text
        x="0"
        y="-10"
        font-size="0.75em"
        fill="#ffffffaa"
        text-anchor="end"
        stroke="#ffffff99"
        stroke-width="0.25"
        alignment-baseline="central"
        >Star System {{ currentStarSystemId }}</text
      >
      <text
        x="0"
        y="20"
        :font-size="nameSize"
        fill="#00000000"
        stroke="#00000088"
        stroke-width="4"
        text-anchor="end"
        alignment-baseline="central"
        >{{ currentStarSystemName }}</text
      >
      <text
        x="0"
        y="20"
        :font-size="nameSize"
        fill="#ffffffaa"
        stroke="#ffffff88"
        stroke-width="1"
        text-anchor="end"
        alignment-baseline="central"
        >{{ currentStarSystemName }}</text
      >
    </g>
  </g>
</template>

<script>
import { mapState } from 'pinia'

import { useStarMapStore } from '@/stores/starmap'
import { useUIStore } from '@/stores/ui'
import { fitSize } from '@/libs/fit-text'

export default {
  name: 'CurrentSystem',
  computed: {
    ...mapState(useStarMapStore, ['currentStarSystemId', 'currentStarSystemName']),
    ...mapState(useUIStore, ['viewport']),
    /** 1.75em, smaller for a long name, so it never runs off a narrow screen. */
    nameSize() {
      return fitSize(this.currentStarSystemName, 28, Math.min(420, this.viewport.width * 0.45))
    }
  }
}
</script>
