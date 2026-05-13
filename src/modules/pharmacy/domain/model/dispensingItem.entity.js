export class DispensingItem {
    constructor({
        id = null,
        delivered_quantity = 0,
        id_prescription_item = null,
        id_medication = null
    }) {
        this.id = id;
        this.delivered_quantity = delivered_quantity;
        this.id_prescription_item = id_prescription_item;
        this.id_medication = id_medication;
    }
}