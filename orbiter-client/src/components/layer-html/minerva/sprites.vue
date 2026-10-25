<template>
    <table class="sprites">
        <tr>
          <th align="center" colspan="2">ID</th>
          <th align="center">Name</th>
          <th align="center">Mine</th>
        </tr>
        <tr
          v-for="(sprite, index) in systemObjects"
          class="line"
          :class="{selected : sprite.selected}"
          v-bind:key="'line' + index"
          v-on:click="selectObject(index)">
          <td align="right">
            <small>{{ sprite.type }}</small>
          </td>
          <td align="left">
            <small>{{ index }}</small>
          </td>
          <td><small>{{ sprite.name }}</small></td>
          <td align="right">
            <div v-if="sprite.isMine">*</div>
          </td>
        </tr>
    </table>
</template>

<script>
import { useStarMapStore } from '@/stores/starmap'
import { mapActions, mapState } from 'pinia'
import { useUIStore } from '@/stores/ui'

export default {
  name: 'Sprites',
  data () {
    return {
    }
  },
  mounted: function () {
  },
  beforeMount: function () {
  },
  computed: {
    ...mapState(useStarMapStore, [
      'systemObjects'
    ])
  },
  watch: {
    sprites: {
    }
  },
  methods: {
    ...mapActions(useUIStore, [
      'selectSprite'
    ]),
    selectObject: function (index) {
      this.selectSprite(index)
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
  table.sprites {
    border-collapse: collapse;
    width: 100%;
    margin: 0;
    padding: 0.2em;
    td {
      margin: 0;
      padding: 0.1em;
    }
    tr {
      margin: 0;
      padding: 0;
    }
    tr:hover{
      background: #ffffff20;
      cursor: pointer;
    }
    tr.selected {
      background: #00000030;
    }
    th {
      border-bottom: 1px solid #ffffff40
    }
    .rightPadded {
      text-align:right;
      padding: 0 0.5em
    }
  }
</style>
