<template>
  <!-- Panel 5: Minerva. Her owl, large and lit, and the record she keeps: entries stamped onto the
       ledger one after another, kept forever. -->
  <svg class="art wide" viewBox="-500 -500 1000 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <circle r="340" fill="url(#glowingGradient)" class="halo" />
    <g class="owl" transform="scale(2.4)">
      <minerva-emblem color="#ffffff" />
    </g>
    <g
      v-for="entry in entries"
      :key="entry.text"
      :transform="'translate(' + entry.x + ' ' + entry.y + ') rotate(' + entry.tilt + ')'"
    >
      <g class="stamp" :style="{ animationDelay: entry.at + 's' }">
        <rect :x="-entry.width / 2" y="-19" :width="entry.width" height="38" rx="5" class="stamp-box" />
        <text y="7" class="stamp-text">{{ entry.text }}</text>
      </g>
    </g>
  </svg>
</template>

<script>
import MinervaEmblem from '@/components/assets/minerva-emblem.svg'

export default {
  name: 'PanelMinerva',
  components: { MinervaEmblem },
  data() {
    return {
      entries: [
        { text: 'PILOT REGISTERED', x: -225, y: -190, tilt: -7, width: 250, at: 1.0 },
        { text: 'CLAIM FILED', x: 235, y: -165, tilt: 6, width: 180, at: 1.9 },
        { text: 'STAR NAMED', x: -235, y: 180, tilt: 5, width: 175, at: 2.8 },
        { text: 'SIEGE RECORDED', x: 225, y: 200, tilt: -6, width: 230, at: 3.7 },
        { text: 'FEE DESTROYED', x: -90, y: 262, tilt: 3, width: 215, at: 4.6 }
      ]
    }
  }
}
</script>

<style scoped>
.halo {
  animation: breathe 6s ease-in-out infinite alternate;
}
.owl {
  animation: arrive 2s ease-out both;
}
.stamp {
  animation: stamp 0.35s cubic-bezier(0.2, 0.8, 0.3, 1.3) both;
}
.stamp-box {
  fill: #2b0c50;
  fill-opacity: 0.85;
  stroke: #e6dcf5;
  stroke-width: 2;
  stroke-dasharray: 6 4;
}
.stamp-text {
  font-family: 'Ubuntu Mono', ui-monospace, monospace;
  font-size: 22px;
  letter-spacing: 2px;
  fill: #e6dcf5;
  text-anchor: middle;
}
@keyframes breathe {
  from {
    transform: scale(0.85);
  }
  to {
    transform: scale(1.1);
  }
}
@keyframes arrive {
  from {
    opacity: 0;
    transform: scale(1.6);
  }
  to {
    opacity: 1;
    transform: scale(2.4);
  }
}
@keyframes stamp {
  from {
    opacity: 0;
    transform: scale(2);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
