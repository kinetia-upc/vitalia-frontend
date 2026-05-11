export class Treatment {
    constructor({id = null, id_medical_record = null, description = ""}) {
        this.id = id;
        this.id_medical_record = id_medical_record;
        this.description = description;
    }
}
