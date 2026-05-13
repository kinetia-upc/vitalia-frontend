export class Medication {
    constructor({
        id = null,
        code = "",
        name = "",
        presentation = "",
        status = "ACTIVE"
    }) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.presentation = presentation;
        this.status = status;
    }
}
