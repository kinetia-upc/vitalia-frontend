import {MedicalOrder} from "../domain/model/medicalOrder.entity.js";

export class MedicalOrderAssembler {
    static toEntityFromResource(resource) {
        if (!resource) return null;
        return new MedicalOrder({
            id: String(resource.id ?? resource.Id ?? ""),
            code: resource.code ?? resource.Code ?? "",
            patientId: resource.patientId ?? resource.PatientId,
            doctorId: resource.doctorId ?? resource.DoctorId,
            appointmentId: resource.appointmentId ?? resource.AppointmentId,
            medicalRecordId: resource.medicalRecordId ?? resource.MedicalRecordId ?? null,
            type: resource.type ?? resource.Type ?? "",
            description: resource.description ?? resource.Description ?? "",
            status: resource.status ?? resource.Status ?? "",
            priority: resource.priority ?? resource.Priority ?? "",
            review: resource.review ?? resource.Review ?? "",
            signed: resource.signed ?? resource.Signed ?? false,
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
            : response.data["value"] ?? response.data["medicalOrder"] ?? response.data["medicalOrders"] ?? [];

        return resources.map(resource => this.toEntityFromResource(resource));
    }
}
