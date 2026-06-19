import { AvailabilitySlot } from '../domain/model/availability-slot.entity.js'

export class AvailabilitySlotAssembler {
    static toEntityFromResource(resource) {
        const normalizedResource = { ...resource }
        if (normalizedResource.startTime && typeof normalizedResource.startTime === 'string') {
            normalizedResource.startTime = normalizedResource.startTime.substring(0, 5)
        }
        if (normalizedResource.endTime && typeof normalizedResource.endTime === 'string') {
            normalizedResource.endTime = normalizedResource.endTime.substring(0, 5)
        }
        if (normalizedResource.status && typeof normalizedResource.status === 'string') {
            normalizedResource.status = normalizedResource.status.toLowerCase()
        }
        return new AvailabilitySlot(normalizedResource)
    }

    static toEntitiesFromResponse(response) {
        const resources = Array.isArray(response.data) ? response.data : []
        return resources.map((resource) => this.toEntityFromResource(resource))
    }

    static toResourceFromEntity(entity) {
        return {
            id: entity.id,
            doctorId: entity.doctorId,
            branchId: entity.branchId,
            date: entity.date,
            startTime: entity.startTime,
            endTime: entity.endTime,
            status: entity.status
        }
    }
}
