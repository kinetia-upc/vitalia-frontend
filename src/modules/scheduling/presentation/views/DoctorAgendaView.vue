<script setup>
import { computed, ref } from 'vue'
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useSchedulingStore } from '../../application/scheduling-store.js'
import useClinicalStore from '../../../clinical/application/clinical.store.js'

const store = useSchedulingStore()
const clinicalStore = useClinicalStore()
const router = useRouter()
const { t } = useI18n()
const LUNCH_TIME = '12:30'

function openAttention(item) {
  router.push({ path: '/patients', query: { openAppointmentId: item.id } })
}

function startAndOpenAttention(item) {
  router.push({ path: '/patients', query: { openAppointmentId: item.id, action: 'start' } })
}

function itemCode(item) {
  if (item.status === 'released' || item.status === 'in-attention') {
    const medicalRecord = clinicalStore.medicalRecords.find((record) => record.appointmentId === item.id)
    if (medicalRecord?.code) return medicalRecord.code
  }
  return item.code
}

const toDateKey = (date) => [
  date.getFullYear(),
  String(date.getMonth() + 1).padStart(2, '0'),
  String(date.getDate()).padStart(2, '0')
].join('-')

const todayDate = toDateKey(new Date())
const selectedDate = ref(todayDate)
const lastSelectedDate = ref(todayDate)
const selectedMonth = ref(todayDate.slice(0, 7))

const selectDate = (date) => {
  if (!date) {
    selectedDate.value = lastSelectedDate.value
    return
  }

  selectedDate.value = date
  lastSelectedDate.value = date
  selectedMonth.value = date.slice(0, 7)
}

const shiftSelectedDate = (amount) => {
  const nextDate = new Date(`${selectedDate.value}T00:00:00`)
  nextDate.setDate(nextDate.getDate() + amount)
  selectDate(toDateKey(nextDate))
}

onMounted(async () => {
  if (!store.loaded) await store.fetchSchedulingData()
  if (!clinicalStore.medicalRecordsLoaded) clinicalStore.fetchMedicalRecords()
  if (!doctorAppointmentsForDate(todayDate).length && firstDateWithAppointments.value) {
    selectDate(firstDateWithAppointments.value)
  }
})

const doctorAppointmentsForDate = (date) =>
  store.doctorAgenda.filter((appointment) => appointment.isScheduledForDate(date))

const firstDateWithAppointments = computed(() => {
    const dates = store.doctorAgenda
        .map(a => a.appointmentDate)
        .filter(Boolean)
        .sort()
    return dates.length ? dates[0] : null
})

const selectedAppointments = computed(() => doctorAppointmentsForDate(selectedDate.value))

const agendaItems = computed(() => {
  const appointments = [...selectedAppointments.value]
    .sort((left, right) => new Date(left.scheduledAt) - new Date(right.scheduledAt))
    .map((appointment) => ({
      ...appointment,
      type: 'appointment'
    }))

  const lunchBreak = {
    id: 'lunch-break',
    type: 'lunch',
    scheduledAt: `${selectedDate.value}T${LUNCH_TIME}:00`
  }

  return [...appointments, lunchBreak]
    .sort((left, right) => new Date(left.scheduledAt) - new Date(right.scheduledAt))
})

const selectedMonthDate = computed(() => {
  const [year, month] = selectedMonth.value.split('-').map(Number)
  return new Date(year, month - 1, 1)
})

const calendarTitle = computed(() =>
  selectedMonthDate.value.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
)

const calendarDays = computed(() => {
  const year = selectedMonthDate.value.getFullYear()
  const month = selectedMonthDate.value.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const blanks = Array.from({ length: firstDay }, (_, index) => ({
    key: `blank-${index}`,
    blank: true
  }))
  const days = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1
    const date = toDateKey(new Date(year, month, day))

    return {
      key: date,
      day,
      date,
      hasAppointments: doctorAppointmentsForDate(date).length > 0
    }
  })

  return [...blanks, ...days]
})

const shiftCalendarMonth = (amount) => {
  const nextMonth = new Date(selectedMonthDate.value)
  nextMonth.setMonth(nextMonth.getMonth() + amount)
  selectedMonth.value = toDateKey(nextMonth).slice(0, 7)
}

const formatTime = (dateValue) => new Date(dateValue).toLocaleTimeString([], {
  hour: '2-digit',
  minute: '2-digit'
})

const formatDate = (dateValue) => new Date(dateValue).toLocaleDateString('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric'
})

const APPOINTMENT_DURATION_MIN = 30
const GRID_PX_PER_HOUR = 128
const GRID_PX_PER_MIN = GRID_PX_PER_HOUR / 60
const GRID_SLOT_MIN = 30
const GRID_MIN_START_HOUR = 7
const GRID_MIN_END_HOUR = 19
const EVENT_HEIGHT_PX = APPOINTMENT_DURATION_MIN * GRID_PX_PER_MIN - 4
const LUNCH_HEIGHT_PX = APPOINTMENT_DURATION_MIN * GRID_PX_PER_MIN - 4

function itemMinutes(dateValue) {
  const date = new Date(dateValue)
  return date.getHours() * 60 + date.getMinutes()
}

const gridStartMinutes = computed(() => {
  const values = agendaItems.value.map((item) => itemMinutes(item.scheduledAt))
  const earliest = Math.min(GRID_MIN_START_HOUR * 60, ...(values.length ? values : [GRID_MIN_START_HOUR * 60]))
  return Math.floor(earliest / GRID_SLOT_MIN) * GRID_SLOT_MIN
})

