<template>
  <!-- Minerva: your link to the network (Koda, 2026-11-21; docs/ui-plan.md 4.4). What a wallet shows
       and what the network is doing, which had been spread across the title screen, the ship's menu
       and a corner of the HUD: the network and its newest block, your address and what it holds, how
       you're signing (the session lives here now, not on your ship), and everything that's under way. -->
  <div class="k-panel minerva-panel" :class="{ narrow }">
    <header class="k-head">
      <span class="k-title"><minerva-face :state="connectionLost ? 'offline' : 'idle'" :size="64" /><span><b>Minerva</b><small>Your link to the network</small></span></span>
    </header>

    <div class="k-tabs pages" role="tablist">
      <button type="button" role="tab" class="k-tab" :class="{ on: page === 'link' }" :aria-selected="page === 'link' ? 'true' : 'false'" @click="go('link')"><small-icon name="session" />Link</button>
      <button type="button" role="tab" class="k-tab" :class="{ on: page === 'waiting' }" :aria-selected="page === 'waiting' ? 'true' : 'false'" @click="go('waiting')"><small-icon name="scan" />Under way<b v-if="all.length" class="count">{{ all.length }}</b></button>
    </div>

    <template v-if="page === 'link'">
      <section>
        <h3><span>The network</span><span class="k-meter" :class="{ 'k-needs': connectionLost }">{{ connectionLost ? 'Lost contact; still trying' : 'In contact' }}</span></h3>
        <p class="fact"><span>{{ networkName || 'Unknown network' }}</span><b>Block {{ Number(blockId).toLocaleString('en-US') }}</b></p>
      </section>

      <section>
        <h3><span>Your account</span></h3>
        <p class="fact">
          <code>{{ shortAddress }}</code>
          <button type="button" class="k-quiet" @click="copy">{{ copied ? 'Copied' : 'Copy' }}</button>
        </p>
        <div class="tiles">
          <span class="tile"><small>{{ currency || 'Coin' }} · for gas</small><b :class="{ 'k-needs': lowGas }">{{ balanceText }}</b></span>
          <span class="tile"><small>Credits</small><b>{{ player.credits.toLocaleString('en-US') }}¢</b></span>
          <span class="k-socket tile"><small>PGAS</small>Not yet</span>
        </div>
      </section>

      <section>
        <h3><span>How you're signing</span><span class="k-meter">{{ session ? 'A session' : 'Each move, in your wallet' }}</span></h3>
        <template v-if="session">
          <p class="fact"><span>Game moves go through without asking.</span><b>{{ session }} left</b></p>
          <span class="bar"><i :style="{ width: sessionPart * 100 + '%' }" /></span>
          <p class="foot"><small>What's left of its gas money comes back when it ends.</small><button type="button" class="k-quiet" @click="end">End session</button></p>
        </template>
        <template v-else>
          <p class="fact"><span>Approve once; for the next 4 hours your moves go through a key kept in this browser, with no popups. It carries a little gas money, and what's left comes back.</span></p>
          <p class="foot"><span /><button type="button" class="k-main" :disabled="starting" @click="start"><small-icon name="session" />{{ starting ? 'Starting…' : 'Start session' }}</button></p>
        </template>
        <p class="k-socket later">AutoSigning: not yet (the Polkadot App doesn't offer it)</p>
      </section>
    </template>

    <section v-else>
      <p v-if="!all.length" class="k-none">Nothing under way.</p>
      <button v-for="item in all" :key="item.id" type="button" class="k-row item" :class="item.kind" @click="press(item)">
        <span class="mark"><small-icon :name="item.icon" /></span>
        <span class="k-text"><b>{{ item.words }}</b><small>{{ item.where }}</small></span>
        <small class="left">{{ item.left }}</small>
      </button>
    </section>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { useChainStore } from '@/stores/chain'
import { useStarMapStore } from '@/stores/starmap'
import { useUIStore } from '@/stores/ui'
import { usePlayerStore } from '@/stores/player'
import { useTransactionsStore } from '@/stores/transactions'
import { activities, sessionLeft } from '@/libs/activities'
import MinervaFace from '@/components/minerva/minerva-face.vue'
import SmallIcon from '../small-icon.vue'

/** A session's length, for its bar (sdk/session-key.js SESSION_HOURS). */
const SESSION_SECONDS = 4 * 3600

export default {
  name: 'MinervaPanel',
  components: { MinervaFace, SmallIcon },
  props: {
    objectId: { type: String, default: null },
    narrow: { type: Boolean, default: false }
  },
  data() {
    return { player: usePlayerStore(), page: 'link', copied: false, starting: false, now: Date.now() }
  },
  computed: {
    ...mapState(useChainStore, ['account', 'balance', 'blockId', 'networkName', 'networkData', 'chainId', 'connectionLost']),
    ...mapState(useTransactionsStore, { transactions: 'items' }),
    ...mapState(useStarMapStore, ['systemObjects', 'myShipId']),
    currency() {
      return this.networkData[this.chainId]?.currency?.symbol ?? ''
    },
    balanceText() {
      return Number(this.balance).toFixed(4)
    },
    lowGas() {
      return Number(this.balance) < 0.001
    },
    shortAddress() {
      const a = String(this.account ?? '')
      return a.length > 14 ? a.slice(0, 8) + '…' + a.slice(-6) : a
    },
    session() {
      return sessionLeft(this.player)
    },
    sessionPart() {
      return this.session ? Math.max(0, Math.min(1, (this.player.session.expiry - this.player.now / 1000) / SESSION_SECONDS)) : 0
    },
    all() {
      return activities({ player: this.player, transactions: this.transactions, now: this.now, myShip: this.systemObjects[this.myShipId] })
    }
  },
  mounted() {
    this.clock = setInterval(() => (this.now = Date.now()), 1000)
  },
  unmounted() {
    clearInterval(this.clock)
  },
  methods: {
    go(page) {
      this.o8audio?.playEffect('click')
      this.page = page
    },
    async start() {
      this.o8audio?.playEffect('click')
      this.starting = true
      await this.player.startSession()
      this.starting = false
    },
    end() {
      this.o8audio?.playEffect('click')
      this.player.endSession()
    },
    press(item) {
      this.o8audio?.playEffect('click')
      const ui = useUIStore()
      if (item.select && this.systemObjects[item.select]) {
        ui.closeMenu()
        ui.selectSprite(item.select)
      } else if (item.menu) ui.openMenu(item.menu)
    },
    async copy() {
      try {
        await navigator.clipboard.writeText(String(this.account))
        this.copied = true
        setTimeout(() => (this.copied = false), 1500)
      } catch {
        // no clipboard here: the address is on screen to read
      }
    }
  }
}
</script>

<style src="../kit.css"></style>
<style scoped>
.pages {
  margin-top: 14px;
}
.count {
  margin-left: 2px;
  padding: 0 7px;
  border-radius: 9px;
  background: #ffffff22;
  font-size: 12px;
  font-weight: normal;
}
.fact {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin: 4px 0;
  color: #bdb5d4;
  font-size: 14px;
}
.fact b {
  flex: none;
  color: #ffffff;
}
code {
  color: #ffffff;
  font-family: 'Ubuntu Mono', monospace;
  font-size: 16px;
}
.tiles {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 8px;
}
.tile {
  padding: 8px 12px;
  border-radius: 10px;
  background: #ffffff10;
}
.tile.k-socket {
  background: none;
}
.tile b {
  display: block;
  color: #ffffff;
  font-size: 17px;
  font-weight: normal;
}
.bar {
  display: block;
  height: 8px;
  border-radius: 4px;
  background: #0f0a1e;
  overflow: hidden;
}
.bar i {
  display: block;
  height: 100%;
  border-radius: 4px;
  background: #c3b3da;
}
.foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 10px 0 0;
}
.later {
  margin: 12px 0 0;
}
.item .mark {
  flex: none;
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border: 2px solid #b9a0ff;
  border-radius: 50%;
  color: #d9ccf5;
}
.item .mark .small-icon {
  width: 17px;
  height: 17px;
}
.item.busy .mark {
  border-color: #ffffff;
  background: var(--o8-brand-500, #7b4fe6);
  color: #ffffff;
}
.item.needs .mark,
.item.failed .mark {
  border-color: var(--o8-pink-light);
  color: var(--o8-pink-light);
}
.left {
  flex: none;
  color: #c3b3da;
}
.item.needs .left,
.item.failed .left {
  color: var(--o8-pink-light);
}
</style>
