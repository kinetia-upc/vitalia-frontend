export class BillingClaim {
    constructor({ id = null, claimCode = '', appointmentId = null, insuranceProvider = '', patientName = '', providerName = '', value = 0, clinicalCompliance = '', cycleStatus = '' }) {
        this.id = id
        this.claimCode = claimCode
        this.appointmentId = appointmentId
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

}
