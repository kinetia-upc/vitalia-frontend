import { AvailabilitySlot } from '../domain/model/availability-slot.entity.js'

export class AvailabilitySlotAssembler {
    static toEntityFromResource(resource) {
        return new AvailabilitySlot(resource)
    }

    static toEntitiesFromResponse(response) {
        const resources = Array.isArray(response.data)
            ? response.data
            : response.data.schedulingAvailabilitySlots ?? []

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
