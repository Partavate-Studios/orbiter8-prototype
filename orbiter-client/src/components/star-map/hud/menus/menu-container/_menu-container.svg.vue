<template>
  <g>
    <g id="tacoman" :transform="'translate(' + 0 + ' ' + offset + ')'">

      <rect
        :x="leftMostX"
        :y="topMostY"
        :width="viewport.width"
        :height="viewport.height"
        v-on:click.prevent="setMenuToClose()"
        fill="#ffffff00" />

      <menu-background />

      <slot />

      <g :transform="'translate(' + 0 + ' ' + (bottomMostY - 50)  + ') scale(0.75)'">
        <a
          v-on:click.prevent="setMenuToClose()"
          cursor="pointer">
          <close-button  />
        </a>
      </g>
    </g>
  </g>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex'
import CloseButton from './close-button.svg'
import MenuBackground from './menu-background.svg'
import Rubber from '@/libs/rubber'

export default {
  name: 'MenuContainer',
  components: {
    CloseButton,
    MenuBackground
  },
  data () {
    return {
      padding: 25,
      timeToAnimate: 200,
      offset: 0,
      rubberIn: null,
      rubberOut: null
    }
  },
  computed: {
    ...mapGetters('UI', [
      'leftMostX',
      'rightMostX',
      'topMostY',
      'bottomMostY',
      'viewport'
    ]),
    ...mapGetters('StarMap', [
      'gameTime'
    ])
  },
  watch: {
    gameTime: function (newTime) {
      if (this.rubberIn != null) {
        this.offset = this.rubberIn.getRubber(newTime)
        if (this.rubberIn.rubberComplete(newTime)) {
          this.rubberIn = null
        }
      }
      if (this.rubberOut != null) {
        this.offset = this.rubberOut.getRubber(newTime)
        if (this.rubberOut.rubberComplete(newTime)) {
          this.rubberOut = null
          this.closeMenu()
        }
      }
    }
  },
  created () {
    console.log('creating menu')
    this.offset = this.viewport.height
    this.rubberIn = new Rubber(
      this.viewport.height,
      0,
      this.timeToAnimate
    )
  },
  methods: {
    ...mapMutations('UI', [
      'closeMenu'
    ]),
    setMenuToClose() {
      this.o8audio.playEffect('click')
      this.rubberOut =  new Rubber(
        0,
        this.viewport.height,
        this.timeToAnimate
      )
    }
  }
}
</script>
