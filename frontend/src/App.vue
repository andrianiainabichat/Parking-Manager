<template>
  <div>
    <template v-if="!auth.isAuthenticated">
      <router-view />
    </template>

    <template v-else>
      <div class="app-layout">
        <Sidebar />
        <div
          class="main-content"
          :style="{ marginLeft: ui.sidebarCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)' }"
        >
          <Topbar />
          <router-view v-slot="{ Component }">
            <transition name="page" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </div>
    </template>

    <ToastContainer />
  </div>
</template>

<script setup>
import { useAuthStore } from '@/store/auth.js'
import { useUiStore }   from '@/store/ui.js'
import Sidebar from '@/components/layout/Sidebar.vue'
import Topbar from '@/components/layout/Topbar.vue'
import ToastContainer from '@/components/layout/ToastContainer.vue'

const auth = useAuthStore()
const ui   = useUiStore()
</script>

<style>
.page-enter-active, .page-leave-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.page-enter-from { opacity: 0; transform: translateY(8px); }
.page-leave-to   { opacity: 0; transform: translateY(-8px); }
</style>