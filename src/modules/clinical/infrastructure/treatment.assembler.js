import {Treatment} from "../domain/model/treatment.entity.js";

export class TreatmentAssembler {
    static toEntityFromResource(resource) {
        if (!resource) return null;
        return new Treatment({
            id: resource.id ?? resource.Id,
            medicalRecordId: resource.medicalRecordId ?? resource.MedicalRecordId,
            description: resource.description ?? resource.Description ?? "",
            createdAt: resource.createdAt ?? resource.CreatedAt ?? null,
            updatedAt: resource.updatedAt ?? resource.UpdatedAt ?? null
        });
    }

    static toEntitiesFromResponse(response) {
        if (response.status !== 200) {
            console.error(`${response.status}, ${response.statusText}`);
            return [];
        }

        const resources = response.data instanceof Array
            ? response.data
            : response.data["treatment"] ?? response.data["treatments"] ?? [];

        return resources.map(resource => this.toEntityFromResource(resource));
    }
}
