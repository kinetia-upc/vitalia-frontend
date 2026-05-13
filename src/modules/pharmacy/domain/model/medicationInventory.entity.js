export class MedicationInventory {
    constructor({
        id = null,
        id_branch = null,
        current_stock = 0,
        minimum_stock = 0,
        location = ""
    }) {
        this.id = id;
        this.id_branch = id_branch;
        this.current_stock = current_stock;
        this.minimum_stock = minimum_stock;
        this.location = location;
    }
}
