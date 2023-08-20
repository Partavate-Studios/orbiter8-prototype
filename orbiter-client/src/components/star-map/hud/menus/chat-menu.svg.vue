<template>
  <g>
    <menu-container>
      <g>
        <g transform="translate(0 -400)" dominant-baseline="middle" text-anchor="middle" >

          <g transform="">
            <text x="0" y="5" fill="#ffffff88"
                font-size="1.5em"> Broadcasts  </text>
          </g>


          <g transform="" v-for="(event, index) in chatEvents" :key="'event' + index">
            <g v-if="index < 12" :transform="'translate(0 ' + (50 + 40 * index) +  ')'" :opacity="1 - index / 15">
                <chat-slot-container :name="getName(event.returnValues._sender)" :message="event.returnValues._message" :blockId="blockId - event.blockNumber">
                </chat-slot-container>
            </g>
          </g>

          <g :transform="'translate(0 620)'">
              <menu-button
                  v-on:buttonclick="broadcast"
                  text="Send Broadcast" />
          </g>
        </g>
      </g>
    </menu-container>
  </g>
</template>

<script>

import {  mapGetters, mapActions } from 'vuex'
import MenuContainer from './menu-container/_menu-container.svg'
import MenuButton from './menu-button.svg'
import ChatSlotContainer from './menu-container/chat-slot-container.svg'

export default {
  name: 'ChatMenu',
  data () {
    return {
      holdsToBuy: 0,
      pending: false
    }
  },
  props: {
    objectId: null
  },
  components: {
    MenuContainer,
    MenuButton,
    ChatSlotContainer
  },
  methods: {
    ...mapActions('GameState', [
      'sendChat'
    ]),
    broadcast() {
      let message = prompt('Send a message?')
      if (message.length > 0) {
        this.sendChat(message)
      }
    },
    getName(address) {
      console.log('lila ' + JSON.stringify(this.players))
      let name = address.substr(0, 6) + '...' + address.substr(address.length - 5)
      if (typeof this.players[address.toLowerCase()] !== 'undefined') {
        name = this.players[address.toLowerCase()]
      }
      return (name)
    }
  },
  computed: {
    ...mapGetters([
      'blockId'
    ]),
    ...mapGetters('GameState', [
      'events'
    ]),
    ...mapGetters('StarMap', [
      'players'
    ]),
    chatEvents () {
      let chatEvents = this.events.chatEvents
      chatEvents.reverse()
      return chatEvents
    }
  },
  watch: {
  }
}
</script>
