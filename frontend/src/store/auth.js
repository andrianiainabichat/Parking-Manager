import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/utils/api.js'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('pm_token') || null)
  const user  = ref(JSON.parse(localStorage.getItem('pm_user') || 'null'))

  const isAuthenticated = computed(() => !!token.value)
  const userName = computed(() => user.value?.nom || '')
  const userRole = computed(() => user.value?.role || '')

  function setAuth(t, u) {
    token.value = t
    user.value  = u
    localStorage.setItem('pm_token', t)
    localStorage.setItem('pm_user', JSON.stringify(u))
    api.defaults.headers.common['Authorization'] = `Bearer ${t}`
  }

  function logout() {
    token.value = null
    user.value  = null
    localStorage.removeItem('pm_token')
    localStorage.removeItem('pm_user')
    delete api.defaults.headers.common['Authorization']
  }

  // Restaure le header axios si token déjà en localStorage
  if (token.value) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
  }

  return { token, user, isAuthenticated, userName, userRole, setAuth, logout }
})
