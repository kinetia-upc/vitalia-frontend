export class MedicalRecord {
    constructor({id = null, id_appointment = null, id_patient = null, code = "", updated_at = null}) {
        this.id = id;
        this.id_appointment = id_appointment;
        this.id_patient = id_patient;
        this.code = code;
        this.updated_at = updated_at;
    }
}
