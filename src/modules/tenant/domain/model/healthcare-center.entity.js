export class HealthcareCenter {
    constructor({
        id = null,
        healthcareCenterName = "",
        allianceStartDate = null,
        allianceFinishDate = null,
        rucNumber = null
    } = {}) {
        this.id = id;
        this.healthcareCenterName = healthcareCenterName;
        this.allianceStartDate = allianceStartDate;
        this.allianceFinishDate = allianceFinishDate;
        this.rucNumber = rucNumber;
    }
}
