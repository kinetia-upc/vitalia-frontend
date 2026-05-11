import {Speciality} from "../domain/model/speciality.entity.js";

export class SpecialityAssembler {
    static toEntityFromResource(resource) {
        return new Speciality({...resource});
    }

    static toEntitiesFromResponse(response) {
        if (response.status !== 200) {
            console.error(`${response.status}, ${response.statusText}`);
            return [];
        }

        const resources = response.data instanceof Array
            ? response.data
            : response.data["speciality"] ?? response.data["specialities"] ?? [];

        return resources.map(resource => this.toEntityFromResource(resource));
    }
}
