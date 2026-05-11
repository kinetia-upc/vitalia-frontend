import {Diagnosis} from "../domain/model/diagnosis.entity.js";

export class DiagnosisAssembler {
    static toEntityFromResource(resource) {
        return new Diagnosis({...resource});
    }

    static toEntitiesFromResponse(response) {
        if (response.status !== 200) {
            console.error(`${response.status}, ${response.statusText}`);
            return [];
        }

        const resources = response.data instanceof Array
            ? response.data
            : response.data["diagnosis"] ?? response.data["diagnoses"] ?? [];

        return resources.map(resource => this.toEntityFromResource(resource));
    }
}
