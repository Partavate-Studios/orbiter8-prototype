<template>
  <g v-if="objectId != null">
    <card-background />
    <g>
      <g v-for="(option, key) in menuData" :key="'option-' + key">
        <g :transform="'translate(-65 ' + (-65 + (17 * key)) + ')'">
          <card-button
            :text="option.text"
            v-on:buttonclick="buttonAction(option)"
            :enabled="option.enabled" />
        </g>
      </g>
    </g>
  </g>
</template>

<script>

import { mapGetters, mapActions, mapMutations } from 'vuex'
import CardBackground from '../card-background.svg'
import CardButton from '../card-button.svg'

export default {
  name: 'MainMenu',
  components: {
      CardBackground,
      CardButton
  },
  props: {
    objectId: null,
    menuShowing: null
  },
  data () {
    return {
      currentItem: null
    }
  },
  methods: {
    buttonAction (option) {
      console.log('button pressed')
      this.o8audio.playEffect('click')
      if ((this.systemObjects[this.objectId].type !== 'ship')) {
      //  this.changeMyShipOrbit(this.objectId)
      }
      switch (option.command) {
        case 'build':
          switch (this.systemObjects[this.objectId].type) {
            case 'planet':
              alert('In Demo 3, you will be able to build factories on planets. You will first need raw materials and coloinists. You will also be able to build orbiting space ports.')
              break
            case 'moon':
              alert('In Demo 4, you will be able to build defences on your moons.')
              break
          }
          break
        case 'trade':
          this.openMenu('trade')
          break
        case 'shipyards':
          this.openMenu('shipyard')
          break
        case 'upgrade':
          alert('Once built, ports will be upgradable to expand commerce.')
          break
        case 'transfer':
          alert('When this feature is enabled, to build on the planet surface you will first need to drop off enough materials and colonists. Once prouction begins, you will be able to pick up newly manufactured goods.')
          break
        case 'jump':
          this.jumpMenuOn()
          break
        case 'opensea':
          if (this.chainId == 4) {
            window.open("https://testnets.opensea.io/assets/" + this.planetTokenAddress + '/' + this.systemObjects[this.objectId].id)
          } else if (this.chainId == 80001) {
            window.open("https://testnets.opensea.io/assets/mumbai/" + this.planetTokenAddress + '/' + this.systemObjects[this.objectId].id)
          } else if (this.chainId == 97) {
            window.open("https://testnets.opensea.io/assets/bsctestnet/" + this.planetTokenAddress + '/' + this.systemObjects[this.objectId].id)
          } else {
            alert('openSea not supported for this network')
          }
          break
        case 'claim':
          if (confirm('Claim planet #' + option.value + ' as your own?')) {
            let name = prompt('What will you name your planet:', '')
            if (name !== null && name !== '') {
             this.claimPlanet({planetId: option.value, name: name})
            }
          }
          break
        case 'buildStation':
          if (this.avatar.credits > 10000) {
            let name = prompt('It cost 10,000 credits to build a space station. You will have ' + (this.avatar.credits - 10000).toLocaleString("en-US") + ' credits remaining. What will you name your station:', '')
            if (name !== null && name !== '') {
              this.buildStation({planetId: option.value, name: name})
            }
          } else {
            alert("You need 10,000 credits to build a space station. You are " + (10000 - this.avatar.credits).toLocaleString("en-US") + " credits short. Try trading at more space ports.")
          }
          break
        case 'visitStation':
          this.selectSprite(this.systemObjects[this.objectId].stationSprite)
          break
        case 'visitPlanet':
          this.selectSprite(this.systemObjects[this.objectId].orbiting)
          break
        case 'visitMoon':
          this.$emit('moon-menu')
          break
        case 'attack':
          alert('Attacking: You won\'t be able to attack anything until demo 4.')
          break
        case 'close':
          this.$emit('closeMenu')
          break
        case 'rename': {
          let name = prompt('New ' + this.systemObjects[this.objectId].type + ' name:', '')
          let type = this.systemObjects[this.objectId].type
          let objectId = this.systemObjects[this.objectId].objectId
          let parentId
          if ((type == 'moon') || (type == 'station')) {
            parentId = this.systemObjects[this.objectId].planet
          }
          if (name !== null && name !== '') {
            this.renameAsset({'objectId': objectId, parentId: parentId, 'name': name, 'type': type})
          }
          break
        }
      }
    },
    ...mapActions('GameState', [
      'claimPlanet',
      'buildStation',
      'renameAsset'
    ]),
    ...mapMutations('UI', [
      'jumpMenuOn',
      'scaleTo',
      'openMenu',
      'selectSprite'
    ])
  },
  computed: {
    ...mapGetters([
      'account',
      'chainId',
      'planetTokenAddress',
    ]),
    ...mapGetters('StarMap', [
      'systemObjects'
    ]),
    ...mapGetters('GameState', [
      'avatar'
    ]),
    menuData: function () {
      let menu = this.systemObjects[this.objectId].getMenu()
      return menu
    }
  }
}
</script>

<style lang="scss">
</style>
