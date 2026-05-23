<template>
  <aside class="sidebar" :class="{ collapsed: ui.sidebarCollapsed }">
    <!-- Logo -->
    <div class="sidebar-logo">
      <div class="logo-icon">
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="48" height="48" rx="12" fill="url(#lg)"/>
          <text x="24" y="33" font-family="Arial Black" font-size="26" font-weight="900" text-anchor="middle" fill="#e8b84b">P</text>
          <circle cx="38" cy="10" r="7" fill="#e8b84b"/>
          <text x="38" y="13.5" font-family="Arial" font-size="7" font-weight="bold" text-anchor="middle" fill="#1a1a2e">MGR</text>
          <defs>
            <linearGradient id="lg" x1="0" y1="0" x2="48" y2="48">
              <stop offset="0%" stop-color="#1a1a35"/>
              <stop offset="100%" stop-color="#0d0d1a"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div class="logo-text" v-show="!ui.sidebarCollapsed">
        <div class="logo-name">Parking</div>
        <div class="logo-sub">Manager</div>
      </div>
      <button class="collapse-btn" @click="ui.toggleSidebar()" :title="ui.sidebarCollapsed ? 'Étendre' : 'Réduire'">
        <span>{{ ui.sidebarCollapsed ? '›' : '‹' }}</span>
      </button>
    </div>

    <!-- Status bar -->
    <div class="sidebar-status" v-show="!ui.sidebarCollapsed">
      <div class="status-dot" :class="online ? 'online' : 'offline'"></div>
      <span class="status-text">{{ online ? 'Système actif' : 'Hors ligne' }}</span>
    </div>

    <!-- Navigation -->
    <nav class="sidebar-nav">
      <div class="nav-section-label" v-show="!ui.sidebarCollapsed">TABLEAU DE BORD</div>
      <router-link class="nav-item" to="/" exact-active-class="active">
        <span class="nav-icon">⊞</span>
        <span class="nav-label" v-show="!ui.sidebarCollapsed">Dashboard</span>
        <span class="nav-tooltip" v-show="ui.sidebarCollapsed">Dashboard</span>
      </router-link>

      <div class="nav-section-label" v-show="!ui.sidebarCollapsed">GESTION</div>
      <router-link class="nav-item" to="/clients" active-class="active">
        <span class="nav-icon">👤</span>
        <span class="nav-label" v-show="!ui.sidebarCollapsed">Clients</span>
        <span class="nav-tooltip" v-show="ui.sidebarCollapsed">Clients</span>
      </router-link>
      <router-link class="nav-item" to="/voitures" active-class="active">
        <span class="nav-icon">🚗</span>
        <span class="nav-label" v-show="!ui.sidebarCollapsed">Voitures</span>
        <span class="nav-tooltip" v-show="ui.sidebarCollapsed">Voitures</span>
      </router-link>
      <router-link class="nav-item" to="/places" active-class="active">
        <span class="nav-icon">🅿️</span>
        <span class="nav-label" v-show="!ui.sidebarCollapsed">Places Parking</span>
        <span class="nav-tooltip" v-show="ui.sidebarCollapsed">Places</span>
      </router-link>
      <router-link class="nav-item" to="/tarifs" active-class="active">
        <span class="nav-icon">💰</span>
        <span class="nav-label" v-show="!ui.sidebarCollapsed">Tarifs</span>
        <span class="nav-tooltip" v-show="ui.sidebarCollapsed">Tarifs</span>
      </router-link>

      <div class="nav-section-label" v-show="!ui.sidebarCollapsed">OPÉRATIONS</div>
      <router-link class="nav-item" to="/entrees" active-class="active">
        <span class="nav-icon">⬇️</span>
        <span class="nav-label" v-show="!ui.sidebarCollapsed">Entrées</span>
        <span class="nav-tooltip" v-show="ui.sidebarCollapsed">Entrées</span>
      </router-link>
      <router-link class="nav-item" to="/sorties" active-class="active">
        <span class="nav-icon">⬆️</span>
        <span class="nav-label" v-show="!ui.sidebarCollapsed">Sorties</span>
        <span class="nav-tooltip" v-show="ui.sidebarCollapsed">Sorties</span>
      </router-link>

      <div class="nav-section-label" v-show="!ui.sidebarCollapsed">RAPPORTS</div>
      <router-link class="nav-item" to="/recette" active-class="active">
        <span class="nav-icon">📊</span>
        <span class="nav-label" v-show="!ui.sidebarCollapsed">Recette & PDF</span>
        <span class="nav-tooltip" v-show="ui.sidebarCollapsed">Recette</span>
      </router-link>
    </nav>

    <!-- User + Logout -->
    <div class="sidebar-user" v-show="!ui.sidebarCollapsed">
      <div class="user-badge">
        <div class="user-badge-avatar">{{ initials }}</div>
        <div class="user-badge-info">
          <div class="user-badge-name">{{ auth.userName }}</div>
          <div class="user-badge-role">{{ auth.userRole }}</div>
        </div>
      </div>
      <button class="sidebar-logout" @click="logout" title="Déconnexion">⏻</button>
    </div>

    <!-- Logout icon only when collapsed -->
    <div v-show="ui.sidebarCollapsed" style="padding:10px;border-top:1px solid var(--border);display:flex;justify-content:center">
      <button class="sidebar-logout" @click="logout" title="Déconnexion" style="font-size:1.2rem">⏻</button>
    </div>

    <!-- Footer -->
    <div class="sidebar-footer" v-show="!ui.sidebarCollapsed">
      <div class="sidebar-version">v1.0.0 — Parking Manager</div>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/utils/api.js'
