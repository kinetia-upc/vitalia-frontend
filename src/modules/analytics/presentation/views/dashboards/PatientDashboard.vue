<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSchedulingStore } from '../../../../scheduling/application/scheduling-store.js'
import useClinicalStore from '../../../../clinical/application/clinical.store.js'
import usePharmacyStore from '../../../../pharmacy/application/pharmacy.store.js'
import useTenantStore from '../../../../tenant/application/tenant.store.js'
import { useAuthStore } from '../../../../../shared/application/auth-store.js'

defineEmits(['book-appointment', 'view-appointments', 'view-history', 'view-prescriptions'])

const { t, locale } = useI18n()
const authStore = useAuthStore()
const CURRENT_PATIENT_ID = computed(() => authStore.currentPatientId)
const schedulingStore = useSchedulingStore()
const clinicalStore = useClinicalStore()
const pharmacyStore = usePharmacyStore()
const tenantStore = useTenantStore()

onMounted(() => {
  if (!schedulingStore.loaded) schedulingStore.fetchSchedulingData()
  if (!clinicalStore.patientsLoaded) clinicalStore.fetchPatients()
  if (!clinicalStore.medicalRecordsLoaded) clinicalStore.fetchMedicalRecords()
  if (!clinicalStore.diagnosesLoaded) clinicalStore.fetchDiagnoses()
  if (!clinicalStore.treatmentsLoaded) clinicalStore.fetchTreatments()
  if (!clinicalStore.prescriptionsLoaded) clinicalStore.fetchPrescriptions()
  if (!clinicalStore.prescriptionDetailsLoaded) clinicalStore.fetchPrescriptionDetails()
  if (!pharmacyStore.medicinesLoaded) pharmacyStore.fetchMedicines()
  if (!tenantStore.usersLoaded) tenantStore.fetchUsers()
})

const patient = computed(() => clinicalStore.getPatientById(CURRENT_PATIENT_ID.value) ?? clinicalStore.patients[0])
const user = computed(() => {
  if (!patient.value?.userId) return tenantStore.users.find((item) => item.role === 'patient')
  return tenantStore.users.find((item) => item.id === patient.value.userId)
})

const patientDisplayName = computed(() => {
  const fullName = [
    user.value?.name,
    user.value?.paternalSurname
  ].filter(Boolean).join(' ')

  return fullName || t('tenant.patientProfile.patientFallback')
})

const patientAppointments = computed(() =>
  schedulingStore.appointmentsWithDetails
    .filter((appointment) => appointment.patientId === CURRENT_PATIENT_ID.value)
    .sort((left, right) => new Date(left.scheduledAt) - new Date(right.scheduledAt))
)

const selectedAppointment = ref(null)

function closeDetailModal() {
  selectedAppointment.value = null
}

const closestAppointment = computed(() =>
  patientAppointments.value
    .filter((appointment) => !appointment.isCancelled)
    .sort((left, right) => new Date(left.scheduledAt) - new Date(right.scheduledAt))[0] ?? null
)

const nextAppointmentDoctor = computed(() => {
  const doctorUser = tenantStore.users.find((item) => item.id === closestAppointment.value?.doctor?.userId)
  const fullName = [
    doctorUser?.name,
    doctorUser?.paternalSurname
  ].filter(Boolean).join(' ')

  if (fullName) return `Dr. ${fullName}`
  return closestAppointment.value?.doctor?.fullName || t('patient.noUpcomingAppointmentTitle')
})

const nextAppointmentReason = computed(() =>
  closestAppointment.value?.reason || t('patient.noUpcomingAppointment')
)

const nextAppointmentDate = computed(() =>
  closestAppointment.value ? formatLongDate(closestAppointment.value.scheduledAt) : '-'
)

const nextAppointmentTime = computed(() =>
  closestAppointment.value ? formatTime(closestAppointment.value.scheduledAt) : '-'
)

const detailLabels = computed(() => ({
  title: t('patient.appointmentSummaryTitle'),
  appointmentId: t('patient.appointmentIdLabel'),
  doctor: t('scheduling.patientAppointments.doctor'),
  clinic: t('scheduling.patientAppointments.clinic'),
  date: t('patient.date'),
  time: t('patient.time')
}))

const patientMedicalRecords = computed(() =>
  clinicalStore.medicalRecords
    .filter((record) =>
      record.patientId === CURRENT_PATIENT_ID.value &&
      record.updatedAt &&
      new Date(record.updatedAt) <= new Date()
    )
    .sort((left, right) => new Date(right.updatedAt) - new Date(left.updatedAt))
)

