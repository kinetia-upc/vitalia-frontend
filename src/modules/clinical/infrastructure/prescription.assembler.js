import {Prescription} from "../domain/model/prescription.entity.js";

export class PrescriptionAssembler {
    static toEntityFromResource(resource) {
        return new Prescription({...resource});
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
