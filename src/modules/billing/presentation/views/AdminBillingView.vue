<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBillingStore } from '../../application/billing-store.js'

const { t } = useI18n()
const billingStore = useBillingStore()
const currentPage = ref(1)
const itemsPerPage = 4

onMounted(() => {
  if (!billingStore.claimsLoaded) billingStore.fetchClaims()
})

const revenueCycleFormatted = computed(() => {
  const val = billingStore.totalRevenueCycle
  if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`
  if (val >= 1000) return `$${(val / 1000).toFixed(1)}K`
  return `$${val.toFixed(2)}`
})

const revenueBars = computed(() => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
  const values = [62, 48, 55, 72, 80, 90]
  return months.map((m, i) => ({ month: m, value: values[i] }))
})

const compliancePercent = computed(() => Math.min(billingStore.complianceScore, 100))

const totalPages = computed(() => Math.ceil(billingStore.claims.length / itemsPerPage))

const paginatedClaims = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return billingStore.claims.slice(start, start + itemsPerPage)
})

const paginationLabel = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage + 1
  const end = Math.min(currentPage.value * itemsPerPage, billingStore.claims.length)
  return `Showing ${start}-${end} of ${billingStore.claims.length} pending claims`
})

function goToPage(page) {
  if (page >= 1 && page <= totalPages.value) currentPage.value = page
}

function getComplianceClass(status) {
  if (status === 'verified') return 'compliance-verified'
  if (status === 'pending_sign') return 'compliance-pending'
  if (status === 'missing_icd10') return 'compliance-missing'
  return ''
}

function getComplianceLabel(status) {
  if (status === 'verified') return 'VERIFIED'
  if (status === 'pending_sign') return 'PENDING SIGN'
  if (status === 'missing_icd10') return 'MISSING ICD-10'
  return status
}

function getComplianceDot(status) {
  if (status === 'verified') return 'dot-green'
  if (status === 'pending_sign') return 'dot-amber'
  if (status === 'missing_icd10') return 'dot-red'
  return ''
}

function getCycleClass(status) {
  if (status === 'Funds Released') return 'cycle-released'
  if (status === 'In Clearinghouse') return 'cycle-clearing'
  if (status === 'Auth Required') return 'cycle-auth'
  if (status === 'Rejected') return 'cycle-rejected'
  return ''
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

function handleAuthorize(claimId) {
  billingStore.authorizeClaim(claimId)
}
</script>

<template>
  <section class="dashboard-view billing-dashboard">
    <div class="billing-kpi-row">
      <article class="billing-kpi-card">
        <div class="billing-kpi-header">
          <span class="billing-kpi-label">{{ t('billing.activeRevenueCycle') }}</span>
          <span class="billing-kpi-icon revenue-icon">
            <svg viewBox="0 0 24 24"><path d="M4 6h16v12H4V6Zm2 2v8h12V8H6Zm2 2h5v2H8v-2Zm0 3h8v1H8v-1Z"/></svg>
          </span>
        </div>
        <strong class="billing-kpi-value">{{ revenueCycleFormatted }}</strong>
        <span class="billing-kpi-change positive">+12.4% from last month</span>
        <div class="billing-mini-bars">
          <span v-for="bar in revenueBars" :key="bar.month" class="billing-mini-bar" :style="{ height: `${bar.value}%` }"></span>
        </div>
      </article>

      <article class="billing-kpi-card">
        <div class="billing-kpi-header">
          <span class="billing-kpi-label">{{ t('billing.complianceHealth') }}</span>
          <span class="billing-kpi-icon compliance-icon">
            <svg viewBox="0 0 24 24"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2Z"/></svg>
          </span>
        </div>
        <div class="billing-kpi-score">
          <strong class="billing-kpi-value">{{ billingStore.complianceScore.toFixed(1) }}</strong>
          <span class="billing-kpi-unit">/100</span>
        </div>
        <span class="billing-kpi-sublabel">Regulatory Score (HIPAA/SOC2)</span>
        <div class="compliance-bar-track">
          <div class="compliance-bar-fill" :style="{ width: `${compliancePercent}%` }"></div>
        </div>
      </article>

    </div>

    <article class="billing-claims-panel panel">
      <div class="billing-claims-header">
        <div>
          <h2>{{ t('billing.claimsTitle') }}</h2>
          <p>{{ t('billing.claimsSubtitle') }}</p>
        </div>
        <div class="billing-claims-actions">
          <button type="button" class="billing-action-btn">
            <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M10 18h4v-2h-4v2ZM3 6v2h18V6H3Zm3 7h12v-2H6v2Z"/></svg>
            {{ t('billing.filter') }}
          </button>
          <button type="button" class="billing-action-btn">
            <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7ZM5 18v2h14v-2H5Z"/></svg>
            {{ t('billing.export') }}
          </button>
        </div>
      </div>

      <div class="billing-table-wrapper">
        <table class="billing-table" aria-label="Financial claims audit">
          <thead>
            <tr>
              <th>{{ t('billing.claimId') }}</th>
              <th>{{ t('billing.patientProvider') }}</th>
              <th>{{ t('billing.value') }}</th>
              <th>{{ t('billing.clinicalCompliance') }}</th>
              <th>{{ t('billing.cycleStatus') }}</th>
              <th>{{ t('billing.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="claim in paginatedClaims" :key="claim.id">
              <td class="claim-id-cell">
                <strong>{{ claim.claimCode }}</strong>
                <span>{{ claim.insuranceProvider }}</span>
              </td>
              <td class="patient-provider-cell">
                <div class="patient-avatar-wrap">
                  <span class="patient-avatar-placeholder">{{ claim.patientName.charAt(0) }}</span>
                </div>
                <div>
                  <strong>{{ claim.patientName }}</strong>
                  <span>{{ claim.providerName }}</span>
                </div>
              </td>
              <td class="value-cell">{{ formatCurrency(claim.value) }}</td>
              <td class="compliance-cell">
                <span class="compliance-dot" :class="getComplianceDot(claim.clinicalCompliance)"></span>
                <span class="compliance-badge" :class="getComplianceClass(claim.clinicalCompliance)">
                  {{ getComplianceLabel(claim.clinicalCompliance) }}
                </span>
              </td>
              <td class="cycle-cell">
                <span :class="getCycleClass(claim.cycleStatus)">{{ claim.cycleStatus }}</span>
              </td>
              <td class="actions-cell">
                <button
                  v-if="claim.cycleStatus === 'Auth Required'"
                  type="button"
                  class="authorize-btn"
                  @click="handleAuthorize(claim.id)"
                >
                  {{ t('billing.authorize') }}
                </button>
                <button type="button" class="claim-menu-btn" aria-label="More actions">
                  <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2Zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2Zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2Z"/></svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="billing-pagination">
        <span class="billing-pagination-label">{{ paginationLabel }}</span>
        <div class="billing-pagination-controls">
          <button type="button" class="page-nav" :disabled="currentPage <= 1" @click="goToPage(currentPage - 1)">&lsaquo;</button>
          <button
            v-for="page in totalPages"
            :key="page"
            type="button"
            class="page-btn"
            :class="{ active: page === currentPage }"
            @click="goToPage(page)"
          >{{ page }}</button>
          <button type="button" class="page-nav" :disabled="currentPage >= totalPages" @click="goToPage(currentPage + 1)">&rsaquo;</button>
        </div>
      </div>
    </article>

    <div class="billing-info-row">
      <article class="billing-info-card">
        <span class="billing-info-icon data-icon">
          <svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 1 3 5v6c0 5.6 3.8 10.7 9 12 5.2-1.3 9-6.4 9-12V5l-9-4Zm0 10.9h7c-.5 4.1-3.3 7.8-7 8.9V12H5V6.3l7-3.1v8.7Z"/></svg>
        </span>
        <div>
          <strong>{{ t('billing.dataIntegrityCheck') }}</strong>
          <p>{{ t('billing.dataIntegrityDesc') }}</p>
        </div>
      </article>
      <article class="billing-info-card">
        <span class="billing-info-icon audit-icon">
          <svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2Zm1 15h-2v-6h2v6Zm0-8h-2V7h2v2Z"/></svg>
        </span>
        <div>
          <strong>{{ t('billing.auditTrailActive') }}</strong>
          <p>{{ t('billing.auditTrailDesc') }}</p>
        </div>
      </article>
      <article class="billing-info-card">
        <span class="billing-info-icon regulation-icon">
          <svg viewBox="0 0 24 24"><path fill="currentColor" d="M1 21h22L12 2 1 21Zm12-3h-2v-2h2v2Zm0-4h-2v-4h2v4Z"/></svg>
        </span>
        <div>
          <strong>{{ t('billing.regulationUpdate') }}</strong>
          <p>{{ t('billing.regulationDesc') }}</p>
        </div>
      </article>
    </div>
  </section>
</template>
