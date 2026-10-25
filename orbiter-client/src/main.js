import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router/router'
import O8audio from './libs/08audio'
import { game } from './sdk/client'
import { bindStoresToGame } from './stores/game-bindings'

const app = createApp(App)
const pinia = createPinia()
app.config.globalProperties.o8audio = new O8audio()
app.use(pinia)
bindStoresToGame(game)
app.use(router)
app.mount('#game')

if (import.meta.env.DEV) {
  import('./dev/store-hook.js').then(({ installStoreHook }) => installStoreHook(pinia, game))
}
