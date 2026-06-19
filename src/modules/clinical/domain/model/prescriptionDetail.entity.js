export class PrescriptionDetail {
    constructor({
        id = null,
        prescriptionId = null,
        medicineId = null,
        medicineName = "",
        doseAmount = 0,
        doseUnit = "",
        frequency = "",
        duration = "",
        createdAt = null,
        updatedAt = null
    } = {}) {
        this.id = id;
        this.prescriptionId = prescriptionId;
        this.medicineId = medicineId;
        this.medicineName = medicineName;
        this.doseAmount = doseAmount;
        this.doseUnit = doseUnit;
        this.frequency = frequency;
        this.duration = duration;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
