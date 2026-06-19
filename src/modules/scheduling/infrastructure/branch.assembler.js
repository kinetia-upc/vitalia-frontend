import { Branch } from '../domain/model/branch.entity.js'

export class BranchAssembler {
    static toEntityFromResource(resource) {
        return new Branch({
            id: resource.id,
            name: resource.branch_name ?? resource.name ?? resource.branchName ?? '',
            description: resource.address ?? resource.description ?? ''
        })
    }

    static toEntitiesFromResponse(response) {
        const resources = Array.isArray(response.data) ? response.data : []
        return resources.map((resource) => this.toEntityFromResource(resource))
    }
}