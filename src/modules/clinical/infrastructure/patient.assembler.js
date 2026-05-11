import {Patient} from "../domain/model/patient.entity.js";

export class PatientAssembler {
    static toEntityFromResource(resource) {
        return new Patient({...resource});
    }

    static toEntitiesFromResponse(response) {
        if (response.status !== 200) {
            console.error(`${response.status}, ${response.statusText}`);
            return [];
        }

        const resources = response.data instanceof Array
            ? response.data
            : response.data["patient"] ?? response.data["patients"] ?? [];

        return resources.map(resource => this.toEntityFromResource(resource));
    }
}
