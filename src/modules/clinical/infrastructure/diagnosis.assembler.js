import {Diagnosis} from "../domain/model/diagnosis.entity.js";

export class DiagnosisAssembler {
    static toEntityFromResource(resource) {
        if (!resource) return null;
        return new Diagnosis({
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
            : response.data["diagnosis"] ?? response.data["diagnoses"] ?? [];

        return resources.map(resource => this.toEntityFromResource(resource));
    }
}
