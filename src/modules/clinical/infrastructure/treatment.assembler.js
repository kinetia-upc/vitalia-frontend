import {Treatment} from "../domain/model/treatment.entity.js";

export class TreatmentAssembler {
    static toEntityFromResource(resource) {
        return new Treatment({...resource});
    }

    static toEntitiesFromResponse(response) {
        if (response.status !== 200) {
            console.error(`${response.status}, ${response.statusText}`);
            return [];
        }

        const resources = response.data instanceof Array
            ? response.data
            : response.data["treatment"] ?? response.data["treatments"] ?? [];

        return resources.map(resource => this.toEntityFromResource(resource));
    }
}
