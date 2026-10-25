<template>
  <g>   
    <g :transform="getReverseOrbitalRotateTransform()">
      <slot></slot>
    </g>
  </g>
</template>


<script>
import { mapState } from 'pinia'
import { useStarMapStore } from '@/stores/starmap'

export default {
  name: 'untwist',
  props: {
    attributes: {
      type: Object,
      default () {
        return {
          size: 0,
          distance: 0,
          rotation: 0,
          speed: 0,
        }
      }
    }
  },
  computed: {
    ...mapState(useStarMapStore, [
      'gameTime'
    ])
  },
  data () {
    return {
    }
  },
  methods: {
    getReverseOrbitalRotateTransform () {
      let transform = 'rotate(' + (
        (
          this.attributes.initialRotation + 
          this.gameTime * 
          this.attributes.speed /
          (this.attributes.distance + 1000000)
        )
        % 360
        * -1
      ) + ')'      
      return transform
    }
  }
}
</script>
