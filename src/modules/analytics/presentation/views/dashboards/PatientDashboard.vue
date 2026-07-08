<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSchedulingStore } from '../../../../scheduling/application/scheduling-store.js'
import useClinicalStore from '../../../../clinical/application/clinical.store.js'
import usePharmacyStore from '../../../../pharmacy/application/pharmacy.store.js'
import useTenantStore from '../../../../tenant/application/tenant.store.js'
import { useAuthStore } from '../../../../../shared/application/auth-store.js'

defineEmits(['book-appointment', 'view-history', 'view-prescriptions'])

const { t, locale } = useI18n()

const ADDED_LABEL_KEYS = {
  Dx: 'patient.addedDiagnosis',
  Tx: 'patient.addedTreatment',
  Rx: 'patient.addedPrescription',
  Dr: 'patient.addedLabel'
}

const MODIFIED_LABEL_KEYS = {
  Dx: 'patient.modifiedDiagnosis',
  Tx: 'patient.modifiedTreatment',
  Rx: 'patient.modifiedPrescription',
  Dr: 'patient.modifiedLabel'
}

function changeLabelFor(createdAt, updatedAt, type) {
  const wasModified = createdAt && updatedAt && new Date(updatedAt).getTime() !== new Date(createdAt).getTime()
  const keys = wasModified ? MODIFIED_LABEL_KEYS : ADDED_LABEL_KEYS
  return t(keys[type] ?? keys.Dr)
}
const authStore = useAuthStore()
const CURRENT_PATIENT_ID = computed(() => authStore.currentPatientId)
const schedulingStore = useSchedulingStore()
const clinicalStore = useClinicalStore()
const pharmacyStore = usePharmacyStore()
const tenantStore = useTenantStore()

onMounted(() => {
  if (!schedulingStore.loaded) schedulingStore.fetchSchedulingData()
  if (!clinicalStore.patientsLoaded) clinicalStore.fetchPatients()
  if (!clinicalStore.medicalRecordsLoaded) clinicalStore.fetchMedicalRecords()
  if (!clinicalStore.diagnosesLoaded) clinicalStore.fetchDiagnoses()
  if (!clinicalStore.treatmentsLoaded) clinicalStore.fetchTreatments()
  if (!clinicalStore.prescriptionsLoaded) clinicalStore.fetchPrescriptions()
  if (!clinicalStore.prescriptionDetailsLoaded) clinicalStore.fetchPrescriptionDetails()
  if (!pharmacyStore.medicinesLoaded) pharmacyStore.fetchMedicines()
  if (!tenantStore.usersLoaded) tenantStore.fetchUsers()
})

const patient = computed(() => clinicalStore.getPatientById(CURRENT_PATIENT_ID.value))
const user = computed(() => {
  if (authStore.currentUser?.role === 'patient') return authStore.currentUser
  if (!patient.value?.userId) return null
  return tenantStore.users.find((item) => String(item.id) === String(patient.value.userId))
})

const patientDisplayName = computed(() => {
  const fullName = [
    user.value?.name,
    user.value?.paternalSurname
  ].filter(Boolean).join(' ')

  return fullName || t('tenant.patientProfile.patientFallback')
})

const patientAppointments = computed(() =>
  schedulingStore.appointmentsWithDetails
    .filter((appointment) => appointment.patientId === CURRENT_PATIENT_ID.value)
    .sort((left, right) => new Date(left.scheduledAt) - new Date(right.scheduledAt))
)

const selectedAppointment = ref(null)

function closeDetailModal() {
  selectedAppointment.value = null
}

const activeAppointmentStatuses = ['scheduled', 'confirmed', 'arrived', 'inattention']

const upcomingAppointment = computed(() =>
  patientAppointments.value
    .filter((appointment) => activeAppointmentStatuses.includes(appointment.status))
    .sort((left, right) => new Date(left.scheduledAt) - new Date(right.scheduledAt))[0] ?? null
)

