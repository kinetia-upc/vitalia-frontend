<script setup>
import { ref } from 'vue'
import BaseLayout from '../components/BaseLayout.vue'
import PatientDashboard from "../../../modules/analytics/presentation/views/dashboards/PatientDashboard.vue";
import PatientAppointmentsView from "../../../modules/scheduling/presentation/views/PatientAppointmentsView.vue";
import PatientHistoryView from "../../../modules/clinical/presentation/views/PatientHistoryView.vue";
import PatientPrescriptionsView from "../../../modules/clinical/presentation/views/PatientPrescriptionsView.vue";
import UserPatientView from "../../../modules/tenant/presentation/views/UserPatientView.vue";

const openBookingOnAppointments = ref(false)

function handleBookAppointment(selectSection) {
  openBookingOnAppointments.value = true
  selectSection('appointments')
}

function handleBookingIntentConsumed() {
  openBookingOnAppointments.value = false
}
</script>

<template>
  <BaseLayout role="patient" v-slot="{ activeSection, activeMessage, selectSection }">
    <PatientDashboard
      v-if="activeSection === 'dashboard'"
      @book-appointment="handleBookAppointment(selectSection)"
    />
    <PatientAppointmentsView
      v-else-if="activeSection === 'appointments'"
      :open-booking-on-enter="openBookingOnAppointments"
      @booking-intent-consumed="handleBookingIntentConsumed"
    />
    <PatientPrescriptionsView v-else-if="activeSection === 'prescriptions'" />
    <PatientHistoryView v-else-if="activeSection === 'history'" />
    <UserPatientView v-else-if="activeSection === 'profile'" />
    <p v-else class="section-work-message">{{ activeMessage }}</p>
  </BaseLayout>
</template>
