<template>
  <g>
    <icon>
      <g transform="scale(0.1)">
        <circle cx="0" cy="0" r="170" stroke-width="0" fill="url(#glowingGradient)" stroke="none" />
        <circle cx="0" cy="0" r="62" stroke-width="3" fill="url(#starGradient)" stroke="#ffffffaa" />
      </g>
    </icon>
  </g>
</template>

<script>
import Icon from './_icon-container.svg'

// The top-right button while the star isn't selected (it becomes JumpIcon once it is).
export default {
  name: 'StarIcon',
  components: {
    Icon
  }
}
</script>
