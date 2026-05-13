<script setup>
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

const emit = defineEmits(['close', 'download-record'])
</script>

<template>
  <div class="history-detail-backdrop" @click.self="emit('close')">
    <article class="history-detail-modal">
      <header>
        <div>
          <small>{{ record.code }}</small>
          <h2>{{ record.title }}</h2>
          <p>{{ record.dateLabel }}</p>
        </div>
        <button type="button" @click="emit('close')">x</button>
      </header>

      <div class="history-detail-grid">
        <section>
          <small>{{ labels.patient }}</small>
          <strong>{{ record.patientName }}</strong>
        </section>
        <section>
          <small>{{ labels.appointmentId }}</small>
          <strong>{{ record.appointmentId || '-' }}</strong>
        </section>
        <section>
          <small>{{ labels.provider }}</small>
          <strong>{{ record.provider }}</strong>
          <span>{{ record.providerRole }}</span>
        </section>
        <section>
          <small>{{ labels.status }}</small>
          <strong>{{ record.status }}</strong>
        </section>
      </div>

      <section class="history-detail-section">
        <h3>{{ labels.diagnosis }}</h3>
        <p>{{ record.diagnosis || labels.noDiagnosis }}</p>
      </section>

      <section class="history-detail-section">
        <h3>{{ labels.treatment }}</h3>
        <p>{{ record.treatment || labels.noTreatment }}</p>
      </section>

      <section class="history-detail-section">
        <h3>{{ labels.prescription }}</h3>
        <p v-if="record.prescriptionDate">{{ labels.prescriptionDate }}: {{ record.prescriptionDate }}</p>
        <p v-else>{{ labels.noPrescription }}</p>
        <ul v-if="record.prescriptionDetails.length">
          <li v-for="item in record.prescriptionDetails" :key="item.id">
            {{ item.medicine_name || item.id_medicine }} - {{ item.dose }}{{ item.dose_unit_type }}
            - {{ item.frequency }} - {{ item.duration }}
          </li>
        </ul>
      </section>

      <button
        type="button"
        class="history-record-download"
        @click="emit('download-record')"
      >
        {{ labels.downloadRecord }}
      </button>
    </article>
  </div>
</template>
