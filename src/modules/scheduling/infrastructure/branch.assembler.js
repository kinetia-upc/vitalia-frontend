import { Branch } from '../domain/model/branch.entity.js'

export class BranchAssembler {
    static toEntityFromResource(resource) {
        return new Branch(resource)
    }

    static toEntitiesFromResponse(response) {
        const resources = Array.isArray(response.data)
            ? response.data
            : response.data.schedulingBranches ?? []

        return resources.map((resource) => this.toEntityFromResource(resource))
    }
}