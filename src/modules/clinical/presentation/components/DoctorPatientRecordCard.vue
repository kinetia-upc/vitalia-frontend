<script setup>
import viewIcon from '../../../../assets/images/clinical/view.png'
import editIcon from '../../../../assets/images/clinical/edit.png'
import newFileIcon from '../../../../assets/images/clinical/newFile.png'

defineProps({
  record: {
    type: Object,
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
  <article class="clinical-record-card">
    <div class="record-avatar" :class="`tone-${record.accent}`">
      {{ record.initials }}
    </div>

    <div class="record-main">
      <strong>{{ record.patientName }}</strong>
      <span>{{ record.patientCode }} - {{ record.reason }}</span>
    </div>

    <div class="record-meta">
      <small>{{ labels.appointment }}</small>
      <span>{{ record.appointmentTimeLabel }}</span>
    </div>

    <div class="record-meta">
      <small>{{ labels.status }}</small>
      <span class="record-status" :class="record.status">{{ record.statusLabel }}</span>
    </div>

    <div class="vital-trace">
      <small>{{ labels.vitalTrace }}</small>
      <div>
        <i v-for="(bar, index) in record.trace" :key="index" :style="{ height: `${bar}%` }"></i>
      </div>
    </div>

    <div class="record-actions">
      <button type="button" :aria-label="labels.viewHce" @click="$emit('view-record', record)">
        <img :src="viewIcon" alt="" />
      </button>
      <button type="button" :aria-label="labels.editHce" @click="$emit('edit-record', record)">
        <img :src="editIcon" alt="" />
      </button>
      <button type="button" :aria-label="labels.openPrescription" @click="$emit('open-prescription', record)">
        <img :src="newFileIcon" alt="" />
      </button>
    </div>
  </article>
</template>
