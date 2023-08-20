import Vue from 'vue'
import App from './App.vue'
import router from './router/router'
import store from './store/store'
import O8audio from './libs/08audio'

Vue.config.productionTip = false
Vue.prototype.o8audio = new O8audio()

new Vue({
  store,
  router,
  render: h => h(App)
}).$mount('#app')
