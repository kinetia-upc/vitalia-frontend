<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useSchedulingStore } from '../../../scheduling/application/scheduling-store.js'
import usePharmacyStore from '../../../pharmacy/application/pharmacy.store.js'
import useClinicalStore from '../../application/clinical.store.js'
import useTenantStore from '../../../tenant/application/tenant.store.js'
import { useAuthStore } from '../../../../shared/application/auth-store.js'
import DoctorPatientsToolbar from '../components/DoctorPatientsToolbar.vue'
import DoctorPatientsFilters from '../components/DoctorPatientsFilters.vue'
import DoctorPatientsRecordList from '../components/DoctorPatientsRecordList.vue'
import DoctorPatientsPagination from '../components/DoctorPatientsPagination.vue'
import DoctorPatientRecordModal from '../components/DoctorPatientRecordModal.vue'

const authStore = useAuthStore()
const doctorId = computed(() => authStore.currentDoctorId)
const pageSize = 4
const sortBy = ref('recentlyUpdated')
const selectedFilter = ref('all')
const searchQuery = ref('')
const currentPage = ref(1)
const activeRecord = ref(null)

const schedulingStore = useSchedulingStore()
const clinicalStore = useClinicalStore()
const pharmacyStore = usePharmacyStore()
const tenantStore = useTenantStore()
const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()

onMounted(() => {
  if (!schedulingStore.loaded) schedulingStore.fetchSchedulingData()
  if (!clinicalStore.medicalRecordsLoaded) clinicalStore.fetchMedicalRecords()
  if (!clinicalStore.diagnosesLoaded) clinicalStore.fetchDiagnoses()
  if (!clinicalStore.treatmentsLoaded) clinicalStore.fetchTreatments()
  if (!clinicalStore.prescriptionsLoaded) clinicalStore.fetchPrescriptions()
  if (!clinicalStore.prescriptionDetailsLoaded) clinicalStore.fetchPrescriptionDetails()
  if (!pharmacyStore.medicinesLoaded) pharmacyStore.fetchMedicines()
  if (!tenantStore.branchesLoaded) tenantStore.fetchBranches()
})

const sortOptions = computed(() => [
  { id: 'recentlyUpdated', label: t('clinical.doctorPatients.sortRecentlyUpdated') },
  { id: 'appointmentTime', label: t('clinical.doctorPatients.sortAppointmentTime') },
  { id: 'patientName', label: t('clinical.doctorPatients.sortPatientName') },
  { id: 'status', label: t('clinical.doctorPatients.sortStatus') }
])

const filters = computed(() => [
  { id: 'all', label: t('clinical.doctorPatients.filterAll') },
  { id: 'confirmed', label: t('clinical.doctorPatients.filterConfirmed') },
  { id: 'in-attention', label: t('clinical.doctorPatients.filterInAttention') },
  { id: 'scheduled', label: t('clinical.doctorPatients.filterScheduled') },
  { id: 'released', label: t('clinical.doctorPatients.filterReleased') }
])

