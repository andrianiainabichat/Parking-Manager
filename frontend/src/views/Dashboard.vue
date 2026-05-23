<template>
  <div class="page-container">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">
          <div class="title-icon">⊞</div>
          Tableau de Bord
        </h1>
        <p class="page-subtitle">Vue d'ensemble du parking en temps réel</p>
      </div>
      <button class="btn btn-secondary" @click="load" :disabled="loading">
        <span v-if="loading" class="loading-spinner"></span>
        <span v-else>↻</span>
        Actualiser
      </button>
    </div>

    <!-- Stat Cards -->
    <div class="stat-grid" v-if="stats">
      <div class="stat-card">
        <div class="stat-icon green">🚗</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.vehiculesPresents?.length ?? 0 }}</div>
          <div class="stat-label">Véhicules présents</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon gold">🅿️</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.placesLibres }}</div>
          <div class="stat-label">Places libres / {{ stats.placesTotal }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon blue">👤</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.clients }}</div>
          <div class="stat-label">Clients enregistrés</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon orange">💰</div>
        <div class="stat-info">
          <div class="stat-value">{{ formatAriary(stats.recetteTotale) }}</div>
          <div class="stat-label">Recette totale</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green">⬇️</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.entreesAujourdhui }}</div>
          <div class="stat-label">Entrées aujourd'hui</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon red">⬆️</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.sortiesAujourdhui }}</div>
          <div class="stat-label">Sorties aujourd'hui</div>
        </div>
      </div>
    </div>

    <!-- Occupation bar -->
    <div class="card" style="margin-bottom:20px" v-if="stats">
      <div class="card-header">
        <span class="card-title">🅿️ Taux d'occupation</span>
        <span class="badge" :class="occupationRate > 80 ? 'badge-danger' : occupationRate > 50 ? 'badge-warning' : 'badge-success'">
          {{ occupationRate }}%
        </span>
      </div>
      <div class="card-body" style="padding-top:16px;padding-bottom:20px">
        <div style="display:flex;justify-content:space-between;font-size:0.8rem;color:var(--text-muted);margin-bottom:8px">
          <span>{{ stats.placesOccupees }} occupées</span>
          <span>{{ stats.placesLibres }} libres</span>
        </div>
        <div class="progress-bar-wrapper">
          <div class="progress-bar-fill" :style="{ width: occupationRate + '%' }"></div>
        </div>
      </div>
    </div>

    <div class="dash-grid">
      <!-- Véhicules présents -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">🚗 Véhicules actuellement dans le parking</span>
          <span class="badge badge-info">{{ stats?.vehiculesPresents?.length ?? 0 }}</span>
        </div>
        <div class="table-wrapper">
          <table v-if="stats?.vehiculesPresents?.length">
            <thead>
              <tr>
                <th>Véhicule</th>
                <th>Client</th>
                <th>Place</th>
                <th>Depuis</th>
                <th>Durée</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="v in stats.vehiculesPresents" :key="v.idEntree">
                <td>
                  <div style="font-weight:600">{{ v.marque }}</div>
                  <div class="text-sm text-muted">{{ v.matricule }}</div>
                </td>
                <td>{{ v.nomClient }}</td>
                <td><span class="badge badge-gold">N°{{ v.numeroPlace }}</span></td>
                <td>{{ formatDateTime(v.dateEntree) }}</td>
                <td><span class="badge badge-info">{{ dureeDepuis(v.dateEntree) }}</span></td>
              </tr>
            </tbody>
          </table>
          <div class="empty-state" v-else>
            <div class="empty-icon">🅿️</div>
            <div class="empty-text">Aucun véhicule dans le parking</div>
          </div>
        </div>
      </div>

      <!-- Recette par mois -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">📊 Recette des 6 derniers mois</span>
        </div>
        <div class="card-body">
          <div v-if="stats?.recetteMois?.length">
            <div
              v-for="m in stats.recetteMois.slice().reverse()"
              :key="m.mois"
              style="margin-bottom:12px"
            >
              <div style="display:flex;justify-content:space-between;font-size:0.82rem;margin-bottom:4px">
                <span style="color:var(--text-secondary)">{{ formatMois(m.mois) }}</span>
                <span style="color:var(--gold);font-weight:600">{{ formatAriary(m.total) }} Ar</span>
              </div>
              <div class="progress-bar-wrapper">
                <div class="progress-bar-fill" :style="{ width: barWidth(m.total) + '%' }"></div>
              </div>
            </div>
          </div>
          <div class="empty-state" v-else>
            <div class="empty-icon">📊</div>
            <div class="empty-text">Aucune donnée disponible</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/utils/api.js'

const stats = ref(null)
const loading = ref(false)

const occupationRate = computed(() => {
  if (!stats.value) return 0
  return stats.value.placesTotal ? Math.round((stats.value.placesOccupees / stats.value.placesTotal) * 100) : 0
})

function formatAriary(v) {
  if (!v) return '0'
  return parseInt(v).toLocaleString('fr-FR')
}

function formatDateTime(d) {
  if (!d) return '-'
  return new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function formatMois(m) {
  if (!m) return ''
  const [y, mo] = m.split('-')
  return new Date(y, mo - 1).toLocaleString('fr-FR', { month: 'long', year: 'numeric' })
}

function dureeDepuis(d) {
  const diff = Date.now() - new Date(d).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 60) return `${min}min`
  const h = Math.floor(min / 60); const m = min % 60
  return `${h}h${m > 0 ? m + 'min' : ''}`
}

function barWidth(val) {
  if (!stats.value?.recetteMois?.length) return 0
  const max = Math.max(...stats.value.recetteMois.map(m => m.total))
  return max ? Math.round((val / max) * 100) : 0
}

async function load() {
  loading.value = true
  try {
    const r = await api.get('/dashboard')
    stats.value = r.data.data
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

onMounted(load)
</script>

<style scoped>
.dash-grid {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 20px;
}
@media (max-width: 900px) {
  .dash-grid { grid-template-columns: 1fr; }
}
</style>
