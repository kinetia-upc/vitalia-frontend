import {Prescription} from "../domain/model/prescription.entity.js";

export class PrescriptionAssembler {
    static toEntityFromResource(resource) {
        if (!resource) return null;
        return new Prescription({
            id: String(resource.id ?? resource.Id ?? ""),
            medicalRecordId: resource.medicalRecordId ?? resource.MedicalRecordId,
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
            : response.data["prescription"] ?? response.data["prescriptions"] ?? [];

        return resources.map(resource => this.toEntityFromResource(resource));
    }
}