import { useAuthStore } from '@/store/auth.js'
import { useToastStore } from '@/store/toast.js'
import { useUiStore } from '@/store/ui.js'

const router = useRouter()
const auth   = useAuthStore()
const toast  = useToastStore()
const ui     = useUiStore()
const online = ref(false)

const initials = computed(() =>
  auth.userName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
)

function logout() {
  auth.logout()
  toast.success('Déconnexion réussie')
  router.push('/login')
}

onMounted(async () => {
  try { await api.get('/health'); online.value = true }
  catch { online.value = false }
})
</script>

<style scoped>
.sidebar {
  position: fixed; left: 0; top: 0; bottom: 0;
  width: var(--sidebar-width);
  background: var(--bg-sidebar);
  border-right: 1px solid var(--border);
  display: flex; flex-direction: column;
  z-index: 200;
  transition: width var(--transition-slow);
  overflow: hidden;
}
.sidebar.collapsed { width: var(--sidebar-collapsed-width); }

.sidebar-logo {
  padding: 18px 14px 14px;
  display: flex; align-items: center; gap: 10px;
  border-bottom: 1px solid var(--border);
}
.logo-icon svg { width: 44px; height: 44px; flex-shrink: 0; }
.logo-text { flex: 1; min-width: 0; }
.logo-name { font-family: var(--font-display); font-size: 1.05rem; font-weight: 800; color: var(--text-primary); line-height: 1; }
.logo-sub  { font-family: var(--font-display); font-size: 0.78rem; color: var(--gold); letter-spacing: 1.5px; text-transform: uppercase; }
.collapse-btn {
  width: 24px; height: 24px;
  background: rgba(255,255,255,0.05); border: 1px solid var(--border); border-radius: 50%;
  color: var(--text-muted); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 1rem; flex-shrink: 0; transition: var(--transition);
}
.collapse-btn:hover { color: var(--gold); border-color: var(--gold); }

.sidebar-status {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 16px; font-size: 0.75rem; color: var(--text-muted);
  border-bottom: 1px solid var(--border);
}
.status-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.status-dot.online  { background: var(--accent-green); box-shadow: 0 0 6px var(--accent-green); }
.status-dot.offline { background: var(--accent-red); }

.sidebar-nav {
  flex: 1; padding: 12px 10px; overflow-y: auto;
  display: flex; flex-direction: column; gap: 2px;
}
.nav-section-label {
  font-size: 0.65rem; font-weight: 700; color: var(--text-muted);
  letter-spacing: 1px; text-transform: uppercase; padding: 12px 8px 4px;
}
.nav-item {
  display: flex; align-items: center; gap: 10px; padding: 10px;
  border-radius: var(--radius-md); color: var(--text-secondary);
  text-decoration: none; font-size: 0.875rem; font-weight: 500;
  transition: var(--transition); position: relative; white-space: nowrap; overflow: hidden;
}
.nav-item:hover { background: rgba(232,184,75,0.07); color: var(--text-primary); }
.nav-item.active { background: rgba(232,184,75,0.12); color: var(--gold); border: 1px solid rgba(232,184,75,0.2); }
.nav-icon { font-size: 1.05rem; flex-shrink: 0; width: 20px; text-align: center; }
.nav-label { flex: 1; }
.nav-tooltip {
  display: none; position: absolute; left: calc(var(--sidebar-collapsed-width) + 8px);
  background: var(--bg-card); border: 1px solid var(--border-gold);
  color: var(--text-primary); padding: 6px 12px; border-radius: var(--radius-sm);
  font-size: 0.8rem; white-space: nowrap; z-index: 300; box-shadow: var(--shadow-md);
  pointer-events: none;
}
.sidebar.collapsed .nav-item:hover .nav-tooltip { display: block; }

.sidebar-user {
  padding: 12px 12px 8px;
  border-top: 1px solid var(--border);
  display: flex; align-items: center; gap: 8px;
}
.user-badge { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
.user-badge-avatar {
  width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, var(--gold), var(--gold-dark));
  display: flex; align-items: center; justify-content: center;
  font-size: 0.72rem; font-weight: 700; color: #1a1a2e;
}
.user-badge-name { font-size: 0.82rem; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.user-badge-role { font-size: 0.68rem; color: var(--gold); text-transform: capitalize; }
.sidebar-logout {
  background: none; border: none; cursor: pointer;
  color: var(--text-muted); font-size: 1rem; padding: 4px;
  border-radius: var(--radius-sm); transition: var(--transition); flex-shrink: 0;
}
.sidebar-logout:hover { color: var(--accent-red); background: rgba(231,76,60,0.1); }

.sidebar-footer { padding: 8px 16px 14px; font-size: 0.7rem; color: var(--text-muted); }
</style>