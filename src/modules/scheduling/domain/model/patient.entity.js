const fullNameFromUser = (user) => [user?.name, user?.paternalSurname, user?.maternalSurname]
    .filter(Boolean)
    .join(' ')

export class Patient {
    constructor({id = null, userId = null, fullName = '', insuranceProvider = '', user = null}) {
        this.id = id
        this.userId = userId
        this.user = user
        this.fullName = fullName || fullNameFromUser(user)
        this.insuranceProvider = insuranceProvider
    }
}
