<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-logo">
        <div class="auth-logo-icon">🅿️</div>
        <div class="auth-logo-name">Parking Manager</div>
        <div class="auth-logo-sub">Système de gestion</div>
      </div>

      <h2 class="auth-title">Créer un compte</h2>
      <p class="auth-subtitle">Rejoignez le système de gestion</p>

      <div v-if="error" class="alert alert-error">⚠️ {{ error }}</div>
      <div v-if="success" class="alert alert-success">✓ {{ success }}</div>

      <div class="form-group">
        <label class="form-label">Nom complet *</label>
        <input v-model="form.nom" class="form-control" placeholder="Ex : RAKOTO Jean" @keyup.enter="submit" />
      </div>

      <div class="form-group">
        <label class="form-label">Adresse email *</label>
        <input v-model="form.email" class="form-control" type="email" placeholder="votre@email.mg" @keyup.enter="submit" />
      </div>

      <div class="form-group">
        <label class="form-label">Rôle *</label>
        <select v-model="form.role" class="form-control">
          <option value="agent">Agent de parking</option>
          <option value="admin">Administrateur</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Mot de passe * <span class="text-muted text-xs">(min. 6 caractères)</span></label>
        <div class="password-wrapper">
          <input
            v-model="form.password"
            class="form-control"
            :type="showPwd ? 'text' : 'password'"
            placeholder="••••••••"
            @keyup.enter="submit"
          />
          <button class="password-toggle" @click="showPwd = !showPwd" type="button">
            {{ showPwd ? '🙈' : '👁️' }}
          </button>
        </div>
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
          />
          <button class="password-toggle" @click="showConfirm = !showConfirm" type="button">
            {{ showConfirm ? '🙈' : '👁️' }}
          </button>
        </div>
      </div>

      <button class="btn btn-primary w-full" @click="submit" :disabled="loading" style="justify-content:center;padding:12px">
        <span v-if="loading" class="loading-spinner"></span>
        <span v-else>Créer le compte</span>
      </button>

      <div class="auth-footer">
        Déjà un compte ?
        <router-link to="/login" class="auth-link">Se connecter</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth.js'
import { useToastStore } from '@/store/toast.js'
import api from '@/utils/api.js'

const router  = useRouter()
const auth    = useAuthStore()
const toast   = useToastStore()
const form    = ref({ nom: '', email: '', password: '', confirm: '', role: 'agent' })
const error   = ref('')
const success = ref('')
const loading = ref(false)
const showPwd     = ref(false)
const showConfirm = ref(false)

async function submit() {
  error.value = ''; success.value = ''
  if (!form.value.nom || !form.value.email || !form.value.password) {
    error.value = 'Veuillez remplir tous les champs obligatoires.'; return
  }
  if (form.value.password !== form.value.confirm) {
    error.value = 'Les mots de passe ne correspondent pas.'; return
  }
  if (form.value.password.length < 6) {
    error.value = 'Le mot de passe doit contenir au moins 6 caractères.'; return
  }
  loading.value = true
  try {
    const r = await api.post('/auth/register', {
      nom: form.value.nom,
      email: form.value.email,
      password: form.value.password,
      role: form.value.role
    })
    auth.setAuth(r.data.token, r.data.user)
    toast.success(`Compte créé ! Bienvenue, ${r.data.user.nom}`)
    router.push('/')
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>
