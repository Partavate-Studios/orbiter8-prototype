<template>
  <div class="signup">
    <h1 class="light">Register For Flight Service</h1>

    <div v-if="step == 1">
        <div class="profile-pic">
        <svg
          viewBox="-32 -32 64 64"
          xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink" >
            <g transform="scale(1)">
              <ship-icon />
            </g>
          </svg>
        </div>
        <p><b>Greetings Pilot</b></p>
        <p>
          You have been recruited by the Cascadian Cyber Corp to command a new Orbiter 8 space craft.
        </p>
        <p>
          Your ongoing mission will be to explore the galactic frontier,
          liberate resources for the greater good,
          and profit.
        </p>
        <p>
          All new pilots must create a profile in the Minerva galactic database.
          Once registered, you will be granted flight clearance for the entire galaxy.
          Are you ready to register your call sign?
        </p>
        <p class="next">
        <span class="button" v-on:click="next">Yes, register my call sign! &#10143;</span>
        </p>
    </div>

    <div v-if="step == 2">
        <p><b>Minerva Galactic Registration</b></p>
        <pilot-id-card :pilotName="newAvatarName" />

        <p class="instructions">Enter your Call Sign.</p>
        <p class="name">
          <input name="name" v-model="newAvatarName" @keydown="keydown_check">
        </p>
        <p class="next">
        <span class="button" v-on:click="previous">&#8592;</span>
          <span class="button" @click="signup" name="signup">File My Registration &#10143;</span>
        </p>
    </div>
    <div v-if="step == 3">
      <p>Congrats, your registration paperwork is filed in the Minerva galactic
      database! When your <span class="light">registration goes through</span>, you should be prompted
      for the next step. It general takes an average of 10 to 20 seconds to
      process a request.</p>
    </div>

  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import PilotIdCard from './_pilot-id-card'
import ShipIcon from '../star-map/hud/icons/ship-icon.svg'

export default {
  components: {
    PilotIdCard,
    ShipIcon
  },
  name: 'signup',
  data () {
    return {
      newAvatarName: '',
      done: false,
      step: 1
    }
  },
  methods: {
    ...mapActions('GameState', [
      'createAvatar'
    ]),
    async signup () {
      if (this.newAvatarName.length === 0) {
        alert('You should enter a name')
      } else {
        this.step++
        await this.createAvatar(this.newAvatarName)
      }
    },
    next () {
      this.step++
    },
    previous () {
      this.step--
    },
    keydown_check (event) {
      if (event.which === 13) {
        this.signup()
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
    font-size: 1.2em;
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
  p.instructions {
    color: #ffffff;
    font-size: 0.9em;
    text-align: center;
  }
  .light {
    color: #ffffff;
  }
  .profile-pic {
      float: right;
      height: 128px;
      width: 128px;
      border: 1px solid #00000066;
      background: #ffffff22;
      padding: 0.1em;
      margin: 1em;
      border-radius: 4em;
  }
</style>
