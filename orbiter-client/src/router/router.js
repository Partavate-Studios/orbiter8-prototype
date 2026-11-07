import { createRouter, createWebHashHistory } from 'vue-router'
import Game from '@/components/playgame'
import TitleScreen from '@/components/title/title-screen.vue'
import GalaxyView from '@/components/galaxy/galaxy-view.vue'
import { useGameStateStore } from '@/stores/gamestate'

export default createRouter({
  history: createWebHashHistory(),
  routes: [
    // Demo 4's galaxy (docs/demo4-plan.md); joins the title and onboarding in milestone 5.
    { path: '/galaxy', name: 'Galaxy', component: GalaxyView },
    {
      path: '/',
      name: 'Title Screen',
      component: TitleScreen
    },
    {
      path: '/play',
      name: 'Play',
      component: Game,
      // The game needs a loaded player with a ship; anyone else starts at the title.
      beforeEnter: () => {
        const gameState = useGameStateStore()
        return gameState.gameDataLoaded && gameState.haveShip ? true : '/'
      }
    }
  ]
})
