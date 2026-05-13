<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSchedulingStore } from '../../../scheduling/application/scheduling-store.js'

const pageSize = 5

const seedOrders = [
  {
    id: 'ord-001',
    patientName: 'Eleanor Vance',
    patientCode: 'PT-8829',
    orderDate: '2026-04-04',
    type: 'labResults',
    detail: 'Comprehensive Metabolic Panel',
    context: 'Requested by Dr. Aris',
    priority: 'urgent',
    status: 'reviewResults'
  },
  {
    id: 'ord-002',
    patientName: 'Marcus Thorne',
    patientCode: 'PT-4412',
    orderDate: '2026-04-13',
    type: 'prescription',
    detail: 'Atorvastatin 20mg (90-day refill)',
    context: 'Chronic management',
    priority: 'routine',
    status: 'reviewResults'
  },
  {
    id: 'ord-003',
    patientName: 'Sienna West',
    patientCode: 'PT-2291',
    orderDate: '2026-04-17',
    type: 'imagingOrder',
    detail: 'Chest X-Ray (Posterior-Anterior)',
    context: 'Stat request - Room 402',
    priority: 'emergency',
    status: 'signOrder'
  },
  {
    id: 'ord-004',
    patientName: 'Julian Grant',
    patientCode: 'PT-1055',
    orderDate: '2026-04-18',
    type: 'referral',
    detail: 'Cardiology Consultation',
    context: 'Post-event follow-up',
    priority: 'urgent',
    status: 'signOrder'
  },
  {
    id: 'ord-005',
    patientName: 'James Chen',
    patientCode: 'PT-4231',
    orderDate: '2026-04-22',
    type: 'labResults',
    detail: 'Follow-up Metabolic Panel',
    context: 'Requested by Dr. Vital',
    priority: 'routine',
    status: 'authorize'
  }
]

const dictionaries = {
  en: {
    title: 'Orders',
    subtitle: 'Manage and authorize pending laboratory requests, diagnostic imaging, and clinical prescriptions.',
    totalPending: 'Total Pending',
    urgentLabReview: 'Urgent Lab Review',
    statusSummary: 'Status Summary',
    searchPlaceholder: 'Search orders...',
    allTypes: 'All Types',
    allStatuses: 'Status',
    newOrder: 'New Order',
    patientAndId: 'Patient & ID',
    orderDate: 'Order Date',
    orderType: 'Order Type',
    requestDetail: 'Request Detail',
    priority: 'Priority',
    status: 'Status',
    reviewResults: 'Review Results',
    signOrder: 'Sign Order',
    authorize: 'Authorize',
    routine: 'Routine',
    urgent: 'Urgent',
    emergency: 'Emergency',
    labResults: 'Lab Results',
    prescription: 'Prescription',
    imagingOrder: 'Imaging Order',
    referral: 'Referral',
    showing: (visible, total) => `Showing ${visible} of ${total} pending authorizations`,
    noResultsTitle: 'No orders match the current filters.',
    noResultsBody: 'Try another search term or reset the type and status filters.',
    createTitle: 'Create New Order',
    createBody: 'Capture a manual doctor order to keep it visible in the pending queue.',
    patient: 'Patient',
    detail: 'Request detail',
    detailPlaceholder: 'Ex. MRI with contrast, lipid panel, medication refill...',
    note: 'Context note',
    notePlaceholder: 'Add a short clinical note or requesting area.',
    requestedBy: 'Requested by',
    requestedByPlaceholder: 'Ex. Requested by Dr. Vance',
    selectPatient: 'Select patient',
    unknownPatient: 'Unknown Patient',
    createAction: 'Create Order',
    cancel: 'Cancel',
    previous: 'Previous',
    next: 'Next',
    menuLabel: 'Order actions'
  },
  es: {
    title: 'Ordenes',
    subtitle: 'Gestiona y autoriza solicitudes pendientes de laboratorio, imagenes diagnosticas y prescripciones clinicas.',
    totalPending: 'Pendientes totales',
    urgentLabReview: 'Revision urgente',
    statusSummary: 'Resumen de estado',
    searchPlaceholder: 'Buscar ordenes...',
    allTypes: 'Todos los tipos',
    allStatuses: 'Estado',
    newOrder: 'Nueva orden',
    patientAndId: 'Paciente e ID',
    orderDate: 'Fecha',
    orderType: 'Tipo',
    requestDetail: 'Detalle',
    priority: 'Prioridad',
    status: 'Estado',
    reviewResults: 'Revisar resultados',
    signOrder: 'Firmar orden',
    authorize: 'Autorizar',
    routine: 'Rutina',
    urgent: 'Urgente',
    emergency: 'Emergencia',
    labResults: 'Resultados lab',
    prescription: 'Receta',
    imagingOrder: 'Orden de imagen',
    referral: 'Referencia',
    showing: (visible, total) => `Mostrando ${visible} de ${total} autorizaciones pendientes`,
    noResultsTitle: 'No hay ordenes con los filtros actuales.',
    noResultsBody: 'Prueba otra busqueda o reinicia los filtros de tipo y estado.',
    createTitle: 'Crear nueva orden',
    createBody: 'Registra una orden manual del doctor para verla en la cola pendiente.',
    patient: 'Paciente',
    detail: 'Detalle de solicitud',
    detailPlaceholder: 'Ej. Resonancia con contraste, perfil lipidico, recarga de medicacion...',
    note: 'Nota de contexto',
    notePlaceholder: 'Agrega una nota clinica corta o el area solicitante.',
    requestedBy: 'Solicitado por',
    requestedByPlaceholder: 'Ej. Solicitado por Dr. Vance',
    selectPatient: 'Selecciona paciente',
    unknownPatient: 'Paciente no identificado',
    createAction: 'Crear orden',
    cancel: 'Cancelar',
    previous: 'Anterior',
    next: 'Siguiente',
    menuLabel: 'Acciones de la orden'
  }
}

