<template>
  <div class="playorbiter8">
    <star-map />
    <layer-html />
  </div>
</template>

<script>
import { mapGetters, mapMutations, mapActions } from 'vuex'
import starMap from '@/components/star-map/map'
import layerHtml from '@/components/layer-html/container-html'
import router from '@/router/router'
import Eases from '@/libs/eases.js'

export default {
  name: 'Play',
  components: {
    starMap,
    layerHtml
  },
  data () {
    return {
      sectorLastUsedForSprites: -1,
      sun: 0,
      pb: 1,
      sprites: [],
      eases: new Eases()
    }
  },
  computed: {
    ...mapGetters('GameState', [
      'gameState',
      'haveAvatar',
      'haveShip'
    ]),
    ...mapGetters('UI', [
      'viewport',
      'container',
      'selected',
      'jumpAnimationState'
    ]),
    ...mapGetters('StarMap', [
      'mapDataLoaded',
      'gameTime'
    ]),
    ...mapGetters('Config', [
      'tickDelay'
    ]),
  },
  watch: {
    jumpAnimationState: {
      handler: function (newval, oldval) {
        if (newval != oldval) {
          if(newval) {
            this.o8audio.playMusic('jump')
          } else {
            this.o8audio.playMusic('map')
          }
        }
      }
    }
  },
  methods: {
    screenshot () {
      let svgRoot = document.getElementById('gameSVG')
      let svgSource = svgRoot.outerHTML
      let svgDataUri = 'data:image/svg+xml;base64,' + btoa(svgSource)
      let downloadLink = document.createElement('a')
      downloadLink.href = svgDataUri

      let today = new Date();
      let date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
      let time = today.getHours() + "." + today.getMinutes() + "." + today.getSeconds();
      let dateTime = date+'_'+time;
      downloadLink.download = 'screenshot' + dateTime + '.svg'
      document.body.appendChild(downloadLink)
      downloadLink.click()
      document.body.removeChild(downloadLink)
    },
    ...mapActions([
      'checkForNewBlock'
    ]),
    ...mapActions('StarMap', [
      'loadStarMap'
    ]),
    ...mapMutations('StarMap', [
      'incrementGameTime'
    ]),
    ...mapMutations('Config', [
      'toggleMinerva',
      'toggleGraphicsQuality'
    ]),
    ...mapMutations('UI', [
      'viewportToTime',
      'moveUp',
      'moveDown',
      'moveLeft',
      'moveRight',
      'scaleBy',
      'mousewheelAnimateTo',
      'scaleTo',
      'rotateTo'
    ]),
    onWheel (event) {
      let scale = 1
      let time = 100
      if (event.deltaY < 0) {
        scale = 0.8
      } else {
        scale = 1.25
      }
      this.mousewheelAnimateTo(
        {
          scale: scale,
          time: time
        }
      )
    },
    handleKeyPress (event) {
      switch (event.key) {
        case '`':
          this.toggleMinerva()
          break
        case '~':
          this.toggleGraphicsQuality()
          break
        case '=':
          this.scaleBy(0.25)
          break
        case '-':
          this.scaleBy(4)
          break
        case '+':
          this.scaleBy(0.75)
          break
        case '_':
          this.scaleBy(1.25)
          break
        case 'ArrowRight':
          this.moveRight(1000)
          break
        case 'ArrowLeft':
          this.moveLeft(100)
          break
        case 'ArrowDown':
          this.moveDown(100)
          break
        case 'ArrowUp':
          this.moveUp(100)
          break
        case 'S':
          this.screenshot()
          break
      }
    },
    async tickWork () {
      this.incrementGameTime()
      this.viewportToTime(this.gameTime)
    },
    tick () {
      this.tickWork()
      setTimeout(this.tick, this.tickDelay)
    }
  },
  mounted () {
    this.o8audio.playMusic('map')
  },
  beforeCreate () {
  },
  destroyed () {
    window.removeEventListener('keyup', this.handleKeyPress)
    window.removeEventListener('wheel', this.onWheel)
  },
  created () {
    window.addEventListener('keyup', this.handleKeyPress)
    window.addEventListener('wheel', this.onWheel)
    console.log('checking for avatar')
    if (!this.haveAvatar || !this.haveShip) {
      router.push('/')
    }
    this.tick()
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>
  .playorbiter8 {
    user-select: none;
    width: 100%;
    height: 100%;
    display: block;
    position: absolute;
    top: 0;
    left: 0;
  }
</style>

<style lang="scss">
  a:focus {
    outline: none;
  }

  .is-dragging {
    cursor: grabbing;
  }
</style>
