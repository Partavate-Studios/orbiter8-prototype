<template>
  <g>
    <circle cx="0" cy="0" r="100" stroke="#7c6c91" stroke-width="3" fill="none" />
    <circle cx="0" cy="0" r="100" stroke="#ffffff" stroke-width="1" fill="none" :stroke-dasharray="dashes" />
  </g>
</template>

<script>
import { mapState } from 'pinia'

import { useUIStore } from '@/stores/ui'

export default {
  name: 'Compass',
  data() {
    return {
      dashes: '2 8'
    }
  },
  computed: {
    ...mapState(useUIStore, ['viewport'])
  },
  watch: {
    viewport: {
      handler: function (val) {
        let scaler = 1 / val.scale + 2
        this.dashes = scaler * 2 + ' ' + scaler * 3
      },
      deep: true
    }
  }
}
</script>
