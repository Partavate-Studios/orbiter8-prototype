<template>
  <g>
    <icon>
      <rect
        x="-18"
        y="-4"
        width="36"
        height="8"
        rx = "4"
        ry = "4"
        fill="#ffffff"
        transform="rotate(45)" />
      <rect
        x="-18"
        y="-4"
        width="36"
        height="8"
        rx = "4"
        ry = "4"
        fill="#ffffff"
        transform="rotate(-45)" />

    </icon>
  </g>
</template>

<script>
import Icon from './_icon-container.svg'

export default {
  name: 'XIcon',
  components: {
    Icon
  },
  data () {
    return {
    }
  }
}
</script>
