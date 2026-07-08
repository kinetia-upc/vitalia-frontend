<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSchedulingStore } from '../../../scheduling/application/scheduling-store.js'
import useClinicalStore from '../../application/clinical.store.js'
import usePharmacyStore from '../../../pharmacy/application/pharmacy.store.js'
import { useAuthStore } from '../../../../shared/application/auth-store.js'
import PatientHistorySummary from '../components/PatientHistorySummary.vue'
import PatientHistoryActivity from '../components/PatientHistoryActivity.vue'
import PatientHistoryDownload from '../components/PatientHistoryDownload.vue'
import PatientHistoryTimeline from '../components/PatientHistoryTimeline.vue'
import PatientHistoryDetailModal from '../components/PatientHistoryDetailModal.vue'

const authStore = useAuthStore()
const patientId = computed(() => authStore.currentPatientId)
const schedulingStore = useSchedulingStore()
const clinicalStore = useClinicalStore()
const pharmacyStore = usePharmacyStore()
const { t, locale } = useI18n()
const sortBy = ref('recent')
const selectedRecord = ref(null)

onMounted(() => {
  if (!schedulingStore.loaded) schedulingStore.fetchSchedulingData()
  if (!clinicalStore.medicalRecordsLoaded) clinicalStore.fetchMedicalRecords()
  if (!clinicalStore.diagnosesLoaded) clinicalStore.fetchDiagnoses()
  if (!clinicalStore.treatmentsLoaded) clinicalStore.fetchTreatments()
  if (!clinicalStore.prescriptionsLoaded) clinicalStore.fetchPrescriptions()
  if (!clinicalStore.prescriptionDetailsLoaded) clinicalStore.fetchPrescriptionDetails()
  if (!pharmacyStore.medicinesLoaded) pharmacyStore.fetchMedicines()
})

const patient = computed(() =>
  schedulingStore.patients.find((item) => item.id === patientId.value)
)

const labels = computed(() => ({
  title: t('clinical.patientHistory.title'),
  subtitle: t('clinical.patientHistory.subtitle', { patient: patient.value?.fullName ?? '' }),
  patientSummary: t('clinical.patientHistory.patientSummary'),
  totalVisits: t('clinical.patientHistory.totalVisits'),
  activeDiagnoses: t('clinical.patientHistory.activeDiagnoses'),
  pendingPayment: t('clinical.patientHistory.pendingPayment'),
  recentHealthActivity: t('clinical.patientHistory.recentHealthActivity'),
  nextAppointment: t('clinical.patientHistory.nextAppointment'),
  lastRecord: t('clinical.patientHistory.lastRecord'),
  noUpcomingAppointment: t('clinical.patientHistory.noUpcomingAppointment'),
  noRecordYet: t('clinical.patientHistory.noRecordYet'),
  pendingResults: t('clinical.patientHistory.pendingResults'),
  downloadDossier: t('clinical.patientHistory.downloadDossier'),
  downloadRecord: t('clinical.patientHistory.downloadRecord'),
  pdfExport: t('clinical.patientHistory.pdfExport'),
  clinicalTimeline: t('clinical.patientHistory.clinicalTimeline'),
  sortBy: t('clinical.patientHistory.sortBy'),
  mostRecent: t('clinical.patientHistory.mostRecent'),
  oldest: t('clinical.patientHistory.oldest'),
  loading: t('clinical.patientHistory.loading'),
  noRecords: t('clinical.patientHistory.noRecords'),
  patient: t('clinical.patientHistory.patient'),
  appointmentId: t('clinical.patientHistory.appointmentId'),
  provider: t('clinical.patientHistory.provider'),
  status: t('clinical.patientHistory.status'),
  diagnosis: t('clinical.patientHistory.diagnosis'),
  treatment: t('clinical.patientHistory.treatment'),
  prescription: t('clinical.patientHistory.prescription'),
  prescriptionDate: t('clinical.patientHistory.prescriptionDate'),
  noDiagnosis: t('clinical.patientHistory.noDiagnosis'),
  noTreatment: t('clinical.patientHistory.noTreatment'),
  noPrescription: t('clinical.patientHistory.noPrescription'),
  viewMore: t('clinical.patientHistory.viewMore'),
  viewLess: t('clinical.patientHistory.viewLess'),
  viewDetails: t('clinical.patientHistory.viewDetails'),
  medicalRecordLabel: t('clinical.patientHistory.medicalRecordLabel')
}))

const patientRecords = computed(() =>
  clinicalStore.medicalRecords
    .filter((record) => record.patientId === patient.value?.id)
)

