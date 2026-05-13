export class StockAlert {
    constructor({
        id = null,
        level = "LOW_STOCK",
        message = "",
        generated_at = null
    }) {
        this.id = id;
        this.level = level;
        this.message = message;
        this.generated_at = generated_at;
    }
}