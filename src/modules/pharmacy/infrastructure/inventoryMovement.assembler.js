import {InventoryMovement} from "../domain/model/inventoryMovement.entity.js";

export class InventoryMovementAssembler {
    static toEntityFromResource(resource) {
        return new InventoryMovement({...resource});
    }

    static toEntitiesFromResponse(response) {
        if (response.status !== 200) {
            console.error(`${response.status}, ${response.statusText}`);
            return [];
        }

        const resources = response.data instanceof Array
            ? response.data
            : response.data["inventoryMovement"] ?? response.data["inventory-movements"] ?? [];

        return resources.map(resource => this.toEntityFromResource(resource));
    }
}