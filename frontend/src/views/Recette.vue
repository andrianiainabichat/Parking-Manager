<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h1 class="page-title"><div class="title-icon">📊</div>Recette & Rapports</h1>
        <p class="page-subtitle">Statistiques financières et génération de relevés PDF</p>
      </div>
      <button class="btn btn-secondary" @click="loadRecette" :disabled="loading">↻ Actualiser</button>
    </div>

    <!-- Global stats -->
    <div class="stat-grid" v-if="recette">
      <div class="stat-card">
        <div class="stat-icon gold">💰</div>
        <div class="stat-info">
          <div class="stat-value">{{ formatAriary(recette.global?.recetteTotale) }}</div>
          <div class="stat-label">Recette totale (Ar)</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon blue">📋</div>
        <div class="stat-info">
          <div class="stat-value">{{ recette.global?.nbSorties ?? 0 }}</div>
          <div class="stat-label">Total des sorties</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green">📈</div>
        <div class="stat-info">
          <div class="stat-value">{{ formatAriary(recette.global?.moyennePaiement) }}</div>
          <div class="stat-label">Moyenne / paiement (Ar)</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon orange">⏱</div>
        <div class="stat-info">
          <div class="stat-value">{{ formatDuree(recette.global?.moyenneDuree) }}</div>
          <div class="stat-label">Durée moyenne</div>
        </div>
      </div>
    </div>

    <!-- Chart par mois -->
    <div class="card" style="margin-bottom:20px" v-if="recette?.parMois?.length">
      <div class="card-header"><span class="card-title">📊 Recette mensuelle</span></div>
      <div class="card-body">
        <div v-for="m in [...(recette.parMois || [])].reverse()" :key="m.mois" style="margin-bottom:14px">
          <div style="display:flex;justify-content:space-between;font-size:0.83rem;margin-bottom:5px">
            <span style="color:var(--text-secondary);text-transform:capitalize">{{ formatMois(m.mois) }}</span>
            <span style="display:flex;gap:14px">
              <span class="text-muted text-xs">{{ m.nb }} sorties</span>
              <span style="color:var(--gold);font-weight:600">{{ formatAriary(m.total) }} Ar</span>
            </span>
          </div>
          <div class="progress-bar-wrapper">
            <div class="progress-bar-fill" :style="{ width: barWidth(m.total) + '%' }"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- PDF Generator -->
    <div class="card">
      <div class="card-header">
        <span class="card-title">📄 Générer un relevé de stationnement (PDF)</span>
      </div>
      <div class="card-body">
        <div class="pdf-form">
          <div class="form-group" style="flex:1">
            <label class="form-label">Véhicule *</label>
            <select v-model="pdfForm.idVoiture" class="form-control">
              <option value="">-- Sélectionner un véhicule --</option>
              <option v-for="v in voitures" :key="v.idVoiture" :value="v.idVoiture">
                {{ v.matricule }} — {{ v.marque }} ({{ v.nomClient }})
              </option>
            </select>
          </div>
          <div class="form-group" style="width:180px">
            <label class="form-label">Mois *</label>
            <input type="month" v-model="pdfForm.mois" class="form-control" />
          </div>
          <div class="form-group" style="align-self:flex-end;padding-bottom:18px">
            <button
              class="btn btn-primary"
              @click="downloadPdf"
              :disabled="pdfLoading || !pdfForm.idVoiture || !pdfForm.mois"
            >
              <span v-if="pdfLoading" class="loading-spinner"></span>
              <span v-else>📥</span>
              Télécharger le relevé
            </button>
          </div>
        </div>

        <div class="pdf-preview-info">
          <div class="preview-title">📋 Contenu du relevé PDF</div>
          <div class="preview-items">
            <div class="preview-item">✓ Informations du client et du véhicule</div>
            <div class="preview-item">✓ Tableau détaillé des entrées/sorties du mois</div>
            <div class="preview-item">✓ Durée de chaque stationnement</div>
            <div class="preview-item">✓ Montant payé par session</div>
            <div class="preview-item">✓ Total mensuel</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/utils/api.js'
import { useAuthStore } from '@/store/auth.js'
import { useToastStore } from '@/store/toast.js'

const toast   = useToastStore()
const auth    = useAuthStore()
const recette = ref(null)
const voitures = ref([])
const loading  = ref(false)
const pdfLoading = ref(false)
const pdfForm = ref({ idVoiture: '', mois: new Date().toISOString().slice(0, 7) })

function formatAriary(v) {
  return v ? parseInt(v).toLocaleString('fr-FR') : '0'
}
function formatDuree(min) {
  if (!min) return '—'
  const h = Math.floor(min / 60); const m = min % 60
  return h > 0 ? `${h}h${m > 0 ? m + 'min' : ''}` : `${m}min`
}
function formatMois(m) {
  if (!m) return ''
  const [y, mo] = m.split('-')
  return new Date(y, mo - 1).toLocaleString('fr-FR', { month: 'long', year: 'numeric' })
}
function barWidth(val) {
  if (!recette.value?.parMois?.length) return 0
  const max = Math.max(...recette.value.parMois.map(m => m.total))
  return max ? Math.round((val / max) * 100) : 0
}

async function loadRecette() {
  loading.value = true
  try {
    const r = await api.get('/sorties/recette')
    recette.value = r.data.data
  } catch (e) { toast.error(e.message) }
  finally { loading.value = false }
}

async function loadVoitures() {
  const r = await api.get('/voitures')
  voitures.value = r.data.data
}

async function downloadPdf() {
  if (!pdfForm.value.idVoiture || !pdfForm.value.mois) return
  pdfLoading.value = true
  try {
    const url = `/api/sorties/releve/pdf?idVoiture=${pdfForm.value.idVoiture}&mois=${pdfForm.value.mois}`

    // ✅ Utiliser fetch avec le token JWT dans le header Authorization
    const r = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${auth.token}`
      }
    })

    if (!r.ok) {
      const json = await r.json().catch(() => ({ message: 'Erreur PDF' }))
      throw new Error(json.message || 'Erreur lors de la génération du PDF')
    }

    const blob = await r.blob()
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    const v = voitures.value.find(v => v.idVoiture === pdfForm.value.idVoiture)
    link.download = `releve_${pdfForm.value.mois}_${(v?.matricule || 'voiture').replace(' ', '_')}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)
    toast.success('Relevé PDF téléchargé !')
  } catch (e) {
    toast.error(e.message)
  } finally {
    pdfLoading.value = false
  }
}

onMounted(() => { loadRecette(); loadVoitures() })
</script>

<style scoped>
.pdf-form {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  flex-wrap: wrap;
  margin-bottom: 24px;
}
.pdf-preview-info {
  background: rgba(232,184,75,0.05);
  border: 1px solid rgba(232,184,75,0.2);
  border-radius: var(--radius-md);
  padding: 16px 20px;
}
.preview-title {
  font-family: var(--font-display);
  font-weight: 600;
  color: var(--gold);
  margin-bottom: 12px;
  font-size: 0.9rem;
}
.preview-items { display: flex; flex-wrap: wrap; gap: 8px 24px; }
.preview-item { font-size: 0.82rem; color: var(--text-secondary); }
</style>