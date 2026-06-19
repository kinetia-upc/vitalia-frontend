export class Prescription {
    constructor({
        id = null,
        medicalRecordId = null,
        createdAt = null,
        updatedAt = null
    } = {}) {
        this.id = id;
        this.medicalRecordId = medicalRecordId;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
