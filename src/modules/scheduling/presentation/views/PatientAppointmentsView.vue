<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSchedulingStore } from '../../application/scheduling-store.js'
import BillingPaymentPopup from '../../../billing/presentation/components/BillingPaymentPopup.vue'

const props = defineProps({
  openBookingOnEnter: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['booking-intent-consumed'])

const store = useSchedulingStore()
const { t } = useI18n()
const reschedulingAppointment = ref(null)
const bookingDialogOpen = ref(false)
const bookingDoctorId = ref('')
const payingAppointmentId = ref(null)

function openBookingDialog() {
  bookingDoctorId.value = store.doctors[0]?.id ?? ''
  bookingDialogOpen.value = true
}

async function reserveSlot(slot) {
  await store.reserveAppointment(slot)
  bookingDialogOpen.value = false
}

onMounted(() => {
  if (!store.loaded) store.fetchSchedulingData()
})

watch(
  () => props.openBookingOnEnter,
  (shouldOpen) => {
    if (!shouldOpen) return
    openBookingDialog()
    emit('booking-intent-consumed')
  },
  { immediate: true }
)

watch(
  () => store.doctors,
  (doctors) => {
    if (!bookingDialogOpen.value || bookingDoctorId.value || !doctors.length) return
    bookingDoctorId.value = doctors[0].id
  },
  { deep: true }
)

const closedStatuses = ['cancelled', 'released']
const sortedPatientAppointments = computed(() =>
  [...store.patientAppointments].sort((left, right) => new Date(left.scheduledAt) - new Date(right.scheduledAt))
)
const nextAppointment = computed(() =>
  sortedPatientAppointments.value.find((appointment) => !closedStatuses.includes(appointment.status))
)
const allUpcomingAppointments = computed(() => sortedPatientAppointments.value)

const pageSize = ref(10)
const currentPage = ref(1)
const pageSizeOptions = [5, 10, 20, 50]

const totalPages = computed(() => Math.ceil(allUpcomingAppointments.value.length / pageSize.value))

const paginatedAppointments = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return allUpcomingAppointments.value.slice(start, start + pageSize.value)
})

const paginationLabel = computed(() => {
  const total = allUpcomingAppointments.value.length
  if (!total) return t('scheduling.patientAppointments.noAppointments')
  const start = (currentPage.value - 1) * pageSize.value + 1
  const end = Math.min(currentPage.value * pageSize.value, total)
  return t('scheduling.patientAppointments.paginationOf', { start, end, total })
})

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) currentPage.value = page
}

const onPageSizeChange = () => { currentPage.value = 1 }

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

const openPayDialog = (id) => {
  payingAppointmentId.value = id
}

