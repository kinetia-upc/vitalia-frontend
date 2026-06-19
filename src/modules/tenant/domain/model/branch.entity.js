export class Branch {
    constructor({
        id = null,
        healthcareCenterId = null,
        addressId = null,
        branchName = "",
        address = ""
    } = {}) {
        this.id = id;
        this.healthcareCenterId = healthcareCenterId;
        this.addressId = addressId;
        this.branchName = branchName;
        this.address = address;
    }
}
