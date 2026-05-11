<script setup>
import { computed, onMounted, ref } from 'vue'
import { useSchedulingStore } from '../../../scheduling/application/scheduling-store.js'

const doctorId = 'doc-001'
const selectedFilter = ref('all')
const store = useSchedulingStore()

onMounted(() => {
  if (!store.loaded) store.fetchSchedulingData()
})

const filters = [
  { id: 'all', label: 'All Records' },
  { id: 'in-attention', label: 'In Treatment' },
  { id: 'priority', label: 'High Priority' },
  { id: 'confirmed', label: 'Confirmed' }
]

const doctorAppointments = computed(() =>
  store.appointmentsWithDetails.filter((appointment) =>
    appointment.doctorId === doctorId && appointment.status !== 'cancelled'
  )
)

const visibleDate = computed(() => {
  const todaysAppointments = store.getTodayPatientsByDoctor(doctorId)
  if (todaysAppointments.length > 0) return new Date().toISOString().slice(0, 10)

  return doctorAppointments.value[0]?.scheduledAt.slice(0, 10) ?? new Date().toISOString().slice(0, 10)
})

const openClinicalRecords = computed(() => {
  const records = doctorAppointments.value
    .filter((appointment) => appointment.scheduledAt.slice(0, 10) === visibleDate.value)
    .map((appointment, index) => ({
      id: `hce-${appointment.id}`,
      appointmentId: appointment.id,
      patientId: appointment.patient?.id ?? appointment.patientId,
      patientName: appointment.patient?.fullName ?? 'Unassigned patient',
      patientCode: `HCE-${String(index + 2148).padStart(5, '0')}`,
      appointmentTime: appointment.scheduledAt,
      reason: appointment.reason,
      status: appointment.status,
      branch: appointment.branch?.name ?? 'Main Medical Plaza',
      priority: index === 1 ? 'High priority' : 'Open HCE',
      trace: [45, 58, 62, 72, 84, 92].map((value) => Math.max(20, value - index * 8)),
      accent: index % 3
    }))

  if (selectedFilter.value === 'all') return records
  if (selectedFilter.value === 'priority') return records.filter((record) => record.priority === 'High priority')
  return records.filter((record) => record.status === selectedFilter.value)
})

const totalOpenRecords = computed(() =>
  doctorAppointments.value.filter((appointment) => appointment.scheduledAt.slice(0, 10) === visibleDate.value).length
)

const formatDate = (dateValue) => new Date(`${dateValue}T00:00:00`).toLocaleDateString('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric'
})

const formatTime = (dateValue) => new Date(dateValue).toLocaleTimeString([], {
  hour: '2-digit',
  minute: '2-digit'
})

const statusLabel = (status) => ({
  confirmed: 'Confirmed',
  scheduled: 'Scheduled',
  arrived: 'Arrived',
  'in-attention': 'In treatment',
  released: 'Released'
}[status] ?? status)
</script>

<template>
  <section class="clinical-records-view">
    <div class="clinical-records-toolbar">
      <div>
        <span class="clinical-eyebrow">Search patient database</span>
        <label class="clinical-search">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.5 4a6.5 6.5 0 0 1 5.2 10.4l4 4-1.4 1.4-4-4A6.5 6.5 0 1 1 10.5 4Zm0 2a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z"/></svg>
          <input type="search" placeholder="Search by name, HCE, appointment, or clinical condition..." />
        </label>
      </div>

      <div class="clinical-sort">
        <span class="clinical-eyebrow">Appointment day</span>
        <button type="button">{{ formatDate(visibleDate) }}</button>
      </div>
    </div>

    <div class="clinical-filter-strip" aria-label="Clinical record filters">
      <button
        v-for="filter in filters"
        :key="filter.id"
        type="button"
        :class="{ active: selectedFilter === filter.id }"
        @click="selectedFilter = filter.id"
      >
        {{ filter.label }}
      </button>
    </div>

    <div class="clinical-record-list">
      <article
        v-for="record in openClinicalRecords"
        :key="record.id"
        class="clinical-record-card"
      >
        <div class="record-avatar" :class="`tone-${record.accent}`">
          {{ record.patientName.split(' ').map(part => part[0]).join('').slice(0, 2) }}
        </div>

        <div class="record-main">
          <strong>{{ record.patientName }}</strong>
          <span>{{ record.patientCode }} - {{ record.reason }}</span>
        </div>

        <div class="record-meta">
          <small>Appointment</small>
          <span>{{ formatTime(record.appointmentTime) }}</span>
        </div>

        <div class="record-meta">
          <small>Status</small>
          <span class="record-status" :class="record.status">{{ statusLabel(record.status) }}</span>
        </div>

        <div class="vital-trace">
          <small>Vital trace</small>
          <div>
            <i v-for="(bar, index) in record.trace" :key="index" :style="{ height: `${bar}%` }"></i>
          </div>
        </div>

        <div class="record-actions">
          <button type="button" aria-label="View HCE">
            <svg viewBox="0 0 24 24"><path d="M12 5c5.2 0 8.6 5.1 8.8 5.4l.4.6-.4.6C20.6 11.9 17.2 17 12 17s-8.6-5.1-8.8-5.4L2.8 11l.4-.6C3.4 10.1 6.8 5 12 5Zm0 2c-3.2 0-5.6 2.6-6.7 4 1.1 1.4 3.5 4 6.7 4s5.6-2.6 6.7-4C17.6 9.6 15.2 7 12 7Zm0 1.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z"/></svg>
          </button>
          <button type="button" aria-label="Edit HCE">
            <svg viewBox="0 0 24 24"><path d="m16.9 3.7 3.4 3.4-10 10-4.3.9.9-4.3 10-10Zm-8.2 10.9-.2 1 1-.2 8-8-1-1-7.8 8.2ZM5 20h14v2H5v-2Z"/></svg>
          </button>
          <button type="button" aria-label="Open appointment">
            <svg viewBox="0 0 24 24"><path d="M6 3h9l4 4v14H6V3Zm2 2v14h9V8h-3V5H8Zm2 6h5v2h-5v-2Zm0 4h5v2h-5v-2Z"/></svg>
          </button>
        </div>
      </article>

      <article v-if="!openClinicalRecords.length" class="clinical-empty-card">
        <strong>No open HCE records for this filter.</strong>
        <p>Try another status or confirm the doctor's appointments for the selected day.</p>
      </article>
    </div>

    <footer class="clinical-record-footer">
      <span>Showing {{ openClinicalRecords.length }} of {{ totalOpenRecords }} open HCE records</span>
      <div class="clinical-pagination" aria-label="Clinical records pages">
        <button type="button">&lt;</button>
        <button type="button" class="active">1</button>
        <button type="button">2</button>
        <button type="button">3</button>
        <button type="button">&gt;</button>
      </div>
    </footer>
  </section>
</template>