const lastReleasedAppointment = computed(() =>
  patientAppointments.value
    .filter((appointment) => appointment.status === 'released')
    .sort((left, right) => new Date(right.scheduledAt) - new Date(left.scheduledAt))[0] ?? null
)

const appointmentCards = computed(() => {
  const cards = []
  if (upcomingAppointment.value) cards.push({ kind: 'next', appointment: upcomingAppointment.value })
  if (lastReleasedAppointment.value) cards.push({ kind: 'last', appointment: lastReleasedAppointment.value })
  return cards
})

const activeCardIndex = ref(0)

watch(appointmentCards, () => {
  activeCardIndex.value = 0
})

function goToCard(index) {
  activeCardIndex.value = index
}

function showNextCard() {
  if (!appointmentCards.value.length) return
  activeCardIndex.value = (activeCardIndex.value + 1) % appointmentCards.value.length
}

function showPreviousCard() {
  if (!appointmentCards.value.length) return
  activeCardIndex.value = (activeCardIndex.value - 1 + appointmentCards.value.length) % appointmentCards.value.length
}

let swipeStartX = null

function onSwipeStart(event) {
  swipeStartX = event.clientX
}

function onSwipeEnd(event) {
  if (swipeStartX === null) return
  const delta = event.clientX - swipeStartX
  swipeStartX = null

  if (Math.abs(delta) < 40) return
  if (delta < 0) showNextCard()
  else showPreviousCard()
}

const activeCard = computed(() => appointmentCards.value[activeCardIndex.value] ?? null)
const closestAppointment = computed(() => activeCard.value?.appointment ?? null)

const activeCardLabel = computed(() => {
  if (!activeCard.value) return ''
  return activeCard.value.kind === 'next' ? t('patient.nextAppointment') : t('patient.lastAppointment')
})

const nextAppointmentDoctor = computed(() => {
  const doctorUser = tenantStore.users.find((item) => item.id === closestAppointment.value?.doctor?.userId)
  const fullName = [
    doctorUser?.name,
    doctorUser?.paternalSurname
  ].filter(Boolean).join(' ')

  if (fullName) return `Dr. ${fullName}`
  return closestAppointment.value?.doctor?.fullName || t('patient.noUpcomingAppointmentTitle')
})

const nextAppointmentReason = computed(() =>
  closestAppointment.value?.reason || t('patient.noUpcomingAppointment')
)

const nextAppointmentDate = computed(() =>
  closestAppointment.value ? formatLongDate(closestAppointment.value.scheduledAt) : '-'
)

const nextAppointmentTime = computed(() =>
  closestAppointment.value ? formatTime(closestAppointment.value.scheduledAt) : '-'
)

const detailLabels = computed(() => ({
  title: t('patient.appointmentSummaryTitle'),
  appointmentId: t('patient.appointmentIdLabel'),
  doctor: t('scheduling.patientAppointments.doctor'),
  clinic: t('scheduling.patientAppointments.clinic'),
  date: t('patient.date'),
  time: t('patient.time')
}))

const patientMedicalRecords = computed(() =>
  clinicalStore.medicalRecords
    .filter((record) =>
      record.patientId === CURRENT_PATIENT_ID.value &&
      record.updatedAt &&
      new Date(record.updatedAt) <= new Date()
    )
    .sort((left, right) => new Date(right.updatedAt) - new Date(left.updatedAt))
)

const interactionGroupOrder = ['Dx', 'Tx', 'Rx', 'Dr']
const interactionGroupLabels = {
  Dx: 'patient.diagnosesGroup',
  Tx: 'patient.treatmentsGroup',
  Rx: 'patient.prescriptionsGroup',
  Dr: 'patient.physicianNote'
}
const INTERACTION_PAGE_SIZE = 3

function groupInteractionsByType(recordId, items) {
  return interactionGroupOrder
    .map((icon) => ({
      key: `${recordId}-${icon}`,
      icon,
      labelKey: interactionGroupLabels[icon],
      items: items.filter((item) => item.icon === icon)
    }))
    .filter((group) => group.items.length)
}

