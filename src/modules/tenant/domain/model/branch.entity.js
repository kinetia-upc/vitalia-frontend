export class Branch {
    constructor({
        id = null,
        healthcareCenterId = null,
        branchName = "",
        address = ""
    } = {}) {
        this.id = id;
        this.healthcareCenterId = healthcareCenterId;
        this.branchName = branchName;
        this.address = address;
    }
}
