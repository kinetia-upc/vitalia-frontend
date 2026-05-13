<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSchedulingStore } from '../../../scheduling/application/scheduling-store.js'
import usePharmacyStore from '../../../pharmacy/application/pharmacy.store.js'
import useClinicalStore from '../../application/clinical.store.js'
import DoctorPatientsToolbar from '../components/DoctorPatientsToolbar.vue'
import DoctorPatientsFilters from '../components/DoctorPatientsFilters.vue'
import DoctorPatientsRecordList from '../components/DoctorPatientsRecordList.vue'
import DoctorPatientsPagination from '../components/DoctorPatientsPagination.vue'
import DoctorPatientRecordModal from '../components/DoctorPatientRecordModal.vue'

const doctorId = 'doc-001'
const pageSize = 4
const sortBy = ref('recentlyUpdated')
const selectedFilter = ref('all')
const searchQuery = ref('')
const currentPage = ref(1)
const activeRecord = ref(null)
const activeMode = ref('view')

const schedulingStore = useSchedulingStore()
const clinicalStore = useClinicalStore()
const pharmacyStore = usePharmacyStore()
const { t, locale } = useI18n()

onMounted(() => {
  if (!schedulingStore.loaded) schedulingStore.fetchSchedulingData()
  if (!clinicalStore.medicalRecordsLoaded) clinicalStore.fetchMedicalRecords()
  if (!clinicalStore.diagnosesLoaded) clinicalStore.fetchDiagnoses()
  if (!clinicalStore.treatmentsLoaded) clinicalStore.fetchTreatments()
  if (!clinicalStore.prescriptionsLoaded) clinicalStore.fetchPrescriptions()
  if (!clinicalStore.prescriptionDetailsLoaded) clinicalStore.fetchPrescriptionDetails()
  if (!pharmacyStore.medicinesLoaded) pharmacyStore.fetchMedicines()
})

const sortOptions = computed(() => [
  { id: 'recentlyUpdated', label: t('clinical.doctorPatients.sortRecentlyUpdated') },
  { id: 'appointmentTime', label: t('clinical.doctorPatients.sortAppointmentTime') },
  { id: 'patientName', label: t('clinical.doctorPatients.sortPatientName') },
  { id: 'status', label: t('clinical.doctorPatients.sortStatus') }
])

const filters = computed(() => [
  { id: 'all', label: t('clinical.doctorPatients.filterAll') },
  { id: 'highPriority', label: t('clinical.doctorPatients.filterHighPriority') },
  { id: 'confirmed', label: t('clinical.doctorPatients.filterConfirmed') },
  { id: 'scheduled', label: t('clinical.doctorPatients.filterScheduled') }
])

const labels = computed(() => ({
  searchEyebrow: t('clinical.doctorPatients.searchEyebrow'),
  searchPlaceholder: t('clinical.doctorPatients.searchPlaceholder'),
  sortBy: t('clinical.doctorPatients.sortBy'),
  appointment: t('clinical.doctorPatients.appointment'),
  status: t('clinical.doctorPatients.status'),
  vitalTrace: t('clinical.doctorPatients.vitalTrace'),
  emptyTitle: t('clinical.doctorPatients.emptyTitle'),
  emptyDescription: t('clinical.doctorPatients.emptyDescription'),
  viewHce: t('clinical.doctorPatients.viewHce'),
  editHce: t('clinical.doctorPatients.editHce'),
  openPrescription: t('clinical.doctorPatients.openPrescription'),
  close: t('clinical.doctorPatients.close'),
  recordTitle: t('clinical.doctorPatients.recordTitle'),
  editRecordTitle: t('clinical.doctorPatients.editRecordTitle'),
  prescriptionTitle: t('clinical.doctorPatients.prescriptionTitle'),
  patient: t('clinical.doctorPatients.patient'),
  appointmentId: t('clinical.doctorPatients.appointmentId'),
  diagnosis: t('clinical.doctorPatients.diagnosis'),
  treatment: t('clinical.doctorPatients.treatment'),
  prescription: t('clinical.doctorPatients.prescription'),
  prescriptions: t('clinical.doctorPatients.prescriptions'),
  prescriptionDate: t('clinical.doctorPatients.prescriptionDate'),
  prescriptionDetails: t('clinical.doctorPatients.prescriptionDetails'),
  noDiagnosis: t('clinical.doctorPatients.noDiagnosis'),
  noTreatment: t('clinical.doctorPatients.noTreatment'),
  noPrescription: t('clinical.doctorPatients.noPrescription'),
  noPrescriptionDetails: t('clinical.doctorPatients.noPrescriptionDetails'),
  saveClinicalAttention: t('clinical.doctorPatients.saveClinicalAttention'),
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
  reuseLastPrescription: t('clinical.doctorPatients.reuseLastPrescription'),
  lastPrescriptionLoaded: t('clinical.doctorPatients.lastPrescriptionLoaded'),
  prescriptionNeedsManualReview: t('clinical.doctorPatients.prescriptionNeedsManualReview'),
  recordHistory: t('clinical.doctorPatients.recordHistory'),
  recordDate: t('clinical.doctorPatients.recordDate'),
  noRecords: t('clinical.doctorPatients.noRecords'),
  selected: t('clinical.doctorPatients.selected')
}))

