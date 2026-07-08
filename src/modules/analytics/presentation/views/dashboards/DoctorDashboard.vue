<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAnalyticsStore } from '../../../application/analytics-store.js'
import useClinicalStore from '../../../../clinical/application/clinical.store.js'
import useTenantStore from '../../../../tenant/application/tenant.store.js'
import { useAuthStore } from '../../../../../shared/application/auth-store.js'

const { t, locale } = useI18n()
const authStore = useAuthStore()
const CURRENT_DOCTOR_ID = computed(() => authStore.currentDoctorId)
const analyticsStore = useAnalyticsStore()
const clinicalStore = useClinicalStore()
const tenantStore = useTenantStore()

onMounted(() => {
  analyticsStore.loadAnalyticsData()
  if (!clinicalStore.doctorsLoaded) clinicalStore.fetchDoctors()
  if (!clinicalStore.medicalRecordsLoaded) clinicalStore.fetchMedicalRecords()
  if (!tenantStore.usersLoaded) tenantStore.fetchUsers()
})

const doctor = computed(() => clinicalStore.getDoctorById(CURRENT_DOCTOR_ID.value))
const user = computed(() => {
  if (authStore.currentUser?.role === 'doctor') return authStore.currentUser
  if (!doctor.value?.userId) return null
  return tenantStore.users.find((item) => String(item.id) === String(doctor.value.userId))
})

const doctorDisplayName = computed(() => {
  const surname = user.value?.paternalSurname
  const name = user.value?.name
  return surname ? `Dr. ${surname}` : name ? `Dr. ${name}` : 'Doctor'
})

const snapshot = computed(() => analyticsStore.snapshot)
const doctorAnalytics = computed(() => snapshot.value.doctor)

const APPOINTMENT_LIST_CATEGORIES = ['scheduled', 'confirmed', 'released']
const categoryIndex = ref(0)
const currentCategoryKey = computed(() => APPOINTMENT_LIST_CATEGORIES[categoryIndex.value])

function appointmentCode(appointment) {
  if (appointment.status === 'released') {
    const medicalRecord = clinicalStore.medicalRecords.find((record) => record.appointmentId === appointment.id)
    if (medicalRecord?.code) return medicalRecord.code
  }
  return appointment.code
}

function mapAppointments(list) {
  return (list ?? []).map((appointment) => ({
    id: appointment.id,
    time: formatTimeParts(appointment.scheduledAt),
    patient: appointment.patient?.fullName || 'Unassigned patient',
    reason: appointment.reason,
    status: appointment.status,
    code: appointmentCode(appointment)
  }))
}

const categoryAppointments = computed(() => {
  if (currentCategoryKey.value === 'scheduled') return mapAppointments(doctorAnalytics.value.scheduledAppointmentsList)
  if (currentCategoryKey.value === 'confirmed') return mapAppointments(doctorAnalytics.value.confirmedAppointmentsList)
  return mapAppointments(doctorAnalytics.value.releasedAppointmentsList)
})

const categoryLabels = computed(() => ({
  scheduled: t('doctor.assignedAppointments'),
  confirmed: t('doctor.confirmedAppointmentsTitle'),
  released: t('doctor.medicalRecordsCreated')
}))

const categoryEmptyLabels = computed(() => ({
  scheduled: t('doctor.noScheduledAppointments'),
  confirmed: t('doctor.noConfirmedAppointments'),
  released: t('doctor.noReleasedConsultations')
}))

const currentCategoryLabel = computed(() => categoryLabels.value[currentCategoryKey.value])
const currentCategoryEmptyLabel = computed(() => categoryEmptyLabels.value[currentCategoryKey.value])

function shiftCategory(amount) {
  categoryIndex.value = (categoryIndex.value + amount + APPOINTMENT_LIST_CATEGORIES.length) % APPOINTMENT_LIST_CATEGORIES.length
  listPage.value = 0
}

const LIST_PAGE_SIZE = 4
const listPage = ref(0)
const listTotalPages = computed(() =>
  Math.max(1, Math.ceil(categoryAppointments.value.length / LIST_PAGE_SIZE))
)
const visibleListAppointments = computed(() => {
  const start = listPage.value * LIST_PAGE_SIZE
  return categoryAppointments.value.slice(start, start + LIST_PAGE_SIZE)
})

watch(listTotalPages, (totalPages) => {
  if (listPage.value > totalPages - 1) listPage.value = totalPages - 1
})

function shiftListPage(amount) {
  listPage.value = Math.min(Math.max(listPage.value + amount, 0), listTotalPages.value - 1)
}

const summary = computed(() => t('doctor.summaryText'))

const trendMonth = ref(new Date().toISOString().slice(0, 7))

const trendMonthDate = computed(() => {
  const [year, month] = trendMonth.value.split('-').map(Number)
  return new Date(year, month - 1, 1)
})