const gridEndMinutes = computed(() => {
  const values = agendaItems.value.map((item) => {
    const heightPx = item.type === 'lunch' ? LUNCH_HEIGHT_PX : EVENT_HEIGHT_PX
    return itemMinutes(item.scheduledAt) + heightPx / GRID_PX_PER_MIN
  })
  const latest = Math.max(GRID_MIN_END_HOUR * 60, ...(values.length ? values : [GRID_MIN_END_HOUR * 60]))
  return Math.ceil(latest / GRID_SLOT_MIN) * GRID_SLOT_MIN
})

const gridSlots = computed(() => {
  const slots = []
  for (let minutes = gridStartMinutes.value; minutes <= gridEndMinutes.value; minutes += GRID_SLOT_MIN) {
    slots.push(minutes)
  }
  return slots
})

const gridHeightPx = computed(() => (gridEndMinutes.value - gridStartMinutes.value) * GRID_PX_PER_MIN)

function eventStyle(item) {
  const top = (itemMinutes(item.scheduledAt) - gridStartMinutes.value) * GRID_PX_PER_MIN
  const height = item.type === 'lunch' ? LUNCH_HEIGHT_PX : EVENT_HEIGHT_PX
  return { top: `${top}px`, height: `${height}px` }
}

function formatSlotLabel(minutes) {
  const hour = Math.floor(minutes / 60)
  const minute = minutes % 60
  const period = hour < 12 || hour === 24 ? 'AM' : 'PM'
  const displayHour = hour % 12 === 0 ? 12 : hour % 12
  return `${displayHour}:${String(minute).padStart(2, '0')} ${period}`
}
</script>

<template>
  <section class="scheduling-view doctor-agenda-screen">
    <div class="schedule-page-heading">
      <div>
        <h1>{{ t('scheduling.doctorAgenda.title') }}</h1>
        <p>{{ t('scheduling.doctorAgenda.subtitle') }}</p>
      </div>
      <div class="agenda-controls">
        <div class="agenda-date-stepper">
          <button class="date-step-action" type="button" aria-label="Previous day" @click="shiftSelectedDate(-1)">‹</button>
          <input v-model="selectedDate" class="agenda-date-input" type="date" @change="selectDate(selectedDate)">
          <button class="date-step-action" type="button" aria-label="Next day" @click="shiftSelectedDate(1)">›</button>
        </div>
      </div>
    </div>

    <div class="doctor-agenda-layout">
      <article class="agenda-timeline panel">
        <div class="agenda-grid" :style="{ height: `${gridHeightPx}px` }">
          <div class="agenda-grid-hours">
            <div
              v-for="minutes in gridSlots"
              :key="minutes"
              class="agenda-hour-row"
              :style="{ height: `${GRID_PX_PER_HOUR / 2}px` }"
            >
              <span>{{ formatSlotLabel(minutes) }}</span>
            </div>
          </div>

          <div
            class="agenda-grid-events"
            :style="{ backgroundSize: `100% ${GRID_PX_PER_HOUR / 2}px` }"
          >
            <div
              v-for="item in agendaItems"
              :key="item.id"
              class="agenda-event"
              :class="item.type === 'lunch' ? 'lunch' : item.status"
              :style="eventStyle(item)"
            >
              <template v-if="item.type === 'lunch'">
                <span class="agenda-event-lunch-label">Lunch Break - Clinical Staff Lounge</span>
              </template>
              <template v-else>
                <button
                  v-if="item.status === 'released'"
                  class="card-menu card-menu-view"
                  type="button"
                  aria-label="Ver atención"
                  @click="openAttention(item)"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
                <button
                  v-else-if="item.status === 'in-attention'"
                  class="card-menu card-menu-view card-menu-continue"
                  type="button"
                  aria-label="Continuar atención"
                  @click="openAttention(item)"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                  </svg>
                </button>
                <button
                  v-else-if="item.status === 'confirmed'"
                  class="card-menu card-menu-view card-menu-start"
                  type="button"
                  aria-label="Iniciar atención"
                  @click="startAndOpenAttention(item)"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 8v8M8 12h8" />
                  </svg>
                </button>
                <button
                  v-else-if="item.status !== 'scheduled'"
                  class="card-menu"
                  type="button"
                  aria-label="Appointment actions"
                >⋮</button>
                <div class="agenda-event-head">
                  <strong>{{ formatTime(item.scheduledAt) }}</strong>
                  <strong>{{ item.patient?.fullName }}</strong>
                  <span class="app-code agenda-event-code">{{ itemCode(item) }}</span>
                </div>
                <div class="agenda-event-meta">
                  <span class="mini-chip">{{ item.reason }}</span>
                  <div class="doctor-card-actions">
                    <small>{{ item.status }}</small>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </article>

      <aside class="agenda-side">
        <article class="side-panel panel calendar-panel">
          <div class="calendar-heading">
            <button type="button" aria-label="Previous month" @click="shiftCalendarMonth(-1)">‹</button>
            <h2>{{ calendarTitle }}</h2>
            <button type="button" aria-label="Next month" @click="shiftCalendarMonth(1)">›</button>
          </div>
          <div class="calendar-grid" :aria-label="`${calendarTitle} calendar`">
            <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
            <span v-for="day in calendarDays" :key="day.key">
              <button
                v-if="!day.blank"
                type="button"
                :class="{ active: day.date === selectedDate, marked: day.hasAppointments }"
                @click="selectDate(day.date)"
              >
                {{ day.day }}
              </button>
            </span>
          </div>
        </article>
      </aside>
    </div>
  </section>
</template>
