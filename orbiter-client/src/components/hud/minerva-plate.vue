<template>
  <!-- Minerva, at the top of the screen: your link to the network, and the activity window (Koda,
       2026-11-21: one small window of icons for what you have going on; docs/ui-plan.md 4.4 and mockup 9).
       Her face, then an icon for each thing under way with a ring for how far along: filled for what
       keeps you busy, outlined for what's only waiting, pink for what needs you. Pointing at one (or
       focusing it) shows its line. The session sits at the end, in lavender. Pressing her opens her menu. -->
  <div class="minerva-plate" :class="{ compact, needs: needsYou }">
    <button type="button" class="her" title="Minerva: your link to the network (N)" aria-label="Minerva: your link to the network" @click="$emit('open')">
      <minerva-face :state="mood" :size="compact ? 46 : 58" />
    </button>
    <button v-for="item in shown" :key="item.id" type="button" class="activity" :class="[item.kind, { full: item.full }]" :aria-label="line(item)" @click="press(item)">
      <svg class="ring" viewBox="-20 -20 40 40" aria-hidden="true">
        <circle r="18" class="track" />
        <circle v-if="item.part != null" r="18" class="done" :stroke-dasharray="`${item.part * 113.1} 113.1`" transform="rotate(-90)" />
      </svg>
      <small-icon :name="item.icon" />
      <span class="tip" role="tooltip">{{ line(item) }}</span>
    </button>
    <span v-if="more" class="more">+{{ more }}</span>
    <button type="button" class="session" :class="{ off: !session }" :title="session ? 'Your session: moves go through without asking' : 'No session: each move asks your wallet'" @click="$emit('open')">
      <small-icon name="session" /><span v-if="!compact || session">{{ session ?? 'No session' }}</span>
    </button>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { useStarMapStore } from '@/stores/starmap'
import { useUIStore } from '@/stores/ui'
import { usePlayerStore } from '@/stores/player'
import { useTransactionsStore } from '@/stores/transactions'
import { useChainStore } from '@/stores/chain'
import { activities, sessionLeft } from '@/libs/activities'
import MinervaFace from '@/components/minerva/minerva-face.vue'
import SmallIcon from './small-icon.vue'

/** How many icons fit before the rest become a count. */
const SHOWN = 6

export default {
  name: 'MinervaPlate',
  components: { MinervaFace, SmallIcon },
  props: {
    /** A phone: smaller, under the pilot strip. */
    compact: { type: Boolean, default: false },
    /** The clock, ticking by the second while something counts down (hud-overlay.vue). */
    now: { type: Number, required: true }
  },
  emits: ['open'],
  computed: {
    ...mapState(useTransactionsStore, { transactions: 'items' }),
    ...mapState(useChainStore, ['connectionLost']),
    ...mapState(useStarMapStore, ['systemObjects', 'myShipId']),
    player() {
      return usePlayerStore()
    },
    all() {
      return activities({ player: this.player, transactions: this.transactions, now: this.now, myShip: this.systemObjects[this.myShipId] })
    },
    shown() {
      return this.all.slice(0, this.compact ? 4 : SHOWN)
    },
    more() {
      return this.all.length - this.shown.length
    },
    needsYou() {
      return this.all.some((item) => item.kind === 'needs' || item.kind === 'failed')
    },
    session() {
      return sessionLeft(this.player)
    },
    /** Her face says the most pressing thing (docs/archive/briefs/minerva-face.md). */
    mood() {
      if (this.connectionLost) return 'offline'
      const kinds = this.all.map((item) => item.kind + ':' + item.icon)
      if (kinds.some((k) => k === 'needs:wallet')) return 'waiting'
      if (kinds.some((k) => k === 'needs:siege')) return 'alert'
      if (kinds.some((k) => k.startsWith('failed'))) return 'annoyed'
      if (kinds.some((k) => k === 'busy:go')) return 'thinking'
      if (kinds.some((k) => k === 'wait:scan')) return 'scanning'
      return 'idle'
    }
  },
  methods: {
    /** "Selling 3 Helium-3 at I.S.S. · on its way" */
    line(item) {
      return [item.words, item.where, item.left].filter(Boolean).join(' · ')
    },
    /** An activity leads to its thing: the section being mined, the planet building, the siege feed. */
    press(item) {
      this.o8audio?.playEffect('click')
      const ui = useUIStore()
      if (item.select && this.systemObjects[item.select]) {
        ui.closeMenu()
        ui.selectSprite(item.select)
      } else if (item.menu) ui.openMenu(item.menu)
      else this.$emit('open')
    }
  }
}
</script>

