import {Medicine} from "../domain/model/medicine.entity.js";

export class MedicineAssembler {
    static toEntityFromResource(resource) {
        return new Medicine({
            ...resource,
            id: resource.id ?? resource.Id,
            code: resource.code ?? resource.Code ?? "",
            name: resource.name ?? resource.Name ?? "",
            unitQuantity: resource.unitQuantity ?? resource.UnitQuantity ?? resource.unit_quantity ?? 0,
            unitType: resource.unitType ?? resource.UnitType ?? resource.unit_type ?? ""
        });
    }

    static toEntitiesFromResponse(response) {
        if (response.status !== 200) {
            console.error(`${response.status}, ${response.statusText}`);
            return [];
        }

        const resources = response.data instanceof Array
            ? response.data
            : response.data["value"] ?? response.data["medicine"] ?? response.data["medicines"] ?? [];

        return resources.map(resource => this.toEntityFromResource(resource));
    }
}
