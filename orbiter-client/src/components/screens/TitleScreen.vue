<template>
  <div class="hello layer">
      <div class="box">
        <div v-if="haveAvatar">
          <div v-if="haveShip">
            <ship-select />
          </div>
          <div v-else>
            <ship-create />
          </div>
        </div>
        <div v-else>
           <avatar-create />
        </div>
      </div>
  </div>
</template>

<script>
import { useChainStore } from '@/stores/chain'
import { useGameStateStore } from '@/stores/gamestate'
import { mapActions, mapState } from 'pinia'
import { useConfigStore } from '@/stores/config'
import AvatarCreate from '@/components/screens/AvatarCreate'
import ShipCreate from '@/components/screens/ShipCreate'
import ShipSelect from '@/components/screens/ShipSelect'

export default {
  components: {
    AvatarCreate,
    ShipCreate,
    ShipSelect
  },
  name: 'TitleScreen',
  data () {
    return {
      audio: null
    }
  },
  computed: {
    ...mapState(useGameStateStore, [
      'haveAvatar',
      'haveShip',
      'gameState'
    ]),
    ...mapState(useConfigStore, [
      'blockCheckDelay'
    ]),
  },
  methods: {
    ...mapActions(useChainStore, [
      'checkForNewBlock'
    ]),
    async checkBlockWork () {
      this.checkForNewBlock()
    },
    checkBlockLoop () {
      this.checkBlockWork()
      setTimeout(this.checkBlockLoop, this.blockCheckDelay)
    }
  },
  watch: {
    haveAvatar: {
      handler: function (val) {
        console.log('Avatar Changed: ', val)
      }
    }
  },
  created () {
    this.checkBlockLoop()
    this.o8audio.playMusic('title')
  },
  beforeUnmount () {
    this.o8audio.stopMusic()
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.box {
  color: 310e5c;
  margin: 1em;
  padding: 1em;
  min-width: 45%;
  max-width: 100%;
}
</style>