const { locale } = useI18n()
const schedulingStore = useSchedulingStore()

const searchQuery = ref('')
const selectedType = ref('all')
const selectedStatus = ref('all')
const currentPage = ref(1)
const showCreateModal = ref(false)
const customOrders = ref([])
const createForm = ref(emptyForm())

onMounted(() => {
  if (!schedulingStore.loaded) schedulingStore.fetchSchedulingData()
})

const copy = computed(() => dictionaries[locale.value] ?? dictionaries.en)

const patientOptions = computed(() => {
  const knownPatients = schedulingStore.patients.map((patient, index) => ({
    key: patient.id,
    name: patient.fullName,
    code: `PT-${String(index + 2001).padStart(4, '0')}`
  }))

  const merged = [...knownPatients]
  seedOrders.forEach((order) => {
    if (!merged.some((patient) => patient.name === order.patientName)) {
      merged.push({
        key: order.id,
        name: order.patientName,
        code: order.patientCode
      })
    }
  })

  return merged
})

const typeOptions = computed(() => [
  { value: 'all', label: copy.value.allTypes },
  { value: 'labResults', label: copy.value.labResults },
  { value: 'prescription', label: copy.value.prescription },
  { value: 'imagingOrder', label: copy.value.imagingOrder },
  { value: 'referral', label: copy.value.referral }
])

const statusOptions = computed(() => [
  { value: 'all', label: copy.value.allStatuses },
  { value: 'reviewResults', label: copy.value.reviewResults },
  { value: 'signOrder', label: copy.value.signOrder },
  { value: 'authorize', label: copy.value.authorize }
])

const allOrders = computed(() =>
  [...customOrders.value, ...seedOrders].sort((left, right) => new Date(right.orderDate) - new Date(left.orderDate))
)

