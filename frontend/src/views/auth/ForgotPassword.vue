<template>
  <div class="auth-page">
    <div class="reset-bg-orb orb-1"></div>
    <div class="reset-bg-orb orb-2"></div>

    <div class="auth-card">
      <div class="auth-logo">
        <div class="auth-logo-icon">
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="36">
            <rect width="48" height="48" rx="12" fill="url(#lgf)"/>
            <text x="24" y="33" font-family="Arial Black" font-size="26" font-weight="900"
              text-anchor="middle" fill="#e8b84b">P</text>
            <defs>
              <linearGradient id="lgf" x1="0" y1="0" x2="48" y2="48">
                <stop offset="0%" stop-color="#1a1a35"/>
                <stop offset="100%" stop-color="#0d0d1a"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div class="auth-logo-name">Parking Manager</div>
        <div class="auth-logo-sub">Mot de passe oublié</div>
      </div>

      <!-- Succès : email envoyé -->
      <div v-if="sent" class="sent-box">
        <div class="sent-envelope">📧</div>
        <h2 class="sent-title">Email envoyé !</h2>
        <p class="sent-desc">
          Si l'adresse <strong>{{ emailSent }}</strong> est associée à un compte,
          vous recevrez un lien de réinitialisation dans quelques instants.
        </p>
        <div class="sent-tips">
          <div class="tip-item">📂 Vérifiez votre dossier <strong>Spams</strong></div>
          <div class="tip-item">⏱ Le lien expire dans <strong>1 heure</strong></div>
        </div>
        <button class="btn btn-secondary w-full" @click="reset" style="justify-content:center;margin-top:16px">
          ← Renvoyer un lien
        </button>
        <div class="auth-footer">
          <router-link to="/login" class="auth-link">Retour à la connexion</router-link>
        </div>
      </div>

      <!-- Formulaire -->
      <template v-else>
        <h2 class="auth-title">Mot de passe oublié ?</h2>
        <p class="auth-subtitle">
          Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
        </p>

        <div v-if="error" class="alert alert-error">⚠️ {{ error }}</div>

        <div class="form-group">
          <label class="form-label">Adresse email</label>
          <div class="email-input-wrapper">
            <span class="email-icon">✉️</span>
            <input
              v-model="email"
              class="form-control email-input"
              type="email"
              placeholder="votre@email.mg"
              @keyup.enter="submit"
              autocomplete="email"
            />
          </div>
        </div>

        <button
          class="btn btn-primary w-full"
          @click="submit"
          :disabled="loading || !email"
          style="justify-content:center;padding:13px;font-size:0.95rem"
        >
          <span v-if="loading" class="loading-spinner"></span>
          <span v-else>📧 Envoyer le lien de réinitialisation</span>
        </button>

        <div class="auth-footer">
          <router-link to="/login" class="auth-link">← Retour à la connexion</router-link>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import api from '@/utils/api.js'

const email     = ref('')
const emailSent = ref('')
const error     = ref('')
const sent      = ref(false)
const loading   = ref(false)

async function submit() {
  if (!email.value) { error.value = 'Veuillez entrer votre email.'; return }
  loading.value = true; error.value = ''
  try {
    await api.post('/auth/forgot-password', { email: email.value })
    emailSent.value = email.value
    sent.value = true
  } catch (e) {
    // On affiche toujours le succès pour ne pas révéler si l'email existe
    emailSent.value = email.value
    sent.value = true
  } finally {
    loading.value = false
  }
}

function reset() {
  sent.value = false
  email.value = ''
  emailSent.value = ''
}
</script>

<style scoped>
.reset-bg-orb {
  position: absolute; border-radius: 50%;
  pointer-events: none; filter: blur(80px); opacity: 0.4;
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

/* Email input */
.email-input-wrapper { position: relative; }
.email-icon {
  position: absolute; left: 12px; top: 50%;
  transform: translateY(-50%); font-size: 1rem; pointer-events: none;
}
.email-input { padding-left: 38px; }

/* Sent state */
.sent-box { text-align: center; }
.sent-envelope {
  font-size: 4rem;
  margin-bottom: 16px;
  animation: float 2s ease-in-out infinite;
}
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-8px); }
}
.sent-title {
  font-family: var(--font-display);
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--accent-green);
  margin-bottom: 10px;
}
.sent-desc {
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 20px;
}
.sent-tips {
  background: rgba(232,184,75,0.06);
  border: 1px solid rgba(232,184,75,0.15);
  border-radius: var(--radius-md);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: left;
}
.tip-item {
  font-size: 0.82rem;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>