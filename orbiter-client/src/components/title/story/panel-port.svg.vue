<template>
  <!-- Panel 4: the Great Regrettion. A crowded port: the Federation's station with Orbiters docked
       at every pad, more waiting in a queue that barely moves, and the ports' three-letter trade
       codes ticking past underneath, every one of them falling. -->
  <svg class="art" viewBox="-500 -500 1000 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <g transform="translate(60 -40)">
      <g class="spin">
        <g v-for="pad in pads" :key="pad" :transform="'rotate(' + pad + ')'">
          <g stroke="#e6dcf5" stroke-width="1.2" stroke-opacity="0.75">
            <line x1="62" y1="-5" x2="84" y2="-5" />
            <line x1="62" y1="5" x2="84" y2="5" />
          </g>
          <g transform="translate(97 0) scale(2.8)"><fleet-ship type="orbiter8" /></g>
        </g>
        <g transform="scale(8.5)"><station-art /></g>
      </g>
    </g>

    <!-- the queue, creeping toward the port -->
    <g class="queue">
      <g v-for="(ship, index) in queue" :key="index" :transform="'translate(' + ship.x + ' ' + ship.y + ') rotate(' + ship.heading + ') scale(2.4)'">
        <fleet-ship type="orbiter8" engines flame="engineTrailGradient" />
      </g>
    </g>

    <!-- the ticker -->
    <g transform="translate(0 238)">
      <rect x="-700" y="-22" width="1400" height="44" fill="#12052a" opacity="0.75" />
      <g class="ticker">
        <text v-for="(tick, index) in ticker" :key="index" :x="index * 120 - 700" y="7" class="code">{{ tick }}</text>
      </g>
    </g>
  </svg>
</template>

<script>
import FleetShip from '@/components/assets/fleet-ship.svg'
import StationArt from './station-art.svg'

const CODES = ['WAT ▼', 'MET ▼', 'RAR ▼', 'HE3 ▼', 'ORG ▼', 'SIL ▼', 'EQP ▼', 'ELC ▼']

export default {
  name: 'PanelPort',
  components: { FleetShip, StationArt },
  data() {
    return {
      pads: [0, 60, 120, 180, 240, 300],
      queue: [
        { x: -150, y: 100, heading: 56 },
        { x: -215, y: 140, heading: 56 },
        { x: -280, y: 180, heading: 56 },
        { x: -345, y: 220, heading: 56 },
        { x: -410, y: 260, heading: 56 },
        { x: -200, y: 40, heading: 75 },
        { x: -275, y: 60, heading: 75 },
        { x: -350, y: 80, heading: 75 },
        { x: -120, y: -210, heading: 140 },
        { x: -190, y: -250, heading: 140 }
      ],
      // Repeated so the band is never empty as it scrolls.
      ticker: [...CODES, ...CODES]
    }
  }
}
</script>

<style scoped>
.spin {
  animation: turn 240s linear infinite;
}
.queue {
  animation: creep 30s ease-in-out infinite alternate;
}
.code {
  font-family: 'Ubuntu Mono', ui-monospace, monospace;
  font-size: 24px;
  fill: #c3b3da;
  letter-spacing: 2px;
}
.ticker {
  animation: tick 48s linear infinite;
}
@keyframes turn {
  to {
    transform: rotate(360deg);
  }
}
@keyframes creep {
  to {
    transform: translate(30px, -18px);
  }
}
@keyframes tick {
  to {
    transform: translateX(-960px);
  }
}
</style>
