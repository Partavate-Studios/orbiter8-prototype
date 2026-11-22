<template>
  <!-- A pilot's info card (Koda, 2026-11-21 and 22; docs/ui-plan.md 4.5): you as an identity, not only
       your ship, and anyone else the same way. Reached from another pilot's ship (its Pilot button),
       from the Owner button on anything someone else owns, and from the leaderboard. Simple for now,
       with room to grow: achievements and corporate rank have their places, switched off. Everything
       here is public on chain. -->
  <div class="profile-panel" :class="{ narrow }">
    <header>
      <span class="avatar" :class="{ me }"><small-icon name="you" /></span>
      <span class="who">
        <b :style="{ fontSize: nameSize + 'px' }">{{ name }}</b>
        <small>{{ me ? 'You' : 'Pilot' }}<template v-if="corporation"> · {{ corporation }}</template></small>
      </span>
    </header>

    <p v-if="status === 'loading'" class="quiet">Asking Minerva…</p>
    <p v-else-if="status === 'error'" class="quiet">Minerva couldn't find this pilot's record just now.</p>

    <section v-if="pilot" class="ship">
      <!-- their ship as it flies: the NFT's own drawing, from what's fitted to it -->
      <svg ref="art" class="art" :viewBox="SHIP_ART_VIEWBOX" aria-hidden="true" />
      <div>
        <small>Flies</small>
        <b>{{ pilot.ship.name }}</b>
        <small>Orbiter 8 · range {{ pilot.ship.range }} · {{ whereWords }}</small>
        <button v-if="shipHere" type="button" class="link" @click="show(shipHere.key)">Show the ship</button>
      </div>
    </section>

    <section v-if="record" class="tiles">
      <span class="tile"><small-icon name="market" /><span><b>{{ credits(record.credits) }}¢</b><small>credits</small></span></span>
      <span class="tile"><small-icon name="planet" /><span><b>{{ record.planets }}</b><small>{{ record.planets === 1 ? 'planet' : 'planets' }}</small></span></span>
      <span class="tile"><small-icon name="port" /><span><b>{{ record.ports }}</b><small>{{ record.ports === 1 ? 'port' : 'ports' }}</small></span></span>
      <span class="tile"><small-icon name="ranks" /><span><b>{{ ordinal(record.rank) }}</b><small>by planets</small></span></span>
    </section>

    <section v-if="here.length">
      <h3>Here, in {{ starName }}</h3>
      <button v-for="body in here" :key="body.key" type="button" class="row" @click="show(body.key)">
        <span class="pic"><img v-if="body.art" :src="body.art" alt="" /><span v-else class="sphere" :style="body.style" /></span>
        <span class="text"><b>{{ body.name }}</b><small>{{ body.sub }}</small></span>
        <small-icon name="go" />
      </button>
    </section>

    <section>
      <h3>On Minerva's record</h3>
      <p class="address">
        <code>{{ shortAddress }}</code>
        <button type="button" class="link" @click="copy">{{ copied ? 'Copied' : 'Copy' }}</button>
      </p>
    </section>

    <section class="later">
      <span class="socket"><b>Achievements</b><small>Not yet</small></span>
      <span class="socket"><b>Corporate rank</b><small>Not yet</small></span>
    </section>
  </div>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import { game } from '@orbiter8/sdk/client'
import { rankPlayers } from '@orbiter8/sdk/leaderboard'
import { planetTypeName } from '@orbiter8/sdk/game/planet-types'
import { shipArtParts, SHIP_ART_VIEWBOX } from '@orbiter8/sdk/ship-art'
import { useStarMapStore } from '@/stores/starmap'
import { useUIStore } from '@/stores/ui'
import { usePlayerStore } from '@/stores/player'
import { fitSize } from '@/libs/fit-text'
import { ASTEROID_ART, PORT_ART, bodySphere } from '@/libs/body-art'
import SmallIcon from '../small-icon.vue'

const same = (a, b) => String(a ?? '').toLowerCase() === String(b ?? '').toLowerCase()

