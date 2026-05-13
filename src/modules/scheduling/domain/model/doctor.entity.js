const fullNameFromUser = (user) => [user?.name, user?.paternal_surname, user?.maternal_surname]
    .filter(Boolean)
    .join(' ')

export class Doctor {
    constructor({id = null, id_user = null, userId = null, fullName = '', specialty = '', branchId = '', user = null}) {
        this.id = id
        this.id_user = id_user ?? userId
        this.user = user
        this.fullName = fullName || (user ? `Dr. ${fullNameFromUser(user)}`.trim() : '')
        this.specialty = specialty
        this.branchId = branchId
    }
}
