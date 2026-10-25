<template>
  <g>
    <menu-container>
      <g v-for="(id, index) in pageData" :key="'ship' + id">
        <g :transform="'translate(0 ' + (-400 + 70 * index) + ')'">
          <a cursor="pointer" @click.prevent="selectAndClose(id)">
            <ship-slot :ship-id="id" />
          </a>
        </g>
      </g>
      <g v-if="totalPages > 1" text-anchor="middle" dominant-baseline="middle">
        <g transform="translate(0, 350)">
          <text fill="#ffffff">Page {{ currentPage }} of {{ totalPages }}</text>
        </g>
        <g v-if="currentPage > 1" transform="translate(-100, 350)">
          <text fill="#ffffff">&lt;</text>
          <rect
            x="-15"
            y="-15"
            width="30"
            height="30"
            fill="#ffffff44"
            rx="10"
            ry="10"
            class="can-click"
            @click="pageDown"
          />
        </g>
        <g v-if="currentPage < totalPages" transform="translate(100, 350)">
          <text fill="#ffffff">&gt;</text>
          <rect
            x="-15"
            y="-15"
            width="30"
            height="30"
            fill="#ffffff44"
            rx="10"
            ry="10"
            class="can-click"
            @click="pageUp"
          />
        </g>
      </g>
    </menu-container>
  </g>
</template>

<script>
import { useStarMapStore } from '@/stores/starmap'
import { mapActions, mapState } from 'pinia'
import { useUIStore } from '@/stores/ui'
import MenuContainer from './menu-container/_menu-container.svg'
import ShipSlot from './menu-slot-ship'

export default {
  name: 'PlanetsMenu',
  components: {
    MenuContainer,
    ShipSlot
  },
  data() {
    return {
      shipsPerPage: 10,
      currentPage: 1
    }
  },
  computed: {
    ...mapState(useStarMapStore, ['spriteIds']),
    totalPages() {
      return parseInt((this.spriteIds.ships.length + this.shipsPerPage - 1) / this.shipsPerPage)
    },
    pageData() {
      let ships = this.spriteIds.ships.slice(
        (this.currentPage - 1) * this.shipsPerPage,
        this.currentPage * this.shipsPerPage
      )
      return ships
    }
  },
  methods: {
    ...mapActions(useUIStore, ['selectSprite', 'closeMenu']),
    selectAndClose(spriteId) {
      this.o8audio.playEffect('click')
      this.selectSprite(spriteId)
      this.closeMenu()
    },
    pageDown() {
      this.currentPage = Math.max(this.currentPage - 1, 1)
    },
    pageUp() {
      this.currentPage = Math.min(this.currentPage + 1, this.totalPages)
    }
  }
}
</script>
