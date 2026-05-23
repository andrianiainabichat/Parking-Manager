import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/store/auth.js'

import Login         from '@/views/auth/Login.vue'
import Register      from '@/views/auth/Register.vue'
import ForgotPassword from '@/views/auth/ForgotPassword.vue'
import ResetPassword from '@/views/auth/ResetPassword.vue'
import Dashboard     from '@/views/Dashboard.vue'
import Clients       from '@/views/Clients.vue'
import Voitures      from '@/views/Voitures.vue'
import Places        from '@/views/Places.vue'
import Tarifs        from '@/views/Tarifs.vue'
import Entrees       from '@/views/Entrees.vue'
import Sorties       from '@/views/Sorties.vue'
import Recette       from '@/views/Recette.vue'

const routes = [
  // Auth (publiques)
  { path: '/login',           name: 'Login',          component: Login,          meta: { public: true } },
  { path: '/register',        name: 'Register',       component: Register,       meta: { public: true } },
  { path: '/forgot-password', name: 'ForgotPassword', component: ForgotPassword, meta: { public: true } },
  { path: '/reset-password',  name: 'ResetPassword',  component: ResetPassword,  meta: { public: true } },

  // App (protégées)
  { path: '/',          name: 'Dashboard', component: Dashboard },
  { path: '/clients',   name: 'Clients',   component: Clients   },
  { path: '/voitures',  name: 'Voitures',  component: Voitures  },
  { path: '/places',    name: 'Places',    component: Places    },
  { path: '/tarifs',    name: 'Tarifs',    component: Tarifs    },
  { path: '/entrees',   name: 'Entrees',   component: Entrees   },
  { path: '/sorties',   name: 'Sorties',   component: Sorties   },
  { path: '/recette',   name: 'Recette',   component: Recette   },

  // Fallback
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard global
router.beforeEach((to) => {
  const auth = useAuthStore()
  if (!to.meta.public && !auth.isAuthenticated) {
    return { name: 'Login' }
  }
  if (to.meta.public && auth.isAuthenticated && to.name !== 'ResetPassword') {
    return { name: 'Dashboard' }
  }
})

export default router
