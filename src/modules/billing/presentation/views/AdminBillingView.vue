<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBillingStore } from '../../application/billing-store.js'
import usePharmacyStore from '../../../pharmacy/application/pharmacy.store.js'
import { useSchedulingStore } from '../../../scheduling/application/scheduling-store.js'
import useTenantStore from '../../../tenant/application/tenant.store.js'
import useClinicalStore from '../../../clinical/application/clinical.store.js'
import StockOrderModal from '../components/StockOrderModal.vue'

const { t, locale } = useI18n()
const billingStore = useBillingStore()
const pharmacyStore = usePharmacyStore()
const schedulingStore = useSchedulingStore()
const tenantStore = useTenantStore()
const clinicalStore = useClinicalStore()
const currentPage = ref(1)
const itemsPerPage = 4
const filtersOpen = ref(false)
const searchQuery = ref('')
const selectedCompliance = ref('all')
const selectedCycle = ref('all')
const selectedBranch = ref('all')
const selectedRevenueMonth = ref('')
const selectedStockBranch = ref('')
const searchFocused = ref(false)
const orderModalMedicine = ref(null)

const monthInputMax = computed(() => {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
})

onMounted(() => {
  if (!billingStore.claimsLoaded) billingStore.fetchClaims()
  if (!pharmacyStore.medicinesLoaded) pharmacyStore.fetchMedicines()
  if (!schedulingStore.loaded) schedulingStore.fetchSchedulingData()
  if (!tenantStore.branchesLoaded) tenantStore.fetchBranches()
  if (!tenantStore.appointmentFeesLoaded) tenantStore.fetchAppointmentFees()
  if (!clinicalStore.medicalRecordsLoaded) clinicalStore.fetchMedicalRecords()
  if (!clinicalStore.doctorSpecialitiesLoaded) clinicalStore.fetchDoctorSpecialities()
})

