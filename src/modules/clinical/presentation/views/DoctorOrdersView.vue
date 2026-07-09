<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import useClinicalStore from '../../application/clinical.store.js'
import useTenantStore from '../../../tenant/application/tenant.store.js'
import { useSchedulingStore } from '../../../scheduling/application/scheduling-store.js'
import { useAuthStore } from '../../../../shared/application/auth-store.js'

const pageSize = 4
const authStore = useAuthStore()
const CURRENT_DOCTOR_ID = computed(() => authStore.currentDoctorId)

const dictionaries = {
  en: {
    title: 'Orders',
    subtitle: 'Manage and authorize pending laboratory requests, diagnostic imaging, and clinical prescriptions.',
    totalPending: 'Total Pending',
    urgentLabReview: 'Urgent Review',
    emergencyReview: 'Emergency Review',
    searchPlaceholder: 'Search orders...',
    allTypes: 'All Types',
    allStatuses: 'Status',
    patientAndId: 'Patient / Medical Record',
    orderDate: 'Order Date',
    orderType: 'Order Type',
    requestDetail: 'Request Detail',
    priority: 'Priority',
    status: 'Status',
    pending: 'Pending',
    completed: 'Completed',
    routine: 'Routine',
    urgent: 'Urgent',
    emergency: 'Emergency',
    lab: 'Lab Results',
    imaging: 'Imaging Order',
    referral: 'Referral',
    showing: (visible, total) => `Showing ${visible} of ${total} orders`,
    noResultsTitle: 'No orders match the current filters.',
    noResultsBody: 'Try another search term or reset the type and status filters.',
    unknownPatient: 'Unknown Patient',
    previous: 'Previous',
    next: 'Next',
    newOrder: 'New Medical Order',
    createTitle: 'New Medical Order',
    createSubtitle: 'Link this order to one of the patient\'s consultations.',
    selectPatient: 'Patient',
    selectPatientPlaceholder: 'Select a patient',
    selectRecord: 'Consultation (medical record)',
    selectRecordPlaceholder: 'Select a consultation',
    noRecordsForPatient: 'This patient has no consultations yet.',
    recordPreviewTitle: 'Consultation loaded',
    recordDiagnosis: 'Diagnosis',
    recordTreatment: 'Treatment',
    noDiagnosis: 'No diagnosis recorded',
    noTreatment: 'No treatment recorded',
    newOrderType: 'Order type',
    selectType: 'Select a type',
    orderDescription: 'Description',
    orderDescriptionPlaceholder: 'Describe the requested lab work, imaging, or referral...',
    orderPriority: 'Priority',
    cancel: 'Cancel',
    createAction: 'Create order',
    creating: 'Creating...',
    createErrorGeneric: 'Could not create the order. Please try again.',
    resolveAction: 'Resolve',
    resolveTitle: 'Resolve medical order',
    resolveSubtitle: 'Record what was done and mark this order as completed.',
    resolveFirmado: 'Signed',
    resolveChecklistLabel: 'Check what applies',
    chipResultsReviewed: 'Results reviewed',
    chipFindingsDocumented: 'Findings documented',
    chipPatientNotified: 'Patient notified',
    chipFollowUpRequired: 'Follow-up required',
    resolveReviewLabel: 'Review notes',
    resolveReviewPlaceholder: 'Describe the findings, results, or actions taken...',
    resolveConfirm: 'Mark as completed',
    resolving: 'Completing...',
    resolveErrorGeneric: 'Could not complete the order. Please try again.'
  },
  es: {
    title: 'Ordenes',
    subtitle: 'Gestiona y autoriza solicitudes pendientes de laboratorio, imagenes diagnosticas y prescripciones clinicas.',
    totalPending: 'Pendientes totales',
    urgentLabReview: 'Revision urgente',
    emergencyReview: 'Revision emergencia',
    searchPlaceholder: 'Buscar ordenes...',
    allTypes: 'Todos los tipos',
    allStatuses: 'Estado',
    patientAndId: 'Paciente / Consulta',
    orderDate: 'Fecha',
    orderType: 'Tipo',
    requestDetail: 'Detalle',
    priority: 'Prioridad',
    status: 'Estado',
    pending: 'Pendiente',
    completed: 'Completado',
    routine: 'Rutina',
    urgent: 'Urgente',
    emergency: 'Emergencia',
    lab: 'Resultados lab',
    imaging: 'Orden de imagen',
    referral: 'Referencia',
    showing: (visible, total) => `Mostrando ${visible} de ${total} ordenes`,
    noResultsTitle: 'No hay ordenes con los filtros actuales.',
    noResultsBody: 'Prueba otra busqueda o reinicia los filtros de tipo y estado.',
    unknownPatient: 'Paciente no identificado',
    previous: 'Anterior',
    next: 'Siguiente',
    newOrder: 'Nueva orden médica',
    createTitle: 'Nueva orden médica',
    createSubtitle: 'Vincula esta orden a una de las consultas del paciente.',
    selectPatient: 'Paciente',
    selectPatientPlaceholder: 'Selecciona un paciente',
    selectRecord: 'Consulta (registro médico)',
    selectRecordPlaceholder: 'Selecciona una consulta',
    noRecordsForPatient: 'Este paciente aún no tiene consultas registradas.',
    recordPreviewTitle: 'Consulta cargada',
    recordDiagnosis: 'Diagnóstico',
    recordTreatment: 'Tratamiento',
    noDiagnosis: 'Sin diagnóstico registrado',
    noTreatment: 'Sin tratamiento registrado',
    newOrderType: 'Tipo de orden',
    selectType: 'Selecciona un tipo',
    orderDescription: 'Descripción',
    orderDescriptionPlaceholder: 'Describe el examen de laboratorio, imagen o referencia solicitada...',
    orderPriority: 'Prioridad',
    cancel: 'Cancelar',
    createAction: 'Crear orden',
    creating: 'Creando...',
    createErrorGeneric: 'No se pudo crear la orden. Intenta de nuevo.',
    resolveAction: 'Resolver',
    resolveTitle: 'Resolver orden médica',
    resolveSubtitle: 'Registra lo realizado y marca esta orden como completada.',
    resolveFirmado: 'Firmado',
    resolveChecklistLabel: 'Marca lo que corresponda',
    chipResultsReviewed: 'Resultados revisados',
    chipFindingsDocumented: 'Hallazgos documentados',
    chipPatientNotified: 'Paciente notificado',
    chipFollowUpRequired: 'Requiere seguimiento',
    resolveReviewLabel: 'Notas de revisión',
    resolveReviewPlaceholder: 'Describe los hallazgos, resultados o acciones realizadas...',
    resolveConfirm: 'Dar por concluida',
    resolving: 'Concluyendo...',
    resolveErrorGeneric: 'No se pudo completar la orden. Intenta de nuevo.'
  }
}

