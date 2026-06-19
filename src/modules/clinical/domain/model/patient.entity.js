export class Patient {
    constructor({
        id = null,
        userId = null,
        insuranceProvider = "",
        policyNumber = "",
        activeThru = null,
        emergencyContactName = "",
        emergencyContactPhone = ""
    } = {}) {
        this.id = id;
        this.userId = userId;
        this.insuranceProvider = insuranceProvider;
        this.policyNumber = policyNumber;
        this.activeThru = activeThru;
        this.emergencyContactName = emergencyContactName;
        this.emergencyContactPhone = emergencyContactPhone;
    }
}
