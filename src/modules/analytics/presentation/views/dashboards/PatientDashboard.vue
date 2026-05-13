<script setup>
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import useClinicalStore from '../../../../clinical/application/clinical.store.js'
import useTenantStore from '../../../../tenant/application/tenant.store.js'

const { t } = useI18n()
const CURRENT_PATIENT_ID = 'pat-001'
const clinicalStore = useClinicalStore()
const tenantStore = useTenantStore()

onMounted(() => {
  if (!clinicalStore.patientsLoaded) clinicalStore.fetchPatients()
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
        <h2>Dr. Alistair Vance</h2>
        <p>Advanced Cardiology Consultation</p>
        <div class="appointment-meta">
          <div>
            <small>{{ t('patient.date') }}</small>
            <strong>April 24, 2026</strong>
          </div>
          <div>
            <small>{{ t('patient.time') }}</small>
            <strong>09:30 AM (GMT)</strong>
          </div>
        </div>
        <div class="appointment-actions">
          <button type="button" class="primary-action">{{ t('patient.viewDetails') }}</button>
          <button type="button" class="ghost-action">{{ t('patient.allAppointments') }}</button>
        </div>
      </article>

      <div class="quick-actions">
        <button type="button" class="quick-card">
          <span class="quick-icon">+</span>
          <strong>{{ t('patient.bookAppointment') }}</strong>
          <small>{{ t('patient.bookCaption') }}</small>
        </button>
        <button type="button" class="quick-card amber">
          <span class="quick-icon">ID</span>
          <strong>{{ t('patient.viewRecords') }}</strong>
          <small>{{ t('patient.recordsCaption') }}</small>
        </button>
      </div>

      <article class="panel interactions-panel">
        <div class="panel-heading">
          <h2>{{ t('patient.recentInteractions') }}</h2>
          <button type="button">{{ t('patient.viewAllHistory') }}</button>
        </div>
        <div class="interaction-list">
          <div class="interaction-item">
            <span class="interaction-icon">Rx</span>
            <div>
              <strong>{{ t('patient.prescriptionUpdated') }}</strong>
              <p>Lipitor 20mg - Renewal approved</p>
            </div>
            <small>Yesterday</small>
          </div>
          <div class="interaction-item">
            <span class="interaction-icon teal">Lab</span>
            <div>
              <strong>{{ t('patient.labReady') }}</strong>
              <p>Annual Comprehensive Metabolic Panel</p>
            </div>
            <small>3 Days ago</small>
          </div>
          <div class="interaction-item">
            <span class="interaction-icon amber">Dr</span>
            <div>
              <strong>{{ t('patient.physicianNote') }}</strong>
              <p>Follow-up comments from Dr. Sarah Jenkins</p>
            </div>
            <small>Apr 13, 2026</small>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>
