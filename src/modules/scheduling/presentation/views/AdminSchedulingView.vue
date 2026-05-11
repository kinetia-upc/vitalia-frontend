<script setup>
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSchedulingStore } from '../../application/scheduling-store.js'

const store = useSchedulingStore()
const { t } = useI18n()

onMounted(() => {
  if (!store.loaded) store.fetchSchedulingData()
})

const operationColumns = computed(() => [
  { title: 'Dr. Chen', subtitle: 'Cardiology', appointments: store.appointmentsWithDetails.slice(0, 2), accent: 'cyan' },
  { title: 'Dr. Aris', subtitle: 'Neurology', appointments: store.appointmentsWithDetails.slice(2, 4), accent: 'mint' },
  { title: 'Theater B', subtitle: 'Surgical', appointments: [{ id: 'sanitation', reason: 'Sanitation', patient: { fullName: '' }, status: 'blocked' }], accent: 'muted' },
  { title: 'Dr. Kovic', subtitle: 'Pediatrics', appointments: store.appointmentsWithDetails.slice(1, 3), accent: 'amber' },
  { title: 'Lab Room 4', subtitle: 'Diagnostics', appointments: store.appointmentsWithDetails.slice(3, 4), accent: 'slate' }
])

const activeAppointments = computed(() =>
  store.appointmentsWithDetails.filter((appointment) => appointment.status !== 'cancelled').length
)
</script>

<template>
  <section class="scheduling-view admin-operations-screen">
    <div class="schedule-page-heading">
      <div>
        <h1>{{ t('scheduling.admin.title') }}</h1>
        <p>{{ t('scheduling.admin.subtitle') }}</p>
      </div>
      <div class="agenda-controls">
        <button class="soft-action" type="button">Daily View</button>
        <button class="primary-action compact-action" type="button">+ Schedule Resource</button>
      </div>
    </div>

    <div class="operations-alert-grid">
      <article class="ops-alert amber">
        <span>+</span>
        <div>
          <strong>Maintenance Alert</strong>
          <p>Surgery Theater A</p>
        </div>
      </article>
      <article class="ops-alert cyan">
        <span>*</span>
        <div>
          <strong>Capacity Notice</strong>
          <p>ICU Ward South</p>
        </div>
      </article>
      <article class="ops-alert slate">
        <span>#</span>
        <div>
          <strong>Staffing Update</strong>
          <p>Nursing Shift Change</p>
        </div>
      </article>
    </div>

    <article class="operations-board">
      <div class="operations-board-header">
        <span>Time</span>
        <div v-for="column in operationColumns" :key="column.title" class="resource-head">
          <span class="avatar tiny"></span>
          <strong>{{ column.title }}</strong>
          <small>{{ column.subtitle }}</small>
        </div>
      </div>

      <div class="operations-board-body">
        <div class="time-scale">
          <span>08:00 AM</span>
          <span>09:00 AM</span>
          <span>10:00 AM</span>
          <span>11:00 AM</span>
        </div>
        <div v-for="column in operationColumns" :key="column.title" class="resource-column">
          <article
            v-for="appointment in column.appointments"
            :key="appointment.id"
            class="operation-block"
            :class="column.accent"
          >
            <strong>{{ appointment.reason }}</strong>
            <p>{{ appointment.patient?.fullName || appointment.status }}</p>
          </article>
        </div>
      </div>
    </article>

    <div class="operations-bottom-grid">
      <article class="facility-panel panel">
        <div class="panel-heading">
          <h2>Facility Utilization</h2>
          <div class="mini-legend">
            <span><i class="cyan-dot"></i>Occupied</span>
            <span><i></i>Available</span>
            <span><i class="amber-dot"></i>Maintenance</span>
          </div>
        </div>
        <div class="facility-bars">
          <div>
            <small>Exam Room 1</small>
            <strong>In Use</strong>
            <span><i style="width: 72%"></i></span>
          </div>
          <div>
            <small>Exam Room 2</small>
            <strong>Available</strong>
            <span><i style="width: 24%"></i></span>
          </div>
          <div>
            <small>OR Alpha</small>
            <strong>Repair</strong>
            <span class="amber-bar"><i style="width: 90%"></i></span>
          </div>
          <div>
            <small>Consultation B</small>
            <strong>In Use</strong>
            <span><i style="width: 68%"></i></span>
          </div>
        </div>
      </article>

      <article class="global-status-card panel">
        <small>Global Status</small>
        <strong>Optimal</strong>
        <p>Operating across all departments.</p>
        <dl>
          <div>
            <dt>Active Appointments</dt>
            <dd>{{ activeAppointments }}</dd>
          </div>
          <div>
            <dt>Room Turnover</dt>
            <dd>12m</dd>
          </div>
          <div>
            <dt>Resource Conflicts</dt>
            <dd>0</dd>
          </div>
        </dl>
        <button type="button">Operational Report</button>
      </article>
    </div>
  </section>
</template>
