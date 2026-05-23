<template>
  <div class="auth-page">
    <!-- Fond animé -->
    <div class="reset-bg-orb orb-1"></div>
    <div class="reset-bg-orb orb-2"></div>
    <div class="reset-bg-orb orb-3"></div>

    <div class="auth-card reset-card">
      <!-- Logo -->
      <div class="auth-logo">
        <div class="auth-logo-icon">
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="36">
            <rect width="48" height="48" rx="12" fill="url(#lgr)"/>
            <text x="24" y="33" font-family="Arial Black" font-size="26" font-weight="900"
              text-anchor="middle" fill="#e8b84b">P</text>
            <defs>
              <linearGradient id="lgr" x1="0" y1="0" x2="48" y2="48">
                <stop offset="0%" stop-color="#1a1a35"/>
                <stop offset="100%" stop-color="#0d0d1a"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div class="auth-logo-name">Parking Manager</div>
        <div class="auth-logo-sub">Réinitialisation</div>
      </div>

      <!-- État : token invalide -->
      <div v-if="!token" class="state-box state-error">
        <div class="state-icon">⚠️</div>
        <div class="state-title">Lien invalide</div>
        <p class="state-desc">Ce lien de réinitialisation est invalide ou manquant.</p>
        <router-link to="/forgot-password" class="btn btn-primary w-full" style="justify-content:center;margin-top:8px">
          Redemander un lien
        </router-link>
      </div>

      <!-- État : succès -->
      <div v-else-if="success" class="state-box state-success">
        <div class="state-icon">✅</div>
        <div class="state-title">Mot de passe modifié !</div>
        <p class="state-desc">Votre mot de passe a été réinitialisé avec succès.</p>
        <router-link to="/login" class="btn btn-primary w-full" style="justify-content:center;margin-top:12px">
          Se connecter maintenant →
        </router-link>
      </div>

      <!-- Formulaire de reset -->
      <template v-else>
        <h2 class="auth-title">Nouveau mot de passe</h2>
        <p class="auth-subtitle">Choisissez un mot de passe sécurisé pour votre compte</p>

        <div v-if="error" class="alert alert-error">⚠️ {{ error }}</div>

        <!-- Indicateur de force -->
        <div class="form-group">
          <label class="form-label">Nouveau mot de passe *</label>
          <div class="password-wrapper">
            <input
              v-model="form.password"
              class="form-control"
              :type="showPwd ? 'text' : 'password'"
              placeholder="••••••••"
              @input="checkStrength"
              @keyup.enter="submit"
              autocomplete="new-password"
            />
            <button class="password-toggle" @click="showPwd = !showPwd" type="button">
              {{ showPwd ? '🙈' : '👁️' }}
            </button>
          </div>
          <!-- Barre de force -->
          <div class="strength-bar" v-if="form.password">
            <div class="strength-track">
              <div class="strength-fill" :class="strengthClass" :style="{ width: strengthWidth }"></div>
            </div>
            <span class="strength-label" :class="strengthClass">{{ strengthLabel }}</span>
          </div>
          <!-- Critères -->
          <ul class="pwd-criteria" v-if="form.password">
            <li :class="{ met: form.password.length >= 6 }">
              <span>{{ form.password.length >= 6 ? '✓' : '○' }}</span> Au moins 6 caractères
            </li>
            <li :class="{ met: /[A-Z]/.test(form.password) }">
              <span>{{ /[A-Z]/.test(form.password) ? '✓' : '○' }}</span> Une majuscule
            </li>
            <li :class="{ met: /[0-9]/.test(form.password) }">
              <span>{{ /[0-9]/.test(form.password) ? '✓' : '○' }}</span> Un chiffre
            </li>
            <li :class="{ met: /[^A-Za-z0-9]/.test(form.password) }">
              <span>{{ /[^A-Za-z0-9]/.test(form.password) ? '✓' : '○' }}</span> Un caractère spécial
            </li>
          </ul>
        </div>

        <div class="form-group">
          <label class="form-label">Confirmer le mot de passe *</label>
          <div class="password-wrapper">
            <input
              v-model="form.confirm"
              class="form-control"
              :type="showConfirm ? 'text' : 'password'"
              placeholder="••••••••"
              @keyup.enter="submit"
              autocomplete="new-password"
              :class="{ 'input-match': form.confirm && form.confirm === form.password,
                        'input-mismatch': form.confirm && form.confirm !== form.password }"
            />
            <button class="password-toggle" @click="showConfirm = !showConfirm" type="button">
              {{ showConfirm ? '🙈' : '👁️' }}
            </button>
          </div>
          <div v-if="form.confirm && form.confirm !== form.password" class="form-error">
            ✕ Les mots de passe ne correspondent pas
          </div>
          <div v-if="form.confirm && form.confirm === form.password" class="form-match">
            ✓ Les mots de passe correspondent
          </div>
        </div>

        <button
          class="btn btn-primary w-full"
          @click="submit"
          :disabled="loading || !canSubmit"
          style="justify-content:center;padding:13px;font-size:0.95rem;margin-top:4px"
        >
          <span v-if="loading" class="loading-spinner"></span>
          <span v-else>🔑 Réinitialiser le mot de passe</span>
        </button>

        <div class="auth-footer">
          <router-link to="/login" class="auth-link">← Retour à la connexion</router-link>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/utils/api.js'

