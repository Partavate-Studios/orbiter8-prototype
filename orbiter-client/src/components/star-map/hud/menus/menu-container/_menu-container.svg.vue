<template>
  <g>
    <g id="tacoman" :transform="'translate(' + 0 + ' ' + offset + ')'">
      <rect
        :x="leftMostX"
        :y="topMostY"
        :width="viewport.width"
        :height="viewport.height"
        fill="#ffffff00"
        @click.prevent="setMenuToClose()"
      />

      <menu-background />

      <slot />

      <g :transform="'translate(' + 0 + ' ' + (bottomMostY - 50) + ') scale(0.75)'">
        <a cursor="pointer" @click.prevent="setMenuToClose()">
          <close-button />
        </a>
      </g>
    </g>
  </g>
</template>

<script>
import { useStarMapStore } from '@/stores/starmap'
import { mapActions, mapState } from 'pinia'
import { useUIStore } from '@/stores/ui'
import CloseButton from './close-button.svg'
import MenuBackground from './menu-background.svg'
import Tween from '@/libs/tween'
import { computed } from 'vue'
import { menuTheme } from '@/libs/card-theme'

export default {
  name: 'MenuContainer',
  components: {
    CloseButton,
    MenuBackground
  },
  // The menu's colors for everything inside it (libs/card-theme.js menuTheme): its frame, close
  // button and buttons.
  provide() {
    return { menuTheme: computed(() => this.theme) }
  },
  data() {
    return {
      timeToAnimate: 200,
      offset: 0,
      slideIn: null,
      slideOut: null
    }
  },
  computed: {
    ...mapState(useUIStore, ['leftMostX', 'topMostY', 'bottomMostY', 'viewport']),
    ...mapState(useStarMapStore, ['gameTime']),
    theme() {
      const ui = useUIStore()
      const open = Object.entries(ui.hud.menuState).find(([, on]) => on)?.[0]?.replace(/Menu$/, '')
      return menuTheme(open, useStarMapStore().systemObjects[ui.selected])
    }
  },
  watch: {
    gameTime: function (newTime) {
      if (this.slideIn != null) {
        this.offset = this.slideIn.valueAt(newTime)
        if (this.slideIn.isDone(newTime)) {
          this.slideIn = null
        }
      }
      if (this.slideOut != null) {
        this.offset = this.slideOut.valueAt(newTime)
        if (this.slideOut.isDone(newTime)) {
          this.slideOut = null
          this.closeMenu()
        }
      }
    }
  },
  created() {
    this.offset = this.viewport.height
    this.slideIn = new Tween(this.viewport.height, 0, this.timeToAnimate)
  },
  methods: {
    ...mapActions(useUIStore, ['closeMenu']),
    setMenuToClose() {
      this.o8audio.playEffect('click')
      this.slideOut = new Tween(0, this.viewport.height, this.timeToAnimate)
    }
  }
}
</script>
