import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import i18n from './i18n.js'
import router from './router/index.js'

createApp(App)
    .use(createPinia())
    .use(i18n)
    .use(router)
    .mount('#app')
