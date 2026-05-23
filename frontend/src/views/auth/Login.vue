<template>
  <div class="auth-page">
    <div class="auth-card">
      <!-- Logo -->
      <div class="auth-logo">
        <!-- Indicateur réveil serveur -->
        <div v-if="waking" class="waking-box">
          <span class="loading-spinner"></span>
          <span>Démarrage du serveur en cours<span class="dots">...</span></span>
        </div>
        <div class="auth-logo-icon">🅿️</div>
        <div class="auth-logo-name">Parking Manager</div>
        <div class="auth-logo-sub">Système de gestion</div>
      </div>

      <h2 class="auth-title">Connexion</h2>
      <p class="auth-subtitle">Accédez à votre espace de gestion</p>

      <div v-if="error" class="alert alert-error">⚠️ {{ error }}</div>

      <div class="form-group">
        <label class="form-label">Adresse email</label>
        <input
          v-model="form.email"
          class="form-control"
          type="email"
          placeholder="votre@email.mg"
          @keyup.enter="submit"
          autocomplete="email"
        />
      </div>

      <div class="form-group">
        <label class="form-label">Mot de passe</label>
        <div class="password-wrapper">
          <input
            v-model="form.password"
            class="form-control"
            :type="showPwd ? 'text' : 'password'"
            placeholder="••••••••"
            @keyup.enter="submit"
            autocomplete="current-password"
          />
          <button class="password-toggle" @click="showPwd = !showPwd" type="button">
            {{ showPwd ? '🙈' : '👁️' }}
          </button>
        </div>
      </div>

      <div style="text-align:right;margin-bottom:20px">
        <router-link to="/forgot-password" class="auth-link">
          Mot de passe oublié ?
        </router-link>
      </div>

      <button class="btn btn-primary w-full" @click="submit" :disabled="loading" style="justify-content:center;padding:12px">
        <span v-if="loading" class="loading-spinner"></span>
        <span v-else>Se connecter</span>
      </button>

      <div class="auth-footer">
        Pas encore de compte ?
        <router-link to="/register" class="auth-link">Créer un compte</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.waking-box {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(243,156,18,0.1);
  border: 1px solid rgba(243,156,18,0.3);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  font-size: 0.82rem;
  color: var(--accent-orange);
  margin-bottom: 16px;
}

.dots {
  animation: blink 1.2s steps(3, end) infinite;
}

@keyframes blink {
  0%  { content: ''; }
  33% { content: '.'; }
  66% { content: '..'; }
  100%{ content: '...'; }
}
</style>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth.js'
import { useToastStore } from '@/store/toast.js'
import api from '@/utils/api.js'

const router  = useRouter()
const auth    = useAuthStore()
const toast   = useToastStore()
const form    = ref({ email: '', password: '' })
const error   = ref('')
const loading = ref(false)
const showPwd = ref(false)
const waking  = ref(false) // ← serveur en cours de réveil

// Au chargement de la page, on "réveille" le serveur en avance
onMounted(async () => {
  try {
    waking.value = true
    await api.get('/health')
  } catch {
    // ignore
  } finally {
    waking.value = false
  }
})

async function submit() {
  if (!form.value.email || !form.value.password) {
    error.value = 'Veuillez remplir tous les champs.'; return
  }
  loading.value = true; error.value = ''
  try {
    const r = await api.post('/auth/login', form.value)
    auth.setAuth(r.data.token, r.data.user)
    toast.success(`Bienvenue, ${r.data.user.nom} !`)
    router.push('/')
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>