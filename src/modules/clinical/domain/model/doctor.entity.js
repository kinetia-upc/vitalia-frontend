export class Doctor {
    constructor({id = null, userId = null, licNumber = "", cmpNumber = ""} = {}) {
        this.id = id;
        this.userId = userId;
        this.licNumber = licNumber;
        this.cmpNumber = cmpNumber;
    }
}