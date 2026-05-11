export class Patient {
    constructor({id = null, fullName = '', insuranceProvider = ''}) {
        this.id = id
        this.fullName = fullName
        this.insuranceProvider = insuranceProvider
    }
}
