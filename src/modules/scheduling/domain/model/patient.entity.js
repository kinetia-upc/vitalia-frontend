const fullNameFromUser = (user) => [user?.name, user?.paternal_surname, user?.maternal_surname]
    .filter(Boolean)
    .join(' ')

export class Patient {
    constructor({id = null, id_user = null, userId = null, fullName = '', insuranceProvider = '', user = null}) {
        this.id = id
        this.id_user = id_user ?? userId
        this.user = user
        this.fullName = fullName || fullNameFromUser(user)
        this.insuranceProvider = insuranceProvider
    }
}
