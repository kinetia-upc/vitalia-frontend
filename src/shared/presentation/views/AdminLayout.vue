<script setup>
import BaseLayout from '../components/BaseLayout.vue'
import AdminDashboard from "../../../modules/analytics/presentation/views/dashboards/AdminDashboard.vue";
import AdminSchedulingView from "../../../modules/scheduling/presentation/views/AdminSchedulingView.vue";
import UserAdminView from "../../../modules/tenant/presentation/views/UserAdminView.vue";
</script>

<template>
  <BaseLayout role="admin" v-slot="{ activeSection, activeMessage }">
    <AdminDashboard v-if="activeSection === 'dashboard'" />
    <AdminSchedulingView v-else-if="activeSection === 'operations'" />
    <UserAdminView v-else-if="activeSection === 'profile'" />
    <p v-else class="section-work-message">{{ activeMessage }}</p>
  </BaseLayout>
</template>
