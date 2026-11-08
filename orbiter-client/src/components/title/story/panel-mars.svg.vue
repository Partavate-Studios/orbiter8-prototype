<template>
  <!-- Panel 2: the first colony on Mars. Mars fills the lower left (the game's Rocky class, turning
       slowly); Earth and Luna hang far behind. A colony pod comes down from the upper right and lands
       on the limb, where the domes of the colony then light up one by one. -->
  <svg class="art" viewBox="-500 -500 1000 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <!-- Earth and Luna, far away -->
    <g transform="translate(330 -200)">
      <story-planet :planet-class="0" :radius="24" :spin="120" />
      <g class="orbit">
        <g transform="translate(38 0)"><moon-art :radius="4.5" /></g>
      </g>
    </g>

    <!-- Mars -->
    <g transform="translate(-120 110)">
      <story-planet :planet-class="1" :radius="200" :spin="300" />
      <g v-for="dome in domes" :key="dome.angle" class="dome" :style="{ animationDelay: dome.at + 's' }">
        <g :transform="'rotate(' + dome.angle + ') translate(0 -200) scale(' + dome.scale + ')'">
          <path d="M-10 0a10 10 0 0 1 20 0z" fill="#e5cfff" stroke="#ffffff" stroke-width="1" />
          <path d="M-10 0H10" stroke="#ffffff" stroke-width="1.5" />
          <circle cx="0" cy="-4" r="1.5" fill="#ffffff" />
        </g>
      </g>
    </g>

    <!-- the colony pod, coming down -->
    <g class="pod">
      <rect x="-5" y="2" width="10" height="46" rx="5" fill="url(#engineTrailGradient)" />
      <path d="M-13 2a13 13 0 0 1 26 0z" fill="#e5cfff" stroke="#ffffff" stroke-width="1" />
      <path d="M-13 2H13" stroke="#ffffff" stroke-width="1.5" />
    </g>
  </svg>
</template>

<script>
import StoryPlanet from '@/components/assets/story-planet.svg'
import MoonArt from './moon-art.svg'

export default {
  name: 'PanelMars',
  components: { StoryPlanet, MoonArt },
  data() {
    return {
      // Domes on the upper-right limb: where on the rim (degrees clockwise from the top), size, and
      // when each lights, after the pod lands.
      domes: [
        { angle: 30, scale: 1.3, at: 4.6 },
        { angle: 41, scale: 1.7, at: 4.2 },
        { angle: 53, scale: 1.1, at: 5.0 }
      ]
    }
  }
}
</script>

<style scoped>
.orbit {
  animation: turn 26s linear infinite;
}
.dome {
  animation: light-up 0.6s ease-out both;
}
/* From the upper right down to Mars's limb, where the second dome is; then the pod is the dome. */
.pod {
  offset-path: path('M470 -470 C 380 -300 200 -170 11 -45');
  offset-rotate: 0deg;
  animation:
    descend 4.2s cubic-bezier(0.4, 0, 0.6, 1) both,
    land 0.4s 4.1s ease-out both;
}
@keyframes turn {
  to {
    transform: rotate(360deg);
  }
}
@keyframes light-up {
  from {
    opacity: 0;
  }
}
@keyframes descend {
  from {
    offset-distance: 0%;
  }
  to {
    offset-distance: 100%;
  }
}
@keyframes land {
  to {
    opacity: 0;
  }
}
</style>
