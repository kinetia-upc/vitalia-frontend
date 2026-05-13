<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSchedulingStore } from '../../../scheduling/application/scheduling-store.js'
import useClinicalStore from '../../application/clinical.store.js'
import usePharmacyStore from '../../../pharmacy/application/pharmacy.store.js'

const CURRENT_PATIENT_ID = 'pat-001'

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
  dosage: t('clinical.patientPrescriptions.dosage'),
  frequency: t('clinical.patientPrescriptions.frequency'),
  duration: t('clinical.patientPrescriptions.duration'),
  stock: t('clinical.patientPrescriptions.stock'),
  prescribed: t('clinical.patientPrescriptions.prescribed'),
  record: t('clinical.patientPrescriptions.record'),
  provider: t('clinical.patientPrescriptions.provider'),
  unitPrice: t('clinical.patientPrescriptions.unitPrice'),
  clinicalSource: t('clinical.patientPrescriptions.clinicalSource'),
  noProvider: t('clinical.patientPrescriptions.noProvider'),
  noPrescriptions: t('clinical.patientPrescriptions.noPrescriptions'),
  noPrescriptionsBody: t('clinical.patientPrescriptions.noPrescriptionsBody'),
  loading: t('clinical.patientPrescriptions.loading'),
  units: t('clinical.patientPrescriptions.units'),
  unknown: t('clinical.patientPrescriptions.unknown')
}))

const patientMedicalRecords = computed(() =>
  clinicalStore.medicalRecords.filter((record) =>
    record.id_patient === CURRENT_PATIENT_ID || record.patientId === CURRENT_PATIENT_ID
  )
)

const patientMedicalRecordIds = computed(() =>
  new Set(patientMedicalRecords.value.map((record) => record.id))
)

const patientPrescriptions = computed(() =>
  clinicalStore.prescriptions.filter((prescription) =>
    patientMedicalRecordIds.value.has(prescription.id_medical_record ?? prescription.medicalRecordId)
  )
)

const prescriptionItems = computed(() =>
  patientPrescriptions.value.flatMap((prescription) => {
    const record = patientMedicalRecords.value.find((item) =>
      item.id === (prescription.id_medical_record ?? prescription.medicalRecordId)
    )
    const appointment = schedulingStore.appointmentsWithDetails.find((item) => item.id === record?.id_appointment)
    const details = clinicalStore.getPrescriptionDetailsByPrescriptionId(prescription.id)

    return details.map((detail) => {
      const medicine = resolveMedicine(detail)
      const issuedAt = prescription.date ?? record?.updated_at
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
        endsAt,
        name: detail.medicine_name || medicine?.name || labels.value.unknown,
        formType: detail.form_type || medicine?.unitType || labels.value.unknown,
        doseLabel: formatDose(detail),
        stockLabel: formatStock(medicine),
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

const totalStock = computed(() => {
  const seen = new Set()
  return prescriptionItems.value.reduce((total, item) => {
    if (!item.medicine?.id || seen.has(item.medicine.id)) return total
    seen.add(item.medicine.id)
    return total + (Number(item.medicine.stock) || 0)
  }, 0)
})

const latestPrescriptionDate = computed(() =>
  prescriptionItems.value[0]?.issuedAt ? formatDate(prescriptionItems.value[0].issuedAt) : '-'
)

const loading = computed(() =>
  !clinicalStore.medicalRecordsLoaded ||
  !clinicalStore.prescriptionsLoaded ||
  !clinicalStore.prescriptionDetailsLoaded ||
  !pharmacyStore.medicinesLoaded
)

function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function resolveMedicine(detail) {
  const detailMedicineId = String(detail.id_medicine ?? '')
  const detailMedicineName = normalize(detail.medicine_name)

  return pharmacyStore.medicines.find((medicine) =>
    String(medicine.id) === detailMedicineId ||
    normalize(medicine.name) === normalize(detail.id_medicine) ||
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
  const dose = detail.dose ? `${detail.dose}${detail.dose_unit_type ?? ''}` : labels.value.unknown
  return dose.replace(/\s+/g, '')
}

function formatStock(medicine) {
  if (!medicine || medicine.stock === undefined || medicine.stock === null) return '-'
  return `${medicine.stock} ${labels.value.units}`
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
  return new Date(value).toLocaleDateString(locale.value === 'es' ? 'es-PE' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

function statusLabel(statusKey) {
  return statusKey === 'completed' ? labels.value.completed : labels.value.active
}
</script>

<template>
  <section class="patient-prescriptions-view">
    <header class="patient-prescriptions-heading">
      <div>
        <h1>{{ labels.title }}</h1>
        <p>{{ labels.subtitle }}</p>
      </div>
      <div class="patient-prescriptions-search">
        <span>Rx</span>
        <input v-model="searchQuery" type="search" :placeholder="labels.searchPlaceholder">
      </div>
    </header>

    <div class="patient-prescriptions-stats">
      <article>
        <span>{{ labels.totalPrescriptions }}</span>
        <strong>{{ prescriptionItems.length }}</strong>
      </article>
      <article>
        <span>{{ labels.activeMedicines }}</span>
        <strong>{{ activeMedicineCount }}</strong>
      </article>
      <article>
        <span>{{ labels.pharmacyStock }}</span>
        <strong>{{ totalStock }}</strong>
      </article>
      <article>
        <span>{{ labels.latestPrescription }}</span>
        <strong>{{ latestPrescriptionDate }}</strong>
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

    <div v-else-if="filteredPrescriptionItems.length" class="patient-prescriptions-grid">
      <article
        v-for="item in filteredPrescriptionItems"
        :key="item.id"
        class="patient-prescription-card"
        :class="item.statusKey"
      >
        <div class="patient-prescription-card-head">
          <span class="patient-prescription-icon">Rx</span>
          <div>
            <h2>{{ item.name }}</h2>
            <p>{{ item.doseLabel }} - {{ item.formType }}</p>
          </div>
          <span class="patient-prescription-status">{{ statusLabel(item.statusKey) }}</span>
        </div>

        <dl class="patient-prescription-metrics">
          <div>
            <dt>{{ labels.dosage }}</dt>
            <dd>{{ item.doseLabel }}</dd>
          </div>
          <div>
            <dt>{{ labels.frequency }}</dt>
            <dd>{{ item.detail.frequency }}</dd>
          </div>
          <div>
            <dt>{{ labels.duration }}</dt>
            <dd>{{ item.detail.duration }}</dd>
          </div>
          <div>
            <dt>{{ labels.stock }}</dt>
            <dd>{{ item.stockLabel }}</dd>
          </div>
        </dl>

        <div class="patient-prescription-source">
          <div>
            <strong>{{ labels.clinicalSource }}</strong>
            <p>{{ labels.record }} {{ item.record?.code ?? item.record?.id }}</p>
          </div>
          <div>
            <span>{{ labels.prescribed }}</span>
            <p>{{ formatDate(item.issuedAt) }}</p>
          </div>
          <div>
            <span>{{ labels.provider }}</span>
            <p>{{ item.appointment?.doctor?.fullName ?? labels.noProvider }}</p>
          </div>
        </div>

        <footer class="patient-prescription-footer">
          <span>{{ labels.unitPrice }} {{ item.priceLabel }}</span>
          <span>{{ item.prescription.id }}</span>
        </footer>
      </article>
    </div>

    <article v-else class="clinical-empty-card">
      <strong>{{ labels.noPrescriptions }}</strong>
      <p>{{ labels.noPrescriptionsBody }}</p>
    </article>
  </section>
</template>
