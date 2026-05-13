import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { BillingApi } from '../infrastructure/billing-api.js'
import { BillingClaimAssembler } from '../infrastructure/billing-claim.assembler.js'

const billingApi = new BillingApi()

export const useBillingStore = defineStore('billing', () => {
    const claims = ref([])
    const errors = ref([])
    const claimsLoaded = ref(false)

    const claimsCount = computed(() => claimsLoaded.value ? claims.value.length : 0)

    const totalRevenueCycle = computed(() =>
        claims.value.reduce((sum, c) => sum + (c.value || 0), 0)
    )

    const complianceScore = computed(() => {
        if (!claims.value.length) return 0
        const verified = claims.value.filter(c => c.clinicalCompliance === 'verified').length
        return Math.round((verified / claims.value.length) * 100 * 10) / 10
    })

    const pendingAuthCount = computed(() =>
        claims.value.filter(c => c.cycleStatus === 'Auth Required').length
    )

    function pushError(error) {
        errors.value.push(error)
    }

    function fetchClaims() {
        billingApi.getClaims().then(response => {
            claims.value = BillingClaimAssembler.toEntitiesFromResponse(response)
            claimsLoaded.value = true
        }).catch(pushError)
    }

    function getClaimById(id) {
        return claims.value.find(c => c.id === id)
    }

    async function authorizeClaim(claimId) {
        const claim = getClaimById(claimId)
        if (!claim) return
        try {
            const resource = BillingClaimAssembler.toResourceFromEntity(claim)
            resource.cycleStatus = 'In Clearinghouse'
            const response = await billingApi.updateClaim(resource)
            const updated = BillingClaimAssembler.toEntityFromResource(response.data)
            const index = claims.value.findIndex(c => c.id === claimId)
            if (index !== -1) claims.value[index] = updated
        } catch (error) {
            pushError(error)
        }
    }

    return {
        claims,
        errors,
        claimsLoaded,
        claimsCount,
        totalRevenueCycle,
        complianceScore,
        pendingAuthCount,
        fetchClaims,
        getClaimById,
        authorizeClaim
    }
})
