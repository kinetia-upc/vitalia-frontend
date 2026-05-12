export class Doctor {
    constructor({id = null, fullName = '', specialty = '', branchId = ''}) {
        this.id = id
        this.fullName = fullName
        this.specialty = specialty
        this.branchId = branchId
    }
}
