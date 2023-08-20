<template>
  <div class="signup">
    <div>
      <ship-scene :warmingUp="warmingUp" />

      <div  v-if="step == 1">
      <p>The time has come to conquer the stars.</p>
      <p>This Is Your New Starship, <span class="light">{{ gameState.avatar.name }}</span></p>
      <p>What will you name your new Orbiter 8?</p>
      <p class="name">
        <input name="name" v-model="newShipName" @keydown="keydown_check">
      </p>
      <p class="next">
        <span class="button" @click="launch" name="signup">Take Off &#10143;</span>
      </p>
      </div>
      <div v-if="step == 2">
      <p>Warming up <span class="light">{{ newShipName }}</span>'s engines!</p>
      <p>Once the transaction completes we are clear for launch.</p>
      </div>
    </div>
  </div>
</template>

<script>
import ShipScene from './_ship-scene.vue'
import { mapActions, mapGetters } from 'vuex'

export default {
  components: {
    ShipScene
  },
  name: 'launch',
  data () {
    return {
      newShipName: '',
      done: false,
      step: 1
    }
  },
  methods: {
    ...mapActions('GameState', [
      'launchShip'
    ]),
    async launch () {
      if (this.newShipName.length === 0) {
        alert('You should enter a name')
      } else {
        this.step++
        await this.launchShip(this.newShipName)
      }
    },
    next () {
      this.step++
    },
    keydown_check (event) {
      if (event.which === 13) {
        this.launch()
      }
    }
  },
  computed: {
    ...mapGetters('GameState', [
      'gameState'
    ]),
    warmingUp () {
      if(this.step > 1) {
        return true
      }
      return false
    }
  }
}
</script>

<style scoped lang="scss">
  div.signup {
    margin: 0em auto;
    text-align: left;
    max-width: 30em;
    overflow: hidden;
  }
  input {
    background-color: #00000020;
    border: 1px solid #ffffff80;
    border-radius: 0.5em;
    color: #fff;
    padding: 0.15em;
    text-align: center;
    margin: 0 auto;
    font-size: 1.2em;
    outline: 0;
    max-width: 95%;
  }
  p.name {
    text-align: center;
  }
  p.next {
    padding: 0.5em;
    text-align: center;
  }
  .light {
    color: #ffffff;
  }

</style>
