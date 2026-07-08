<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSchedulingStore } from '../../../scheduling/application/scheduling-store.js'
import useClinicalStore from '../../application/clinical.store.js'
import usePharmacyStore from '../../../pharmacy/application/pharmacy.store.js'
import { useAuthStore } from '../../../../shared/application/auth-store.js'

const authStore = useAuthStore()
const CURRENT_PATIENT_ID = computed(() => authStore.currentPatientId)

const clinicalStore = useClinicalStore()
const pharmacyStore = usePharmacyStore()
const schedulingStore = useSchedulingStore()
const { t, locale } = useI18n()

const searchQuery = ref('')
const statusFilter = ref('all')

onMounted(() => {
  if (!clinicalStore.medicalRecordsLoaded) clinicalStore.fetchMedicalRecords()
  if (!clinicalStore.prescriptionsLoaded) clinicalStore.fetchPrescriptions()
  if (!clinicalStore.prescriptionDetailsLoaded) clinicalStore.fetchPrescriptionDetails()
  if (!pharmacyStore.medicinesLoaded) pharmacyStore.fetchMedicines()
  if (!schedulingStore.loaded) schedulingStore.fetchSchedulingData()
})

const labels = computed(() => ({
  title: t('clinical.patientPrescriptions.title'),
  subtitle: t('clinical.patientPrescriptions.subtitle'),
  searchPlaceholder: t('clinical.patientPrescriptions.searchPlaceholder'),
  all: t('clinical.patientPrescriptions.all'),
  active: t('clinical.patientPrescriptions.active'),
  completed: t('clinical.patientPrescriptions.completed'),
  totalPrescriptions: t('clinical.patientPrescriptions.totalPrescriptions'),
  activeMedicines: t('clinical.patientPrescriptions.activeMedicines'),
  pharmacyStock: t('clinical.patientPrescriptions.pharmacyStock'),
  latestPrescription: t('clinical.patientPrescriptions.latestPrescription'),
  quantity: t('clinical.patientPrescriptions.quantity'),
  frequency: t('clinical.patientPrescriptions.frequency'),
  duration: t('clinical.patientPrescriptions.duration'),
  stock: t('clinical.patientPrescriptions.stock'),
  prescribed: t('clinical.patientPrescriptions.prescribed'),
  record: t('clinical.patientPrescriptions.record'),
  provider: t('clinical.patientPrescriptions.provider'),
  unitPrice: t('clinical.patientPrescriptions.unitPrice'),
  clinicalSource: t('clinical.patientPrescriptions.clinicalSource'),
  medicineCode: t('clinical.patientPrescriptions.medicineCode'),
  prescriptionCode: t('clinical.patientPrescriptions.prescriptionCode'),
  noProvider: t('clinical.patientPrescriptions.noProvider'),
  noPrescriptions: t('clinical.patientPrescriptions.noPrescriptions'),
  noPrescriptionsBody: t('clinical.patientPrescriptions.noPrescriptionsBody'),
  loading: t('clinical.patientPrescriptions.loading'),
  units: t('clinical.patientPrescriptions.units'),
  unknown: t('clinical.patientPrescriptions.unknown')
}))

const patient = computed(() =>
  schedulingStore.patients.find((item) => item.id === CURRENT_PATIENT_ID.value)
)

const patientMedicalRecords = computed(() =>
  clinicalStore.medicalRecords.filter((record) =>
    record.patientId === patient.value?.id
  )
)

const patientMedicalRecordIds = computed(() =>
  new Set(patientMedicalRecords.value.map((record) => record.id))
)

const patientPrescriptions = computed(() =>
  clinicalStore.prescriptions.filter((prescription) =>
    patientMedicalRecordIds.value.has(prescription.medicalRecordId)
  )
)

const prescriptionItems = computed(() =>
  patientPrescriptions.value.flatMap((prescription) => {
    const record = patientMedicalRecords.value.find((item) =>
      item.id === prescription.medicalRecordId
    )
    const appointment = schedulingStore.appointmentsWithDetails.find((item) => item.id === record?.appointmentId)
    const details = clinicalStore.getPrescriptionDetailsByPrescriptionId(prescription.id)

    return details.map((detail) => {
      const medicine = resolveMedicine(detail)
      const issuedAt = detail.createdAt ?? prescription.createdAt ?? record?.updatedAt
      const activityAt = detail.updatedAt ?? issuedAt
      const endsAt = calculateEndDate(issuedAt, detail.duration)
      const statusKey = endsAt && startOfToday() > endsAt ? 'completed' : 'active'

      return {
        id: `${prescription.id}-${detail.id}`,
        prescription,
        detail,
        medicine,
        record,
        appointment,
        statusKey,
        issuedAt,
        activityAt,
        endsAt,
        name: detail.medicineName || medicine?.name || labels.value.unknown,
        formType: medicine?.unitType || labels.value.unknown,
        doseLabel: formatDose(detail),
        quantityLabel: formatQuantity(detail),
        frequencyLabel: formatFrequency(detail),
        durationLabel: formatDuration(detail),
        priceLabel: formatPrice(medicine?.price)
      }
    })
  }).sort((left, right) => new Date(right.issuedAt) - new Date(left.issuedAt))
)

