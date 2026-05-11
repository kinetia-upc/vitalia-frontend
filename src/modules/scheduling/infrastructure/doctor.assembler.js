import { Doctor } from '../domain/model/doctor.entity.js'

export class DoctorAssembler {
    static toEntityFromResource(resource) {
        return new Doctor(resource)
    }

    static toEntitiesFromResponse(response) {
        const resources = Array.isArray(response.data)
            ? response.data
            : response.data.schedulingDoctors ?? []

        return resources.map((resource) => this.toEntityFromResource(resource))
    }
}