const groupPage = ref({})

function groupPageCount(group) {
  return Math.max(1, Math.ceil(group.items.length / INTERACTION_PAGE_SIZE))
}

function visibleGroupItems(group) {
  const page = groupPage.value[group.key] ?? 0
  const start = page * INTERACTION_PAGE_SIZE
  return group.items.slice(start, start + INTERACTION_PAGE_SIZE)
}

function changeGroupPage(group, delta) {
  const pageCount = groupPageCount(group)
  const current = groupPage.value[group.key] ?? 0
  groupPage.value = {
    ...groupPage.value,
    [group.key]: (current + delta + pageCount) % pageCount
  }
}

const recentConsultations = computed(() =>
  patientMedicalRecords.value
    .map((record) => {
      const appointment = schedulingStore.appointmentsWithDetails.find((item) => item.id === record.appointmentId)
      const items = buildInteractions(record)
        .filter(Boolean)
        .sort((left, right) => new Date(right.dateValue) - new Date(left.dateValue))

      return {
        id: record.id,
        code: record.code,
        reason: appointment?.reason || record.code,
        dateLabel: formatShortDate(record.createdAt ?? record.updatedAt),
        dateValue: items[0]?.dateValue ?? record.updatedAt,
        groups: groupInteractionsByType(record.id, items)
      }
    })
    .filter((consultation) => consultation.groups.length)
    .sort((left, right) => new Date(right.dateValue) - new Date(left.dateValue))
    .slice(0, 10)
)

const MAX_VISIBLE_CONSULTATION_DOTS = 3

const activeConsultationIndex = ref(0)

watch(recentConsultations, () => {
  activeConsultationIndex.value = 0
})

function goToConsultation(index) {
  activeConsultationIndex.value = index
}

function showNextConsultation() {
  if (!recentConsultations.value.length) return
  activeConsultationIndex.value = (activeConsultationIndex.value + 1) % recentConsultations.value.length
}

function showPreviousConsultation() {
  if (!recentConsultations.value.length) return
  activeConsultationIndex.value = (activeConsultationIndex.value - 1 + recentConsultations.value.length) % recentConsultations.value.length
}

let consultationSwipeStartX = null

function onConsultationSwipeStart(event) {
  consultationSwipeStartX = event.clientX
}

function onConsultationSwipeEnd(event) {
  if (consultationSwipeStartX === null) return
  const delta = event.clientX - consultationSwipeStartX
  consultationSwipeStartX = null

  if (Math.abs(delta) < 40) return
  if (delta < 0) showNextConsultation()
  else showPreviousConsultation()
}

const activeConsultation = computed(() => recentConsultations.value[activeConsultationIndex.value] ?? null)

const visibleConsultationDots = computed(() => {
  const total = recentConsultations.value.length
  if (total <= MAX_VISIBLE_CONSULTATION_DOTS) {
    return recentConsultations.value.map((consultation, index) => ({ id: consultation.id, index }))
  }

  const maxStart = total - MAX_VISIBLE_CONSULTATION_DOTS
  const start = Math.min(Math.max(activeConsultationIndex.value - 1, 0), maxStart)

  return recentConsultations.value
    .slice(start, start + MAX_VISIBLE_CONSULTATION_DOTS)
    .map((consultation, offset) => ({ id: consultation.id, index: start + offset }))
})

