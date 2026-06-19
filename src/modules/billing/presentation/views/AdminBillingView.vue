<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBillingStore } from '../../application/billing-store.js'
import usePharmacyStore from '../../../pharmacy/application/pharmacy.store.js'
import StockOrderModal from '../components/StockOrderModal.vue'

const { t, locale } = useI18n()
const billingStore = useBillingStore()
const pharmacyStore = usePharmacyStore()
const currentPage = ref(1)
const itemsPerPage = 4
const filtersOpen = ref(false)
const searchQuery = ref('')
const selectedCompliance = ref('all')
const selectedCycle = ref('all')
const searchFocused = ref(false)
const orderModalMedicine = ref(null)

onMounted(() => {
  if (!billingStore.claimsLoaded) billingStore.fetchClaims()
  if (!pharmacyStore.medicinesLoaded) pharmacyStore.fetchMedicines()
})

const revenueCycleFormatted = computed(() => {
  const val = billingStore.totalRevenueCycle
  if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`
  if (val >= 1000) return `$${(val / 1000).toFixed(1)}K`
  return `$${val.toFixed(2)}`
})

const revenueBars = computed(() => {
  const values = [62, 48, 55, 72, 80, 90]
  return values.map((val, i) => {
    const date = new Date(2026, i, 1)
    const month = date.toLocaleDateString(locale.value === 'es' ? 'es-PE' : 'en-US', { month: 'short' })
    const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1).replace('.', '')
    return { month: capitalizedMonth, value: val }
  })
})

const compliancePercent = computed(() => Math.min(billingStore.complianceScore, 100))

const complianceOptions = computed(() => [
  { value: 'all', label: copy.value.allCompliances },
  { value: 'verified', label: getComplianceLabel('verified') },
  { value: 'pendingSign', label: getComplianceLabel('pendingSign') },
  { value: 'missingIcd10', label: getComplianceLabel('missingIcd10') }
])

const cycleOptions = computed(() => [
  { value: 'all', label: copy.value.allCycleStatuses },
  { value: 'In Clearinghouse', label: t('billing.cycleStatuses.inClearinghouse') },
  { value: 'Funds Released', label: t('billing.cycleStatuses.fundsReleased') },
  { value: 'Auth Required', label: t('billing.cycleStatuses.authRequired') },
  { value: 'Rejected', label: t('billing.cycleStatuses.rejected') }
])

const copy = computed(() => ({
  searchPlaceholder: t('billing.searchPlaceholder'),
  filtersTitle: t('billing.filtersTitle'),
  allCompliances: t('billing.allCompliances'),
  allCycleStatuses: t('billing.allCycleStatuses'),
  resetFilters: t('billing.resetFilters'),
  noResults: t('billing.noResults'),
  exportDone: t('billing.exportDone'),
  exportFilePrefix: t('billing.exportFilePrefix'),
  suggestionsTitle: t('billing.suggestionsTitle'),
  complianceField: t('billing.complianceField'),
  cycleField: t('billing.cycleField'),
  searchField: t('billing.searchField')
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
  if (!total) return t('billing.paginationEmpty')
  const start = (currentPage.value - 1) * itemsPerPage + 1
  const end = Math.min(currentPage.value * itemsPerPage, total)
  return t('billing.paginationLabel', { start, end, total })
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
  if (status === 'pendingSign') return 'compliance-pending'
  if (status === 'missingIcd10') return 'compliance-missing'
  return ''
}

function getComplianceLabel(status) {
  const keys = {
    'verified': 'billing.compliances.verified',
    'pendingSign': 'billing.compliances.pendingSign',
    'missingIcd10': 'billing.compliances.missingIcd10'
  }
  const key = keys[status]
  return key ? t(key) : status
}

function getComplianceDot(status) {
  if (status === 'verified') return 'dot-green'
  if (status === 'pendingSign') return 'dot-amber'
  if (status === 'missingIcd10') return 'dot-red'
  return ''
}

function getCycleClass(status) {
  if (status === 'Funds Released') return 'cycle-released'
  if (status === 'In Clearinghouse') return 'cycle-clearing'
  if (status === 'Auth Required') return 'cycle-auth'
  if (status === 'Rejected') return 'cycle-rejected'
  return ''
}

function translateCycleStatus(status) {
  const keys = {
    'In Clearinghouse': 'billing.cycleStatuses.inClearinghouse',
    'Funds Released': 'billing.cycleStatuses.fundsReleased',
    'Auth Required': 'billing.cycleStatuses.authRequired',
    'Rejected': 'billing.cycleStatuses.rejected'
  }
  const key = keys[status]
  return key ? t(key) : status
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

const stockLabels = computed(() => ({
  title: t('billing.stockReplenishment.title'),
  description: t('billing.stockReplenishment.description'),
  medicine: t('billing.stockReplenishment.medicine'),
  currentStock: t('billing.stockReplenishment.currentStock'),
  status: t('billing.stockReplenishment.status'),
  order: t('billing.stockReplenishment.order'),
  noLowStock: t('billing.stockReplenishment.noLowStock'),
  orderHistory: t('billing.stockReplenishment.orderHistory'),
  historyDate: t('billing.stockReplenishment.historyDate'),
  ordered: t('billing.stockReplenishment.ordered'),
  stockWarning: t('billing.stockReplenishment.stockWarning'),
  stockCritical: t('billing.stockReplenishment.stockCritical'),
  stockOk: t('billing.stockReplenishment.stockOk'),
  orderTitle: t('billing.stockReplenishment.orderTitle'),
  orderDescription: t('billing.stockReplenishment.orderDescription'),
  quantity: t('billing.stockReplenishment.quantity'),
  confirmOrder: t('billing.stockReplenishment.confirmOrder'),
  cancel: t('billing.stockReplenishment.cancel'),
  orderSuccess: t('billing.stockReplenishment.orderSuccess')
}))

const lowStockMedicines = computed(() =>
  pharmacyStore.medicines.filter(m => (Number(m.stock) || 0) < 25)
)

function getStockStatus(medicine) {
  const stock = Number(medicine.stock) || 0
  if (stock < 10) return 'critical'
  if (stock < 20) return 'warning'
  return 'ok'
}

function canOrder(medicine) {
  return (Number(medicine.stock) || 0) < 20
}

function openOrderModal(medicine) {
  orderModalMedicine.value = medicine
}

function closeOrderModal() {
  orderModalMedicine.value = null
}

function onOrderPlaced() {
  orderModalMedicine.value = null
}

function formatOrderDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(locale.value === 'es' ? 'es-PE' : 'en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })
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
                <span :class="getCycleClass(claim.cycleStatus)">{{ translateCycleStatus(claim.cycleStatus) }}</span>
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

    <article class="billing-claims-panel panel" style="margin-bottom: 0;">
      <div class="billing-claims-header">
        <div>
          <h2>{{ stockLabels.title }}</h2>
          <p>{{ stockLabels.description }}</p>
        </div>
      </div>

      <div v-if="lowStockMedicines.length" class="billing-table-wrapper">
        <table class="billing-table" aria-label="Stock replenishment">
          <thead>
            <tr>
              <th>{{ stockLabels.medicine }}</th>
              <th>{{ stockLabels.currentStock }}</th>
              <th>{{ stockLabels.status }}</th>
              <th>{{ t('billing.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="medicine in lowStockMedicines" :key="medicine.id">
              <td class="claim-id-cell">
                <strong>{{ medicine.name }}</strong>
                <span>{{ medicine.unitQuantity }}{{ medicine.unitType }}</span>
              </td>
              <td class="value-cell">{{ medicine.stock }}</td>
              <td class="compliance-cell">
                <span v-if="getStockStatus(medicine) === 'critical'" class="compliance-badge compliance-missing">{{ stockLabels.stockCritical }}</span>
                <span v-else-if="getStockStatus(medicine) === 'warning'" class="compliance-badge compliance-pending">{{ stockLabels.stockWarning }}</span>
                <span v-else class="compliance-badge compliance-verified">{{ stockLabels.stockOk }}</span>
              </td>
              <td class="actions-cell">
                <button
                  type="button"
                  class="authorize-btn"
                  :disabled="!canOrder(medicine)"
                  @click="openOrderModal(medicine)"
                >
                  {{ stockLabels.order }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else class="billing-empty-state" style="padding: 2rem; text-align: center;">{{ stockLabels.noLowStock }}</p>

      <div v-if="pharmacyStore.orders.length" class="billing-table-wrapper" style="margin-top: 1.5rem;">
        <h3 style="margin: 0 0 0.5rem; font-size: 0.95rem;">{{ stockLabels.orderHistory }}</h3>
        <table class="billing-table" aria-label="Order history">
          <thead>
            <tr>
              <th>{{ stockLabels.historyDate }}</th>
              <th>{{ stockLabels.medicine }}</th>
              <th>{{ stockLabels.ordered }}</th>
              <th>{{ stockLabels.currentStock }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in pharmacyStore.orders" :key="order.id">
              <td class="value-cell" style="font-size: 0.8rem;">{{ formatOrderDate(order.date) }}</td>
              <td class="claim-id-cell"><strong>{{ order.medicineName }}</strong></td>
              <td class="value-cell">+{{ order.quantity }}</td>
              <td class="value-cell">{{ order.previousStock }} &rarr; {{ order.newStock }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </article>

    <StockOrderModal
      v-if="orderModalMedicine"
      :medicine="orderModalMedicine"
      :labels="stockLabels"
      @close="closeOrderModal"
      @order-placed="onOrderPlaced"
    />

  </section>
</template>
