const fullNameFromUser = (user) => [user?.name, user?.paternalSurname, user?.maternalSurname]
    .filter(Boolean)
    .join(' ')

export class Doctor {
    constructor({id = null, userId = null, code = null, fullName = '', specialty = '', branchId = '', user = null}) {
        this.id = id ?? userId
        this.userId = userId ?? id
        this.code = code
        this.user = user
        this.fullName = fullName || (user ? `Dr. ${fullNameFromUser(user)}`.trim() : '')
        this.specialty = specialty
        this.branchId = branchId
    }
}
