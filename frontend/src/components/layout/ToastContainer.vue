<template>
  <div class="toast-container">
    <transition-group name="toast-anim">
      <div
        v-for="t in toastStore.toasts"
        :key="t.id"
        class="toast"
        :class="`toast-${t.type}`"
        @click="toastStore.remove(t.id)"
      >
        <span class="toast-icon">
          {{ t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ' }}
        </span>
        <span class="toast-msg">{{ t.message }}</span>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { useToastStore } from '@/store/toast.js'
const toastStore = useToastStore()
</script>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}

.toast {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 13px 18px;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: var(--shadow-lg);
  pointer-events: auto;
  cursor: pointer;
  max-width: 340px;
  min-width: 220px;
}

.toast-success { border-color: rgba(46,204,113,0.5); }
.toast-success .toast-icon { color: var(--accent-green); font-weight: 700; }
.toast-error { border-color: rgba(231,76,60,0.5); }
.toast-error .toast-icon { color: var(--accent-red); font-weight: 700; }
.toast-info { border-color: rgba(52,152,219,0.5); }
.toast-info .toast-icon { color: var(--accent-blue); font-weight: 700; }

.toast-icon { font-size: 1rem; flex-shrink: 0; }
.toast-msg { color: var(--text-primary); flex: 1; }

.toast-anim-enter-active { transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1); }
.toast-anim-leave-active { transition: all 0.2s ease; }
.toast-anim-enter-from { opacity: 0; transform: translateX(60px); }
.toast-anim-leave-to { opacity: 0; transform: translateX(60px); }
</style>
