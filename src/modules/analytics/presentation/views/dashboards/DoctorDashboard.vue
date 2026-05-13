<script setup>
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAnalyticsStore } from '../../../application/analytics-store.js'
import useClinicalStore from '../../../../clinical/application/clinical.store.js'
import useTenantStore from '../../../../tenant/application/tenant.store.js'

const { t, locale } = useI18n()
const CURRENT_DOCTOR_ID = 'doc-001'
const analyticsStore = useAnalyticsStore()
const clinicalStore = useClinicalStore()
const tenantStore = useTenantStore()

onMounted(() => {
  analyticsStore.loadAnalyticsData()
  if (!clinicalStore.doctorsLoaded) clinicalStore.fetchDoctors()
  if (!tenantStore.usersLoaded) tenantStore.fetchUsers()
})

const doctor = computed(() => clinicalStore.getDoctorById(CURRENT_DOCTOR_ID) ?? clinicalStore.doctors[0])
const user = computed(() => {
  if (!doctor.value?.id_user) return tenantStore.users.find((item) => item.role === 'doctor')
  return tenantStore.users.find((item) => item.id === doctor.value.id_user)
})

const doctorDisplayName = computed(() => {
  const surname = user.value?.paternal_surname
  const name = user.value?.name
  return surname ? `Dr. ${surname}` : name ? `Dr. ${name}` : 'Doctor'
})

const snapshot = computed(() => analyticsStore.snapshot)
const doctorAnalytics = computed(() => snapshot.value.doctor)
const appointments = computed(() =>
  doctorAnalytics.value.visibleAppointments.map((appointment) => ({
    id: appointment.id,
    time: formatTimeParts(appointment.scheduledAt),
    patient: appointment.patient?.fullName || 'Unassigned patient',
    reason: appointment.reason,
    status: appointment.status
  }))
)

const summary = computed(() =>
  locale.value === 'es'
    ? `Tienes ${doctorAnalytics.value.todayAppointments} citas registradas para hoy y ${doctorAnalytics.value.pendingRecordReviews} citas activas sin HCE asociada.`
    : `You have ${doctorAnalytics.value.todayAppointments} appointments registered for today and ${doctorAnalytics.value.pendingRecordReviews} active appointments without an HCE record.`
)

const weeklyVisits = computed(() =>
  doctorAnalytics.value.trendBars.reduce((sum, bar) => sum + bar.count, 0)
)

function formatTimeParts(value) {
  const date = new Date(value)
  const [time, dayPeriod = ''] = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  }).split(' ')

  return { time, dayPeriod }
}
</script>

<template>
  <section class="dashboard-view doctor-dashboard">
    <div class="doctor-grid">
      <article class="panel doctor-hero">
        <h1>{{ t('doctor.greeting', { doctor: doctorDisplayName }) }}</h1>
        <p>{{ summary }}</p>
        <div class="doctor-stats">
          <div>
            <span>{{ t('doctor.activePatients') }}</span>
            <strong>{{ doctorAnalytics.activePatients }}</strong>
          </div>
          <div>
            <span>{{ t('doctor.appointments') }}</span>
            <strong>{{ doctorAnalytics.todayAppointments }}</strong>
          </div>
          <div>
            <span>{{ locale === 'es' ? 'HCE pendientes' : 'Pending HCE' }}</span>
            <strong class="orange">{{ doctorAnalytics.pendingRecordReviews }}</strong>
          </div>
        </div>
      </article>

      <article v-if="appointments.length" class="appointments-list">
        <div class="panel-heading">
          <h2>{{ locale === 'es' ? 'Citas asignadas' : 'Assigned Appointments' }}</h2>
        </div>
        <div
          v-for="appointment in appointments"
          :key="appointment.id"
          class="doctor-appointment"
        >
          <time>
            <strong>{{ appointment.time.time }}</strong>
            <span>{{ appointment.time.dayPeriod }}</span>
          </time>
          <span class="avatar"></span>
          <div>
            <strong>{{ appointment.patient }}</strong>
            <p>{{ appointment.reason }}</p>
          </div>
          <small>{{ appointment.status }}</small>
        </div>
      </article>

      <aside class="doctor-side">
        <article class="panel trend-panel">
          <h2>{{ t('doctor.clinicalTrends') }}</h2>
          <div class="mini-chart">
            <span v-for="bar in doctorAnalytics.trendBars" :key="bar.day" :style="{ height: `${bar.value}%` }"></span>
          </div>
          <div class="trend-metrics">
            <div>
              <small>{{ locale === 'es' ? 'HCE pendientes' : 'Pending HCE' }}</small>
              <strong>{{ doctorAnalytics.pendingRecordReviews }}</strong>
            </div>
            <div>
              <small>{{ locale === 'es' ? 'Visitas semanales' : 'Weekly visits' }}</small>
              <strong>{{ weeklyVisits }}</strong>
            </div>
          </div>
        </article>
      </aside>
    </div>
  </section>
</template>
