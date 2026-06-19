<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSchedulingStore } from '../../../../scheduling/application/scheduling-store.js'
import useClinicalStore from '../../../../clinical/application/clinical.store.js'
import useTenantStore from '../../../../tenant/application/tenant.store.js'
import { useAuthStore } from '../../../../../shared/application/auth-store.js'

defineEmits(['book-appointment', 'view-appointments', 'view-history'])

const { t, locale } = useI18n()
const authStore = useAuthStore()
const CURRENT_PATIENT_ID = computed(() => authStore.currentUserId)
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
    .map((appointment) => ({
      appointment,
      distance: Math.abs(new Date(appointment.scheduledAt) - new Date())
    }))
    .sort((left, right) => left.distance - right.distance)[0]?.appointment ?? null
)

const nextAppointmentDoctor = computed(() => {
  const doctorUser = tenantStore.users.find((item) => item.id === closestAppointment.value?.doctor?.userId)
  const fullName = [
    doctorUser?.name,
    doctorUser?.paternalSurname
  ].filter(Boolean).join(' ')

  if (fullName) return `Dr. ${fullName}`
  return closestAppointment.value?.doctor?.fullName || t('patient.doctorFallback')
})

const nextAppointmentReason = computed(() =>
  closestAppointment.value?.reason || t('patient.noAppointment')
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
      record.patientId === CURRENT_PATIENT_ID.value &&
      record.updatedAt &&
      new Date(record.updatedAt) <= new Date()
    )
    .sort((left, right) => new Date(right.updatedAt) - new Date(left.updatedAt))
)

const recentInteractions = computed(() =>
  patientMedicalRecords.value
    .map((record) => buildInteraction(record))
    .filter(Boolean)
    .slice(0, 3)
)

function buildInteraction(record) {
  const appointment = schedulingStore.appointmentsWithDetails.find((item) => item.id === record.appointmentId)
  const diagnosis = clinicalStore.diagnoses.find((item) => item.medicalRecordId === record.id)
  const treatment = clinicalStore.treatments.find((item) => item.medicalRecordId === record.id)
  const prescription = clinicalStore.prescriptions.find((item) => item.medicalRecordId === record.id)
  const prescriptionDetail = clinicalStore.prescriptionDetails.find((item) => item.prescriptionId === prescription?.id)

  if (prescriptionDetail) {
    return {
      id: `rx-${record.id}`,
      title: t('patient.prescriptionUpdated'),
      description: `${prescriptionDetail.medicineName} ${prescriptionDetail.doseAmount}${prescriptionDetail.doseUnit} - ${prescriptionDetail.frequency}`,
      dateLabel: formatShortDate(prescription?.createdAt ?? record.updatedAt),
      icon: 'Rx',
      tone: ''
    }
  }

  return {
    id: `record-${record.id}`,
    title: t('patient.physicianNote'),
    description: treatment?.description ?? diagnosis?.description ?? appointment?.reason ?? record.code,
    dateLabel: formatShortDate(record.updatedAt),
    icon: 'Dr',
    tone: 'amber'
  }
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
        <h2>{{ closestAppointment ? nextAppointmentDoctor : t('patient.doctorFallback') }}</h2>
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
          <button type="button" class="primary-action" @click="selectedAppointment = closestAppointment">{{ t('patient.viewDetails') }}</button>
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

    <div v-if="selectedAppointment" class="modal-backdrop" @click.self="closeDetailModal">
      <article class="schedule-dialog appointment-detail-dialog panel">
        <div class="panel-heading">
          <div>
            <h2>{{ t('scheduling.patientAppointments.viewDetails') }}</h2>
            <p>{{ selectedAppointment.reason }}</p>
          </div>
          <button class="text-action" type="button" @click="closeDetailModal">
            {{ t('scheduling.patientAppointments.close') }}
          </button>
        </div>

        <div class="appointment-detail-hero">
          <span class="avatar"></span>
          <div>
            <small>{{ t('scheduling.patientAppointments.doctor') }}</small>
            <strong>{{ selectedAppointment.doctor?.fullName || '-' }}</strong>
            <p>{{ selectedAppointment.doctor?.specialty || '-' }}</p>
          </div>
        </div>

        <div class="appointment-detail-grid">
          <section>
            <small>{{ t('patient.date') }}</small>
            <strong>{{ formatLongDate(selectedAppointment.scheduledAt) }}</strong>
          </section>
          <section>
            <small>{{ t('patient.time') }}</small>
            <strong>{{ formatTime(selectedAppointment.scheduledAt) }}</strong>
          </section>
          <section>
            <small>{{ t('scheduling.patientAppointments.clinic') }}</small>
            <strong>{{ selectedAppointment.branch?.name || '-' }}</strong>
            <span>{{ selectedAppointment.branch?.description || '' }}</span>
          </section>
          <section>
            <small>{{ t('clinical.doctorPatients.status') }}</small>
            <strong>{{ selectedAppointment.status }}</strong>
          </section>
        </div>
      </article>
    </div>
  </section>
</template>
