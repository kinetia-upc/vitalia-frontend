import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { SchedulingApi } from '../infrastructure/scheduling-api.js'
import { AppointmentAssembler } from '../infrastructure/appointment.assembler.js'
import { AvailabilitySlotAssembler } from '../infrastructure/availability-slot.assembler.js'
import { DoctorAssembler } from '../infrastructure/doctor.assembler.js'
import { PatientAssembler } from '../infrastructure/patient.assembler.js'
import { BranchAssembler } from '../infrastructure/branch.assembler.js'
import { Appointment } from '../domain/model/appointment.entity.js'


const api = new SchedulingApi()
const CURRENT_DOCTOR_ID = 'doc-001'
const CURRENT_PATIENT_ID = 'pat-001'
const ACTIVE_STATUSES = ['scheduled', 'confirmed', 'arrived', 'in-attention']
const STARTABLE_STATUSES = ['scheduled', 'confirmed', 'arrived']

const toDateTime = (date, startTime) => `${date}T${startTime}:00`
const toSlotDate = (scheduledAt) => scheduledAt.slice(0, 10)
const toSlotStartTime = (scheduledAt) => scheduledAt.slice(11, 16)

export const useSchedulingStore = defineStore('scheduling', () => {
    const doctors = ref([])
    const patients = ref([])
    const branches = ref([])
    const slots = ref([])
    const appointments = ref([])
    const errors = ref([])
    const loaded = ref(false)
    const loading = ref(false)

    const appointmentsWithDetails = computed(() =>
        appointments.value.map((appointment) => new Appointment({
            ...appointment,
            doctor: doctors.value.find((doctor) => doctor.id === appointment.doctorId),
            patient: patients.value.find((patient) => patient.id === appointment.patientId),
            branch: branches.value.find((branch) => branch.id === appointment.branchId)
        }))
    )


    const doctorAgenda = computed(() =>
        appointmentsWithDetails.value.filter((appointment) => appointment.doctorId === CURRENT_DOCTOR_ID)
    )

    const patientAppointments = computed(() =>
        appointmentsWithDetails.value.filter((appointment) => appointment.patientId === CURRENT_PATIENT_ID)
    )

    const availableSlots = computed(() =>
        slots.value.filter((slot) => slot.status === 'available')
    )

    async function fetchSchedulingData() {
        if (loaded.value || loading.value) return
        loading.value = true

        try {
            const [doctorResponse, patientResponse, branchResponse, slotResponse, appointmentResponse] =
                await Promise.all([
                    api.getDoctors(),
                    api.getPatients(),
                    api.getBranches(),
                    api.getSlots(),
                    api.getAppointments()
                ])

            doctors.value = DoctorAssembler.toEntitiesFromResponse(doctorResponse)
            patients.value = PatientAssembler.toEntitiesFromResponse(patientResponse)
            branches.value = BranchAssembler.toEntitiesFromResponse(branchResponse)
            slots.value = AvailabilitySlotAssembler.toEntitiesFromResponse(slotResponse)
            appointments.value = AppointmentAssembler.toEntitiesFromResponse(appointmentResponse)
            loaded.value = true
        } catch (error) {
            errors.value.push(error)
        } finally {
            loading.value = false
        }
    }

    function findSlotForAppointment(appointment) {
        return slots.value.find((slot) =>
            slot.doctorId === appointment.doctorId &&
            slot.branchId === appointment.branchId &&
            slot.date === toSlotDate(appointment.scheduledAt) &&
            slot.startTime === toSlotStartTime(appointment.scheduledAt)
        )
    }

    function hasDoctorConflict({ doctorId, date, startTime, appointmentId = null, slotId = null }) {
        const scheduledAt = toDateTime(date, startTime)
        const appointmentConflict = appointments.value.some((appointment) =>
            appointment.id !== appointmentId &&
            appointment.doctorId === doctorId &&
            ACTIVE_STATUSES.includes(appointment.status) &&
            appointment.scheduledAt === scheduledAt
        )
        const slotConflict = slots.value.some((slot) =>
            slot.id !== slotId &&
            slot.doctorId === doctorId &&
            slot.date === date &&
            slot.startTime === startTime &&
            slot.status !== 'cancelled'
        )

        return appointmentConflict || slotConflict
    }

    async function setSlotStatus(slot, status) {
        if (!slot || slot.status === status) return

        await api.updateSlot(slot.id, { status })
        slot.status = status
    }

    function canStartAttention(appointment) {
        return appointment && STARTABLE_STATUSES.includes(appointment.status)
    }

    function canReleaseAppointment(appointment) {
        return appointment && ['in-attention', 'arrived'].includes(appointment.status)
    }

    async function reserveAppointment(slot) {
        if (!slot?.isAvailable) return false

        const appointment = new Appointment({
            id: crypto.randomUUID(),
            doctorId: slot.doctorId,
            patientId: CURRENT_PATIENT_ID,
            branchId: slot.branchId,
            scheduledAt: `${slot.date}T${slot.startTime}:00`,
            reason: 'General consultation',
            status: 'scheduled',
            paymentStatus: 'pending'
        })

        const response = await api.createAppointment(
            AppointmentAssembler.toResourceFromEntity(appointment)
        )
        appointments.value.push(AppointmentAssembler.toEntityFromResource(response.data))

        await api.updateSlot(slot.id, { status: 'booked' })
        slot.status = 'booked'
        return true
    }

    async function changeAppointmentStatus(id, status) {
        await api.updateAppointment(id, { status })
        const appointment = appointments.value.find((item) => item.id === id)
        if (appointment) appointment.status = status
    }

    async function cancelAppointment(id) {
        const appointment = appointments.value.find((item) => item.id === id)
        if (!appointment || appointment.status === 'cancelled') return false

        await changeAppointmentStatus(id, 'cancelled')
        await setSlotStatus(findSlotForAppointment(appointment), 'available')
        return true
    }

    async function confirmAppointment(id) {
        await changeAppointmentStatus(id, 'confirmed')
    }

    async function startAttention(id) {
        const appointment = appointments.value.find((item) => item.id === id)
        if (!canStartAttention(appointment)) return false

        await changeAppointmentStatus(id, 'in-attention')
        return true
    }

    async function releaseAppointment(id) {
        const appointment = appointments.value.find((item) => item.id === id)
        if (!canReleaseAppointment(appointment)) return false

        await changeAppointmentStatus(id, 'released')
        await setSlotStatus(findSlotForAppointment(appointment), 'available')
        return true
    }

    async function markPatientArrived(id) {
        const appointment = appointments.value.find((item) => item.id === id)
        if (!appointment || appointment.status !== 'in-attention') return false

        await changeAppointmentStatus(id, 'arrived')
        return true
    }

    async function rescheduleAppointment(id, slot) {
        const appointment = appointments.value.find((item) => item.id === id)
        if (!appointment || !slot?.isAvailable) return false

        const previousSlot = findSlotForAppointment(appointment)
        const patch = {
            doctorId: slot.doctorId,
            branchId: slot.branchId,
            scheduledAt: toDateTime(slot.date, slot.startTime),
            status: 'scheduled'
        }

        const response = await api.updateAppointment(id, patch)
        const updatedAppointment = AppointmentAssembler.toEntityFromResource(response.data)
        const index = appointments.value.findIndex((item) => item.id === id)
        if (index !== -1) appointments.value[index] = updatedAppointment

        await setSlotStatus(previousSlot, 'available')
        await setSlotStatus(slot, 'booked')
        return true
    }

    async function createAvailabilitySlot(payload) {
        const resource = {
            id: crypto.randomUUID(),
            doctorId: payload.doctorId,
            branchId: payload.branchId,
            date: payload.date,
            startTime: payload.startTime,
            endTime: payload.endTime,
            status: 'available'
        }

        if (hasDoctorConflict(resource)) {
            throw new Error('Doctor already has a resource scheduled for that time.')
        }

        const response = await api.createSlot(resource)
        slots.value.push(AvailabilitySlotAssembler.toEntityFromResource(response.data))
    }

    async function createAppointmentForDoctor(payload) {
        const date = payload.date
        const startTime = payload.startTime
        const endTime = payload.endTime

        if (hasDoctorConflict({ doctorId: payload.doctorId, date, startTime })) {
            throw new Error('Doctor already has a resource scheduled for that time.')
        }

        const appointment = new Appointment({
            id: crypto.randomUUID(),
            doctorId: payload.doctorId,
            patientId: payload.patientId,
            branchId: payload.branchId,
            scheduledAt: toDateTime(date, startTime),
            reason: payload.reason || 'General consultation',
            status: 'scheduled',
            paymentStatus: 'pending'
        })
        const slotResource = {
            id: crypto.randomUUID(),
            doctorId: payload.doctorId,
            branchId: payload.branchId,
            date,
            startTime,
            endTime,
            status: 'booked'
        }

        const [appointmentResponse, slotResponse] = await Promise.all([
            api.createAppointment(AppointmentAssembler.toResourceFromEntity(appointment)),
            api.createSlot(slotResource)
        ])

        appointments.value.push(AppointmentAssembler.toEntityFromResource(appointmentResponse.data))
        slots.value.push(AvailabilitySlotAssembler.toEntityFromResource(slotResponse.data))
    }

    async function updateAppointmentSchedule(id, payload) {
        const appointment = appointments.value.find((item) => item.id === id)
        if (!appointment) return false

        if (hasDoctorConflict({
            doctorId: payload.doctorId,
            date: payload.date,
            startTime: payload.startTime,
            appointmentId: id,
            slotId: findSlotForAppointment(appointment)?.id
        })) {
            throw new Error('Doctor already has a resource scheduled for that time.')
        }

        const previousSlot = findSlotForAppointment(appointment)
        const patch = {
            doctorId: payload.doctorId,
            patientId: payload.patientId,
            branchId: payload.branchId,
            scheduledAt: toDateTime(payload.date, payload.startTime),
            reason: payload.reason || appointment.reason,
            status: payload.status || appointment.status
        }
        const response = await api.updateAppointment(id, patch)
        const updatedAppointment = AppointmentAssembler.toEntityFromResource(response.data)
        const index = appointments.value.findIndex((item) => item.id === id)
        if (index !== -1) appointments.value[index] = updatedAppointment

        await setSlotStatus(previousSlot, 'available')

        const matchingSlot = slots.value.find((slot) =>
            slot.doctorId === patch.doctorId &&
            slot.branchId === patch.branchId &&
            slot.date === payload.date &&
            slot.startTime === payload.startTime
        )

        if (matchingSlot) {
            await setSlotStatus(matchingSlot, 'booked')
        } else {
            const slotResponse = await api.createSlot({
                id: crypto.randomUUID(),
                doctorId: patch.doctorId,
                branchId: patch.branchId,
                date: payload.date,
                startTime: payload.startTime,
                endTime: payload.endTime,
                status: 'booked'
            })
            slots.value.push(AvailabilitySlotAssembler.toEntityFromResource(slotResponse.data))
        }

        return true
    }

    async function deleteAvailabilitySlot(id) {
        await api.deleteSlot(id)
        const index = slots.value.findIndex((slot) => slot.id === id)
        if (index !== -1) slots.value.splice(index, 1)
    }

    function getTodayPatientsByDoctor(doctorId, date = new Date()) {
        return appointmentsWithDetails.value.filter((appointment) =>
            appointment.belongsToDoctor(doctorId) &&
            appointment.isScheduledForDate(date) &&
            !appointment.isCancelled
        )
    }


    return {
        doctors,
        patients,
        branches,
        slots,
        appointments,
        appointmentsWithDetails,
        doctorAgenda,
        patientAppointments,
        availableSlots,
        getTodayPatientsByDoctor,
        loaded,
        loading,
        errors,
        fetchSchedulingData,
        reserveAppointment,
        rescheduleAppointment,
        createAvailabilitySlot,
        createAppointmentForDoctor,
        updateAppointmentSchedule,
        deleteAvailabilitySlot,
        cancelAppointment,
        confirmAppointment,
        startAttention,
        releaseAppointment,
        markPatientArrived,
        canStartAttention,
        canReleaseAppointment,
    }
})
