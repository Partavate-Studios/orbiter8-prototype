<template>
  <!-- A siege as it stands now (docs/demo4-plan.md, section 6): both sides' layers, played up to now by
       the contract's own preview, and what you can do about it. Pink: it needs someone. Rebuilt to the
       screen standard: the two sides beside each other, each layer a bar in the order hits land, what
       each side still has to fire, the state of things in a line, then one main action. -->
  <div v-if="object && siege" class="k-panel siege-panel" :class="{ narrow }">
    <header class="k-head">
      <span class="k-title"><small-icon name="siege" /><span><b>Siege of {{ object.name }}</b><small class="k-needs">A round every 30 minutes, since {{ ago(siege.started) }}</small></span></span>
    </header>

    <p class="state" :class="{ 'k-needs': siege.wornAt || defenceless }">{{ status.join(' ') }}</p>

    <div class="sides">
      <section>
        <h3><span>The planet</span><span class="k-meter">{{ ownerName }}</span></h3>
        <p v-if="!planetBars.length" class="k-none">Nothing left standing.</p>
        <p v-for="(bar, i) in planetBars" :key="bar.name" class="layer">
          <i>{{ i + 1 }}</i><span>{{ bar.name }}</span><span class="bar"><b :style="{ width: bar.part * 100 + '%' }" /></span><em>{{ bar.value }}</em>
        </p>
        <small class="arms">{{ weapons(siege.side) }}</small>
      </section>
      <section>
        <h3><span>The attacker</span><button v-if="!mine" type="button" class="k-link" @click="profile">{{ attacker }}</button><span v-else class="k-meter k-you">You</span></h3>
        <p v-if="!shipBars.length" class="k-none">No shield or armor.</p>
        <p v-for="(bar, i) in shipBars" :key="bar.name" class="layer">
          <i>{{ i + 1 }}</i><span>{{ bar.name }}</span><span class="bar"><b :style="{ width: bar.part * 100 + '%' }" /></span><em>{{ bar.value }}</em>
        </p>
        <small class="arms">{{ weapons(siege.ship) }}</small>
      </section>
    </div>

    <footer>
      <button v-for="(action, i) in actions" :key="action.text" type="button" :class="i === 0 ? 'k-main' : 'k-quiet'" :disabled="!action.enabled" @click="run(action)">{{ action.text }}</button>
    </footer>
    <small class="note">Rounds count once they're recorded; any move at this star records them too.</small>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { game } from '@orbiter8/sdk/client'
import { useStarMapStore } from '@/stores/starmap'
import { useUIStore } from '@/stores/ui'
import { usePlayerStore } from '@/stores/player'
import SmallIcon from '../small-icon.vue'

export default {
  name: 'SiegePanel',
  components: { SmallIcon },
  props: {
    /** The besieged planet's key. */
    objectId: { type: String, default: null },
    narrow: { type: Boolean, default: false }
  },
  data() {
    return { player: usePlayerStore() }
  },
  computed: {
    ...mapState(useStarMapStore, ['systemObjects', 'players']),
    object() {
      return this.systemObjects[this.objectId]
    },
    siege() {
      return this.player.siegeAt(this.object?.objectId)
    },
    mine() {
      return this.siege.attacker === this.player.account
    },
    attacker() {
      const who = this.siege.attacker
      return this.players[who] ?? game.callsignOf(who) ?? who.slice(0, 6) + '…'
    },
    ownerName() {
      return this.object.isMine ? 'Yours' : this.object.ownerName || ''
    },
    planetBars() {
      const s = this.siege.side
      // Platforms are 150 each (up to 3); the hull is 60 per tech level. A layer the planet never had
      // isn't a bar. In the order hits land.
      return [
        { name: 'Platforms', value: s.platforms, max: 450 },
        // Weapons on the moons (D61), outside the shield: counted, out of what the planet had fitted
        { name: 'Moon guns', value: this.moonGuns(s), max: Math.max(this.moonGuns(s), this.moonGuns(this.player.defenses[this.siege.planet] ?? {})) },
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
      return s.platforms === 0 && this.moonGuns(s) === 0 && s.shield === 0 && s.armor === 0 && s.hull === 0
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
    status() {
      if (this.siege.claimAt) return [`Claim filed with Minerva: completes ${this.when(this.siege.claimAt)},`, 'unless the defenses come back.']
      if (this.siege.wornAt) return [`Worn down ${this.ago(this.siege.wornAt)}:`, 'production has stopped.']
      if (this.defenceless) return ['Undefended: worn down', 'when the next round is recorded.']
      return ['The planet is holding.']
    },
    /** What can be done now: the first is the screen's main action. */
    actions() {
      const d = this.player
      const id = this.object.objectId
      const name = this.object.name
      const list = []
      if (this.mine) {
        if (this.siege.wornAt && !this.siege.claimAt) list.push({ text: 'File a Claim', enabled: true, run: () => d.fileClaim(id, name) })
        if (this.siege.claimAt) list.push({ text: 'Complete the Claim', enabled: this.siege.claimAt * 1000 <= d.now, run: () => d.completeClaim(id, name) })
      } else if (this.object.owner !== d.account && d.armed && !d.condition?.retreated) {
        list.push({ text: 'Join the Defense', enabled: true, run: () => d.joinDefense(id, name) })
      }
      list.push({ text: 'Record the Rounds', enabled: true, run: () => d.advanceSiege(id) })
      if (this.mine) list.push({ text: 'Withdraw', enabled: true, run: () => d.withdraw(id) })
      return list
    }
  },
  methods: {
    run(action) {
      this.o8audio?.playEffect('click')
      action.run()
    },
    profile() {
      this.o8audio?.playEffect('click')
      useUIStore().openProfile(this.siege.attacker)
    },
    moonGuns(s) {
      return (s.moonPointDefense ?? 0) + (s.moonRailguns ?? 0) + (s.moonMissiles ?? 0)
    },
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

<style src="../kit.css"></style>
<style scoped>
.state {
  margin: 12px 0 0;
  padding: 10px 14px;
  border-radius: 12px;
  background: #ffffff10;
  color: #e6dcf5;
  font-size: 14.5px;
}
.sides {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 22px;
}
.narrow .sides {
  grid-template-columns: 1fr;
  gap: 0;
}
.layer {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 13.5px;
  line-height: 26px;
}
.layer i {
  width: 12px;
  color: #9088aa;
  font-size: 11px;
  font-style: normal;
}
.layer span:first-of-type {
  width: 78px;
  color: #bdb5d4;
}
.bar {
  flex: 1;
  height: 7px;
  border-radius: 4px;
  background: #0f0a1e;
  overflow: hidden;
}
.bar b {
  display: block;
  height: 100%;
  border-radius: 4px;
  background: var(--accent);
}
.layer em {
  width: 38px;
  color: #ffffff;
  font-style: normal;
  text-align: right;
}
.arms {
  margin-top: 6px;
}
footer {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}
.note {
  margin-top: 10px;
  color: #9088aa;
}
</style>
