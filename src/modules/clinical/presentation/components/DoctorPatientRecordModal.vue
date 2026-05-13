<script setup>
import { computed, reactive, ref, watch, onMounted } from 'vue'
import usePharmacyStore from '../../../pharmacy/application/pharmacy.store.js'

const props = defineProps({
  mode: {
    type: String,
    required: true
  },
  record: {
    type: Object,
    required: true
  },
  labels: {
    type: Object,
    required: true
  }
})

const emit = defineEmits([
  'close',
  'save-attention',
  'create-prescription',
  'create-prescription-detail'
])

const pharmacyStore = usePharmacyStore()

onMounted(() => {
  if (!pharmacyStore.medicinesLoaded) {
    pharmacyStore.fetchMedicines()
  }
})

const form = reactive({
  diagnosis: '',
  treatment: '',
  medicine: '',
  dose: '',
  dose_unit_type: '',
  frequency: '',
  duration: ''
})

watch(() => form.medicine, (newVal) => {
  if (!newVal) return
  const selectedMed = pharmacyStore.medicines.find(m => m.name === newVal)
  if (selectedMed && !form.dose_unit_type) {
    form.dose_unit_type = selectedMed.unitType
  }
})

const isViewMode = computed(() => props.mode === 'view')
const isEditMode = computed(() => props.mode === 'edit')
const isPrescriptionMode = computed(() => props.mode === 'prescription')

const modalTitle = computed(() => {
  if (isEditMode.value) return props.labels.editRecordTitle
  if (isPrescriptionMode.value) return props.labels.prescriptionTitle
  return props.labels.recordTitle
})

const prescriptionDetails = computed(() => props.record.prescriptionDetails ?? [])
const selectedHistoryId = ref(null)
const selectedHistory = computed(() => {
  const history = props.record.medicalRecordHistory ?? []
  return history.find((item) => item.medicalRecord?.id === selectedHistoryId.value) ?? history[0] ?? null
})
const hasMultipleHistoryRecords = computed(() => (props.record.medicalRecordHistory?.length ?? 0) > 1)
const selectedHistoryPrescriptionDetails = computed(() => selectedHistory.value?.prescriptionDetails ?? [])

watch(
  () => props.record,
  (record) => {
    form.diagnosis = record?.diagnosis?.description ?? ''
    form.treatment = record?.treatment?.description ?? ''
    selectedHistoryId.value = record?.medicalRecordHistory?.[0]?.medicalRecord?.id ?? null
  },
  { immediate: true }
)

watch(
  () => props.record?.prescription?.id,
  () => {
    resetPrescriptionDetailForm()
  }
)

function resetPrescriptionDetailForm() {
  form.medicine = ''
  form.dose = ''
  form.dose_unit_type = ''
  form.frequency = ''
  form.duration = ''
}

function submitAttention() {
  emit('save-attention', {
    medicalRecordId: props.record.medicalRecord?.id,
    diagnosis: form.diagnosis.trim(),
    treatment: form.treatment.trim()
  })
}

function submitPrescriptionDetail() {
  const medicineName = form.medicine.trim()
  if (!props.record.prescription?.id || !medicineName) return

  const selectedMed = pharmacyStore.medicines.find((m) => m.name === medicineName)

  emit('create-prescription-detail', {
    prescriptionId: props.record.prescription.id,
    detail: {
      id_medicine: selectedMed ? selectedMed.id : medicineName,
      medicine_name: medicineName,
      dose: Number(form.dose),
      dose_unit_type: form.dose_unit_type.trim(),
      frequency: form.frequency.trim(),
      duration: form.duration.trim()
    }
  })

  resetPrescriptionDetailForm()
}
</script>

