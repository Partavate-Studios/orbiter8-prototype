<template>
  <g>
    <g :transform="getOrbitalRotateTransform()">
      <g :transform="getOrbitalShiftTransform()">
        <slot></slot>
      </g>
    </g>
  </g>
</template>

<script>
import { mapState } from 'pinia'
import { useStarMapStore } from '@/stores/starmap'

export default {
  name: 'orbitalshift',
  props: {
    attributes: {
      type: Object,
      default () {
        return {
          speed: 0,
          size: 0,
          distance: 0,
          rotation: 0
        }
      }
    },
  },
  data () {
    return {
    }
  },
  computed: {
    ...mapState(useStarMapStore, [
      'gameTime'
    ])
  },
  methods: {
    getOrbitalShiftTransform () {
      let transform = 'translate(' + this.attributes.distance + ', 0)'
      return transform
    },
    getOrbitalRotateTransform () {
      let transform = 'rotate(' + (
        (
          this.attributes.initialRotation + 
          this.gameTime * 
          this.attributes.speed /
          (this.attributes.distance + 1000000)
        )
        % 360
      ) + ')'
      return transform
    }
  }
}
</script>
