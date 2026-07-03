<script setup>
import { computed } from "vue";
import { useAuthStore } from "../../application/auth-store.js";
import AdminDashboard from "../../../modules/analytics/presentation/views/dashboards/AdminDashboard.vue";
import DoctorDashboard from "../../../modules/analytics/presentation/views/dashboards/DoctorDashboard.vue";
import PatientDashboard from "../../../modules/analytics/presentation/views/dashboards/PatientDashboard.vue";

const authStore = useAuthStore();
const component = computed(() => authStore.currentUserRole === "doctor"
  ? DoctorDashboard
  : authStore.currentUserRole === "patient"
    ? PatientDashboard
    : AdminDashboard);
</script>

<template>
  <component :is="component" />
</template>
