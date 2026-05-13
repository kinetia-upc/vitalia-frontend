<script setup>
defineProps({
  disabled: {
    type: Boolean,
    default: false
  },
  labels: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['download'])
</script>

<template>
  <button
    class="history-download-card"
    type="button"
    :disabled="disabled"
    @click="emit('download')"
  >
    <span>PDF</span>
    <div>
      <strong>{{ labels.downloadDossier }}</strong>
      <small>{{ labels.pdfExport }}</small>
    </div>
    <i>›</i>
  </button>
</template>
