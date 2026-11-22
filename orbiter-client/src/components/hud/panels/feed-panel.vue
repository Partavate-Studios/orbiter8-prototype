<template>
  <!-- The public siege feed (D44): every siege started, joined, worn down, claimed and ended, newest
       first, from the Battle contract's events. Ones still running are pink: they need someone. Names
       go somewhere: a pilot's to their info card, a planet in this system to the planet. -->
  <div class="k-panel feed-panel" :class="{ narrow }">
    <header class="k-head">
      <span class="k-title"><small-icon name="siege" /><span><b>Sieges</b><small>Across the galaxy, as they happen</small></span></span>
    </header>

    <section>
      <p v-if="!rows.length" class="k-none">Quiet across the galaxy. No sieges yet.</p>
      <div v-for="(row, i) in rows" :key="i" class="k-row event" :class="{ live: row.live }">
        <img :src="siegeArt" alt="" />
        <span class="k-text">
          <button v-if="row.who && !row.you" type="button" class="k-link" @click="profile(row.who)">{{ row.name }}</button>
          <b v-else-if="row.you" class="k-you">You</b>
          {{ row.did }}
          <button v-if="row.here" type="button" class="k-link" @click="show(row.here)">{{ row.where }}</button>
          <template v-else>{{ row.where }}</template>
          {{ row.after }}
        </span>
      </div>
    </section>
  </div>
</template>

<script>
import { mapActions } from 'pinia'
import { game } from '@orbiter8/sdk/client'
import { cellOf } from '@orbiter8/sdk/body-id'
import { useUIStore } from '@/stores/ui'
import { useStarMapStore } from '@/stores/starmap'
import { usePlayerStore } from '@/stores/player'
import siegeArt from '@/assets/art/siege.svg'
import SmallIcon from '../small-icon.vue'

export default {
  name: 'FeedPanel',
  components: { SmallIcon },
  props: {
    objectId: { type: String, default: null },
    narrow: { type: Boolean, default: false }
  },
  data() {
    return { player: usePlayerStore(), siegeArt }
  },
  computed: {
    /** The newest thirty, each as: who, what they did, where. */
    rows() {
      const objects = useStarMapStore().systemObjects
      return this.player.feed.slice(0, 30).map((e) => {
        const key = 'planet:' + e.planet
        const here = objects[key] ? key : null
        // The planet's name when it's at this star; elsewhere its stand-in name and its star's.
        const where = here ? objects[key].name : `${game.derivedPlanetName(e.planet)} at ${game.starName(cellOf(e.planet))}`
        const who = e.who ? String(e.who) : null
        const base = { who, you: who === this.player.account, name: who ? (game.callsignOf(who) ?? who.slice(0, 6) + '…') : '', here, where, after: '', live: e.event !== 'SiegeEnded' }
        switch (e.event) {
          case 'SiegeStarted':
            return { ...base, did: 'laid siege to' }
          case 'DefenderJoined':
            return { ...base, did: 'joined the defense of' }
          case 'WornDown':
            return { ...base, who: null, did: '', after: 'was worn down' }
          case 'ClaimFiled':
            return { ...base, did: 'filed a claim on' }
          case 'ClaimFailed':
            return { ...base, who: null, did: 'The claim on', after: 'failed' }
          default:
            return e.args?.[2] ? { ...base, did: 'took' } : { ...base, who: null, did: 'The siege of', after: 'ended' }
        }
      })
    }
  },
  methods: {
    ...mapActions(useUIStore, ['selectSprite', 'closeMenu', 'openProfile']),
    profile(address) {
      this.o8audio?.playEffect('click')
      this.openProfile(address)
    },
    show(key) {
      this.o8audio?.playEffect('click')
      this.closeMenu()
      this.selectSprite(key)
    }
  }
}
</script>

<style src="../kit.css"></style>
<style scoped>
.event {
  min-height: 40px;
}
.event img {
  flex: none;
  width: 26px;
  height: 26px;
  opacity: 0.6;
}
.event .k-text {
  color: #c3b3da;
  font-size: 14px;
  white-space: normal;
}
/* still running: it needs someone */
.event.live .k-text {
  color: var(--o8-pink-light);
}
.event.live img {
  opacity: 1;
}
</style>
