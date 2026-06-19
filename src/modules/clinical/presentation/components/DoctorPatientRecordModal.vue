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
  },
  medicines: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits([
  'close',
  'save-attention',
  'create-prescription',
  'create-prescription-detail',
  'delete-diagnosis',
  'delete-treatment',
  'delete-prescription',
  'delete-prescription-detail'
])

const pharmacyStore = usePharmacyStore()

onMounted(() => {
  if (!pharmacyStore.medicinesLoaded) {
    pharmacyStore.fetchMedicines()
  }
})

const form = reactive({
  medicine: '',
  selectedMedicineId: null,
  doseAmount: '',
  doseUnit: '',
  frequency: '',
  duration: ''
})
const diagnosisDrafts = ref([])
const treatmentDrafts = ref([])
const pendingPrescriptionDetails = ref([])
const prescriptionReuseMessage = ref('')

const doseUnitOptions = ['Mg', 'G', 'Mcg', 'Ml', 'L', 'Unit', 'Tablet', 'Capsule', 'Drop', 'Puff', 'Patch', 'Ampoule', 'Vial']

watch(() => form.medicine, (newVal) => {
  if (!newVal) return
  const selectedMed = pharmacyStore.medicines.find(m => m.name === newVal)
  if (selectedMed && !form.doseUnit) {
    const unit = selectedMed.unitType ?? ''
    form.doseUnit = unit.charAt(0).toUpperCase() + unit.slice(1).toLowerCase()
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
const showMedicineSuggestions = ref(false)
const medicineSuggestions = computed(() => {
  const query = form.medicine.trim().toLowerCase()
  if (!query) return []

  return props.medicines
    .filter((medicine) => medicine.name?.toLowerCase().includes(query))
    .slice(0, 6)
})
const selectedHistoryId = ref(null)
const selectedHistory = computed(() => {
  const history = props.record.medicalRecordHistory ?? []
  return history.find((item) => item.medicalRecord?.id === selectedHistoryId.value) ?? history[0] ?? null
})
const hasMultipleHistoryRecords = computed(() => (props.record.medicalRecordHistory?.length ?? 0) > 1)
const selectedHistoryPrescriptionDetails = computed(() => selectedHistory.value?.prescriptionDetails ?? [])
const lastPrescriptionDetails = computed(() => {
  const currentMedicalRecordId = props.record.medicalRecord?.id
  const history = props.record.medicalRecordHistory ?? []
  const lastRecord = history.find((item) =>
    item.medicalRecord?.id !== currentMedicalRecordId && (item.prescriptionDetails?.length ?? 0) > 0
  )

  return lastRecord?.prescriptionDetails ?? []
})
const canReuseLastPrescription = computed(() => lastPrescriptionDetails.value.length > 0)

watch(
  () => props.record,
  (record) => {
    const diagnoses = record?.diagnoses ?? (record?.diagnosis ? [record.diagnosis] : [])
    diagnosisDrafts.value = diagnoses.map((d) => ({ id: d.id ?? null, description: d.description ?? '' }))
    const treatments = record?.treatments ?? (record?.treatment ? [record.treatment] : [])
    treatmentDrafts.value = treatments.map((t) => ({ id: t.id ?? null, description: t.description ?? '' }))
    selectedHistoryId.value = record?.medicalRecordHistory?.[0]?.medicalRecord?.id ?? null
  },
  { immediate: true }
)

watch(
  () => props.record?.prescription?.id,
  () => {
    clearPrescriptionDrafts()
  }
)

function resetPrescriptionDetailForm() {
  form.medicine = ''
  form.selectedMedicineId = null
  form.doseAmount = ''
  form.doseUnit = ''
  form.frequency = ''
  form.duration = ''
}

function clearPrescriptionDrafts() {
  pendingPrescriptionDetails.value = []
  prescriptionReuseMessage.value = ''
  resetPrescriptionDetailForm()
}

function submitAttention() {
  const validDiagnoses = diagnosisDrafts.value.filter((d) => d.description.trim())
  const validTreatments = treatmentDrafts.value.filter((t) => t.description.trim())
  if (!validDiagnoses.length && !validTreatments.length) return

  emit('save-attention', {
    medicalRecordId: props.record.medicalRecord?.code,
    diagnoses: validDiagnoses,
    treatments: validTreatments
  })
}

function addDiagnosisDraft() {
  diagnosisDrafts.value.push({ id: null, description: '' })
}

function removeDiagnosisDraft(index) {
  const draft = diagnosisDrafts.value[index]
  if (draft?.id) {
    if (!confirm(props.labels.confirmDelete ?? 'Delete this diagnosis?')) return
  }
  diagnosisDrafts.value.splice(index, 1)
}

function addTreatmentDraft() {
  treatmentDrafts.value.push({ id: null, description: '' })
}

function removeTreatmentDraft(index) {
  const draft = treatmentDrafts.value[index]
  if (draft?.id) {
    if (!confirm(props.labels.confirmDelete ?? 'Delete this treatment?')) return
  }
  treatmentDrafts.value.splice(index, 1)
}

function selectMedicine(medicine) {
  form.medicine = medicine.name
  form.selectedMedicineId = medicine.id
  showMedicineSuggestions.value = false
}

function hideMedicineSuggestions() {
  setTimeout(() => { showMedicineSuggestions.value = false }, 150)
}

function handleMedicineInput() {
  const selectedMedicine = props.medicines.find((medicine) => medicine.id === form.selectedMedicineId)
  if (!selectedMedicine || selectedMedicine.name !== form.medicine.trim()) {
    form.selectedMedicineId = null
  }
  showMedicineSuggestions.value = form.medicine.trim().length > 0
}

function buildPrescriptionDetailDraft() {
  const medicine = form.medicine.trim()
  const unit = form.doseUnit.trim()
  const frequency = form.frequency.trim()
  const duration = form.duration.trim()

  if (!medicine || !form.doseAmount || !unit || !frequency || !duration) return null

  return {
    medicineId: form.selectedMedicineId ?? medicine,
    medicineName: medicine,
    doseAmount: Number(form.doseAmount),
    doseUnit: unit,
    frequency,
    duration
  }
}

function addPrescriptionDetailDraft() {
  const detail = buildPrescriptionDetailDraft()
  if (!detail) return

  pendingPrescriptionDetails.value.push(detail)
  resetPrescriptionDetailForm()
}

function removePrescriptionDetailDraft(index) {
  pendingPrescriptionDetails.value.splice(index, 1)
}

function isPrescriptionDetailReusable(detail) {
  const status = String(detail.status ?? '').toLowerCase()
  return !detail.restricted && !detail.is_restricted && !detail.is_outdated && status !== 'restricted' && status !== 'outdated'
}

function reuseLastPrescription() {
  if (!canReuseLastPrescription.value) return

  const reusableDetails = lastPrescriptionDetails.value.filter(isPrescriptionDetailReusable)
  if (reusableDetails.length !== lastPrescriptionDetails.value.length) {
    prescriptionReuseMessage.value = props.labels.prescriptionNeedsManualReview
    return
  }

  pendingPrescriptionDetails.value = reusableDetails.map((detail) => ({
    medicineId: detail.medicineId,
    medicineName: detail.medicineName || detail.medicineId,
    doseAmount: detail.doseAmount,
    doseUnit: detail.doseUnit,
    frequency: detail.frequency,
    duration: detail.duration
  }))
  prescriptionReuseMessage.value = props.labels.lastPrescriptionLoaded
  resetPrescriptionDetailForm()
}

function submitPrescriptionDetail() {
  if (!props.record.prescription?.id) return

  const currentDetail = buildPrescriptionDetailDraft()
  const details = currentDetail
    ? [...pendingPrescriptionDetails.value, currentDetail]
    : [...pendingPrescriptionDetails.value]

  if (!details.length) return

  emit('create-prescription-detail', {
    prescriptionId: props.record.prescription.id,
    details
  })

  clearPrescriptionDrafts()
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
              <ul v-if="selectedHistory.diagnoses?.length" class="clinical-entry-list">
                <li v-for="diag in selectedHistory.diagnoses" :key="diag.id" class="clinical-entry-display">
                  <span>{{ diag.description }}</span>
                  <button
                    v-if="!isViewMode"
                    type="button" class="clinical-remove-button"
                    :aria-label="labels.removeDiagnosis"
                    @click="$emit('delete-diagnosis', diag)"
                  >x</button>
                </li>
              </ul>
              <ul v-else-if="selectedHistory.diagnosis" class="clinical-entry-list">
                <li class="clinical-entry-display">
                  <span>{{ selectedHistory.diagnosis.description }}</span>
                  <button
                    v-if="!isViewMode"
                    type="button" class="clinical-remove-button"
                    :aria-label="labels.removeDiagnosis"
                    @click="$emit('delete-diagnosis', selectedHistory.diagnosis)"
                  >x</button>
                </li>
              </ul>
              <p v-else>{{ labels.noDiagnosis }}</p>
            </section>
            <section>
              <h4>{{ labels.treatment }}</h4>
              <ul v-if="selectedHistory.treatments?.length" class="clinical-entry-list">
                <li v-for="treat in selectedHistory.treatments" :key="treat.id" class="clinical-entry-display">
                  <span>{{ treat.description }}</span>
                  <button
                    v-if="!isViewMode"
                    type="button" class="clinical-remove-button"
                    :aria-label="labels.removeTreatment"
                    @click="$emit('delete-treatment', treat)"
                  >x</button>
                </li>
              </ul>
              <ul v-else-if="selectedHistory.treatment" class="clinical-entry-list">
                <li class="clinical-entry-display">
                  <span>{{ selectedHistory.treatment.description }}</span>
                  <button
                    v-if="!isViewMode"
                    type="button" class="clinical-remove-button"
                    :aria-label="labels.removeTreatment"
                    @click="$emit('delete-treatment', selectedHistory.treatment)"
                  >x</button>
                </li>
              </ul>
              <p v-else>{{ labels.noTreatment }}</p>
            </section>
            <section class="wide">
              <h4>{{ labels.prescriptions }}</h4>
              <ul v-if="selectedHistoryPrescriptionDetails.length">
                <li v-for="detail in selectedHistoryPrescriptionDetails" :key="detail.id">
                  {{ detail.medicineName || detail.medicineId }} - {{ detail.doseAmount }}{{ detail.doseUnit }}
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
          <article class="clinical-detail-section">
            <h3>{{ labels.diagnosis }}</h3>
            <div v-for="(diag, index) in diagnosisDrafts" :key="index" class="clinical-entry-row">
              <textarea
                v-model="diag.description"
                rows="2"
                :placeholder="labels.diagnosisPlaceholder ?? ''"
              ></textarea>
              <button type="button" class="clinical-remove-button" :aria-label="labels.removeDiagnosis" @click="removeDiagnosisDraft(index)">
                x
              </button>
            </div>
            <button type="button" class="clinical-secondary-button" @click="addDiagnosisDraft">
               + {{ labels.addDiagnosis ?? 'Add diagnosis' }}
            </button>
          </article>

          <article class="clinical-detail-section">
            <h3>{{ labels.treatment }}</h3>
            <div v-for="(treat, index) in treatmentDrafts" :key="index" class="clinical-entry-row">
              <textarea
                v-model="treat.description"
                rows="2"
                :placeholder="labels.treatmentPlaceholder ?? ''"
              ></textarea>
              <button type="button" class="clinical-remove-button" :aria-label="labels.removeTreatment" @click="removeTreatmentDraft(index)">
                x
              </button>
            </div>
            <button type="button" class="clinical-secondary-button" @click="addTreatmentDraft">
               + {{ labels.addTreatment ?? 'Add treatment' }}
            </button>
          </article>

          <button type="submit" class="clinical-primary-button" :disabled="!record.medicalRecord">
            {{ labels.saveClinicalAttention }}
          </button>
        </form>
      </section>

      <section v-else-if="isPrescriptionMode" class="clinical-card-stack">
        <article class="clinical-detail-section">
          <h3>{{ labels.prescription }}</h3>
          <p v-if="record.prescription">
            {{ labels.prescriptionDate }}: {{ record.prescription.createdAt }}
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
          <div v-if="prescriptionDetails.length" class="clinical-entry-list">
            <div v-for="detail in prescriptionDetails" :key="detail.id" class="clinical-entry-display">
              <span>
                {{ detail.medicineName || detail.medicineId }} - {{ detail.doseAmount }}{{ detail.doseUnit }}
                - {{ detail.frequency }} - {{ detail.duration }}
              </span>
              <button
                type="button" class="clinical-remove-button"
                :aria-label="labels.removePrescriptionDetail"
                @click="$emit('delete-prescription-detail', detail)"
              >x</button>
            </div>
          </div>
          <p v-else>{{ labels.noPrescriptionDetails }}</p>
        </article>
        <form
          v-if="record.prescription"
          class="clinical-prescription-form"
          novalidate
          @submit.prevent="submitPrescriptionDetail"
        >
          <h3>{{ labels.addPrescriptionDetail }}</h3>
          <div v-if="canReuseLastPrescription" class="clinical-prescription-actions">
            <button type="button" class="clinical-secondary-button" @click="reuseLastPrescription">
              {{ labels.reuseLastPrescription }}
            </button>
          </div>
          <p v-if="prescriptionReuseMessage" class="clinical-prescription-note">
            {{ prescriptionReuseMessage }}
          </p>
          <label class="medicine-search-field">
            <span>{{ labels.medicine }}</span>
            <input
              v-model="form.medicine"
              type="text"
              :placeholder="labels.searchMedicine"
              autocomplete="off"
              @input="handleMedicineInput"
              @blur="hideMedicineSuggestions"
              @focus="handleMedicineInput"
            />
            <div v-if="showMedicineSuggestions && medicineSuggestions.length" class="medicine-suggestions">
              <button
                v-for="medicine in medicineSuggestions"
                :key="medicine.id"
                type="button"
                @click="selectMedicine(medicine)"
              >
                <strong>{{ medicine.name }}</strong>
                <span>{{ medicine.unitQuantity }}{{ medicine.unitType }}</span>
              </button>
            </div>
          </label>
          <div class="clinical-prescription-grid">
            <label>
              <span>{{ labels.dose }}</span>
              <input v-model="form.doseAmount" type="number" min="0" step="1" />
            </label>
            <label>
              <span>{{ labels.doseUnitType }}</span>
              <select v-model="form.doseUnit">
                <option value="">--</option>
                <option>Mg</option>
                <option>G</option>
                <option>Mcg</option>
                <option>Ml</option>
                <option>L</option>
                <option>Unit</option>
                <option>Tablet</option>
                <option>Capsule</option>
                <option>Drop</option>
                <option>Puff</option>
                <option>Patch</option>
                <option>Ampoule</option>
                <option>Vial</option>
              </select>
            </label>
            <label>
              <span>{{ labels.frequency }}</span>
              <input v-model="form.frequency" type="text" />
            </label>
            <label>
              <span>{{ labels.duration }}</span>
              <input v-model="form.duration" type="text" />
            </label>
          </div>
          <div v-if="pendingPrescriptionDetails.length" class="prescription-draft-list">
            <article v-for="(detail, index) in pendingPrescriptionDetails" :key="`${detail.medicineName}-${index}`">
              <span>
                {{ detail.medicineName }} - {{ detail.doseAmount }}{{ detail.doseUnit }}
                - {{ detail.frequency }} - {{ detail.duration }}
              </span>
              <button type="button" :aria-label="labels.removeMedicine" @click="removePrescriptionDetailDraft(index)">
                x
              </button>
            </article>
          </div>
          <div class="clinical-prescription-actions">
            <button type="button" class="clinical-secondary-button" @click="addPrescriptionDetailDraft">
              {{ labels.addAnotherMedicine }}
            </button>
            <button type="submit" class="clinical-primary-button">
              {{ labels.savePrescriptionDetails }}
            </button>
          </div>
        </form>
      </section>
    </article>
  </div>
</template>

<style scoped>
.clinical-entry-list {
  list-style: disc;
  margin: 0;
}
.clinical-entry-list li span {
  word-break: break-word;
  overflow-wrap: break-word;
}
.clinical-entry-display,
.clinical-entry-row {
  position: relative;
  padding: 0 2rem 0 0;
}
.clinical-entry-display .clinical-remove-button,
.clinical-entry-row .clinical-remove-button {
  position: absolute;
  top: 0;
  right: 0;
}
.clinical-remove-button {
    background: transparent;
    border: none;
    color: red;
    font-size: 1.2em;
    cursor: pointer;
    padding: 0 10px;
}
</style>
