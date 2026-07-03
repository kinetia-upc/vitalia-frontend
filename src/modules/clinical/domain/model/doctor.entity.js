export class Doctor {
    constructor({id = null, userId = null, code = null, licenseNumber = "", cmpNumber = "", licNumber = ""} = {}) {
        this.id = id ?? userId;
        this.userId = userId ?? id;
        this.code = code;
        this.licNumber = licenseNumber || licNumber;
        this.cmpNumber = cmpNumber;
    }
}