const trendMonthLabel = computed(() =>
  trendMonthDate.value.toLocaleDateString(locale.value === 'es' ? 'es-PE' : 'en-US', {
    month: 'long',
    year: 'numeric'
  })
)

function shiftTrendMonth(amount) {
  const next = new Date(trendMonthDate.value)
  next.setMonth(next.getMonth() + amount)
  trendMonth.value = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`
}

const trendDailyCounts = computed(() => {
  const year = trendMonthDate.value.getFullYear()
  const month = trendMonthDate.value.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const counts = Array.from({ length: daysInMonth }, () => 0)

  for (const appointment of doctorAnalytics.value.releasedAppointmentsList ?? []) {
    const date = new Date(appointment.scheduledAt)
    if (date.getFullYear() === year && date.getMonth() === month) {
      counts[date.getDate() - 1] += 1
    }
  }

  return counts
})

const monthlyConsultations = computed(() =>
  trendDailyCounts.value.reduce((sum, count) => sum + count, 0)
)

const trendPoints = computed(() => {
  const counts = trendDailyCounts.value
  const max = Math.max(1, ...counts)
  const stepX = counts.length > 1 ? 100 / (counts.length - 1) : 0

  return counts.map((count, index) => ({
    day: index + 1,
    count,
    x: index * stepX,
    y: 100 - (count / max) * 100
  }))
})

const trendLinePoints = computed(() =>
  trendPoints.value.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' ')
)

const trendAreaPoints = computed(() => `0,100 ${trendLinePoints.value} 100,100`)

const trendAxisLabels = computed(() => {
  const points = trendPoints.value
  if (!points.length) return []
  const step = Math.ceil(points.length / 6)
  const labels = points.filter((_, index) => index % step === 0)
  const lastPoint = points[points.length - 1]
  if (labels[labels.length - 1]?.day !== lastPoint.day) labels.push(lastPoint)
  return labels
})

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
            <strong>{{ doctorAnalytics.scheduledAppointmentsCount }}</strong>
          </div>
          <div>
            <span>{{ t('doctor.medicalRecordsCreated') }}</span>
            <strong class="green">{{ doctorAnalytics.medicalRecordsCreatedCount }}</strong>
          </div>
          <div>
            <span>{{ t('doctor.pendingHce') }}</span>
            <strong class="orange">{{ doctorAnalytics.openConsultationsCount }}</strong>
          </div>
        </div>
      </article>

      <article class="appointments-list">
        <div class="panel-heading">
          <div class="appointments-category-switcher">
            <button type="button" aria-label="Previous category" @click="shiftCategory(-1)">‹</button>
            <h2>{{ currentCategoryLabel }}</h2>
            <button type="button" aria-label="Next category" @click="shiftCategory(1)">›</button>
          </div>
        </div>

        <template v-if="categoryAppointments.length">
          <div
            v-for="appointment in visibleListAppointments"
            :key="appointment.id"
            class="doctor-appointment"
            :class="appointment.status"
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
            <div class="doctor-appointment-meta">
              <span v-if="appointment.code" class="app-code doctor-appointment-code">{{ appointment.code }}</span>
              <small>{{ appointment.status }}</small>
            </div>
          </div>
        </template>
        <p v-else class="appointments-list-empty">{{ currentCategoryEmptyLabel }}</p>

        <div v-if="listTotalPages > 1" class="appointments-list-pager">
          <button type="button" aria-label="Previous page" :disabled="listPage === 0" @click="shiftListPage(-1)">‹</button>
          <span>{{ listPage + 1 }} / {{ listTotalPages }}</span>
          <button type="button" aria-label="Next page" :disabled="listPage >= listTotalPages - 1" @click="shiftListPage(1)">›</button>
        </div>
      </article>

      <aside class="doctor-side">
        <article class="panel trend-panel">
          <div class="panel-heading">
            <h2>{{ t('doctor.clinicalTrends') }}</h2>
            <div class="appointments-category-switcher trend-month-switcher">
              <button type="button" aria-label="Previous month" @click="shiftTrendMonth(-1)">‹</button>
              <span class="trend-month-label">{{ trendMonthLabel }}</span>
              <button type="button" aria-label="Next month" @click="shiftTrendMonth(1)">›</button>
            </div>
          </div>
          <div class="trend-line-chart">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none">
              <polygon :points="trendAreaPoints" class="trend-line-area" />
              <polyline :points="trendLinePoints" class="trend-line-stroke" />
            </svg>
          </div>
          <div class="trend-axis">
            <span v-for="label in trendAxisLabels" :key="label.day">{{ label.day }}</span>
          </div>
          <div class="trend-metrics">
            <div>
              <small>{{ t('doctor.pendingHce') }}</small>
              <strong>{{ doctorAnalytics.openConsultationsCount }}</strong>
            </div>
            <div>
              <small>{{ t('doctor.monthlyConsultations') }}</small>
              <strong>{{ monthlyConsultations }}</strong>
            </div>
          </div>
        </article>
      </aside>
    </div>
  </section>
</template>
