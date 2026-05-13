import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { AnalyticsSnapshotAssembler } from '../infrastructure/analytics-snapshot.assembler.js'
import { useBillingStore } from '../../billing/application/billing-store.js'
import useClinicalStore from '../../clinical/application/clinical.store.js'
import { useSchedulingStore } from '../../scheduling/application/scheduling-store.js'
import useTenantStore from '../../tenant/application/tenant.store.js'

export const useAnalyticsStore = defineStore('analytics', () => {
    const errors = ref([])
    const loading = ref(false)
    const loaded = ref(false)

    const billingStore = useBillingStore()
    const clinicalStore = useClinicalStore()
    const schedulingStore = useSchedulingStore()
    const tenantStore = useTenantStore()

    const snapshot = computed(() =>
        AnalyticsSnapshotAssembler.fromStores({
            schedulingStore,
            clinicalStore,
            tenantStore,
            billingStore
        })
    )

    async function loadAnalyticsData({ force = false } = {}) {
        if ((!force && loaded.value) || loading.value) return
        loading.value = true

        try {
            const tasks = []

            if (!schedulingStore.loaded || force) tasks.push(schedulingStore.fetchSchedulingData())
            if (!billingStore.claimsLoaded || force) tasks.push(billingStore.fetchClaims())
            if (!tenantStore.usersLoaded || force) tasks.push(tenantStore.fetchUsers())
            if (!clinicalStore.doctorsLoaded || force) tasks.push(clinicalStore.fetchDoctors())
            if (!clinicalStore.patientsLoaded || force) tasks.push(clinicalStore.fetchPatients())
            if (!clinicalStore.medicalRecordsLoaded || force) tasks.push(clinicalStore.fetchMedicalRecords())
            if (!clinicalStore.diagnosesLoaded || force) tasks.push(clinicalStore.fetchDiagnoses())
            if (!clinicalStore.treatmentsLoaded || force) tasks.push(clinicalStore.fetchTreatments())
            if (!clinicalStore.prescriptionsLoaded || force) tasks.push(clinicalStore.fetchPrescriptions())
            if (!clinicalStore.prescriptionDetailsLoaded || force) tasks.push(clinicalStore.fetchPrescriptionDetails())

            await Promise.all(tasks)
            loaded.value = true
        } catch (error) {
            errors.value.push(error)
        } finally {
            loading.value = false
        }
    }

    return {
        errors,
        loading,
        loaded,
        snapshot,
        loadAnalyticsData
    }
})
