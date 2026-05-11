<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const stats = [
  { label: 'admin.totalPatients', value: '12,842', meta: '+4.2%' },
  { label: 'admin.activeDoctors', value: '342', meta: 'Active' },
  { label: 'admin.bedOccupancy', value: '912', meta: '88% Cap.' },
  { label: 'admin.revenue', value: '$2.4M', meta: 'Monthly' }
]

const bars = [
  { day: 'MON', value: 42 },
  { day: 'TUE', value: 66 },
  { day: 'WED', value: 86 },
  { day: 'THU', value: 55 },
  { day: 'FRI', value: 70 },
  { day: 'SAT', value: 96 },
  { day: 'SUN', value: 48 }
]
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
          <div class="segmented-control">
            <span class="selected">7 Days</span>
            <span>30 Days</span>
          </div>
        </div>
        <div class="bar-chart" aria-label="Weekly patient admissions">
          <div v-for="bar in bars" :key="bar.day" class="bar-column">
            <span class="bar-track">
              <span class="bar-value" :style="{ height: `${bar.value}%` }"></span>
            </span>
            <small>{{ bar.day }}</small>
          </div>
        </div>
      </article>

      <article class="panel allocation-panel">
        <h2>{{ t('admin.resourceAllocation') }}</h2>
        <div class="donut">
          <strong>72%</strong>
          <span>Optimum</span>
        </div>
        <ul class="legend-list">
          <li><span class="legend-dot cyan"></span>Emergency Care <strong>45%</strong></li>
          <li><span class="legend-dot mint"></span>Diagnostics <strong>22%</strong></li>
          <li><span class="legend-dot amber"></span>Outpatient <strong>33%</strong></li>
        </ul>
      </article>

      <article class="panel activity-panel">
        <div class="panel-heading">
          <h2>{{ t('admin.activityLog') }}</h2>
          <button type="button">{{ t('admin.viewFullLog') }}</button>
        </div>
        <div class="activity-list">
          <div class="activity-item">
            <span></span>
            <div>
              <strong>Dr. Aris Thorne updated Patient #0429</strong>
              <p>Clinical Record Update - 2 mins ago</p>
            </div>
            <small>Internal</small>
          </div>
          <div class="activity-item">
            <span></span>
            <div>
              <strong>Lab results uploaded: MRI Scan A12</strong>
              <p>Radiology Department - 14 mins ago</p>
            </div>
            <small>Success</small>
          </div>
          <div class="activity-item">
            <span></span>
            <div>
              <strong>Automatic DB backup completed</strong>
              <p>System Security - 1 hour ago</p>
            </div>
            <small>Auto</small>
          </div>
        </div>
      </article>

      <article class="panel alert-panel">
        <h2>{{ t('admin.urgentAlerts') }}</h2>
        <div class="alert-card">
          <small>Critical Low</small>
          <p>Oxygen supply in Wing C is below 15% threshold.</p>
        </div>
        <div class="alert-card teal">
          <small>Staffing Notice</small>
          <p>Emergency room surge detected. Additional staff paged.</p>
        </div>
        <button type="button">{{ t('admin.acknowledge') }}</button>
      </article>
    </div>
  </section>
</template>
