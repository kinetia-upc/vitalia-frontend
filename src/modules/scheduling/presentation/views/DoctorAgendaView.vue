<script setup>
import { computed } from 'vue'
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSchedulingStore } from '../../application/scheduling-store.js'

const store = useSchedulingStore()
const { t } = useI18n()
const LUNCH_TIME = '12:30'

onMounted(() => {
  if (!store.loaded) store.fetchSchedulingData()
})

const agendaItems = computed(() => {
  const appointments = [...store.doctorAgenda]
    .sort((left, right) => new Date(left.scheduledAt) - new Date(right.scheduledAt))
    .map((appointment, index) => ({
      ...appointment,
      type: 'appointment',
      accent: index % 2 === 0 ? 'cyan' : 'amber',
      duration: index % 2 === 0 ? '45 mins' : '60 mins',
      room: index % 2 === 0 ? 'Room 302' : 'Urgent Priority'
    }))

  const agendaDate = appointments[0]?.scheduledAt.slice(0, 10) ?? '2026-04-24'
  const lunchBreak = {
    id: 'lunch-break',
    type: 'lunch',
    scheduledAt: `${agendaDate}T${LUNCH_TIME}:00`
  }

  return [...appointments, lunchBreak]
    .sort((left, right) => new Date(left.scheduledAt) - new Date(right.scheduledAt))
})

const metrics = computed(() => [
  { label: t('scheduling.doctorAgenda.totalPatients'), value: store.doctorAgenda.length || 0 },
  { label: t('scheduling.doctorAgenda.completed'), value: store.doctorAgenda.filter((item) => item.status === 'released').length },
  { label: t('scheduling.doctorAgenda.waitTime'), value: '8m', tone: 'amber' },
  { label: t('scheduling.doctorAgenda.important'), value: store.doctorAgenda.filter((item) => item.status === 'confirmed').length, tone: 'coral' }
])

const formatTime = (dateValue) => new Date(dateValue).toLocaleTimeString([], {
  hour: '2-digit',
  minute: '2-digit'
})

const formatDate = (dateValue) => new Date(dateValue).toLocaleDateString('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric'
})
</script>

<template>
  <section class="scheduling-view doctor-agenda-screen">
    <div class="schedule-page-heading">
      <div>
        <h1>{{ t('scheduling.doctorAgenda.title') }}</h1>
        <p>{{ t('scheduling.doctorAgenda.subtitle') }}</p>
      </div>
      <div class="agenda-controls">
        <div class="segmented-control compact">
          <span class="selected">Day</span>
          <span>Week</span>
        </div>
        <button class="primary-action compact-action" type="button">{{ t('scheduling.doctorAgenda.requestChange') }}</button>
      </div>
    </div>

    <div class="doctor-agenda-layout">
      <article class="agenda-timeline panel">
        <div
          v-for="item in agendaItems"
          :key="item.id"
          class="timeline-row"
          :class="{ 'muted-row': item.type === 'lunch' }"
        >
          <time>
            <strong>{{ formatTime(item.scheduledAt) }}</strong>
            <small>{{ formatDate(item.scheduledAt) }}</small>
            <span>{{ new Date(item.scheduledAt).getHours() < 12 ? 'AM' : 'PM' }}</span>
          </time>

          <div v-if="item.type === 'lunch'" class="lunch-card">Lunch Break - Clinical Staff Lounge</div>

          <div v-else class="agenda-card" :class="[item.accent, item.status]">
            <button class="card-menu" type="button" aria-label="Appointment actions">⋮</button>
            <strong>{{ item.patient?.fullName }}</strong>
            <span class="mini-chip">{{ item.reason }}</span>
            <p>{{ item.duration }} • {{ item.room }}</p>
            <div class="doctor-card-actions">
              <button
                v-if="store.canStartAttention(item)"
                type="button"
                @click="store.startAttention(item.id)"
              >
                {{ t('scheduling.doctorAgenda.startCare') }}
              </button>
              <button
                v-if="item.status === 'in-attention'"
                type="button"
                @click="store.markPatientArrived(item.id)"
              >
                {{ t('scheduling.doctorAgenda.markArrived') }}
              </button>
              <button
                v-if="store.canReleaseAppointment(item)"
                type="button"
                class="danger"
                @click="store.releaseAppointment(item.id)"
              >
                {{ t('scheduling.doctorAgenda.release') }}
              </button>
              <small>{{ item.status }}</small>
            </div>
          </div>
        </div>
      </article>

      <aside class="agenda-side">
        <article class="side-panel panel">
          <h2>{{ t('scheduling.doctorAgenda.todayMetrics') }}</h2>
          <div class="metric-mini-grid">
            <div v-for="metric in metrics" :key="metric.label" :class="metric.tone">
              <span>{{ metric.label }}</span>
              <strong>{{ metric.value }}</strong>
            </div>
          </div>
        </article>

        <article class="side-panel panel calendar-panel">
          <h2>April 2026</h2>
          <div class="calendar-grid" aria-label="April 2026 calendar">
            <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
            <small v-for="day in 14" :key="day" :class="{ active: day === 10 }">{{ day + 16 }}</small>
          </div>
        </article>

        <article class="side-panel panel reminder-panel">
          <h2>{{ t('scheduling.doctorAgenda.reminders') }}</h2>
          <div class="reminder-item cyan">
            <strong>Review Blood Lab Results</strong>
            <p>Patient: Thompson, Mark</p>
          </div>
          <div class="reminder-item amber">
            <strong>Staff Meeting: Room 102</strong>
            <p>04:30 PM - Today</p>
          </div>
        </article>
      </aside>
    </div>
  </section>
</template>
