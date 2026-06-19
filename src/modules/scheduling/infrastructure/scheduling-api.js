import { BaseApi } from '../../../shared/infrastructure/base-api.js'
import { BaseEndpoint } from '../../../shared/infrastructure/base-endpoint.js'

const doctorsEndpointPath = import.meta.env.VITE_VITALIA_DOCTOR_ENDPOINT_PATH ?? '/doctors'
const patientsEndpointPath = import.meta.env.VITE_VITALIA_PATIENT_ENDPOINT_PATH ?? '/patients'
const branchesEndpointPath = import.meta.env.VITE_VITALIA_BRANCH_ENDPOINT_PATH ?? '/branches'
const slotsEndpointPath = import.meta.env.VITE_VITALIA_AVAILABILITY_SLOTS_ENDPOINT_PATH ?? '/availabilitySlots'
const appointmentsEndpointPath = import.meta.env.VITE_VITALIA_APPOINTMENTS_ENDPOINT_PATH ?? '/appointments'
const usersEndpointPath = import.meta.env.VITE_VITALIA_USER_ENDPOINT_PATH ?? '/users'
const specialitiesEndpointPath = import.meta.env.VITE_VITALIA_SPECIALITY_ENDPOINT_PATH ?? '/specialities'
const doctorSpecialitiesEndpointPath = import.meta.env.VITE_VITALIA_DOCTOR_SPECIALITY_ENDPOINT_PATH ?? '/doctorSpecialities'

export class SchedulingApi extends BaseApi {
    constructor() {
        super()
        this.doctors = new BaseEndpoint(this, doctorsEndpointPath)
        this.patients = new BaseEndpoint(this, patientsEndpointPath)
        this.branches = new BaseEndpoint(this, branchesEndpointPath)
        this.slots = new BaseEndpoint(this, slotsEndpointPath)
        this.appointments = new BaseEndpoint(this, appointmentsEndpointPath)
        this.users = new BaseEndpoint(this, usersEndpointPath)
        this.specialities = new BaseEndpoint(this, specialitiesEndpointPath)
        this.doctorSpecialities = new BaseEndpoint(this, doctorSpecialitiesEndpointPath)
    }

    getDoctors() { return this.doctors.getAll() }
    getPatients() { return this.patients.getAll() }
    getBranches() { return this.branches.getAll() }
    getSlots(params) { return this.slots.getAll(params) }
    getAppointments(params) { return this.appointments.getAll(params) }
    getUsers() { return this.users.getAll() }
    getSpecialities() { return this.specialities.getAll() }
    getDoctorSpecialities() { return this.doctorSpecialities.getAll() }

    createDoctor(resource) { return this.doctors.create(resource) }
    createPatient(resource) { return this.patients.create(resource) }
    createAppointment(resource) { return this.appointments.create(resource) }
    createSlot(resource) { return this.slots.create(resource) }
    updateAppointment(id, patch) { return this.appointments.patch(id, patch) }
    updateSlot(id, patch) { return this.slots.patch(id, patch) }
    deleteDoctor(id) { return this.doctors.delete(id) }
    deletePatient(id) { return this.patients.delete(id) }
    deleteSlot(id) { return this.slots.delete(id) }
}
