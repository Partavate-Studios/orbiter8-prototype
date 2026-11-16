<template>
  <div>
    <span class="refresh" alt="Refresh" title="Refresh" @click="refreshData">&#x21bb;</span>

    <div v-if="haveAvatar" class="title">Commander {{ avatar.name }}</div>
    <div v-if="haveAvatar">Credits {{ avatar.credits }}</div>
    <div v-if="haveAvatar">Cargo {{ (avatar.ship.cargo ?? []).join(' | ') }}</div>
    <div>Eth Address: {{ account }}</div>
    <div v-if="currentStarSystemId !== null">
      <span
        >Currently in Sector: <b>{{ currentStarSystemId }}</b> {{ currentStarSystemName }}</span
      >
    </div>
    <hr />
    <b>x:</b> {{ parseFloat(viewport.x).toFixed(3) }} <b>y:</b> {{ parseFloat(viewport.y).toFixed(3) }} <b>r:</b>
    {{ parseFloat(viewport.rotation).toFixed(3) }} <b>z:</b> {{ parseFloat(viewport.scale).toFixed(3) }}
    <hr />
    Selected Sprite: {{ selected }}<br />
    My Ship ID: {{ myShipId }}
    <hr />
    Time Delta: {{ timeDelta }}<br />
    Tick Delay: {{ tickDelay }}<br />
    FPS: {{ (1000 / timeDelta).toFixed(3) }}<br />
    View: <span v-if="viewRatio <= 1">Portrait</span><span v-else>Landscape</span> ({{ viewport.width }} x
    {{ viewport.height }} @ {{ viewRatio }})
    <hr />
    Neighbors:
    <div v-for="(neighbor, index) in neighbors" :key="index" class="jump">
      <a v-if="neighbor.exists" href="" @click.prevent="move(neighbor.id)">{{ neighbor.name }} ({{ neighbor.id }})</a
      ><br />
    </div>
    <br />
    There are <b>{{ gameState.avatarCount }}</b> pilots and <b>{{ gameState.starSystemCount }}</b> known star
    systems.
  </div>
</template>

<script>
import { useChainStore } from '@/stores/chain'
import { useGameStateStore } from '@/stores/gamestate'
import { useStarMapStore } from '@/stores/starmap'
import { useUIStore } from '@/stores/ui'
import { mapActions, mapState } from 'pinia'
import { useConfigStore } from '@/stores/config'

export default {
  name: 'Profile',
  computed: {
    ...mapState(useChainStore, ['account']),
    ...mapState(useUIStore, ['viewport', 'selected', 'viewRatio']),
    ...mapState(useConfigStore, ['tickDelay']),
    ...mapState(useGameStateStore, ['haveAvatar', 'gameState', 'avatar']),
    ...mapState(useStarMapStore, ['currentStarSystemId', 'timeDelta', 'neighbors', 'myShipId', 'currentStarSystemName'])
  },
  methods: {
    ...mapActions(useUIStore, ['viewTo', 'scaleTo']),
    ...mapActions(useGameStateStore, ['loadGameState', 'moveToSystem']),
    ...mapActions(useStarMapStore, ['loadStarMap']),
    refreshData() {
      this.loadGameState()
      this.loadStarMap()
    },
    move(system) {
      this.moveToSystem(system)
      this.scaleTo(400)
      this.viewTo({ x: 0, y: 0 })
    }
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
