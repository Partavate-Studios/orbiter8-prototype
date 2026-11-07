<template>
  <g>
    <menu-container>
      <g>
        <g transform="translate(0 -400)" dominant-baseline="middle" text-anchor="middle">
          <g>
            <text x="0" y="5" fill="#ffffff88" font-size="1.5em"> Broadcasts </text>
          </g>

          <g v-for="(event, index) in chatEvents" :key="'event' + index">
            <g v-if="index < 12" :transform="'translate(0 ' + (50 + 40 * index) + ')'" :opacity="1 - index / 15">
              <chat-slot-container
                :name="getName(event.returnValues._sender)"
                :message="event.returnValues._message"
                :block-id="blockId - event.blockNumber"
                :mine="isMine(event.returnValues._sender)"
              >
              </chat-slot-container>
            </g>
          </g>

          <g :transform="'translate(0 620)'">
            <menu-button text="Send Broadcast" @buttonclick="broadcast" />
          </g>
        </g>
      </g>
    </menu-container>
  </g>
</template>

<script>
import { useChainStore } from '@/stores/chain'
import { useGameStateStore } from '@/stores/gamestate'
import { mapActions, mapState } from 'pinia'
import { useStarMapStore } from '@/stores/starmap'
import { useDialogStore } from '@/stores/dialog'
import { game } from '@/sdk/client'
import MenuContainer from './menu-container/_menu-container.svg'
import MenuButton from './menu-button.svg'
import ChatSlotContainer from './menu-container/chat-slot-container.svg'

export default {
  name: 'ChatMenu',
  components: {
    MenuContainer,
    MenuButton,
    ChatSlotContainer
  },
  props: {},
  computed: {
    ...mapState(useChainStore, ['blockId', 'account']),
    ...mapState(useGameStateStore, ['events']),
    ...mapState(useStarMapStore, ['players']),
    chatEvents() {
      // Newest first. Copy before reversing: reverse() works in place and would flip the store's array on every re-render.
      return [...(this.events.chatEvents ?? [])].reverse()
    }
  },
  methods: {
    ...mapActions(useGameStateStore, ['sendChat']),
    ...mapActions(useDialogStore, ['ask']),
    async broadcast() {
      const message = await this.ask({
        title: 'Send a Broadcast',
        input: { label: 'Your message', kind: 'message' },
        confirm: 'Send'
      })
      // null when the player cancels
      if (message) {
        this.sendChat(message)
      }
    },
    isMine(address) {
      return String(address).toLowerCase() === String(this.account).toLowerCase()
    },
    getName(address) {
      const key = address.toLowerCase()
      return this.players[key] ?? game.callsignOf(key) ?? address.substr(0, 6) + '...' + address.substr(address.length - 5)
    }
  }
}
</script>
