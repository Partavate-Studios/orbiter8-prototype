<template>
    <g>
      <radialGradient id="glowGradient">
        <stop offset="0%" stop-color="#310e5c"  stop-opacity="0.25"/>
        <stop offset="100%" stop-color="#4c2777"  stop-opacity="0.0"/>
      </radialGradient>

      <circle
        v-if="graphicsQuality > 1"
        cx="0"
        cy="0"
        r="2500"
        stroke="#310e5c"
        stroke-width="0"
        fill="url(#glowGradient)" />

      <circle
        cx="0"
        cy="0"
        r="5000"
        stroke="white"
        stroke-width="10"
        fill="transparent" />

      <g stroke="#c3b3da" :stroke-width="0.01 + 0.03 * viewport.scale">
        <line x1="-2000" y1="0" x2="2000" y2="0"></line>
        <line x1="0" y1="-2000" x2="0" y2="2000"></line>
        <line x1="-1050" y1="-1050" x2="1050" y2="1050"></line>
        <line x1="-1050" y1="1050" x2="1050" y2="-1050"></line>
      </g>
      <g stroke="#c3b3da" :stroke-width="0.01 + 0.03 * viewport.scale">
        <line x1="-1050" y1="-500" x2="1050" y2="500"></line>
        <line x1="-1050" y1="500" x2="1050" y2="-500"></line>
        <line x1="-500" y1="-1050" x2="500" y2="1050"></line>
        <line x1="-500" y1="1050" x2="500" y2="-1050"></line>
      </g>
      <g stroke="#c3b3da" stroke-width="0.05" v-if="graphicsQuality > 1 && viewport.scale < 0.5">
        <line x1="-50" y1="-500" x2="50" y2="-500"></line>
        <line x1="-50" y1="-400" x2="50" y2="-400"></line>
        <line x1="-50" y1="-300" x2="50" y2="-300"></line>
        <line x1="-50" y1="-200" x2="50" y2="-200"></line>
        <line x1="-50" y1="-100" x2="50" y2="-100"></line>
        <line x1="-50" y1="100" x2="50" y2="100"></line>
        <line x1="-50" y1="200" x2="50" y2="200"></line>
        <line x1="-50" y1="300" x2="50" y2="300"></line>
        <line x1="-50" y1="400" x2="50" y2="400"></line>
        <line x1="-50" y1="500" x2="50" y2="500"></line>

        <line x1="-500" y1="-50" x2="-500" y2="50"></line>
        <line x1="-400" y1="-50" x2="-400" y2="50"></line>
        <line x1="-300" y1="-50" x2="-300" y2="50"></line>
        <line x1="-200" y1="-50" x2="-200" y2="50"></line>
        <line x1="-100" y1="-50" x2="-100" y2="50"></line>
        <line x1="100" y1="-50" x2="100" y2="50"></line>
        <line x1="200" y1="-50" x2="200" y2="50"></line>
        <line x1="300" y1="-50" x2="300" y2="50"></line>
        <line x1="400" y1="-50" x2="400" y2="50"></line>
        <line x1="500" y1="-50" x2="500" y2="50"></line>
      </g>
      <g stroke="#c3b3da" stroke-width="0.02" v-if="graphicsQuality > 1 && viewport.scale < 0.5">
        <line v-for="n in 100" :key="'line-a-' + n" :x1="-10500" :y1="n*100" :x2="10500" :y2="n*100"></line>
        <line v-for="n in 100" :key="'line-b-' + n" :x1="-10500" :y1="n*-100" :x2="10500" :y2="n*-100"></line>
        <line v-for="n in 100" :key="'line-c-' + n" :y1="-10500" :x1="n*100" :y2="10500" :x2="n*100"></line>
        <line v-for="n in 100" :key="'line-d-' + n" :y1="-10500" :x1="n*-100" :y2="10500" :x2="n*-100"></line>
      </g>
      <g stroke="#c3b3da" stroke-width="0.005" v-if="graphicsQuality > 1 && viewport.scale < 0.20">
        <line v-for="n in 1000" :key="'line-e-' + n" :x1="-10500" :y1="n*10" :x2="10500" :y2="n*10"></line>
        <line v-for="n in 1000" :key="'line-f-' + n" :x1="-10500" :y1="n*-10" :x2="10500" :y2="n*-10"></line>
        <line v-for="n in 1000" :key="'line-g-' + n" :y1="-10500" :x1="n*10" :y2="10500" :x2="n*10"></line>
        <line v-for="n in 1000" :key="'line-h-' + n" :y1="-10500" :x1="n*-10" :y2="10500" :x2="n*-10"></line>
      </g>
`    </g>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'grid',
  data () {
    return {
      sprites: []
    }
  },
  computed: {
    ...mapGetters('Config', [
      'graphicsQuality'
    ]),
    ...mapGetters('UI', [
      'viewport'
    ])
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
