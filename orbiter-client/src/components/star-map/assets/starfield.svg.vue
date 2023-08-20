<template>
    <g  transform="scale(1)">
        <g v-if="loaded">
            <circle
                v-for="(star, key) in stars"
                :key="'star-' + key"
                :cx="star.x"
                :cy="star.y"
                :r="star.size * 0.15"
                stroke-width="0.0"
                stroke="#ffffff"
                fill="#af6fff"  />
            <circle
                v-for="(star, key) in stars"
                :key="'star-glare-' + key"
                :cx="star.x"
                :cy="star.y"
                :r="star.size * 0.75"
                stroke-width="0.0"
                stroke="#ffffff"
                fill="#af6fff22"  />
        </g>
    </g>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'starfield',
  data () {
    return {
      stars: [],
      loaded: false
    }
  },
  computed: {
    ...mapGetters('Config', [
        'graphicsQuality'
    ]),
  },
  methods: {
    generateStars () {
      this.loaded = false
      console.log('level ' + this.graphicsQuality)
      let starCount = 800
      if (this.graphicsQuality > 2) {
        starCount = 3200
      }
      let stars = []
      for (let i = 0; i < starCount; i++) {
        this.stars.push({
          x: (Math.random() * 1500 - 750),
          y: (Math.random() * 1500 - 750),
          size: Math.random() * Math.random() * 1.5 + 0.1
        })
      }
      this.stars = stars
      this.loaded = true
    }
  },
  watch: {
    graphicsQuality () {
      this.generateStars()
    }
  },
  beforeMount: function () {
    this.generateStars()
  }
}
</script>

<style scoped lang="scss">
    svg {
        .fil0 {
            fill:#280b4b
        }
        .fil2 {
            fill:#2b0c50
        }
        .fil1 {
            fill:#2e0d56
        }
        .fil3 {
            fill:#310e5b
        }
        .fil4 {
            fill:#340f61
        }
        .fil7 {
            fill:#3a116d
        }
        .fil5 {
            fill:#3d1273
        }
        .fil6 {
            fill:#5b1aaa
        }
        .fil8 {
            fill:#5c1aae
        }
    }
</style>
