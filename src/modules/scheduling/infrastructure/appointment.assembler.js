import { Appointment } from '../domain/model/appointment.entity.js'

export class AppointmentAssembler {
    static toEntityFromResource(resource) {
        return new Appointment(resource)
    }

    static toEntitiesFromResponse(response) {
        const resources = Array.isArray(response.data)
            ? response.data
            : response.data.schedulingAppointments ?? []

        return resources.map((resource) => this.toEntityFromResource(resource))
    }

    static toResourceFromEntity(entity) {
        return {
            id: entity.id,
            doctorId: entity.doctorId,
            patientId: entity.patientId,
            branchId: entity.branchId,
            scheduledAt: entity.scheduledAt,
            reason: entity.reason,
            status: entity.status,
            paymentStatus: entity.paymentStatus
        }
    }
}
