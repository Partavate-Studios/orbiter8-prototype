<template>
  <g>
    <g @mouseover="hover = true" @mouseleave="hover = false" >
      <defs>
        <clipPath id="menu-slot-clip">
          <circle cx="0" cy="0" r="10" stroke-width="2"  />
        </clipPath>
      </defs>

      <circle cx="0" cy="0" r="10" :fill="checkboxBackground" stroke-width="2" :stroke="checkboxBorder" />

      <g  clip-path="url(#menu-slot-clip)" v-if="checked">


      </g>
    </g>
  </g>
</template>

<script>

import { mapGetters } from 'vuex'
export default {
  name: 'MenuCheckbox',
  props: {
    checked: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      hover: false
    }
  },
  computed: {
    ...mapGetters('UI', [
      'viewport'
    ]),
    checkboxBackground() {
      if (this.checked) {
          return '#ffffff'
      } else if (this.hover) {
          return '#000000'
      }
      return '#00000044'
    },
    checkboxBorder() {
      if (this.hover) {
        return '#ffffff88'
      } else if (this.checked) {
          return '#ffffff'
      }
      return '#ffffff66'
    }
  }
}
</script>
