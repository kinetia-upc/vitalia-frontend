import {Doctor} from "../domain/model/doctor.entity.js";

export class DoctorAssembler {

    static toEntityFromResource(resource) {
        return new Doctor({...resource});
    }

    static toEntitiesFromResponse(response) {
        if (response.status !== 200) {
            console.error(`${response.status}, ${response.statusText}`);
            return [];
        }
        const resources = response.data instanceof Array
            ? response.data
            : response.data["doctor"] ?? response.data["doctors"] ?? [];

        return resources.map(resource => this.toEntityFromResource(resource));
    }
}
