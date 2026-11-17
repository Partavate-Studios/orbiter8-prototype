<template>
  <!-- A belt's large asteroid (D69): its composition's art (assets/art/asteroid-*.svg), about 10 units in
       radius (libs/sprite-types.js ART.asteroid), turned a little by its section so they don't all match. -->
  <image :href="art" x="-11" y="-11" width="22" height="22" :transform="`rotate(${section * 47})`" />
</template>

<script>
import carbonaceous from '@/assets/art/asteroid-carbonaceous.svg'
import silicate from '@/assets/art/asteroid-silicate.svg'
import metallic from '@/assets/art/asteroid-metallic.svg'

const ART = [carbonaceous, silicate, metallic]

export default {
  name: 'AsteroidSprite',
  props: {
    composition: { type: Number, default: 0 },
    /** Which section it's in. */
    section: { type: Number, default: 0 }
  },
  computed: {
    art() {
      return ART[this.composition] ?? carbonaceous
    }
  }
}
</script>
