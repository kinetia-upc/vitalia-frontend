import {HealthcareCenter} from "../domain/model/healthcare-center.entity.js";

export class HealthcareCenterAssembler {
    static toEntityFromResource(resource) {
        return new HealthcareCenter({...resource});
    }

    static toEntitiesFromResponse(response) {
        if (response.status !== 200) {
            console.error(`${response.status}, ${response.statusText}`);
            return [];
        }

        const resources = response.data instanceof Array
            ? response.data
            : response.data["healthcare_center"] ?? response.data["healthcareCenter"] ?? response.data["healthcareCenters"] ?? [];

        return resources.map(resource => this.toEntityFromResource(resource));
    }
}
