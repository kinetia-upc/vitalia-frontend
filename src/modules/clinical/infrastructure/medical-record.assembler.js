import {MedicalRecord} from "../domain/model/medicalRecord.entity.js";

export class MedicalRecordAssembler {
    static toEntityFromResource(resource) {
        if (!resource) return null;
        return new MedicalRecord({
            id: String(resource.id ?? resource.Id ?? ""),
            appointmentId: resource.appointmentId ?? resource.AppointmentId,
            patientId: resource.patientId ?? resource.PatientId,
            code: resource.code ?? resource.Code ?? "",
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
            : response.data["medicalRecord"] ?? response.data["medicalRecords"] ?? response.data["medical-record"] ?? [];

        return resources.map(resource => this.toEntityFromResource(resource));
    }
}