const labels = computed(() => ({
  searchEyebrow: t('clinical.doctorPatients.searchEyebrow'),
  searchPlaceholder: t('clinical.doctorPatients.searchPlaceholder'),
  sortBy: t('clinical.doctorPatients.sortBy'),
  appointment: t('clinical.doctorPatients.appointment'),
  status: t('clinical.doctorPatients.status'),
  emptyTitle: t('clinical.doctorPatients.emptyTitle'),
  emptyDescription: t('clinical.doctorPatients.emptyDescription'),
  viewHce: t('clinical.doctorPatients.viewHce'),
  editHce: t('clinical.doctorPatients.editHce'),
  openPrescription: t('clinical.doctorPatients.openPrescription'),
  openCare: t('clinical.doctorPatients.openCare'),
  viewCare: t('clinical.doctorPatients.viewCare'),
  finalizeAttention: t('clinical.doctorPatients.finalizeAttention'),
  readOnlyNotice: t('clinical.doctorPatients.readOnlyNotice'),
  careWorkspaceTitle: t('clinical.doctorPatients.careWorkspaceTitle'),
  healthRecordPane: t('clinical.doctorPatients.healthRecordPane'),
  currentCarePane: t('clinical.doctorPatients.currentCarePane'),
  patientDataPane: t('clinical.doctorPatients.patientDataPane'),
  fullName: t('clinical.doctorPatients.fullName'),
  age: t('clinical.doctorPatients.age'),
  sex: t('clinical.doctorPatients.sex'),
  notRegistered: t('clinical.doctorPatients.notRegistered'),
  addPrescription: t('clinical.doctorPatients.addPrescription'),
  close: t('clinical.doctorPatients.close'),
  recordTitle: t('clinical.doctorPatients.recordTitle'),
  editRecordTitle: t('clinical.doctorPatients.editRecordTitle'),
  prescriptionTitle: t('clinical.doctorPatients.prescriptionTitle'),
  patient: t('clinical.doctorPatients.patient'),
  appointmentId: t('clinical.doctorPatients.appointmentId'),
  appointmentDate: t('clinical.doctorPatients.appointmentDate'),
  appointmentTime: t('clinical.doctorPatients.appointmentTime'),
  diagnosis: t('clinical.doctorPatients.diagnosis'),
  diagnosisCode: t('clinical.doctorPatients.diagnosisCode'),
  diagnosisCodePlaceholder: t('clinical.doctorPatients.diagnosisCodePlaceholder'),
  treatment: t('clinical.doctorPatients.treatment'),
  prescription: t('clinical.doctorPatients.prescription'),
  prescriptions: t('clinical.doctorPatients.prescriptions'),
  prescriptionDate: t('clinical.doctorPatients.prescriptionDate'),
  prescriptionDetails: t('clinical.doctorPatients.prescriptionDetails'),
  noDiagnosis: t('clinical.doctorPatients.noDiagnosis'),
  noTreatment: t('clinical.doctorPatients.noTreatment'),
  diagnosisRequired: t('clinical.doctorPatients.diagnosisRequired'),
  treatmentRequired: t('clinical.doctorPatients.treatmentRequired'),
  diagnosisIncomplete: t('clinical.doctorPatients.diagnosisIncomplete'),
  treatmentIncomplete: t('clinical.doctorPatients.treatmentIncomplete'),
  noPrescription: t('clinical.doctorPatients.noPrescription'),
  noPrescriptionDetails: t('clinical.doctorPatients.noPrescriptionDetails'),
  saveClinicalAttention: t('clinical.doctorPatients.saveClinicalAttention'),
  startAttention: t('clinical.doctorPatients.startAttention'),
  paymentPending: t('clinical.doctorPatients.paymentPending'),
  createPrescription: t('clinical.doctorPatients.createPrescription'),
  addPrescriptionDetail: t('clinical.doctorPatients.addPrescriptionDetail'),
  medicine: t('clinical.doctorPatients.medicine'),
  searchMedicine: t('clinical.doctorPatients.searchMedicine'),
  dose: t('clinical.doctorPatients.dose'),
  doseUnitType: t('clinical.doctorPatients.doseUnitType'),
  frequency: t('clinical.doctorPatients.frequency'),
  duration: t('clinical.doctorPatients.duration'),
  addMedicine: t('clinical.doctorPatients.addMedicine'),
  addAnotherMedicine: t('clinical.doctorPatients.addAnotherMedicine'),
  savePrescriptionDetails: t('clinical.doctorPatients.savePrescriptionDetails'),
  removeMedicine: t('clinical.doctorPatients.removeMedicine'),
  recordHistory: t('clinical.doctorPatients.recordHistory'),
  recordDate: t('clinical.doctorPatients.recordDate'),
  noRecords: t('clinical.doctorPatients.noRecords'),
  selected: t('clinical.doctorPatients.selected'),
  addDiagnosis: t('clinical.doctorPatients.addDiagnosis'),
  addTreatment: t('clinical.doctorPatients.addTreatment'),
  confirmDelete: t('clinical.doctorPatients.confirmDelete'),
  diagnosisPlaceholder: t('clinical.doctorPatients.diagnosisPlaceholder'),
  treatmentPlaceholder: t('clinical.doctorPatients.treatmentPlaceholder'),
  removeDiagnosis: t('clinical.doctorPatients.removeDiagnosis'),
  removeTreatment: t('clinical.doctorPatients.removeTreatment'),
  removePrescriptionDetail: t('clinical.doctorPatients.removePrescriptionDetail'),
  duplicateDiagnosis: t('clinical.doctorPatients.duplicateDiagnosis')
}))

const todaysAppointments = computed(() => {
  const allAppointments = schedulingStore.appointmentsWithDetails
  const doctorAppointments = allAppointments.filter((a) => a.doctorId === doctorId.value && !a.isCancelled)
  if (doctorAppointments.length > 0) return doctorAppointments
  // Fallback: return all non-cancelled appointments for this doctor regardless of date
  return schedulingStore.appointments
    ? schedulingStore.appointments.filter((a) => a.doctorId === doctorId.value && !a.isCancelled)
    : []
})

