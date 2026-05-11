export class Dispensing {
    constructor({
        id = null,
        date = null,
        status = "PENDING",
        id_prescription = null,
        id_pharmacist = null
    }) {
        this.id = id;
        this.date = date;
        this.status = status;
        this.id_prescription = id_prescription;
        this.id_pharmacist = id_pharmacist;
    }
}