<script setup>
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSchedulingStore } from '../../application/scheduling-store.js'

const store = useSchedulingStore()
const { t } = useI18n()

onMounted(() => {
  if (!store.loaded) store.fetchSchedulingData()
})

const nextAppointment = computed(() => store.patientAppointments[0])
const upcomingAppointments = computed(() => store.patientAppointments.slice(1))

const formatMonthDay = (value) => new Date(value).toLocaleDateString('en-US', {
  month: 'short',
  day: 'numeric'
})

const formatWeekdayTime = (value) => new Date(value).toLocaleDateString('en-US', {
  weekday: 'long',
  hour: '2-digit',
  minute: '2-digit'
})

const formatTime = (value) => new Date(value).toLocaleTimeString([], {
  hour: '2-digit',
  minute: '2-digit'
})
</script>

<template>
  <section class="scheduling-view patient-appointments-screen">
    <div class="schedule-page-heading">
      <div>
        <h1>{{ t('scheduling.patientAppointments.title') }}</h1>
        <p>{{ t('scheduling.patientAppointments.subtitle') }}</p>
      </div>
      <button class="primary-action compact-action" type="button">{{ t('scheduling.patientAppointments.bookNew') }}</button>
    </div>

    <div class="patient-appointment-layout">
      <article class="patient-next-card" v-if="nextAppointment">
        <div>
          <span class="pill-label">{{ t('scheduling.patientAppointments.nextVisit') }}</span>
          <h2>{{ nextAppointment.doctor?.fullName }}</h2>
          <p>{{ nextAppointment.doctor?.specialty }} - {{ nextAppointment.branch?.description }}</p>
          <div class="appointment-actions">
            <button type="button" class="ghost-action">{{ t('scheduling.patientAppointments.viewDetails') }}</button>
            <button type="button" class="danger-action" @click="store.cancelAppointment(nextAppointment.id)">
              {{ t('scheduling.patientAppointments.cancel') }}
            </button>
          </div>
        </div>

        <time>
          <strong>{{ formatMonthDay(nextAppointment.scheduledAt) }}</strong>
          <span>{{ formatTime(nextAppointment.scheduledAt) }} (GMT)</span>
        </time>
      </article>

      <aside class="patient-stat-stack">
        <article class="patient-stat cyan">
          <span>▣</span>
          <strong>{{ store.patientAppointments.length }}</strong>
          <small>{{ t('scheduling.patientAppointments.totalVisits') }}</small>
        </article>
        <article class="patient-stat amber">
          <span>▣</span>
          <strong>{{ store.availableSlots.length }}</strong>
          <small>{{ t('scheduling.patientAppointments.pendingResults') }}</small>
        </article>
      </aside>
    </div>

    <article class="upcoming-panel">
      <h2>{{ t('scheduling.patientAppointments.upcomingAppointments') }}</h2>
      <div class="patient-appointment-list">
        <div v-for="appointment in upcomingAppointments" :key="appointment.id" class="patient-appointment-row">
          <time>
            <strong>{{ formatMonthDay(appointment.scheduledAt) }}, 2026</strong>
            <span>{{ formatWeekdayTime(appointment.scheduledAt) }}</span>
          </time>
          <span class="avatar small"></span>
          <div>
            <strong>{{ appointment.doctor?.fullName }}</strong>
            <p>{{ appointment.reason }}</p>
          </div>
          <div>
            <small>Clinic</small>
            <p>{{ appointment.branch?.name }} - Suite 402</p>
          </div>
          <span :class="`status ${appointment.status}`">{{ appointment.status }}</span>
          <button type="button" class="chevron-button" aria-label="Open appointment">›</button>
        </div>
      </div>

      <div class="available-slot-strip" v-if="store.availableSlots.length">
        <button
          v-for="slot in store.availableSlots"
          :key="slot.id"
          type="button"
          @click="store.reserveAppointment(slot)"
        >
          {{ slot.date }} • {{ slot.startTime }} - {{ t('scheduling.patientAppointments.reserve') }}
        </button>
      </div>
    </article>
  </section>
</template>
