const fullNameFromUser = (user) => [user?.name, user?.paternalSurname, user?.maternalSurname]
    .filter(Boolean)
    .join(' ')

const toEhrCode = (ehrCode, code) => {
    if (ehrCode) return ehrCode
    const digits = String(code ?? '').replace(/\D/g, '')
    const numericPortion = Number.parseInt(digits || '0', 10)
    return `EHR-${String(numericPortion + 10000).padStart(5, '0')}`
}

export class Patient {
    constructor({id = null, userId = null, code = null, ehrCode = null, fullName = '', insuranceProvider = '', user = null}) {
        this.id = id ?? userId
        this.userId = userId ?? id
        this.code = code
        this.ehrCode = toEhrCode(ehrCode, code)
        this.user = user
        this.fullName = fullName || fullNameFromUser(user)
        this.insuranceProvider = insuranceProvider
    }
}
