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
        appointmentsWithDetails.value.filter((appointment) => appointment.doctorId === 'doc-001')
    )

    const patientAppointments = computed(() =>
        appointmentsWithDetails.value.filter((appointment) => appointment.patientId === 'pat-001')
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

    async function reserveAppointment(slot) {
        const appointment = new Appointment({
            id: crypto.randomUUID(),
            doctorId: slot.doctorId,
            patientId: 'pat-001',
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
    }

    async function changeAppointmentStatus(id, status) {
        await api.updateAppointment(id, { status })
        const appointment = appointments.value.find((item) => item.id === id)
        if (appointment) appointment.status = status
    }

    async function cancelAppointment(id) {
        await changeAppointmentStatus(id, 'cancelled')
    }

    async function confirmAppointment(id) {
        await changeAppointmentStatus(id, 'confirmed')
    }

    async function startAttention(id) {
        await changeAppointmentStatus(id, 'in-attention')
    }

    async function releaseAppointment(id) {
        await changeAppointmentStatus(id, 'released')
    }

    async function markPatientArrived(id) {
        await changeAppointmentStatus(id, 'arrived')
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
        cancelAppointment,
        confirmAppointment,
        startAttention,
        releaseAppointment,
        markPatientArrived,
    }
})
