export class MedicationBatch {
    constructor({
        id = null,
        batch_number = "",
        expiration_date = null,
        available_quantity = 0
    }) {
        this.id = id;
        this.batch_number = batch_number;
        this.expiration_date = expiration_date;
        this.available_quantity = available_quantity;
    }
}