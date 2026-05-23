<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h1 class="page-title"><div class="title-icon">👤</div>Clients</h1>
        <p class="page-subtitle">{{ clients.length }} client(s) enregistré(s)</p>
      </div>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <div class="search-bar">
          <span class="search-icon">🔍</span>
          <input v-model="search" placeholder="Rechercher..." />
        </div>
        <button class="btn btn-primary" @click="openCreate">+ Nouveau client</button>
      </div>
    </div>

    <div class="card">
      <div class="table-wrapper">
        <div v-if="loading" style="text-align:center;padding:40px"><span class="loading-spinner"></span></div>
        <table v-else-if="filtered.length">
          <thead>
            <tr>
              <th>#</th>
              <th>Nom</th>
              <th>Sexe</th>
              <th>Âge</th>
              <th>Téléphone</th>
              <th>Email</th>
              <th>Voitures</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(c, i) in filtered" :key="c.idClient">
              <td class="text-muted text-sm">{{ i + 1 }}</td>
              <td>
                <div style="display:flex;align-items:center;gap:10px">
                  <div class="avatar">{{ initials(c.nom) }}</div>
                  <span style="font-weight:600">{{ c.nom }}</span>
                </div>
              </td>
              <td>
                <span class="badge" :class="c.sexe === 'M' ? 'badge-info' : 'badge-warning'">
                  {{ c.sexe === 'M' ? '♂ M' : '♀ F' }}
                </span>
              </td>
              <td>{{ c.age }} ans</td>
              <td>{{ c.telephone }}</td>
              <td>{{ c.mail }}</td>
              <td>
                <span class="badge badge-gold">{{ c.nbVoitures ?? 0 }} 🚗</span>
              </td>
              <td>
                <div class="td-actions">
                  <button class="btn btn-secondary btn-icon btn-sm" @click="openEdit(c)" title="Modifier">✏️</button>
                  <button class="btn btn-danger btn-icon btn-sm" @click="openDelete(c)" title="Supprimer">🗑️</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="empty-state" v-else>
          <div class="empty-icon">👤</div>
          <div class="empty-text">Aucun client trouvé</div>
        </div>
      </div>
    </div>

    <!-- Create / Edit Modal -->
    <Teleport to="body">
      <div class="modal-overlay" v-if="showModal" @click.self="closeModal">
        <div class="modal">
          <div class="modal-header">
            <div class="modal-title">
              <div class="modal-icon">👤</div>
              {{ editing ? 'Modifier le client' : 'Nouveau client' }}
            </div>
            <button class="modal-close" @click="closeModal">✕</button>
          </div>
          <div class="modal-body">
            <div v-if="formError" class="alert alert-error">⚠️ {{ formError }}</div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Nom complet *</label>
                <input v-model="form.nom" class="form-control" placeholder="Ex: RAKOTO Bernard" />
              </div>
              <div class="form-group">
                <label class="form-label">Sexe *</label>
                <select v-model="form.sexe" class="form-control">
                  <option value="">-- Choisir --</option>
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Âge *</label>
                <input v-model.number="form.age" class="form-control" type="number" min="1" max="120" placeholder="25" />
              </div>
              <div class="form-group">
                <label class="form-label">Téléphone *</label>
                <input v-model="form.telephone" class="form-control" placeholder="0324432167" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Email *</label>
              <input v-model="form.mail" class="form-control" type="email" placeholder="client@email.mg" />
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

    <!-- Confirm Delete -->
    <ConfirmModal
      :show="showConfirm"
      :name="deleteTarget?.nom"
      :loading="deleting"
      @confirm="doDelete"
      @cancel="showConfirm = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/utils/api.js'
import { useToastStore } from '@/store/toast.js'
import ConfirmModal from '@/components/modals/ConfirmModal.vue'

const toast = useToastStore()
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

const form = ref({ nom: '', sexe: '', age: '', telephone: '', mail: '' })

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  return q ? clients.value.filter(c =>
    c.nom.toLowerCase().includes(q) ||
    c.mail.toLowerCase().includes(q) ||
    c.telephone.includes(q)
  ) : clients.value
})

function initials(nom) {
  return nom.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

async function load() {
  loading.value = true
  try {
    const r = await api.get('/clients')
    clients.value = r.data.data
  } catch (e) { toast.error(e.message) }
  finally { loading.value = false }
}

function openCreate() {
  editing.value = null
  form.value = { nom: '', sexe: '', age: '', telephone: '', mail: '' }
  formError.value = ''
  showModal.value = true
}

function openEdit(c) {
  editing.value = c
  form.value = { nom: c.nom, sexe: c.sexe, age: c.age, telephone: c.telephone, mail: c.mail }
  formError.value = ''
  showModal.value = true
}

function closeModal() { showModal.value = false; formError.value = '' }

async function save() {
  if (!form.value.nom || !form.value.sexe || !form.value.age || !form.value.telephone || !form.value.mail) {
    formError.value = 'Veuillez remplir tous les champs obligatoires.'; return
  }
  saving.value = true; formError.value = ''
  try {
    if (editing.value) {
      const r = await api.put(`/clients/${editing.value.idClient}`, form.value)
      const idx = clients.value.findIndex(c => c.idClient === editing.value.idClient)
      if (idx !== -1) clients.value[idx] = { ...clients.value[idx], ...r.data.data }
      toast.success('Client modifié avec succès')
    } else {
      const r = await api.post('/clients', form.value)
      clients.value.unshift(r.data.data)
      toast.success('Client créé avec succès')
    }
    closeModal()
  } catch (e) { formError.value = e.message }
  finally { saving.value = false }
}

function openDelete(c) { deleteTarget.value = c; showConfirm.value = true }

async function doDelete() {
  deleting.value = true
  try {
    await api.delete(`/clients/${deleteTarget.value.idClient}`)
    clients.value = clients.value.filter(c => c.idClient !== deleteTarget.value.idClient)
    toast.success('Client supprimé')
    showConfirm.value = false
  } catch (e) { toast.error(e.message) }
  finally { deleting.value = false }
}

onMounted(load)
</script>

<style scoped>
.avatar {
  width: 34px; height: 34px;
  background: linear-gradient(135deg, var(--gold), var(--gold-dark));
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.75rem; font-weight: 700; color: #1a1a2e;
  flex-shrink: 0;
}
</style>