const recentInteractions = computed(() =>
  patientMedicalRecords.value
    .flatMap((record) => buildInteractions(record))
    .filter(Boolean)
    .sort((left, right) => new Date(right.dateValue) - new Date(left.dateValue))
    .slice(0, 3)
)

function buildInteractions(record) {
  const appointment = schedulingStore.appointmentsWithDetails.find((item) => item.id === record.appointmentId)
  const diagnoses = clinicalStore.diagnoses.filter((item) => item.medicalRecordId === record.id)
  const treatments = clinicalStore.treatments.filter((item) => item.medicalRecordId === record.id)
  const prescription = clinicalStore.prescriptions.find((item) => item.medicalRecordId === record.id)
  const prescriptionDetails = clinicalStore.prescriptionDetails.filter((item) => item.prescriptionId === prescription?.id)
  const interactions = []

  prescriptionDetails.forEach((prescriptionDetail, index) => {
    const medicine = resolveMedicine(prescriptionDetail)
    interactions.push({
      id: `rx-${record.id}-${prescriptionDetail.id ?? index}`,
      title: t('patient.prescriptionUpdated'),
      description: formatPrescriptionInteraction(prescriptionDetail, medicine),
      dateLabel: formatShortDate(prescription?.createdAt ?? record.updatedAt),
      dateValue: prescription?.createdAt ?? record.updatedAt,
      icon: 'Rx',
      tone: ''
    })
  })

  diagnoses.forEach((diagnosis, index) => {
    interactions.push({
      id: `diagnosis-${record.id}-${diagnosis.id ?? index}`,
      title: t('patient.diagnosisRecorded'),
      description: diagnosis.description || appointment?.reason || record.code,
      dateLabel: formatShortDate(record.updatedAt),
      dateValue: record.updatedAt,
      icon: 'Dx',
      tone: 'amber'
    })
  })

  treatments.forEach((treatment, index) => {
    interactions.push({
      id: `treatment-${record.id}-${treatment.id ?? index}`,
      title: t('patient.treatmentUpdated'),
      description: treatment.description || appointment?.reason || record.code,
      dateLabel: formatShortDate(record.updatedAt),
      dateValue: record.updatedAt,
      icon: 'Tx',
      tone: 'amber'
    })
  })

  if (interactions.length) return interactions

  return [{
    id: `record-${record.id}`,
    title: t('patient.physicianNote'),
    description: appointment?.reason ?? record.code,
    dateLabel: formatShortDate(record.updatedAt),
    dateValue: record.updatedAt,
    icon: 'Dr',
    tone: 'amber'
  }]
}

function resolveMedicine(detail) {
  const detailMedicineId = String(detail?.medicineId ?? '')
  const detailMedicineName = String(detail?.medicineName ?? '').trim().toLowerCase()

  return pharmacyStore.medicines.find((medicine) =>
    String(medicine.id) === detailMedicineId ||
    String(medicine.name ?? '').trim().toLowerCase() === detailMedicineName
  )
}

function formatPrescriptionInteraction(detail, medicine) {
  const medicineName = detail.medicineName || medicine?.name || t('clinical.patientPrescriptions.unknown')
  const presentation = medicine?.unitQuantity && medicine?.unitType
    ? `${medicine.unitQuantity}${medicine.unitType}`
    : ''
  const quantity = Number(detail.quantity) || 0
  const frequency = Number(detail.frequency) || 0
  const duration = Number(detail.duration) || 0
  const quantityUnit = quantity === 1 ? t('patient.unitSingular') : t('patient.unitPlural')
  const hourUnit = frequency === 1 ? t('patient.hourSingular') : t('patient.hourPlural')
  const dayUnit = duration === 1 ? t('patient.daySingular') : t('patient.dayPlural')
  const quantityLabel = `${quantity} ${quantityUnit}`
  const frequencyLabel = `${t('patient.everyLabel')} ${frequency} ${hourUnit}`
  const durationLabel = `${t('patient.forLabel')} ${duration} ${dayUnit}`

  return `${[medicineName, presentation].filter(Boolean).join(' ')} - ${quantityLabel} ${frequencyLabel} ${durationLabel}`
}