const { locale } = useI18n()
const clinicalStore = useClinicalStore()
const tenantStore = useTenantStore()
const schedulingStore = useSchedulingStore()

const searchQuery = ref('')
const selectedType = ref('all')
const selectedStatus = ref('all')
const currentPage = ref(1)

onMounted(() => {
  if (!clinicalStore.doctorsLoaded) clinicalStore.fetchDoctors()
  if (!clinicalStore.patientsLoaded) clinicalStore.fetchPatients()
  if (!clinicalStore.medicalRecordsLoaded) clinicalStore.fetchMedicalRecords()
  if (!clinicalStore.diagnosesLoaded) clinicalStore.fetchDiagnoses()
  if (!clinicalStore.treatmentsLoaded) clinicalStore.fetchTreatments()
  if (!tenantStore.usersLoaded) tenantStore.fetchUsers()
  schedulingStore.refreshSchedulingRoster()
  if (CURRENT_DOCTOR_ID.value) clinicalStore.fetchMedicalOrders({ doctorId: CURRENT_DOCTOR_ID.value })
})

watch(CURRENT_DOCTOR_ID, (doctorId) => {
  if (doctorId) clinicalStore.fetchMedicalOrders({ doctorId })
})

const copy = computed(() => dictionaries[locale.value] ?? dictionaries.en)