function buildInteractions(record) {
  const appointment = schedulingStore.appointmentsWithDetails.find((item) => item.id === record.appointmentId)
  const diagnoses = clinicalStore.diagnoses.filter((item) => item.medicalRecordId === record.id)
  const treatments = clinicalStore.treatments.filter((item) => item.medicalRecordId === record.id)
  const prescription = clinicalStore.prescriptions.find((item) => item.medicalRecordId === record.id)
  const prescriptionDetails = clinicalStore.prescriptionDetails.filter((item) => item.prescriptionId === prescription?.id)
  const interactions = []

  prescriptionDetails.forEach((prescriptionDetail, index) => {
    const medicine = resolveMedicine(prescriptionDetail)
    const modifiedAt = prescriptionDetail.updatedAt ?? prescriptionDetail.createdAt ?? prescription?.createdAt ?? record.updatedAt
    interactions.push({
      id: `rx-${record.id}-${prescriptionDetail.id ?? index}`,
      title: t('patient.prescriptionUpdated'),
      description: formatPrescriptionInteraction(prescriptionDetail, medicine),
      dateLabel: formatShortDate(modifiedAt),
      dateValue: modifiedAt,
      changeLabel: changeLabelFor(prescriptionDetail.createdAt ?? prescription?.createdAt, prescriptionDetail.updatedAt, 'Rx'),
      icon: 'Rx',
      tone: 'green'
    })
  })

  diagnoses.forEach((diagnosis, index) => {
    const modifiedAt = diagnosis.updatedAt ?? diagnosis.createdAt ?? record.updatedAt
    interactions.push({
      id: `diagnosis-${record.id}-${diagnosis.id ?? index}`,
      title: t('patient.diagnosisRecorded'),
      description: diagnosis.description || appointment?.reason || record.code,
      dateLabel: formatShortDate(modifiedAt),
      dateValue: modifiedAt,
      changeLabel: changeLabelFor(diagnosis.createdAt, diagnosis.updatedAt, 'Dx'),
      icon: 'Dx',
      tone: 'amber'
    })
  })

  treatments.forEach((treatment, index) => {
    const modifiedAt = treatment.updatedAt ?? treatment.createdAt ?? record.updatedAt
    interactions.push({
      id: `treatment-${record.id}-${treatment.id ?? index}`,
      title: t('patient.treatmentUpdated'),
      description: treatment.description || appointment?.reason || record.code,
      dateLabel: formatShortDate(modifiedAt),
      dateValue: modifiedAt,
      changeLabel: changeLabelFor(treatment.createdAt, treatment.updatedAt, 'Tx'),
      icon: 'Tx',
      tone: 'teal'
    })
  })

  if (interactions.length) return interactions

  return [{
    id: `record-${record.id}`,
    title: t('patient.physicianNote'),
    description: appointment?.reason ?? record.code,
    dateLabel: formatShortDate(record.updatedAt),
    dateValue: record.updatedAt,
    changeLabel: changeLabelFor(record.createdAt, record.updatedAt),
    icon: 'Dr',
    tone: 'amber'
  }]
}

function resolveMedicine(detail) {
  const detailMedicineId = String(detail?.medicineId ?? '')
  const detailMedicineName = String(detail?.medicineName ?? '').trim().toLowerCase()

  return pharmacyStore.medicines.find((medicine) =>
    String(medicine.id) === detailMedicineId ||
    String(medicine.name ?? '').trim().toLowerCase() === detailMedicineName
  )
}

function formatPrescriptionInteraction(detail, medicine) {
  const medicineName = detail.medicineName || medicine?.name || t('clinical.patientPrescriptions.unknown')
  const presentation = medicine?.unitQuantity && medicine?.unitType
    ? `${medicine.unitQuantity}${medicine.unitType}`
    : ''
  const quantity = Number(detail.quantity) || 0
  const frequency = Number(detail.frequency) || 0
  const duration = Number(detail.duration) || 0
  const quantityUnit = quantity === 1 ? t('patient.unitSingular') : t('patient.unitPlural')
  const hourUnit = frequency === 1 ? t('patient.hourSingular') : t('patient.hourPlural')
  const dayUnit = duration === 1 ? t('patient.daySingular') : t('patient.dayPlural')
  const quantityLabel = `${quantity} ${quantityUnit}`
  const frequencyLabel = `${t('patient.everyLabel')} ${frequency} ${hourUnit}`
  const durationLabel = `${t('patient.forLabel')} ${duration} ${dayUnit}`

  return `${[medicineName, presentation].filter(Boolean).join(' ')} - ${quantityLabel} ${frequencyLabel} ${durationLabel}`
}

