export class MedicalRecord {
    constructor({
        id = null,
        appointmentId = null,
        appointmentCode = null,
        patientId = null,
        code = "",
        createdAt = null,
        updatedAt = null
    } = {}) {
        this.id = id;
        this.appointmentId = appointmentId;
        this.appointmentCode = appointmentCode;
        this.patientId = patientId;
        this.code = code;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
