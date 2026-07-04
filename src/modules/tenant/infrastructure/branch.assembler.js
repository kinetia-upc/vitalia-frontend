import {Branch} from "../domain/model/branch.entity.js";

export class BranchAssembler {
    static toEntityFromResource(resource) {
        return new Branch({
            id: resource.id ?? resource.Id,
            healthcareCenterId: resource.healthcareCenterId ?? resource.HealthcareCenterId,
            branchName: resource.branchName ?? resource.BranchName ?? resource.name ?? resource.Name ?? "",
            address: resource.address ?? resource.Address ?? "",
            diagnosisCatalogSource: resource.diagnosisCatalogSource
                ?? resource.DiagnosisCatalogSource
                ?? "MINSA_CIE10"
        });
    }

    static toEntitiesFromResponse(response) {
        if (response.status !== 200) {
            console.error(`${response.status}, ${response.statusText}`);
            return [];
        }

        const resources = response.data instanceof Array
            ? response.data
            : response.data["value"] ?? response.data["branch"] ?? response.data["branches"] ?? [];

        return resources.map(resource => this.toEntityFromResource(resource));
    }
}
