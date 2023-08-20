
<template>
  <g>
    <rect x="-10000" y="-10000" width="20000" height="20000" fill="#280b4b" />
    <g :transform="getLeftTranslate()">
        <rect
        v-for="(star, key) in stars"
        :key="'star-' + key"
        :x="star.x"
        :y="star.y"
        width="500"
        height="8"
        ry="8"
        rx="8"
        stroke-width="0"
        fill="url(#starStreak)" />
    </g>
    <g :transform="getRightTranslate()">
        <rect
        v-for="(star, key) in stars"
        :key="'star-' + key"
        :x="star.x"
        :y="star.y"
        width="500"
        height="8"
        ry="8"
        rx="8"
        stroke-width="0"
        fill="url(#starStreak)" />
    </g>
    <g transform="scale(0.65)">
        <g :transform="getLeftTranslate()">
            <rect
            v-for="(star, key) in stars"
            :key="'star-' + key"
            :x="5000 - star.x"
            :y="star.y"
            width="500"
            height="8"
            ry="8"
            rx="8"
            stroke-width="0"
            fill="url(#starStreak)" />
        </g>
        <g :transform="getRightTranslate()">
            <rect
            v-for="(star, key) in stars"
            :key="'star-' + key"
            :x="5000 - star.x"
            :y="star.y"
            width="500"
            height="8"
            ry="8"
            rx="8"
            stroke-width="0"
            fill="url(#starStreak)" />
        </g>
    </g>
    <g transform="translate(0 -100)">
      <g :transform="getShipTranslate()">
        <g transform="scale(15) rotate(90)">
            <ship />
        </g>
        <g transform="rotate(180)">
            <rect
                x="35"
                y="-40"
                width="1000"
                height="80"
                ry="80"
                rx="80"
                stroke-width="0"
                fill="url(#starStreak)" />
            <rect
                x="25"
                y="-89"
                width="1000"
                height="40"
                ry="80"
                rx="80"
                stroke-width="0"
                fill="url(#starStreak)" />
            <rect
                x="25"
                y="49"
                width="1000"
                height="40"
                ry="80"
                rx="80"
                stroke-width="0"
                fill="url(#starStreak)" />
        </g>
      </g>
    </g>

    <text
        x="0" y="250"
        font-size="3em"
        fill="#ffffffaa"
        stroke-width="0"
        text-anchor="middle"
        alignment-baseline="central">Traveling to a new star system... brb
    </text>

    <text
        x="0" y="300"
        font-size="1em"
        fill="#ffffffaa"
        stroke-width="0"
        text-anchor="middle"
        alignment-baseline="central">While the client is waiting for the transaction to complete, did you know:
    </text>
    <text
        x="0" y="320"
        font-size="1em"
        fill="#ffffffaa"
        stroke-width="0"
        text-anchor="middle"
        alignment-baseline="central"> {{ know }}
    </text>
  </g>
</template>

<script>
import { mapGetters } from 'vuex'
import Ship from '../sprites/ship.svg'

export default {
  name: 'JumpAnimation',
  data () {
    return {
      starCount: 50,
      leftSlideX: 5000,
      rightSlideX: 0,
      stars: [],
      know: '',
      starSpeed: 25
    }
  },
  components: {
    Ship
  },
  props: {
  },
  mounted: function () {
    this.know = this.getRandomDidYouKnow()
    for (let i = 0; i < this.starCount; i++) {
      this.stars.push({
        x: Math.random() * 5000,
        y: Math.random() * 3000 - 1500
      })
      // console.log('added ' + JSON.stringify(this.stars[i]))
    }
    this.tick()
  },
  computed: {
    ...mapGetters('StarMap', [
      'gameTime'
    ]),
  },
  methods: {
    tickWork () {
      this.leftSlideX = (this.starSpeed * this.gameTime / 10) % 10000
      this.rightSlideX = (this.starSpeed * this.gameTime / 10 + 5000) % 10000
    },
    tick () {
      this.tickWork()
      setTimeout(this.tick, 16)
    },
    getLeftTranslate () {
      return 'translate(' + (2500 - this.leftSlideX) + ' 0)'
    },
    getRightTranslate () {
      return 'translate(' + (2500 - this.rightSlideX) + ' 0)'
    },
    getShipTranslate () {
      return 'scale(' + (2 + (Math.sin(this.rightSlideX / 1000) / 50)) + ') translate(' + Math.sin(this.rightSlideX / 300)  + ' ' + Math.sin(this.rightSlideX / 200 + 0.5) + ')'
    },
    getRandomDidYouKnow () {
      let knows = [
        'It is the year 2140, just a little more than a century after humans began off-world colonization.',
        'The Orbiter 8 is the first line of orbiter ships capable of interstellar travel, making it a true "Star Ship"',
        'As the initial surge of planetary colonization stalled into decades of vicious trade wars, a time known as The Great Regrettion began.',
        'In the early 2090’s a new line of gravity assist ships, known as "Orbiters", opened new trade routes to the outer worlds.',
        'Orbiter 8 is being lovingingly designed and developed by Partavate Studios.',
        'Every Orbiter 8 is created the same, but you will be able to invest in and upgrade your ship.',
        'When you claim a planet you also claim any orbiting moons. In addition to moons, you will be able to build a space port to orbit your planets.',
        'Not all stars offer the same gravity assist. Just because you can jump from one star to another does not mean you will be able to jump back the same way.',
        'Once claimed, you can rename a planet. Likewise, you can rename new stars you visit first.'
      ]
      return knows[parseInt(Math.random() * knows.length)]
    }
  },
  watch: {
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
</style>
