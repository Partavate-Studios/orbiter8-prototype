<template>
  <g>   
    <g :transform="getReverseOrbitalRotateTransform()">
      <slot></slot>
    </g>
  </g>
</template>


<script>
import { mapGetters } from 'vuex'

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
    ...mapGetters('StarMap', [
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
