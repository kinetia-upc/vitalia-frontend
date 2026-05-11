import {MedicalRecord} from "../domain/model/medicalRecord.entity.js";

export class MedicalRecordAssembler {
    static toEntityFromResource(resource) {
        return new MedicalRecord({...resource});
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
