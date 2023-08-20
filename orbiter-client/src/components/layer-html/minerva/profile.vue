<template>
    <div>
        <span v-on:click="refreshData" class="refresh" alt="Refresh" title="Refresh">&#x21bb;</span>

        <div v-if="haveAvatar" class="title">Commander {{ avatar.name }}</div>
        <div v-if="haveAvatar">Credits {{ avatar.credits }}</div>
        <div v-if="haveAvatar">Cargo {{ avatar.ship.equipment }} | {{ avatar.ship.fuel }} | {{ avatar.ship.organics }}</div>
        <div>
        Eth Address: {{ account }}
        </div>
        <div v-if="currentStarSystemId > 0"><span>Currently in Sector:
          <b>{{ currentStarSystemId }}</b> {{ currentStarSystemName }}</span></div>
        <hr>
        <b>x:</b> {{ parseFloat(viewport.x).toFixed(3) }}
        <b>y:</b> {{ parseFloat(viewport.y).toFixed(3) }}
        <b>r:</b> {{ parseFloat(viewport.rotation).toFixed(3) }}
        <b>z:</b> {{ parseFloat(viewport.scale).toFixed(3) }}
        <hr>
        Selected Sprite: {{ selected }}<br>
        My Ship ID: {{ myShipId }}
        <hr>
        Time Delta: {{ timeDelta }}<br>
        Tick Delay: {{ tickDelay }}<br>
        FPS: {{ (1000 / timeDelta).toFixed(3) }}<br>
        View: <span v-if="this.viewRatio <= 1">Portrait</span><span v-else>Landscape</span>
        ({{ this.viewport.width }} x {{ this.viewport.height }} @ {{ this.viewRatio }})
        <hr>
        Neighbors:
        <div v-for="(neighbor, index) in neighbors" v-bind:key="index" class="jump">
          <a v-on:click.prevent="move(neighbor.id)" href="" v-if="neighbor.id > 0">{{ neighbor.name }} ({{ neighbor.id }})</a><br>
        </div><br>
        There are <b>{{ gameState.avatarCount }}</b> total avatars and
        <b>{{ gameState.systemCount }}</b> known star systems.
    </div>
</template>

<script>
import { mapGetters, mapActions, mapMutations } from 'vuex'

export default {
  name: 'profile',
  data () {
    return {
    }
  },
  computed: {
    ...mapGetters([
      'account'
    ]),
    ...mapGetters('UI', [
      'viewport',
      'selected',
      'viewRatio'
    ]),
    ...mapGetters('Config', [
      'tickDelay'
    ]),
    ...mapGetters('GameState', [
      'haveAvatar',
      'gameState',
      'avatar'
    ]),
    ...mapGetters('StarMap', [
      'currentStarSystemId',
      'gameTime',
      'timeDelta',
      'neighbors',
      'myShipId',
      'currentStarSystemName'
    ]),
  },
  methods: {
    ...mapMutations('UI', [
      'viewTo',
      'scaleTo'
    ]),
    ...mapActions('GameState', [
      'loadGameState',
      'moveToSystem',
    ]),
    ...mapActions('StarMap', [
      'loadStarMap'
    ]),
    refreshData () {
      this.loadGameState()
      this.loadStarMap()
    },
    move (system) {
      this.moveToSystem(system)
      this.scaleTo(400)
      this.viewTo({x: 0, y: 0})
    }
  },
  watch: {
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
  div.title {
    margin: 0.2em 0;
    font-size: 1.5em;
    color: #fff;
  }
  span.refresh {
    float: right;
    margin: 0em 1em 0em 2em;
    font-size: 1.5em;
  }
  span.jump a {
    text-decoration: none;
    margin: 0.1em 0;
    padding: 0.2em;
  }
  span.jump a:hover {
    text-decoration: underline;
    color: #fff;
  }
</style>
