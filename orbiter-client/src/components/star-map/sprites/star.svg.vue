<template>
  <g>
    <circle cx="0" cy="0" r="130" stroke="#ffffff" stroke-width="0.15" fill="url(#starGradient)" />
    <circle cx="0" cy="0" r="140" stroke="#ffffff" stroke-width="0" fill="#ffffff00" />

    <circle v-if="graphicsQuality > 1" cx="0" cy="0" r="240" stroke-width="0" fill="url(#glowingGradient)"  pointer-events="none"/>

  </g>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'star',
  props: {
    star: {
      type: Object,
      default () {
        return {
          name: '...',
          attributes: {
            size: 0
          }
        }
      }
    },
  },
  data () {
    return {
    }
  },
  computed: {
    ...mapGetters('Config', [
      'graphicsQuality'
    ]),
  }
}
</script>
