<template>
  <g>
      <icon>
    <g fill="#ffffff">
      <circle cx="0" cy="-12" r="6" stroke-width="1" stroke="#ffffff44" />
      <rect x="-7" y="-2" width="14" height="20" rx="4" ry="4" stroke-width="1" stroke="#ffffff44"  />
      <rect x="-12" y="-4" width="24" height="7" rx="10" ry="10" stroke-width="1" stroke="#ffffff44"  />
      <rect x="-12" y="-1" width="3" height="15" rx="4" ry="4" stroke-width="1" stroke="#ffffff44"  />
      <rect x="9" y="-1" width="3" height="15" rx="4" ry="4" stroke-width="1" stroke="#ffffff44"  />
    </g>
    </icon>
  </g>
</template>

<script>

import Icon from './_icon-container.svg'

export default {
  name: 'AvatarIcon',
  components: {
      Icon
  },
  data () {
    return {
    }
  }
}
</script>