function patientDisplay(patientId) {
  const patient = clinicalStore.getPatientById(patientId)
  if (!patient) return { name: copy.value.unknownPatient, code: '' }

  const user = tenantStore.users.find((item) => String(item.id) === String(patient.userId))
  const name = [user?.name, user?.paternalSurname].filter(Boolean).join(' ')

  return {
    name: name || copy.value.unknownPatient,
    code: patient.ehrCode ?? ''
  }
}

const doctorPatientIds = computed(() => {
  const ids = new Set()
  for (const appointment of schedulingStore.appointmentsWithDetails) {
    if (String(appointment.doctorId) === String(CURRENT_DOCTOR_ID.value)) ids.add(String(appointment.patientId))
  }
  return ids
})

const doctorPatientOptions = computed(() =>
  clinicalStore.patients
    .filter((patient) => doctorPatientIds.value.has(String(patient.id)))
    .map((patient) => ({ id: patient.id, ...patientDisplay(patient.id) }))
    .sort((left, right) => left.name.localeCompare(right.name))
)

const showCreateModal = ref(false)
const isSubmitting = ref(false)
const createError = ref('')
const createForm = ref(emptyCreateForm())

function emptyCreateForm() {
  return {
    patientId: '',
    medicalRecordId: '',
    type: '',
    description: '',
    priority: 'routine'
  }
}

function openCreateModal() {
  createForm.value = emptyCreateForm()
  createError.value = ''
  showCreateModal.value = true
}

function closeCreateModal() {
  showCreateModal.value = false
}

watch(() => createForm.value.patientId, () => {
  createForm.value.medicalRecordId = ''
})

const selectedPatientRecords = computed(() => {
  if (!createForm.value.patientId) return []
  return clinicalStore.medicalRecords
    .filter((record) => String(record.patientId) === String(createForm.value.patientId))
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
})

const selectedMedicalRecord = computed(() =>
  selectedPatientRecords.value.find((record) => String(record.id) === String(createForm.value.medicalRecordId)) ?? null
)

const selectedRecordDiagnosis = computed(() => {
  if (!selectedMedicalRecord.value) return ''
  const diagnoses = clinicalStore.getDiagnosesByMedicalRecordId(selectedMedicalRecord.value.id)
  return diagnoses.map((diagnosis) => diagnosis.description).filter(Boolean).join(', ')
})

const selectedRecordTreatment = computed(() => {
  if (!selectedMedicalRecord.value) return ''
  const treatments = clinicalStore.getTreatmentsByMedicalRecordId(selectedMedicalRecord.value.id)
  return treatments.map((treatment) => treatment.description).filter(Boolean).join(', ')
})

const canSubmitCreateOrder = computed(() =>
  createForm.value.patientId &&
  createForm.value.medicalRecordId &&
  createForm.value.type &&
  createForm.value.description.trim().length > 0
)

async function submitCreateOrder() {
  if (!canSubmitCreateOrder.value || isSubmitting.value) return
  const record = selectedMedicalRecord.value
  if (!record) return

  isSubmitting.value = true
  createError.value = ''
  try {
    const code = await clinicalStore.generateNextMedicalOrderCode()
    await clinicalStore.createMedicalOrder({
      code,
      patientId: createForm.value.patientId,
      doctorId: CURRENT_DOCTOR_ID.value,
      appointmentId: record.appointmentId,
      medicalRecordId: record.id,
      type: createForm.value.type,
      description: createForm.value.description.trim(),
      status: 'pending',
      priority: createForm.value.priority
    })
    closeCreateModal()
  } catch (error) {
    createError.value = error?.response?.data?.detail
      ?? error?.response?.data?.title
      ?? error?.message
      ?? copy.value.createErrorGeneric
  } finally {
    isSubmitting.value = false
  }
}

