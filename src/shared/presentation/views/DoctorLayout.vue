<script setup>
import BaseLayout from '../components/BaseLayout.vue'
import DoctorDashboard from "../../../modules/analytics/presentation/views/dashboards/DoctorDashboard.vue";
</script>

<template>
  <BaseLayout role="doctor" v-slot="{ activeSection }">
    <DoctorDashboard v-if="activeSection === 'dashboard'" />
  </BaseLayout>
</template>