<style scoped>
.minerva-plate {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 52px;
  padding: 0 14px 0 4px;
  border: 1.5px solid #5a4c8c;
  border-radius: 26px;
  background: #12052aee;
}
/* something needs you: the plate's edge says so (pink needs you) */
.minerva-plate.needs {
  border-color: var(--o8-pink-light);
}
button {
  font: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
button:focus-visible {
  outline: 2.5px solid var(--o8-brand-300);
  outline-offset: 2px;
}
.her {
  display: grid;
  place-items: center;
  width: 62px;
  height: 49px;
  padding: 0;
  border: 0;
  border-radius: 24px;
  background: none;
  /* under 80 px her face is drawn closer and reaches past its box: the button cuts her tufts off
     at the plate's inner edge (the plate itself can't clip, or the activities' tips below it would go
     too) */
  overflow: hidden;
}
.her:hover {
  background: #ffffff14;
}
/* one thing under way: its icon in a ring */
.activity {
  position: relative;
  flex: none;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: none;
  color: #d9ccf5;
}
.activity .small-icon {
  position: relative;
  width: 17px;
  height: 17px;
}
.ring {
  position: absolute;
  inset: 0;
  width: 40px;
  height: 40px;
}
.ring circle {
  fill: none;
  stroke-width: 2.4;
}
.ring .track {
  stroke: #ffffff26;
}
.ring .done {
  stroke: #b9a0ff;
  stroke-linecap: round;
}
/* keeps you busy: filled */
.activity.busy {
  color: #ffffff;
}
.activity.busy::before {
  content: '';
  position: absolute;
  inset: 5px;
  border-radius: 50%;
  background: var(--o8-brand-500, #7b4fe6);
}
.activity.busy .done {
  stroke: #ffffff;
}
/* needs you, or failed: pink */
.activity.needs .track,
.activity.failed .track,
.activity.full .track {
  stroke: var(--o8-pink-light);
}
.activity.needs {
  color: var(--o8-pink-light);
}
.activity.failed {
  color: #1b1531;
}
.activity.failed::before {
  content: '';
  position: absolute;
  inset: 5px;
  border-radius: 50%;
  background: var(--o8-pink-light);
}
/* its line, when pointed at or focused */
.tip {
  position: absolute;
  top: 48px;
  left: 50%;
  z-index: 2;
  display: none;
  transform: translateX(-50%);
  padding: 7px 12px;
  border: 1.2px solid #5a4c8c;
  border-radius: 10px;
  background: #1b1531;
  color: #e6dcf5;
  font-size: 12.5px;
  white-space: nowrap;
  pointer-events: none;
}
.activity:hover .tip,
.activity:focus-visible .tip {
  display: block;
}
.activity.needs .tip,
.activity.failed .tip {
  border-color: var(--o8-pink-light);
  color: var(--o8-pink-light);
}
.more {
  color: #c3b3da;
  font-size: 13px;
}
/* the session: a state, not an activity; lavender */
.session {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  margin-left: 2px;
  padding: 0 4px 0 10px;
  border: 0;
  border-left: 1px solid #5a4c8c;
  background: none;
  color: #c3b3da;
  font-size: 12.5px;
  white-space: nowrap;
}
.session .small-icon {
  width: 16px;
  height: 16px;
}
.session.off {
  color: #9088aa;
}
.session:hover {
  color: #ffffff;
}
.compact {
  height: 44px;
  padding-right: 10px;
}
.compact .her {
  width: 50px;
  height: 41px;
  border-radius: 20px;
}
.compact .activity {
  width: 34px;
  height: 34px;
}
.compact .ring {
  width: 34px;
  height: 34px;
}
.compact .tip {
  left: 0;
  transform: none;
}
</style>
