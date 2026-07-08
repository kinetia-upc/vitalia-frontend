export class Prescription {
    constructor({
        id = null,
        code = "",
        medicalRecordId = null,
        createdAt = null,
        updatedAt = null
    } = {}) {
        this.id = id;
        this.code = code;
        this.medicalRecordId = medicalRecordId;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
