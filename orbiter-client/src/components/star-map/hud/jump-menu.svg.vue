
<template>
  <g transform="">

    <a
      cursor="pointer"
      v-on:mouseover="hide=true"
      v-on:mouseleave="hide=false"
      v-on:click.prevent="close()">
      <circle cx="0" cy="0" r="65" stroke-width="4" fill="#ffffff00" stroke="none" />
    </a>
    <g v-if="hide">
      <circle cx="0" cy="0" r="65" stroke-width="1" fill="none" stroke="#ffffff88" stroke-dasharray="1 1" />
    </g>
    <g v-else>
      <circle cx="0" cy="0" r="70" stroke-width="4" fill="none" stroke="#ffffff44" stroke-dasharray="4 2" />
    </g>
    <g v-bind:class="{disabled: hide}">
      <g v-for="(neighbor, index) in neighbors" v-bind:key="index">
        <g v-if="(index == hover)" >
          <circle cx="0" cy="0" r="70" stroke-width="1" fill="none" stroke="#ffffff"/>
          <circle cx="0" cy="0" r="70" stroke-width="0" fill="url(#scopeFill)" />
          <text
            x="0" y="-8"
            font-size="0.8em"
            fill="#ffffff88"
            stroke-width="0"
            text-anchor="middle"
            alignment-baseline="central">Orbital Jump to
          </text>
          <text
            x="0" y="11"
            font-size="0.9em"
            fill="#ffffffaa"
            stroke-width="0"
            text-anchor="middle"
            alignment-baseline="central">{{ neighbor.name }}
          </text>
        </g>

        <g :transform="'rotate(' + index * 30 + ')'"  v-if="neighbor.id > 0">

          <g v-if="(index == hover)" stroke="#ffffff" stroke-width="1">
              <g transform="scale(2) translate(66 12) rotate(145)">
                <ship></ship>
              </g>
            <path d="M 0 -70 Q 70 -70 150 50" stroke="#ffffff" fill="none"/>
          </g>
          <g v-else stroke="#ffffff" stroke-width="2" stroke-dasharray="4 2" >
              <path d="M 0 -70 Q 70 -70 150 50" stroke="#ffffff44" fill="none"/>
          </g>

          <g :transform="'translate(165 65)'">
              <g :transform="'rotate(' + index * -30 + ')'">

              <a
                v-on:mouseover="hover = index"
                v-on:mouseout="hover = null"
                cursor="pointer"
                v-on:click.prevent="move(neighbor.id)"
              >
                <circle cx="0" cy="0" r="28" stroke-width="0" fill="url(#glowingGradient)" stroke="none" />
                <circle cx="0" cy="0" r="26" stroke-width="2" fill="url(#starGradient)" stroke="#ffffffaa" />
                <text
                  x="0" y="2"
                  font-size="1em"
                  fill="#00000088"
                  stroke="#00000044"
                  stroke-width="0.5"
                  text-anchor="middle"
                  v-bind:class="{ newStar: (neighbor.name == 'Unexplored Star') }"
                  dominant-baseline="middle">{{ neighbor.id }}
                </text>
              </a>
            </g>
          </g>
        </g>
      </g>
    </g>
  </g>

</template>

<script>
import { mapActions, mapMutations, mapGetters } from 'vuex'
import Ship from '../sprites/ship.svg'

export default {
  name: 'JumpMenu',
  data () {
    return {
      menuWidth: 0,
      menuHeight: 0,
      buttons: [],
      hover: null,
      hide: false
    }
  },
  components: {
    Ship
  },
  props: {
    menudata: {}
  },
  mounted: function () {
  },
  computed: {
    ...mapGetters('StarMap', [
      'neighbors'
    ]),
    starName () {
      if ((this.systemNeighborNames[this.hover]) && (this.systemNeighborNames[this.hover].length > 0)) {
        return this.systemNeighborNames[this.hover]
      }
      return 'Star System #' + this.hover
    }
  },
  methods: {
    ...mapActions('GameState', [
      'moveToSystem',
    ]),
    ...mapMutations('UI', [
      'scaleAnimateTo',
      'jumpMenuOff'
    ]),
    move (system) {
      this.jumpMenuOff()
      this.moveToSystem(system)
      this.scaleAnimateTo({scale: 400, time: 500})
    },
    close () {
      this.o8audio.playEffect('click')
      this.jumpMenuOff()
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
  .disabled {
    opacity: 0.1;
    transition: 0.2s linear all;
  }
  .newStar {
    font-size: 1.25em;
    font-weight: bold;
    color: #000;
    transition: 0.2s linear all;
  }
</style>
