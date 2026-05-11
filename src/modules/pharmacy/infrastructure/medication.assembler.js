import {Medication} from "../domain/model/medication.entity.js";

export class MedicationAssembler {
    static toEntityFromResource(resource) {
        return new Medication({...resource});
    }

    static toEntitiesFromResponse(response) {
        if (response.status !== 200) {
            console.error(`${response.status}, ${response.statusText}`);
            return [];
        }

        const resources = response.data instanceof Array
            ? response.data
            : response.data["medication"] ?? response.data["medications"] ?? [];

        return resources.map(resource => this.toEntityFromResource(resource));
    }
}