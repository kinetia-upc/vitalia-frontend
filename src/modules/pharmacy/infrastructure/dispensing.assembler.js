import {Dispensing} from "../domain/model/dispensing.entity.js";

export class DispensingAssembler {
    static toEntityFromResource(resource) {
        return new Dispensing({...resource});
    }

    static toEntitiesFromResponse(response) {
        if (response.status !== 200) {
            console.error(`${response.status}, ${response.statusText}`);
            return [];
        }

        const resources = response.data instanceof Array
            ? response.data
            : response.data["dispensing"] ?? response.data["dispensings"] ?? [];

        return resources.map(resource => this.toEntityFromResource(resource));
    }
}