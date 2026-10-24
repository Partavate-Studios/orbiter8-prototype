import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router/router'
import store from './store/store'
import O8audio from './libs/08audio'

const app = createApp(App)
const pinia = createPinia()
app.config.globalProperties.o8audio = new O8audio()
app.use(pinia)
app.use(store)
app.use(router)
app.mount('#game')

if (import.meta.env.DEV) {
  import('./dev/store-hook.js').then(({ installStoreHook }) => installStoreHook(pinia, store))
}
