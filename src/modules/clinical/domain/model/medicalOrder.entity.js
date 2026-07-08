export class MedicalOrder {
    constructor({
        id = null,
        code = "",
        patientId = null,
        doctorId = null,
        appointmentId = null,
        medicalRecordId = null,
        type = "",
        description = "",
        status = "",
        priority = "",
        review = "",
        signed = false,
        createdAt = null,
        updatedAt = null
    } = {}) {
        this.id = id;
        this.code = code;
        this.patientId = patientId;
        this.doctorId = doctorId;
        this.appointmentId = appointmentId;
        this.medicalRecordId = medicalRecordId;
        this.type = type;
        this.description = description;
        this.status = status;
        this.priority = priority;
        this.review = review;
        this.signed = signed;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
