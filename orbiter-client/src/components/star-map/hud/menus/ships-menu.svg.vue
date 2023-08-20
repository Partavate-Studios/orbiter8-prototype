<template>
  <g>
    <menu-container>
      <g v-for="(id, index) in pageData" v-bind:key="'ship' + id">
        <g :transform="'translate(0 ' + (-400 + (70 * index)) +  ')' " >
          <a v-on:click.prevent="selectAndClose(id)" cursor="pointer">
            <ship-slot :shipId="id" />
          </a>
        </g>
      </g>
      <g text-anchor="middle" dominant-baseline="middle" v-if="totalPages > 1">
        <g transform="translate(0, 350)">
          <text fill="#ffffff">Page {{ currentPage }} of {{ totalPages }}</text>
        </g>
        <g transform="translate(-100, 350)" v-if="currentPage > 1">
          <text fill="#ffffff">&lt;</text>
          <rect x="-15" y="-15" width="30" height="30" fill="#ffffff44" rx="10" ry="10"
              class="can-click"
              v-on:click="pageDown"  />
        </g>
        <g transform="translate(100, 350)" v-if="currentPage < totalPages">
          <text fill="#ffffff">&gt;</text>
          <rect x="-15" y="-15" width="30" height="30" fill="#ffffff44" rx="10" ry="10"
              class="can-click"
              v-on:click="pageUp"  />
        </g>
      </g>
    </menu-container>
  </g>
</template>

<script>

import { mapGetters, mapMutations } from 'vuex'
import MenuContainer from './menu-container/_menu-container.svg'
import ShipSlot from './menu-slot-ship'

export default {
  name: 'PlanetsMenu',
  data () {
    return {
      shipsPerPage: 10,
      currentPage: 1
    }
  },
  components: {
    MenuContainer,
    ShipSlot
  },
  methods: {
    ...mapMutations('UI', [
      'selectSprite',
      'closeMenu'
    ]),
    selectAndClose(spriteId) {
      this.o8audio.playEffect('click')
      this.selectSprite(spriteId)
      this.closeMenu()
    },
    pageDown() {
      this.currentPage = Math.max(this.currentPage-1, 1)
    },
    pageUp() {
      this.currentPage = Math.min(this.currentPage+1, this.totalPages)
    }
  },
  computed: {
    ...mapGetters('StarMap', [
      'systemObjects',
      'spriteIds',
    ]),
    totalPages() {
      return parseInt((this.spriteIds.ships.length + this.shipsPerPage - 1)/ this.shipsPerPage)
    },
    pageData() {
      let ships = this.spriteIds.ships.slice((this.currentPage - 1) * this.shipsPerPage, this.currentPage * this.shipsPerPage)
      return ships
    }
  }
}
</script>
