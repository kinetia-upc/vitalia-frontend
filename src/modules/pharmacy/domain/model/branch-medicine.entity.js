export class BranchMedicine {
    constructor({
        branchId = null,
        medicineId = null,
        stock = 0,
        price = 0
    } = {}) {
        this.branchId = branchId;
        this.medicineId = medicineId;
        this.stock = stock;
        this.price = price;
    }
}
