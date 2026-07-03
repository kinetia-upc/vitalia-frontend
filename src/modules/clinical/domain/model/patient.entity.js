const toEhrCode = (ehrCode, code) => {
    if (ehrCode) return ehrCode;
    const digits = String(code ?? '').replace(/\D/g, '');
    const numericPortion = Number.parseInt(digits || '0', 10);
    return `EHR-${String(numericPortion + 10000).padStart(5, '0')}`;
}

export class Patient {
    constructor({
        id = null,
        userId = null,
        code = null,
        ehrCode = null,
        insuranceProvider = "",
        policyNumber = "",
        activeThru = null,
        emergencyContactName = "",
        emergencyContactPhone = ""
    } = {}) {
        this.id = id ?? userId;
        this.userId = userId ?? id;
        this.code = code;
        this.ehrCode = toEhrCode(ehrCode, code);
        this.insuranceProvider = insuranceProvider;
        this.policyNumber = policyNumber;
        this.activeThru = activeThru;
        this.emergencyContactName = emergencyContactName;
        this.emergencyContactPhone = emergencyContactPhone;
    }
}
