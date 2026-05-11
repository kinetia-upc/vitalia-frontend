<script setup>
import BaseLayout from '../components/BaseLayout.vue'
import PatientDashboard from "../../../modules/analytics/presentation/views/dashboards/PatientDashboard.vue";
</script>

<template>
  <BaseLayout role="patient" v-slot="{ activeSection }">
    <PatientDashboard v-if="activeSection === 'dashboard'" />
  </BaseLayout>
</template>
