<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h1 class="page-title"><div class="title-icon">🅿️</div>Places de Parking</h1>
        <p class="page-subtitle">{{ places.length }} place(s) — {{ libres }} libres, {{ occupees }} occupées</p>
      </div>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <select v-model="filterEtat" class="form-control" style="width:140px" @change="load">
          <option value="">Tous les états</option>
          <option value="Libre">Libre</option>
          <option value="Occupée">Occupée</option>
        </select>
        <select v-model="filterType" class="form-control" style="width:150px" @change="load">
          <option value="">Tous les types</option>
          <option>Standard</option>
          <option>Handicapé</option>
          <option>VIP</option>
          <option>Moto</option>
        </select>
        <button class="btn btn-primary" @click="openCreate">+ Nouvelle place</button>
      </div>
    </div>

    <!-- Visual grid -->
    <div class="card" style="margin-bottom:20px">
      <div class="card-header"><span class="card-title">🗺️ Plan visuel du parking</span></div>
      <div class="card-body">
        <div class="parking-grid">
          <div
            v-for="p in places"
            :key="p.idPlace"
            class="parking-slot"
            :class="[p.etat === 'Libre' ? 'slot-libre' : 'slot-occupee', 'slot-' + p.typePlace.toLowerCase()]"
            :title="`Place N°${p.numeroPlace} — ${p.typePlace} — ${p.etat}`"
          >
            <div class="slot-number">{{ p.numeroPlace }}</div>
            <div class="slot-type">{{ typeIcon(p.typePlace) }}</div>
          </div>
        </div>
        <div class="legend">
          <span class="legend-item"><span class="legend-dot dot-libre"></span>Libre</span>
          <span class="legend-item"><span class="legend-dot dot-occupee"></span>Occupée</span>
          <span class="legend-item"><span class="legend-dot dot-vip"></span>VIP</span>
          <span class="legend-item"><span class="legend-dot dot-handi"></span>Handicapé</span>
          <span class="legend-item"><span class="legend-dot dot-moto"></span>Moto</span>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="card">
      <div class="table-wrapper">
        <div v-if="loading" style="text-align:center;padding:40px"><span class="loading-spinner"></span></div>
        <table v-else-if="places.length">
          <thead>
            <tr>
              <th>N° Place</th>
              <th>Type</th>
              <th>État</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in places" :key="p.idPlace">
              <td><span class="badge badge-gold">N° {{ p.numeroPlace }}</span></td>
              <td>
                <span class="badge" :class="typeBadge(p.typePlace)">{{ typeIcon(p.typePlace) }} {{ p.typePlace }}</span>
              </td>
              <td>
                <span class="badge" :class="p.etat === 'Libre' ? 'badge-success' : 'badge-danger'">
                  {{ p.etat === 'Libre' ? '✓ Libre' : '✕ Occupée' }}
                </span>
              </td>
              <td>
                <div class="td-actions">
                  <button class="btn btn-secondary btn-icon btn-sm" @click="openEdit(p)" :disabled="p.etat === 'Occupée'" title="Modifier">✏️</button>
                  <button class="btn btn-danger btn-icon btn-sm" @click="openDelete(p)" :disabled="p.etat === 'Occupée'" title="Supprimer">🗑️</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="empty-state" v-else>
          <div class="empty-icon">🅿️</div>
          <div class="empty-text">Aucune place trouvée</div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <div class="modal-overlay" v-if="showModal" @click.self="closeModal">
        <div class="modal">
          <div class="modal-header">
            <div class="modal-title">
              <div class="modal-icon">🅿️</div>
              {{ editing ? 'Modifier la place' : 'Nouvelle place' }}
            </div>
            <button class="modal-close" @click="closeModal">✕</button>
          </div>
          <div class="modal-body">
            <div v-if="formError" class="alert alert-error">⚠️ {{ formError }}</div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Numéro de place *</label>
                <input v-model.number="form.numeroPlace" class="form-control" type="number" min="1" placeholder="21" />
              </div>
              <div class="form-group">
                <label class="form-label">Type de place *</label>
                <select v-model="form.typePlace" class="form-control">
                  <option value="">-- Choisir --</option>
                  <option>Standard</option>
                  <option>Handicapé</option>
                  <option>VIP</option>
                  <option>Moto</option>
                </select>
              </div>
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

    <ConfirmModal :show="showConfirm" :name="`la place N°${deleteTarget?.numeroPlace}`" :loading="deleting" @confirm="doDelete" @cancel="showConfirm=false" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/utils/api.js'
