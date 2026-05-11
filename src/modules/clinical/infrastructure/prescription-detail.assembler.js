import {PrescriptionDetail} from "../domain/model/prescriptionDetail.entity.js";

export class PrescriptionDetailAssembler {
    static toEntityFromResource(resource) {
        return new PrescriptionDetail({...resource});
    }

    static toEntitiesFromResponse(response) {
        if (response.status !== 200) {
            console.error(`${response.status}, ${response.statusText}`);
            return [];
        }

        const resources = response.data instanceof Array
            ? response.data
            : response.data["prescriptionDetail"] ?? response.data["prescriptionDetails"] ?? response.data["prescription-detail"] ?? [];

        return resources.map(resource => this.toEntityFromResource(resource));
    }
}
