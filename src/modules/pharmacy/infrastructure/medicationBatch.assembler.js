import {MedicationBatch} from "../domain/model/medicationBatch.entity.js";

export class MedicationBatchAssembler {
    static toEntityFromResource(resource) {
        return new MedicationBatch({...resource});
    }

    static toEntitiesFromResponse(response) {
        if (response.status !== 200) {
            console.error(`${response.status}, ${response.statusText}`);
            return [];
        }

        const resources = response.data instanceof Array
            ? response.data
            : response.data["medicationBatch"] ?? response.data["medication-batches"] ?? [];

        return resources.map(resource => this.toEntityFromResource(resource));
    }
}