const resolveChecklist = [
  { id: 'resultsReviewed', labelKey: 'chipResultsReviewed' },
  { id: 'findingsDocumented', labelKey: 'chipFindingsDocumented' },
  { id: 'patientNotified', labelKey: 'chipPatientNotified' },
  { id: 'followUpRequired', labelKey: 'chipFollowUpRequired' }
]

const showResolveModal = ref(false)
const resolvingOrder = ref(null)
const isResolving = ref(false)
const resolveError = ref('')
const selectedChips = ref([])
const resolveForm = ref({ signed: false, notes: '' })

function openResolveModal(order) {
  resolvingOrder.value = order
  resolveForm.value = { signed: false, notes: '' }
  selectedChips.value = []
  resolveError.value = ''
  showResolveModal.value = true
}

function closeResolveModal() {
  showResolveModal.value = false
}

function toggleChip(chipId) {
  const index = selectedChips.value.indexOf(chipId)
  if (index === -1) selectedChips.value.push(chipId)
  else selectedChips.value.splice(index, 1)
}

const canSubmitResolve = computed(() =>
  selectedChips.value.length > 0 || resolveForm.value.notes.trim().length > 0
)

function buildReviewText() {
  const lines = selectedChips.value.map((chipId) => {
    const chip = resolveChecklist.find((item) => item.id === chipId)
    return `- ${copy.value[chip.labelKey]}`
  })
  const notes = resolveForm.value.notes.trim()
  if (notes) lines.push(notes)
  return lines.join('\n')
}

async function submitResolveOrder() {
  if (!canSubmitResolve.value || isResolving.value || !resolvingOrder.value) return

  isResolving.value = true
  resolveError.value = ''
  try {
    await clinicalStore.completeMedicalOrder(resolvingOrder.value.id, {
      type: resolvingOrder.value.type,
      description: resolvingOrder.value.detail,
      status: 'completed',
      priority: resolvingOrder.value.priority,
      review: buildReviewText(),
      signed: resolveForm.value.signed
    })
    closeResolveModal()
  } catch (error) {
    resolveError.value = error?.response?.data?.detail
      ?? error?.response?.data?.title
      ?? error?.message
      ?? copy.value.resolveErrorGeneric
  } finally {
    isResolving.value = false
  }
}

function medicalRecordCodeFor(medicalRecordId) {
  if (!medicalRecordId) return ''
  return clinicalStore.medicalRecords.find((record) => String(record.id) === String(medicalRecordId))?.code ?? ''
}

const doctorOrders = computed(() =>
  clinicalStore.getMedicalOrdersByDoctorId(CURRENT_DOCTOR_ID.value).map((order) => {
    const patient = patientDisplay(order.patientId)
    return {
      id: order.id,
      code: order.code,
      patientName: patient.name,
      patientCode: patient.code,
      medicalRecordCode: medicalRecordCodeFor(order.medicalRecordId),
      orderDate: order.createdAt,
      updatedAt: order.updatedAt,
      type: order.type,
      detail: order.description,
      priority: order.priority,
      status: order.status,
      review: order.review,
      signed: order.signed
    }
  })
)

const typeOptions = computed(() => [
  { value: 'all', label: copy.value.allTypes },
  { value: 'lab', label: copy.value.lab },
  { value: 'imaging', label: copy.value.imaging },
  { value: 'referral', label: copy.value.referral }
])

const priorityOptions = computed(() => [
  { value: 'routine', label: copy.value.routine },
  { value: 'urgent', label: copy.value.urgent },
  { value: 'emergency', label: copy.value.emergency }
])

