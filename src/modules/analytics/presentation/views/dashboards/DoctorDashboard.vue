<script setup>
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import useClinicalStore from '../../../../clinical/application/clinical.store.js'
import useTenantStore from '../../../../tenant/application/tenant.store.js'

const { t } = useI18n()
const CURRENT_DOCTOR_ID = 'doc-001'
const clinicalStore = useClinicalStore()
const tenantStore = useTenantStore()

onMounted(() => {
  if (!clinicalStore.doctorsLoaded) clinicalStore.fetchDoctors()
  if (!tenantStore.usersLoaded) tenantStore.fetchUsers()
})

const doctor = computed(() => clinicalStore.getDoctorById(CURRENT_DOCTOR_ID) ?? clinicalStore.doctors[0])
const user = computed(() => {
  if (!doctor.value?.id_user) return tenantStore.users.find((item) => item.role === 'doctor')
  return tenantStore.users.find((item) => item.id === doctor.value.id_user)
})

const doctorDisplayName = computed(() => {
  const surname = user.value?.paternal_surname
  const name = user.value?.name
  return surname ? `Dr. ${surname}` : name ? `Dr. ${name}` : 'Doctor'
})

const appointments = [
  ['09:30', 'AM', 'Eleanor Rigby', 'Post-Op Consultation', 'Confirmed'],
  ['10:15', 'AM', 'Marcus Holloway', 'Routine Checkup', 'In Transit'],
  ['11:45', 'AM', 'Beatrice Thorne', 'Hypertension Follow-up', 'Priority'],
  ['2:30', 'PM', 'James Parker', 'Diabetes Screening', 'Priority'],
  ['9:15', 'AM', 'Lila Chen', 'Annual Check-up', 'Priority']
]

const trendBars = [45, 60, 68, 45, 92, 72, 46]
</script>

<template>
  <section class="dashboard-view doctor-dashboard">
    <div class="doctor-grid">
      <article class="panel doctor-hero">
        <h1>{{ t('doctor.greeting', { doctor: doctorDisplayName }) }}</h1>
        <p>{{ t('doctor.summary') }}</p>
        <div class="doctor-stats">
          <div>
            <span>{{ t('doctor.activePatients') }}</span>
            <strong>20</strong>
          </div>
          <div>
            <span>{{ t('doctor.appointments') }}</span>
            <strong>12</strong>
          </div>
          <div>
            <span>{{ t('doctor.pendingOrders') }}</span>
            <strong class="orange">08</strong>
          </div>
        </div>
      </article>

      <article class="panel urgent-task">
        <span class="pill-label">{{ t('doctor.urgentTask') }}</span>
        <h2>Patient Sarah Jenkins</h2>
        <p>Elevated Troponin levels detected in latest labs.</p>
        <button type="button" class="primary-action">{{ t('doctor.reviewLabResults') }}</button>
      </article>

      <article class="appointments-list">
        <div class="panel-heading">
          <h2>{{ t('doctor.upcomingAppointments') }}</h2>
          <button type="button">{{ t('doctor.viewFullCalendar') }}</button>
        </div>
        <div
          v-for="appointment in appointments"
          :key="`${appointment[0]}-${appointment[2]}`"
          class="doctor-appointment"
        >
          <time>
            <strong>{{ appointment[0] }}</strong>
            <span>{{ appointment[1] }}</span>
          </time>
          <span class="avatar"></span>
          <div>
            <strong>{{ appointment[2] }}</strong>
            <p>{{ appointment[3] }}</p>
          </div>
          <small>{{ appointment[4] }}</small>
        </div>
      </article>

      <aside class="doctor-side">
        <article class="panel trend-panel">
          <h2>{{ t('doctor.clinicalTrends') }}</h2>
          <div class="mini-chart">
            <span v-for="(bar, index) in trendBars" :key="index" :style="{ height: `${bar}%` }"></span>
          </div>
          <div class="trend-metrics">
            <div>
              <small>{{ t('doctor.avgStay') }}</small>
              <strong>2.4 Days</strong>
            </div>
            <div>
              <small>{{ t('doctor.bedOccupancy') }}</small>
              <strong>84%</strong>
            </div>
          </div>
        </article>

        <article class="panel pending-panel">
          <h2>{{ t('doctor.pendingOrders') }}</h2>
          <div class="pending-item">
            <span>Rx</span>
            <div>
              <strong>Insulin Refill Request</strong>
              <p>Patient David Miller - 2h ago</p>
            </div>
          </div>
          <div class="pending-item amber">
            <span>Lab</span>
            <div>
              <strong>Blood Panel Lab Order</strong>
              <p>Patient Sarah Jenkins - 4h ago</p>
            </div>
          </div>
          <button type="button" class="text-action">{{ t('doctor.manageOrders') }}</button>
        </article>
      </aside>
    </div>
  </section>
</template>
