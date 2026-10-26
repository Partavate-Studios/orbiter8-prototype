import { createRouter, createWebHashHistory } from 'vue-router'
import Game from '@/components/playgame'
import TitleScreen from '@/components/title/title-screen.vue'
import { useGameStateStore } from '@/stores/gamestate'

export default createRouter({
  history: createWebHashHistory(),
  routes: [
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
