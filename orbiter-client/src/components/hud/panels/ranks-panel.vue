<template>
  <!-- The leaderboard: every pilot by planets or by credits. The top rows, and your own if it's
       further down. A row opens that pilot's info card. -->
  <div class="k-panel ranks-panel" :class="{ narrow }">
    <header class="k-head">
      <span class="k-title"><small-icon name="ranks" /><span><b>Ranks</b><small>{{ updatedText }}</small></span></span>
    </header>

    <div class="k-tabs by" role="tablist" aria-label="Ranked by">
      <button v-for="(label, key) in RANKINGS" :key="key" type="button" role="tab" class="k-tab" :class="{ on: rankedBy === key }" :aria-selected="rankedBy === key ? 'true' : 'false'" @click="rankBy(key)">
        <small-icon :name="key === 'planets' ? 'planet' : 'market'" />{{ label }}
      </button>
      <span class="spacer" />
      <button type="button" class="k-quiet" :disabled="status === 'loading'" @click="load(true)">Refresh</button>
    </div>

    <section>
      <p v-if="status === 'loading' && !players.length" class="k-none">Reading the galaxy…</p>
      <p v-else-if="status === 'error'" class="k-none">Couldn't read the leaderboard: {{ error }}</p>
      <p v-else-if="!ranked.length" class="k-none">No other pilots yet.</p>
      <template v-else>
        <div class="columns" aria-hidden="true"><span>#</span><span class="name">Pilot</span><span>Planets</span><span>Ports</span><span>Credits</span></div>
        <template v-for="row in visibleRows" :key="row.player.address">
          <p v-if="row.gapBefore" class="gap" aria-hidden="true">⋯</p>
          <button type="button" class="k-row rank" :class="{ on: row.isMe }" @click="open(row.player.address)">
            <span class="place">{{ row.rank }}</span>
            <span class="name" :class="{ 'k-you': row.isMe }">{{ row.isMe ? 'You' : row.player.name }}</span>
            <span>{{ row.player.planets }}</span>
            <span>{{ row.player.ports }}</span>
            <span>{{ row.player.credits.toLocaleString('en-US') }}¢</span>
          </button>
        </template>
      </template>
    </section>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { game } from '@orbiter8/sdk/client'
import { rankPlayers } from '@orbiter8/sdk/leaderboard'
import { useChainStore } from '@/stores/chain'
import { useUIStore } from '@/stores/ui'
import SmallIcon from '../small-icon.vue'

const TOP_ROWS = 8
const RANKINGS = { planets: 'Planets', credits: 'Credits' }

export default {
  name: 'RanksPanel',
  components: { SmallIcon },
  props: {
    objectId: { type: String, default: null },
    narrow: { type: Boolean, default: false }
  },
  data() {
    return { RANKINGS, rankedBy: 'planets', players: [], status: 'loading', error: '', loadedAt: 0, now: Date.now() }
  },
  computed: {
    ...mapState(useChainStore, ['account']),
    ranked() {
      const me = String(this.account).toLowerCase()
      return rankPlayers([...this.players], this.rankedBy).map((player, index) => ({ player, rank: index + 1, isMe: player.address === me }))
    },
    /** The top rows, plus your own row (after a gap) when it's further down. */
    visibleRows() {
      const top = this.ranked.slice(0, TOP_ROWS)
      const mine = this.ranked.find((row) => row.isMe)
      return mine && mine.rank > TOP_ROWS ? [...top, { ...mine, gapBefore: true }] : top
    },
    updatedText() {
      if (!this.loadedAt) return 'Every pilot, by what they hold'
      const seconds = Math.max(0, Math.round((this.now - this.loadedAt) / 1000))
      return seconds < 5 ? 'Updated just now' : `Updated ${seconds} s ago`
    }
  },
  mounted() {
    this.load()
    // Keeps "updated … ago" current; the board itself is cached by the game client for a minute.
    this.clock = setInterval(() => (this.now = Date.now()), 5000)
  },
  unmounted() {
    clearInterval(this.clock)
  },
  methods: {
    async load(refresh = false) {
      if (refresh) this.o8audio?.playEffect('click')
      this.status = 'loading'
      try {
        const board = await game.getLeaderboard({ refresh })
        this.players = board.players
        this.loadedAt = board.loadedAt ?? Date.now()
        this.status = 'ready'
      } catch (error) {
        console.error('Loading the leaderboard failed:', error)
        this.error = error?.shortMessage ?? error?.message ?? 'no answer'
        this.status = 'error'
      }
    },
    rankBy(key) {
      this.o8audio?.playEffect('click')
      this.rankedBy = key
    },
    open(address) {
      this.o8audio?.playEffect('click')
      useUIStore().openProfile(address)
    }
  }
}
</script>

<style src="../kit.css"></style>
<style scoped>
.by {
  margin-top: 14px;
}
.spacer {
  flex: 1;
}
.columns,
.rank {
  display: grid;
  grid-template-columns: 34px 1fr 64px 52px 108px;
  align-items: center;
  gap: 8px;
}
.columns {
  padding: 0 12px 4px 8px;
  color: #9088aa;
  font-size: 11.5px;
  text-align: right;
}
.columns .name,
.rank .name {
  text-align: left;
}
.rank {
  min-height: 44px;
  color: #ffffff;
  font-size: 15px;
  text-align: right;
}
.rank .name {
  overflow: hidden;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.place {
  color: #bdb5d4;
  text-align: center;
}
.gap {
  margin: 0;
  color: #9088aa;
  text-align: center;
}
.narrow .columns,
.narrow .rank {
  grid-template-columns: 26px 1fr 44px 40px 92px;
  font-size: 14px;
}
</style>
