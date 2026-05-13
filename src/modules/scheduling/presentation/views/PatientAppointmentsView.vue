<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSchedulingStore } from '../../application/scheduling-store.js'

const store = useSchedulingStore()
const { t } = useI18n()
const reschedulingAppointment = ref(null)
const bookingDialogOpen = ref(false)
const bookingDoctorId = ref('')

onMounted(() => {
  if (!store.loaded) store.fetchSchedulingData()
})

const closedStatuses = ['cancelled', 'released']
const sortedPatientAppointments = computed(() =>
  [...store.patientAppointments].sort((left, right) => new Date(left.scheduledAt) - new Date(right.scheduledAt))
)
const nextAppointment = computed(() =>
  sortedPatientAppointments.value.find((appointment) => !closedStatuses.includes(appointment.status))
)
const upcomingAppointments = computed(() =>
  sortedPatientAppointments.value.filter((appointment) => appointment.id !== nextAppointment.value?.id)
)
const rescheduleSlots = computed(() => store.availableSlots)
const bookingSlots = computed(() =>
  store.availableSlots.filter((slot) => slot.doctorId === bookingDoctorId.value)
)

const canManageAppointment = (appointment) => appointment && !closedStatuses.includes(appointment.status)
const openReschedule = (appointment) => {
  if (!canManageAppointment(appointment)) return
  reschedulingAppointment.value = appointment
}

const rescheduleTo = async (slot) => {
  if (!reschedulingAppointment.value) return
  await store.rescheduleAppointment(reschedulingAppointment.value.id, slot)
  reschedulingAppointment.value = null
}

const openBookingDialog = () => {
  bookingDoctorId.value = store.doctors[0]?.id ?? ''
  bookingDialogOpen.value = true
}

const reserveSlot = async (slot) => {
  await store.reserveAppointment(slot)
  bookingDialogOpen.value = false
}

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
      <button class="primary-action compact-action" type="button" @click="openBookingDialog">
        {{ t('scheduling.patientAppointments.bookNew') }}
      </button>
    </div>

    <div class="patient-appointment-layout">
      <article class="patient-next-card" v-if="nextAppointment">
        <div>
          <span class="pill-label">{{ t('scheduling.patientAppointments.nextVisit') }}</span>
          <h2>{{ nextAppointment.doctor?.fullName }}</h2>
          <p>{{ nextAppointment.doctor?.specialty }} - {{ nextAppointment.branch?.description }}</p>
          <div class="appointment-actions">
            <button type="button" class="ghost-action">{{ t('scheduling.patientAppointments.viewDetails') }}</button>
            <button type="button" class="ghost-action" @click="openReschedule(nextAppointment)">
              Reschedule
            </button>
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
          <div class="patient-row-actions">
            <button
              type="button"
              :disabled="!canManageAppointment(appointment)"
              @click="openReschedule(appointment)"
            >
              Reschedule
            </button>
            <button
              type="button"
              class="danger"
              :disabled="!canManageAppointment(appointment)"
              @click="store.cancelAppointment(appointment.id)"
            >
              {{ t('scheduling.patientAppointments.cancel') }}
            </button>
          </div>
          <span :class="`status ${appointment.status}`">{{ appointment.status }}</span>
          <button type="button" class="chevron-button" aria-label="Open appointment">›</button>
        </div>
      </div>

    </article>

    <div v-if="bookingDialogOpen" class="modal-backdrop">
      <article class="schedule-dialog panel">
        <div class="panel-heading">
          <h2>{{ t('scheduling.patientAppointments.bookNew') }}</h2>
          <button class="text-action" type="button" @click="bookingDialogOpen = false">Close</button>
        </div>

        <label>
          Doctor
          <select v-model="bookingDoctorId">
            <option v-for="doctor in store.doctors" :key="doctor.id" :value="doctor.id">
              {{ doctor.fullName }} - {{ doctor.specialty }}
            </option>
          </select>
        </label>

        <div class="reschedule-slot-list" v-if="bookingSlots.length">
          <button
            v-for="slot in bookingSlots"
            :key="slot.id"
            type="button"
            @click="reserveSlot(slot)"
          >
            {{ slot.date }} • {{ slot.startTime }} - {{ slot.endTime }}
          </button>
        </div>
        <p v-else class="form-error">No available slots for this doctor.</p>
      </article>
    </div>

    <div v-if="reschedulingAppointment" class="modal-backdrop">
      <article class="schedule-dialog panel">
        <div class="panel-heading">
          <h2>Reschedule Appointment</h2>
          <button class="text-action" type="button" @click="reschedulingAppointment = null">Close</button>
        </div>
        <div class="reschedule-slot-list" v-if="rescheduleSlots.length">
          <button
            v-for="slot in rescheduleSlots"
            :key="slot.id"
            type="button"
            @click="rescheduleTo(slot)"
          >
            {{ slot.date }} • {{ slot.startTime }} - {{ slot.endTime }}
          </button>
        </div>
        <p v-else class="form-error">No available slots to reschedule.</p>
      </article>
    </div>
  </section>
</template>
