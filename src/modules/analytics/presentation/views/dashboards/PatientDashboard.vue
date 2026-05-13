<script setup>
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSchedulingStore } from '../../../../scheduling/application/scheduling-store.js'
import useClinicalStore from '../../../../clinical/application/clinical.store.js'
import useTenantStore from '../../../../tenant/application/tenant.store.js'

defineEmits(['book-appointment', 'view-appointments', 'view-history'])

const { t, locale } = useI18n()
const CURRENT_PATIENT_ID = 'pat-001'
const schedulingStore = useSchedulingStore()
const clinicalStore = useClinicalStore()
const tenantStore = useTenantStore()

onMounted(() => {
  if (!schedulingStore.loaded) schedulingStore.fetchSchedulingData()
  if (!clinicalStore.patientsLoaded) clinicalStore.fetchPatients()
  if (!clinicalStore.medicalRecordsLoaded) clinicalStore.fetchMedicalRecords()
  if (!clinicalStore.diagnosesLoaded) clinicalStore.fetchDiagnoses()
  if (!clinicalStore.treatmentsLoaded) clinicalStore.fetchTreatments()
  if (!clinicalStore.prescriptionsLoaded) clinicalStore.fetchPrescriptions()
  if (!clinicalStore.prescriptionDetailsLoaded) clinicalStore.fetchPrescriptionDetails()
  if (!tenantStore.usersLoaded) tenantStore.fetchUsers()
})

const patient = computed(() => clinicalStore.getPatientById(CURRENT_PATIENT_ID) ?? clinicalStore.patients[0])
const user = computed(() => {
  if (!patient.value?.id_user) return tenantStore.users.find((item) => item.role === 'patient')
  return tenantStore.users.find((item) => item.id === patient.value.id_user)
})

const patientDisplayName = computed(() => {
  const fullName = [
    user.value?.name,
    user.value?.paternal_surname
  ].filter(Boolean).join(' ')

  return fullName || t('tenant.patientProfile.patientFallback')
})

const patientAppointments = computed(() =>
  schedulingStore.appointmentsWithDetails
    .filter((appointment) => appointment.patientId === CURRENT_PATIENT_ID)
    .sort((left, right) => new Date(left.scheduledAt) - new Date(right.scheduledAt))
)

const closestAppointment = computed(() =>
  patientAppointments.value
    .filter((appointment) => !appointment.isCancelled)
    .map((appointment) => ({
      appointment,
      distance: Math.abs(new Date(appointment.scheduledAt) - new Date())
    }))
    .sort((left, right) => left.distance - right.distance)[0]?.appointment ?? null
)

const nextAppointmentDoctor = computed(() => {
  const doctorUser = tenantStore.users.find((item) => item.id === closestAppointment.value?.doctor?.id_user)
  const fullName = [
    doctorUser?.name,
    doctorUser?.paternal_surname
  ].filter(Boolean).join(' ')

  if (fullName) return `Dr. ${fullName}`
  return closestAppointment.value?.doctor?.fullName || doctorFallbackLabel()
})

const nextAppointmentReason = computed(() =>
  closestAppointment.value?.reason || noAppointmentBody()
)

const nextAppointmentDate = computed(() =>
  closestAppointment.value ? formatLongDate(closestAppointment.value.scheduledAt) : '-'
)

const nextAppointmentTime = computed(() =>
  closestAppointment.value ? formatTime(closestAppointment.value.scheduledAt) : '-'
)

const patientMedicalRecords = computed(() =>
  clinicalStore.medicalRecords
    .filter((record) =>
      record.id_patient === CURRENT_PATIENT_ID &&
      record.updated_at &&
      new Date(record.updated_at) <= new Date()
    )
    .sort((left, right) => new Date(right.updated_at) - new Date(left.updated_at))
)

const recentInteractions = computed(() =>
  patientMedicalRecords.value
    .map((record) => buildInteraction(record))
    .filter(Boolean)
    .slice(0, 3)
)

function buildInteraction(record) {
  const appointment = schedulingStore.appointmentsWithDetails.find((item) => item.id === record.id_appointment)
  const diagnosis = clinicalStore.diagnoses.find((item) => item.id_medical_record === record.id)
  const treatment = clinicalStore.treatments.find((item) => item.id_medical_record === record.id)
  const prescription = clinicalStore.prescriptions.find((item) => item.id_medical_record === record.id)
  const prescriptionDetail = clinicalStore.prescriptionDetails.find((item) => item.id_prescription === prescription?.id)

  if (prescriptionDetail) {
    return {
      id: `rx-${record.id}`,
      title: t('patient.prescriptionUpdated'),
      description: `${prescriptionDetail.medicine_name} ${prescriptionDetail.dose}${prescriptionDetail.dose_unit_type} - ${prescriptionDetail.frequency}`,
      dateLabel: formatShortDate(prescription?.date ?? record.updated_at),
      icon: 'Rx',
      tone: ''
    }
  }

  return {
    id: `record-${record.id}`,
    title: t('patient.physicianNote'),
    description: treatment?.description ?? diagnosis?.description ?? appointment?.reason ?? record.code,
    dateLabel: formatShortDate(record.updated_at),
    icon: 'Dr',
    tone: 'amber'
  }
}

function doctorFallbackLabel() {
  return locale.value === 'es' ? 'Doctor asignado' : 'Assigned Doctor'
}

function noAppointmentBody() {
  return locale.value === 'es'
    ? 'No hay una cita activa registrada para este paciente en la base de datos.'
    : 'There is no active appointment registered for this patient in the database.'
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
      <article class="panel next-appointment">
        <span class="pill-label">{{ t('patient.nextAppointment') }}</span>
        <h2>{{ closestAppointment ? nextAppointmentDoctor : doctorFallbackLabel() }}</h2>
        <p>{{ nextAppointmentReason }}</p>
        <div class="appointment-meta">
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
          <button type="button" class="primary-action" @click="$emit('view-appointments')">{{ t('patient.viewDetails') }}</button>
          <button type="button" class="ghost-action" @click="$emit('view-appointments')">{{ t('patient.allAppointments') }}</button>
        </div>
      </article>

      <div class="quick-actions">
        <button type="button" class="quick-card" @click="$emit('book-appointment')">
          <span class="quick-icon">+</span>
          <strong>{{ t('patient.bookAppointment') }}</strong>
          <small>{{ t('patient.bookCaption') }}</small>
        </button>
        <button type="button" class="quick-card amber" @click="$emit('view-history')">
          <span class="quick-icon">ID</span>
          <strong>{{ t('patient.viewRecords') }}</strong>
          <small>{{ t('patient.recordsCaption') }}</small>
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
  </section>
</template>
