<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Sidebar from './Sidebar.vue'
import LanguageSwitcher from './LanguageSwitcher.vue'
import RoleSwitcher from './RoleSwitcher.vue'
import useClinicalStore from '../../../modules/clinical/application/clinical.store.js'
import useTenantStore from '../../../modules/tenant/application/tenant.store.js'

const icon = {
  dashboard: '<svg viewBox="0 0 24 24"><path d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z"/></svg>',
  users: '<svg viewBox="0 0 24 24"><path d="M8.5 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm7.5.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM8.5 14C5.5 14 3 15.6 3 17.7V19h11v-1.3C14 15.6 11.5 14 8.5 14Zm7.5.5c-.8 0-1.5.1-2.1.4 1.2.8 2.1 1.8 2.1 3.1V19h5v-1.1c0-1.9-2.2-3.4-5-3.4Z"/></svg>',
  operations: '<svg viewBox="0 0 24 24"><path d="M11 4h2v4h4v2h-4v4h-2v-4H7V8h4V4Zm-6 8h2v6h10v-6h2v8H5v-8Z"/></svg>',
  billing: '<svg viewBox="0 0 24 24"><path d="M4 6h16v12H4V6Zm2 2v8h12V8H6Zm2 2h5v2H8v-2Zm0 3h8v1H8v-1Z"/></svg>',
  calendar: '<svg viewBox="0 0 24 24"><path d="M7 3h2v3h6V3h2v3h3v15H4V6h3V3Zm-1 8v8h12v-8H6Z"/></svg>',
  prescription: '<svg viewBox="0 0 24 24"><path d="M6 3h12v18H6V3Zm2 2v14h8V5H8Zm2 3h4v2h-4V8Zm0 4h4v2h-4v-2Z"/></svg>',
  history: '<svg viewBox="0 0 24 24"><path d="M12 5a7 7 0 1 1-6.2 3.8H3.5A9 9 0 1 0 12 3v2Zm-1 3h2v5h4v2h-6V8Z"/></svg>',
  orders: '<svg viewBox="0 0 24 24"><path d="M6 3h10l3 3v15H6V3Zm2 2v14h9V8h-3V5H8Zm2 5h5v2h-5v-2Zm0 4h5v2h-5v-2Z"/></svg>',
  settings: '<svg viewBox="0 0 24 24"><path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm8 5.2v-2.4l-2.1-.4c-.2-.6-.4-1.1-.7-1.6l1.2-1.8-1.7-1.7-1.8 1.2c-.5-.3-1-.5-1.6-.7L13 3h-2l-.4 2.1c-.6.2-1.1.4-1.6.7L7.2 4.6 5.5 6.3l1.2 1.8c-.3.5-.5 1-.7 1.6l-2 .4v2.4l2 .4c.2.6.4 1.1.7 1.6l-1.2 1.8 1.7 1.7 1.8-1.2c.5.3 1 .5 1.6.7L11 21h2l.4-2.1c.6-.2 1.1-.4 1.6-.7l1.8 1.2 1.7-1.7-1.2-1.8c.3-.5.5-1 .7-1.6l2-.4Z"/></svg>',
  profile: '<svg viewBox="0 0 24 24"><path d="M12 12.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-3.6 0-6.5 1.8-6.5 4v.5h13v-.5c0-2.2-2.9-4-6.5-4Z"/></svg>',
  signOut: '<svg viewBox="0 0 24 24"><path d="M5 4h8v2H7v12h6v2H5V4Zm11.6 4.4L20.2 12l-3.6 3.6-1.4-1.4 1.2-1.2H10v-2h6.4l-1.2-1.2 1.4-1.4Z"/></svg>'
}

const props = defineProps({
  role: {
    type: String,
    default: 'admin'
  }
})

const { t, locale } = useI18n()
const CURRENT_DOCTOR_ID = 'doc-001'
const CURRENT_PATIENT_ID = 'pat-001'
const clinicalStore = useClinicalStore()
const tenantStore = useTenantStore()

const schedulingSectionByRole = {
  admin: 'operations',
  doctor: 'agenda',
  patient: 'appointments'
}

