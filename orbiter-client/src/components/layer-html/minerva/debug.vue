<template>
    <div>
    <div class="name">UI Debug:</div>
    <hr>
    <div style="">
        <table>
        <tbody>
        <tr>
            <th style="cursor: pointer; text-align:right" v-on:click="toggleGraphicsQuality">Graphics:</th>
            <td v-if="graphicsQuality == 1">Efficiency</td>
            <td v-else-if="graphicsQuality == 2">Balanced</td>
            <td v-else>Luxury</td>
        </tr>
        <tr>
            <th style="text-align:right">Translate:</th>
            <td>{{ parseInt(viewport.x) }}, {{ parseInt(viewport.y) }}<br></td>
        </tr>
        <tr>
            <th style="text-align:right">Screen:</th>
            <td>x: {{ viewport.width }}<br>y: {{ viewport.height }}<br></td>
        </tr>
        <tr>
            <th style="text-align:right">Mouse Actual:</th>
            <td>x: {{ screenSize.mouse.x }}<br>y: {{ screenSize.mouse.y }}<br></td>
        </tr>
        <tr>
            <th style="text-align:right">Mouse From Center</th>
            <td>x: {{ parseInt(screenSize.xFromCenter) }}<br>
                y: {{ parseInt(screenSize.yFromCenter) }}</td>
        </tr>
        <tr>
            <th style="text-align:right">scale:</th>
            <td>{{ viewport.scale }}</td>
        </tr>
        <tr>
            <th style="text-align:right">rotation:</th>
            <td>{{ parseInt(viewport.rotation) }}</td>
        </tr>
        <tr>
            <th style="text-align:right">selected:</th>
            <td >{{ selected }}</td>
        </tr>
        </tbody>
        </table>
    </div>
    </div>
</template>

<script>
import { useUIStore } from '@/stores/ui'
import { mapActions, mapState } from 'pinia'
import { useConfigStore } from '@/stores/config'

export default {
  name: 'Debug',
  computed: {
    ...mapState(useUIStore, [
      'viewport',
      'screenSize',
      'selected'
    ]),
    ...mapState(useConfigStore, [
      'graphicsQuality'
    ])
  },
  methods: {
    ...mapActions(useConfigStore, [
      'toggleGraphicsQuality'
    ])
  },
  watch: {
    viewport: {
      handler: function () {
      },
      deep: true
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
  div.name {
    text-align: center;
    margin: 0.2em;
    font-size: 1.5em;
    color: #fff;
  }
  hr {
    border: 0;
    border-top: 2px solid #18062e;
    border-bottom: 1px solid #591ea0;
  }
</style>
