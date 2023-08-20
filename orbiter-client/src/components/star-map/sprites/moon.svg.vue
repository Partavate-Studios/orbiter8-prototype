<template>
  <g transform="scale(0.5)">
    <circle cx="0" cy="0" r="10" stroke-width="0" fill="#e5cfff00" />
    <circle cx="0" cy="0" r="4" stroke="#c3b3da" stroke-width="0.5" fill="#e5cfff" />
    <g v-if="graphicsQuality > 2">
      <circle cx="-1.25" cy="1" r="1.5" stroke="#c3b3da" stroke-width="0.15" fill="#c3b3da" />
      <circle cx="1" cy="-1.25" r="0.75" stroke="#c3b3da" stroke-width="0.15" fill="#c3b3da" />
      <circle cx="1.5" cy="1" r="1" stroke="#c3b3da" stroke-width="0.15" fill="#c3b3da" />
      <circle cx="-1.25" cy="-1.75" r="0.5" stroke="#c3b3da" stroke-width="0.15" fill="#c3b3da" />
      <circle cx="-3" cy="-1" r="1" stroke="#c3b3da" stroke-width="0.15" fill="#c3b3da" />
      <circle cx="3" cy="-0.5" r="1" stroke="#c3b3da" stroke-width="0.15" fill="#c3b3da" />
      <circle cx="-1" cy="-3" r="0.75" stroke="#c3b3da" stroke-width="0.15" fill="#c3b3da" />
      <circle cx="-0.25" cy="3" r="0.5" stroke="#c3b3da" stroke-width="0.15" fill="#c3b3da" />
    </g>
  </g>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'moon',
  components: {
  },
  props: {
    moon: {
      type: Object,
      default () {
        return {
          name: '...',
          attributes: {
            speed: 0,
            size: 0,
            distance: 0,
            rotation: 0
          },
          planet: 0
        }
      }
    }
  },
  computed: {
    ...mapGetters('Config', [
      'graphicsQuality'
    ]),
  }
}
</script>
