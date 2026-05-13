import { BillingClaim } from '../domain/model/billing-claim.entity.js'

export class BillingClaimAssembler {
    static toEntityFromResource(resource) {
        return new BillingClaim(resource)
    }

    static toEntitiesFromResponse(response) {
        const resources = Array.isArray(response.data)
            ? response.data
            : response.data.billingClaims ?? []
        return resources.map((resource) => this.toEntityFromResource(resource))
    }

    static toResourceFromEntity(entity) {
        return {
            id: entity.id,
            claimCode: entity.claimCode,
            insuranceProvider: entity.insuranceProvider,
            patientName: entity.patientName,
            providerName: entity.providerName,
            value: entity.value,
            clinicalCompliance: entity.clinicalCompliance,
            cycleStatus: entity.cycleStatus
        }
    }
}