const statusOptions = computed(() => [
  { value: 'all', label: copy.value.allStatuses },
  { value: 'pending', label: copy.value.pending },
  { value: 'completed', label: copy.value.completed }
])

const filteredOrders = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return [...doctorOrders.value]
    .sort((left, right) => new Date(right.orderDate) - new Date(left.orderDate))
    .filter((order) => {
      const matchesQuery = !query || [
        order.patientName,
        order.patientCode,
        order.code,
        order.detail,
        typeLabel(order.type),
        statusLabel(order.status)
      ].join(' ').toLowerCase().includes(query)

      const matchesType = selectedType.value === 'all' || order.type === selectedType.value
      const matchesStatus = selectedStatus.value === 'all' || order.status === selectedStatus.value

      return matchesQuery && matchesType && matchesStatus
    })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredOrders.value.length / pageSize)))
const paginatedOrders = computed(() => {
  if (currentPage.value > totalPages.value) currentPage.value = totalPages.value
  const start = (currentPage.value - 1) * pageSize
  return filteredOrders.value.slice(start, start + pageSize)
})

const pageNumbers = computed(() => Array.from({ length: totalPages.value }, (_, index) => index + 1))

const pendingCount = computed(() => doctorOrders.value.filter((order) => order.status === 'pending').length)
const urgentCount = computed(() =>
  doctorOrders.value.filter((order) => order.priority === 'urgent' && order.status === 'pending').length
)
const emergencyCount = computed(() =>
  doctorOrders.value.filter((order) => order.priority === 'emergency' && order.status === 'pending').length
)

watch([searchQuery, selectedType, selectedStatus], () => {
  currentPage.value = 1
})

function typeLabel(type) {
  return copy.value[type] ?? type
}

function statusLabel(status) {
  return copy.value[status] ?? status
}

function priorityLabel(priority) {
  return copy.value[priority] ?? priority
}

