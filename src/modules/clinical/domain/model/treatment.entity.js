export class Treatment {
    constructor({
        id = null,
        medicalRecordId = null,
        description = "",
        createdAt = null,
        updatedAt = null
    } = {}) {
        this.id = id;
        this.medicalRecordId = medicalRecordId;
        this.description = description;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
