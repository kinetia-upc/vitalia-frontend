import { BaseApi } from '../../../shared/infrastructure/base-api.js'
import { BaseEndpoint } from '../../../shared/infrastructure/base-endpoint.js'

const doctorsEndpointPath = import.meta.env.VITE_SCHEDULING_DOCTORS_ENDPOINT_PATH ?? '/scheduling/doctors'
const patientsEndpointPath = import.meta.env.VITE_SCHEDULING_PATIENTS_ENDPOINT_PATH ?? '/scheduling/patients'
const branchesEndpointPath = import.meta.env.VITE_SCHEDULING_BRANCHES_ENDPOINT_PATH ?? '/scheduling/branches'
const slotsEndpointPath = import.meta.env.VITE_SCHEDULING_SLOTS_ENDPOINT_PATH ?? '/scheduling/availability-slots'
const appointmentsEndpointPath = import.meta.env.VITE_SCHEDULING_APPOINTMENTS_ENDPOINT_PATH ?? '/scheduling/appointments'

export class SchedulingApi extends BaseApi {
    constructor() {
        super()
        this.doctors = new BaseEndpoint(this, doctorsEndpointPath)
        this.patients = new BaseEndpoint(this, patientsEndpointPath)
        this.branches = new BaseEndpoint(this, branchesEndpointPath)
        this.slots = new BaseEndpoint(this, slotsEndpointPath)
        this.appointments = new BaseEndpoint(this, appointmentsEndpointPath)
    }

    getDoctors() { return this.doctors.getAll() }
    getPatients() { return this.patients.getAll() }
    getBranches() { return this.branches.getAll() }
    getSlots(params) { return this.slots.getAll(params) }
    getAppointments(params) { return this.appointments.getAll(params) }

    createAppointment(resource) { return this.appointments.create(resource) }
    updateAppointment(id, patch) { return this.appointments.patch(id, patch) }
    updateSlot(id, patch) { return this.slots.patch(id, patch) }
}
