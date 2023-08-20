<template>
  <g>
    <icon>
      <rect
        x="-30"
        y="-4"
        width="32"
        height="8"
        rx = "4"
        ry = "4"
        fill="#ffffff"
        transform=" translate(0 10) rotate(45)" />
      <rect
        x="-2"
        y="-4"
        width="32"
        height="8"
        rx = "4"
        ry = "4"
        fill="#ffffff"
        transform=" translate(0 10) rotate(-45)" />

    </icon>
  </g>
</template>

<script>
import Icon from './_icon-container.svg'

export default {
  name: 'VIcon',
  components: {
    Icon
  },
  data () {
    return {
    }
  }
}
</script>
