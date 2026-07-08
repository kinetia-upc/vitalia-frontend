<script setup>
import { useI18n } from 'vue-i18n'
import usePharmacyStore from '../../../pharmacy/application/pharmacy.store.js'

const props = defineProps({
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
const { locale } = useI18n()
const pharmacyStore = usePharmacyStore()

if (!pharmacyStore.medicinesLoaded) {
  pharmacyStore.fetchMedicines()
}

function formatDate(value) {
  if (!value) return '-'
  const d = new Date(value)
  if (isNaN(d)) return '-'
  return d.toLocaleDateString(locale.value === 'es' ? 'es-PE' : 'en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  })
}

function medicineLabel(detail) {
  if (detail?.medicineName) return detail.medicineName
  return pharmacyStore.medicines.find((medicine) => medicine.id === detail?.medicineId)?.name ?? detail?.medicineId
}

function formatPrescriptionDetail(detail) {
  const quantity = Number(detail.quantity) || 0
  const frequency = Number(detail.frequency) || 0
  const duration = Number(detail.duration) || 0
  const medicine = pharmacyStore.medicines.find((item) => item.id === detail?.medicineId) ?? null
  const presentation = medicine?.unitQuantity && medicine?.unitType
    ? `${medicine.unitQuantity}${medicine.unitType}`
    : ''
  const quantityLabel = locale.value === 'es'
    ? `${quantity} ${quantity === 1 ? 'unidad' : 'unidades'}`
    : `${quantity} ${quantity === 1 ? 'unit' : 'units'}`
  const frequencyLabel = locale.value === 'es'
    ? `cada ${frequency} ${frequency === 1 ? 'hora' : 'horas'}`
    : `every ${frequency} ${frequency === 1 ? 'hour' : 'hours'}`
  const durationLabel = locale.value === 'es'
    ? `por ${duration} ${duration === 1 ? 'dia' : 'dias'}`
    : `for ${duration} ${duration === 1 ? 'day' : 'days'}`
  const medicineText = presentation ? `${medicineLabel(detail)} ${presentation}` : medicineLabel(detail)

  return `${medicineText} - ${quantityLabel} ${frequencyLabel} ${durationLabel}`
}
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
          <strong class="app-code">{{ record.appointmentId || '-' }}</strong>
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
        <ul v-if="record.diagnoses?.length">
          <li v-for="diag in record.diagnoses" :key="diag.id">{{ diag.description }}</li>
        </ul>
        <p v-else-if="record.diagnosis">{{ record.diagnosis }}</p>
        <p v-else>{{ labels.noDiagnosis }}</p>
      </section>

      <section class="history-detail-section">
        <h3>{{ labels.treatment }}</h3>
        <ul v-if="record.treatments?.length">
          <li v-for="treat in record.treatments" :key="treat.id">{{ treat.description }}</li>
        </ul>
        <p v-else-if="record.treatment">{{ record.treatment }}</p>
        <p v-else>{{ labels.noTreatment }}</p>
      </section>

      <section class="history-detail-section">
        <h3>{{ labels.prescription }}</h3>
        <p v-if="record.prescriptionDate">{{ labels.prescriptionDate }}: {{ formatDate(record.prescriptionDate) }}</p>
        <p v-else>{{ labels.noPrescription }}</p>
        <ul v-if="record.prescriptionDetails.length">
          <li v-for="item in record.prescriptionDetails" :key="item.id">
            {{ formatPrescriptionDetail(item) }}
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