const filteredOrders = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return allOrders.value.filter((order) => {
    const matchesQuery = !query || [
      order.patientName,
      order.patientCode,
      order.detail,
      order.context,
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

const pendingCount = computed(() => allOrders.value.length)
const urgentCount = computed(() =>
  allOrders.value.filter((order) => order.priority !== 'routine' && order.status === 'reviewResults').length
)
const reviewCount = computed(() => allOrders.value.filter((order) => order.status === 'reviewResults').length)
const signCount = computed(() => allOrders.value.filter((order) => order.status === 'signOrder').length)
const authorizeCount = computed(() => allOrders.value.filter((order) => order.status === 'authorize').length)
const canCreateOrder = computed(() => createForm.value.patientKey && createForm.value.detail.trim())

watch([searchQuery, selectedType, selectedStatus], () => {
  currentPage.value = 1
})

function emptyForm() {
  return {
    patientKey: '',
    type: 'prescription',
    detail: '',
    note: '',
    requestedBy: 'Requested by Dr. Vance',
    priority: 'routine',
    status: 'authorize'
  }
}

function openCreateModal() {
  createForm.value = emptyForm()
  createForm.value.requestedBy = locale.value === 'es' ? 'Solicitado por Dr. Vance' : 'Requested by Dr. Vance'
  showCreateModal.value = true
}

function closeCreateModal() {
  showCreateModal.value = false
}

function createOrder() {
  if (!canCreateOrder.value) return

  const selectedPatientRecord = patientOptions.value.find((patient) => patient.key === createForm.value.patientKey)
  const nextCodeNumber = allOrders.value.length + 2290

  customOrders.value.unshift({
    id: `ord-${Date.now()}`,
    patientName: selectedPatientRecord?.name ?? copy.value.unknownPatient,
    patientCode: selectedPatientRecord?.code ?? `PT-${String(nextCodeNumber).padStart(4, '0')}`,
    orderDate: new Date().toISOString(),
    type: createForm.value.type,
    detail: createForm.value.detail.trim(),
    context: createForm.value.note.trim() || createForm.value.requestedBy.trim(),
    priority: createForm.value.priority,
    status: createForm.value.status
  })

  currentPage.value = 1
  closeCreateModal()
}

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

function initialsFor(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function typeGlyph(type) {
  return {
    labResults: 'L',
    prescription: 'Rx',
    imagingOrder: 'IM',
    referral: 'RF'
  }[type] ?? 'O'
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
      <article class="orders-stat-card">
        <span class="orders-stat-icon cyan">+</span>
        <strong>{{ pendingCount }}</strong>
        <p>{{ copy.totalPending }}</p>
      </article>

      <article class="orders-stat-card">
        <span class="orders-stat-icon amber">!</span>
        <strong>{{ urgentCount }}</strong>
        <p>{{ copy.urgentLabReview }}</p>
      </article>

      <article class="orders-stat-card summary-card">
        <h2>{{ copy.statusSummary }}</h2>
        <ul>
          <li>{{ reviewCount }} {{ copy.reviewResults }}</li>
          <li>{{ signCount }} {{ copy.signOrder }}</li>
          <li>{{ authorizeCount }} {{ copy.authorize }}</li>
        </ul>
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

          <button class="orders-primary-button" type="button" @click="openCreateModal">
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
              <div>
                <strong>{{ order.patientName }}</strong>
                <small>#{{ order.patientCode }}</small>
              </div>
            </div>

            <span class="orders-date-cell">{{ formatDate(order.orderDate) }}</span>

            <div class="orders-type-cell">
              <span class="orders-type-glyph">{{ typeGlyph(order.type) }}</span>
              <span>{{ typeLabel(order.type) }}</span>
            </div>

            <div class="orders-detail-cell">
              <strong>{{ order.detail }}</strong>
              <small>{{ order.context }}</small>
            </div>

            <span class="orders-badge" :class="`priority-${order.priority}`">
              {{ priorityLabel(order.priority) }}
            </span>

            <div class="orders-status-cell">
              <strong>{{ statusLabel(order.status) }}</strong>
              <button type="button" class="orders-menu-button" :aria-label="copy.menuLabel">...</button>
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

        <div class="orders-pagination-controls">
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
      <section class="orders-modal">
        <header>
          <div>
            <h2>{{ copy.createTitle }}</h2>
            <p>{{ copy.createBody }}</p>
          </div>
          <button type="button" class="orders-modal-close" @click="closeCreateModal">x</button>
        </header>

        <div class="orders-modal-grid">
          <label>
            <span>{{ copy.patient }}</span>
            <select v-model="createForm.patientKey">
              <option value="" disabled>{{ copy.selectPatient }}</option>
              <option v-for="patient in patientOptions" :key="patient.key" :value="patient.key">
                {{ patient.name }}
              </option>
            </select>
          </label>

          <label>
            <span>{{ copy.orderType }}</span>
            <select v-model="createForm.type">
              <option v-for="option in typeOptions.slice(1)" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>

          <label class="span-2">
            <span>{{ copy.detail }}</span>
            <input v-model="createForm.detail" type="text" :placeholder="copy.detailPlaceholder" />
          </label>

          <label>
            <span>{{ copy.priority }}</span>
            <select v-model="createForm.priority">
              <option value="routine">{{ copy.routine }}</option>
              <option value="urgent">{{ copy.urgent }}</option>
              <option value="emergency">{{ copy.emergency }}</option>
            </select>
          </label>

          <label>
            <span>{{ copy.status }}</span>
            <select v-model="createForm.status">
              <option value="reviewResults">{{ copy.reviewResults }}</option>
              <option value="signOrder">{{ copy.signOrder }}</option>
              <option value="authorize">{{ copy.authorize }}</option>
            </select>
          </label>

          <label class="span-2">
            <span>{{ copy.requestedBy }}</span>
            <input v-model="createForm.requestedBy" type="text" :placeholder="copy.requestedByPlaceholder" />
          </label>

          <label class="span-2">
            <span>{{ copy.note }}</span>
            <textarea v-model="createForm.note" rows="4" :placeholder="copy.notePlaceholder"></textarea>
          </label>
        </div>

        <footer class="orders-modal-actions">
          <button type="button" class="orders-secondary-button" @click="closeCreateModal">{{ copy.cancel }}</button>
          <button type="button" class="orders-primary-button" :disabled="!canCreateOrder" @click="createOrder">
            {{ copy.createAction }}
          </button>
        </footer>
      </section>
    </div>
  </section>
</template>