const timelineRecords = computed(() => {
  const records = patientRecords.value.map((record) => buildTimelineRecord(record))

  return records.sort((a, b) => {
    if (sortBy.value === 'oldest') return new Date(a.date) - new Date(b.date)
    return new Date(b.date) - new Date(a.date)
  })
})

const TIMELINE_PAGE_SIZE = 4
const timelinePage = ref(1)

watch([timelineRecords, sortBy], () => {
  timelinePage.value = 1
})

const timelineTotalPages = computed(() =>
  Math.max(1, Math.ceil(timelineRecords.value.length / TIMELINE_PAGE_SIZE))
)

const paginatedTimelineRecords = computed(() => {
  const start = (timelinePage.value - 1) * TIMELINE_PAGE_SIZE
  return timelineRecords.value.slice(start, start + TIMELINE_PAGE_SIZE)
})

function goToTimelinePage(page) {
  timelinePage.value = Math.min(Math.max(1, page), timelineTotalPages.value)
}

const nextAppointment = computed(() => {
  const next = schedulingStore.patientAppointments
    .filter((appointment) => (appointment.status ?? '').toLowerCase() === 'confirmed')
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))[0]

  if (!next) return null
  return {
    dateLabel: formatShortDate(next.scheduledAt),
    timeLabel: formatTime(next.scheduledAt),
    code: next.code ?? next.id
  }
})

const lastRecord = computed(() => {
  const record = timelineRecords.value[0]
  if (!record) return null
  return {
    dateLabel: record.monthDay,
    timeLabel: record.timeLabel,
    code: record.recordCode
  }
})

const pendingPayments = computed(() =>
  schedulingStore.patientAppointments.filter((appointment) =>
    appointment.status === 'scheduled' && appointment.paymentStatus === 'pending'
  ).length
)

const pendingResults = computed(() =>
  patientRecords.value.filter((record) =>
    !clinicalStore.diagnoses.some((diagnosis) => diagnosis.medicalRecordId === record.id)
  ).length
)

const activeDiagnoses = computed(() => {
  const patientRecordIds = new Set(patientRecords.value.map((record) => record.id))
  return clinicalStore.diagnoses.filter((diagnosis) => patientRecordIds.has(diagnosis.medicalRecordId)).length
})

const loading = computed(() =>
  schedulingStore.loading || !clinicalStore.medicalRecordsLoaded
)

function buildTimelineRecord(record) {
  const appointment = findAppointment(record)
  const diagnoses = clinicalStore.diagnoses.filter((item) => item.medicalRecordId === record.id)
  const treatments = clinicalStore.treatments.filter((item) => item.medicalRecordId === record.id)
  const prescription = clinicalStore.prescriptions.find((item) => item.medicalRecordId === record.id)
  const prescriptionDetails = clinicalStore.prescriptionDetails.filter((item) => item.prescriptionId === prescription?.id)
  const date = record.createdAt ?? appointment?.scheduledAt ?? record.updatedAt
  const isArchived = appointment?.status === 'cancelled'
  const firstDiagnosis = diagnoses[0]
  const firstTreatment = treatments[0]

  return {
    id: record.id,
    code: patient.value?.ehrCode ?? patient.value?.code ?? record.code,
    recordCode: record.code,
    date,
    dateLabel: formatLongDate(date),
    monthDay: formatMonthDay(date),
    timeLabel: formatTime(date),
    year: new Date(date).getFullYear(),
    title: appointment?.reason ?? firstDiagnosis?.description ?? t('clinical.patientHistory.defaultTitle'),
    status: isArchived ? t('clinical.patientHistory.archived') : t('clinical.patientHistory.completed'),
    isArchived,
    description: buildDescription(diagnoses, treatments),
    summaryLines: buildSummaryLines(diagnoses, treatments, prescriptionDetails),
    diagnosis: firstDiagnosis?.description ?? '',
    treatment: firstTreatment?.description ?? '',
    diagnoses,
    treatments,
    diagnosesCount: diagnoses.length,
    treatmentsCount: treatments.length,
    prescriptionDate: prescription?.createdAt ?? '',
    prescriptionDetails,
    appointmentId: appointment?.code ?? record.appointmentId,
    patientName: patient.value?.fullName ?? '',
    provider: appointment?.doctor?.fullName ?? t('clinical.patientHistory.unknownProvider'),
    providerRole: appointment?.doctor?.specialty ?? t('clinical.patientHistory.clinicalUnit'),
    providerCode: appointment?.doctor?.code ?? ''
  }
}

