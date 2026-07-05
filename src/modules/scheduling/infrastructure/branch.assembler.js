import { Branch } from '../domain/model/branch.entity.js'

export class BranchAssembler {
    static toEntityFromResource(resource) {
        const id = resource.id ?? resource.Id ?? null
        const code = resource.code ?? resource.Code ?? id
        return new Branch({
            id,
            code,
            internalId: id,
            name: resource.branch_name ?? resource.name ?? resource.Name ?? resource.branchName ?? resource.BranchName ?? '',
            description: resource.address ?? resource.Address ?? resource.description ?? ''
        })
    }

    static toEntitiesFromResponse(response) {
        const resources = Array.isArray(response.data) ? response.data : []
        return resources.map((resource) => this.toEntityFromResource(resource))
    }
}