<template>
  <div class="clinical-modal-backdrop" role="presentation" @click.self="$emit('close')">
    <article class="clinical-detail-modal" role="dialog" aria-modal="true" :aria-label="modalTitle">
      <header class="clinical-detail-header">
        <div>
          <small>{{ record.patientCode }}</small>
          <h2>{{ modalTitle }}</h2>
          <p>{{ record.patientName }} - {{ record.appointmentTimeLabel }}</p>
        </div>
        <button type="button" class="clinical-close-button" :aria-label="labels.close" @click="$emit('close')">
          x
        </button>
      </header>

      <section class="clinical-detail-grid">
        <article class="clinical-detail-card">
          <small>{{ labels.patient }}</small>
          <strong>{{ record.patientName }}</strong>
          <span>{{ labels.appointmentId }}: {{ record.appointmentId }}</span>
        </article>
        <article class="clinical-detail-card">
          <small>{{ labels.status }}</small>
          <strong>{{ record.statusLabel }}</strong>
          <span>{{ record.reason }}</span>
        </article>
      </section>

      <section v-if="isViewMode" class="clinical-card-stack">
        <article v-if="hasMultipleHistoryRecords" class="clinical-detail-section">
          <h3>{{ labels.recordHistory }}</h3>
          <div class="clinical-history-list">
            <button
              v-for="historyRecord in record.medicalRecordHistory"
              :key="historyRecord.medicalRecord?.id"
              type="button"
              :class="{ active: selectedHistory?.medicalRecord?.id === historyRecord.medicalRecord?.id }"
              @click="selectedHistoryId = historyRecord.medicalRecord?.id"
            >
              <strong>{{ historyRecord.code }}</strong>
              <span>{{ historyRecord.appointmentTimeLabel }}</span>
              <small v-if="selectedHistory?.medicalRecord?.id === historyRecord.medicalRecord?.id">
                {{ labels.selected }}
              </small>
            </button>
          </div>
        </article>

        <article v-if="selectedHistory" class="clinical-detail-section">
          <div class="clinical-record-detail-heading">
            <div>
              <h3>{{ selectedHistory.code }}</h3>
              <p>{{ labels.recordDate }}: {{ selectedHistory.appointmentTimeLabel }}</p>
            </div>
            <small>{{ labels.appointmentId }}: {{ selectedHistory.appointmentId }}</small>
          </div>

          <div class="clinical-record-detail-grid">
            <section>
              <h4>{{ labels.diagnosis }}</h4>
              <p>{{ selectedHistory.diagnosis?.description || labels.noDiagnosis }}</p>
            </section>
            <section>
              <h4>{{ labels.treatment }}</h4>
              <p>{{ selectedHistory.treatment?.description || labels.noTreatment }}</p>
            </section>
            <section class="wide">
              <h4>{{ labels.prescriptions }}</h4>
              <ul v-if="selectedHistoryPrescriptionDetails.length">
                <li v-for="detail in selectedHistoryPrescriptionDetails" :key="detail.id">
                  {{ detail.medicine_name || detail.id_medicine }} - {{ detail.dose }}{{ detail.dose_unit_type }}
                  - {{ detail.frequency }} - {{ detail.duration }}
                </li>
              </ul>
              <p v-else>{{ labels.noPrescription }}</p>
            </section>
          </div>
        </article>
        <article v-else class="clinical-detail-section">
          <p>{{ labels.noRecords }}</p>
        </article>
      </section>

      <section v-else-if="isEditMode" class="clinical-card-stack">
        <form class="clinical-form" @submit.prevent="submitAttention">
          <label>
            <span>{{ labels.diagnosis }}</span>
            <textarea v-model="form.diagnosis" rows="4"></textarea>
          </label>
          <label>
            <span>{{ labels.treatment }}</span>
            <textarea v-model="form.treatment" rows="4"></textarea>
          </label>
          <button type="submit" class="clinical-primary-button" :disabled="!record.medicalRecord">
            {{ labels.saveClinicalAttention }}
          </button>
        </form>
        <article class="clinical-detail-section">
          <h3>{{ labels.prescription }}</h3>
          <p v-if="record.prescription">
            {{ labels.prescriptionDate }}: {{ record.prescription.date }}
          </p>
          <p v-else>{{ labels.noPrescription }}</p>
          <button
            v-if="!record.prescription"
            type="button"
            class="clinical-primary-button"
            :disabled="!record.medicalRecord"
            @click="$emit('create-prescription', record)"
          >
            {{ labels.createPrescription }}
          </button>
        </article>
        <form v-if="record.prescription" class="clinical-prescription-form" @submit.prevent="submitPrescriptionDetail">
          <h3>{{ labels.addPrescriptionDetail }}</h3>
          <label>
            <span>{{ labels.medicine }}</span>
            <input
              v-model="form.medicine"
              type="text"
              list="pharmacy-medicines"
              :placeholder="labels.searchMedicine"
              required
            />
            <datalist id="pharmacy-medicines">
              <option v-for="med in pharmacyStore.medicines" :key="med.id" :value="med.name">
                {{ med.stock }} in stock
              </option>
            </datalist>
          </label>
          <div class="clinical-prescription-grid">
            <label>
              <span>{{ labels.dose }}</span>
              <input v-model="form.dose" type="number" min="0" step="1" required />
            </label>
            <label>
              <span>{{ labels.doseUnitType }}</span>
              <input v-model="form.dose_unit_type" type="text" maxlength="5" required />
            </label>
            <label>
              <span>{{ labels.frequency }}</span>
              <input v-model="form.frequency" type="text" required />
            </label>
            <label>
              <span>{{ labels.duration }}</span>
              <input v-model="form.duration" type="text" required />
            </label>
          </div>
          <button type="submit" class="clinical-primary-button">
            {{ labels.addMedicine }}
          </button>
        </form>
      </section>

      <section v-else-if="isPrescriptionMode" class="clinical-card-stack">
        <article class="clinical-detail-section">
          <h3>{{ labels.prescription }}</h3>
          <p v-if="record.prescription">
            {{ labels.prescriptionDate }}: {{ record.prescription.date }}
          </p>
          <p v-else>{{ labels.noPrescription }}</p>
          <button
            v-if="!record.prescription"
            type="button"
            class="clinical-primary-button"
            :disabled="!record.medicalRecord"
            @click="$emit('create-prescription', record)"
          >
            {{ labels.createPrescription }}
          </button>
        </article>
        <article class="clinical-detail-section">
          <h3>{{ labels.prescriptionDetails }}</h3>
          <ul v-if="prescriptionDetails.length">
            <li v-for="detail in prescriptionDetails" :key="detail.id">
              {{ detail.medicine_name || detail.id_medicine }} - {{ detail.dose }}{{ detail.dose_unit_type }}
              - {{ detail.frequency }} - {{ detail.duration }}
            </li>
          </ul>
          <p v-else>{{ labels.noPrescriptionDetails }}</p>
        </article>
        <form v-if="record.prescription" class="clinical-prescription-form" @submit.prevent="submitPrescriptionDetail">
          <h3>{{ labels.addPrescriptionDetail }}</h3>
          <label>
            <span>{{ labels.medicine }}</span>
            <input
              v-model="form.medicine"
              type="text"
              list="pharmacy-medicines"
              :placeholder="labels.searchMedicine"
              required
            />
            <datalist id="pharmacy-medicines">
              <option v-for="med in pharmacyStore.medicines" :key="med.id" :value="med.name">
                {{ med.stock }} in stock
              </option>
            </datalist>
          </label>
          <div class="clinical-prescription-grid">
            <label>
              <span>{{ labels.dose }}</span>
              <input v-model="form.dose" type="number" min="0" step="1" required />
            </label>
            <label>
              <span>{{ labels.doseUnitType }}</span>
              <input v-model="form.dose_unit_type" type="text" maxlength="5" required />
            </label>
            <label>
              <span>{{ labels.frequency }}</span>
              <input v-model="form.frequency" type="text" required />
            </label>
            <label>
              <span>{{ labels.duration }}</span>
              <input v-model="form.duration" type="text" required />
            </label>
          </div>
          <button type="submit" class="clinical-primary-button">
            {{ labels.addMedicine }}
          </button>
        </form>
      </section>
    </article>
  </div>
</template>