function findAppointment(record) {
  return schedulingStore.appointmentsWithDetails.find((appointment) =>
    appointment.id === record.appointmentId
  )
}

function buildDescription(diagnoses, treatments) {
  const parts = []
  if (diagnoses?.length) {
    parts.push(`${t('clinical.patientHistory.diagnosis')}: ${diagnoses.map(d => d.description).join('; ')}`)
  }
  if (treatments?.length) {
    parts.push(`${t('clinical.patientHistory.treatment')}: ${treatments.map(item => item.description).join('; ')}`)
  }
  return parts.join('  •  ') || t('clinical.patientHistory.noDiagnosis')
}

function buildSummaryLines(diagnoses, treatments, prescriptionDetails) {
  return [
    {
      type: 'diagnosis',
      label: t('clinical.patientHistory.diagnosis'),
      text: diagnoses?.length
        ? diagnoses.map(d => d.description).join('; ')
        : t('clinical.patientHistory.noDiagnosis'),
      hasData: Boolean(diagnoses?.length)
    },
    {
      type: 'treatment',
      label: t('clinical.patientHistory.treatment'),
      text: treatments?.length
        ? treatments.map(item => item.description).join('; ')
        : t('clinical.patientHistory.noTreatment'),
      hasData: Boolean(treatments?.length)
    },
    {
      type: 'prescription',
      label: t('clinical.patientHistory.prescription'),
      text: prescriptionDetails?.length
        ? prescriptionDetails.map(item => formatPrescriptionDetail(item)).join(', ')
        : t('clinical.patientHistory.noPrescription'),
      hasData: Boolean(prescriptionDetails?.length)
    }
  ]
}

function formatPrescriptionDetail(detail) {
  const medicine = pharmacyStore.medicines.find((item) => item.id === detail.medicineId)
  const name = detail.medicineName || medicine?.name || detail.medicineId
  const dose = detail.quantity && detail.doseUnit ? `${detail.quantity}${detail.doseUnit}` : ''
  return dose ? `${name} ${dose}` : name
}

function formatMonthDay(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (isNaN(date)) return '-'
  const localeCode = locale.value === 'es' ? 'es-PE' : 'en-US'
  const day = date.toLocaleDateString(localeCode, { day: '2-digit' })
  const month = date.toLocaleDateString(localeCode, { month: 'short' }).replace('.', '')
  return locale.value === 'es' ? `${day} ${month}` : `${month} ${day}`
}

function formatTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (isNaN(date)) return ''
  return date.toLocaleTimeString(locale.value === 'es' ? 'es-PE' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatShortDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (isNaN(date)) return '-'
  return date.toLocaleDateString(locale.value === 'es' ? 'es-PE' : 'en-US', {
    month: 'short',
    day: 'numeric'
  })
}

function formatLongDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (isNaN(date)) return '-'
  return date.toLocaleDateString(locale.value === 'es' ? 'es-PE' : 'en-US', {
    month: 'long',
    day: '2-digit',
    year: 'numeric'
  })
}

function downloadDossier() {
  window.print()
}

function downloadRecord() {
  document.body.classList.add('printing-history-record')
  window.print()
  document.body.classList.remove('printing-history-record')
}
</script>

<template>
  <section class="patient-history-view">
    <header class="patient-history-heading">
      <h1>{{ labels.title }}</h1>
      <p>{{ labels.subtitle }}</p>
    </header>

    <div class="patient-history-top">
      <PatientHistorySummary
        :total-visits="patientRecords.length"
        :active-diagnoses="activeDiagnoses"
        :pending-payments="pendingPayments"
        :labels="labels"
      />

      <div class="patient-history-side">
        <PatientHistoryActivity
          :next-appointment="nextAppointment"
          :last-record="lastRecord"
          :pending-results="pendingResults"
          :labels="labels"
        />

        <PatientHistoryDownload
          :disabled="!patientRecords.length"
          :labels="labels"
          @download="downloadDossier"
        />
      </div>
    </div>

    <PatientHistoryTimeline
      v-model:sort-by="sortBy"
      :records="paginatedTimelineRecords"
      :loading="loading"
      :labels="labels"
      :current-page="timelinePage"
      :total-pages="timelineTotalPages"
      @open-record="selectedRecord = $event"
      @change-page="goToTimelinePage"
    />

    <PatientHistoryDetailModal
      v-if="selectedRecord"
      :record="selectedRecord"
      :labels="labels"
      @close="selectedRecord = null"
      @download-record="downloadRecord"
    />
  </section>
</template>
