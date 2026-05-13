<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSchedulingStore } from '../../application/scheduling-store.js'

const store = useSchedulingStore()
const { t } = useI18n()
const resourceDialogOpen = ref(false)
const editingAppointment = ref(null)
const adminError = ref('')
const resourceForm = reactive({
  mode: 'availability',
  doctorId: '',
  patientId: '',
  branchId: '',
  date: '2026-05-12',
  startTime: '08:00',
  endTime: '08:30',
  reason: 'General consultation'
})
const HOUR_HEIGHT = 104
const BLOCK_HEIGHT = 48

onMounted(() => {
  if (!store.loaded) store.fetchSchedulingData()
})

const addMinutes = (time, minutes) => {
  const [hours, currentMinutes] = time.split(':').map(Number)
  const date = new Date(2026, 0, 1, hours, currentMinutes + minutes)
  return date.toTimeString().slice(0, 5)
}

const getHour = (time) => Number(time.slice(0, 2))
const getMinuteOffset = (time, startHour) => {
  const [hours, minutes] = time.split(':').map(Number)
  return ((hours - startHour) * 60 + minutes) * (HOUR_HEIGHT / 60)
}

const setDefaultFormValues = () => {
  resourceForm.doctorId = store.doctors[0]?.id ?? ''
  resourceForm.patientId = store.patients[0]?.id ?? ''
  resourceForm.branchId = store.branches[0]?.id ?? ''
  resourceForm.date = '2026-05-12'
  resourceForm.startTime = '08:00'
  resourceForm.endTime = '08:30'
  resourceForm.reason = 'General consultation'
}

const operationColumns = computed(() =>
  store.doctors.map((doctor, index) => {
    const appointments = store.appointmentsWithDetails
      .filter((appointment) => appointment.doctorId === doctor.id && appointment.status !== 'cancelled')
      .map((appointment) => ({
        id: appointment.id,
        type: 'appointment',
        reason: appointment.reason,
        patient: appointment.patient,
        status: appointment.status,
        date: appointment.scheduledAt.slice(0, 10),
        start: appointment.scheduledAt.slice(11, 16),
        appointment
      }))

    const availability = store.slots
      .filter((slot) => slot.doctorId === doctor.id && slot.status === 'available')
      .map((slot) => ({
        id: slot.id,
        type: 'slot',
        reason: 'Available Slot',
        patient: { fullName: `${slot.date} ${slot.startTime}` },
        status: slot.status,
        date: slot.date,
        start: slot.startTime,
        slot
      }))

    const stackByStart = new Map()
    const scheduledItems = [...appointments, ...availability]
      .sort((left, right) => left.start.localeCompare(right.start))
      .map((item) => {
        const stackIndex = stackByStart.get(item.start) ?? 0
        stackByStart.set(item.start, stackIndex + 1)
        return { ...item, stackIndex }
      })

    return {
      title: doctor.fullName,
      subtitle: doctor.specialty,
      appointments: scheduledItems,
      accent: 'cyan'
    }
  })
)

const boardStartHour = computed(() => {
  const hours = operationColumns.value.flatMap((column) =>
    column.appointments.map((appointment) => getHour(appointment.start))
  )

  return Math.min(8, ...hours)
})

const boardEndHour = computed(() => {
  const hours = operationColumns.value.flatMap((column) =>
    column.appointments.map((appointment) => getHour(appointment.start) + 1)
  )

  return Math.max(12, ...hours)
})

const boardContentHeight = computed(() =>
  ((boardEndHour.value - boardStartHour.value) * HOUR_HEIGHT) + 90
)

const timeMarkers = computed(() =>
  Array.from({ length: boardEndHour.value - boardStartHour.value + 1 }, (_, index) => {
    const hour = boardStartHour.value + index
    const displayHour = hour % 12 || 12
    return {
      label: `${String(displayHour).padStart(2, '0')}:00 ${hour >= 12 ? 'PM' : 'AM'}`,
      offset: index * HOUR_HEIGHT
    }
  })
)

const getBlockStyle = (appointment) => ({
  top: `${getMinuteOffset(appointment.start, boardStartHour.value) + (appointment.stackIndex * (BLOCK_HEIGHT + 6))}px`,
  minHeight: `${BLOCK_HEIGHT}px`
})

const activeAppointments = computed(() =>
  store.appointmentsWithDetails.filter((appointment) => !['cancelled', 'released'].includes(appointment.status)).length
)

const resourceConflicts = computed(() =>
  store.slots.filter((slot) => slot.status === 'booked').length - activeAppointments.value
)

const openScheduleResource = () => {
  editingAppointment.value = null
  adminError.value = ''
  setDefaultFormValues()
  resourceForm.mode = 'availability'
  resourceDialogOpen.value = true
}

