<template>
  <g :transform="'translate(' + cardUiTranslate + ')'">
    <g :transform="'scale(' + cardUiScale + ')'">
      <slot />
    </g>
  </g>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'CardScaling',
  components: {
  },
  props: {
    sprite: {
      type: Object,
      default () {
        return {
        }
      }
    },
  },
  data () {
    return {
    }
  },
  computed: {
    ...mapGetters('UI', [
      'viewport',
      'viewportTotalRubber'
    ]),
    ...mapGetters('StarMap', [
      'systemObjects',
    ]),
    cardUiTranslate () {
      let x = this.sprite.telemetry.translatex + this.viewport.x
      let y = this.sprite.telemetry.translatey + this.viewport.y
      if (this.sprite.orbiting > 0) {
        let parentTelemetry = this.systemObjects[this.sprite.orbiting].telemetry
        x += parentTelemetry.translatex
        y += parentTelemetry.translatey
      }
      x = Math.round((x / this.viewport.scale) * 1000) / 1000
      y = Math.round((y / this.viewport.scale) * 1000) / 1000
      return  x + ' ' + y
    },
    cardUiScale () {
      let cap = Math.min(1, Math.max(0, 1.5 - this.viewport.scale))
      let scale = 1 - ((this.viewportTotalRubber - 5) * this.viewport.scale) / 15
      return Math.max(Math.min((scale), cap), 0)
    }
  },
}
</script>
