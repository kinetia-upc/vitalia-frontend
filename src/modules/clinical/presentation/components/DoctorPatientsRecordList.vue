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

defineEmits(['view-record', 'edit-record', 'open-prescription'])
</script>

<template>
  <div class="clinical-record-list">
    <DoctorPatientRecordCard
      v-for="record in records"
      :key="record.id"
      :record="record"
      :labels="labels"
      @view-record="$emit('view-record', $event)"
      @edit-record="$emit('edit-record', $event)"
      @open-prescription="$emit('open-prescription', $event)"
    />

    <article v-if="!records.length" class="clinical-empty-card">
      <strong>{{ labels.emptyTitle }}</strong>
      <p>{{ labels.emptyDescription }}</p>
    </article>
  </div>
</template>
