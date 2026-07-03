<script setup>
import { computed } from "vue";
import { useAuthStore } from "../../application/auth-store.js";
import DoctorPatientsView from "../../../modules/clinical/presentation/views/DoctorPatientsView.vue";
import PatientHistoryView from "../../../modules/clinical/presentation/views/PatientHistoryView.vue";

const authStore = useAuthStore();
const component = computed(() => authStore.currentUserRole === "doctor" ? DoctorPatientsView : PatientHistoryView);
</script>

<template>
  <component :is="component" />
</template>
