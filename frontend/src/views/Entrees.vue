<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h1 class="page-title"><div class="title-icon">⬇️</div>Entrées</h1>
        <p class="page-subtitle">Enregistrement des entrées de véhicules</p>
      </div>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <div class="search-bar">
          <span class="search-icon">📅</span>
          <input type="date" v-model="filterDate" @change="load"
            class="form-control" style="border:none;background:none;width:160px;padding:9px 0" />
        </div>
        <button class="btn btn-secondary btn-sm" v-if="filterDate" @click="filterDate='';load()">✕ Effacer filtre</button>
        <button class="btn btn-primary" @click="openCreate">⬇️ Enregistrer une entrée</button>
      </div>
    </div>

    <div class="card">
      <div class="table-wrapper">
        <div v-if="loading" style="text-align:center;padding:40px"><span class="loading-spinner"></span></div>
        <table v-else-if="entrees.length">
          <thead>
            <tr>
              <th>Date & Heure</th>
              <th>Véhicule</th>
              <th>Client</th>
              <th>Place</th>
              <th>Motif</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="e in entrees" :key="e.idEntree">
              <td>
                <div style="font-weight:600;font-size:0.85rem">{{ formatDate(e.dateEntree) }}</div>
                <div class="text-xs text-muted">{{ formatHeure(e.dateEntree) }}</div>
              </td>
              <td>
                <div style="font-weight:600">{{ e.marque }}</div>
                <div class="text-xs text-muted">{{ e.matricule }}</div>
              </td>
              <td>{{ e.nomClient }}</td>
              <td>
                <span class="badge badge-gold">N° {{ e.numeroPlace }}</span>
                <span class="text-xs text-muted" style="margin-left:4px">{{ e.typePlace }}</span>
              </td>
              <td>{{ e.motif || '—' }}</td>
              <td>
                <span class="badge" :class="e.hasSortie ? 'badge-success' : 'badge-warning'">
                  {{ e.hasSortie ? '✓ Sorti' : '⏳ Présent' }}
                </span>
              </td>
              <td>
                <div class="td-actions">
                  <button
                    v-if="!e.hasSortie"
                    class="btn btn-success btn-sm"
                    @click="doSortie(e)"
                    title="Enregistrer la sortie"
                  >⬆️ Sortie</button>
                  <button class="btn btn-danger btn-icon btn-sm" @click="openDelete(e)" title="Supprimer">🗑️</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="empty-state" v-else>
          <div class="empty-icon">⬇️</div>
          <div class="empty-text">Aucune entrée enregistrée{{ filterDate ? ' pour cette date' : '' }}</div>
        </div>
      </div>
    </div>

    <!-- Modal Entrée -->
    <Teleport to="body">
      <div class="modal-overlay" v-if="showModal" @click.self="closeModal">
        <div class="modal">
          <div class="modal-header">
            <div class="modal-title"><div class="modal-icon">⬇️</div>Enregistrer une entrée</div>
            <button class="modal-close" @click="closeModal">✕</button>
          </div>
          <div class="modal-body">
            <div v-if="formError" class="alert alert-error">⚠️ {{ formError }}</div>
            <div class="form-group">
              <label class="form-label">Véhicule *</label>
              <select v-model="form.idVoiture" class="form-control">
                <option value="">-- Sélectionner un véhicule --</option>
                <option v-for="v in voitures" :key="v.idVoiture" :value="v.idVoiture">
                  {{ v.matricule }} — {{ v.marque }} ({{ v.nomClient }})
                </option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Place libre *</label>
              <select v-model="form.idPlace" class="form-control">
                <option value="">-- Sélectionner une place libre --</option>
                <option v-for="p in placesLibres" :key="p.idPlace" :value="p.idPlace">
                  N° {{ p.numeroPlace }} — {{ p.typePlace }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Motif (optionnel)</label>
              <input v-model="form.motif" class="form-control" placeholder="Rendez-vous, livraison..." />
            </div>
            <div class="alert alert-info" style="font-size:0.82rem">
              📧 Un email de confirmation sera envoyé au client automatiquement.
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeModal">Annuler</button>
            <button class="btn btn-primary" @click="save" :disabled="saving">
              <span v-if="saving" class="loading-spinner"></span>
              Enregistrer l'entrée
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal Sortie rapide depuis Entrées -->
    <Teleport to="body">
      <div class="modal-overlay" v-if="showSortieConfirm" @click.self="showSortieConfirm=false">
        <div class="modal" style="max-width:440px">
          <div class="modal-header">
            <div class="modal-title"><div class="modal-icon">⬆️</div>Confirmer la sortie</div>
            <button class="modal-close" @click="showSortieConfirm=false">✕</button>
          </div>
          <div class="modal-body">
            <div class="entree-preview" v-if="sortieTarget">
              <div class="preview-row">
                <span>🚗 Véhicule</span>
                <span>{{ sortieTarget.marque }} — {{ sortieTarget.matricule }}</span>
              </div>
              <div class="preview-row">
                <span>👤 Client</span>
                <span>{{ sortieTarget.nomClient }}</span>
              </div>
              <div class="preview-row">
                <span>📍 Place</span>
                <span>N° {{ sortieTarget.numeroPlace }}</span>
              </div>
              <div class="preview-row">
                <span>🕐 Entrée à</span>
                <span>{{ formatHeure(sortieTarget.dateEntree) }}</span>
              </div>
              <div class="preview-row highlight">
                <span>⏱ Durée</span>
                <span>{{ dureeDepuis(sortieTarget.dateEntree) }}</span>
              </div>
            </div>
            <div class="alert alert-info" style="font-size:0.82rem;margin-top:12px">
              💰 Le montant sera calculé automatiquement.<br>
              📧 Un email sera envoyé au client.
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="showSortieConfirm=false">Annuler</button>
            <button class="btn btn-success" @click="confirmSortie" :disabled="sortieLoading">
              <span v-if="sortieLoading" class="loading-spinner"></span>
              ✓ Confirmer la sortie
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <ConfirmModal
      :show="showConfirm"
      name="cette entrée"
      :loading="deleting"
      @confirm="doDelete"
      @cancel="showConfirm=false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/utils/api.js'
import { useToastStore } from '@/store/toast.js'
import ConfirmModal from '@/components/modals/ConfirmModal.vue'

const toast = useToastStore()
const entrees = ref([])
const voitures = ref([])
const placesLibres = ref([])
const loading = ref(false)
const filterDate = ref('')
const showModal = ref(false)
const showConfirm = ref(false)
const showSortieConfirm = ref(false)
const sortieTarget = ref(null)
const sortieLoading = ref(false)
const deleteTarget = ref(null)
const saving = ref(false)
const deleting = ref(false)
const formError = ref('')
const form = ref({ idVoiture: '', idPlace: '', motif: '' })

function formatDate(d)  { return d ? new Date(d).toLocaleDateString('fr-FR') : '—' }
function formatHeure(d) { return d ? new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—' }
function dureeDepuis(d) {
  const diff = Date.now() - new Date(d).getTime()
  const min = Math.ceil(diff / 60000)
  const h = Math.floor(min / 60); const m = min % 60
  if (h === 0) return `${m} min`
  return `${h}h${m > 0 ? m + 'min' : ''}`
}

async function load() {
  loading.value = true
  try {
    const params = filterDate.value ? { date: filterDate.value } : {}
    const [rEntrees, rSorties] = await Promise.all([
      api.get('/entrees', { params }),
      api.get('/sorties')
    ])
    const sortieSet = new Set(rSorties.data.data.map(s => s.idEntree))
    entrees.value = rEntrees.data.data.map(e => ({ ...e, hasSortie: sortieSet.has(e.idEntree) }))
  } catch (e) { toast.error(e.message) }
  finally { loading.value = false }
}

async function loadFormData() {
  const [rv, rp] = await Promise.all([
    api.get('/voitures'),
    api.get('/places', { params: { etat: 'Libre' } })
  ])
  voitures.value = rv.data.data
  placesLibres.value = rp.data.data
}

function openCreate() {
  form.value = { idVoiture: '', idPlace: '', motif: '' }
  formError.value = ''
  loadFormData()
  showModal.value = true
}
function closeModal() { showModal.value = false; formError.value = '' }

async function save() {
  if (!form.value.idVoiture || !form.value.idPlace) {
    formError.value = 'Véhicule et place sont obligatoires.'; return
  }
  saving.value = true; formError.value = ''
  try {
    await api.post('/entrees', form.value)
    toast.success('Entrée enregistrée ! Email envoyé au client.')
    await load()
    closeModal()
  } catch (e) { formError.value = e.message }
  finally { saving.value = false }
}

function doSortie(e) { sortieTarget.value = e; showSortieConfirm.value = true }

async function confirmSortie() {
  sortieLoading.value = true
  try {
    const r = await api.post('/sorties', { idEntree: sortieTarget.value.idEntree })
    const montant = r.data.data.montant
    toast.success(`Sortie enregistrée ! Montant : ${parseInt(montant).toLocaleString('fr-FR')} Ar`)
    showSortieConfirm.value = false
    await load()
  } catch (e) { toast.error(e.message) }
  finally { sortieLoading.value = false }
}

function openDelete(e) { deleteTarget.value = e; showConfirm.value = true }
async function doDelete() {
  deleting.value = true
  try {
    await api.delete(`/entrees/${deleteTarget.value.idEntree}`)
    toast.success('Entrée supprimée')
    showConfirm.value = false
    await load()
  } catch (e) { toast.error(e.message) }
  finally { deleting.value = false }
}

onMounted(load)
</script>

<style scoped>
.entree-preview {
  background: rgba(232,184,75,0.05);
  border: 1px solid rgba(232,184,75,0.2);
  border-radius: var(--radius-md);
  padding: 14px 16px;
  display: flex; flex-direction: column; gap: 8px;
}
.preview-row {
  display: flex; justify-content: space-between;
  font-size: 0.85rem; color: var(--text-secondary);
}
.preview-row span:last-child { color: var(--text-primary); font-weight: 500; }
.preview-row.highlight span:last-child { color: var(--gold); font-weight: 700; }
</style>
