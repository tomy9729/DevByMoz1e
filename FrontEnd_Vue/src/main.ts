import { createApp } from 'vue'
import './style.css'
import 'primeicons/primeicons.css'
import Aura from '@primeuix/themes/aura'
import PrimeVue from 'primevue/config'
import App from './App.vue'

createApp(App)
  .use(PrimeVue, {
    theme: {
      preset: Aura,
      options: {
        darkModeSelector: false,
      },
    },
  })
  .mount('#app')
