export class AppointmentFee {
    constructor({
        id = null,
        id_branch = null,
        id_speciality = null,
        price = 0
    }) {
        this.id = id;
        this.id_branch = id_branch;
        this.id_speciality = id_speciality;
        this.price = price;
    }
}
