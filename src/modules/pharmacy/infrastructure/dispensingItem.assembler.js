import {DispensingItem} from "../domain/model/dispensingItem.entity.js";

export class DispensingItemAssembler {
    static toEntityFromResource(resource) {
        return new DispensingItem({...resource});
    }

    static toEntitiesFromResponse(response) {
        if (response.status !== 200) {
            console.error(`${response.status}, ${response.statusText}`);
            return [];
        }

        const resources = response.data instanceof Array
            ? response.data
            : response.data["dispensingItem"] ?? response.data["dispensing-items"] ?? [];

        return resources.map(resource => this.toEntityFromResource(resource));
    }
}