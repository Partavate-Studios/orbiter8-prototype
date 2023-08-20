<template>
  <div class="ship-scene">
    <svg
        viewBox="-32 -32 64 64"
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink" >
        <g transform="translate(-50 5) scale(5.5)">
            <ship />
        </g>
        <g v-if="warmingUp">
            <g transform="translate(-50 20)">
            <circle cx="0" cy="0" r="5" fill="#ffffff44" class="smoke1" />
            <circle cx="0" cy="0" r="10" fill="#ffffff44" class="smoke2" />
            <circle cx="0" cy="0" r="15" fill="#ffffff44" class="smoke3" />

            <circle cx="0" cy="10" r="15" fill="#ffffff44" class="smoke1" />
            <circle cx="0" cy="10" r="15" fill="#ffffff44" class="smoke2" />
            <circle cx="0" cy="10" r="15" fill="#ffffff44" class="smoke3" />
            </g>

            <g transform="translate(-75 20)">
            <circle cx="0" cy="0" r="6" fill="#ffffff66" class="smoke1" />
            <circle cx="0" cy="0" r="8" fill="#ffffff66" class="smoke2" />
            <circle cx="0" cy="0" r="10" fill="#ffffff66" class="smoke3" />

            <circle cx="0" cy="10" r="15" fill="#ffffff66" class="smoke1" />
            <circle cx="0" cy="10" r="15" fill="#ffffff66" class="smoke2" />
            <circle cx="0" cy="10" r="15" fill="#ffffff66" class="smoke3" />
            </g>
            <g transform="translate(-25 20)">
            <circle cx="0" cy="0" r="6" fill="#ffffff66" class="smoke1" />
            <circle cx="0" cy="0" r="8" fill="#ffffff66" class="smoke2" />
            <circle cx="0" cy="0" r="10" fill="#ffffff66" class="smoke3" />

            <circle cx="0" cy="10" r="15" fill="#ffffff66" class="smoke1" />
            <circle cx="0" cy="10" r="15" fill="#ffffff66" class="smoke2" />
            <circle cx="0" cy="10" r="15" fill="#ffffff66" class="smoke3" />
            </g>
        </g>

        <g v-for="x in 6" :key="ship-x">
            <g :transform="'translate(' + (x * 18 - 25) + ' 1) scale(0.75)'" opacity="0.1">
            <ship />
            </g>
            <g :transform="'translate(' + (x * 19 - 20) + ' 6) scale(1)'" opacity="0.25">
            <ship />
            </g>
            <g :transform="'translate(' + (x * 20 - 15) + ' 12) scale(1.25)'" opacity="0.55">
            <ship />
            </g>
        </g>

        <g fill="#ffffff">
            <rect x="-90" y="25" width="80" height="4"  rx="2" ry="2" />

            <rect x="-110" y="-16" width="3" height="45" rx="2" ry="2" />
            <rect x="-95" y="-16" width="3" height="45" rx="2" ry="2" />

            <g v-if="!warmingUp">
            <rect x="-110" y="-20" width="45" height="2" rx="2" ry="2" />
            <rect x="-90" y="-15" width="25" height="2" rx="2" ry="2" />
            </g>

            <rect x="-105" y="-15" width="8" height="2" rx="2" ry="2" />
            <rect x="-105" y="-5" width="8" height="2" rx="2" ry="2" />
            <rect x="-105" y="5" width="8" height="2" rx="2" ry="2" />
            <rect x="-105" y="15" width="8" height="2" rx="2" ry="2" />
            <rect x="-105" y="25" width="8" height="2" rx="2" ry="2" />
        </g>
        </svg>
  </div>
</template>

<script>
import Ship from '../star-map/sprites/ship.svg.vue'

export default {
  components: {
    Ship
  },
  name: 'ShipScene',
  props: {
    warmingUp: {
      default: false
    }
  }
}
</script>

<style scoped lang="scss">
  div.ship-scene {
    width: 100%;
    height: 128px;
    text-align: center;
    svg {
      width: 460px;
      height: 128px;
    }
  }
  .smoke1 {
    animation-name: smoke;
    animation-duration: 1s;
    animation-iteration-count: infinite;
    animation-timing-function: linear;
  }
  .smoke2 {
    animation-name: smoke;
    animation-duration: 6s;
    animation-iteration-count: infinite;
    animation-timing-function: linear;
  }
  .smoke3 {
    animation-name: smoke;
    animation-duration: 12s;
    animation-iteration-count: infinite;
    animation-timing-function: linear;
  }


  @keyframes smoke {
    0%   {fill:#ffffff; scale: 0}
    100% {fill: #ffffff00; scale: 1}
  }

</style>
