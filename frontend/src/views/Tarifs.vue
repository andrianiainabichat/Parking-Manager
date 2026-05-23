<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h1 class="page-title"><div class="title-icon">💰</div>Grille Tarifaire</h1>
        <p class="page-subtitle">Tarification par tranches horaires (en Ariary)</p>
      </div>
      <button class="btn btn-primary" @click="openCreate">+ Nouveau tarif</button>
    </div>

    <!-- Tarif cards visual -->
    <div class="tarif-grid" v-if="!loading && tarifs.length">
      <div class="tarif-card" v-for="t in tarifs" :key="t.idTarif">
        <div class="tarif-range">
          <span class="tarif-min">{{ formatDuree(t.dureeMin) }}</span>
          <span class="tarif-arrow">→</span>
          <span class="tarif-max">{{ formatDuree(t.dureeMax) }}</span>
        </div>
        <div class="tarif-price">{{ parseInt(t.prix).toLocaleString('fr-FR') }} <span>Ar</span></div>
        <div class="tarif-actions">
          <button class="btn btn-secondary btn-sm" @click="openEdit(t)">✏️ Modifier</button>
          <button class="btn btn-danger btn-sm" @click="openDelete(t)">🗑️</button>
        </div>
      </div>
    </div>
    <div v-else-if="loading" style="text-align:center;padding:60px"><span class="loading-spinner"></span></div>
    <div class="empty-state" v-else>
      <div class="empty-icon">💰</div>
      <div class="empty-text">Aucun tarif défini</div>
    </div>

    <!-- Info box -->
    <div class="alert alert-info" style="margin-top:20px">
      ℹ️ Les tarifs sont appliqués automatiquement lors de l'enregistrement d'une sortie selon la durée de stationnement.
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <div class="modal-overlay" v-if="showModal" @click.self="closeModal">
        <div class="modal">
          <div class="modal-header">
            <div class="modal-title">
              <div class="modal-icon">💰</div>
              {{ editing ? 'Modifier le tarif' : 'Nouveau tarif' }}
            </div>
            <button class="modal-close" @click="closeModal">✕</button>
          </div>
          <div class="modal-body">
            <div v-if="formError" class="alert alert-error">⚠️ {{ formError }}</div>
            <div class="alert alert-info" style="margin-bottom:16px;font-size:0.82rem">
              Les durées sont exprimées en <strong>minutes</strong>. Ex: 60 = 1h, 180 = 3h.
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Durée min (minutes) *</label>
                <input v-model.number="form.dureeMin" class="form-control" type="number" min="0" placeholder="0" />
                <div class="text-xs text-muted" style="margin-top:4px">{{ formatDuree(form.dureeMin) }}</div>
              </div>
              <div class="form-group">
                <label class="form-label">Durée max (minutes) *</label>
                <input v-model.number="form.dureeMax" class="form-control" type="number" min="1" placeholder="60" />
                <div class="text-xs text-muted" style="margin-top:4px">{{ formatDuree(form.dureeMax) }}</div>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Prix (Ariary) *</label>
              <input v-model.number="form.prix" class="form-control" type="number" min="0" placeholder="5000" />
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

    <ConfirmModal :show="showConfirm" :name="`le tarif ${formatDuree(deleteTarget?.dureeMin)}-${formatDuree(deleteTarget?.dureeMax)}`" :loading="deleting" @confirm="doDelete" @cancel="showConfirm=false" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/utils/api.js'
import { useToastStore } from '@/store/toast.js'
import ConfirmModal from '@/components/modals/ConfirmModal.vue'

const toast = useToastStore()
const tarifs = ref([])
const loading = ref(false)
const showModal = ref(false)
const showConfirm = ref(false)
const editing = ref(null)
const deleteTarget = ref(null)
const saving = ref(false)
const deleting = ref(false)
const formError = ref('')
const form = ref({ dureeMin: 0, dureeMax: 60, prix: 0 })

function formatDuree(min) {
  if (!min && min !== 0) return '-'
  const h = Math.floor(min / 60); const m = min % 60
  if (h === 0) return `${m}min`
  return m > 0 ? `${h}h${m}min` : `${h}h`
}

async function load() {
  loading.value = true
  try {
    const r = await api.get('/tarifs')
    tarifs.value = r.data.data
  } catch (e) { toast.error(e.message) }
  finally { loading.value = false }
}

function openCreate() {
  editing.value = null; form.value = { dureeMin: 0, dureeMax: 60, prix: 0 }; formError.value = ''; showModal.value = true
}
function openEdit(t) {
  editing.value = t; form.value = { dureeMin: t.dureeMin, dureeMax: t.dureeMax, prix: t.prix }; formError.value = ''; showModal.value = true
}
function closeModal() { showModal.value = false; formError.value = '' }

async function save() {
  if (form.value.dureeMin === '' || form.value.dureeMax === '' || !form.value.prix) {
    formError.value = 'Tous les champs sont requis.'; return
  }
  if (form.value.dureeMin >= form.value.dureeMax) {
    formError.value = 'La durée min doit être inférieure à la durée max.'; return
  }
  saving.value = true; formError.value = ''
  try {
    if (editing.value) {
      await api.put(`/tarifs/${editing.value.idTarif}`, form.value)
      toast.success('Tarif modifié')
    } else {
      await api.post('/tarifs', form.value)
      toast.success('Tarif créé')
    }
    await load(); closeModal()
  } catch (e) { formError.value = e.message }
  finally { saving.value = false }
}

function openDelete(t) { deleteTarget.value = t; showConfirm.value = true }
async function doDelete() {
  deleting.value = true
  try {
    await api.delete(`/tarifs/${deleteTarget.value.idTarif}`)
    tarifs.value = tarifs.value.filter(t => t.idTarif !== deleteTarget.value.idTarif)
    toast.success('Tarif supprimé'); showConfirm.value = false
  } catch (e) { toast.error(e.message) }
  finally { deleting.value = false }
}

onMounted(load)
</script>

<style scoped>
.tarif-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.tarif-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 24px;
  display: flex; flex-direction: column; gap: 14px;
  transition: var(--transition);
  position: relative; overflow: hidden;
}
.tarif-card::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg, var(--gold), var(--gold-dark));
}
.tarif-card:hover { border-color: var(--border-gold); transform: translateY(-2px); box-shadow: var(--shadow-gold); }

.tarif-range {
  display: flex; align-items: center; gap: 8px;
  font-family: var(--font-display); font-size: 0.95rem; color: var(--text-secondary);
}
.tarif-arrow { color: var(--gold); }

.tarif-price {
  font-family: var(--font-display); font-size: 2rem; font-weight: 800; color: var(--text-primary);
}
.tarif-price span { font-size: 1rem; color: var(--gold); }

.tarif-actions { display: flex; gap: 8px; }
</style>
