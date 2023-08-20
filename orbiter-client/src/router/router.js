import Vue from 'vue'
import Router from 'vue-router'
import Game from '@/components/playgame'
import HowToWeb3 from '@/components/screens/HowToWeb3'
import TitleScreen from '@/components/screens/TitleScreen'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Title Screen',
      component: TitleScreen
    },
    {
      path: '/how-to-web-3',
      name: 'HowToWeb3',
      component: HowToWeb3
    },
    {
      path: '/play',
      name: 'Play',
      component: Game
    }
  ]
})