const handlePaid = async (appointmentId) => {
  await store.payAppointment(appointmentId)
  await new Promise(resolve => setTimeout(resolve, 1400))
  payingAppointmentId.value = null
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
          <div class="next-card-pills">
            <span class="pill-label">{{ t('scheduling.patientAppointments.nextVisit') }}</span>
            <span v-if="nextAppointment.paymentStatus === 'paid'" class="pill-label pill-paid">✓ PAID</span>
          </div>
          <h2>{{ nextAppointment.doctor?.fullName }}</h2>
          <p>{{ nextAppointment.doctor?.specialty }} - {{ nextAppointment.branch?.description }}</p>
          <div class="appointment-actions">
            <button type="button" class="ghost-action">{{ t('scheduling.patientAppointments.viewDetails') }}</button>
            <button type="button" class="ghost-action" @click="openReschedule(nextAppointment)">
              {{ t('scheduling.patientAppointments.reschedule') }}
            </button>
            <button type="button" class="danger-action" @click="store.cancelAppointment(nextAppointment.id)">
              {{ t('scheduling.patientAppointments.cancel') }}
            </button>
            <button
              v-if="nextAppointment.paymentStatus === 'pending'"
              type="button"
              class="pay-action"
              @click="openPayDialog(nextAppointment.id)"
            >
              {{ t('scheduling.patientAppointments.pay') }}
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
      <div class="upcoming-panel-header">
        <h2>{{ t('scheduling.patientAppointments.upcomingAppointments') }}</h2>
        <div class="upcoming-page-size">
          <label>{{ t('scheduling.patientAppointments.show') }}
            <select v-model="pageSize" @change="onPageSizeChange">
              <option v-for="n in pageSizeOptions" :key="n" :value="n">{{ n }}</option>
            </select>
          </label>
        </div>
      </div>
      <div class="patient-appointment-list">
        <div v-for="appointment in paginatedAppointments" :key="appointment.id" class="patient-appointment-row">
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
            <small>{{ t('scheduling.patientAppointments.clinic') }}</small>
            <p>{{ appointment.branch?.name }}</p>
          </div>
          <div class="patient-row-actions">
            <button
              type="button"
              :disabled="!canManageAppointment(appointment)"
              @click="openReschedule(appointment)"
            >
              {{ t('scheduling.patientAppointments.reschedule') }}
            </button>
            <button
              type="button"
              class="danger"
              :disabled="!canManageAppointment(appointment)"
              @click="store.cancelAppointment(appointment.id)"
            >
              {{ t('scheduling.patientAppointments.cancel') }}
            </button>
            <button
              v-if="appointment.paymentStatus === 'pending' && canManageAppointment(appointment)"
              type="button"
              class="pay"
              @click="openPayDialog(appointment.id)"
            >
              {{ t('scheduling.patientAppointments.pay') }}
            </button>
          </div>
          <div class="appointment-badges">
            <span v-if="appointment.paymentStatus === 'paid'" class="status paid">{{ t('scheduling.patientAppointments.paidBadge') }}</span>
            <span v-else :class="`status ${appointment.status}`">{{ appointment.status }}</span>
          </div>
          <button type="button" class="chevron-button" aria-label="Open appointment">›</button>
        </div>
      </div>

      <div class="upcoming-pagination" v-if="totalPages > 1">
        <span class="pagination-label">{{ paginationLabel }}</span>
        <div class="pagination-controls">
          <button type="button" class="page-nav" :disabled="currentPage <= 1" @click="goToPage(currentPage - 1)">‹</button>
          <button
            v-for="page in totalPages"
            :key="page"
            type="button"
            class="page-btn"
            :class="{ active: page === currentPage }"
            @click="goToPage(page)"
          >{{ page }}</button>
          <button type="button" class="page-nav" :disabled="currentPage >= totalPages" @click="goToPage(currentPage + 1)">›</button>
        </div>
      </div>
    </article>

    <BillingPaymentPopup
      v-if="payingAppointmentId"
      :appointmentId="payingAppointmentId"
      @paid="handlePaid"
      @close="payingAppointmentId = null"
    />

    <div v-if="bookingDialogOpen" class="modal-backdrop" @click.self="bookingDialogOpen = false">
      <article class="schedule-dialog panel">
        <div class="panel-heading">
          <h2>{{ t('scheduling.patientAppointments.bookNew') }}</h2>
          <button class="text-action" type="button" @click="bookingDialogOpen = false">{{ t('scheduling.patientAppointments.close') }}</button>
        </div>

        <label>
          {{ t('scheduling.patientAppointments.doctor') }}
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
        <p v-else class="form-error">{{ t('scheduling.patientAppointments.noSlots') }}</p>
      </article>
    </div>

    <div v-if="reschedulingAppointment" class="modal-backdrop" @click.self="reschedulingAppointment = null">
      <article class="schedule-dialog panel">
        <div class="panel-heading">
          <h2>{{ t('scheduling.patientAppointments.rescheduleTitle') }}</h2>
          <button class="text-action" type="button" @click="reschedulingAppointment = null">{{ t('scheduling.patientAppointments.close') }}</button>
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
        <p v-else class="form-error">{{ t('scheduling.patientAppointments.noSlotsReschedule') }}</p>
      </article>
    </div>
  </section>
</template>
