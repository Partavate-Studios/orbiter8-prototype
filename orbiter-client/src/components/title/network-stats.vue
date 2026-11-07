<template>
  <!-- How busy a network's galaxy is: "11 pilots · 66 star systems", or why it isn't known. -->
  <span class="network-stats">
    <template v-if="stats === 'loading' || stats === undefined">checking…</template>
    <template v-else-if="stats">
      {{ stats.pilots }} {{ stats.pilots === 1 ? 'pilot' : 'pilots' }} · {{ stats.starSystems }} {{ stats.starSystems === 1 ? 'star system' : 'star systems' }}
    </template>
    <template v-else>not answering right now</template>
  </span>
</template>

<script>
import { mapState } from 'pinia'
import { useOnboardingStore } from '@/stores/onboarding'

export default {
  name: 'NetworkStats',
  props: {
    chainId: { type: Number, required: true }
  },
  computed: {
    ...mapState(useOnboardingStore, ['networkStats']),
    stats() {
      return this.networkStats[this.chainId]
    }
  }
}
</script>

<style scoped>
.network-stats {
  font-size: 0.8em;
  color: #c3b3da;
}
</style>
