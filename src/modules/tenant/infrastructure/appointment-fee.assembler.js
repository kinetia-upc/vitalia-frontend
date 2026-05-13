import {AppointmentFee} from "../domain/model/appointment-fee.entity.js";

export class AppointmentFeeAssembler {
    static toEntityFromResource(resource) {
        return new AppointmentFee({...resource});
    }

    static toEntitiesFromResponse(response) {
        if (response.status !== 200) {
            console.error(`${response.status}, ${response.statusText}`);
            return [];
        }

        const resources = response.data instanceof Array
            ? response.data
            : response.data["appointment_fee"] ?? response.data["appointmentFee"] ?? response.data["appointmentFees"] ?? [];

        return resources.map(resource => this.toEntityFromResource(resource));
    }
}
