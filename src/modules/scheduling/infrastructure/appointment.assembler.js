import { Appointment } from '../domain/model/appointment.entity.js'

export class AppointmentAssembler {
    static toEntityFromResource(resource) {
        const normalizedResource = { ...resource }
        if (normalizedResource.status && typeof normalizedResource.status === 'string') {
            normalizedResource.status = normalizedResource.status.toLowerCase()
        }
        if (normalizedResource.paymentStatus && typeof normalizedResource.paymentStatus === 'string') {
            normalizedResource.paymentStatus = normalizedResource.paymentStatus.toLowerCase()
        }
        return new Appointment(normalizedResource)
    }

    static toEntitiesFromResponse(response) {
        const resources = Array.isArray(response.data) ? response.data : []
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
