import {PrescriptionDetail} from "../domain/model/prescriptionDetail.entity.js";

export class PrescriptionDetailAssembler {
    static toEntityFromResource(resource) {
        if (!resource) return null;
        return new PrescriptionDetail({
            id: resource.id ?? resource.Id,
            prescriptionId: String(resource.prescriptionId ?? resource.PrescriptionId ?? ""),
            medicineId: resource.medicineId ?? resource.MedicineId ?? null,
            medicineName: resource.medicineName ?? resource.MedicineName ?? "",
            doseAmount: resource.doseAmount ?? resource.DoseAmount ?? 0,
            doseUnit: resource.doseUnit ?? resource.DoseUnit ?? "",
            frequency: resource.frequency ?? resource.Frequency ?? "",
            duration: resource.duration ?? resource.Duration ?? "",
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
            : response.data["prescriptionDetail"] ?? response.data["prescriptionDetails"] ?? response.data["prescription-detail"] ?? [];

        return resources.map(resource => this.toEntityFromResource(resource));
    }
}