function formatLongDate(value) {
  return new Date(value).toLocaleDateString(locale.value === 'es' ? 'es-PE' : 'en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}

function formatShortDate(value) {
  return new Date(value).toLocaleDateString(locale.value === 'es' ? 'es-PE' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString(locale.value === 'es' ? 'es-PE' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<template>
  <section class="dashboard-view patient-dashboard">
    <div class="patient-title">
      <h1>{{ t('patient.greeting', { patient: patientDisplayName }) }}</h1>
      <p>{{ t('patient.summary') }}</p>
    </div>

    <div class="patient-grid">
      <article class="panel next-appointment" :class="{ 'next-appointment-empty': !closestAppointment }">
        <h2>{{ closestAppointment ? nextAppointmentDoctor : t('patient.noUpcomingAppointmentTitle') }}</h2>
        <p>{{ nextAppointmentReason }}</p>
        <div v-if="closestAppointment" class="appointment-meta">
          <div>
            <small>{{ t('patient.date') }}</small>
            <strong>{{ nextAppointmentDate }}</strong>
          </div>
          <div>
            <small>{{ t('patient.time') }}</small>
            <strong>{{ nextAppointmentTime }}</strong>
          </div>
        </div>
        <div class="appointment-actions">
          <button v-if="closestAppointment" type="button" class="primary-action" @click="selectedAppointment = closestAppointment">{{ t('patient.viewDetails') }}</button>
          <button type="button" class="ghost-action" :class="{ 'empty-state-action': !closestAppointment }" @click="$emit('view-appointments')">{{ t('patient.allAppointments') }}</button>
        </div>
      </article>

      <div class="quick-actions">
        <button type="button" class="quick-card" @click="$emit('book-appointment')">
          <span class="quick-icon">+</span>
          <strong>{{ t('patient.bookAppointment') }}</strong>
          <small>{{ t('patient.bookCaption') }}</small>
        </button>
        <button type="button" class="quick-card amber" @click="$emit('view-prescriptions')">
          <span class="quick-icon">Rx</span>
          <strong>{{ t('patient.viewPrescriptions') }}</strong>
          <small>{{ t('patient.prescriptionsCaption') }}</small>
        </button>
      </div>

      <article v-if="recentInteractions.length" class="panel interactions-panel">
        <div class="panel-heading">
          <h2>{{ t('patient.recentInteractions') }}</h2>
          <button type="button" @click="$emit('view-history')">{{ t('patient.viewAllHistory') }}</button>
        </div>
        <div class="interaction-list">
          <div v-for="interaction in recentInteractions" :key="interaction.id" class="interaction-item">
            <span class="interaction-icon" :class="interaction.tone">{{ interaction.icon }}</span>
            <div>
              <strong>{{ interaction.title }}</strong>
              <p>{{ interaction.description }}</p>
            </div>
            <small>{{ interaction.dateLabel }}</small>
          </div>
        </div>
      </article>
    </div>

    <div v-if="selectedAppointment" class="modal-backdrop" @click.self="closeDetailModal">
      <article class="schedule-dialog appointment-detail-dialog panel">
        <div class="panel-heading">
          <div>
            <h2>{{ detailLabels.title }}</h2>
            <p>{{ selectedAppointment.reason }}</p>
          </div>
          <button class="text-action" type="button" @click="closeDetailModal">
            {{ t('scheduling.patientAppointments.close') }}
          </button>
        </div>

        <div class="appointment-detail-hero">
          <span class="avatar"></span>
          <div>
            <small>{{ detailLabels.doctor }}</small>
            <strong>{{ selectedAppointment.doctor?.fullName || '-' }}</strong>
            <p>{{ selectedAppointment.doctor?.specialty || '-' }}</p>
          </div>
        </div>

        <div class="appointment-detail-grid">
          <section>
            <small>{{ detailLabels.date }}</small>
            <strong>{{ formatLongDate(selectedAppointment.scheduledAt) }}</strong>
          </section>
          <section>
            <small>{{ detailLabels.time }}</small>
            <strong>{{ formatTime(selectedAppointment.scheduledAt) }}</strong>
          </section>
          <section>
            <small>{{ detailLabels.clinic }}</small>
            <strong>{{ selectedAppointment.branch?.name || '-' }}</strong>
            <span>{{ selectedAppointment.branch?.description || '' }}</span>
          </section>
          <section>
            <small>{{ detailLabels.appointmentId }}</small>
            <strong>{{ selectedAppointment.code || selectedAppointment.id }}</strong>
          </section>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.next-appointment-empty {
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
}

.next-appointment-empty .appointment-actions {
  display: flex;
  justify-content: center;
  align-items: center;
}

.empty-state-action {
  display: inline-flex;
  width: fit-content;
  flex: 0 0 auto;
  align-self: center;
  padding: 0.75rem 1.25rem;
}
</style>