import { useToastStore } from '@/store/toast.js'
import ConfirmModal from '@/components/modals/ConfirmModal.vue'

const toast = useToastStore()
const places = ref([])
const loading = ref(false)
const filterEtat = ref('')
const filterType = ref('')
const showModal = ref(false)
const showConfirm = ref(false)
const editing = ref(null)
const deleteTarget = ref(null)
const saving = ref(false)
const deleting = ref(false)
const formError = ref('')
const form = ref({ numeroPlace: '', typePlace: '' })

const libres = computed(() => places.value.filter(p => p.etat === 'Libre').length)
const occupees = computed(() => places.value.filter(p => p.etat === 'Occupée').length)

function typeIcon(t) {
  return { Standard: '🚗', Handicapé: '♿', VIP: '⭐', Moto: '🏍️' }[t] || '🚗'
}
function typeBadge(t) {
  return { Standard: 'badge-info', Handicapé: 'badge-warning', VIP: 'badge-gold', Moto: 'badge-success' }[t] || 'badge-info'
}

async function load() {
  loading.value = true
  try {
    const params = {}
    if (filterEtat.value) params.etat = filterEtat.value
    if (filterType.value) params.typePlace = filterType.value
    const r = await api.get('/places', { params })
    places.value = r.data.data
  } catch (e) { toast.error(e.message) }
  finally { loading.value = false }
}

function openCreate() {
  editing.value = null; form.value = { numeroPlace: '', typePlace: '' }; formError.value = ''; showModal.value = true
}
function openEdit(p) {
  editing.value = p; form.value = { numeroPlace: p.numeroPlace, typePlace: p.typePlace }; formError.value = ''; showModal.value = true
}
function closeModal() { showModal.value = false; formError.value = '' }

async function save() {
  if (!form.value.numeroPlace || !form.value.typePlace) {
    formError.value = 'Veuillez remplir tous les champs.'; return
  }
  saving.value = true; formError.value = ''
  try {
    if (editing.value) {
      await api.put(`/places/${editing.value.idPlace}`, form.value)
      toast.success('Place modifiée')
    } else {
      await api.post('/places', form.value)
      toast.success('Place créée')
    }
    await load(); closeModal()
  } catch (e) { formError.value = e.message }
  finally { saving.value = false }
}

function openDelete(p) { deleteTarget.value = p; showConfirm.value = true }
async function doDelete() {
  deleting.value = true
  try {
    await api.delete(`/places/${deleteTarget.value.idPlace}`)
    places.value = places.value.filter(p => p.idPlace !== deleteTarget.value.idPlace)
    toast.success('Place supprimée'); showConfirm.value = false
  } catch (e) { toast.error(e.message) }
  finally { deleting.value = false }
}

onMounted(load)
</script>

<style scoped>
.parking-grid {
  display: flex; flex-wrap: wrap; gap: 10px; padding: 8px 0;
}
.parking-slot {
  width: 68px; height: 68px;
  border-radius: 8px;
  border: 2px solid transparent;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  cursor: default; transition: transform 0.15s ease;
}
.parking-slot:hover { transform: scale(1.05); }
.slot-libre { background: rgba(46,204,113,0.12); border-color: rgba(46,204,113,0.35); }
.slot-occupee { background: rgba(231,76,60,0.12); border-color: rgba(231,76,60,0.35); }
.slot-vip.slot-libre { background: rgba(232,184,75,0.12); border-color: rgba(232,184,75,0.4); }
.slot-handicapé.slot-libre { background: rgba(52,152,219,0.12); border-color: rgba(52,152,219,0.35); }
.slot-moto.slot-libre { background: rgba(155,89,182,0.12); border-color: rgba(155,89,182,0.35); }
.slot-number { font-family: var(--font-display); font-weight: 700; font-size: 1rem; color: var(--text-primary); }
.slot-type { font-size: 0.9rem; }

.legend { display: flex; gap: 16px; margin-top: 14px; flex-wrap: wrap; }
.legend-item { display: flex; align-items: center; gap: 6px; font-size: 0.78rem; color: var(--text-secondary); }
.legend-dot { width: 12px; height: 12px; border-radius: 3px; }
.dot-libre { background: rgba(46,204,113,0.5); }
.dot-occupee { background: rgba(231,76,60,0.5); }
.dot-vip { background: rgba(232,184,75,0.5); }
.dot-handi { background: rgba(52,152,219,0.5); }
.dot-moto { background: rgba(155,89,182,0.5); }
</style>