const activeSection = ref('dashboard')
const notificationOpen = ref(false)
const helpOpen = ref(false)
const sectionWorkLabels = {
  dashboard: 'Dashboard',
  users: 'Users',
  operations: 'Operations',
  billing: 'Billing',
  settings: 'Clinic Settings',
  appointments: 'Appointments',
  prescriptions: 'Prescriptions',
  history: 'History',
  patients: 'Patients',
  agenda: 'Agenda',
  orders: 'Orders',
  profile: 'Profile'
}

const roleConfig = computed(() => {
  const configs = {
    admin: {
      userLabel: '',
      items: [
        { id: 'dashboard', key: 'nav.dashboard', icon: icon.dashboard },
        { id: 'users', key: 'nav.users', icon: icon.users },
        { id: 'operations', key: 'nav.operations', icon: icon.operations },
        { id: 'billing', key: 'nav.billing', icon: icon.billing }
      ],
      secondaryItems: [
        { id: 'settings', key: 'nav.clinicSettings', icon: icon.settings },
        { id: 'profile', key: 'nav.profile_admin', icon: icon.profile },
        { id: 'signOut', key: 'nav.signOut', icon: icon.signOut, tone: 'danger' }
      ]
    },
    patient: {
      userLabel: '',
      items: [
        { id: 'dashboard', key: 'nav.dashboard', icon: icon.dashboard },
        { id: 'appointments', key: 'nav.appointments', icon: icon.calendar },
        { id: 'prescriptions', key: 'nav.prescriptions', icon: icon.prescription },
        { id: 'history', key: 'nav.history', icon: icon.history }
      ],
      secondaryItems: [
        { id: 'profile', key: 'nav.profile_patient', icon: icon.profile },
        { id: 'signOut', key: 'nav.signOut', icon: icon.signOut, tone: 'danger' }
      ]
    },
    doctor: {
      userLabel: '',
      items: [
        { id: 'dashboard', key: 'nav.dashboard', icon: icon.dashboard },
        { id: 'patients', key: 'nav.patients', icon: icon.users },
        { id: 'agenda', key: 'nav.agenda', icon: icon.calendar },
        { id: 'orders', key: 'nav.orders', icon: icon.orders }
      ],
      secondaryItems: [
        { id: 'profile', key: 'nav.profile_doctor', icon: icon.profile },
        { id: 'signOut', key: 'nav.signOut', icon: icon.signOut, tone: 'danger' }
      ]
    }
  }

  return configs[props.role] ?? configs.admin
})

const navItems = computed(() =>
  roleConfig.value.items.map((item) => ({ ...item, label: t(item.key) }))
)

const secondaryItems = computed(() =>
  roleConfig.value.secondaryItems.map((item) => ({
    ...item,
    label: props.role === 'doctor' && item.id === 'profile'
      ? doctorProfileLabel.value
      : props.role === 'patient' && item.id === 'profile'
        ? patientProfileLabel.value
        : props.role === 'admin' && item.id === 'profile'
          ? adminProfileLabel.value
          : t(item.key)
  }))
)

