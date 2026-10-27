<template>
  <g v-if="objectId != null">
    <card-background />
    <g>
      <g v-for="(option, key) in menuData" :key="'option-' + key">
        <g :transform="'translate(-65 ' + (-65 + 17 * key) + ')'">
          <card-button :text="option.text" :enabled="option.enabled" @buttonclick="buttonAction(option)" />
        </g>
      </g>
    </g>
  </g>
</template>

<script>
import { useChainStore } from '@/stores/chain'
import { useGameStateStore } from '@/stores/gamestate'
import { useStarMapStore } from '@/stores/starmap'
import { mapActions, mapState } from 'pinia'
import { useUIStore } from '@/stores/ui'
import { useDialogStore } from '@/stores/dialog'
import { cardMenu } from './card-menu'
import { marketTokenUrl, networkFor } from '@/sdk/chain/networks'
import CardBackground from '../card-background.svg'
import CardButton from '../card-button.svg'

export default {
  name: 'MainMenu',
  components: {
    CardBackground,
    CardButton
  },
  props: {
    /** The selected object's key (see sdk/system.js objectKey). */
    objectId: { type: String, default: null }
  },
  emits: ['moon-menu'],
  computed: {
    ...mapState(useChainStore, ['chainId', 'planetTokenAddress', 'shipTokenAddress']),
    ...mapState(useStarMapStore, ['systemObjects']),
    ...mapState(useGameStateStore, ['avatar']),
    menuData: function () {
      return cardMenu(this.systemObjects[this.objectId], { marketName: networkFor(this.chainId)?.nftMarket?.name })
    }
  },
  methods: {
    async buttonAction(option) {
      this.o8audio.playEffect('click')
      const object = this.systemObjects[this.objectId]
      switch (option.command) {
        case 'build':
          switch (object.type) {
            case 'planet':
              this.tell(
                'Factories',
                'In Demo 3, you will be able to build factories on planets. You will first need raw materials and colonists. You will also be able to build orbiting space ports.'
              )
              break
            case 'moon':
              this.tell('Moon Defences', 'In Demo 4, you will be able to build defences on your moons.')
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
          this.tell('Port Upgrades', 'Once built, ports will be upgradable to expand commerce.')
          break
        case 'transfer':
          this.tell(
            'Transfers',
            'When this feature is enabled, to build on the planet surface you will first need to drop off enough materials and colonists. Once production begins, you will be able to pick up newly manufactured goods.'
          )
          break
        case 'jump':
          this.zoomOutToNeighbors()
          break
        case 'market': {
          const contract = object.type === 'ship' ? this.shipTokenAddress : this.planetTokenAddress
          const url = marketTokenUrl(this.chainId, contract, object.id)
          if (url) window.open(url, '_blank', 'noopener')
          break
        }
        case 'claim': {
          const name = await this.ask({
            title: 'Claim ' + object.name,
            message: 'Make planet #' + option.value + ' your own, and give it a name.',
            input: { label: "Your planet's name", kind: 'name' },
            confirm: 'Claim Planet'
          })
          if (name) this.claimPlanet({ planetId: option.value, name })
          break
        }
        case 'buildStation':
          if (this.avatar.credits > 10000) {
            const name = await this.ask({
              title: 'Build a Space Station',
              message:
                'It costs 10,000 credits to build a space station. You will have ' +
                (this.avatar.credits - 10000).toLocaleString('en-US') +
                ' credits remaining.',
              input: { label: "Your station's name", kind: 'name' },
              confirm: 'Build Station'
            })
            if (name) this.buildStation({ planetId: option.value, name })
          } else {
            this.tell(
              'Not Enough Credits',
              'You need 10,000 credits to build a space station. You are ' +
                (10000 - this.avatar.credits).toLocaleString('en-US') +
                ' credits short. Try trading at more space ports.'
            )
          }
          break
        case 'visitStation':
          this.selectSprite(object.stationKey)
          break
        case 'visitPlanet':
          this.selectSprite(object.orbiting)
          break
        case 'visitMoon':
          this.$emit('moon-menu')
          break
        case 'attack':
          this.tell('Attacking', "You won't be able to attack anything until demo\u00a04.")
          break
        case 'rename': {
          const { type, objectId } = object
          const name = await this.ask({
            title: 'Rename ' + object.name,
            input: { label: 'New ' + type + ' name', value: object.name, kind: 'name' },
            confirm: 'Rename'
          })
          // Moons and stations are named through their planet.
          const parentId = type === 'moon' || type === 'station' ? object.planet : undefined
          if (name && name !== object.name) this.renameAsset({ objectId, parentId, name, type })
          break
        }
      }
    },
    ...mapActions(useDialogStore, ['ask', 'tell']),
    ...mapActions(useGameStateStore, ['claimPlanet', 'buildStation', 'renameAsset']),
    ...mapActions(useUIStore, ['zoomOutToNeighbors', 'openMenu', 'selectSprite'])
  }
}
</script>

<style lang="scss"></style>
