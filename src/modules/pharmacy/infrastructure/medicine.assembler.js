import {Medicine} from "../domain/model/medicine.entity.js";

export class MedicineAssembler {
    static toEntityFromResource(resource) {
        return new Medicine({...resource});
    }

    static toEntitiesFromResponse(response) {
        if (response.status !== 200) {
            console.error(`${response.status}, ${response.statusText}`);
            return [];
        }

        const resources = response.data instanceof Array
            ? response.data
            : response.data["medicine"] ?? response.data["medicines"] ?? [];

        return resources.map(resource => this.toEntityFromResource(resource));
    }
}
