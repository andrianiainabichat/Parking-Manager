<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h1 class="page-title"><div class="title-icon">⬆️</div>Sorties</h1>
        <p class="page-subtitle">Historique des sorties et paiements</p>
      </div>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <div class="search-bar">
          <span class="search-icon">📅</span>
          <input type="date" v-model="filterDate" @change="load"
            class="form-control" style="border:none;background:none;width:160px;padding:9px 0" />
        </div>
        <button class="btn btn-secondary btn-sm" v-if="filterDate" @click="filterDate='';load()">✕ Effacer</button>
        <button class="btn btn-success" @click="openSortieModal">⬆️ Enregistrer une sortie</button>
      </div>
    </div>

    <!-- Summary cards -->
    <div class="stat-grid" style="margin-bottom:20px" v-if="sorties.length">
      <div class="stat-card">
        <div class="stat-icon green">⬆️</div>
        <div class="stat-info">
          <div class="stat-value">{{ sorties.length }}</div>
          <div class="stat-label">Sorties{{ filterDate ? ' ce jour' : '' }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon gold">💰</div>
        <div class="stat-info">
          <div class="stat-value">{{ totalMontant.toLocaleString('fr-FR') }}</div>
          <div class="stat-label">Ar collectés</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon blue">⏱</div>
        <div class="stat-info">
          <div class="stat-value">{{ formatDuree(moyenneDuree) }}</div>
          <div class="stat-label">Durée moyenne</div>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="card">
      <div class="table-wrapper">
        <div v-if="loading" style="text-align:center;padding:40px"><span class="loading-spinner"></span></div>
        <table v-else-if="sorties.length">
          <thead>
            <tr>
              <th>Date sortie</th>
              <th>Véhicule</th>
              <th>Client</th>
              <th>Place</th>
              <th>Entrée</th>
              <th>Durée</th>
              <th>Montant</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in sorties" :key="s.idSortie">
              <td>
                <div style="font-weight:600;font-size:0.85rem">{{ formatDate(s.dateSortie) }}</div>
                <div class="text-xs text-muted">{{ formatHeure(s.dateSortie) }}</div>
              </td>
              <td>
                <div style="font-weight:600">{{ s.marque }}</div>
                <div class="text-xs text-muted">{{ s.matricule }}</div>
              </td>
              <td>{{ s.nomClient }}</td>
              <td><span class="badge badge-gold">N° {{ s.numeroPlace }}</span></td>
              <td class="text-xs text-muted">{{ formatHeure(s.dateEntree) }}</td>
              <td><span class="badge badge-info">⏱ {{ formatDuree(s.duree) }}</span></td>
              <td><span class="montant-cell">{{ parseInt(s.montant).toLocaleString('fr-FR') }} Ar</span></td>
              <td>
                <button class="btn btn-danger btn-icon btn-sm" @click="openDelete(s)" title="Supprimer">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="empty-state" v-else>
          <div class="empty-icon">⬆️</div>
          <div class="empty-text">Aucune sortie enregistrée{{ filterDate ? ' pour cette date' : '' }}</div>
        </div>
      </div>
    </div>

    <!-- Modal : Enregistrer une sortie depuis Sorties.vue -->
    <Teleport to="body">
      <div class="modal-overlay" v-if="showSortieModal" @click.self="showSortieModal=false">
        <div class="modal">
          <div class="modal-header">
            <div class="modal-title"><div class="modal-icon">⬆️</div>Enregistrer une sortie</div>
            <button class="modal-close" @click="showSortieModal=false">✕</button>
          </div>
          <div class="modal-body">
            <div v-if="sortieError" class="alert alert-error">⚠️ {{ sortieError }}</div>
            <div class="form-group">
              <label class="form-label">Véhicule présent dans le parking *</label>
              <select v-model="selectedEntree" class="form-control">
                <option value="">-- Sélectionner un véhicule --</option>
                <option v-for="e in entreesActives" :key="e.idEntree" :value="e.idEntree">
                  {{ e.matricule }} — {{ e.marque }} | {{ e.nomClient }} | Place N°{{ e.numeroPlace }}
                  (depuis {{ formatHeure(e.dateEntree) }})
                </option>
              </select>
            </div>
            <div v-if="selectedEntreeData" class="entree-preview">
              <div class="preview-row">
                <span>🚗 Véhicule</span>
                <span>{{ selectedEntreeData.marque }} — {{ selectedEntreeData.matricule }}</span>
              </div>
              <div class="preview-row">
                <span>👤 Client</span>
                <span>{{ selectedEntreeData.nomClient }}</span>
              </div>
              <div class="preview-row">
                <span>📍 Place</span>
                <span>N° {{ selectedEntreeData.numeroPlace }}</span>
              </div>
              <div class="preview-row">
                <span>🕐 Entrée</span>
                <span>{{ formatDateTime(selectedEntreeData.dateEntree) }}</span>
              </div>
              <div class="preview-row highlight">
                <span>⏱ Durée actuelle</span>
                <span>{{ dureeActuelle }}</span>
              </div>
            </div>
            <div class="alert alert-info" style="font-size:0.82rem;margin-top:12px">
              💰 Le montant sera calculé automatiquement selon la grille tarifaire.<br>
              📧 Un email de confirmation sera envoyé au client.
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="showSortieModal=false">Annuler</button>
            <button class="btn btn-success" @click="confirmSortie" :disabled="!selectedEntree || sortieLoading">
              <span v-if="sortieLoading" class="loading-spinner"></span>
              <span v-else>✓ Confirmer la sortie</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <ConfirmModal
      :show="showConfirm"
      name="cette sortie"
      :loading="deleting"
      @confirm="doDelete"
      @cancel="showConfirm=false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import api from '@/utils/api.js'
import { useToastStore } from '@/store/toast.js'
import ConfirmModal from '@/components/modals/ConfirmModal.vue'

const toast = useToastStore()
const sorties = ref([])
const entreesActives = ref([])
const loading = ref(false)
const filterDate = ref('')
const showConfirm = ref(false)
const showSortieModal = ref(false)
const deleteTarget = ref(null)
const deleting = ref(false)
const selectedEntree = ref('')
const sortieError = ref('')
const sortieLoading = ref(false)

// Timer for live duration
let durationTimer = null

const totalMontant = computed(() => sorties.value.reduce((s, x) => s + parseInt(x.montant), 0))
const moyenneDuree = computed(() =>
  sorties.value.length ? Math.round(sorties.value.reduce((s, x) => s + x.duree, 0) / sorties.value.length) : 0
)

const selectedEntreeData = computed(() =>
  entreesActives.value.find(e => e.idEntree === selectedEntree.value) || null
)

const dureeActuelle = computed(() => {
  if (!selectedEntreeData.value) return ''
  const diff = Date.now() - new Date(selectedEntreeData.value.dateEntree).getTime()
  const min = Math.ceil(diff / 60000)
  const h = Math.floor(min / 60); const m = min % 60
  return h > 0 ? `${h}h${m > 0 ? m + 'min' : ''}` : `${m} min`
})

function formatDate(d)     { return d ? new Date(d).toLocaleDateString('fr-FR') : '—' }
function formatHeure(d)    { return d ? new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—' }
function formatDateTime(d) { return d ? new Date(d).toLocaleString('fr-FR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }) : '—' }
function formatDuree(min) {
  if (!min) return '0min'
  const h = Math.floor(min / 60); const m = min % 60
  if (h === 0) return `${m}min`
  return m > 0 ? `${h}h${m}min` : `${h}h`
}

async function load() {
  loading.value = true
  try {
    const params = filterDate.value ? { date: filterDate.value } : {}
    const r = await api.get('/sorties', { params })
    sorties.value = r.data.data
  } catch (e) { toast.error(e.message) }
  finally { loading.value = false }
}

async function loadEntreesActives() {
  try {
    // Fetch all entrees, then filter those without a sortie
    const [rEntrees, rSorties] = await Promise.all([
      api.get('/entrees'),
      api.get('/sorties')
    ])
    const sortieSet = new Set(rSorties.data.data.map(s => s.idEntree))
    entreesActives.value = rEntrees.data.data.filter(e => !sortieSet.has(e.idEntree))
  } catch (e) { toast.error(e.message) }
}

async function openSortieModal() {
  selectedEntree.value = ''
  sortieError.value = ''
  await loadEntreesActives()
  showSortieModal.value = true
  // Refresh duration every 30s
  durationTimer = setInterval(() => {}, 30000)
}

async function confirmSortie() {
  if (!selectedEntree.value) return
  sortieLoading.value = true; sortieError.value = ''
  try {
    const r = await api.post('/sorties', { idEntree: selectedEntree.value })
    const montant = r.data.data.montant
    toast.success(`Sortie enregistrée ! Montant : ${parseInt(montant).toLocaleString('fr-FR')} Ar`)
    showSortieModal.value = false
    await load()
  } catch (e) { sortieError.value = e.message }
  finally { sortieLoading.value = false }
}

function openDelete(s) { deleteTarget.value = s; showConfirm.value = true }
async function doDelete() {
  deleting.value = true
  try {
    await api.delete(`/sorties/${deleteTarget.value.idSortie}`)
    sorties.value = sorties.value.filter(s => s.idSortie !== deleteTarget.value.idSortie)
    toast.success('Sortie supprimée'); showConfirm.value = false
  } catch (e) { toast.error(e.message) }
  finally { deleting.value = false }
}

onMounted(load)
onBeforeUnmount(() => { if (durationTimer) clearInterval(durationTimer) })
</script>

<style scoped>
.montant-cell {
  font-family: var(--font-display);
  font-weight: 700;
  color: var(--gold);
  font-size: 0.95rem;
}
.entree-preview {
  background: rgba(232,184,75,0.05);
  border: 1px solid rgba(232,184,75,0.2);
  border-radius: var(--radius-md);
  padding: 14px 16px;
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.preview-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: var(--text-secondary);
}
.preview-row span:last-child { color: var(--text-primary); font-weight: 500; }
.preview-row.highlight span:last-child { color: var(--gold); font-weight: 700; font-size: 0.95rem; }
</style>
