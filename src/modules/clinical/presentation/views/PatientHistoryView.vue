<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSchedulingStore } from '../../../scheduling/application/scheduling-store.js'
import useClinicalStore from '../../application/clinical.store.js'
import PatientHistorySummary from '../components/PatientHistorySummary.vue'
import PatientHistoryActivity from '../components/PatientHistoryActivity.vue'
import PatientHistoryDownload from '../components/PatientHistoryDownload.vue'
import PatientHistoryTimeline from '../components/PatientHistoryTimeline.vue'
import PatientHistoryDetailModal from '../components/PatientHistoryDetailModal.vue'

const patientId = 'pat-001'
const schedulingStore = useSchedulingStore()
const clinicalStore = useClinicalStore()
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
})

const patient = computed(() =>
  schedulingStore.patients.find((item) => item.id === patientId)
)

const labels = computed(() => ({
  title: t('clinical.patientHistory.title'),
  subtitle: t('clinical.patientHistory.subtitle', { patient: patient.value?.fullName ?? 'Alex Mercer' }),
  patientSummary: t('clinical.patientHistory.patientSummary'),
  totalVisits: t('clinical.patientHistory.totalVisits'),
  activeDiagnoses: t('clinical.patientHistory.activeDiagnoses'),
  pendingPayment: t('clinical.patientHistory.pendingPayment'),
  recentHealthActivity: t('clinical.patientHistory.recentHealthActivity'),
  nextAppointment: t('clinical.patientHistory.nextAppointment'),
  lastRecord: t('clinical.patientHistory.lastRecord'),
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
  noPrescription: t('clinical.patientHistory.noPrescription')
}))

const patientRecords = computed(() =>
  clinicalStore.medicalRecords
    .filter((record) => record.id_patient === patientId)
)

const timelineRecords = computed(() => {
  const records = patientRecords.value.map((record) => buildTimelineRecord(record))

  return records.sort((a, b) => {
    if (sortBy.value === 'oldest') return new Date(a.date) - new Date(b.date)
    return new Date(b.date) - new Date(a.date)
  })
})

const nextAppointment = computed(() => {
  const next = schedulingStore.patientAppointments
    .filter((appointment) => new Date(appointment.scheduledAt) >= new Date())
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))[0]

  return next ? formatShortDate(next.scheduledAt) : '-'
})

const lastRecordDate = computed(() =>
  timelineRecords.value[0]?.monthDay ?? '-'
)

const pendingPayments = computed(() =>
  schedulingStore.patientAppointments.filter((appointment) => appointment.paymentStatus === 'pending').length
)

const pendingResults = computed(() =>
  patientRecords.value.filter((record) =>
    !clinicalStore.diagnoses.some((diagnosis) => diagnosis.id_medical_record === record.id)
  ).length
)

const activeDiagnoses = computed(() =>
  patientRecords.value.filter((record) =>
    clinicalStore.diagnoses.some((diagnosis) => diagnosis.id_medical_record === record.id)
  ).length
)

const loading = computed(() =>
  schedulingStore.loading || !clinicalStore.medicalRecordsLoaded
)

function buildTimelineRecord(record) {
  const appointment = findAppointment(record)
  const diagnosis = clinicalStore.diagnoses.find((item) => item.id_medical_record === record.id)
  const treatment = clinicalStore.treatments.find((item) => item.id_medical_record === record.id)
  const prescription = clinicalStore.prescriptions.find((item) => item.id_medical_record === record.id)
  const prescriptionDetails = clinicalStore.prescriptionDetails.filter((item) => item.id_prescription === prescription?.id)
  const date = record.updated_at
  const isArchived = appointment?.status === 'cancelled'

  return {
    id: record.id,
    code: record.code,
    date,
    dateLabel: formatLongDate(date),
    monthDay: formatMonthDay(date),
    year: new Date(date).getFullYear(),
    title: appointment?.reason ?? diagnosis?.description ?? t('clinical.patientHistory.defaultTitle'),
    status: isArchived ? t('clinical.patientHistory.archived') : t('clinical.patientHistory.completed'),
    isArchived,
    description: buildDescription(diagnosis, treatment),
    diagnosis: diagnosis?.description ?? '',
    treatment: treatment?.description ?? '',
    prescriptionDate: prescription?.date ?? '',
    prescriptionDetails,
    appointmentId: record.id_appointment,
    patientName: patient.value?.fullName ?? 'Alex Mercer',
    provider: appointment?.doctor?.fullName ?? t('clinical.patientHistory.unknownProvider'),
    providerRole: appointment?.doctor?.specialty ?? t('clinical.patientHistory.clinicalUnit')
  }
}

function findAppointment(record) {
  return schedulingStore.appointmentsWithDetails.find((appointment) =>
    appointment.id === record.id_appointment
  )
}

function buildDescription(diagnosis, treatment) {
  const diagnosisText = diagnosis?.description ?? t('clinical.patientHistory.noDiagnosis')
  const treatmentText = treatment?.description ? ` ${treatment.description}` : ''
  return `${diagnosisText}.${treatmentText}`.trim()
}

function formatMonthDay(value) {
  return new Date(value).toLocaleDateString(locale.value === 'es' ? 'es-PE' : 'en-US', {
    month: 'short',
    day: '2-digit'
  }).toUpperCase()
}

function formatShortDate(value) {
  return new Date(value).toLocaleDateString(locale.value === 'es' ? 'es-PE' : 'en-US', {
    month: 'short',
    day: 'numeric'
  })
}

function formatLongDate(value) {
  return new Date(value).toLocaleDateString(locale.value === 'es' ? 'es-PE' : 'en-US', {
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
          :last-lab="lastRecordDate"
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
      :records="timelineRecords"
      :loading="loading"
      :labels="labels"
      @open-record="selectedRecord = $event"
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
