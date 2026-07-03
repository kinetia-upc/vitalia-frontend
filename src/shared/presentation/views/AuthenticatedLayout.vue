<script setup>
import { computed } from "vue";
import { useAuthStore } from "../../application/auth-store.js";
import AdminLayout from "./AdminLayout.vue";
import DoctorLayout from "./DoctorLayout.vue";
import PatientLayout from "./PatientLayout.vue";

const authStore = useAuthStore();

const layoutComponent = computed(() => {
  if (authStore.currentUserRole === "doctor") return DoctorLayout;
  if (authStore.currentUserRole === "patient") return PatientLayout;
  return AdminLayout;
});
</script>

<template>
  <component :is="layoutComponent" />
</template>
