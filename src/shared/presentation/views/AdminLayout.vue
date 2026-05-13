<script setup>
import BaseLayout from '../components/BaseLayout.vue'
import AdminDashboard from "../../../modules/analytics/presentation/views/dashboards/AdminDashboard.vue";
import AdminUsersView from "../../../modules/analytics/presentation/views/AdminUsersView.vue";
import AdminSchedulingView from "../../../modules/scheduling/presentation/views/AdminSchedulingView.vue";
</script>

<template>
  <BaseLayout role="admin" v-slot="{ activeSection, activeMessage }">
    <AdminDashboard v-if="activeSection === 'dashboard'" />
    <AdminUsersView v-else-if="activeSection === 'users'" />
    <AdminSchedulingView v-else-if="activeSection === 'operations'" />
    <p v-else class="section-work-message">{{ activeMessage }}</p>
  </BaseLayout>
</template>
