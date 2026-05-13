export class Prescription {
    constructor({id = null, id_medical_record = null, date = null}) {
        this.id = id;
        this.id_medical_record = id_medical_record;
        this.date = date;
    }
}
