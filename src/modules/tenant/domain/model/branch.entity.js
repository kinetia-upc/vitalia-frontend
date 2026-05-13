export class Branch {
    constructor({
        id = null,
        id_healthcare_center = null,
        id_address = null,
        branch_name = "",
        address = ""
    }) {
        this.id = id;
        this.id_healthcare_center = id_healthcare_center;
        this.id_address = id_address;
        this.branch_name = branch_name;
        this.address = address;
    }
}
