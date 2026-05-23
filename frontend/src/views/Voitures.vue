<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h1 class="page-title"><div class="title-icon">🚗</div>Voitures</h1>
        <p class="page-subtitle">{{ voitures.length }} véhicule(s) enregistré(s)</p>
      </div>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <div class="search-bar">
          <span class="search-icon">🔍</span>
          <input v-model="search" @input="onSearch" placeholder="Matricule ou marque..." />
        </div>
        <button class="btn btn-primary" @click="openCreate">+ Nouveau véhicule</button>
      </div>
    </div>

    <div class="card">
      <div class="table-wrapper">
        <div v-if="loading" style="text-align:center;padding:40px"><span class="loading-spinner"></span></div>
        <table v-else-if="voitures.length">
          <thead>
            <tr>
              <th>#</th>
              <th>Matricule</th>
              <th>Marque</th>
              <th>Couleur</th>
              <th>Type</th>
              <th>Propriétaire</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(v, i) in voitures" :key="v.idVoiture">
              <td class="text-muted text-sm">{{ i + 1 }}</td>
              <td><span class="badge badge-gold">{{ v.matricule }}</span></td>
              <td>
                <div style="font-weight:600">{{ v.marque }}</div>
              </td>
              <td>
                <div style="display:flex;align-items:center;gap:8px">
                  <div class="color-dot" :style="{ background: colorMap[v.couleur.toLowerCase()] || '#888' }"></div>
                  {{ v.couleur }}
                </div>
              </td>
              <td><span class="badge badge-info">{{ v.type }}</span></td>
              <td>
                <div style="font-size:0.85rem">{{ v.nomClient }}</div>
                <div class="text-xs text-muted">{{ v.telClient }}</div>
              </td>
              <td>
                <div class="td-actions">
                  <button class="btn btn-secondary btn-icon btn-sm" @click="openEdit(v)" title="Modifier">✏️</button>
                  <button class="btn btn-danger btn-icon btn-sm" @click="openDelete(v)" title="Supprimer">🗑️</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="empty-state" v-else>
          <div class="empty-icon">🚗</div>
          <div class="empty-text">Aucun véhicule trouvé</div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <div class="modal-overlay" v-if="showModal" @click.self="closeModal">
        <div class="modal">
          <div class="modal-header">
            <div class="modal-title">
              <div class="modal-icon">🚗</div>
              {{ editing ? 'Modifier le véhicule' : 'Nouveau véhicule' }}
            </div>
            <button class="modal-close" @click="closeModal">✕</button>
          </div>
          <div class="modal-body">
            <div v-if="formError" class="alert alert-error">⚠️ {{ formError }}</div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Matricule *</label>
                <input v-model="form.matricule" class="form-control" placeholder="1234 TAA" />
              </div>
              <div class="form-group">
                <label class="form-label">Marque *</label>
                <input v-model="form.marque" class="form-control" placeholder="Toyota, Renault..." />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Couleur *</label>
                <input v-model="form.couleur" class="form-control" placeholder="Blanc, Gris..." />
              </div>
              <div class="form-group">
                <label class="form-label">Type *</label>
                <select v-model="form.type" class="form-control">
                  <option value="">-- Type --</option>
                  <option>Berline</option>
                  <option>SUV</option>
                  <option>Pickup</option>
                  <option>Citadine</option>
                  <option>Monospace</option>
                  <option>Utilitaire</option>
                  <option>Moto</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Propriétaire *</label>
              <select v-model="form.idClient" class="form-control">
                <option value="">-- Sélectionner un client --</option>
                <option v-for="c in clients" :key="c.idClient" :value="c.idClient">
                  {{ c.nom }} — {{ c.telephone }}
                </option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeModal">Annuler</button>
            <button class="btn btn-primary" @click="save" :disabled="saving">
              <span v-if="saving" class="loading-spinner"></span>
              {{ editing ? 'Enregistrer' : 'Créer' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <ConfirmModal :show="showConfirm" :name="deleteTarget?.matricule + ' ' + deleteTarget?.marque" :loading="deleting" @confirm="doDelete" @cancel="showConfirm=false" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/utils/api.js'
import { useToastStore } from '@/store/toast.js'
import ConfirmModal from '@/components/modals/ConfirmModal.vue'

const toast = useToastStore()
const voitures = ref([])
const clients = ref([])
const loading = ref(false)
const search = ref('')
const showModal = ref(false)
const showConfirm = ref(false)
const editing = ref(null)
const deleteTarget = ref(null)
const saving = ref(false)
const deleting = ref(false)
const formError = ref('')

const colorMap = {
  blanc: '#f0f0f0', noir: '#222', gris: '#888', rouge: '#e74c3c',
  bleu: '#3498db', vert: '#2ecc71', jaune: '#f1c40f', orange: '#e67e22',
  marron: '#795548', argent: '#ccc', beige: '#d4b896'
}

const form = ref({ matricule: '', marque: '', couleur: '', type: '', idClient: '' })

let searchTimer = null
function onSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => load(), 400)
}

async function load() {
  loading.value = true
  try {
    const r = await api.get('/voitures', { params: search.value ? { search: search.value } : {} })
    voitures.value = r.data.data
  } catch (e) { toast.error(e.message) }
  finally { loading.value = false }
}

async function loadClients() {
  const r = await api.get('/clients')
  clients.value = r.data.data
}

function openCreate() {
  editing.value = null
  form.value = { matricule: '', marque: '', couleur: '', type: '', idClient: '' }
  formError.value = ''
  showModal.value = true
}

function openEdit(v) {
  editing.value = v
  form.value = { matricule: v.matricule, marque: v.marque, couleur: v.couleur, type: v.type, idClient: v.idClient }
  formError.value = ''
  showModal.value = true
}

function closeModal() { showModal.value = false; formError.value = '' }

async function save() {
  if (!form.value.matricule || !form.value.marque || !form.value.couleur || !form.value.type || !form.value.idClient) {
    formError.value = 'Veuillez remplir tous les champs.'; return
  }
  saving.value = true; formError.value = ''
  try {
    if (editing.value) {
      await api.put(`/voitures/${editing.value.idVoiture}`, form.value)
      toast.success('Véhicule modifié')
    } else {
      await api.post('/voitures', form.value)
      toast.success('Véhicule créé')
    }
    await load()
    closeModal()
  } catch (e) { formError.value = e.message }
  finally { saving.value = false }
}

function openDelete(v) { deleteTarget.value = v; showConfirm.value = true }

async function doDelete() {
  deleting.value = true
  try {
    await api.delete(`/voitures/${deleteTarget.value.idVoiture}`)
    voitures.value = voitures.value.filter(v => v.idVoiture !== deleteTarget.value.idVoiture)
    toast.success('Véhicule supprimé')
    showConfirm.value = false
  } catch (e) { toast.error(e.message) }
  finally { deleting.value = false }
}

onMounted(() => { load(); loadClients() })
</script>

<style scoped>
.color-dot { width: 14px; height: 14px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.2); flex-shrink: 0; }
</style>
