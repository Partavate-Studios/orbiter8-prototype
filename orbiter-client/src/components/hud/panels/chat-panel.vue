<template>
  <!-- Broadcasts: what pilots have said to everyone, newest first. A pilot's name opens their info
       card. You write where you read: the field is in the panel, focused, with Send beside it (the old
       menu opened a dialog from a button far below an often empty list). -->
  <div class="k-panel chat-panel" :class="{ narrow }">
    <header class="k-head">
      <span class="k-title"><small-icon name="chat" /><span><b>Broadcasts</b><small>Everyone hears these</small></span></span>
    </header>

    <form class="write" @submit.prevent="send">
      <input ref="field" v-model="draft" type="text" aria-label="Your message" placeholder="Say something to everyone" autocomplete="off" :maxlength="MAX" />
      <button type="submit" class="k-main" :disabled="!ready"><small-icon name="go" />Send</button>
    </form>
    <small v-if="tooLong" class="k-needs">Too long: {{ bytes }} of {{ MAX }}.</small>

    <section>
      <p v-if="!messages.length" class="k-none">Quiet. Nobody has said anything yet.</p>
      <div v-for="(m, i) in messages" :key="i" class="k-row message">
        <span class="k-text">
          <button v-if="!m.mine" type="button" class="k-link" @click="who(m.sender)">{{ m.name }}</button>
          <b v-else class="k-you">You</b>
          <span class="said">{{ m.text }}</span>
        </span>
        <small>{{ m.ago }}</small>
      </div>
    </section>
  </div>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import { game } from '@orbiter8/sdk/client'
import { useChainStore } from '@/stores/chain'
import { useGameStateStore } from '@/stores/gamestate'
import { useStarMapStore } from '@/stores/starmap'
import { useUIStore } from '@/stores/ui'
import SmallIcon from '../small-icon.vue'

/** A broadcast's longest, in bytes (the contract's). */
const MAX = 280
/** How many are shown. */
const SHOWN = 30

export default {
  name: 'ChatPanel',
  components: { SmallIcon },
  props: {
    objectId: { type: String, default: null },
    narrow: { type: Boolean, default: false }
  },
  data() {
    return { draft: '', MAX }
  },
  computed: {
    ...mapState(useChainStore, ['blockId', 'account']),
    ...mapState(useGameStateStore, ['events']),
    ...mapState(useStarMapStore, ['players']),
    bytes() {
      return new TextEncoder().encode(this.draft.trim()).length
    },
    tooLong() {
      return this.bytes > MAX
    },
    ready() {
      return this.bytes > 0 && !this.tooLong
    },
    /** Newest first (a copy: reverse() works in place and would flip the store's array). */
    messages() {
      const me = String(this.account).toLowerCase()
      return [...(this.events.chatEvents ?? [])]
        .reverse()
        .slice(0, SHOWN)
        .map((event) => {
          const sender = String(event.returnValues._sender).toLowerCase()
          const blocks = Math.max(0, this.blockId - event.blockNumber)
          return {
            sender,
            mine: sender === me,
            name: this.players[sender] ?? game.callsignOf(sender) ?? sender.slice(0, 6) + '…' + sender.slice(-4),
            text: event.returnValues._message,
            ago: blocks === 0 ? 'now' : blocks + (blocks === 1 ? ' block ago' : ' blocks ago')
          }
        })
    }
  },
  mounted() {
    // ready to type in, on screens with a keyboard (a phone's would cover the list)
    if (!this.narrow) this.$refs.field?.focus()
  },
  methods: {
    ...mapActions(useGameStateStore, ['sendChat']),
    send() {
      if (!this.ready) return
      this.o8audio?.playEffect('click')
      this.sendChat(this.draft.trim())
      this.draft = ''
    },
    who(address) {
      this.o8audio?.playEffect('click')
      useUIStore().openProfile(address)
    }
  }
}
</script>

<style src="../kit.css"></style>
<style scoped>
.write {
  display: flex;
  gap: 10px;
  margin-top: 14px;
}
input {
  flex: 1;
  min-width: 0;
  height: 46px;
  box-sizing: border-box;
  padding: 0 16px;
  border: 1.5px solid color-mix(in srgb, var(--base) 60%, transparent);
  border-radius: 23px;
  background: #150f28;
  color: #ffffff;
  font: inherit;
  font-size: 15px;
}
input::placeholder {
  color: #9088aa;
}
.k-main {
  min-width: 0;
}
.message {
  align-items: flex-start;
  min-height: 0;
  padding: 7px 8px;
}
.message .k-text {
  white-space: normal;
  overflow-wrap: anywhere;
}
.said {
  margin-left: 8px;
  color: #f1eefa;
  font-size: 14.5px;
}
.message > small {
  flex: none;
  color: #9088aa;
  font-size: 11.5px;
  white-space: nowrap;
}
</style>