const revenueCycleFormatted = computed(() => {
  const val = earnedClaims.value.reduce((sum, claim) => sum + (Number(claim.value) || 0), 0)
  if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`
  if (val >= 1000) return `$${(val / 1000).toFixed(1)}K`
  return `$${val.toFixed(2)}`
})

const compliancePercent = computed(() => Math.min(billingStore.complianceScore, 100))

const complianceOptions = computed(() => [
  { value: 'all', label: copy.value.allCompliances },
  { value: 'verified', label: getComplianceLabel('verified') },
  { value: 'pending', label: getComplianceLabel('pending') }
])

const branchOptions = computed(() => [
  { value: 'all', label: t('billing.allBranches') },
  ...tenantStore.branches.map((branch) => ({ value: branch.id, label: branch.branchName }))
])

const monthOptions = computed(() => {
  const today = new Date()
  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth() - index, 1)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const [year, monthIndex] = key.split('-').map(Number)
    const labelDate = new Date(year, monthIndex - 1, 1)
    return {
      value: key,
      label: labelDate.toLocaleDateString(locale.value === 'es' ? 'es-PE' : 'en-US', { month: 'long', year: 'numeric' })
    }
  })
})

const cycleOptions = computed(() => [
  { value: 'all', label: copy.value.allCycleStatuses },
  { value: 'Rejected', label: t('billing.cycleStatuses.rejected') },
  { value: 'cleared', label: t('billing.cycleStatuses.cleared') },
  { value: 'pending', label: t('billing.cycleStatuses.pending') }
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

const claimsWithContext = computed(() => billingStore.claims.map((claim) => {
  const appointment = schedulingStore.appointments.find((item) => item.id === claim.appointmentId)
  const medicalRecord = clinicalStore.medicalRecords.find((record) => record.appointmentId === claim.appointmentId)
  const branch = tenantStore.branches.find((item) => item.id === appointment?.branchId)
  const movementDate = medicalRecord?.createdAt || medicalRecord?.updatedAt || ''
  const monthKey = movementDate ? movementDate.slice(0, 7) : ''
  const isFinal = ['Rejected', 'cleared'].includes(claim.cycleStatus)
  const normalizedCompliance = isFinal ? 'verified' : 'pending'
  const normalizedCycleStatus = isFinal ? claim.cycleStatus : 'pending'
  const isPaidAppointment = appointment?.paymentStatus === 'paid'
  const isRefunded = claim.cycleStatus === 'cleared'

  return {
    ...claim,
    appointment,
    medicalRecord,
    branchId: appointment?.branchId || null,
    branchName: branch?.branchName || t('billing.unassignedBranch'),
    scheduledAt: appointment?.scheduledAt || '',
    movementDate,
    monthKey,
    appointmentCode: appointment?.code || claim.appointmentId || t('billing.unassignedAppointment'),
    medicalRecordCode: medicalRecord?.code || medicalRecord?.id || t('billing.unassignedMedicalRecord'),
    clinicalCompliance: normalizedCompliance,
    cycleStatus: normalizedCycleStatus,
    isFinal,
    isPaidAppointment,
    isRefunded,
    isEarned: Boolean(medicalRecord) && isPaidAppointment && !isRefunded
  }
}))

const incomeMovements = computed(() =>
  clinicalStore.medicalRecords
    .map((record) => {
      const appointment = schedulingStore.appointments.find((item) => item.id === record.appointmentId)
      if (appointment?.paymentStatus !== 'paid') return null

      const claim = claimsWithContext.value.find((item) => item.appointmentId === appointment.id)
      if (claim && claim.cycleStatus !== 'Rejected') return null

      const branch = tenantStore.branches.find((item) => item.id === appointment.branchId)
      const patient = schedulingStore.patients.find((item) => item.id === appointment.patientId)
      const doctor = schedulingStore.doctors.find((item) => item.id === appointment.doctorId)
      const doctorSpeciality = clinicalStore.doctorSpecialities.find((item) => item.doctorId === appointment.doctorId)
      const appointmentFee = tenantStore.appointmentFees.find((fee) =>
        fee.branchId === appointment.branchId && fee.specialityId === doctorSpeciality?.specialityId
      )
      const value = Number(claim?.value ?? appointmentFee?.price ?? 0)

      if (value <= 0) return null

      const movementDate = record.createdAt || record.updatedAt || ''

      return {
        id: record.id,
        value,
        branchId: appointment.branchId || null,
        branchName: branch?.branchName || t('billing.unassignedBranch'),
        movementDate,
        monthKey: movementDate ? movementDate.slice(0, 7) : '',
        medicalRecordCode: record.code || record.id || t('billing.unassignedMedicalRecord'),
        patientName: claim?.patientName || patient?.fullName || t('billing.unassignedPatient'),
        providerName: claim?.providerName || doctor?.fullName || t('billing.unassignedProvider')
      }
    })
    .filter(Boolean)
)

const selectedMonthMovements = computed(() =>
  incomeMovements.value.filter((movement) => {
    const matchesMonth = !selectedRevenueMonth.value || movement.monthKey === selectedRevenueMonth.value
    const matchesBranch = selectedBranch.value === 'all' || movement.branchId === selectedBranch.value
    return matchesMonth && matchesBranch
  })
)

const earnedMonthClaims = computed(() =>
  selectedMonthMovements.value
)

const earnedClaims = computed(() =>
  incomeMovements.value
)

const revenueMovements = computed(() =>
  earnedMonthClaims.value
    .filter((claim) => Number(claim.value) > 0)
    .slice()
    .sort((a, b) => new Date(b.movementDate || 0) - new Date(a.movementDate || 0))
)

const selectedRevenueMonthLabel = computed(() =>
  monthOptions.value.find((option) => option.value === selectedRevenueMonth.value)?.label || t('billing.noRevenueMonth')
)

watch(monthOptions, (options) => {
  if (!selectedRevenueMonth.value && options.length) selectedRevenueMonth.value = options[0].value
}, { immediate: true })

watch(branchOptions, (options) => {
  const firstBranch = options.find((option) => option.value !== 'all')
  if (!selectedStockBranch.value && firstBranch) selectedStockBranch.value = firstBranch.value
}, { immediate: true })

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

  return claimsWithContext.value.filter((claim) => {
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
    const matchesBranch =
      selectedBranch.value === 'all' || claim.branchId === selectedBranch.value

    return matchesQuery && matchesCompliance && matchesCycle && matchesBranch
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

watch([searchQuery, selectedCompliance, selectedCycle, selectedBranch], () => {
  currentPage.value = 1
})

function goToPage(page) {
  if (page >= 1 && page <= totalPages.value) currentPage.value = page
}

function shiftRevenueMonth(delta) {
  const [year, month] = selectedRevenueMonth.value.split('-').map(Number)
  if (!year || !month) return
  const date = new Date(year, month - 1 + delta, 1)
  const nextMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  selectedRevenueMonth.value = nextMonth > monthInputMax.value ? monthInputMax.value : nextMonth
}

function getComplianceClass(status) {
  if (status === 'verified') return 'compliance-verified'
  if (status === 'pending') return 'compliance-pending'
  return ''
}

function getComplianceLabel(status) {
  const keys = {
    'verified': 'billing.compliances.verified',
    'pending': 'billing.compliances.pending'
  }
  const key = keys[status]
  return key ? t(key) : status
}

function getComplianceDot(status) {
  if (status === 'verified') return 'dot-green'
  if (status === 'pending') return 'dot-amber'
  return ''
}

function getCycleClass(status) {
  if (status === 'Rejected') return 'cycle-rejected'
  if (status === 'cleared') return 'cycle-released'
  if (status === 'pending') return 'cycle-auth'
  return ''
}

function translateCycleStatus(status) {
  const keys = {
    'Rejected': 'billing.cycleStatuses.rejected',
    'cleared': 'billing.cycleStatuses.cleared',
    'pending': 'billing.cycleStatuses.pending'
  }
  const key = keys[status]
  return key ? t(key) : status
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

async function rejectClaim(claimId) {
  await billingStore.rejectClaim(claimId)
}

async function settleClaim(claimId) {
  await billingStore.settleClaim(claimId)
}

function applySuggestion(suggestion) {
  searchQuery.value = suggestion.value
  searchFocused.value = false
}

function resetFilters() {
  searchQuery.value = ''
  selectedCompliance.value = 'all'
  selectedCycle.value = 'all'
  selectedBranch.value = 'all'
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

const selectedBranchMedicines = computed(() =>
  pharmacyStore.branchMedicines
    .filter((branchMedicine) => String(branchMedicine.branchId) === String(selectedStockBranch.value))
    .map((branchMedicine) => {
      const medicine = pharmacyStore.medicines.find((item) => String(item.id) === String(branchMedicine.medicineId))
      if (!medicine) return null

      return {
        ...medicine,
        branchId: branchMedicine.branchId,
        stock: Number(branchMedicine.stock) || 0,
        price: Number(branchMedicine.price) || 0
      }
    })
    .filter(Boolean)
)

const lowStockMedicines = computed(() =>
  selectedBranchMedicines.value.filter(medicine => (Number(medicine.stock) || 0) < 25)
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
        <span class="billing-kpi-sublabel">{{ t('billing.complianceScoreHint') }}</span>
        <div class="compliance-bar-track">
          <div class="compliance-bar-fill" :style="{ width: `${compliancePercent}%` }"></div>
        </div>
      </article>
    </div>

    <article class="billing-claims-panel panel">
      <div class="billing-claims-header">
        <div>
          <h2>{{ t('billing.recentRevenueTitle') }}</h2>
          <p>{{ t('billing.recentRevenueSubtitle', { month: selectedRevenueMonthLabel }) }}</p>
        </div>
        <div class="movement-month-controls">
          <button type="button" class="page-nav" @click="shiftRevenueMonth(-1)">&lsaquo;</button>
          <input v-model="selectedRevenueMonth" type="month" :max="monthInputMax" class="movement-month-input" />
          <button type="button" class="page-nav" @click="shiftRevenueMonth(1)">&rsaquo;</button>
          <select v-model="selectedBranch" class="billing-filter-select compact">
            <option v-for="option in branchOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </div>
      </div>

      <div v-if="revenueMovements.length" class="billing-table-wrapper">
        <table class="billing-table" aria-label="Recent clinic revenue movements">
          <thead>
            <tr>
              <th>{{ t('billing.medicalRecordId') }}</th>
              <th>{{ t('billing.branch') }}</th>
              <th>{{ t('billing.patientProvider') }}</th>
              <th>{{ t('billing.value') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="claim in revenueMovements" :key="claim.id">
              <td class="claim-id-cell">
                <strong>{{ claim.medicalRecordCode }}</strong>
                <span>{{ formatOrderDate(claim.movementDate) }}</span>
              </td>
              <td class="claim-id-cell"><strong>{{ claim.branchName }}</strong></td>
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
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else class="billing-empty-state">{{ t('billing.noRecentRevenue') }}</p>
    </article>

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
          <span class="billing-field-label">{{ t('billing.branchField') }}</span>
          <select v-model="selectedBranch" class="billing-filter-select">
            <option v-for="option in branchOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </label>

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
                <template v-if="!claim.isFinal">
                  <button type="button" class="authorize-btn" @click="rejectClaim(claim.id)">
                    {{ t('billing.reject') }}
                  </button>
                  <button type="button" class="authorize-btn settle-btn" @click="settleClaim(claim.id)">
                    {{ t('billing.settle') }}
                  </button>
                </template>
                <span v-else class="claim-locked-label">{{ t('billing.claimClosed') }}</span>
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
        <label class="stock-branch-filter">
          <span class="billing-field-label">{{ t('billing.branchField') }}</span>
          <select v-model="selectedStockBranch" class="billing-filter-select compact">
            <option
              v-for="option in branchOptions.filter((item) => item.value !== 'all')"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </label>
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