export default {
  name: 'ProfilePanel',
  components: { SmallIcon },
  props: {
    /** The selection (menu-sheet passes it to every menu). */
    objectId: { type: String, default: null },
    /** A phone. */
    narrow: { type: Boolean, default: false }
  },
  data() {
    return { status: 'loading', pilot: null, record: null, corporations: [], copied: false, SHIP_ART_VIEWBOX }
  },
  computed: {
    ...mapState(useUIStore, { address: 'profileOf' }),
    ...mapState(useStarMapStore, ['systemObjects', 'currentStarSystemName', 'players']),
    me() {
      return same(this.address, usePlayerStore().account)
    },
    name() {
      return this.pilot?.callsign ?? this.record?.name ?? this.players?.[this.address] ?? game.callsignOf(this.address) ?? 'A pilot'
    },
    nameSize() {
      return fitSize(this.name, 24, this.narrow ? 220 : 380, 400)
    },
    /** "Citizen of X" needs the corporation's name; none until the record arrives. */
    corporation() {
      const id = this.pilot?.corporation
      return id ? (this.corporations[id - 1] ?? null) : null
    },
    starName() {
      return this.currentStarSystemName ?? 'this system'
    },
    /** Their ship, when it's in this system. */
    shipHere() {
      return Object.values(this.systemObjects).find((o) => o.type === 'ship' && same(o.owner, this.address)) ?? null
    },
    whereWords() {
      if (this.shipHere) return 'here'
      const cell = this.pilot?.ship.cell
      return cell != null ? 'at ' + game.starName(cell) : ''
    },
    /** What they own in this system, each a way to it. */
    here() {
      const objects = this.systemObjects
      return Object.values(objects)
        .filter((o) => (o.type === 'planet' || o.type === 'asteroid' || o.type === 'station') && same(o.owner, this.address))
        .map((o) => ({
          key: o.key,
          name: o.name,
          sub: o.type === 'planet' ? planetTypeName(o.class) + ' planet' : o.type === 'asteroid' ? o.compositionName + ' asteroid' : 'Station at ' + (objects[o.orbiting]?.name ?? ''),
          art: o.type === 'station' ? PORT_ART : o.type === 'asteroid' ? (ASTEROID_ART[o.composition] ?? ASTEROID_ART[0]) : null,
          style: o.type === 'planet' ? bodySphere(o, 26) : null
        }))
    },
    shortAddress() {
      const a = String(this.address ?? '')
      return a.length > 14 ? a.slice(0, 8) + '…' + a.slice(-6) : a
    }
  },
  watch: {
    address: { immediate: true, handler: 'load' },
    pilot() {
      this.$nextTick(this.drawShip)
    }
  },
  methods: {
    ...mapActions(useUIStore, ['selectSprite', 'closeMenu']),
    credits(n) {
      return Math.round(n).toLocaleString('en-US')
    },
    ordinal(n) {
      const tail = n % 100 >= 11 && n % 100 <= 13 ? 'th' : (['th', 'st', 'nd', 'rd'][n % 10] ?? 'th')
      return n + tail
    },
    /** The pilot as the chain has them, where they stand on the board, and the corporations' names. */
    async load() {
      const address = this.address
      this.status = 'loading'
      this.pilot = null
      this.record = null
      if (!address) return
      try {
        const [pilot, board, corporations] = await Promise.all([game.pilotOf(address), game.getLeaderboard(), game.corporations()])
        if (address !== this.address) return
        this.pilot = pilot
        this.corporations = corporations?.names ?? []
        const ranked = rankPlayers([...(board?.players ?? board ?? [])], 'planets')
        const at = ranked.findIndex((p) => same(p.address, address))
        this.record = at >= 0 ? { ...ranked[at], rank: at + 1 } : null
        this.status = pilot ? 'ready' : 'error'
      } catch (error) {
        console.warn('Reading the pilot failed:', error?.shortMessage ?? error?.message ?? error)
        if (address === this.address) this.status = 'error'
      }
    },
    /** The ship's drawing is our own string (sdk/ship-art.js), set as the inline <svg>'s content. */
    drawShip() {
      if (this.$refs.art && this.pilot) this.$refs.art.innerHTML = shipArtParts(this.pilot.ship, false, 'profile-')
    },
    show(key) {
      this.o8audio?.playEffect('click')
      this.closeMenu()
      this.selectSprite(key)
    },
    async copy() {
      try {
        await navigator.clipboard.writeText(String(this.address))
        this.copied = true
        setTimeout(() => (this.copied = false), 1500)
      } catch {
        // no clipboard here: the address is on screen to read
      }
    }
  }
}
</script>

