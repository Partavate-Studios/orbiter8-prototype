<template>
  <g>
    <!-- The background and star streaks are drawn on canvas (background-canvas.vue). -->
    <g transform="translate(0 -100)">
      <g :transform="getShipTranslate()">
        <g transform="scale(15) rotate(90)">
          <ship />
        </g>
        <g transform="rotate(180)">
          <rect x="35" y="-40" width="1000" height="80" ry="80" rx="80" stroke-width="0" fill="url(#starStreak)" />
          <rect x="25" y="-89" width="1000" height="40" ry="80" rx="80" stroke-width="0" fill="url(#starStreak)" />
          <rect x="25" y="49" width="1000" height="40" ry="80" rx="80" stroke-width="0" fill="url(#starStreak)" />
        </g>
      </g>
    </g>

    <text
      x="0"
      y="250"
      font-size="3em"
      fill="#ffffffaa"
      stroke-width="0"
      text-anchor="middle"
      alignment-baseline="central"
      >Traveling to a new star system... brb
    </text>

    <text
      x="0"
      y="300"
      font-size="1em"
      fill="#ffffffaa"
      stroke-width="0"
      text-anchor="middle"
      alignment-baseline="central"
      >While the client is waiting for the transaction to complete, did you know:
    </text>
    <text
      x="0"
      y="320"
      font-size="1em"
      fill="#ffffffaa"
      stroke-width="0"
      text-anchor="middle"
      alignment-baseline="central"
    >
      {{ loreTip }}
    </text>
  </g>
</template>

<script>
import { mapState } from 'pinia'
import { useStarMapStore } from '@/stores/starmap'
import Ship from '../sprites/ship.svg'

export default {
  name: 'JumpAnimation',
  data() {
    return {
      loreTip: '',
      starSpeed: 25
    }
  },
  components: {
    Ship
  },
  mounted: function () {
    this.loreTip = this.randomLoreTip()
  },
  computed: {
    ...mapState(useStarMapStore, ['gameTime']),
    // Where the streak cycle is; the ship bobs in time with it.
    rightSlideX() {
      return ((this.starSpeed * this.gameTime) / 10 + 5000) % 10000
    }
  },
  methods: {
    getShipTranslate() {
      return (
        'scale(' +
        (2 + Math.sin(this.rightSlideX / 1000) / 50) +
        ') translate(' +
        Math.sin(this.rightSlideX / 300) +
        ' ' +
        Math.sin(this.rightSlideX / 200 + 0.5) +
        ')'
      )
    },
    randomLoreTip() {
      let tips = [
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
      return tips[parseInt(Math.random() * tips.length)]
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss"></style>
