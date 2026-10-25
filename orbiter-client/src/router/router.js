import { createRouter, createWebHashHistory } from 'vue-router'
import Game from '@/components/playgame'
import TitleScreen from '@/components/screens/TitleScreen'

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
      component: Game
    }
  ]
})
