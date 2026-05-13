export class Doctor {
    constructor({id = null, id_user = null, lic_number = "", cmp_number = ""}) {
        this.id = id;
        this.id_user = id_user;
        this.lic_number = lic_number;
        this.cmp_number = cmp_number;
    }
}