const filteredPrescriptionItems = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return prescriptionItems.value.filter((item) => {
    const matchesStatus = statusFilter.value === 'all' || item.statusKey === statusFilter.value
    const searchable = [
      item.name,
      item.medicine?.code,
      item.formType,
      item.detail.frequency,
      item.detail.duration,
      item.record?.code,
      item.appointment?.doctor?.fullName
    ].filter(Boolean).join(' ').toLowerCase()

    return matchesStatus && (!query || searchable.includes(query))
  })
})

const activeMedicineCount = computed(() =>
  prescriptionItems.value.filter((item) => item.statusKey === 'active').length
)

const latestPrescriptionItem = computed(() => {
  if (!prescriptionItems.value.length) return null
  return prescriptionItems.value.reduce((latest, item) =>
    new Date(item.activityAt) > new Date(latest.activityAt) ? item : latest,
  prescriptionItems.value[0])
})

const latestActivityAt = computed(() => latestPrescriptionItem.value?.activityAt ?? null)

const latestPrescriptionDay = computed(() =>
  latestActivityAt.value ? formatDate(latestActivityAt.value) : '-'
)

const latestPrescriptionTime = computed(() =>
  latestActivityAt.value ? formatTime(latestActivityAt.value) : ''
)

const loading = computed(() =>
  !clinicalStore.medicalRecordsLoaded ||
  !clinicalStore.prescriptionsLoaded ||
  !clinicalStore.prescriptionDetailsLoaded ||
  !pharmacyStore.medicinesLoaded ||
  schedulingStore.loading
)

function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function resolveMedicine(detail) {
  const detailMedicineId = String(detail.medicineId ?? '')
  const detailMedicineName = normalize(detail.medicineName)

  return pharmacyStore.medicines.find((medicine) =>
    String(medicine.id) === detailMedicineId ||
    normalize(medicine.name) === detailMedicineName
  )
}

function parseDurationDays(duration) {
  const match = String(duration ?? '').match(/\d+/)
  return match ? Number(match[0]) : null
}

function calculateEndDate(date, duration) {
  const days = parseDurationDays(duration)
  if (!date || !days) return null

  const endDate = new Date(date)
  endDate.setDate(endDate.getDate() + days - 1)
  endDate.setHours(0, 0, 0, 0)
  return endDate
}

function startOfToday() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

function formatDose(detail) {
  const dose = detail.quantity ? `${detail.quantity}${detail.doseUnit ?? ''}` : labels.value.unknown
  return dose.replace(/\s+/g, '')
}

function formatQuantity(detail) {
  const quantity = Number(detail.quantity) || 0
  const unit = quantity === 1 ? t('patient.unitSingular') : t('patient.unitPlural')
  return `${quantity} ${unit}`
}

function formatFrequency(detail) {
  const frequency = Number(detail.frequency) || 0
  const unit = frequency === 1 ? t('patient.hourSingular') : t('patient.hourPlural')
  return `${t('patient.everyLabel')} ${frequency} ${unit}`
}

function formatDuration(detail) {
  const duration = Number(detail.duration) || 0
  const unit = duration === 1 ? t('patient.daySingular') : t('patient.dayPlural')
  return `${t('patient.forLabel')} ${duration} ${unit}`
}

function formatPrice(value) {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return '-'
  return new Intl.NumberFormat(locale.value === 'es' ? 'es-PE' : 'en-US', {
    style: 'currency',
    currency: 'PEN'
  }).format(Number(value))
}

function formatDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (isNaN(date)) return '-'
  return date.toLocaleDateString(locale.value === 'es' ? 'es-PE' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

function formatTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (isNaN(date)) return ''
  return date.toLocaleTimeString(locale.value === 'es' ? 'es-PE' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

function statusLabel(statusKey) {
  return statusKey === 'completed' ? labels.value.completed : labels.value.active
}

const PRESCRIPTIONS_PER_PAGE = 2
const MAX_VISIBLE_PRESCRIPTION_DOTS = 4

const activePrescriptionPage = ref(0)

const totalPrescriptionPages = computed(() =>
  Math.max(1, Math.ceil(filteredPrescriptionItems.value.length / PRESCRIPTIONS_PER_PAGE))
)

watch(filteredPrescriptionItems, () => {
  activePrescriptionPage.value = 0
})

function goToPrescriptionPage(index) {
  activePrescriptionPage.value = index
}

function showNextPrescriptionCard() {
  activePrescriptionPage.value = (activePrescriptionPage.value + 1) % totalPrescriptionPages.value
}

function showPreviousPrescriptionCard() {
  activePrescriptionPage.value = (activePrescriptionPage.value - 1 + totalPrescriptionPages.value) % totalPrescriptionPages.value
}

let prescriptionSwipeStartX = null

function onPrescriptionSwipeStart(event) {
  prescriptionSwipeStartX = event.clientX
}

function onPrescriptionSwipeEnd(event) {
  if (prescriptionSwipeStartX === null) return
  const delta = event.clientX - prescriptionSwipeStartX
  prescriptionSwipeStartX = null

  if (Math.abs(delta) < 40) return
  if (delta < 0) showNextPrescriptionCard()
  else showPreviousPrescriptionCard()
}

const PRESCRIPTION_DOT_STEP = 17

const prescriptionDots = computed(() =>
  Array.from({ length: totalPrescriptionPages.value }, (_, index) => ({ id: index, index }))
)

const prescriptionDotsOffset = computed(() => {
  const total = totalPrescriptionPages.value
  if (total <= MAX_VISIBLE_PRESCRIPTION_DOTS) return 0

  const maxStart = total - MAX_VISIBLE_PRESCRIPTION_DOTS
  const start = Math.min(Math.max(activePrescriptionPage.value - 1, 0), maxStart)
  return start * PRESCRIPTION_DOT_STEP
})
</script>

<template>
  <section class="patient-prescriptions-view">
    <header class="patient-prescriptions-heading">
      <div>
        <h1>{{ labels.title }}</h1>
        <p>{{ labels.subtitle }}</p>
      </div>
      <div class="patient-prescriptions-search">
        <span aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.5 3.5 20.5 13.5a4.2 4.2 0 1 1 -6 6L4.5 9.5a4.2 4.2 0 1 1 6-6Z" />
            <path d="M7 13l4 4" />
          </svg>
        </span>
        <input v-model="searchQuery" type="search" :placeholder="labels.searchPlaceholder">
      </div>
    </header>

    <div class="patient-prescriptions-stats">
      <article class="patient-prescription-stat cyan">
        <span class="patient-prescription-stat-watermark" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
            <rect x="7" y="6" width="10" height="15" rx="2" />
            <path d="M7 11h10" />
            <path d="M9 3h6v3H9z" />
          </svg>
        </span>
        <span class="patient-prescription-stat-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="4" y="4" width="16" height="6" rx="1.5" />
            <rect x="4" y="14" width="16" height="6" rx="1.5" />
          </svg>
        </span>
        <span>{{ labels.totalPrescriptions }}</span>
        <strong>{{ prescriptionItems.length }}</strong>
      </article>
      <article class="patient-prescription-stat green">
        <span class="patient-prescription-stat-watermark" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.5 3.5 20.5 13.5a4.2 4.2 0 1 1 -6 6L4.5 9.5a4.2 4.2 0 1 1 6-6Z" />
            <path d="M7 13l4 4" />
          </svg>
        </span>
        <span class="patient-prescription-stat-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 12h4l2-7 4 14 2-7h6" />
          </svg>
        </span>
        <span>{{ labels.activeMedicines }}</span>
        <strong>{{ activeMedicineCount }}</strong>
      </article>
      <article class="patient-prescription-stat amber">
        <span class="patient-prescription-stat-watermark" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4.5" width="18" height="16" rx="3" />
            <path d="M16 2.5v4M8 2.5v4M3 10h18" />
          </svg>
        </span>
        <span class="patient-prescription-stat-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3.5 2" />
          </svg>
        </span>
        <span>{{ labels.latestPrescription }}</span>
        <strong>{{ latestPrescriptionDay }}</strong>
        <small v-if="latestPrescriptionTime" class="patient-prescriptions-stat-time">{{ latestPrescriptionTime }}</small>
      </article>
    </div>

    <div class="patient-prescriptions-filter">
      <button type="button" :class="{ active: statusFilter === 'all' }" @click="statusFilter = 'all'">
        {{ labels.all }}
      </button>
      <button type="button" :class="{ active: statusFilter === 'active' }" @click="statusFilter = 'active'">
        {{ labels.active }}
      </button>
      <button type="button" :class="{ active: statusFilter === 'completed' }" @click="statusFilter = 'completed'">
        {{ labels.completed }}
      </button>
    </div>

    <p v-if="loading" class="clinical-empty-card">{{ labels.loading }}</p>

    <div v-else-if="filteredPrescriptionItems.length" class="patient-prescriptions-carousel">
      <div
        class="patient-prescriptions-viewport"
        @pointerdown="onPrescriptionSwipeStart"
        @pointerup="onPrescriptionSwipeEnd"
      >
        <div
          class="patient-prescriptions-track"
          :style="{ transform: `translateX(-${activePrescriptionPage * 100}%)` }"
        >
          <article
            v-for="item in filteredPrescriptionItems"
            :key="item.id"
            class="patient-prescription-card"
            :class="item.statusKey"
          >
            <small class="patient-prescription-code-label patient-prescription-code-top app-code">
              <span class="patient-prescription-code-label-text">{{ labels.prescriptionCode }}</span>
              {{ item.prescription?.code || item.prescription?.id || '-' }}
            </small>

            <div class="patient-prescription-card-head">
              <span class="patient-prescription-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="7" y="6" width="10" height="15" rx="2" />
                  <path d="M7 11h10" />
                  <path d="M9 3h6v3H9z" />
                </svg>
              </span>
              <div>
                <h2>{{ item.name }}</h2>
                <small class="patient-prescription-code-label patient-prescription-code-muted app-code">
                  <span class="patient-prescription-code-label-text">{{ labels.medicineCode }}</span>
                  {{ item.medicine?.code || item.detail.medicineId || '-' }}
                </small>
              </div>
              <span class="patient-prescription-status">{{ statusLabel(item.statusKey) }}</span>
            </div>

            <dl class="patient-prescription-metrics">
              <div>
                <dt>{{ labels.quantity }}</dt>
                <dd>{{ item.quantityLabel }}</dd>
              </div>
              <div>
                <dt>{{ labels.frequency }}</dt>
                <dd>{{ item.frequencyLabel }}</dd>
              </div>
              <div>
                <dt>{{ labels.duration }}</dt>
                <dd>{{ item.durationLabel }}</dd>
              </div>
            </dl>

            <div class="patient-prescription-source">
              <div>
                <strong>{{ labels.clinicalSource }}</strong>
                <p class="app-code">{{ item.record?.code ?? item.record?.id }}</p>
              </div>
              <div>
                <span>{{ t('patient.addedPrescription') }}</span>
                <p>{{ formatDate(item.issuedAt) }}</p>
                <small class="patient-prescription-subvalue">{{ formatTime(item.issuedAt) }}</small>
              </div>
              <div>
                <span>{{ labels.provider }}</span>
                <p>{{ item.appointment?.doctor?.fullName ?? labels.noProvider }}</p>
                <small v-if="item.appointment?.doctor" class="patient-prescription-subvalue app-code">{{ item.appointment.doctor.code || item.appointment.doctor.id }}</small>
              </div>
            </div>

            <footer class="patient-prescription-footer">
              <span>{{ labels.unitPrice }}: {{ item.priceLabel }}</span>
            </footer>
          </article>
        </div>
      </div>

      <div v-if="totalPrescriptionPages > 1" class="patient-prescriptions-nav">
        <button type="button" class="patient-prescriptions-arrow" @click="showPreviousPrescriptionCard">&#8249;</button>
        <span class="patient-prescriptions-dots">
          <span
            class="patient-prescriptions-dots-track"
            :style="{ transform: `translateX(-${prescriptionDotsOffset}px)` }"
          >
            <span
              v-for="dot in prescriptionDots"
              :key="dot.id"
              class="patient-prescriptions-dot"
              :class="{ active: dot.index === activePrescriptionPage }"
              @click="goToPrescriptionPage(dot.index)"
            ></span>
          </span>
        </span>
        <button type="button" class="patient-prescriptions-arrow" @click="showNextPrescriptionCard">&#8250;</button>
      </div>
    </div>

    <article v-else class="clinical-empty-card">
      <strong>{{ labels.noPrescriptions }}</strong>
      <p>{{ labels.noPrescriptionsBody }}</p>
    </article>
  </section>
</template>
