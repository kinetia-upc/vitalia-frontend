/**
 * Application service store for the Billing bounded context.
 * Manages billing claims state and actions.
 *
 * @module useAnalyticsStore
 */
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { BillingApi } from "../infrastructure/billing-api.js";
import { BillingClaimAssembler } from "../infrastructure/billing-claim.assembler.js";
import { BillingClaim } from "../domain/model/billing-claim.entity.js";

const billingApi = new BillingApi();

const useAnalyticsStore = defineStore("analytics", () => {
    /** @type {import('vue').Ref<BillingClaim[]>} */
    const claims = ref([]);
    const errors = ref([]);
    const claimsLoaded = ref(false);

    const claimsCount = computed(() => claimsLoaded.value ? claims.value.length : 0);

    function pushError(error) {
        errors.value.push(error);
    }

    function fetchClaims() {
        billingApi.getClaims().then(response => {
            claims.value = BillingClaimAssembler.toEntitiesFromResponse(response);
            claimsLoaded.value = true;
        }).catch(error => {
            pushError(error);
        });
    }

    function getClaimById(id) {
        return claims.value.find(c => c.id === id);
    }

    async function authorizeClaim(claimId) {
        const claim = getClaimById(claimId);
        if (!claim) return;
        try {
            const updatedResource = BillingClaimAssembler.toResourceFromEntity(claim);
            updatedResource.cycleStatus = "In Clearinghouse";
            const response = await billingApi.updateClaim(updatedResource);
            const updatedClaim = BillingClaimAssembler.toEntityFromResource(response.data);
            const index = claims.value.findIndex(c => c.id === claimId);
            if (index !== -1) claims.value[index] = updatedClaim;
        } catch (error) {
            pushError(error);
        }
    }

    // Computed summaries
    const totalRevenueCycle = computed(() => {
        return claims.value.reduce((sum, c) => sum + (c.value || 0), 0);
    });

    const complianceScore = computed(() => {
        if (!claims.value.length) return 0;
        const verified = claims.value.filter(c => c.clinicalCompliance === 'verified').length;
        return Math.round((verified / claims.value.length) * 100 * 10) / 10;
    });

    const pendingAuthCount = computed(() => {
        return claims.value.filter(c => c.cycleStatus === 'Auth Required').length;
    });

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
    };
});

export default useAnalyticsStore;
