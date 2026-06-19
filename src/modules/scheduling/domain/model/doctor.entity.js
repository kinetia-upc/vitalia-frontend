const fullNameFromUser = (user) => [user?.name, user?.paternalSurname, user?.maternalSurname]
    .filter(Boolean)
    .join(' ')

export class Doctor {
    constructor({id = null, userId = null, fullName = '', specialty = '', branchId = '', user = null}) {
        this.id = id
        this.userId = userId
        this.user = user
        this.fullName = fullName || (user ? `Dr. ${fullNameFromUser(user)}`.trim() : '')
        this.specialty = specialty
        this.branchId = branchId
    }
}
