<script setup>
import BaseLayout from '../components/BaseLayout.vue'
import AdminDashboard from "../../../modules/analytics/presentation/views/dashboards/AdminDashboard.vue";
</script>

<template>
  <BaseLayout role="admin" v-slot="{ activeSection }">
    <AdminDashboard v-if="activeSection === 'dashboard'" />
  </BaseLayout>
</template>