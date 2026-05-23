<template>
  <header class="topbar">
    <div class="topbar-breadcrumb">
      <span class="topbar-home">🅿️</span>
      <span class="topbar-sep">/</span>
      <span class="topbar-title">{{ currentTitle }}</span>
    </div>
    <div class="topbar-actions">
      <div class="topbar-clock">
        <div class="topbar-time">{{ currentTime }}</div>
        <div class="topbar-date">{{ currentDate }}</div>
      </div>
      <div class="topbar-user">
        <div class="user-avatar">{{ initials }}</div>
        <div class="user-info">
          <div class="user-name">{{ auth.userName }}</div>
          <div class="user-role">{{ auth.userRole }}</div>
        </div>
        <button class="btn-logout" @click="logout" title="Se déconnecter">⏻</button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth.js'
import { useToastStore } from '@/store/toast.js'

const route  = useRoute()
const router = useRouter()
const auth   = useAuthStore()
const toast  = useToastStore()

const currentTime = ref('')
const currentDate = ref('')

const titleMap = {
  '/':         'Tableau de Bord',
  '/clients':  'Gestion des Clients',
  '/voitures': 'Gestion des Voitures',
  '/places':   'Places de Parking',
  '/tarifs':   'Grille Tarifaire',
  '/entrees':  'Enregistrement des Entrées',
  '/sorties':  'Enregistrement des Sorties',
  '/recette':  'Recette & Rapports PDF',
}

const currentTitle = computed(() => titleMap[route.path] || 'Parking Manager')
const initials = computed(() =>
  auth.userName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
)

function logout() {
  auth.logout()
  toast.success('Déconnexion réussie')
  router.push('/login')
}

let timer
function updateTime() {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  currentDate.value = now.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}
onMounted(() => { updateTime(); timer = setInterval(updateTime, 1000) })
onBeforeUnmount(() => clearInterval(timer))
</script>

<style scoped>
.topbar {
  height: 64px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  padding: 0 24px;
  gap: 12px;
  position: sticky;
  top: 0;
  z-index: 100;
  min-width: 0;
}

.topbar-breadcrumb {
  display: flex; align-items: center; gap: 8px;
  font-size: 0.875rem;
  flex: 1; min-width: 0;
}
.topbar-home { font-size: 1rem; flex-shrink: 0; }
.topbar-sep  { color: var(--text-muted); flex-shrink: 0; }
.topbar-title {
  font-family: var(--font-display); font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.topbar-actions {
  display: flex; align-items: center; gap: 12px;
  flex-shrink: 0;
}

.topbar-clock { display: flex; flex-direction: column; align-items: flex-end; }
.topbar-time { font-family: var(--font-display); font-size: 1.1rem; font-weight: 700; color: var(--gold); line-height: 1; }
.topbar-date { font-size: 0.72rem; color: var(--text-muted); text-transform: capitalize; white-space: nowrap; }

.topbar-user {
  display: flex; align-items: center; gap: 8px;
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 6px 10px 6px 6px;
  max-width: 220px;
}
.user-avatar {
  width: 30px; height: 30px;
  background: linear-gradient(135deg, var(--gold), var(--gold-dark));
  border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.72rem; font-weight: 700; color: #1a1a2e;
}
.user-info { min-width: 0; flex: 1; }
.user-name {
  font-size: 0.82rem; font-weight: 600; color: var(--text-primary);
  line-height: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.user-role { font-size: 0.68rem; color: var(--gold); text-transform: capitalize; }
.btn-logout {
  background: none; border: none; cursor: pointer;
  color: var(--text-muted); font-size: 1rem; padding: 2px;
  transition: var(--transition); flex-shrink: 0;
}
.btn-logout:hover { color: var(--accent-red); }

/* Responsive : masquer la date et le nom sur petit écran */
@media (max-width: 640px) {
  .topbar-clock { display: none; }
  .user-info    { display: none; }
  .topbar-user  { padding: 6px; }
}
</style>