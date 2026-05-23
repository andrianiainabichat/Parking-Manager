<template>
  <Teleport to="body">
    <div class="modal-overlay" v-if="show" @click.self="$emit('cancel')">
      <div class="modal" style="max-width:420px">
        <div class="modal-header">
          <div class="modal-title">
            <div class="modal-icon">⚠️</div>
            {{ title || 'Confirmer la suppression' }}
          </div>
          <button class="modal-close" @click="$emit('cancel')">✕</button>
        </div>
        <div class="modal-body">
          <div class="confirm-icon">🗑️</div>
          <p class="confirm-text">
            Êtes-vous sûr de vouloir supprimer
            <span class="confirm-name">{{ name }}</span> ?
            <br>Cette action est <strong>irréversible</strong>.
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="$emit('cancel')">Annuler</button>
          <button class="btn btn-danger" @click="$emit('confirm')" :disabled="loading">
            <span v-if="loading" class="loading-spinner"></span>
            <span v-else>Supprimer</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
defineProps({ show: Boolean, title: String, name: String, loading: Boolean })
defineEmits(['confirm', 'cancel'])
</script>
