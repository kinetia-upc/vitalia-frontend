import { Patient } from '../domain/model/patient.entity.js'

export class PatientAssembler {
    static toEntityFromResource(resource) {
        return new Patient(resource)
    }

    static toEntitiesFromResponse(response) {
        const resources = Array.isArray(response.data)
            ? response.data
            : response.data.schedulingPatients ?? []

        return resources.map((resource) => this.toEntityFromResource(resource))
    }
}
