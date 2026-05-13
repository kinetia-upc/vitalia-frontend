export class BillingClaim {
    constructor({ id = null, claimCode = '', insuranceProvider = '', patientName = '', providerName = '', value = 0, clinicalCompliance = '', cycleStatus = '' }) {
        this.id = id
        this.claimCode = claimCode
        this.insuranceProvider = insuranceProvider
        this.patientName = patientName
        this.providerName = providerName
        this.value = value
        this.clinicalCompliance = clinicalCompliance
        this.cycleStatus = cycleStatus
    }

    get isVerified() {
        return this.clinicalCompliance === 'verified'
    }

    get isAuthRequired() {
        return this.cycleStatus === 'Auth Required'
    }
}
