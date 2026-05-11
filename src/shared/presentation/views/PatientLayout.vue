<script setup>
import BaseLayout from '../components/BaseLayout.vue'
import PatientDashboard from "../../../modules/analytics/presentation/views/dashboards/PatientDashboard.vue";
import PatientAppointmentsView from "../../../modules/scheduling/presentation/views/PatientAppointmentsView.vue";
</script>

<template>
  <BaseLayout role="patient" v-slot="{ activeSection, activeMessage }">
    <PatientDashboard v-if="activeSection === 'dashboard'" />
    <PatientAppointmentsView v-else-if="activeSection === 'appointments'" />
    <p v-else class="section-work-message">{{ activeMessage }}</p>
  </BaseLayout>
</template>
