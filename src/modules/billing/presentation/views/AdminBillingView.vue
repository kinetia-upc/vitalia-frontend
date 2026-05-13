<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBillingStore } from '../../application/billing-store.js'

const { t, locale } = useI18n()
const billingStore = useBillingStore()
const currentPage = ref(1)
const itemsPerPage = 4
const filtersOpen = ref(false)
const searchQuery = ref('')
const selectedCompliance = ref('all')
const selectedCycle = ref('all')
const searchFocused = ref(false)

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

const complianceOptions = computed(() => [
  { value: 'all', label: copy.value.allCompliances },
  { value: 'verified', label: getComplianceLabel('verified') },
  { value: 'pending_sign', label: getComplianceLabel('pending_sign') },
  { value: 'missing_icd10', label: getComplianceLabel('missing_icd10') }
])

const cycleOptions = computed(() => [
  { value: 'all', label: copy.value.allCycleStatuses },
  { value: 'In Clearinghouse', label: 'In Clearinghouse' },
  { value: 'Funds Released', label: 'Funds Released' },
  { value: 'Auth Required', label: 'Auth Required' },
  { value: 'Rejected', label: 'Rejected' }
])

const copy = computed(() => ({
  searchPlaceholder: locale.value === 'es'
    ? 'Buscar por reclamo, paciente, proveedor o seguro...'
    : 'Search by claim, patient, provider, or payer...',
  filtersTitle: locale.value === 'es' ? 'Filtros de auditoria' : 'Audit filters',
  allCompliances: locale.value === 'es' ? 'Todo cumplimiento' : 'All compliance',
  allCycleStatuses: locale.value === 'es' ? 'Todo estado de ciclo' : 'All cycle status',
  resetFilters: locale.value === 'es' ? 'Limpiar filtros' : 'Reset filters',
  noResults: locale.value === 'es' ? 'No hay reclamos que coincidan con la busqueda actual.' : 'No claims match the current search.',
  exportDone: locale.value === 'es' ? 'Exportando reclamos filtrados' : 'Exporting filtered claims',
  exportFilePrefix: locale.value === 'es' ? 'reclamos-facturacion' : 'billing-claims',
  suggestionsTitle: locale.value === 'es' ? 'Sugerencias' : 'Suggestions',
  complianceField: locale.value === 'es' ? 'Cumplimiento' : 'Compliance',
  cycleField: locale.value === 'es' ? 'Estado del ciclo' : 'Cycle status',
  searchField: locale.value === 'es' ? 'Busqueda predictiva' : 'Predictive search'
}))

