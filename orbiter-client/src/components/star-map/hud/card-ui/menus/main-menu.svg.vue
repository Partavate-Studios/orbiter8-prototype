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
import { useDemo4Store } from '@/stores/demo4'
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
  data() {
    return { demo4: useDemo4Store() }
  },
  computed: {
    ...mapState(useChainStore, ['chainId', 'planetTokenAddress', 'shipTokenAddress']),
    ...mapState(useStarMapStore, ['systemObjects']),
    ...mapState(useGameStateStore, ['avatar']),
    menuData: function () {
      const d = this.demo4
      const demo4 = d.active
        ? {
            credits: d.credits,
            claimFee: d.rules.claimFee,
            armed: d.armed,
            retreated: Boolean(d.condition?.retreated),
            sessionLive: d.sessionLive,
            siegeAt: (id) => d.siegeAt(id)
          }
        : undefined
      return cardMenu(this.systemObjects[this.objectId], { marketName: networkFor(this.chainId)?.nftMarket?.name, demo4 })
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
                'In Demo 4, you will be able to build factories on planets. You will first need raw materials and colonists. You will also be able to build orbiting space ports.'
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
          const fee = this.demo4.active ? this.demo4.rules.claimFee : 0
          const name = await this.ask({
            title: 'Claim ' + object.name,
            message: fee
              ? `Make ${object.name} your own for ${fee.toLocaleString('en-US')} credits, and give it a name. Then bring colonists and supplies to found a Citadel.`
              : 'Make planet #' + option.value + ' your own, and give it a name.',
            input: { label: "Your planet's name", kind: 'name', value: fee ? object.name : undefined },
            confirm: 'Claim Planet'
          })
          if (name) this.claimPlanet({ planetId: option.value, name: name === object.name ? '' : name })
          break
        }
        // Demo 4's
        case 'recruit': {
          const d = this.demo4
          const price = d.rules.colonistPrice
          const max = Math.min(Math.floor(d.credits / price), d.freeBays * 100)
          if (max < 1) {
            this.tell('Recruiting Colonists', `Colonists cost ${price} credits each, 100 to a free hold. You need credits and free holds.`)
            break
          }
          const count = await this.ask({
            title: "Earth's Hiring Hall",
            message: `Colonists sign on for ${price} credits each and travel 100 to a hold.`,
            input: { label: 'How many colonists', kind: 'number', min: 1, max, value: String(Math.min(100, max)) },
            confirm: 'Recruit'
          })
          if (count) d.recruit(count)
          break
        }
        case 'colony':
          this.openMenu('colony')
          break
        case 'armory':
          this.openMenu('armory')
          break
        case 'loadout':
          this.openMenu('loadout')
          break
        case 'siege':
          this.openMenu('siege')
          break
        case 'traverse':
          this.demo4.traverse()
          break
        case 'session':
          if (this.demo4.sessionLive) this.demo4.endSession()
          else {
            const go = await this.ask({
              title: 'Start a Session',
              message:
                'One approval in your wallet, and your moves for the next few hours go through a key kept in this browser: no more popups. Some gas money travels with it, and comes back when you end the session.',
              confirm: 'Start Session'
            })
            if (go) this.demo4.startSession()
          }
          break
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
          if (!this.demo4.active) {
            this.tell('Attacking', "You won't be able to attack anything until demo\u00a04.")
            break
          }
          if (
            await this.ask({
              title: 'Lay Siege to ' + object.name,
              message:
                'A siege is public: everyone sees it in the feed. Rounds are fought every 30 minutes while your ship stays here. Wear the planet down, then file a claim; it completes a day later unless the defenses come back.',
              confirm: 'Attack'
            })
          )
            this.demo4.attack(option.value, object.name)
          break
        case 'rename': {
          const { type, objectId } = object
          // Demo 4 charges for a ship's new name (B16); the rest are free.
          const fee = this.demo4.active && type === 'ship' ? this.demo4.shipNameFee : 0
          const name = await this.ask({
            title: 'Rename ' + object.name,
            message: fee ? `A new name for your ship costs ${fee.toLocaleString('en-US')} credits.` : undefined,
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