const openEditAppointment = (appointment) => {
  editingAppointment.value = appointment
  adminError.value = ''
  resourceForm.mode = 'appointment'
  resourceForm.doctorId = appointment.doctorId
  resourceForm.patientId = appointment.patientId
  resourceForm.branchId = appointment.branchId
  resourceForm.date = appointment.scheduledAt.slice(0, 10)
  resourceForm.startTime = appointment.scheduledAt.slice(11, 16)
  resourceForm.endTime = addMinutes(resourceForm.startTime, 30)
  resourceForm.reason = appointment.reason
  resourceDialogOpen.value = true
}

const closeResourceDialog = () => {
  resourceDialogOpen.value = false
  editingAppointment.value = null
}

const saveResource = async () => {
  adminError.value = ''

  try {
    if (editingAppointment.value) {
      await store.updateAppointmentSchedule(editingAppointment.value.id, resourceForm)
    } else if (resourceForm.mode === 'availability') {
      await store.createAvailabilitySlot(resourceForm)
    } else {
      await store.createAppointmentForDoctor(resourceForm)
    }

    closeResourceDialog()
  } catch (error) {
    adminError.value = error.message
  }
}
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
        <button class="primary-action compact-action" type="button" @click="openScheduleResource">+ Schedule Resource</button>
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
        <div class="time-scale" :style="{ minHeight: `${boardContentHeight}px` }">
          <span
            v-for="marker in timeMarkers"
            :key="marker.label"
            :style="{ top: `${marker.offset}px` }"
          >
            {{ marker.label }}
          </span>
        </div>
        <div
          v-for="column in operationColumns"
          :key="column.title"
          class="resource-column"
          :style="{ minHeight: `${boardContentHeight}px` }"
        >
          <article
            v-for="appointment in column.appointments"
            :key="appointment.id"
            class="operation-block"
            :class="[appointment.type, appointment.status]"
            :style="getBlockStyle(appointment)"
          >
            <strong>{{ appointment.reason }}</strong>
            <p>{{ appointment.patient?.fullName || appointment.status }}</p>
            <div class="operation-block-actions">
              <template v-if="appointment.type === 'appointment'">
                <button type="button" @click="openEditAppointment(appointment.appointment)">Edit</button>
                <button type="button" class="danger" @click="store.cancelAppointment(appointment.id)">Cancel</button>
              </template>
              <button
                v-else
                type="button"
                class="danger"
                @click="store.deleteAvailabilitySlot(appointment.id)"
              >
                Remove
              </button>
            </div>
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
            <dd>{{ Math.max(resourceConflicts, 0) }}</dd>
          </div>
        </dl>
        <button type="button">Operational Report</button>
      </article>
    </div>

    <div v-if="resourceDialogOpen" class="modal-backdrop">
      <form class="schedule-dialog panel" @submit.prevent="saveResource">
        <div class="panel-heading">
          <h2>{{ editingAppointment ? 'Edit Appointment' : 'Schedule Resource' }}</h2>
          <button class="text-action" type="button" @click="closeResourceDialog">Close</button>
        </div>

        <label v-if="!editingAppointment">
          Action
          <select v-model="resourceForm.mode">
            <option value="availability">Publish availability</option>
            <option value="appointment">Create appointment</option>
          </select>
        </label>

        <label>
          Doctor
          <select v-model="resourceForm.doctorId" required>
            <option v-for="doctor in store.doctors" :key="doctor.id" :value="doctor.id">
              {{ doctor.fullName }} - {{ doctor.specialty }}
            </option>
          </select>
        </label>

        <label v-if="resourceForm.mode === 'appointment'">
          Patient
          <select v-model="resourceForm.patientId" required>
            <option v-for="patient in store.patients" :key="patient.id" :value="patient.id">
              {{ patient.fullName }}
            </option>
          </select>
        </label>

        <label>
          Branch
          <select v-model="resourceForm.branchId" required>
            <option v-for="branch in store.branches" :key="branch.id" :value="branch.id">
              {{ branch.name }}
            </option>
          </select>
        </label>

        <div class="form-grid">
          <label>
            Date
            <input v-model="resourceForm.date" type="date" required>
          </label>
          <label>
            Start
            <input v-model="resourceForm.startTime" type="time" required>
          </label>
          <label>
            End
            <input v-model="resourceForm.endTime" type="time" required>
          </label>
        </div>

        <label v-if="resourceForm.mode === 'appointment'">
          Reason
          <input v-model="resourceForm.reason" type="text" required>
        </label>

        <p v-if="adminError" class="form-error">{{ adminError }}</p>
        <button class="primary-action compact-action" type="submit">Save</button>
      </form>
    </div>
  </section>
</template>
