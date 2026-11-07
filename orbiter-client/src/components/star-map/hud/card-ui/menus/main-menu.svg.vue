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
import { usePlayerStore } from '@/stores/player'
import { cardMenu } from './card-menu'
import { marketTokenUrl, networkFor } from '@/sdk/chain/networks'
import { PILOT_NAME_MIN_LENGTH } from '@/libs/onboarding'
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
    return { player: usePlayerStore() }
  },
  computed: {
    ...mapState(useChainStore, ['chainId', 'planetTokenAddress', 'shipTokenAddress']),
    ...mapState(useStarMapStore, ['systemObjects']),
    ...mapState(useGameStateStore, ['avatar']),
    menuData: function () {
      const d = this.player
      const pilot = {
        credits: d.credits,
        claimFee: d.rules?.claimFee ?? 0,
        armed: d.armed,
        retreated: Boolean(d.condition?.retreated),
        sessionLive: d.sessionLive,
        siegeAt: (id) => d.siegeAt(id)
      }
      return cardMenu(this.systemObjects[this.objectId], { marketName: networkFor(this.chainId)?.nftMarket?.name, pilot })
    }
  },
  methods: {
    async buttonAction(option) {
      this.o8audio.playEffect('click')
      const object = this.systemObjects[this.objectId]
      switch (option.command) {
        case 'trade':
          this.openMenu('trade')
          break
        case 'shipyards':
          this.openMenu('shipyard')
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
          const fee = this.player.rules.claimFee
          const name = await this.ask({
            title: 'Claim ' + object.name,
            message: `Make ${object.name} your own for ${fee.toLocaleString('en-US')} credits, and give it a name. Then bring colonists and supplies to found a Citadel.`,
            input: { label: "Your planet's name", kind: 'name', value: object.name },
            confirm: 'Claim Planet'
          })
          if (name) this.claimPlanet({ planetId: option.value, name: name === object.name ? '' : name })
          break
        }
        case 'recruit': {
          const d = this.player
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
          this.traverseBlackHole()
          break
        case 'session':
          if (this.player.sessionLive) this.player.endSession()
          else {
            const go = await this.ask({
              title: 'Start a Session',
              message:
                'One approval in your wallet, and your moves for the next few hours go through a key kept in this browser: no more popups. Some gas money travels with it, and comes back when you end the session.',
              confirm: 'Start Session'
            })
            if (go) this.player.startSession()
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
          if (
            await this.ask({
              title: 'Lay Siege to ' + object.name,
              message:
                'A siege is public: everyone sees it in the feed. Rounds are fought every 30 minutes while your ship stays here. Wear the planet down, then file a claim; it completes a day later unless the defenses come back.',
              confirm: 'Attack'
            })
          )
            this.player.attack(option.value, object.name)
          break
        case 'nameStar': {
          const fee = this.player.rules.buildings[3].credits // a Station's cost (Planets.nameStar)
          const owns = object.namingOwns && object.keeper !== this.player.account
          const name = await this.ask({
            title: (object.named ? 'Rename ' : 'Name ') + object.name,
            message:
              `Filing a star's name with Minerva costs ${fee.toLocaleString('en-US')} credits.` +
              (owns ? ' Holding its planets, you become the star’s owner.' : ''),
            input: { label: 'Star name', value: object.named ? object.name : '', kind: 'name' },
            confirm: object.named ? 'Rename' : 'Name Star'
          })
          if (name && name !== object.name) this.renameAsset({ objectId: object.objectId, name, type: 'star' })
          break
        }
        case 'rename': {
          const { type, objectId } = object
          // A ship's new name costs (B16).
          const fee = type === 'ship' ? this.player.shipNameFee : 0
          const name = await this.ask({
            title: 'Rename ' + object.name,
            message: fee ? `A new name for your ship costs ${fee.toLocaleString('en-US')} credits.` : undefined,
            input: {
              label: 'New ' + type + ' name',
              value: object.name,
              kind: 'name',
              minLength: type === 'ship' ? PILOT_NAME_MIN_LENGTH : 1
            },
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
    ...mapActions(useGameStateStore, ['claimPlanet', 'renameAsset', 'traverseBlackHole']),
    ...mapActions(useUIStore, ['zoomOutToNeighbors', 'openMenu', 'selectSprite'])
  }
}
</script>

<style lang="scss"></style>
