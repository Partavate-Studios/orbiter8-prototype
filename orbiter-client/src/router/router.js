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
    },
    // Dev builds only: Minerva's face and its test console. Production builds drop it, file and all.
    ...(import.meta.env.DEV
      ? [{ path: '/minerva-lab', name: 'Minerva Lab', component: () => import('@/components/minerva/minerva-lab.vue') }]
      : [])
  ]
})
