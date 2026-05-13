import { BaseApi } from '../../../shared/infrastructure/base-api.js'
import { BaseEndpoint } from '../../../shared/infrastructure/base-endpoint.js'

const billingClaimsEndpointPath = import.meta.env.VITE_VITALIA_BILLING_CLAIMS_ENDPOINT_PATH ?? '/billing/claims'

export class BillingApi extends BaseApi {
    #claimsEndpoint

    constructor() {
        super()
        this.#claimsEndpoint = new BaseEndpoint(this, billingClaimsEndpointPath)
    }

    getClaims() { return this.#claimsEndpoint.getAll() }
    getClaimById(id) { return this.#claimsEndpoint.getById(id) }
    updateClaim(resource) { return this.#claimsEndpoint.update(resource.id, resource) }
}