const route       = useRoute()
const token       = ref('')
const form        = ref({ password: '', confirm: '' })
const error       = ref('')
const success     = ref(false)
const loading     = ref(false)
const showPwd     = ref(false)
const showConfirm = ref(false)
const strengthScore = ref(0)

onMounted(() => {
  token.value = route.query.token || ''
})

function checkStrength() {
  const p = form.value.password
  let score = 0
  if (p.length >= 6)              score++
  if (p.length >= 10)             score++
  if (/[A-Z]/.test(p))           score++
  if (/[0-9]/.test(p))           score++
  if (/[^A-Za-z0-9]/.test(p))   score++
  strengthScore.value = score
}

const strengthClass = computed(() => {
  if (strengthScore.value <= 1) return 'weak'
  if (strengthScore.value <= 3) return 'medium'
  return 'strong'
})
const strengthLabel = computed(() => {
  if (strengthScore.value <= 1) return 'Faible'
  if (strengthScore.value <= 3) return 'Moyen'
  return 'Fort'
})
const strengthWidth = computed(() => {
  return Math.min(100, (strengthScore.value / 5) * 100) + '%'
})

const canSubmit = computed(() =>
  form.value.password.length >= 6 &&
  form.value.password === form.value.confirm
)

async function submit() {
  if (!canSubmit.value) return
  error.value = ''
  loading.value = true
  try {
    await api.post('/auth/reset-password', {
      token: token.value,
      password: form.value.password
    })
    success.value = true
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* Orbs de fond */
.reset-bg-orb {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(80px);
  opacity: 0.4;
}
.orb-1 {
  width: 500px; height: 500px;
  background: radial-gradient(circle, rgba(232,184,75,0.08), transparent 70%);
  top: -150px; right: -150px;
}
.orb-2 {
  width: 350px; height: 350px;
  background: radial-gradient(circle, rgba(52,152,219,0.06), transparent 70%);
  bottom: -100px; left: -100px;
}
.orb-3 {
  width: 200px; height: 200px;
  background: radial-gradient(circle, rgba(46,204,113,0.05), transparent 70%);
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
}

.reset-card { border-color: var(--border-gold); }

/* États */
.state-box {
  text-align: center;
  padding: 10px 0 6px;
}
.state-icon { font-size: 3rem; margin-bottom: 12px; }
.state-title {
  font-family: var(--font-display);
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 8px;
}
.state-desc { font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 4px; }
.state-error .state-title { color: var(--accent-red); }
.state-success .state-title { color: var(--accent-green); }

/* Barre de force */
.strength-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
}
.strength-track {
  flex: 1;
  height: 5px;
  background: rgba(255,255,255,0.08);
  border-radius: 3px;
  overflow: hidden;
}
.strength-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease, background 0.3s ease;
}
.strength-fill.weak   { background: var(--accent-red); }
.strength-fill.medium { background: var(--accent-orange); }
.strength-fill.strong { background: var(--accent-green); }
.strength-label {
  font-size: 0.75rem;
  font-weight: 600;
  width: 44px;
  text-align: right;
}
.strength-label.weak   { color: var(--accent-red); }
.strength-label.medium { color: var(--accent-orange); }
.strength-label.strong { color: var(--accent-green); }

/* Critères mot de passe */
.pwd-criteria {
  list-style: none;
  margin-top: 10px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 5px 12px;
}
.pwd-criteria li {
  font-size: 0.75rem;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 5px;
  transition: color 0.2s ease;
}
.pwd-criteria li.met { color: var(--accent-green); }
.pwd-criteria li span { font-size: 0.7rem; width: 12px; flex-shrink: 0; }

/* Match / mismatch */
.input-match   { border-color: var(--accent-green) !important; }
.input-mismatch { border-color: var(--accent-red) !important; }
.form-match {
  font-size: 0.78rem;
  color: var(--accent-green);
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>