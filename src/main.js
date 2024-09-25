import { createApp } from 'vue'
import { createPinia } from 'pinia'
import * as VueRouter from 'vue-router'
import App from './App.vue'
import { useMainStore } from '@/stores/index'

const routes = [
  { path: '/'},
]

const app = createApp(App)

const router = VueRouter.createRouter({
  // 4. Provide the history implementation to use. We are using the hash history for simplicity here.
  history: VueRouter.createWebHashHistory(),
  routes,
})
app.use(router)
const pinia = createPinia()

app.use(pinia)

const mainStore = useMainStore()
const token = document.cookie.split("; ").find((row) => row.startsWith("user-token"))
if (mainStore && token) {
  mainStore.setUserToken(token.split("=")[1])
}

app.mount('#app')
