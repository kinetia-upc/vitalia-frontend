import {MedicationInventory} from "../domain/model/medicationInventory.entity.js";

export class MedicationInventoryAssembler {
    static toEntityFromResource(resource) {
        return new MedicationInventory({...resource});
    }

    static toEntitiesFromResponse(response) {
        if (response.status !== 200) {
            console.error(`${response.status}, ${response.statusText}`);
            return [];
        }

        const resources = response.data instanceof Array
            ? response.data
            : response.data["medicationInventory"] ?? response.data["medication-inventories"] ?? [];

        return resources.map(resource => this.toEntityFromResource(resource));
    }
}