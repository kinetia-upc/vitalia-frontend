export class HealthcareCenter {
    constructor({
        id = null,
        code = "",
        Code = "",
        healthcareCenterName = "",
        HealthcareCenterName = "",
        allianceStartDate = null,
        AllianceStartDate = null,
        allianceFinishDate = null,
        AllianceFinishDate = null,
        rucNumber = null,
        RucNumber = null,
        imageUrl = "",
        imageURL = "",
        ImageUrl = "",
        ImageURL = ""
    } = {}) {
        this.id = id;
        this.code = code || Code;
        this.healthcareCenterName = healthcareCenterName || HealthcareCenterName;
        this.allianceStartDate = allianceStartDate ?? AllianceStartDate;
        this.allianceFinishDate = allianceFinishDate ?? AllianceFinishDate;
        this.rucNumber = rucNumber ?? RucNumber;
        this.imageUrl = imageUrl || imageURL || ImageUrl || ImageURL;
    }
}
