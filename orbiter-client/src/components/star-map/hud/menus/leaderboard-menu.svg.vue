<template>
  <g>
    <menu-container>
      <g dominant-baseline="middle" text-anchor="middle">
        <g transform="translate(0 -400)">
          <text x="0" y="5" fill="#ffffff88" font-size="1.5em">Leaderboard</text>
        </g>

        <!-- what the board is ranked by -->
        <g transform="translate(0 -355)" font-size="0.9em">
          <a v-for="(label, key, index) in rankings" :key="key" cursor="pointer" @click.prevent="rankBy(key)">
            <text
              :x="(index - 0.5) * 120"
              y="0"
              :fill="rankedBy === key ? '#ffffff' : '#ffffff66'"
              :text-decoration="rankedBy === key ? 'underline' : 'none'"
              >{{ label }}</text
            >
          </a>
        </g>

        <text v-if="status === 'loading'" y="-200" fill="#ffffffaa">Reading the galaxy…</text>
        <text v-else-if="status === 'error'" y="-200" fill="#ffffffaa">Couldn't read the leaderboard: {{ error }}</text>
        <text v-else-if="ranked.length === 0" y="-200" fill="#ffffffaa">No other pilots yet.</text>

        <g v-else>
          <!-- column headings, aligned with the rows below -->
          <g :transform="'translate(' + (1 - slotWidth / 2) + ' -315)'" font-size="0.75em" fill="#ffffff88">
            <text :x="columns.rank" y="0">#</text>
            <text :x="columns.name" y="0" text-anchor="start">Pilot</text>
            <text :x="columns.planets" y="0">Planets</text>
            <text :x="columns.ports" y="0">Ports</text>
            <text :x="columns.credits" y="0" text-anchor="end">Credits</text>
          </g>
          <g
            v-for="(row, index) in visibleRows"
            :key="row.player.address"
            :transform="'translate(0 ' + (-300 + 65 * index) + ')'"
          >
            <text v-if="row.gapBefore" x="0" y="-2" fill="#ffffff66">⋯</text>
            <menu-slot-container :highlight="row.isMe">
              <g font-size="1.1em" :fill="row.isMe ? '#ffffff' : '#ffffffcc'">
                <text :x="columns.rank" y="36">{{ row.rank }}</text>
                <text :x="columns.name" y="36" text-anchor="start">{{ pilotName(row.player) }}</text>
                <text :x="columns.planets" y="36">{{ row.player.planets }}</text>
                <text :x="columns.ports" y="36">{{ row.player.ports }}</text>
                <text :x="columns.credits" y="36" text-anchor="end"
                  >{{ row.player.credits.toLocaleString() }}&cent;</text
                >
              </g>
            </menu-slot-container>
          </g>
        </g>

        <g v-if="loadedAt" transform="translate(0 330)" font-size="0.75em">
          <text x="0" y="0" fill="#ffffff66">{{ updatedText }}</text>
          <a cursor="pointer" @click.prevent="load(true)">
            <text x="0" y="22" fill="#ffffffaa" text-decoration="underline">Refresh</text>
          </a>
        </g>
      </g>
    </menu-container>
  </g>
</template>

<script>
import { mapState } from 'pinia'
import { game } from '@/sdk/client'
import { rankPlayers } from '@/sdk/leaderboard'
import { useChainStore } from '@/stores/chain'
import { useUIStore } from '@/stores/ui'
import MenuContainer from './menu-container/_menu-container.svg'
import MenuSlotContainer from './menu-container/menu-slot-container.svg'

// Rows shown before the list is cut off; the player's own row is added below if they're further down.
const TOP_ROWS = 8

export default {
  name: 'LeaderboardMenu',
  components: {
    MenuContainer,
    MenuSlotContainer
  },
  data() {
    return {
      rankings: { planets: 'Most planets', credits: 'Most credits' },
      rankedBy: 'planets',
      status: 'loading',
      error: '',
      players: [],
      loadedAt: null,
      now: Date.now()
    }
  },
  computed: {
    ...mapState(useChainStore, ['account']),
    ...mapState(useUIStore, ['viewport']),
    /** Matches menu-slot-container's width. */
    slotWidth() {
      return Math.min(this.viewport.width - 100, 700)
    },
    /** Column positions inside a row, in the slot's coordinates. */
    columns() {
      const width = this.slotWidth
      return { rank: 30, name: 60, planets: width * 0.58, ports: width * 0.72, credits: width - 30 }
    },
    ranked() {
      const me = String(this.account).toLowerCase()
      return rankPlayers([...this.players], this.rankedBy).map((player, index) => ({
        player,
        rank: index + 1,
        isMe: player.address === me
      }))
    },
    /** The top rows, plus the player's own row (after a gap) when they're further down. */
    visibleRows() {
      const top = this.ranked.slice(0, TOP_ROWS)
      const mine = this.ranked.find((row) => row.isMe)
      if (mine && mine.rank > TOP_ROWS) return [...top, { ...mine, gapBefore: true }]
      return top
    },
    updatedText() {
      const seconds = Math.max(0, Math.round((this.now - this.loadedAt) / 1000))
      return seconds < 5 ? 'Updated just now' : 'Updated ' + seconds + ' s ago'
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
      if (refresh) this.o8audio.playEffect('click')
      this.status = 'loading'
      try {
        const board = await game.getLeaderboard({ refresh })
        this.players = board.players
        this.loadedAt = board.loadedAt
        this.now = Date.now()
        this.status = 'ready'
      } catch (error) {
        console.error('Loading the leaderboard failed:', error)
        this.error = error.shortMessage ?? error.message
        this.status = 'error'
      }
    },
    rankBy(key) {
      this.o8audio.playEffect('click')
      this.rankedBy = key
    },
    pilotName(player) {
      return player.name || player.address.slice(0, 6) + '…' + player.address.slice(-4)
    }
  }
}
</script>
