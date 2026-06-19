export class AppointmentFee {
    constructor({
        id = null,
        branchId = null,
        specialityId = null,
        price = 0
    } = {}) {
        this.id = id;
        this.branchId = branchId;
        this.specialityId = specialityId;
        this.price = price;
    }
}