<style scoped>
.profile-panel {
  width: min(520px, calc(100vw - 60px));
  box-sizing: border-box;
  padding: 18px 22px 20px;
  color: #e6dcf5;
  text-align: left;
}
.profile-panel.narrow {
  width: calc(100vw - 34px);
  padding: 14px 14px 16px;
}
header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding-right: 52px;
}
.narrow header {
  padding-right: 0;
}
.avatar {
  flex: none;
  display: grid;
  place-items: center;
  width: 60px;
  height: 60px;
  border: 1.5px solid var(--accent);
  border-radius: 50%;
  background: radial-gradient(circle at 50% 40%, #3d2a6e 0%, #1a1331 80%);
  color: #ffffff;
}
/* you: the yellow mark */
.avatar.me {
  border: 2.5px solid var(--o8-yellow);
}
.avatar .small-icon {
  width: 38px;
  height: 38px;
}
.who {
  min-width: 0;
}
.who b {
  display: block;
  overflow: hidden;
  color: #ffffff;
  font-weight: normal;
  line-height: 1.15;
  text-overflow: ellipsis;
  white-space: nowrap;
}
small {
  display: block;
  color: #bdb5d4;
  font-size: 12.5px;
}
.quiet {
  margin: 14px 0 0;
  color: #9088aa;
  font-size: 13px;
}
section {
  margin-top: 16px;
}
h3 {
  margin: 0 0 8px;
  padding-bottom: 5px;
  border-bottom: 1px solid #ffffff1f;
  color: var(--accent);
  font-size: 11px;
  letter-spacing: 1.3px;
  text-transform: uppercase;
}
.ship {
  display: flex;
  align-items: center;
  gap: 16px;
}
.art {
  flex: none;
  width: 120px;
  height: 120px;
  border-radius: 12px;
  background: #150f28;
}
.ship b {
  display: block;
  color: #ffffff;
  font-size: 19px;
  font-weight: normal;
}
.tiles {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}
.narrow .tiles {
  grid-template-columns: repeat(2, 1fr);
}
.tile {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 8px 10px;
  border-radius: 10px;
  background: #ffffff10;
  color: var(--accent);
}
.tile .small-icon {
  flex: none;
  width: 20px;
  height: 20px;
}
.tile b {
  display: block;
  overflow: hidden;
  color: #ffffff;
  font-size: 17px;
  font-weight: normal;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tile small {
  font-size: 11px;
}
button {
  font: inherit;
  cursor: pointer;
}
button:focus-visible {
  outline: 2.5px solid var(--o8-brand-300);
  outline-offset: 2px;
}
.row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 48px;
  padding: 0 10px 0 6px;
  border: 1.5px solid transparent;
  border-radius: 12px;
  background: none;
  color: #c3b3da;
  text-align: left;
}
.row:hover {
  border-color: #b9a0ff;
  background: #ffffff10;
}
.row > .small-icon {
  width: 16px;
  height: 16px;
}
.pic {
  flex: none;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
}
.pic img {
  width: 32px;
  height: 32px;
}
.sphere {
  display: block;
  border-radius: 50%;
}
.text {
  flex: 1;
  min-width: 0;
}
.text b {
  display: block;
  color: #ffffff;
  font-size: 15px;
  font-weight: 500;
}
.address {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
}
code {
  color: #e6dcf5;
  font-family: 'Ubuntu Mono', monospace;
  font-size: 15px;
}
.link {
  padding: 3px 12px;
  border: 1.2px solid color-mix(in srgb, var(--accent) 60%, transparent);
  border-radius: 13px;
  background: #ffffff10;
  color: #ffffff;
  font-size: 12.5px;
}
.link:hover {
  border-color: var(--accent);
  background: #ffffff22;
}
.ship .link {
  margin-top: 6px;
}
/* not there yet: dashed, dimmed, said plainly */
.later {
  display: flex;
  gap: 8px;
}
.socket {
  flex: 1;
  padding: 8px 12px;
  border: 1px dashed #5a4c8c;
  border-radius: 10px;
}
.socket b {
  display: block;
  color: #efe7ff88;
  font-size: 13px;
  font-weight: 500;
}
.socket small {
  color: #9088aa;
  font-size: 11px;
}
</style>
