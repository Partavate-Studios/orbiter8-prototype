<template>
  <g>
    <!-- The background and star streaks are drawn on canvas (background-canvas.vue). -->
    <g transform="translate(0 -100)">
      <g v-if="!stall || stall.visible" :transform="stall ? stall.transform : shipTransform">
        <g transform="scale(15) rotate(90)">
          <ship />
        </g>
        <g transform="rotate(180)" :opacity="stall ? stall.flames : 1">
          <rect x="35" y="-40" width="1000" height="80" ry="80" rx="80" stroke-width="0" fill="url(#starStreak)" />
          <rect x="25" y="-89" width="1000" height="40" ry="80" rx="80" stroke-width="0" fill="url(#starStreak)" />
          <rect x="25" y="49" width="1000" height="40" ry="80" rx="80" stroke-width="0" fill="url(#starStreak)" />
        </g>
      </g>
    </g>

    <!-- A sent jump that failed: the ship stalls out (above); say why below it, where the
         travel text was, with a way back right away. -->
    <g v-if="stall" text-anchor="middle">
      <text x="0" y="240" font-size="2.4em" fill="#ffffffdd" alignment-baseline="central">
        The jump didn't go through
      </text>
      <text x="0" y="285" font-size="0.9em" fill="#ffffff88" alignment-baseline="central">
        {{ stallReason }}
      </text>
      <g transform="translate(0 335)">
        <menu-button :text="'Return to ' + currentStarSystemName" @buttonclick="recover" />
      </g>
    </g>

    <text
      v-if="!stall"
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
      v-if="!stall"
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
      v-if="!stall"
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
import { mapActions, mapState } from 'pinia'
import { useStarMapStore } from '@/stores/starmap'
import { useUIStore } from '@/stores/ui'
import Ship from '../sprites/ship.svg'
import MenuButton from './menus/menu-button.svg'

// A stalled ship slides off the left of the screen over STALL_SLIDE_MS, spinning faster and faster
// (STALL_SPIN turns in all) and shrinking to STALL_SCALE.
const STALL_SLIDE_MS = 3000
const STALL_SPIN = 3
const STALL_SCALE = 0.3
const STALL_FLAMES_MS = 450

export default {
  name: 'JumpAnimation',
  components: {
    Ship,
    MenuButton
  },
  data() {
    return {
      loreTip: '',
      starSpeed: 25
    }
  },
  computed: {
    ...mapState(useStarMapStore, ['gameTime', 'currentStarSystemName']),
    ...mapState(useUIStore, ['jumpStall', 'leftMostX']),
    /** The stalled ship's extra motion, `null` while the jump is going fine (re-evaluated every frame via gameTime). */
    stall() {
      if (!this.jumpStall) return null
      const elapsed = Math.max(0, this.gameTime - this.jumpStall.at)
      const t = Math.min(1, elapsed / STALL_SLIDE_MS)
      // Falls behind, faster and faster, until it's past the left edge (the ship is ~250 units long).
      const x = (this.leftMostX - 250) * t * t
      const spin = STALL_SPIN * 360 * t * t
      const scale = 1 - (1 - STALL_SCALE) * t
      return {
        transform: `translate(${x.toFixed(1)} 0) ${this.shipTransform} rotate(${spin.toFixed(1)}) scale(${scale.toFixed(3)})`,
        // The engines cut out first.
        flames: Math.max(0, 1 - elapsed / STALL_FLAMES_MS),
        visible: t < 1
      }
    },
    /** The failure reason, kept to a line. */
    stallReason() {
      const reason = this.jumpStall?.reason ?? ''
      return reason.length > 110 ? reason.slice(0, 107) + '…' : reason
    },
    // Where the streak cycle is; the ship bobs in time with it.
    rightSlideX() {
      return ((this.starSpeed * this.gameTime) / 10 + 5000) % 10000
    },
    shipTransform() {
      return (
        'scale(' +
        (2 + Math.sin(this.rightSlideX / 1000) / 50) +
        ') translate(' +
        Math.sin(this.rightSlideX / 300) +
        ' ' +
        Math.sin(this.rightSlideX / 200 + 0.5) +
        ')'
      )
    }
  },
  mounted: function () {
    this.loreTip = this.randomLoreTip()
  },
  methods: {
    ...mapActions(useUIStore, ['jumpRecover']),
    recover() {
      this.o8audio.playEffect('click')
      this.jumpRecover()
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
        'Minerva keeps the books. Every claim, every name, every siege: filed, stamped, and on the record forever.',
        'Black holes come in pairs. Fly into one and you come out of its partner, somewhere in the dark between the arms. Probably. It has always been fine so far.',
        'A long-range scan takes about thirty seconds. Space is big. The sensors are doing their best.',
        'Nobody has ever lost an Orbiter 8. Beaten up, out of range, limping back to a shipyard, sure. Lost, never.',
        'Colonists travel a hundred to a hold. They say it is cosy.',
        'Railguns punch through armor, missiles through shields, and drones chew up point defense. Bring the right tool. Bring all three if you can afford it.',
        'Sol belongs to the Federation. Its planets are not for sale and not for siege, and the Federation would rather you did not ask.'
      ]
      return tips[parseInt(Math.random() * tips.length)]
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss"></style>