const todaysAppointments = computed(() => {
  // Para probar: si hoy no hay citas, uso el dia que si tiene data en db.json.
  const todayAppointments = schedulingStore.getTodayPatientsByDoctor(doctorId, new Date())
  if (todayAppointments.length) return todayAppointments

  return schedulingStore.getTodayPatientsByDoctor(doctorId, '2026-05-11')
})

const recordsForToday = computed(() =>
  todaysAppointments.value.map((appointment, index) => buildClinicalRecord(appointment, index))
)

const selectedRecord = computed(() =>
  recordsForToday.value.find((record) => record.id === activeRecord.value?.id) ?? activeRecord.value
)

const filteredRecords = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  let records = recordsForToday.value

  if (selectedFilter.value === 'highPriority') {
    records = records.filter((record) => record.priority === 'highPriority')
  } else if (selectedFilter.value !== 'all') {
    records = records.filter((record) => record.status === selectedFilter.value)
  }

  if (!query) return records

  return records.filter((record) => {
    const text = [
      record.patientName,
      record.patientCode,
      record.reason,
      record.statusLabel,
      record.appointmentId,
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

const showingLabel = computed(() =>
  t('clinical.doctorPatients.showing', {
    count: paginatedRecords.value.length,
    total: totalRecords.value
  })
)

function buildClinicalRecord(appointment, index) {
  const medicalRecord = clinicalStore.medicalRecords.find((record) =>
    record.id_appointment === appointment.id || record.appointmentId === appointment.id
  )
  const patientId = appointment.patient?.id ?? appointment.patientId
  const history = buildPatientMedicalRecordHistory(patientId)
  const detail = buildMedicalRecordDetail(medicalRecord, appointment)
  const priorityText = `${detail.diagnosis?.description ?? ''} ${detail.treatment?.description ?? ''} ${appointment.reason} ${appointment.status}`.toLowerCase()
  const isHighPriority = priorityText.includes('critical') ||
    priorityText.includes('urgent') ||
    priorityText.includes('alta prioridad') ||
    priorityText.includes('critico') ||
    priorityText.includes('urgente')

  return {
    id: medicalRecord?.id ?? `hce-${appointment.id}`,
    appointmentId: appointment.id,
    patientId,
    patientName: appointment.patient?.fullName ?? t('clinical.doctorPatients.unassignedPatient'),
    patientCode: medicalRecord?.code || `HCE-${String(index + 2148).padStart(5, '0')}`,
    appointmentTime: appointment.scheduledAt,
    appointmentTimeLabel: formatTime(appointment.scheduledAt),
    reason: detail.diagnosis?.description ?? detail.treatment?.description ?? appointment.reason,
    status: appointment.status,
    statusLabel: statusLabel(appointment.status),
    updatedAt: medicalRecord?.updated_at ?? appointment.scheduledAt,
    priority: isHighPriority ? 'highPriority' : 'normal',
    trace: vitalTrace(index),
    initials: initialsFor(appointment.patient?.fullName),
    accent: index % 3,
    medicalRecord: detail.medicalRecord,
    diagnosis: detail.diagnosis,
    treatment: detail.treatment,
    prescription: detail.prescription,
    prescriptionDetails: detail.prescriptionDetails,
    medicalRecordHistory: history
  }
}

function buildPatientMedicalRecordHistory(patientId) {
  return clinicalStore.medicalRecords
    .filter((record) => {
      if (record.id_patient === patientId || record.patientId === patientId) return true
      const appointment = schedulingStore.appointmentsWithDetails.find((item) =>
        item.id === record.id_appointment || item.id === record.appointmentId
      )
      return appointment?.patientId === patientId
    })
    .map((record) => {
      const appointment = schedulingStore.appointmentsWithDetails.find((item) =>
        item.id === record.id_appointment || item.id === record.appointmentId
      )
      return buildMedicalRecordDetail(record, appointment)
    })
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
}

function buildMedicalRecordDetail(medicalRecord, appointment = null) {
  const medicalRecordId = medicalRecord?.id
  const diagnosis = clinicalStore.diagnoses.find((item) =>
    medicalRecordId && (item.id_medical_record === medicalRecordId || item.medicalRecordId === medicalRecordId)
  )
  const treatment = clinicalStore.treatments.find((item) =>
    medicalRecordId && (item.id_medical_record === medicalRecordId || item.medicalRecordId === medicalRecordId)
  )
  const prescription = clinicalStore.prescriptions.find((item) =>
    medicalRecordId && (item.id_medical_record === medicalRecordId || item.medicalRecordId === medicalRecordId)
  )
  const prescriptionId = prescription?.id
  const prescriptionDetails = clinicalStore.prescriptionDetails.filter((item) =>
    prescriptionId && (item.id_prescription === prescriptionId || item.prescriptionId === prescriptionId)
  )

  return {
    medicalRecord,
    diagnosis,
    treatment,
    prescription,
    prescriptionDetails,
    appointmentId: appointment?.id ?? medicalRecord?.id_appointment,
    appointmentTimeLabel: appointment?.scheduledAt ? formatDateTime(appointment.scheduledAt) : formatDateTime(medicalRecord?.updated_at),
    reason: diagnosis?.description ?? treatment?.description ?? appointment?.reason ?? '',
    code: medicalRecord?.code ?? '',
    updatedAt: medicalRecord?.updated_at ?? appointment?.scheduledAt
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

function vitalTrace(index) {
  const traces = [
    [40, 58, 52, 72, 78, 92],
    [44, 44, 43, 44, 42, 43],
    [24, 36, 55, 48, 66, 72],
    [20, 20, 20, 20, 20, 20]
  ]

  return traces[index % traces.length]
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

function openRecord(record, mode) {
  activeRecord.value = record
  activeMode.value = mode
}

function closeRecordModal() {
  activeRecord.value = null
}

async function saveClinicalAttention(payload) {
  if (!payload.medicalRecordId) return
  await clinicalStore.saveClinicalAttention(payload.medicalRecordId, payload)
  closeRecordModal()
}

async function createPrescription(record) {
  if (!record.medicalRecord?.id) return
  await clinicalStore.createPrescriptionForMedicalRecord(record.medicalRecord.id)
}

async function createPrescriptionDetail(payload) {
  const details = payload.details ?? [payload.detail]
  for (const detail of details.filter(Boolean)) {
    await clinicalStore.createPrescriptionDetailForPrescription(payload.prescriptionId, detail)
  }
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
      @view-record="openRecord($event, 'view')"
      @edit-record="openRecord($event, 'edit')"
      @open-prescription="openRecord($event, 'prescription')"
    />

    <DoctorPatientsPagination
      :current-page="currentPage"
      :total-pages="totalPages"
      :visible-pages="visiblePages"
      :page-size="pageSize"
      :total-records="totalRecords"
      :visible-count="paginatedRecords.length"
      :showing-label="showingLabel"
      @change="goToPage"
    />

    <DoctorPatientRecordModal
      v-if="activeRecord"
      :mode="activeMode"
      :record="selectedRecord"
      :labels="labels"
      :medicines="pharmacyStore.medicines"
      @close="closeRecordModal"
      @save-attention="saveClinicalAttention"
      @create-prescription="createPrescription"
      @create-prescription-detail="createPrescriptionDetail"
    />
  </section>
</template>
