<script setup>
import DoctorPatientRecordCard from './DoctorPatientRecordCard.vue'

defineProps({
  records: {
    type: Array,
    required: true
  },
  labels: {
    type: Object,
    required: true
  }
})

defineEmits(['open-care', 'start-attention'])
</script>

<template>
  <div class="clinical-record-list">
    <DoctorPatientRecordCard
      v-for="record in records"
      :key="record.id"
      :record="record"
      :labels="labels"
      @open-care="$emit('open-care', $event)"
      @start-attention="$emit('start-attention', $event)"
    />

    <article v-if="!records.length" class="clinical-empty-card">
      <strong>{{ labels.emptyTitle }}</strong>
      <p>{{ labels.emptyDescription }}</p>
    </article>
  </div>
</template>