function formatDate(dateValue) {
  return new Date(dateValue).toLocaleDateString(locale.value === 'es' ? 'es-PE' : 'en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}

function formatShortDate(dateValue) {
  return new Date(dateValue).toLocaleDateString(locale.value === 'es' ? 'es-PE' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

function initialsFor(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

const typeIconPaths = {
  lab: ['M9 3h6', 'M10 3v6.34a2 2 0 0 1-.4 1.2L5 17a2 2 0 0 0 1.6 3.2h10.8A2 2 0 0 0 19 17l-4.6-6.46a2 2 0 0 1-.4-1.2V3'],
  imaging: ['M3 4h18v16H3Z', 'M9 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z', 'm21 15-4.8-4.8a2 2 0 0 0-2.8 0L5 19'],
  referral: ['M4 12h13', 'm13 6 6 6-6 6'],
  prescription: ['M2.5 8.5h19v7h-19Z', 'M8.5 8.5v7', 'M15.5 8.5v7']
}

function typeIcon(type) {
  return typeIconPaths[type] ?? typeIconPaths.referral
}

function changePage(page) {
  currentPage.value = Math.min(Math.max(page, 1), totalPages.value)
}
</script>

<template>
  <section class="doctor-orders-view">
    <header class="orders-page-heading">
      <div>
        <h1>{{ copy.title }}</h1>
        <p>{{ copy.subtitle }}</p>
      </div>
    </header>

    <div class="orders-overview-grid">
      <article class="orders-stat-card stat-gray">
        <span class="orders-stat-icon gray" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1Z" />
            <rect x="6" y="4" width="12" height="16" rx="2" />
            <path d="M9 11h6M9 15h6" />
          </svg>
        </span>
        <strong>{{ pendingCount }}</strong>
        <p>{{ copy.totalPending }}</p>
      </article>

      <article class="orders-stat-card stat-amber">
        <span class="orders-stat-icon amber" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3 2 20h20Z" />
            <path d="M12 10v4" />
            <path d="M12 17h.01" />
          </svg>
        </span>
        <strong>{{ urgentCount }}</strong>
        <p>{{ copy.urgentLabReview }}</p>
      </article>

      <article class="orders-stat-card stat-red">
        <span class="orders-stat-icon red" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v6" />
            <path d="M12 16h.01" />
          </svg>
        </span>
        <strong>{{ emergencyCount }}</strong>
        <p>{{ copy.emergencyReview }}</p>
      </article>
    </div>

    <section class="orders-board panel">
      <div class="orders-toolbar">
        <label class="orders-search">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.5 4a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13Zm0 2a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Zm8.9 10.5 1.4 1.4-3.2 3.2-1.4-1.4 3.2-3.2Z"/></svg>
          <input v-model="searchQuery" type="search" :placeholder="copy.searchPlaceholder" />
        </label>

        <div class="orders-toolbar-actions">
          <select v-model="selectedType" class="orders-filter">
            <option v-for="option in typeOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>

          <select v-model="selectedStatus" class="orders-filter">
            <option v-for="option in statusOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>

          <button type="button" class="orders-primary-button" @click="openCreateModal">
            <span>+</span>
            {{ copy.newOrder }}
          </button>
        </div>
      </div>

      <div class="orders-table-shell">
        <div class="orders-table-head">
          <span>{{ copy.patientAndId }}</span>
          <span>{{ copy.orderDate }}</span>
          <span>{{ copy.orderType }}</span>
          <span>{{ copy.requestDetail }}</span>
          <span>{{ copy.priority }}</span>
          <span>{{ copy.status }}</span>
        </div>

        <div v-if="paginatedOrders.length" class="orders-table-body">
          <article v-for="order in paginatedOrders" :key="order.id" class="orders-row">
            <div class="orders-patient-cell">
              <span class="orders-avatar">{{ initialsFor(order.patientName) }}</span>
              <div class="orders-patient-info">
                <strong>{{ order.patientName }}</strong>
                <div class="orders-record-codes">
                  <span v-if="order.medicalRecordCode" class="app-code orders-record-code">{{ order.medicalRecordCode }}</span>
                  <span class="app-code orders-order-code">{{ order.code }}</span>
                </div>
              </div>
            </div>

            <div class="orders-date-cell">
              <span class="orders-date-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 9h18M7 3v4M17 3v4M5 5h14v15H5Z" />
                </svg>
              </span>
              {{ formatDate(order.orderDate) }}
            </div>

            <div class="orders-type-cell">
              <span class="orders-type-glyph">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path v-for="d in typeIcon(order.type)" :key="d" :d="d" />
                </svg>
              </span>
              <span>{{ typeLabel(order.type) }}</span>
            </div>

            <div class="orders-detail-cell">
              <strong>{{ order.detail }}</strong>
            </div>

            <span class="orders-badge" :class="`priority-${order.priority}`">
              {{ priorityLabel(order.priority) }}
            </span>

            <div class="orders-status-cell">
              <span class="orders-status-pill" :class="`status-${order.status}`">
                {{ statusLabel(order.status) }}
              </span>
              <span class="orders-status-date">
                {{ formatShortDate(order.status === 'completed' ? order.updatedAt : order.orderDate) }}
              </span>
              <button
                v-if="order.status === 'pending'"
                type="button"
                class="orders-resolve-button"
                @click="openResolveModal(order)"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="m5 12 5 5L20 7" />
                </svg>
                {{ copy.resolveAction }}
              </button>
            </div>
          </article>
        </div>

        <div v-else class="orders-empty-state">
          <strong>{{ copy.noResultsTitle }}</strong>
          <p>{{ copy.noResultsBody }}</p>
        </div>
      </div>

      <footer class="orders-pagination">
        <p>{{ copy.showing(paginatedOrders.length, filteredOrders.length) }}</p>

        <div v-if="totalPages > 1" class="orders-pagination-controls">
          <button type="button" @click="changePage(currentPage - 1)" :disabled="currentPage === 1">
            {{ copy.previous }}
          </button>
          <button
            v-for="page in pageNumbers"
            :key="page"
            type="button"
            :class="{ active: page === currentPage }"
            @click="changePage(page)"
          >
            {{ page }}
          </button>
          <button type="button" @click="changePage(currentPage + 1)" :disabled="currentPage === totalPages">
            {{ copy.next }}
          </button>
        </div>
      </footer>
    </section>

    <div v-if="showCreateModal" class="orders-modal-backdrop" @click.self="closeCreateModal">
      <section class="orders-modal create-order-modal">
        <header>
          <div class="create-order-heading">
            <span class="create-order-heading-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1Z" />
                <rect x="6" y="4" width="12" height="16" rx="2" />
                <path d="M9 11h6M9 15h4" />
                <path d="M17.5 15.5v3M16 17h3" />
              </svg>
            </span>
            <div>
              <h2>{{ copy.createTitle }}</h2>
              <p>{{ copy.createSubtitle }}</p>
            </div>
          </div>
          <button type="button" class="orders-modal-close" @click="closeCreateModal">x</button>
        </header>

        <div class="create-order-step">
          <span class="create-order-step-number">1</span>
          <div class="create-order-step-body">
            <label class="create-order-field">
              <span>{{ copy.selectPatient }}</span>
              <select v-model="createForm.patientId">
                <option value="" disabled>{{ copy.selectPatientPlaceholder }}</option>
                <option v-for="patient in doctorPatientOptions" :key="patient.id" :value="patient.id">
                  {{ patient.name }} · {{ patient.code }}
                </option>
              </select>
            </label>
          </div>
        </div>

        <div class="create-order-step" :class="{ 'is-disabled': !createForm.patientId }">
          <span class="create-order-step-number">2</span>
          <div class="create-order-step-body">
            <label class="create-order-field">
              <span>{{ copy.selectRecord }}</span>
              <select v-model="createForm.medicalRecordId" :disabled="!createForm.patientId">
                <option value="" disabled>{{ copy.selectRecordPlaceholder }}</option>
                <option v-for="record in selectedPatientRecords" :key="record.id" :value="record.id">
                  {{ record.code }} · {{ formatDate(record.createdAt) }}
                </option>
              </select>
            </label>

            <p v-if="createForm.patientId && !selectedPatientRecords.length" class="create-order-empty-hint">
              {{ copy.noRecordsForPatient }}
            </p>

            <Transition name="create-order-preview">
              <div v-if="selectedMedicalRecord" class="create-order-preview">
                <div class="create-order-preview-heading">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="m9 12 2 2 4-4" />
                    <circle cx="12" cy="12" r="9" />
                  </svg>
                  <span>{{ copy.recordPreviewTitle }}</span>
                  <span class="app-code create-order-preview-code">{{ selectedMedicalRecord.code }}</span>
                </div>
                <div class="create-order-preview-grid">
                  <div>
                    <small>{{ copy.recordDiagnosis }}</small>
                    <p>{{ selectedRecordDiagnosis || copy.noDiagnosis }}</p>
                  </div>
                  <div>
                    <small>{{ copy.recordTreatment }}</small>
                    <p>{{ selectedRecordTreatment || copy.noTreatment }}</p>
                  </div>
                </div>
              </div>
            </Transition>
          </div>
        </div>

        <div class="create-order-step" :class="{ 'is-disabled': !createForm.medicalRecordId }">
          <span class="create-order-step-number">3</span>
          <div class="create-order-step-body create-order-details-grid">
            <label class="create-order-field">
              <span>{{ copy.newOrderType }}</span>
              <select v-model="createForm.type" :disabled="!createForm.medicalRecordId">
                <option value="" disabled>{{ copy.selectType }}</option>
                <option v-for="option in typeOptions.slice(1)" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </label>

            <label class="create-order-field">
              <span>{{ copy.orderPriority }}</span>
              <select v-model="createForm.priority" :disabled="!createForm.medicalRecordId">
                <option v-for="option in priorityOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </label>

            <label class="create-order-field span-2">
              <span>{{ copy.orderDescription }}</span>
              <textarea
                v-model="createForm.description"
                rows="3"
                :disabled="!createForm.medicalRecordId"
                :placeholder="copy.orderDescriptionPlaceholder"
              ></textarea>
            </label>
          </div>
        </div>

        <p v-if="createError" class="create-order-error">{{ createError }}</p>

        <footer class="orders-modal-actions">
          <button type="button" class="orders-secondary-button" @click="closeCreateModal">{{ copy.cancel }}</button>
          <button
            type="button"
            class="orders-primary-button"
            :disabled="!canSubmitCreateOrder || isSubmitting"
            @click="submitCreateOrder"
          >
            {{ isSubmitting ? copy.creating : copy.createAction }}
          </button>
        </footer>
      </section>
    </div>

    <div v-if="showResolveModal" class="orders-modal-backdrop" @click.self="closeResolveModal">
      <section class="orders-modal resolve-order-modal">
        <header>
          <div class="create-order-heading">
            <span class="resolve-order-heading-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="m8.5 12.5 2.5 2.5 4.5-5" />
              </svg>
            </span>
            <div>
              <h2>{{ copy.resolveTitle }}</h2>
              <p>{{ copy.resolveSubtitle }}</p>
            </div>
          </div>
          <button type="button" class="orders-modal-close" @click="closeResolveModal">x</button>
        </header>

        <div v-if="resolvingOrder" class="resolve-order-summary">
          <div class="resolve-order-summary-row">
            <span class="app-code resolve-order-summary-code">{{ resolvingOrder.code }}</span>
            <span class="orders-badge" :class="`priority-${resolvingOrder.priority}`">
              {{ priorityLabel(resolvingOrder.priority) }}
            </span>
          </div>
          <strong>{{ resolvingOrder.patientName }}</strong>
          <p>{{ resolvingOrder.detail }}</p>
        </div>

        <label class="resolve-signed-toggle">
          <input type="checkbox" v-model="resolveForm.signed" />
          <span class="resolve-signed-switch" aria-hidden="true"></span>
          <span class="resolve-signed-label">{{ copy.resolveFirmado }}</span>
        </label>

        <div class="resolve-order-field">
          <span>{{ copy.resolveChecklistLabel }}</span>
          <div class="resolve-chip-grid">
            <button
              v-for="chip in resolveChecklist"
              :key="chip.id"
              type="button"
              class="resolve-chip"
              :class="{ selected: selectedChips.includes(chip.id) }"
              @click="toggleChip(chip.id)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="m5 12 5 5L20 7" />
              </svg>
              {{ copy[chip.labelKey] }}
            </button>
          </div>
        </div>

        <label class="create-order-field resolve-review-field">
          <span>{{ copy.resolveReviewLabel }}</span>
          <textarea
            v-model="resolveForm.notes"
            rows="4"
            :placeholder="copy.resolveReviewPlaceholder"
          ></textarea>
        </label>

        <p v-if="resolveError" class="create-order-error">{{ resolveError }}</p>

        <footer class="orders-modal-actions">
          <button type="button" class="orders-secondary-button" @click="closeResolveModal">{{ copy.cancel }}</button>
          <button
            type="button"
            class="orders-resolve-confirm"
            :disabled="!canSubmitResolve || isResolving"
            @click="submitResolveOrder"
          >
            {{ isResolving ? copy.resolving : copy.resolveConfirm }}
          </button>
        </footer>
      </section>
    </div>
  </section>
</template>
