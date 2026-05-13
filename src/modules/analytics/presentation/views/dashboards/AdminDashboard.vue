<script setup>
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAnalyticsStore } from '../../../application/analytics-store.js'

const { t } = useI18n()
const analyticsStore = useAnalyticsStore()

onMounted(() => {
  analyticsStore.loadAnalyticsData()
})

const snapshot = computed(() => analyticsStore.snapshot)

const stats = computed(() => [
  {
    label: 'admin.totalPatients',
    value: formatNumber(snapshot.value.totalPatients),
    meta: `${snapshot.value.totalMedicalRecords} HCE`
  },
  {
    label: 'admin.activeDoctors',
    value: formatNumber(snapshot.value.activeDoctors),
    meta: 'Active'
  },
  {
    label: 'admin.revenue',
    value: formatCurrencyCompact(snapshot.value.revenue),
    meta: 'Claims'
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
        <div class="panel-heading">
          <div>
            <h2>{{ t('admin.weeklyAdmissions') }}</h2>
            <p>{{ t('admin.realtime') }}</p>
          </div>
        </div>
        <div class="bar-chart" aria-label="Weekly patient admissions">
          <div v-for="bar in snapshot.admissions" :key="bar.day" class="bar-column">
            <span class="bar-track">
              <span class="bar-value" :style="{ height: `${bar.value}%` }"></span>
            </span>
            <small>{{ bar.day }} · {{ bar.count }}</small>
          </div>
        </div>
      </article>

    </div>
  </section>
</template>
