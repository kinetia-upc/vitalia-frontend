<script setup>
import { computed, ref } from 'vue'
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSchedulingStore } from '../../application/scheduling-store.js'

const store = useSchedulingStore()
const { t } = useI18n()
const LUNCH_TIME = '12:30'
const FALLBACK_AGENDA_DATE = '2026-04-24'

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
  if (!doctorAppointmentsForDate(todayDate).length) selectDate(FALLBACK_AGENDA_DATE)
})

const doctorAppointmentsForDate = (date) =>
  store.doctorAgenda.filter((appointment) => appointment.isScheduledForDate(date))

const selectedAppointments = computed(() => doctorAppointmentsForDate(selectedDate.value))

const agendaItems = computed(() => {
  const appointments = [...selectedAppointments.value]
    .sort((left, right) => new Date(left.scheduledAt) - new Date(right.scheduledAt))
    .map((appointment, index) => ({
      ...appointment,
      type: 'appointment',
      accent: index % 2 === 0 ? 'cyan' : 'amber',
      duration: index % 2 === 0 ? '45 mins' : '60 mins',
      room: index % 2 === 0 ? 'Room 302' : 'Urgent Priority'
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
</script>

<template>
  <section class="scheduling-view doctor-agenda-screen">
    <div class="schedule-page-heading">
      <div>
        <h1>{{ t('scheduling.doctorAgenda.title') }}</h1>
        <p>{{ t('scheduling.doctorAgenda.subtitle') }}</p>
      </div>
      <div class="agenda-controls">
        <button class="date-step-action" type="button" aria-label="Previous day" @click="shiftSelectedDate(-1)">‹</button>
        <input v-model="selectedDate" class="agenda-date-input" type="date" @change="selectDate(selectedDate)">
        <button class="date-step-action" type="button" aria-label="Next day" @click="shiftSelectedDate(1)">›</button>
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