const suggestionPool = computed(() => {
  const entries = billingStore.claims.flatMap((claim) => [
    { value: claim.claimCode, label: claim.claimCode, meta: claim.insuranceProvider },
    { value: claim.patientName, label: claim.patientName, meta: claim.providerName },
    { value: claim.providerName, label: claim.providerName, meta: claim.patientName },
    { value: claim.insuranceProvider, label: claim.insuranceProvider, meta: claim.claimCode }
  ])

  const seen = new Set()
  return entries.filter((entry) => {
    const key = `${entry.value}::${entry.meta}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
})

const searchSuggestions = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return []

  return suggestionPool.value
    .filter((entry) =>
      entry.label.toLowerCase().includes(query) ||
      entry.meta.toLowerCase().includes(query)
    )
    .slice(0, 6)
})

const filteredClaims = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return billingStore.claims.filter((claim) => {
    const matchesQuery = !query || [
      claim.claimCode,
      claim.patientName,
      claim.providerName,
      claim.insuranceProvider,
      claim.cycleStatus,
      getComplianceLabel(claim.clinicalCompliance)
    ].join(' ').toLowerCase().includes(query)

    const matchesCompliance =
      selectedCompliance.value === 'all' || claim.clinicalCompliance === selectedCompliance.value
    const matchesCycle =
      selectedCycle.value === 'all' || claim.cycleStatus === selectedCycle.value

    return matchesQuery && matchesCompliance && matchesCycle
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredClaims.value.length / itemsPerPage)))

const paginatedClaims = computed(() => {
  if (currentPage.value > totalPages.value) currentPage.value = totalPages.value
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredClaims.value.slice(start, start + itemsPerPage)
})

const paginationLabel = computed(() => {
  const total = filteredClaims.value.length
  if (!total) return locale.value === 'es' ? 'Sin reclamos para mostrar' : 'No claims to display'
  const start = (currentPage.value - 1) * itemsPerPage + 1
  const end = Math.min(currentPage.value * itemsPerPage, total)
  return locale.value === 'es'
    ? `Mostrando ${start}-${end} de ${total} reclamos filtrados`
    : `Showing ${start}-${end} of ${total} filtered claims`
})

const showSuggestions = computed(() => searchFocused.value && searchSuggestions.value.length > 0)

watch([searchQuery, selectedCompliance, selectedCycle], () => {
  currentPage.value = 1
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

function applySuggestion(suggestion) {
  searchQuery.value = suggestion.value
  searchFocused.value = false
}

function resetFilters() {
  searchQuery.value = ''
  selectedCompliance.value = 'all'
  selectedCycle.value = 'all'
  searchFocused.value = false
}

function exportClaims() {
  const rows = filteredClaims.value.map((claim) => [
    claim.claimCode,
    claim.insuranceProvider,
    claim.patientName,
    claim.providerName,
    String(claim.value),
    getComplianceLabel(claim.clinicalCompliance),
    claim.cycleStatus
  ])

  const csv = [
    ['Claim Code', 'Insurance Provider', 'Patient Name', 'Provider Name', 'Value', 'Compliance', 'Cycle Status'],
    ...rows
  ].map((row) =>
    row.map((field) => `"${String(field).replaceAll('"', '""')}"`).join(',')
  ).join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const stamp = new Date().toISOString().slice(0, 10)
  link.href = URL.createObjectURL(blob)
  link.download = `${copy.value.exportFilePrefix}-${stamp}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
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
          <button type="button" class="billing-action-btn" @click="filtersOpen = !filtersOpen">
            <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M10 18h4v-2h-4v2ZM3 6v2h18V6H3Zm3 7h12v-2H6v2Z"/></svg>
            {{ t('billing.filter') }}
          </button>
          <button type="button" class="billing-action-btn" @click="exportClaims">
            <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7ZM5 18v2h14v-2H5Z"/></svg>
            {{ t('billing.export') }}
          </button>
        </div>
      </div>

      <div v-if="filtersOpen" class="billing-filters-panel">
        <div class="billing-search-shell">
          <label class="billing-field-label">{{ copy.searchField }}</label>
          <div class="billing-search-input-wrap">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.5 4a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13Zm0 2a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Zm8.9 10.5 1.4 1.4-3.2 3.2-1.4-1.4 3.2-3.2Z"/></svg>
            <input
              v-model="searchQuery"
              type="search"
              :placeholder="copy.searchPlaceholder"
              @focus="searchFocused = true"
              @blur="setTimeout(() => { searchFocused = false }, 120)"
            />
          </div>
          <div v-if="showSuggestions" class="billing-search-suggestions">
            <span class="billing-suggestions-title">{{ copy.suggestionsTitle }}</span>
            <button
              v-for="suggestion in searchSuggestions"
              :key="`${suggestion.label}-${suggestion.meta}`"
              type="button"
              class="billing-suggestion-item"
              @mousedown.prevent="applySuggestion(suggestion)"
            >
              <strong>{{ suggestion.label }}</strong>
              <small>{{ suggestion.meta }}</small>
            </button>
          </div>
        </div>

        <label>
          <span class="billing-field-label">{{ copy.complianceField }}</span>
          <select v-model="selectedCompliance" class="billing-filter-select">
            <option v-for="option in complianceOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </label>

        <label>
          <span class="billing-field-label">{{ copy.cycleField }}</span>
          <select v-model="selectedCycle" class="billing-filter-select">
            <option v-for="option in cycleOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </label>

        <button type="button" class="billing-action-btn billing-reset-btn" @click="resetFilters">
          {{ copy.resetFilters }}
        </button>
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
          <tbody v-if="paginatedClaims.length">
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
          <tbody v-else>
            <tr>
              <td colspan="6" class="billing-empty-state">{{ copy.noResults }}</td>
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
