<template>
  <!-- An asteroid's station (D74): a landing pad, modules, a drill and its drones, built onto the rock
       (assets/art/asteroid-station.svg), centered on its place on the asteroid. -->
  <image :href="art" x="-18" y="-6" width="24" height="24" />
</template>

<script>
import art from '@/assets/art/asteroid-station.svg'

export default {
  name: 'AsteroidStation',
  data() {
    return { art }
  }
}
</script>
