<template>
  <!-- Panel 7: the jump. The Orbiter 8 drops into a close orbit around the sun, its capacitor bank
       glowing brighter with every lap, then spends it all in one flash: a streak to the far star on
       the right, which lights up as the ship arrives. Then it plays again. -->
  <svg class="art wide" viewBox="-500 -500 1000 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <g transform="translate(-230 0) scale(0.9)"><star /></g>
    <circle cx="-230" cy="0" r="150" class="charging-orbit" />

    <!-- the far star -->
    <g transform="translate(390 -150)">
      <circle r="90" fill="url(#glowingGradient)" class="arrival" />
      <g transform="scale(0.12)"><star /></g>
    </g>

    <!-- the ship, its charge, and its jump -->
    <g class="ship">
      <circle r="60" fill="url(#glowingGradient)" class="charge" />
      <circle r="140" fill="#ffffff" class="flash" />
      <rect x="-3" y="0" width="6" height="700" rx="3" fill="url(#engineTrailGradient)" class="streak" />
      <g transform="scale(2.6)"><fleet-ship type="orbiter8" engines flame="engineTrailGradient" /></g>
    </g>
  </svg>
</template>

<script>
import Star from '@/components/star-map/sprites/star.svg'
import FleetShip from '@/components/assets/fleet-ship.svg'

export default {
  name: 'PanelJump',
  components: { Star, FleetShip }
}
</script>

<style scoped>
.charging-orbit {
  fill: none;
  stroke: #e6dcf5;
  stroke-opacity: 0.3;
  stroke-width: 1;
  stroke-dasharray: 2 6;
}
/* In from the upper left, two laps close around the sun, then straight to the far star. */
.ship {
  offset-path: path('M-560 -340 C -470 -290 -330 -230 -230 -150 A150 150 0 0 1 -230 150 A150 150 0 0 1 -230 -150 A150 150 0 0 1 -230 150 A150 150 0 0 1 -230 -150 L 390 -150');
  offset-rotate: auto 90deg;
  animation: flight 12s linear infinite;
}
.charge {
  animation: charge 12s linear infinite;
}
.flash {
  animation: flash 12s linear infinite;
}
.streak {
  animation: streak 12s linear infinite;
}
.arrival {
  animation: arrival 12s linear infinite;
}
@keyframes flight {
  0% {
    offset-distance: 0%;
    opacity: 0;
  }
  3% {
    opacity: 1;
  }
  10% {
    offset-distance: 13%;
  }
  70% {
    offset-distance: 78%;
    opacity: 1;
  }
  74% {
    offset-distance: 100%;
    opacity: 1;
  }
  76%,
  100% {
    offset-distance: 100%;
    opacity: 0;
  }
}
@keyframes charge {
  0%,
  10% {
    transform: scale(0);
  }
  70% {
    transform: scale(1);
  }
  71%,
  100% {
    transform: scale(0);
  }
}
@keyframes flash {
  0%,
  69% {
    opacity: 0;
    transform: scale(0);
  }
  70% {
    opacity: 0.9;
    transform: scale(0.3);
  }
  71% {
    opacity: 0.9;
    transform: scale(1);
  }
  73%,
  100% {
    opacity: 0;
    transform: scale(1.2);
  }
}
@keyframes streak {
  0%,
  70% {
    opacity: 0;
  }
  71%,
  74% {
    opacity: 1;
  }
  76%,
  100% {
    opacity: 0;
  }
}
@keyframes arrival {
  0%,
  73% {
    transform: scale(0.6);
    opacity: 0.6;
  }
  76% {
    transform: scale(2.4);
    opacity: 1;
  }
  85%,
  100% {
    transform: scale(0.6);
    opacity: 0.6;
  }
}
</style>