const recordsForToday = computed(() =>
  todaysAppointments.value.map((appointment, index) => buildClinicalRecord(appointment, index))
)

const selectedRecord = computed(() =>
  recordsForToday.value.find((record) => record.appointmentId === activeRecord.value?.appointmentId) ?? activeRecord.value
)

const filteredRecords = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  let records = recordsForToday.value

  if (selectedFilter.value !== 'all') {
    records = records.filter((record) => record.status === selectedFilter.value)
  }

  if (!query) return records

  return records.filter((record) => {
    const text = [
      record.patientName,
      record.ehrCode,
      record.reason,
      record.statusLabel,
      record.appointmentId,
      record.appointmentDateLabel,
      record.appointmentTimeLabel
    ].join(' ').toLowerCase()

    return text.includes(query)
  })
})

const sortedRecords = computed(() => {
  const records = [...filteredRecords.value]

  return records.sort((a, b) => {
    if (sortBy.value === 'appointmentTime') return new Date(a.appointmentTime) - new Date(b.appointmentTime)
    if (sortBy.value === 'patientName') return a.patientName.localeCompare(b.patientName)
    if (sortBy.value === 'status') return a.statusLabel.localeCompare(b.statusLabel)
    return new Date(b.updatedAt) - new Date(a.updatedAt)
  })
})

const totalRecords = computed(() => sortedRecords.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalRecords.value / pageSize)))
const visiblePages = computed(() => Array.from({ length: totalPages.value }, (_, index) => index + 1))
const paginatedRecords = computed(() => {
  if (currentPage.value > totalPages.value) currentPage.value = totalPages.value
  const start = (currentPage.value - 1) * pageSize

  return sortedRecords.value.slice(start, start + pageSize)
})

function buildClinicalRecord(appointment, index) {
  const medicalRecord = clinicalStore.medicalRecords.find((record) =>
    record.appointmentId === appointment.id
  )
  const patientId = appointment.patient?.id ?? appointment.patientId
  const history = buildPatientMedicalRecordHistory(patientId)
  const detail = buildMedicalRecordDetail(medicalRecord, appointment)

  return {
    id: medicalRecord?.id ?? `hce-${appointment.id}`,
    appointmentId: appointment.id,
    appointmentCode: appointment.code ?? appointment.id,
    branchId: appointment.branchId,
    branchCode: resolveBranchCode(appointment),
    patientId,
    patientName: appointment.patient?.fullName ?? t('clinical.doctorPatients.unassignedPatient'),
    patientAge: patientAge(appointment.patient?.user?.dateBirth ?? appointment.patient?.user?.birthDate),
    patientSex: genderLabel(appointment.patient?.user?.gender),
    ehrCode: appointment.patient?.ehrCode ?? clinicalStore.getPatientById(patientId)?.ehrCode ?? fallbackEhrCode(patientId, index),
    appointmentTime: appointment.scheduledAt,
    appointmentDateLabel: formatDateTime(appointment.scheduledAt),
    appointmentTimeLabel: formatTime(appointment.scheduledAt),
    reason: appointment.reason,
    status: appointment.status,
    statusLabel: statusLabel(appointment.status),
    paymentStatus: appointment.paymentStatus,
    updatedAt: medicalRecord?.updatedAt ?? appointment.scheduledAt,
    initials: initialsFor(appointment.patient?.fullName),
    accent: index % 3,
    medicalRecord: detail.medicalRecord,
    diagnosis: detail.diagnosis,
    diagnoses: detail.diagnoses,
    treatment: detail.treatment,
    treatments: detail.treatments,
    prescription: detail.prescription,
    prescriptionDetails: detail.prescriptionDetails,
    prescriptionCreatedAtLabel: detail.prescriptionCreatedAtLabel,
    prescriptionCreatedAtTimeLabel: detail.prescriptionCreatedAtTimeLabel,
    medicalRecordHistory: history
  }
}

function buildPatientMedicalRecordHistory(patientId) {
  return clinicalStore.medicalRecords
    .filter((record) => record.patientId === patientId)
    .map((record) => {
      const appointment = schedulingStore.appointmentsWithDetails.find((item) =>
        item.id === record.appointmentId
      ) ?? null
      return buildMedicalRecordDetail(record, appointment)
    })
    .sort((a, b) => recordDisplayDateTimestamp(b) - recordDisplayDateTimestamp(a))
}

