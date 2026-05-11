export class InventoryMovement {
    constructor({
        id = null,
        type = "INBOUND",
        quantity = 0,
        date = null,
        reason = ""
    }) {
        this.id = id;
        this.type = type;
        this.quantity = quantity;
        this.date = date;
        this.reason = reason;
    }
}