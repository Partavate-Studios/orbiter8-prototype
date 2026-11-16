<template>
  <!-- Help, from the HUD's "?" button: a new pilot's first steps, ticked off as they're done (yellow:
       yours), and the tech tree. Slides up like every other menu. -->
  <g>
    <menu-container>
      <g :transform="'translate(0 -400) scale(' + scale + ')'" fill="#ffffff" dominant-baseline="middle">
        <text x="0" y="5" text-anchor="middle" fill="#ffffff88" font-size="1.5em">First Steps</text>
        <g v-for="(step, i) in steps" :key="i" :transform="'translate(0 ' + (52 + i * ROW) + ')'">
          <rect x="-180" y="-14" width="360" :height="ROW - 8" rx="4" fill="#2e0d56" stroke="#ffffff22" />
          <g transform="translate(-155 4)">
            <circle r="11" :fill="step.done ? YELLOW_LIGHT : 'none'" :stroke="step.done ? YELLOW_LIGHT : '#ffffff88'" />
            <path v-if="step.done" d="M -5 0 L -1.5 4 L 5.5 -4" fill="none" stroke="#2e0d56" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
            <text v-else text-anchor="middle" y="1" font-size="0.8em" fill="#ffffffcc">{{ i + 1 }}</text>
          </g>
          <text x="-130" y="0" font-size="0.9em" :fill="step.done ? '#ffffff88' : '#ffffff'">{{ step.title }}</text>
          <text
            v-for="(line, j) in step.lines"
            :key="j"
            x="-130"
            :y="19 + j * 16"
            font-size="0.75em"
            :fill="step.done ? '#ffffff55' : '#ffffffaa'"
            >{{ line }}</text
          >
        </g>
        <text :y="58 + steps.length * ROW" x="0" text-anchor="middle" font-size="0.8em" fill="#ffffff88">
          {{ left ? left + (left === 1 ? ' step' : ' steps') + ' to go.' : 'All done. Fly well, pilot.' }}
        </text>
        <g :transform="'translate(0 ' + (100 + steps.length * ROW) + ')'">
          <menu-button text="How Planets Grow" @buttonclick="openTechTree" />
        </g>
      </g>
    </menu-container>
  </g>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import { useUIStore } from '@/stores/ui'
import { usePlayerStore } from '@/stores/player'
import { firstSteps } from '@/libs/first-steps'
import { YELLOW_LIGHT } from '@/libs/palette'
import MenuContainer from './menu-container/_menu-container.svg'
import MenuButton from './menu-button.svg'

export default {
  name: 'HelpMenu',
  components: { MenuContainer, MenuButton },
  data() {
    return { player: usePlayerStore(), YELLOW_LIGHT, ROW: 66 }
  },
  computed: {
    ...mapState(useUIStore, ['viewport']),
    scale() {
      const width = Math.min(this.viewport.width - 60, 700)
      return Math.min(width > 450 ? 1.5 : 1, (this.viewport.height - 160) / 520)
    },
    steps() {
      return firstSteps(this.player)
    },
    left() {
      return this.steps.filter((s) => !s.done).length
    }
  },
  methods: {
    ...mapActions(useUIStore, ['closeMenu']),
    openTechTree() {
      this.closeMenu()
      useUIStore().techTreeOpen = true
    }
  }
}
</script>
