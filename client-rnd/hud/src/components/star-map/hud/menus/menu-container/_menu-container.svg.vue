<template>
  <!-- A menu's content. Its frame, its slide up and its close button are the menu sheet's
       (components/hud/menu-sheet.vue), which sizes itself to what's drawn here. -->
  <g class="menu-content"><slot /></g>
</template>

<script>
import { computed } from 'vue'
import { useStarMapStore } from '@/stores/starmap'
import { useUIStore } from '@/stores/ui'
import { menuTheme } from '@/libs/card-theme'

/** The open menu's name ('trade', 'chat'…), or null. */
export function openMenuName(ui) {
  return Object.entries(ui.hud.menuState).find(([key, on]) => on === true && key !== 'menuShowing')?.[0]?.replace(/Menu$/, '') ?? null
}

export default {
  name: 'MenuContainer',
  // The menu's colors for everything inside it (libs/card-theme.js menuTheme).
  provide() {
    return { menuTheme: computed(() => this.theme) }
  },
  computed: {
    theme() {
      const ui = useUIStore()
      return menuTheme(openMenuName(ui), useStarMapStore().systemObjects[ui.selected])
    }
  }
}
</script>
