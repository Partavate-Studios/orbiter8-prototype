<template>
  <!-- A siege as it stands now (docs/demo4-plan.md, section 6): both sides' layers, played up to
       now by the contract's own preview, and what the player can do about it. Pink: it needs someone. -->
  <g v-if="object && siege">
    <menu-container>
      <g :transform="'translate(0 -400) scale(' + scale + ')'" fill="#ffffff" dominant-baseline="middle">
        <text x="0" y="5" text-anchor="middle" fill="#ffffff88" font-size="1.5em">Siege of {{ object.name }}</text>
        <text x="0" y="32" text-anchor="middle" font-size="0.8em" :fill="PINK_LIGHT">
          {{ attackerName }} attacking · rounds every 30 minutes since {{ ago(siege.started) }}
        </text>

        <g transform="translate(-175 70)" font-size="0.8em">
          <text x="0" y="0" font-size="1.1em">Planet</text>
          <g v-for="(bar, i) in planetBars" :key="bar.name" :transform="'translate(0 ' + (22 + i * 18) + ')'">
            <text x="0" y="0" fill="#ffffffaa">{{ bar.name }}</text>
            <rect x="62" y="-3" width="80" height="6" rx="3" fill="#ffffff1a" />
            <rect x="62" y="-3" :width="80 * bar.part" height="6" rx="3" fill="#c3b3da" />
            <text x="165" y="0" text-anchor="end">{{ bar.value }}</text>
          </g>
          <text x="0" :y="30 + planetBars.length * 18" fill="#ffffff88" font-size="0.85em">{{ weapons(siege.side) }}</text>
        </g>
        <g transform="translate(10 70)" font-size="0.8em">
          <text x="0" y="0" font-size="1.1em">Attacker</text>
          <g v-for="(bar, i) in shipBars" :key="bar.name" :transform="'translate(0 ' + (22 + i * 18) + ')'">
            <text x="0" y="0" fill="#ffffffaa">{{ bar.name }}</text>
            <rect x="62" y="-3" width="80" height="6" rx="3" fill="#ffffff1a" />
            <rect x="62" y="-3" :width="80 * bar.part" height="6" rx="3" fill="#c3b3da" />
            <text x="165" y="0" text-anchor="end">{{ bar.value }}</text>
          </g>
          <text x="0" :y="30 + shipBars.length * 18" fill="#ffffff88" font-size="0.85em">{{ weapons(siege.ship) }}</text>
        </g>

        <text
          v-for="(line, i) in status"
          :key="i"
          x="0"
          :y="192 + i * 18"
          text-anchor="middle"
          font-size="0.85em"
          :fill="siege.wornAt || defenceless ? PINK_LIGHT : '#ffffffaa'"
        >
          {{ line }}
        </text>

        <g transform="translate(0 250)">
          <g v-for="(action, i) in actions" :key="action.text" :transform="'translate(0 ' + i * 50 + ')'">
            <menu-button :enabled="action.enabled" :text="action.text" @buttonclick="action.run" />
          </g>
          <text :y="actions.length * 50 + 2" text-anchor="middle" font-size="0.75em" fill="#ffffff88">
            Rounds count once recorded; any move at this star records them too.
          </text>
        </g>
      </g>
    </menu-container>
  </g>
</template>

<script>
import { mapState } from 'pinia'
import { useStarMapStore } from '@/stores/starmap'
import { useUIStore } from '@/stores/ui'
import { usePlayerStore } from '@/stores/player'
import { PINK_LIGHT } from '@/libs/palette'
import { game } from '@/sdk/client'
import MenuContainer from './menu-container/_menu-container.svg'
import MenuButton from './menu-button.svg'