function formatLongDate(value) {
  return new Date(value).toLocaleDateString(locale.value === 'es' ? 'es-PE' : 'en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}

function formatShortDate(value) {
  const date = new Date(value).toLocaleDateString(locale.value === 'es' ? 'es-PE' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
  const time = new Date(value).toLocaleTimeString(locale.value === 'es' ? 'es-PE' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
  return `${date} · ${time}`
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString(locale.value === 'es' ? 'es-PE' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<template>
  <section class="dashboard-view patient-dashboard">
    <div class="patient-title">
      <h1>{{ t('patient.greeting', { patient: patientDisplayName }) }}</h1>
      <p>{{ t('patient.summary') }}</p>
    </div>

    <div class="patient-grid">
      <article
        class="panel next-appointment"
        :class="{ 'next-appointment-empty': !closestAppointment, 'last-appointment-card': activeCard?.kind === 'last' }"
        @pointerdown="onSwipeStart"
        @pointerup="onSwipeEnd"
      >
        <div v-if="appointmentCards.length > 1" class="appointment-card-nav">
          <button type="button" class="card-nav-arrow" @click="showPreviousCard">&#8249;</button>
          <span class="card-dots">
            <span
              v-for="(card, index) in appointmentCards"
              :key="card.kind"
              class="card-dot"
              :class="{ active: index === activeCardIndex }"
              @click="goToCard(index)"
            ></span>
          </span>
          <button type="button" class="card-nav-arrow" @click="showNextCard">&#8250;</button>
        </div>
        <small v-if="closestAppointment" class="appointment-card-label">{{ activeCardLabel }}</small>
        <h2>{{ closestAppointment ? nextAppointmentDoctor : t('patient.noUpcomingAppointmentTitle') }}</h2>
        <p>{{ nextAppointmentReason }}</p>
        <div v-if="closestAppointment" class="appointment-meta">
          <div>
            <small>{{ t('patient.appointmentDateLabel') }}</small>
            <strong>{{ nextAppointmentDate }}</strong>
          </div>
          <div>
            <small>{{ t('patient.time') }}</small>
            <strong>{{ nextAppointmentTime }}</strong>
          </div>
        </div>
        <div v-if="closestAppointment" class="appointment-actions">
          <button type="button" class="primary-action" @click="selectedAppointment = closestAppointment">{{ t('patient.viewDetails') }}</button>
        </div>
      </article>

      <div class="quick-actions">
        <button type="button" class="quick-card" @click="$emit('book-appointment')">
          <span class="quick-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4.5" width="18" height="16" rx="3" />
              <path d="M16 2.5v4M8 2.5v4M3 10h18" />
              <path d="M12 14v6M9 17h6" />
            </svg>
          </span>
          <strong>{{ t('patient.bookAppointment') }}</strong>
          <small>{{ t('patient.bookCaption') }}</small>
        </button>
        <button type="button" class="quick-card amber" @click="$emit('view-prescriptions')">
          <span class="quick-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10.5 3.5 20.5 13.5a4.2 4.2 0 1 1 -6 6L4.5 9.5a4.2 4.2 0 1 1 6-6Z" />
              <path d="M7 13l4 4" />
            </svg>
          </span>
          <strong>{{ t('patient.viewPrescriptions') }}</strong>
          <small>{{ t('patient.prescriptionsCaption') }}</small>
        </button>
      </div>

      <article v-if="recentConsultations.length" class="panel interactions-panel">
        <div class="panel-heading">
          <h2>{{ t('patient.recentInteractions') }}</h2>
          <div class="panel-heading-action">
            <small class="panel-subtitle">{{ t('patient.recentInteractionsSubtitle') }}</small>
            <button type="button" @click="$emit('view-history')">{{ t('patient.viewAllHistory') }}</button>
          </div>
        </div>
        <div
          class="consultation-carousel"
          @pointerdown="onConsultationSwipeStart"
          @pointerup="onConsultationSwipeEnd"
        >
          <div v-if="recentConsultations.length > 1" class="appointment-card-nav">
            <button type="button" class="card-nav-arrow" @click="showPreviousConsultation">&#8249;</button>
            <span class="card-dots">
              <span
                v-for="dot in visibleConsultationDots"
                :key="dot.id"
                class="card-dot"
                :class="{ active: dot.index === activeConsultationIndex }"
                @click="goToConsultation(dot.index)"
              ></span>
            </span>
            <button type="button" class="card-nav-arrow" @click="showNextConsultation">&#8250;</button>
          </div>
          <div v-if="activeConsultation" class="consultation-group">
            <div class="consultation-header">
              <span class="consultation-title">
                <strong>{{ t('patient.consultationLabel') }}: {{ activeConsultation.reason }}</strong>
                <span class="consultation-id app-code">{{ activeConsultation.code }}</span>
              </span>
              <div class="date-stamp">
                <small class="date-stamp-label">{{ t('patient.generatedLabel') }}</small>
                <small class="date-stamp-value">{{ activeConsultation.dateLabel }}</small>
              </div>
            </div>
            <div class="interaction-groups-grid">
              <div v-for="group in activeConsultation.groups" :key="group.key" class="interaction-group">
                <div class="interaction-group-header">
                  <span class="interaction-group-icon">{{ group.icon }}</span>
                  <h3 class="interaction-group-title">{{ t(group.labelKey) }}</h3>
                  <span class="interaction-group-count">{{ group.items.length }}</span>
                  <div v-if="group.items.length > 3" class="interaction-group-nav">
                    <button type="button" class="card-nav-arrow" @click="changeGroupPage(group, -1)">&#8249;</button>
                    <button type="button" class="card-nav-arrow" @click="changeGroupPage(group, 1)">&#8250;</button>
                  </div>
                </div>
                <div class="interaction-list">
                  <div v-for="interaction in visibleGroupItems(group)" :key="interaction.id" class="interaction-item">
                    <span class="interaction-bullet"></span>
                    <div>
                      <p>{{ interaction.description }}</p>
                    </div>
                    <div class="date-stamp">
                      <small class="date-stamp-label">{{ interaction.changeLabel }}</small>
                      <small class="date-stamp-value">{{ interaction.dateLabel }}</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>

    <div v-if="selectedAppointment" class="modal-backdrop" @click.self="closeDetailModal">
      <article class="schedule-dialog appointment-detail-dialog panel">
        <div class="panel-heading">
          <div>
            <h2>{{ detailLabels.title }}</h2>
            <p>{{ selectedAppointment.reason }}</p>
          </div>
          <button class="text-action" type="button" @click="closeDetailModal">
            {{ t('scheduling.patientAppointments.close') }}
          </button>
        </div>

        <div class="appointment-detail-hero">
          <span class="avatar"></span>
          <div>
            <small>{{ detailLabels.doctor }}</small>
            <strong>{{ selectedAppointment.doctor?.fullName || '-' }}</strong>
            <p>{{ selectedAppointment.doctor?.specialty || '-' }}</p>
          </div>
        </div>

        <div class="appointment-detail-grid">
          <section>
            <small>{{ detailLabels.date }}</small>
            <strong>{{ formatLongDate(selectedAppointment.scheduledAt) }}</strong>
          </section>
          <section>
            <small>{{ detailLabels.time }}</small>
            <strong>{{ formatTime(selectedAppointment.scheduledAt) }}</strong>
          </section>
          <section>
            <small>{{ detailLabels.clinic }}</small>
            <strong>{{ selectedAppointment.branch?.name || '-' }}</strong>
            <span>{{ selectedAppointment.branch?.description || '' }}</span>
          </section>
          <section>
            <small>{{ detailLabels.appointmentId }}</small>
            <strong class="app-code">{{ selectedAppointment.code || selectedAppointment.id }}</strong>
          </section>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.next-appointment-empty {
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
}

.next-appointment-empty .appointment-actions {
  display: flex;
  justify-content: center;
  align-items: center;
}

.empty-state-action {
  display: inline-flex;
  width: fit-content;
  flex: 0 0 auto;
  align-self: center;
  padding: 0.75rem 1.25rem;
}

.next-appointment {
  touch-action: pan-y;
  transition: border-color 0.2s ease, background 0.2s ease;
  background: linear-gradient(135deg, rgba(97, 211, 216, 0.1), #343636 45%);
}

.last-appointment-card {
  border-left-color: var(--amber);
  background: linear-gradient(135deg, rgba(241, 166, 111, 0.1), #343636 45%);
}

.last-appointment-card .primary-action {
  background: linear-gradient(90deg, #f3bd8f, #e08a4f);
  color: #241505;
}

.appointment-card-label {
  display: block;
  color: var(--cyan);
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  font-size: 0.75rem;
  margin-bottom: 0.35rem;
}

.last-appointment-card .appointment-card-label {
  color: var(--amber);
}

.appointment-card-nav {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  margin-bottom: 0.5rem;
}

.card-nav-arrow {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #ffffff;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.4rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-nav-arrow:hover {
  background: rgba(109, 214, 219, 0.25);
  border-color: var(--cyan);
  color: var(--cyan);
}

.card-dots {
  display: flex;
  gap: 8px;
}

.card-dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.15);
  cursor: pointer;
}

.card-dot.active {
  background: var(--cyan);
  border-color: var(--cyan);
}

.last-appointment-card .card-dot.active {
  background: var(--amber);
  border-color: var(--amber);
}

.consultation-carousel {
  touch-action: pan-y;
}

.consultation-group {
  border: 1px solid var(--border, #303635);
  border-radius: 16px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.02);
}

.consultation-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 6px 12px;
}

.consultation-title {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
}

.consultation-header strong {
  color: #eef3f2;
  font-size: 14px;
}

.consultation-id {
  color: var(--muted, #a6b0ae);
  font-size: 12px;
  white-space: nowrap;
}

.consultation-header small {
  color: var(--muted, #a6b0ae);
  white-space: nowrap;
}

.interaction-groups-grid {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 14px;
  align-items: start;
}

.interaction-group {
  border-radius: 14px;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid var(--border, #303635);
  border-top: 3px solid #5b6462;
}

.interaction-group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.interaction-group-icon {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 6px;
  font-size: 9px;
  font-weight: 900;
  color: #d9e1e0;
  background: #535655;
}

.interaction-group-nav {
  display: flex;
  gap: 4px;
  margin-left: 8px;
}

.interaction-group-nav .card-nav-arrow {
  width: 22px;
  height: 22px;
  font-size: 0.9rem;
}

.interaction-group-title {
  margin: 0;
  color: #eef3f2;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.interaction-group-count {
  margin-left: auto;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: var(--muted, #a6b0ae);
  font-size: 11px;
  font-weight: 800;
}

.date-stamp {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  flex-shrink: 0;
}

.date-stamp-label {
  color: var(--muted, #a6b0ae);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 700;
  opacity: 0.8;
}

.date-stamp-value {
  color: #d6dfdd;
  font-size: 12px;
  white-space: nowrap;
}

.interaction-group .interaction-list {
  gap: 8px;
}

.interaction-group .interaction-item {
  min-height: 0;
  grid-template-columns: 10px 1fr auto;
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.03);
}

.interaction-group .interaction-item p {
  margin: 0;
  color: #d6dfdd;
  font-size: 13px;
  line-height: 1.4;
}

.interaction-bullet {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--muted, #a6b0ae);
}

</style>
