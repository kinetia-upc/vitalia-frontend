export class Medicine {
    constructor({ id, name, unitQuantity, unitType, price, stock }) {
        this.id = id;
        this.name = name;
        this.unitQuantity = unitQuantity;
        this.unitType = unitType;
        this.price = price;
        this.stock = stock;
    }
}