function resolveBranchCode(appointment) {
  const branchRef = appointment.branchId
  return appointment.branch?.code
    ?? schedulingStore.branches.find((branch) => branch.id === branchRef || branch.code === branchRef || branch.internalId === branchRef)?.code
    ?? tenantStore.branches.find((branch) => branch.id === branchRef || branch.code === branchRef)?.code
    ?? branchRef
}

function recordDisplayDateTimestamp(record) {
  const value = record?.appointmentTime ?? record?.updatedAt
  const time = new Date(value).getTime()
  return Number.isNaN(time) ? 0 : time
}

function fallbackEhrCode(patientId, fallbackIndex = 0) {
  const patient = clinicalStore.getPatientById(patientId)
  const sourceCode = patient?.code ?? `PT-${String(fallbackIndex + 1).padStart(5, '0')}`
  const digits = String(sourceCode).replace(/\D/g, '')
  const numericPortion = Number.parseInt(digits || String(fallbackIndex + 1), 10)
  return `EHR-${String(numericPortion + 10000).padStart(5, '0')}`
}

function buildMedicalRecordDetail(medicalRecord, appointment = null) {
  const resolvedAppointment = appointment
    ?? schedulingStore.appointmentsWithDetails.find((item) => item.id === medicalRecord?.appointmentId)
  const medicalRecordId = medicalRecord?.id
  const diagnoses = medicalRecordId ? clinicalStore.getDiagnosesByMedicalRecordId(medicalRecordId) : []
  const treatments = medicalRecordId ? clinicalStore.getTreatmentsByMedicalRecordId(medicalRecordId) : []
  const prescription = clinicalStore.prescriptions.find((item) =>
    medicalRecordId && item.medicalRecordId === medicalRecordId
  )
  const prescriptionId = prescription?.id
  const prescriptionDetails = clinicalStore.prescriptionDetails.filter((item) =>
    prescriptionId && item.prescriptionId === prescriptionId
  )

  return {
    medicalRecord,
    diagnoses,
    treatments,
    diagnosis: diagnoses[0] ?? null,
    treatment: treatments[0] ?? null,
    prescription,
    prescriptionDetails,
    prescriptionCreatedAtLabel: formatDateTime(prescription?.createdAt),
    prescriptionCreatedAtTimeLabel: prescription?.createdAt ? formatTime(prescription.createdAt) : '',
    appointmentId: resolvedAppointment?.id ?? medicalRecord?.appointmentId,
    appointmentCode: resolvedAppointment?.code ?? medicalRecord?.appointmentCode ?? medicalRecord?.appointmentId,
    appointmentTime: resolvedAppointment?.scheduledAt ?? medicalRecord?.updatedAt,
    appointmentTimeLabel: resolvedAppointment?.scheduledAt ? formatDateTime(resolvedAppointment.scheduledAt) : formatDateTime(medicalRecord?.updatedAt),
    reason: diagnoses[0]?.description ?? treatments[0]?.description ?? resolvedAppointment?.reason ?? '',
    code: medicalRecord?.code ?? '',
    updatedAt: medicalRecord?.updatedAt ?? resolvedAppointment?.scheduledAt,
    recordCreatedAtLabel: formatDateTime(medicalRecord?.createdAt),
    recordCreatedAtTimeLabel: medicalRecord?.createdAt ? formatTime(medicalRecord.createdAt) : ''
  }
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString(locale.value === 'es' ? 'es-PE' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatDateTime(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString(locale.value === 'es' ? 'es-PE' : 'en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  })
}

function statusLabel(status) {
  return {
    confirmed: t('clinical.doctorPatients.statusConfirmed'),
    scheduled: t('clinical.doctorPatients.statusScheduled'),
    arrived: t('clinical.doctorPatients.statusArrived'),
    'in-attention': t('clinical.doctorPatients.statusInAttention'),
    released: t('clinical.doctorPatients.statusReleased')
  }[status] ?? status
}

function initialsFor(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
}

function goToPage(page) {
  currentPage.value = Math.min(Math.max(page, 1), totalPages.value)
}

function openRecord(record) {
  activeRecord.value = record
  prescriptionSaveError.value = ''
  clinicalSaveError.value = ''
}

function patientAge(value) {
  if (!value) return t('clinical.doctorPatients.notRegistered')
  const birthDate = new Date(value)
  if (Number.isNaN(birthDate.getTime())) return t('clinical.doctorPatients.notRegistered')
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age -= 1
  return String(age)
}

function genderLabel(value) {
  if (!value) return t('clinical.doctorPatients.notRegistered')
  return t(`genders.${value}`)
}

function closeRecordModal() {
  activeRecord.value = null
}

const clinicalSaveError = ref('')

async function saveClinicalAttention(payload) {
  if (!payload.medicalRecordId) return
  clinicalSaveError.value = ''
  try {
    await clinicalStore.saveClinicalAttention(payload.medicalRecordId, payload)
  } catch (error) {
    clinicalSaveError.value = error?.response?.data?.detail
      ?? error?.response?.data?.title
      ?? error?.message
      ?? t('clinical.doctorPatients.clinicalSaveError')
  }
}

async function startAttention(record) {
  if (!record.appointmentId) return
  await clinicalStore.createMedicalRecordForAppointment(record.appointmentId)
  await schedulingStore.refreshAppointment(record.appointmentId)
  const updatedRecord = recordsForToday.value.find((r) => r.appointmentId === record.appointmentId) ?? record
  openRecord(updatedRecord)
}

async function finalizeAttention(record) {
  if (!record.appointmentId) return
  const released = await schedulingStore.releaseAppointment(record.appointmentId)
  if (!released) return
  const updatedRecord = recordsForToday.value.find((r) => r.appointmentId === record.appointmentId) ?? record
  openRecord(updatedRecord)
}

async function createPrescription(record) {
  if (!record.medicalRecord?.id) return
  await clinicalStore.createPrescriptionForMedicalRecord(record.medicalRecord.id)
}

const prescriptionSaveError = ref('')

watch(recordsForToday, async (records) => {
  const targetAppointmentId = route.query.openAppointmentId
  if (!targetAppointmentId) return
  const target = records.find((record) => record.appointmentId === targetAppointmentId)
  if (!target) return
  const { openAppointmentId, action, ...rest } = route.query
  router.replace({ query: rest })
  if (action === 'start') {
    await startAttention(target)
  } else {
    openRecord(target)
  }
}, { immediate: true })

async function createPrescriptionDetail(payload) {
  prescriptionSaveError.value = ''
  const details = payload.details ?? [payload.detail]
  try {
    for (const detail of details.filter(Boolean)) {
      await clinicalStore.createPrescriptionDetailForPrescription(payload.prescriptionId, detail)
    }
    await pharmacyStore.fetchBranchMedicines()
  } catch (error) {
    prescriptionSaveError.value = error?.response?.data?.detail
      ?? error?.response?.data?.title
      ?? error?.message
      ?? t('clinical.doctorPatients.prescriptionSaveError')
  }
}

async function deleteDiagnosis(diagnosis) {
  await clinicalStore.deleteDiagnosis(diagnosis)
}

async function deleteTreatment(treatment) {
  await clinicalStore.deleteTreatment(treatment)
}

async function deletePrescriptionDetail(detail) {
  if (!confirm(t('clinical.doctorPatients.removePrescriptionDetail'))) return
  await clinicalStore.deletePrescriptionDetail(detail)
}

watch([sortBy, selectedFilter, searchQuery], () => {
  currentPage.value = 1
})
</script>

<template>
  <section class="clinical-records-view">
    <DoctorPatientsToolbar
      v-model:search-query="searchQuery"
      v-model:sort-by="sortBy"
      :sort-options="sortOptions"
      :labels="labels"
    />

    <DoctorPatientsFilters
      v-model:selected-filter="selectedFilter"
      :filters="filters"
    />

    <DoctorPatientsRecordList
      :records="paginatedRecords"
      :labels="labels"
      @open-care="openRecord"
      @start-attention="startAttention"
    />

    <DoctorPatientsPagination
      :current-page="currentPage"
      :total-pages="totalPages"
      :visible-pages="visiblePages"
      :page-size="pageSize"
      :total-records="totalRecords"
      :visible-count="paginatedRecords.length"
      @change="goToPage"
    />

    <DoctorPatientRecordModal
      v-if="activeRecord"
      :record="selectedRecord"
      :labels="labels"
      :medicines="pharmacyStore.medicines"
      :prescription-save-error="prescriptionSaveError"
      :clinical-save-error="clinicalSaveError"
      @close="closeRecordModal"
      @save-attention="saveClinicalAttention"
      @finalize-attention="finalizeAttention"
      @create-prescription="createPrescription"
      @create-prescription-detail="createPrescriptionDetail"
      @delete-diagnosis="deleteDiagnosis"
      @delete-treatment="deleteTreatment"
      @delete-prescription-detail="deletePrescriptionDetail"
    />
  </section>
</template>
