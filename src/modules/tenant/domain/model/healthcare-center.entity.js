export class HealthcareCenter {
    constructor({
        id = null,
        code = "",
        healthcareCenterName = "",
        allianceStartDate = null,
        allianceFinishDate = null,
        rucNumber = null
    } = {}) {
        this.id = id;
        this.code = code;
        this.healthcareCenterName = healthcareCenterName;
        this.allianceStartDate = allianceStartDate;
        this.allianceFinishDate = allianceFinishDate;
        this.rucNumber = rucNumber;
    }
}