export default {
  name: 'SiegeMenu',
  components: { MenuContainer, MenuButton },
  props: {
    /** The besieged planet's key. */
    objectId: { type: String, default: null }
  },
  data() {
    return { player: usePlayerStore(), PINK_LIGHT }
  },
  computed: {
    ...mapState(useStarMapStore, ['systemObjects', 'players']),
    ...mapState(useUIStore, ['viewport']),
    object() {
      return this.systemObjects[this.objectId]
    },
    siege() {
      return this.player.siegeAt(this.object?.objectId)
    },
    scale() {
      const width = Math.min(this.viewport.width - 100, 700)
      return Math.min(width > 450 ? 1.5 : 1, (this.viewport.height - 160) / 440)
    },
    mine() {
      return this.siege.attacker === this.player.account
    },
    attackerName() {
      if (this.mine) return 'You are'
      const who = this.siege.attacker
      return (this.players[who] ?? game.callsignOf(who) ?? who.slice(0, 6) + '…') + ' is'
    },
    planetBars() {
      const s = this.siege.side
      // Platforms are 150 each (up to 3); the hull is 60 per tech level. A layer the planet never had
      // isn't a bar.
      return [
        { name: 'Platforms', value: s.platforms, max: 450 },
        { name: 'Shield', value: s.shield, max: s.shieldMax },
        { name: 'Armor', value: s.armor, max: s.armorMax },
        { name: 'Hull', value: s.hull, max: 360 }
      ]
        .filter((b) => b.max > 0 && b.value > 0)
        .map((b) => ({ ...b, part: Math.min(1, b.value / b.max) }))
    },
    /** Nothing stands between the attacker and the planet. */
    defenceless() {
      const s = this.siege.side
      return s.platforms === 0 && s.shield === 0 && s.armor === 0 && s.hull === 0
    },
    shipBars() {
      const s = this.siege.ship
      return [
        { name: 'Shield', value: s.shield, max: s.shieldMax },
        { name: 'Armor', value: s.armor, max: s.armorMax }
      ]
        .filter((b) => b.max > 0)
        .map((b) => ({ ...b, part: b.value / b.max }))
    },
    /** In short lines, to fit a phone. */
    status() {
      if (this.siege.claimAt)
        return [`Claim filed with Minerva: completes ${this.when(this.siege.claimAt)},`, 'unless the defenses come back.']
      if (this.siege.wornAt) return [`Worn down ${this.ago(this.siege.wornAt)}:`, 'production has stopped.']
      if (this.defenceless) return ['Undefended: worn down', 'when the next round is recorded.']
      return ['The planet is holding.']
    },
    actions() {
      const d = this.player
      const id = this.object.objectId
      const name = this.object.name
      const list = []
      if (this.mine) {
        if (this.siege.wornAt && !this.siege.claimAt)
          list.push({ text: 'File a Claim with Minerva', enabled: true, run: () => d.fileClaim(id, name) })
        if (this.siege.claimAt)
          list.push({
            text: 'Complete the Claim',
            enabled: this.siege.claimAt * 1000 <= d.now,
            run: () => d.completeClaim(id, name)
          })
        list.push({ text: 'Withdraw', enabled: true, run: () => d.withdraw(id) })
      } else if (this.object.owner !== d.account && d.armed && !d.condition?.retreated) {
        list.push({ text: 'Join the Defense', enabled: true, run: () => d.joinDefense(id, name) })
      }
      list.push({ text: 'Record the Rounds', enabled: true, run: () => d.advanceSiege(id) })
      return list
    }
  },
  methods: {
    weapons(s) {
      const parts = [
        [s.railguns, 'railgun'],
        [s.missiles, 'missile rack'],
        [s.pointDefense, 'point defense'],
        [s.drones, 'drone'],
        [s.bfg, 'BFG']
      ].filter(([n]) => n > 0)
      if (!parts.length) return s === this.siege.side && this.defenceless ? 'No defenses' : 'No weapons left'
      return parts.map(([n, name]) => `${n} ${name}${n > 1 && name !== 'point defense' && name !== 'BFG' ? 's' : ''}`).join(', ')
    },
    ago(t) {
      const minutes = Math.round((this.player.now / 1000 - t) / 60)
      if (minutes < 1) return 'just now'
      return minutes < 60 ? `${minutes} min ago` : `${(minutes / 60).toFixed(1)} h ago`
    },
    when(t) {
      const minutes = Math.round((t - this.player.now / 1000) / 60)
      return minutes <= 0 ? 'now' : minutes < 60 ? `in ${minutes} min` : `in ${(minutes / 60).toFixed(1)} h`
    }
  }
}
</script>
