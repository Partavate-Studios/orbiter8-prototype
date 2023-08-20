<template>

  <div v-if="playerReady" id="app">

    <div v-if="gameDataLoaded">
      <router-view/>
    </div>

    <div v-else>
      Loading...
    </div>

  </div>

  <div v-else>
    <network-select />
  </div>

</template>

<script>
import { mapGetters, mapActions,mapMutations } from 'vuex'
import NetworkSelect from '@/components/screens/NetworkSelect'
import router from '@/router/router'

export default {
  name: 'Orbiter8Game',
  components: {
    NetworkSelect
  },
  created: function () {
    this.initWeb3()
    if (router.currentRoute.path != '/') {
      router.push('/')
    }
  },
  computed: {
    ...mapGetters([
      'playerReady',
    ]),
    ...mapGetters('GameState', [
      'gameDataLoaded',
    ])
  },
  methods: {
    ...mapActions([
      'initWeb3',
    ]),
    ...mapMutations('Config', [
      'setGraphicsQuality'
    ])
  }
}
</script>

<style lang="scss">
  #app {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
  }
  body {
    @import url('https://fonts.googleapis.com/css?family=Ubuntu');
    font-family: 'Ubuntu', sans-serif;
    margin: 0;
    padding: 0;
    color: #c3b3da;
    background-size: cover;
    background: #310e5c;
  }
  a {
    color: #aaa;
  }
  .layer {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    overflow: hidden;
  }

  .button {
    display: inline-block;
    background: #ffffff90;
    color: #310e5c;
    border: 1px solid #c3b3da;
    padding: 0.5em 1.5em;
    margin: 0.5em 1em;
    border-radius: 0.75em;
    text-decoration: none;
  }
  .button:hover {
    background: #c3b3da;
    border: 1px solid #ffffff;
    cursor: pointer;
  }
  .btn-big {
    font-size: 2em;
    padding: 0.25em 0.75em;
    font-weight: bold;
    border-radius: 2em;
  }
</style>