const currentDate = computed(() => {
  const formatter = new Intl.DateTimeFormat(locale.value === 'es' ? 'es-PE' : 'en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  })

  return formatter.format(new Date())
})

const currentDoctor = computed(() => clinicalStore.getDoctorById(CURRENT_DOCTOR_ID) ?? clinicalStore.doctors[0])
const currentDoctorUser = computed(() => {
  if (!currentDoctor.value?.id_user) return tenantStore.users.find((item) => item.role === 'doctor')
  return tenantStore.users.find((item) => item.id === currentDoctor.value.id_user)
})

const doctorProfileLabel = computed(() => {
  const surname = currentDoctorUser.value?.paternal_surname
  const name = currentDoctorUser.value?.name
  return surname ? `Dr. ${surname}` : name ? `Dr. ${name}` : t('nav.profile_doctor')
})

const currentPatient = computed(() => clinicalStore.getPatientById(CURRENT_PATIENT_ID) ?? clinicalStore.patients[0])
const currentPatientUser = computed(() => {
  if (!currentPatient.value?.id_user) return tenantStore.users.find((item) => item.role === 'patient')
  return tenantStore.users.find((item) => item.id === currentPatient.value.id_user)
})

const patientProfileLabel = computed(() => {
  const fullName = [
    currentPatientUser.value?.name,
    currentPatientUser.value?.paternal_surname
  ].filter(Boolean).join(' ')

  return fullName || t('nav.profile_patient')
})

const currentAdminUser = computed(() => tenantStore.users.find((item) => item.role === 'admin'))

const adminProfileLabel = computed(() => {
  const fullName = [
    currentAdminUser.value?.name,
    currentAdminUser.value?.paternal_surname
  ].filter(Boolean).join(' ')

  return fullName || t('nav.profile_admin')
})

const activeMessage = computed(() => {
  const section = sectionWorkLabels[activeSection.value] ?? activeSection.value
  return `${section}-Works`
})

const selectSection = (section) => {
  if (section === 'signOut') return
  activeSection.value = section
  notificationOpen.value = false
  helpOpen.value = false
}

onMounted(() => {
  if (props.role === 'doctor') {
    if (!clinicalStore.doctorsLoaded) clinicalStore.fetchDoctors()
    if (!tenantStore.usersLoaded) tenantStore.fetchUsers()
  } else if (props.role === 'patient') {
    if (!clinicalStore.patientsLoaded) clinicalStore.fetchPatients()
    if (!tenantStore.usersLoaded) tenantStore.fetchUsers()
  } else if (props.role === 'admin') {
    if (!tenantStore.usersLoaded) tenantStore.fetchUsers()
  }
})

watch(
  () => props.role,
  () => {
    activeSection.value = 'dashboard'
  }
)
</script>

<template>
  <div class="app-shell" :data-role="role">
    <Sidebar
      :items="navItems"
      :secondary-items="secondaryItems"
      :active-section="activeSection"
      :user-label="roleConfig.userLabel"
      @select="selectSection"
    />

    <main class="workspace-shell">
      <header class="topbar">
        <p class="current-date">{{ currentDate }}</p>

        <div class="topbar-actions">
          <RoleSwitcher />
          <LanguageSwitcher />
          <div class="action-popover">
            <button
              class="icon-button"
              type="button"
              :aria-label="t('topbar.notifications')"
              @click="notificationOpen = !notificationOpen; helpOpen = false"
            >
              <svg viewBox="0 0 24 24"><path d="M12 22a2.4 2.4 0 0 0 2.3-1.8H9.7A2.4 2.4 0 0 0 12 22Zm7-5-1.7-2.1V10a5.3 5.3 0 0 0-4.3-5.2V3h-2v1.8A5.3 5.3 0 0 0 6.7 10v4.9L5 17v1h14v-1Z"/></svg>
              <span class="notification-dot"></span>
            </button>
            <div v-if="notificationOpen" class="popover-panel">
              <strong>{{ t('topbar.notifications') }}</strong>
              <p>{{ t('topbar.notificationMessage') }}</p>
            </div>
          </div>

          <div class="action-popover">
            <button
              class="icon-button"
              type="button"
              :aria-label="t('topbar.help')"
              @click="helpOpen = !helpOpen; notificationOpen = false"
            >
              <svg viewBox="0 0 24 24"><path d="M11 18h2v-2h-2v2Zm1-16a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm0-14a3.2 3.2 0 0 0-3.3 3.1h2A1.3 1.3 0 0 1 12 8a1.2 1.2 0 0 1 1.3 1.2c0 .8-.5 1.2-1.4 1.8-1 .7-1.6 1.4-1.6 2.8V14h2v-.3c0-.7.3-1 1.2-1.6 1-.7 1.8-1.5 1.8-3A3.1 3.1 0 0 0 12 6Z"/></svg>
            </button>
            <div v-if="helpOpen" class="popover-panel">
              <strong>{{ t('topbar.help') }}</strong>
              <p>{{ t('topbar.helpMessage') }}</p>
            </div>
          </div>
        </div>
      </header>

      <slot :active-section="activeSection" :active-message="activeMessage">
        <p class="section-work-message">{{ activeMessage }}</p>
      </slot>
    </main>
  </div>
</template>
