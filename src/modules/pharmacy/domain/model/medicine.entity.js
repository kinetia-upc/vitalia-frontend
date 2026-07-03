export class Medicine {
    constructor({
        id = null,
        code = "",
        name = "",
        unitQuantity = 0,
        unitType = "",
        price = 0,
        stock = 0,
        branchId = null,
        branchName = ""
    } = {}) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.unitQuantity = unitQuantity;
        this.unitType = unitType;
        this.price = price;
        this.stock = stock;
        this.branchId = branchId;
        this.branchName = branchName;
    }
}
