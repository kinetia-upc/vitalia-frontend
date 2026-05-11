export class Patient {
    constructor({
        id = null,
        id_user = null,
        insurance_provider = "",
        policy_number = "",
        active_thru = null,
        emergency_contact_name = "",
        emergency_contact_phone = ""
    }) {
        this.id = id;
        this.id_user = id_user;
        this.insurance_provider = insurance_provider;
        this.policy_number = policy_number;
        this.active_thru = active_thru;
        this.emergency_contact_name = emergency_contact_name;
        this.emergency_contact_phone = emergency_contact_phone;
    }
}
