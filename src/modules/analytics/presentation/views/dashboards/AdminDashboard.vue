<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAnalyticsStore } from '../../../application/analytics-store.js'

const { t, locale } = useI18n()
const analyticsStore = useAnalyticsStore()
const selectedWeekStart = ref(startOfWeek(new Date()))

onMounted(() => {
  analyticsStore.loadAnalyticsData()
})

const snapshot = computed(() => analyticsStore.snapshot)
const admissions = computed(() => analyticsStore.admissionsForDate(selectedWeekStart.value))
const selectedWeekEnd = computed(() => addDays(selectedWeekStart.value, 6))
const selectedDateInput = computed({
  get: () => toLocalDateKey(selectedWeekStart.value),
  set: (value) => {
    selectedWeekStart.value = startOfWeek(parseLocalDate(value))
  }
})
const weeklyTotal = computed(() =>
  admissions.value.reduce((sum, admission) => sum + admission.count, 0)
)
const weeklyAverage = computed(() => Math.round((weeklyTotal.value / 7) * 10) / 10)
const activeDays = computed(() =>
  admissions.value.filter((admission) => admission.count > 0).length
)
const busiestAdmission = computed(() =>
  admissions.value.reduce((best, admission) =>
    admission.count > best.count ? admission : best,
    admissions.value[0] ?? { day: '-', count: 0 }
  )
)
const weekStats = computed(() => [
  {
    label: 'admin.totalAdmissions',
    value: formatNumber(weeklyTotal.value)
  },
  {
    label: 'admin.dailyAverage',
    value: weeklyAverage.value.toLocaleString(locale.value, { maximumFractionDigits: 1 })
  },
  {
    label: 'admin.busiestDay',
    value: busiestAdmission.value.count ? busiestAdmission.value.day : '-'
  },
  {
    label: 'admin.activeDays',
    value: `${activeDays.value}/7`
  }
])
const weekRangeLabel = computed(() => {
  const formatter = new Intl.DateTimeFormat(locale.value, {
    month: 'short',
    day: 'numeric'
  })
  const yearFormatter = new Intl.DateTimeFormat(locale.value, {
    year: 'numeric'
  })

  return `${formatter.format(selectedWeekStart.value)} - ${formatter.format(selectedWeekEnd.value)}, ${yearFormatter.format(selectedWeekEnd.value)}`
})
const isCurrentWeek = computed(() =>
  toLocalDateKey(selectedWeekStart.value) === toLocalDateKey(startOfWeek(new Date()))
)

const stats = computed(() => [
  {
    label: 'admin.totalPatients',
    value: formatNumber(snapshot.value.totalPatients),
    meta: `${snapshot.value.totalMedicalRecords || 0} ${t('admin.records')}`
  },
  {
    label: 'admin.activeDoctors',
    value: formatNumber(snapshot.value.activeDoctors),
    meta: t('tenant.doctorProfile.active')
  },
  {
    label: 'admin.revenue',
    value: formatCurrencyCompact(snapshot.value.revenue),
    meta: t('admin.revenueMeta')
  }
])

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(value || 0)
}

function formatCurrencyCompact(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(value || 0)
}

function addDays(date, days) {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + days)
  return nextDate
}

function startOfWeek(date) {
  const safeDate = new Date(date)
  safeDate.setHours(12, 0, 0, 0)
  const day = safeDate.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  return addDays(safeDate, mondayOffset)
}

function toLocalDateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-')
}

function parseLocalDate(value) {
  const [year, month, day] = String(value ?? '').split('-').map(Number)
  if (!year || !month || !day) return new Date()
  return new Date(year, month - 1, day, 12)
}

function shiftWeek(offset) {
  selectedWeekStart.value = addDays(selectedWeekStart.value, offset * 7)
}

function resetCurrentWeek() {
  selectedWeekStart.value = startOfWeek(new Date())
}
</script>

<template>
  <section class="dashboard-view admin-dashboard">
    <div class="metric-grid">
      <article v-for="stat in stats" :key="stat.label" class="metric-card">
        <span class="metric-meta">{{ stat.meta }}</span>
        <p>{{ t(stat.label) }}</p>
        <strong>{{ stat.value }}</strong>
      </article>
    </div>

    <div class="dashboard-grid admin-grid">
      <article class="panel chart-panel">
        <div class="panel-heading admissions-heading">
          <div>
            <h2>{{ t('admin.weeklyAdmissions') }}</h2>
            <p>{{ t('admin.realtime') }}</p>
          </div>
          <div class="week-controls">
            <button class="week-step" type="button" :aria-label="t('admin.previousWeek')" :title="t('admin.previousWeek')" @click="shiftWeek(-1)">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.4 5.4 8.8 12l6.6 6.6-1.4 1.4L6 12l8-8 1.4 1.4Z"/></svg>
            </button>
            <label class="week-picker-shell">
              <span>{{ weekRangeLabel }}</span>
              <input v-model="selectedDateInput" type="date" :aria-label="t('admin.pickWeek')" />
            </label>
            <button class="week-step" type="button" :aria-label="t('admin.nextWeek')" :title="t('admin.nextWeek')" @click="shiftWeek(1)">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8.6 18.6 6.6-6.6-6.6-6.6L10 4l8 8-8 8-1.4-1.4Z"/></svg>
            </button>
            <button class="week-today" type="button" :disabled="isCurrentWeek" @click="resetCurrentWeek">
              {{ t('admin.currentWeek') }}
            </button>
          </div>
        </div>
        <div class="bar-chart" aria-label="Weekly patient admissions">
          <div v-for="bar in admissions" :key="bar.day" class="bar-column" :class="{ 'is-busiest': weeklyTotal && bar.day === busiestAdmission.day && bar.count === busiestAdmission.count }">
            <span class="bar-track">
              <span class="bar-value" :style="{ height: `${bar.value}%` }"></span>
            </span>
            <span class="bar-label">
              <small>{{ bar.day }}</small>
              <strong class="bar-count">{{ bar.count }}</strong>
            </span>
          </div>
        </div>
        <div class="admissions-summary" aria-label="Weekly admissions statistics">
          <div v-for="item in weekStats" :key="item.label" class="admissions-stat">
            <span>{{ t(item.label) }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </div>
      </article>

    </div>
  </section>
</template>
