<template>
  <!-- The public siege feed (Demo 4, D44): every siege started, joined, worn down, claimed and ended,
       newest first, from the Battle contract's events. Live ones in pink: they need someone. -->
  <g>
    <menu-container>
      <g :transform="'translate(0 -400) scale(' + scale + ')'" fill="#ffffff" dominant-baseline="middle">
        <text x="0" y="5" text-anchor="middle" fill="#ffffff88" font-size="1.5em">Siege Feed</text>
        <text v-if="!demo4.feed.length" x="0" y="50" text-anchor="middle" font-size="0.85em" fill="#ffffff88">
          Quiet across the galaxy. No sieges yet.
        </text>
        <g v-for="(e, i) in shown" :key="i" :transform="'translate(0 ' + (45 + i * 22) + ')'" font-size="0.8em">
          <rect x="-175" y="-10" width="350" height="20" rx="4" fill="#2e0d56" stroke="#ffffff22" />
          <text x="-165" y="0" :fill="e.event === 'SiegeEnded' ? '#c3b3da' : PINK_LIGHT">{{ words(e) }}</text>
        </g>
      </g>
    </menu-container>
  </g>
</template>

<script>
import { mapState } from 'pinia'
import { game } from '@/sdk/client'
import { useUIStore } from '@/stores/ui'
import { useStarMapStore } from '@/stores/starmap'
import { useDemo4Store } from '@/stores/demo4'
import { starTraits } from '@/sdk/v4/traits'
import { planetName } from '@/sdk/v4/system'
import { PINK_LIGHT } from '@/libs/palette'
import MenuContainer from './menu-container/_menu-container.svg'

export default {
  name: 'FeedMenu',
  components: { MenuContainer },
  data() {
    return { demo4: useDemo4Store(), PINK_LIGHT }
  },
  computed: {
    ...mapState(useUIStore, ['viewport']),
    scale() {
      const width = Math.min(this.viewport.width - 100, 700)
      return Math.min(width > 450 ? 1.5 : 1, (this.viewport.height - 160) / 520)
    },
    /** As many as fit, newest first. */
    shown() {
      return this.demo4.feed.slice(0, 20)
    }
  },
  methods: {
    place(planet) {
      // The owner's name when the planet is at this star; its derived name otherwise.
      const here = useStarMapStore().systemObjects['planet:' + planet]
      if (here) return here.name
      const cell = Math.floor(planet / 256)
      const state = game.demo4.state
      const star = state.names[cell] || starTraits(state.universe.seed, cell).name
      return planetName(star, cell, planet % 256)
    },
    who(address) {
      if (!address) return 'someone'
      return address === this.demo4.account ? 'You' : address.slice(0, 6) + '…'
    },
    words(e) {
      const where = this.place(e.planet)
      switch (e.event) {
        case 'SiegeStarted':
          return `${this.who(e.who)} laid siege to ${where}`
        case 'DefenderJoined':
          return `${this.who(e.who)} joined the defense of ${where}`
        case 'WornDown':
          return `${where} was worn down`
        case 'ClaimFiled':
          return `${this.who(e.who)} filed a claim on ${where}`
        case 'ClaimFailed':
          return `The claim on ${where} failed`
        default:
          return e.args[2] ? `${where} fell to ${this.who(e.who)}` : `The siege of ${where} ended`
      }
    }
  }
}
</script>
