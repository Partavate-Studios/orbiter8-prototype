<template>
    <div>
        <div id="logocontainer">
            <orbiter8logo width="80%"></orbiter8logo>
        <gameinfo />
        </div>

        <a class="button" href="#/play">
          Take Command of {{ gameState.avatar.ship.name }} &#10143;
        </a>




    </div>

</template>

<script>
import { mapGetters } from 'vuex'
import orbiter8logo from '@/components/assets/Orbiter8Logo.svg'
import gameinfo from '@/components/screens/_gameinfo'

export default {
  components: {
    gameinfo,
    orbiter8logo
  },
  name: 'ShipSelect',
  computed: {
    ...mapGetters('GameState', [
      'gameState'
    ]),
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
#logocontainer {
  svg {
    min-height: 15vh;
    max-height: 20vh;
  }
  margin-bottom: 2vh;
}
#ship {
    width: 32px;
    height: 32px;
    margin: 1px;
    float: left;
    perspective: 500px;
}
a.button {
  vertical-align: middle;
  line-height: 2.5em;

}
</style>
