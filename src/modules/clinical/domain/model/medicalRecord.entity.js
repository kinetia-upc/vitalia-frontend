export class MedicalRecord {
    constructor({
        id = null,
        appointmentId = null,
        patientId = null,
        code = "",
        createdAt = null,
        updatedAt = null
    } = {}) {
        this.id = id;
        this.appointmentId = appointmentId;
        this.patientId = patientId;
        this.code = code;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
