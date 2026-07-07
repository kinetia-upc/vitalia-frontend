<script setup>
import { computed, reactive, ref, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import usePharmacyStore from '../../../pharmacy/application/pharmacy.store.js'
import useTenantStore from '../../../tenant/application/tenant.store.js'

const props = defineProps({
  mode: {
    type: String,
    default: 'care'
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
  },
  prescriptionSaveError: {
    type: String,
    default: ''
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
const tenantStore = useTenantStore()
const { t, locale } = useI18n()

onMounted(() => {
  if (!pharmacyStore.medicinesLoaded) {
    pharmacyStore.fetchMedicines()
  }
  if (!tenantStore.branchesLoaded) {
    tenantStore.fetchBranches()
  }
})

const form = reactive({
  medicine: '',
  selectedMedicineId: null,
  quantity: '',
  doseUnit: '',
  frequency: '',
  duration: ''
})
const diagnosisDrafts = ref([])
const treatmentDrafts = ref([])
const pendingPrescriptionDetails = ref([])
const prescriptionReuseMessage = ref('')
const prescriptionValidationError = ref('')
const openPanel = ref('attention')
const patientDataVisible = ref(true)
const healthRecordSelectorOpen = ref(false)
const activeDiagnosisSuggestionIndex = ref(null)
const diagnosisSuggestions = ref({})

const doseUnitOptions = ['Mg', 'G', 'Mcg', 'Ml', 'L', 'Unit', 'Tablet', 'Capsule', 'Drop', 'Puff', 'Patch', 'Ampoule', 'Vial']

watch(() => form.medicine, (newVal) => {
  if (!newVal) return
  const selectedMed = pharmacyStore.medicines.find(m => m.name === newVal)
  if (selectedMed && !form.doseUnit) {
    const unit = selectedMed.unitType ?? ''
    form.doseUnit = unit.charAt(0).toUpperCase() + unit.slice(1).toLowerCase()
  }
})

const modalTitle = computed(() => props.labels.careWorkspaceTitle ?? 'Clinical care')

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
const diagnosisCatalogBranchId = computed(() => {
  const branchRef = props.record.branchCode ?? props.record.branchId ?? null
  if (!branchRef) return null

  return tenantStore.branches.find((branch) =>
    branch.id === branchRef || branch.code === branchRef
  )?.code ?? branchRef
})

function togglePanel(panel) {
  openPanel.value = openPanel.value === panel ? '' : panel
}

function togglePatientData() {
  patientDataVisible.value = !patientDataVisible.value
}

function toggleHealthRecordSelector() {
  healthRecordSelectorOpen.value = !healthRecordSelectorOpen.value
}

function medicineLabel(detail) {
  if (detail?.medicineName) return detail.medicineName
  return pharmacyStore.medicines.find((medicine) => medicine.id === detail?.medicineId)?.name ?? detail?.medicineId
}

function medicineResource(detail) {
  return pharmacyStore.medicines.find((medicine) => medicine.id === detail?.medicineId) ?? null
}

function formatMedicinePresentation(detail) {
  const medicine = medicineResource(detail)
  const name = medicineLabel(detail)
  const unitQuantity = medicine?.unitQuantity ?? ''
  const unitType = medicine?.unitType ?? ''
  const presentation = unitQuantity && unitType ? `${unitQuantity}${unitType}` : ''
  return presentation ? `${name} ${presentation}` : name
}

function formatPrescriptionDetail(detail) {
  const quantity = Number(detail.quantity) || 0
  const frequency = Number(detail.frequency) || 0
  const duration = Number(detail.duration) || 0
  const quantityLabel = locale.value === 'es'
    ? `${quantity} ${quantity === 1 ? 'unidad' : 'unidades'}`
    : `${quantity} ${quantity === 1 ? 'unit' : 'units'}`
  const frequencyLabel = locale.value === 'es'
    ? `cada ${frequency} ${frequency === 1 ? 'hora' : 'horas'}`
    : `every ${frequency} ${frequency === 1 ? 'hour' : 'hours'}`
  const durationLabel = locale.value === 'es'
    ? `por ${duration} ${duration === 1 ? 'dia' : 'dias'}`
    : `for ${duration} ${duration === 1 ? 'day' : 'days'}`

  return `${formatMedicinePresentation(detail)} - ${quantityLabel} ${frequencyLabel} ${durationLabel}`
}

watch(
  () => props.record,
  (record) => {
    const diagnoses = record?.diagnoses ?? (record?.diagnosis ? [record.diagnosis] : [])
    diagnosisDrafts.value = diagnoses.map((d) => ({
      id: d.id ?? null,
      cie10Code: d.cie10Code ?? d.code ?? '',
      description: d.description ?? '',
      originalCie10Code: d.cie10Code ?? d.code ?? '',
      originalDescription: d.description ?? ''
    }))
    const treatments = record?.treatments ?? (record?.treatment ? [record.treatment] : [])
    treatmentDrafts.value = treatments.map((t) => ({
      id: t.id ?? null,
      description: t.description ?? '',
      originalDescription: t.description ?? ''
    }))
    selectedHistoryId.value = record?.medicalRecordHistory?.[0]?.medicalRecord?.id ?? null
    diagnosisSuggestions.value = {}
    activeDiagnosisSuggestionIndex.value = null
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
  form.quantity = ''
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
  const validDiagnoses = diagnosisDrafts.value.filter((d) => d.description.trim() && (d.id || d.cie10Code?.trim()))
  const validTreatments = treatmentDrafts.value.filter((t) => t.description.trim())
  const hadExistingEntries = (props.record?.diagnoses?.length ?? 0) > 0 ||
    (props.record?.treatments?.length ?? 0) > 0 ||
    Boolean(props.record?.diagnosis) ||
    Boolean(props.record?.treatment)
  if (!validDiagnoses.length && !validTreatments.length && !hadExistingEntries) return

  emit('save-attention', {
    medicalRecordId: props.record.medicalRecord?.id,
    diagnoses: validDiagnoses,
    treatments: validTreatments
  })
}

function addDiagnosisDraft() {
  diagnosisDrafts.value.push({
    id: null,
    cie10Code: '',
    description: '',
    originalCie10Code: '',
    originalDescription: ''
  })
}

function removeDiagnosisDraft(index) {
  const draft = diagnosisDrafts.value[index]
  if (draft?.id) {
    if (!confirm(props.labels.confirmDelete ?? 'Delete this diagnosis?')) return
    emit('delete-diagnosis', draft)
  }
  diagnosisDrafts.value.splice(index, 1)
  const nextSuggestions = { ...diagnosisSuggestions.value }
  delete nextSuggestions[index]
  diagnosisSuggestions.value = nextSuggestions
}

async function handleDiagnosisInput(index, shouldClearCode = true) {
  const draft = diagnosisDrafts.value[index]
  if (!draft) return

  if (shouldClearCode) draft.cie10Code = ''
  activeDiagnosisSuggestionIndex.value = index

  const query = draft.description.trim()
  if (query.length < 2 || !diagnosisCatalogBranchId.value) {
    diagnosisSuggestions.value = { ...diagnosisSuggestions.value, [index]: [] }
    return
  }

  const results = await tenantStore.searchDiagnosisCatalog(diagnosisCatalogBranchId.value, query, 8)
  diagnosisSuggestions.value = { ...diagnosisSuggestions.value, [index]: results }
}

function selectDiagnosis(index, diagnosis) {
  const draft = diagnosisDrafts.value[index]
  if (!draft) return

  draft.description = diagnosis.description
  draft.cie10Code = diagnosis.code
  diagnosisSuggestions.value = { ...diagnosisSuggestions.value, [index]: [] }
  activeDiagnosisSuggestionIndex.value = null
}

function hideDiagnosisSuggestions() {
  setTimeout(() => {
    activeDiagnosisSuggestionIndex.value = null
  }, 150)
}

function addTreatmentDraft() {
  treatmentDrafts.value.push({ id: null, description: '' })
}

function removeTreatmentDraft(index) {
  const draft = treatmentDrafts.value[index]
  if (draft?.id) {
    if (!confirm(props.labels.confirmDelete ?? 'Delete this treatment?')) return
    emit('delete-treatment', draft)
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
  const frequency = form.frequency
  const duration = form.duration

  const missingFields = []
  if (!medicine) missingFields.push(props.labels.medicine)
  if (form.quantity === '' || form.quantity === null) missingFields.push(props.labels.dose)
  if (!unit) missingFields.push(props.labels.doseUnitType)
  if (frequency === '' || frequency === null) missingFields.push(props.labels.frequency)
  if (duration === '' || duration === null) missingFields.push(props.labels.duration)

  if (missingFields.length) {
    prescriptionValidationError.value = `${t('clinical.doctorPatients.missingFieldsPrefix')}: ${missingFields.join(', ')}`
    return null
  }

  if (!form.selectedMedicineId) {
    prescriptionValidationError.value = t('clinical.doctorPatients.medicineNotSelected')
    return null
  }

  prescriptionValidationError.value = ''
  return {
    medicineId: form.selectedMedicineId,
    medicineName: medicine,
    quantity: Number(form.quantity),
    doseUnit: unit,
    frequency: Number(frequency),
    duration: Number(duration)
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
    quantity: detail.quantity,
    doseUnit: detail.doseUnit,
    frequency: detail.frequency,
    duration: detail.duration
  }))
  prescriptionReuseMessage.value = props.labels.lastPrescriptionLoaded
  resetPrescriptionDetailForm()
}

function submitPrescriptionDetail() {
  prescriptionValidationError.value = ''

  if (!props.record.prescription?.id) {
    prescriptionValidationError.value = t('clinical.doctorPatients.prescriptionNotCreatedYet')
    return
  }

  const hasCurrentInput = form.medicine.trim() || form.quantity || form.doseUnit.trim() || form.frequency || form.duration
  let currentDetail = null
  if (hasCurrentInput) {
    currentDetail = buildPrescriptionDetailDraft()
    if (!currentDetail) return
  }

  const details = currentDetail
    ? [...pendingPrescriptionDetails.value, currentDetail]
    : [...pendingPrescriptionDetails.value]

  if (!details.length) {
    prescriptionValidationError.value = t('clinical.doctorPatients.noMedicineToSave')
    return
  }

  emit('create-prescription-detail', {
    prescriptionId: props.record.prescription.id,
    details
  })

  clearPrescriptionDrafts()
}
</script>

<template>
  <div class="clinical-modal-backdrop clinical-workspace-backdrop" role="presentation" @click.self="$emit('close')">
    <article class="clinical-detail-modal clinical-workspace" role="dialog" aria-modal="true" :aria-label="modalTitle">
      <button type="button" class="clinical-close-button clinical-workspace-close" :aria-label="labels.close" @click="$emit('close')">
        x
      </button>

      <section class="clinical-workspace-grid">
        <aside class="clinical-workspace-pane">
          <article class="clinical-detail-section clinical-patient-data">
            <button type="button" class="clinical-section-toggle" :class="{ active: patientDataVisible }" @click="togglePatientData">
              <div>
                <small>{{ record.ehrCode }}</small>
                <h3>{{ labels.patientDataPane }}</h3>
              </div>
              <i aria-hidden="true"></i>
            </button>
            <Transition name="clinical-accordion">
              <dl v-if="patientDataVisible" class="clinical-patient-data-list">
                <div>
                  <dt>{{ labels.fullName }}</dt>
                  <dd>{{ record.patientName }}</dd>
                </div>
                <div>
                  <dt>{{ labels.age }}</dt>
                  <dd>{{ record.patientAge }}</dd>
                </div>
                <div>
                  <dt>{{ labels.sex }}</dt>
                  <dd>{{ record.patientSex }}</dd>
                </div>
                <div>
                  <dt>{{ labels.appointmentId }}</dt>
                  <dd>{{ record.appointmentCode ?? record.appointmentId }}</dd>
                </div>
              </dl>
            </Transition>
          </article>

          <div class="clinical-pane-heading">
            <div>
              <small>{{ record.ehrCode }}</small>
              <h3>{{ labels.healthRecordPane }}</h3>
            </div>
          </div>

          <article v-if="hasMultipleHistoryRecords" class="clinical-detail-section clinical-history-selector">
            <button type="button" class="clinical-section-toggle" :class="{ active: healthRecordSelectorOpen }" @click="toggleHealthRecordSelector">
              <div>
                <small>{{ labels.selected }}</small>
                <h3>{{ selectedHistory?.medicalRecord?.code ?? selectedHistory?.code ?? labels.recordHistory }}</h3>
                <span>{{ selectedHistory?.appointmentTimeLabel }}</span>
              </div>
              <i aria-hidden="true"></i>
            </button>
            <Transition name="clinical-accordion">
            <div v-if="healthRecordSelectorOpen" class="clinical-history-list clinical-history-dropdown">
              <button
                v-for="historyRecord in record.medicalRecordHistory"
                :key="historyRecord.medicalRecord?.id"
                type="button"
                :class="{ active: selectedHistory?.medicalRecord?.id === historyRecord.medicalRecord?.id }"
                @click="selectedHistoryId = historyRecord.medicalRecord?.id"
              >
                <strong>{{ historyRecord.medicalRecord?.code ?? historyRecord.code }}</strong>
                <span>{{ historyRecord.appointmentTimeLabel }}</span>
                <small v-if="selectedHistory?.medicalRecord?.id === historyRecord.medicalRecord?.id">
                  {{ labels.selected }}
                </small>
              </button>
            </div>
            </Transition>
          </article>

          <article v-if="selectedHistory" class="clinical-detail-section">
            <div class="clinical-record-detail-heading">
              <div>
                <h3>{{ selectedHistory.medicalRecord?.code ?? record.ehrCode }}</h3>
                <p>{{ labels.recordDate }}: {{ selectedHistory.appointmentTimeLabel }}</p>
              </div>
            </div>

            <div class="clinical-record-detail-grid one-column">
              <section>
                <h4>{{ labels.diagnosis }}</h4>
                <ul v-if="selectedHistory.diagnoses?.length" class="clinical-entry-list">
                  <li v-for="diag in selectedHistory.diagnoses" :key="diag.id" class="clinical-entry-display">
                    <span>
                      <strong v-if="diag.cie10Code">{{ diag.cie10Code }} - </strong>{{ diag.description }}
                    </span>
                  </li>
                </ul>
                <p v-else>{{ labels.noDiagnosis }}</p>
              </section>
              <section>
                <h4>{{ labels.treatment }}</h4>
                <ul v-if="selectedHistory.treatments?.length" class="clinical-entry-list">
                  <li v-for="treat in selectedHistory.treatments" :key="treat.id" class="clinical-entry-display">
                    <span>{{ treat.description }}</span>
                  </li>
                </ul>
                <p v-else>{{ labels.noTreatment }}</p>
              </section>
              <section>
                <h4>{{ labels.prescriptions }}</h4>
                <ul v-if="selectedHistoryPrescriptionDetails.length">
                  <li v-for="detail in selectedHistoryPrescriptionDetails" :key="`${detail.prescriptionId}-${detail.medicineId}`">
                    {{ formatPrescriptionDetail(detail) }}
                  </li>
                </ul>
                <p v-else>{{ labels.noPrescription }}</p>
              </section>
            </div>
          </article>
          <article v-else class="clinical-detail-section">
            <p>{{ labels.noRecords }}</p>
          </article>
        </aside>

        <main class="clinical-workspace-pane clinical-workspace-care">
          <section class="clinical-accordion">
            <button type="button" class="clinical-accordion-trigger" :class="{ active: openPanel === 'attention' }" @click="togglePanel('attention')">
              <span>{{ labels.currentCarePane }}</span>
              <i aria-hidden="true"></i>
            </button>

            <Transition name="clinical-accordion">
              <form v-if="openPanel === 'attention'" class="clinical-form clinical-accordion-body" @submit.prevent="submitAttention">
                <article class="clinical-detail-section">
                  <h3>{{ labels.diagnosis }}</h3>
                  <div v-for="(diag, index) in diagnosisDrafts" :key="index" class="clinical-entry-row clinical-diagnosis-row">
                    <label class="diagnosis-search-field">
                      <span>{{ labels.diagnosis }}</span>
                      <input
                        v-model="diag.description"
                        type="text"
                        :placeholder="labels.diagnosisPlaceholder ?? ''"
                        autocomplete="off"
                        @input="handleDiagnosisInput(index)"
                        @focus="handleDiagnosisInput(index, false)"
                        @blur="hideDiagnosisSuggestions"
                      />
                      <div
                        v-if="activeDiagnosisSuggestionIndex === index && diagnosisSuggestions[index]?.length"
                        class="diagnosis-suggestions"
                      >
                        <button
                          v-for="diagnosis in diagnosisSuggestions[index]"
                          :key="`${diagnosis.source}-${diagnosis.code}`"
                          type="button"
                          @click="selectDiagnosis(index, diagnosis)"
                        >
                          <strong>{{ diagnosis.description }}</strong>
                          <span>{{ diagnosis.code }}</span>
                        </button>
                      </div>
                    </label>
                    <label class="diagnosis-code-field">
                      <span>{{ labels.diagnosisCode }}</span>
                      <input
                        :value="diag.cie10Code"
                        type="text"
                        readonly
                        :placeholder="labels.diagnosisCodePlaceholder"
                      />
                    </label>
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
            </Transition>
          </section>

          <section class="clinical-accordion">
            <button type="button" class="clinical-accordion-trigger" :class="{ active: openPanel === 'prescription' }" @click="togglePanel('prescription')">
              <span>{{ labels.addPrescription }}</span>
              <i aria-hidden="true"></i>
            </button>

            <Transition name="clinical-accordion">
            <div v-if="openPanel === 'prescription'" class="clinical-accordion-body">
              <article v-if="!record.prescription" class="clinical-detail-section clinical-prescription-create">
                <h3>{{ labels.prescription }}</h3>
                <p>{{ labels.noPrescription }}</p>
                <button
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
                <p v-if="record.prescription" class="clinical-inline-date">
                  {{ labels.prescriptionDate }}: {{ record.prescription.createdAt }}
                </p>
                <div v-if="prescriptionDetails.length" class="clinical-entry-list">
                  <div v-for="detail in prescriptionDetails" :key="`${detail.prescriptionId}-${detail.medicineId}`" class="clinical-entry-display">
                    <span>{{ formatPrescriptionDetail(detail) }}</span>
                    <button
                      type="button" class="clinical-remove-button"
                      :aria-label="labels.removePrescriptionDetail"
                      :disabled="!detail.prescriptionId || !detail.medicineId"
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
                <input v-model="form.quantity" type="number" min="0" step="1" placeholder="0" />
              </label>
              <label>
                <span>{{ labels.doseUnitType }}</span>
                <select v-model="form.doseUnit" :class="{ 'is-placeholder': !form.doseUnit }">
                  <option value="">--</option>
                  <option v-for="unit in doseUnitOptions" :key="unit">{{ unit }}</option>
                </select>
              </label>
              <label>
                <span>{{ labels.frequency }} ({{ t('clinical.doctorPatients.frequencyHoursHint') }})</span>
                <input v-model="form.frequency" type="number" min="0" step="1" placeholder="0" />
              </label>
              <label>
                <span>{{ labels.duration }} ({{ t('clinical.doctorPatients.durationDaysHint') }})</span>
                <input v-model="form.duration" type="number" min="0" step="1" placeholder="0" />
              </label>
            </div>
            <div v-if="pendingPrescriptionDetails.length" class="prescription-draft-list">
              <article v-for="(detail, index) in pendingPrescriptionDetails" :key="`${detail.medicineName}-${index}`">
                <span>
                  {{ detail.medicineName }} - {{ detail.quantity }}{{ detail.doseUnit }}
                  - {{ detail.frequency }} - {{ detail.duration }}
                </span>
                <button type="button" :aria-label="labels.removeMedicine" @click="removePrescriptionDetailDraft(index)">
                  x
                </button>
              </article>
            </div>
            <p v-if="prescriptionValidationError" class="clinical-error-message">{{ prescriptionValidationError }}</p>
            <p v-if="prescriptionSaveError" class="clinical-error-message">{{ prescriptionSaveError }}</p>
            <div class="clinical-prescription-actions">
              <button type="button" class="clinical-secondary-button" @click="addPrescriptionDetailDraft">
                {{ labels.addAnotherMedicine }}
              </button>
              <button type="submit" class="clinical-primary-button">
                {{ labels.savePrescriptionDetails }}
              </button>
            </div>
              </form>
            </div>
            </Transition>
          </section>
        </main>
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
