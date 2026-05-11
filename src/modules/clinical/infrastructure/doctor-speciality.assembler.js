import {DoctorSpeciality} from "../domain/model/doctor-speciality.entity.js";

export class DoctorSpecialityAssembler {
    static toEntityFromResource(resource) {
        return new DoctorSpeciality({...resource});
    }

    static toEntitiesFromResponse(response) {
        if (response.status !== 200) {
            console.error(`${response.status}, ${response.statusText}`);
            return [];
        }

        const resources = response.data instanceof Array
            ? response.data
            : response.data["doctorSpeciality"] ?? response.data["doctorSpecialities"] ?? response.data["doctor-speciality"] ?? [];

        return resources.map(resource => this.toEntityFromResource(resource));
    }
}
