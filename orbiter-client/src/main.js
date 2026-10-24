import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router/router'
import store from './store/store'
import O8audio from './libs/08audio'

const app = createApp(App)
app.config.globalProperties.o8audio = new O8audio()
app.use(createPinia())
app.use(store)
app.use(router)
app.mount('#game')
