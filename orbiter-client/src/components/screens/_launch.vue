<template>
  <div class="signup">
    <div>
      <h1>Create Ship</h1>
      <div  v-if="step == 1">
      <p><b>Welcome Aboard <span class="light">Captain {{ gameState.avatar.name }}</span></b></p>
      <p>You have successfully registered with the Minerva galactic database. The time
        has come to <span class="light">launch</span> your mission of conquer over the stars.</p>
      <p>What will you name your new Orbiter 8 star ship?</p>
      <p class="name">
          <input name="name" v-model="newShipName" @keydown="keydown_check">
      </p>
      <p class="next">
        <span class="button" @click="launch" name="signup">Take Off &#10143;</span>
      </p>
      </div>
      <div v-if="step == 2">
        <p>We've moving your ship to the launch pad now. Hang on...</p>
      </div>
    </div>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'

export default {
  components: {
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
    ])
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
