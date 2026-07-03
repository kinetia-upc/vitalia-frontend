<script setup>
import { computed } from "vue";
import { useAuthStore } from "../../application/auth-store.js";
import DoctorOrdersView from "../../../modules/clinical/presentation/views/DoctorOrdersView.vue";
import PatientPrescriptionsView from "../../../modules/clinical/presentation/views/PatientPrescriptionsView.vue";

const authStore = useAuthStore();
const component = computed(() => authStore.currentUserRole === "doctor" ? DoctorOrdersView : PatientPrescriptionsView);
</script>

<template>
  <component :is="component" />
</template>
