<template>
  <g>
    <icon>
      <rect
        x="-25"
        y="-4"
        width="24"
        height="8"
        rx = "4"
        ry = "4"
        fill="#ffffff"
        transform=" translate(0 16) rotate(45)" />
      <rect
        x="-2"
        y="-4"
        width="24"
        height="8"
        rx = "4"
        ry = "4"
        fill="#ffffff"
        transform=" translate(-16 0) rotate(-45)" />
      <rect
        x="-15"
        y="-4"
        width="30"
        height="8"
        rx = "4"
        ry = "4"
        fill="#ffffff"
        transform=" translate(0 0) " />

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
